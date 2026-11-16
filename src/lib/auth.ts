import { cookies } from 'next/headers';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type UserRole = 'user' | 'admin';

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
};

function dataDir() {
  if (process.env.VERCEL) return path.join('/tmp', 'aivora-data');
  return path.join(process.cwd(), 'data');
}
const USERS_FILE = path.join(dataDir(), 'users.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'aivora-dev-secret-change-me-in-production-2026';
const COOKIE_NAME = 'aivora_session';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@aivora.example')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function ensureUsersFile() {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf-8');
}

export function readUsers(): User[] {
  ensureUsersFile();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeUsers(users: User[]) {
  ensureUsersFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
}

export function findUserByEmail(email: string): User | undefined {
  return readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  return readUsers().find((u) => u.id === id);
}

export function createUser(email: string, password: string, name: string): User {
  const users = readUsers();
  const role: UserRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';
  const user: User = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return user;
}

function sign(value: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}

export async function setSessionCookie(userId: string) {
  const sig = sign(userId);
  const token = `${userId}.${sig}`;
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<Omit<User, 'passwordHash'> | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [userId, sig] = token.split('.');
  if (!userId || !sig || sign(userId) !== sig) return null;
  const user = findUserById(userId);
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function requireUser(): Promise<Omit<User, 'passwordHash'>> {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireAdmin(): Promise<Omit<User, 'passwordHash'>> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') throw new Error('UNAUTHORIZED_ADMIN');
  return user;
}

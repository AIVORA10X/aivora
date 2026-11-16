import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'نام، ایمیل و رمز عبور الزامی هستند.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'رمز عبور حداقل ۶ کاراکتر باشد.' }, { status: 400 });
    }

    if (findUserByEmail(email)) {
      return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده است.' }, { status: 409 });
    }

    const user = createUser(email, password, name);
    await setSessionCookie(user.id);
    const { passwordHash, ...safe } = user;
    return NextResponse.json({ user: safe }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'خطای سرور. دوباره تلاش کنید.' }, { status: 500 });
  }
}

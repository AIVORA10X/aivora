import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AIVORA | فروشگاه ابزارهای هوش مصنوعی',
  description: 'مرجع فارسی معرفی و تهیه قانونی ابزارهای هوش مصنوعی با شفافیت کامل',
  keywords: ['هوش مصنوعی', 'AI', 'ChatGPT', 'Grok', 'Gemini', 'ابزار هوش مصنوعی'],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}

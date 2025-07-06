import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { Toaster } from '@/shared/ui';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'StoryPath - 당신의 하루가 소설이 됩니다',
  description: '구글 타임라인의 이동 경로를 바탕으로 AI가 만들어주는 나만의 이야기',
  keywords: ['AI 소설', '구글 타임라인', '개인화 스토리', '이동 경로', '일상 기록'],
  openGraph: {
    title: 'StoryPath',
    description: '구글 타임라인의 이동 경로를 바탕으로 AI가 만들어주는 나만의 이야기',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "과일 맞추기 - 프리미엄 카드 게임",
  description: "Next.js로 만든 세련된 과일 카드 짝맞추기 게임",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

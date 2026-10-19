import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "지역 관광 수요 Dashboard",
  description: "AI 기반 지역 관광 수요 및 관광 인프라 탐색 Dashboard (Chapter 14-2)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CF珠宝管理系统",
  description: "Jewelry & Gold Sales Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}

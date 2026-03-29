import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "乾坤金策",
  description: "以六爻问市、借天机断股的移动优先网页版应用。",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}

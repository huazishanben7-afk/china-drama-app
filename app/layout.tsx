import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "中国ドラマ コンシェルジュ | AIがおすすめ作品を診断",
  description: "「次に見るドラマが決まらない…」を解決！今の気分を入力するだけで、1万記事のデータからAIがあなたにぴったりの中国ドラマを厳選して提案します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
{/* ★ここに貼り付け！ */}
        {/* Cloudflare Analytics */}
        <Script
          defer
          src='https://static.cloudflareinsights.com/beacon.min.js'
          data-cf-beacon='{"token": "9edd9e885a264ca098da69a12cf0e201"}'
        />
      </body>
    </html>
  );
}

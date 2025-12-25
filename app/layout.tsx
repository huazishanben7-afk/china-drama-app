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
  title: "中国ドラマ コンシェルジュ | おすすめ作品を診断",
  description: "「次に見るドラマが決まらない…」を解決！診断ガチャで新しいドラマに出会えます！",

  icons: {
    icon: '/apple-icon.png',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    title: '中国ドラマ',
    statusBarStyle: 'default',
  },
  // SEO Canonical設定
  metadataBase: new URL('https://china-drama-app.pages.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "中国ドラマ コンシェルジュ | おすすめ作品を診断",
    description: "「次に見るドラマが決まらない…」を解決！診断ガチャで新しいドラマに出会えます！",
    url: 'https://china-drama-app.pages.dev',
    siteName: '中国ドラマ コンシェルジュ',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "中国ドラマ コンシェルジュ | おすすめ作品を診断",
    description: "「次に見るドラマが決まらない…」を解決！診断ガチャで新しいドラマに出会えます！",
  },
  verification: {
    google: '74X2Fd8viuJOSKc6371y3aA21rb8OvxHTc9YG7TxIu0',
  },
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

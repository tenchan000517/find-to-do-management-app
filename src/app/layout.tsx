import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import SessionProvider from "@/components/SessionProvider";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "FIND to DO - プロジェクト管理アプリ",
  description: "タスク管理、プロジェクト管理、人脈管理を統合したアプリケーション",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FIND to DO",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FIND to DO" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <Header />
          {children}
        </SessionProvider>
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            className: '',
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e5e7eb'
            },
            success: {
              duration: 3000,
              style: {
                background: '#f0fdf4',
                border: '1px solid #22c55e',
                color: '#15803d'
              },
              iconTheme: {
                primary: '#22c55e',
                secondary: '#f0fdf4'
              }
            },
            error: {
              duration: 5000,
              style: {
                background: '#fef2f2',
                border: '1px solid #ef4444',
                color: '#dc2626'
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fef2f2'
              }
            },
            loading: {
              style: {
                background: '#f8fafc',
                border: '1px solid #3b82f6',
                color: '#1e40af'
              },
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#f8fafc'
              }
            }
          }}
        />
      </body>
    </html>
  );
}

import { Metadata } from 'next';
import MobileLayout from '@/components/mobile/layout/MobileLayout';

export const metadata: Metadata = {
  title: 'FIND Mobile - タスク管理',
  description: 'Find To Do Management App - モバイル版',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FIND Mobile',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
};

export default function MobileRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileLayout>{children}</MobileLayout>;
}
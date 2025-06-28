"use client";
import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, CheckSquare, Calendar, Settings, Menu, Download, X } from 'lucide-react';

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // PWA Install prompt handler
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Online/Offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial online status
    setIsOnline(navigator.onLine);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const navigationItems = [
    {
      icon: Home,
      label: 'ホーム',
      href: '/mobile/dashboard'
    },
    {
      icon: CheckSquare,
      label: 'タスク',
      href: '/mobile/tasks'
    },
    {
      icon: Calendar,
      label: 'カレンダー',
      href: '/mobile/calendar'
    },
    {
      icon: Settings,
      label: '設定',
      href: '/mobile/settings'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Menu className="w-6 h-6 text-gray-600" />
              <h1 className="text-lg font-semibold text-gray-900">FIND Mobile</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-600">{isOnline ? 'オンライン' : 'オフライン'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-4 h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center justify-center space-y-1 transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* PWA Install Prompt (Phase A完成後に実装) */}
      <div id="pwa-install-prompt" className="hidden fixed bottom-20 left-4 right-4 z-40">
        <div className="bg-blue-600 text-white rounded-lg p-4 shadow-lg">
          <p className="text-sm font-medium">アプリをインストールしますか？</p>
          <p className="text-xs opacity-90 mt-1">ホーム画面からすぐにアクセスできます</p>
          <div className="flex space-x-3 mt-3">
            <button className="text-xs bg-white text-blue-600 px-3 py-1 rounded font-medium">
              インストール
            </button>
            <button className="text-xs text-blue-100 px-3 py-1 rounded">
              後で
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
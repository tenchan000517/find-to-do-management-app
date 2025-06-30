"use client";
import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, CheckSquare, Calendar, Settings, Menu, Download, X, Accessibility, ZoomIn, ZoomOut } from 'lucide-react';
import { useMobileAccessibility } from '@/hooks/useMobileAccessibility';

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showAccessibilityBar, setShowAccessibilityBar] = useState(false);
  
  const {
    settings,
    adjustFontSize,
    toggleOneHandMode,
    toggleHighContrast,
    getAccessibilityClasses,
    reachableHeight
  } = useMobileAccessibility();

  useEffect(() => {
    if (typeof window === 'undefined') return;

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
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    // Register service worker
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
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
      label: 'プロジェクト',
      href: '/mobile/projects'
    },
    {
      icon: Settings,
      label: '設定',
      href: '/mobile/settings'
    }
  ];

  return (
    <div className={`min-h-screen bg-gray-50 pb-20 ${getAccessibilityClasses()}`} 
         style={{ 
           fontSize: 'var(--mobile-font-size, 16px)',
           ['--reachable-height' as any]: `${reachableHeight}px`
         }}>
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Menu className="w-6 h-6 text-gray-600" />
              <h1 className="text-lg font-semibold text-gray-900">FIND Mobile</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowAccessibilityBar(!showAccessibilityBar)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="アクセシビリティ設定"
              >
                <Accessibility className="w-5 h-5 text-gray-600" />
              </button>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-600">{isOnline ? 'オンライン' : 'オフライン'}</span>
            </div>
          </div>
        </div>
        
        {/* Accessibility Control Bar */}
        {showAccessibilityBar && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => adjustFontSize('decrease')}
                  className="p-2 bg-white rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                  aria-label="フォントサイズを小さく"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-600 min-w-0 flex-shrink-0">
                  {settings.fontSize}
                </span>
                <button
                  onClick={() => adjustFontSize('increase')}
                  className="p-2 bg-white rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                  aria-label="フォントサイズを大きく"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleOneHandMode}
                  className={`px-3 py-1 rounded-md text-xs transition-colors ${
                    settings.oneHandMode
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  片手
                </button>
                <button
                  onClick={toggleHighContrast}
                  className={`px-3 py-1 rounded-md text-xs transition-colors ${
                    settings.highContrast
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  高コントラスト
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed left-0 right-0 bg-white border-t border-gray-200 z-50 ${
        settings.oneHandMode ? 'bottom-8' : 'bottom-0'
      }`}>
        <div className={`grid grid-cols-4 ${settings.oneHandMode ? 'h-20' : 'h-16'}`}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center justify-center space-y-1 transition-all text-gray-600 hover:text-gray-900 hover:bg-gray-50 ${
                  settings.oneHandMode ? 'p-3' : 'p-2'
                }`}
              >
                <Icon className={`${settings.oneHandMode ? 'w-6 h-6' : 'w-5 h-5'}`} />
                <span className={`font-medium ${settings.oneHandMode ? 'text-sm' : 'text-xs'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* One-hand mode helper bar */}
      {settings.oneHandMode && (
        <div className="fixed bottom-0 left-0 right-0 h-8 bg-blue-100 border-t border-blue-200 z-40">
          <div className="flex items-center justify-center h-full">
            <div className="w-12 h-1 bg-blue-400 rounded-full opacity-50"></div>
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <div className="bg-blue-600 text-white rounded-lg p-4 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <p className="text-sm font-medium">アプリをインストール</p>
              </div>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-blue-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs opacity-90 mb-3">ホーム画面からすぐにアクセスできます</p>
            <div className="flex space-x-3">
              <button
                onClick={handleInstallClick}
                className="text-xs bg-white text-blue-600 px-3 py-2 rounded font-medium hover:bg-blue-50"
              >
                インストール
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-xs text-blue-100 px-3 py-2 rounded hover:text-white"
              >
                後で
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
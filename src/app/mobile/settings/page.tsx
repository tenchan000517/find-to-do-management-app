"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MobileLayout from '@/components/mobile/layout/MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectOption } from '@/components/ui/Select';
import { 
  ArrowLeft,
  User,
  Bell,
  Smartphone,
  Moon,
  Globe,
  Volume2,
  Vibrate,
  Download,
  Shield,
  HelpCircle,
  ExternalLink,
  LogOut
} from 'lucide-react';

interface MobileSettings {
  notifications: {
    enabled: boolean;
    taskReminders: boolean;
    projectUpdates: boolean;
    sound: boolean;
    vibration: boolean;
  };
  display: {
    darkMode: boolean;
    language: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  gestures: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    hapticFeedback: boolean;
  };
  voice: {
    enabled: boolean;
    language: string;
    voiceType: 'female' | 'male' | 'system';
    speechRate: number;
  };
  pwa: {
    installPromptShown: boolean;
    offlineMode: boolean;
    autoSync: boolean;
  };
}

export default function MobileSettings() {
  const router = useRouter();
  const { data: session } = useSession();
  const [settings, setSettings] = useState<MobileSettings>({
    notifications: {
      enabled: true,
      taskReminders: true,
      projectUpdates: true,
      sound: true,
      vibration: true
    },
    display: {
      darkMode: false,
      language: 'ja',
      fontSize: 'medium'
    },
    gestures: {
      enabled: true,
      sensitivity: 'medium',
      hapticFeedback: true
    },
    voice: {
      enabled: false,
      language: 'ja-JP',
      voiceType: 'female',
      speechRate: 1.0
    },
    pwa: {
      installPromptShown: false,
      offlineMode: true,
      autoSync: true
    }
  });

  const [isOnline, setIsOnline] = useState(true);
  const [storageUsage, setStorageUsage] = useState<{ used: number; total: number } | null>(null);

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return;

    // Load settings from localStorage
    const savedSettings = localStorage.getItem('mobileSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        
        // Apply dark mode immediately
        if (parsed.display.darkMode) {
          document.documentElement.classList.add('dark');
        }
      } catch (error) {
        console.error('設定の読み込みエラー:', error);
      }
    }

    // Check online status
    setIsOnline(navigator.onLine);
    const handleOnlineChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);

    // Check storage usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        setStorageUsage({
          used: Math.round((estimate.usage || 0) / 1024 / 1024 * 100) / 100,
          total: Math.round((estimate.quota || 0) / 1024 / 1024 * 100) / 100
        });
      });
    }

    return () => {
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
    };
  }, []);

  const updateSettings = (newSettings: Partial<MobileSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobileSettings', JSON.stringify(updatedSettings));
      applySettings(updatedSettings);
    }
  };

  const applySettings = (settings: MobileSettings) => {
    if (typeof window === 'undefined') return;

    // Dark mode
    if (settings.display.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Font size
    document.documentElement.style.fontSize = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }[settings.display.fontSize];

    // Update CSS variables for theming
    const root = document.documentElement;
    if (settings.display.darkMode) {
      root.style.setProperty('--mobile-bg-primary', '#1a1a1a');
      root.style.setProperty('--mobile-bg-secondary', '#2d2d2d');
      root.style.setProperty('--mobile-text-primary', '#ffffff');
      root.style.setProperty('--mobile-text-secondary', '#cccccc');
      root.style.setProperty('--mobile-border-color', '#404040');
    } else {
      root.style.setProperty('--mobile-bg-primary', '#ffffff');
      root.style.setProperty('--mobile-bg-secondary', '#f8f9fa');
      root.style.setProperty('--mobile-text-primary', '#1a1a1a');
      root.style.setProperty('--mobile-text-secondary', '#6b7280');
      root.style.setProperty('--mobile-border-color', '#e5e7eb');
    }

    // Notify other components of settings changes
    window.dispatchEvent(new CustomEvent('mobileSettingsChanged', { 
      detail: settings 
    }));
  };

  const testVibration = () => {
    if (!settings.notifications.vibration) return;
    
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      // テスト用のバイブレーションパターン
      navigator.vibrate([100, 50, 100, 50, 200]);
    } else {
      console.log('このデバイスではバイブレーションはサポートされていません');
    }
  };

  const handleInstallPWA = () => {
    // PWA install logic would be handled by the parent app
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('installPWA'));
    }
  };

  const handleClearCache = async () => {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear IndexedDB data
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const deleteDB = indexedDB.deleteDatabase('mobileTasksDB');
        deleteDB.onsuccess = () => {
          console.log('キャッシュをクリアしました');
        };
      }
      
      alert('キャッシュをクリアしました');
    } catch (error) {
      console.error('キャッシュクリアエラー:', error);
      alert('キャッシュのクリアに失敗しました');
    }
  };

  const handleExportData = () => {
    // Export user data logic
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('exportUserData'));
    }
  };

  const settingSections = [
    {
      title: '通知設定',
      icon: <Bell className="w-5 h-5" />,
      items: [
        {
          label: '通知を有効にする',
          type: 'switch' as const,
          value: settings.notifications.enabled,
          onChange: (enabled: boolean) => updateSettings({
            notifications: { ...settings.notifications, enabled }
          })
        },
        {
          label: 'タスクリマインダー',
          type: 'switch',
          value: settings.notifications.taskReminders,
          onChange: (taskReminders: boolean) => updateSettings({
            notifications: { ...settings.notifications, taskReminders }
          }),
          disabled: !settings.notifications.enabled
        },
        {
          label: 'プロジェクト更新通知',
          type: 'switch',
          value: settings.notifications.projectUpdates,
          onChange: (projectUpdates: boolean) => updateSettings({
            notifications: { ...settings.notifications, projectUpdates }
          }),
          disabled: !settings.notifications.enabled
        },
        {
          label: '通知音',
          type: 'switch',
          value: settings.notifications.sound,
          onChange: (sound: boolean) => updateSettings({
            notifications: { ...settings.notifications, sound }
          }),
          disabled: !settings.notifications.enabled
        },
        {
          label: 'バイブレーション',
          type: 'switch',
          value: settings.notifications.vibration,
          onChange: (vibration: boolean) => updateSettings({
            notifications: { ...settings.notifications, vibration }
          }),
          disabled: !settings.notifications.enabled,
          action: settings.notifications.vibration ? {
            label: 'テスト',
            onClick: testVibration
          } : undefined
        }
      ]
    },
    {
      title: '表示設定',
      icon: <Smartphone className="w-5 h-5" />,
      items: [
        {
          label: 'ダークモード',
          type: 'switch',
          value: settings.display.darkMode,
          onChange: (darkMode: boolean) => updateSettings({
            display: { ...settings.display, darkMode }
          })
        },
        {
          label: '言語',
          type: 'select',
          value: settings.display.language,
          options: [
            { value: 'ja', label: '日本語' },
            { value: 'en', label: 'English' }
          ],
          onChange: (language: string) => updateSettings({
            display: { ...settings.display, language }
          })
        },
        {
          label: 'フォントサイズ',
          type: 'select',
          value: settings.display.fontSize,
          options: [
            { value: 'small', label: '小' },
            { value: 'medium', label: '中' },
            { value: 'large', label: '大' }
          ],
          onChange: (fontSize: 'small' | 'medium' | 'large') => updateSettings({
            display: { ...settings.display, fontSize }
          })
        }
      ]
    },
    {
      title: 'ジェスチャー設定',
      icon: <Vibrate className="w-5 h-5" />,
      items: [
        {
          label: 'ジェスチャー操作',
          type: 'switch',
          value: settings.gestures.enabled,
          onChange: (enabled: boolean) => updateSettings({
            gestures: { ...settings.gestures, enabled }
          })
        },
        {
          label: '感度',
          type: 'select',
          value: settings.gestures.sensitivity,
          options: [
            { value: 'low', label: '低' },
            { value: 'medium', label: '中' },
            { value: 'high', label: '高' }
          ],
          onChange: (sensitivity: 'low' | 'medium' | 'high') => updateSettings({
            gestures: { ...settings.gestures, sensitivity }
          }),
          disabled: !settings.gestures.enabled
        },
        {
          label: '触覚フィードバック',
          type: 'switch',
          value: settings.gestures.hapticFeedback,
          onChange: (hapticFeedback: boolean) => updateSettings({
            gestures: { ...settings.gestures, hapticFeedback }
          }),
          disabled: !settings.gestures.enabled
        }
      ]
    },
    {
      title: '音声設定',
      icon: <Volume2 className="w-5 h-5" />,
      items: [
        {
          label: '音声機能',
          type: 'switch',
          value: settings.voice.enabled,
          onChange: (enabled: boolean) => updateSettings({
            voice: { ...settings.voice, enabled }
          })
        },
        {
          label: '音声言語',
          type: 'select',
          value: settings.voice.language,
          options: [
            { value: 'ja-JP', label: '日本語' },
            { value: 'en-US', label: 'English (US)' }
          ],
          onChange: (language: string) => updateSettings({
            voice: { ...settings.voice, language }
          }),
          disabled: !settings.voice.enabled
        },
        {
          label: '音声タイプ',
          type: 'select',
          value: settings.voice.voiceType,
          options: [
            { value: 'female', label: '女性' },
            { value: 'male', label: '男性' },
            { value: 'system', label: 'システム' }
          ],
          onChange: (voiceType: 'female' | 'male' | 'system') => updateSettings({
            voice: { ...settings.voice, voiceType }
          }),
          disabled: !settings.voice.enabled
        }
      ]
    }
  ];

  return (
    <MobileLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => router.back()}
            variant="ghost" 
            size="sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-bold">設定</h1>
        </div>

        {/* User Info */}
        {session && (
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{session.user?.name || 'ユーザー'}</p>
                <p className="text-sm text-gray-600">{session.user?.email}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isOnline ? 'オンライン' : 'オフライン'}
              </span>
            </div>
          </Card>
          
          {storageUsage && (
            <Card className="p-3">
              <div className="text-sm">
                <p className="font-medium">ストレージ</p>
                <p className="text-gray-600">
                  {storageUsage.used}MB / {storageUsage.total}MB
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Settings Sections */}
        {settingSections.map((section) => (
          <Card key={section.title} className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              {section.icon}
              <h2 className="text-lg font-semibold">{section.title}</h2>
            </div>
            
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <label className={`text-sm ${'disabled' in item && item.disabled ? 'text-gray-400' : ''}`}>
                    {item.label}
                  </label>
                  
                  {item.type === 'switch' && (
                    <Switch
                      checked={item.value as boolean}
                      onCheckedChange={item.onChange as (checked: boolean) => void}
                      disabled={'disabled' in item ? item.disabled : false}
                    />
                  )}
                  
                  {item.type === 'select' && (
                    <Select
                      value={item.value as string}
                      onChange={(e) => (item.onChange as (value: string) => void)(e.target.value)}
                      disabled={'disabled' in item ? item.disabled : false}
                      className="w-32"
                      fullWidth={false}
                    >
                      {(item as any).options?.map((option: any) => (
                        <SelectOption key={option.value} value={option.value}>
                          {option.label}
                        </SelectOption>
                      ))}
                    </Select>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}

        {/* PWA Settings */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Download className="w-5 h-5" />
            <h2 className="text-lg font-semibold">アプリ設定</h2>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleInstallPWA}
              className="w-full"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              アプリとしてインストール
            </Button>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">オフライン機能</label>
              <Switch
                checked={settings.pwa.offlineMode}
                onCheckedChange={(offlineMode) => updateSettings({
                  pwa: { ...settings.pwa, offlineMode }
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">自動同期</label>
              <Switch
                checked={settings.pwa.autoSync}
                onCheckedChange={(autoSync) => updateSettings({
                  pwa: { ...settings.pwa, autoSync }
                })}
              />
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5" />
            <h2 className="text-lg font-semibold">データ管理</h2>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleExportData}
              className="w-full"
              variant="outline"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              データをエクスポート
            </Button>
            
            <Button 
              onClick={handleClearCache}
              className="w-full"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              キャッシュをクリア
            </Button>
          </div>
        </Card>

        {/* Help & Support */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <HelpCircle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">ヘルプ・サポート</h2>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/mobile/help')}
              className="w-full"
              variant="outline"
            >
              使い方ガイド
            </Button>
            
            <Button 
              onClick={() => router.push('/mobile/feedback')}
              className="w-full"
              variant="outline"
            >
              フィードバック送信
            </Button>
          </div>
        </Card>

        {/* Logout */}
        {session && (
          <Card className="p-4">
            <Button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('signOut'));
                }
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
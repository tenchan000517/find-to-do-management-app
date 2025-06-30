import { useAuth } from '@/lib/auth/client';
import { 
  DEMO_TASKS, 
  DEMO_EVENTS, 
  DEMO_USER_PREFERENCES,
  DEMO_PROJECTS,
  DEMO_USER,
  DEMO_STATISTICS,
  DEMO_PRODUCTIVITY_INSIGHTS
} from '@/lib/demo/demo-data';

/**
 * デモモード管理用カスタムフック
 * 未ログイン時に自動予定生成機能を体験できるデモデータを提供
 */
export function useDemoMode() {
  const { isAuthenticated, user } = useAuth();
  
  const isDemoMode = !isAuthenticated || !user;
  
  return {
    isDemoMode,
    demoTasks: isDemoMode ? DEMO_TASKS : [],
    demoEvents: isDemoMode ? DEMO_EVENTS : [],
    demoPreferences: isDemoMode ? DEMO_USER_PREFERENCES : null,
    demoProjects: isDemoMode ? DEMO_PROJECTS : [],
    demoUser: isDemoMode ? DEMO_USER : null,
    demoStatistics: isDemoMode ? DEMO_STATISTICS : null,
    demoInsights: isDemoMode ? DEMO_PRODUCTIVITY_INSIGHTS : null,
    
    // ユーティリティ関数
    getDemoMessage: () => isDemoMode 
      ? 'デモモード: サンプルデータで機能をお試しください' 
      : null,
      
    getDemoWarning: () => isDemoMode
      ? 'このデータはサンプルです。ログインすると実際のデータで最適化できます。'
      : null,
      
    // デモデータとリアルデータの切り替え
    getTasksWithDemo: (realTasks: any[]) => {
      if (isDemoMode || !realTasks || realTasks.length === 0) {
        return DEMO_TASKS;
      }
      return realTasks;
    },
    
    getEventsWithDemo: (realEvents: any[]) => {
      if (isDemoMode || !realEvents || realEvents.length === 0) {
        return DEMO_EVENTS;
      }
      return realEvents;
    },
    
    getPreferencesWithDemo: (realPreferences: any) => {
      if (isDemoMode || !realPreferences) {
        return DEMO_USER_PREFERENCES;
      }
      return realPreferences;
    },
    
    // デモモード専用のアクション
    handleDemoAction: (actionName: string) => {
      if (isDemoMode) {
        console.log(`[Demo Mode] Action: ${actionName}`);
        // デモモードでは実際のデータ変更を行わない
        return {
          success: true,
          message: 'デモモードでは実際のデータは変更されません',
          demo: true
        };
      }
      return null;
    }
  };
}

/**
 * デモモード表示用のメッセージコンポーネントのprops型
 */
export interface DemoModeMessageProps {
  variant?: 'info' | 'warning' | 'inline';
  showLoginPrompt?: boolean;
  className?: string;
}
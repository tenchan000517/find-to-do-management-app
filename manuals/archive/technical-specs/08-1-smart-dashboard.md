# スマートダッシュボード機能 マニュアル

## 概要

スマートダッシュボードは、AI機能を活用してユーザーの生産性を最大化する次世代ダッシュボードです。従来の情報表示機能に加え、**ゼロクリック操作**、**AI提案**、**音声入力**などの革新的機能を提供します。

### 主要特徴
- **AI駆動の今日すべきこと提示**
- **音声入力によるタスク作成**
- **自動スケジュール生成**
- **リアルタイム生産性スコア**
- **ゼロクリック操作**

---

## 目次

1. [基本アーキテクチャ](#基本アーキテクチャ)
2. [AI機能](#ai機能)
3. [ゼロクリック操作](#ゼロクリック操作)
4. [生産性分析](#生産性分析)
5. [音声入力システム](#音声入力システム)
6. [自動スケジュール生成](#自動スケジュール生成)
7. [実装例](#実装例)
8. [カスタマイズ](#カスタマイズ)
9. [トラブルシューティング](#トラブルシューティング)

---

## 基本アーキテクチャ

### コンポーネント構造

```javascript
// SmartDashboard.tsx の基本構造
export default function SmartDashboard({ showAdvancedFeatures = false, onAdvancedToggle }) {
  // データフック
  const { tasks, loading: tasksLoading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { events, loading: eventsLoading } = useCalendarEvents();
  
  // AI分析結果のステート
  const [todayEssentials, setTodayEssentials] = useState(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* メインスマートカード */}
      <SmartCard todayEssentials={todayEssentials} />
      
      {/* 高度な機能（条件付き表示） */}
      {showAdvancedFeatures && <AdvancedFeatures />}
    </div>
  );
}
```

### データ統合パターン

```javascript
// 複数データソースの統合処理
useEffect(() => {
  if (tasksLoading || projectsLoading || appointmentsLoading || eventsLoading) return;

  const today = new Date();
  const todayString = today.toDateString();
  
  // 緊急タスクの抽出
  const urgentTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const isToday = dueDate.toDateString() === todayString;
    const isOverdue = dueDate < today && task.status !== 'COMPLETE';
    const isHighPriority = task.priority === 'A' || task.priority === 'B';
    
    return (isToday || isOverdue) && isHighPriority && task.status !== 'COMPLETE';
  });
  
  // AI分析処理
  const aiAnalysis = generateAISuggestion(urgentTasks, todayEvents);
  setTodayEssentials(aiAnalysis);
}, [tasks, projects, appointments, events]);
```

---

## AI機能

### 今日すべきこと分析

スマートダッシュボードの中核となるAI機能です。

```javascript
// AI分析エンジン
const generateAISuggestion = (urgentTasks, todayEvents) => {
  // 優先度計算アルゴリズム
  let aiSuggestion = {
    action: "今日のタスクを確認しましょう",
    reasoning: "優先度の高いタスクから開始することをお勧めします",
    estimatedTime: "30分"
  };

  if (urgentTasks.length > 0) {
    aiSuggestion = {
      action: `「${urgentTasks[0].title}」から開始`,
      reasoning: "最も緊急度の高いタスクです",
      estimatedTime: calculateEstimatedTime(urgentTasks[0])
    };
  } else if (todayEvents.length > 0) {
    aiSuggestion = {
      action: `次の会議「${todayEvents[0].title}」の準備`,
      reasoning: "今日の重要な予定に備えましょう",
      estimatedTime: "15-30分"
    };
  }
  
  return aiSuggestion;
};
```

### 生産性スコア計算

```javascript
// リアルタイム生産性分析
const calculateProductivityScore = (tasks, completedToday) => {
  const baseScore = completedToday * 25;
  const bonusScore = urgentItems.length === 0 ? 20 : 0;
  const finalScore = Math.min(100, baseScore + bonusScore);
  
  const productivity = {
    score: finalScore,
    trend: (completedToday > 2 ? 'up' : completedToday > 0 ? 'stable' : 'down'),
    message: generateProductivityMessage(completedToday)
  };
  
  return productivity;
};

const generateProductivityMessage = (completedCount) => {
  if (completedCount > 2) return '素晴らしい進捗です！';
  if (completedCount > 0) return '順調にタスクを進めています';
  return '今日のタスクを開始しましょう';
};
```

---

## ゼロクリック操作

### 音声タスク作成

```javascript
// 音声入力ハンドラー
const handleVoiceInput = async () => {
  setIsVoiceRecording(true);
  
  try {
    // Web Speech API の利用（実装時）
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      processVoiceCommand(transcript);
    };
    
    recognition.start();
    
    // フォールバック処理
    setTimeout(() => {
      setIsVoiceRecording(false);
      if (isVoiceRecording) {
        alert('音声入力機能は開発中です。「明日までにA社の資料作成」のような形で話してください。');
      }
    }, 2000);
  } catch (error) {
    console.error('音声認識エラー:', error);
    setIsVoiceRecording(false);
  }
};

// 音声コマンド処理
const processVoiceCommand = async (transcript) => {
  // AI解析でタスクを自動生成
  const taskData = await analyzeVoiceCommand(transcript);
  
  if (taskData) {
    await createTaskFromVoice(taskData);
    showNotification('音声からタスクを作成しました');
  }
};
```

### ボタンコンポーネント

```javascript
// 音声入力ボタン
<Button
  onClick={handleVoiceInput}
  disabled={isVoiceRecording}
  className="flex items-center justify-center gap-3 h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg"
>
  <Mic className={`w-5 h-5 ${isVoiceRecording ? 'animate-pulse' : ''}`} />
  <div className="text-left">
    <div className="font-semibold">
      {isVoiceRecording ? '音声を認識中...' : '話すだけでタスク作成'}
    </div>
    <div className="text-sm opacity-90">
      「明日までにA社の資料作成」
    </div>
  </div>
</Button>
```

---

## 生産性分析

### リアルタイム分析

```javascript
// 生産性追跡システム
const ProductivityTracker = {
  // 本日完了タスク数の算出
  getTodayCompletedTasks: (tasks) => {
    const today = new Date().toDateString();
    return tasks.filter(task => {
      if (task.status !== 'COMPLETE') return false;
      const updatedDate = new Date(task.updatedAt);
      return updatedDate.toDateString() === today;
    });
  },
  
  // 効率性指標の計算
  calculateEfficiency: (completedTasks, totalTimeSpent) => {
    const avgTimePerTask = totalTimeSpent / completedTasks.length;
    const efficiencyScore = Math.max(0, 100 - (avgTimePerTask - 30) * 2);
    return Math.round(efficiencyScore);
  },
  
  // トレンド分析
  analyzeTrend: (recentData) => {
    const weeklyAverage = recentData.slice(-7).reduce((sum, day) => sum + day.score, 0) / 7;
    const previousWeekAverage = recentData.slice(-14, -7).reduce((sum, day) => sum + day.score, 0) / 7;
    
    if (weeklyAverage > previousWeekAverage * 1.1) return 'up';
    if (weeklyAverage < previousWeekAverage * 0.9) return 'down';
    return 'stable';
  }
};
```

### 視覚的フィードバック

```javascript
// 生産性インジケーター
const ProductivityIndicator = ({ productivity }) => (
  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
    productivity.trend === 'up' ? 'bg-green-100 text-green-700' :
    productivity.trend === 'stable' ? 'bg-blue-100 text-blue-700' :
    'bg-gray-100 text-gray-700'
  }`}>
    <div className="flex items-center gap-2">
      <TrendIcon trend={productivity.trend} />
      <span>{productivity.message}</span>
      <span className="font-bold">{productivity.score}%</span>
    </div>
  </div>
);
```

---

## 音声入力システム

### Web Speech API統合

```javascript
// 音声認識セットアップ
const setupSpeechRecognition = () => {
  if (!('webkitSpeechRecognition' in window)) {
    console.warn('このブラウザは音声認識をサポートしていません');
    return null;
  }
  
  const recognition = new window.webkitSpeechRecognition();
  
  // 設定
  recognition.lang = 'ja-JP';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  // イベントハンドラー
  recognition.onstart = () => {
    console.log('音声認識開始');
    setIsVoiceRecording(true);
  };
  
  recognition.onend = () => {
    console.log('音声認識終了');
    setIsVoiceRecording(false);
  };
  
  recognition.onerror = (event) => {
    console.error('音声認識エラー:', event.error);
    setIsVoiceRecording(false);
    handleSpeechError(event.error);
  };
  
  return recognition;
};
```

### 自然言語処理

```javascript
// 音声コマンド解析
const parseVoiceCommand = (transcript) => {
  const patterns = {
    // タスク作成パターン
    createTask: /(.+)までに(.+)/,
    // 期限指定パターン
    deadline: /(今日|明日|今週|来週|(\d+)日後)/,
    // 優先度パターン
    priority: /(重要|緊急|普通|低い)/
  };
  
  let taskData = {
    title: '',
    dueDate: null,
    priority: 'MEDIUM'
  };
  
  // パターンマッチング
  const taskMatch = transcript.match(patterns.createTask);
  if (taskMatch) {
    taskData.dueDate = parseDateFromText(taskMatch[1]);
    taskData.title = taskMatch[2];
  }
  
  // 優先度判定
  if (transcript.includes('重要') || transcript.includes('緊急')) {
    taskData.priority = 'HIGH';
  }
  
  return taskData;
};
```

---

## 自動スケジュール生成

### AI スケジューリング

```javascript
// 自動スケジュール生成エンジン
const AutoScheduler = {
  // 最適スケジュール生成
  generateOptimalSchedule: async (tasks, appointments, preferences) => {
    const availableSlots = calculateAvailableTimeSlots();
    const prioritizedTasks = sortTasksByPriority(tasks);
    
    const schedule = [];
    
    for (const task of prioritizedTasks) {
      const optimalSlot = findBestTimeSlot(task, availableSlots, preferences);
      if (optimalSlot) {
        schedule.push({
          task,
          startTime: optimalSlot.start,
          endTime: optimalSlot.end,
          confidence: optimalSlot.confidence
        });
        
        // 使用した時間帯を削除
        removeUsedSlot(availableSlots, optimalSlot);
      }
    }
    
    return schedule;
  },
  
  // 時間帯最適化
  findBestTimeSlot: (task, availableSlots, preferences) => {
    return availableSlots
      .map(slot => ({
        ...slot,
        confidence: calculateSlotConfidence(task, slot, preferences)
      }))
      .sort((a, b) => b.confidence - a.confidence)[0];
  }
};
```

### スケジュール実行

```javascript
// スケジュール生成ボタンハンドラー
const generateAutoSchedule = async () => {
  setAutoScheduleGenerated(true);
  
  try {
    // AI スケジューリング実行
    const schedule = await AutoScheduler.generateOptimalSchedule(
      tasks,
      appointments,
      userPreferences
    );
    
    // カレンダーに自動追加
    await bulkCreateCalendarEvents(schedule);
    
    // 成功通知
    showNotification('今日の最適スケジュールを生成しました！カレンダーで確認してください。');
    
    // 分析結果を更新
    updateTodayEssentials();
    
  } catch (error) {
    console.error('スケジュール生成エラー:', error);
    showErrorNotification('スケジュール生成に失敗しました。');
    setAutoScheduleGenerated(false);
  }
};
```

---

## 実装例

### 完全なコンポーネント例

```javascript
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Mic, Play, ChevronRight, Settings, Zap } from 'lucide-react';

const SmartDashboardExample = () => {
  const [todayEssentials, setTodayEssentials] = useState(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  
  // AI分析とデータ統合
  useEffect(() => {
    const analyzeToday = async () => {
      const analysis = await performAIAnalysis();
      setTodayEssentials(analysis);
    };
    
    analyzeToday();
  }, []);
  
  return (
    <Card variant="elevated" padding="normal" className="relative overflow-hidden">
      {/* AI Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
      
      <div className="relative">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Zap className="w-7 h-7 text-yellow-500" />
              今日すべきこと
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              AIが厳選した本日の重要タスク
            </p>
          </div>
        </div>
        
        {/* ゼロクリック操作 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <VoiceInputButton 
            isRecording={isVoiceRecording}
            onVoiceInput={handleVoiceInput}
          />
          <AutoScheduleButton 
            onGenerate={generateAutoSchedule}
          />
        </div>
        
        {/* AI提案 */}
        <AIRecommendation suggestion={todayEssentials?.aiSuggestion} />
      </div>
    </Card>
  );
};
```

---

## カスタマイズ

### テーマ設定

```javascript
// スマートダッシュボードテーマ
const smartDashboardThemes = {
  default: {
    primaryGradient: 'from-blue-500 to-purple-600',
    secondaryGradient: 'from-green-500 to-emerald-600',
    aiCardBg: 'from-blue-50 to-purple-50',
    urgentTaskBg: 'from-red-50 to-orange-50'
  },
  
  professional: {
    primaryGradient: 'from-slate-600 to-slate-800',
    secondaryGradient: 'from-blue-600 to-blue-800',
    aiCardBg: 'from-slate-50 to-blue-50',
    urgentTaskBg: 'from-orange-50 to-red-50'
  },
  
  energetic: {
    primaryGradient: 'from-pink-500 to-orange-500',
    secondaryGradient: 'from-purple-500 to-pink-500',
    aiCardBg: 'from-pink-50 to-orange-50',
    urgentTaskBg: 'from-red-50 to-pink-50'
  }
};
```

### 機能カスタマイズ

```javascript
// カスタマイズ可能な設定
const smartDashboardConfig = {
  // AI提案の頻度
  aiSuggestionFrequency: 'realtime', // 'realtime' | 'hourly' | 'daily'
  
  // 音声認識言語
  speechLanguage: 'ja-JP',
  
  // 生産性スコア計算方法
  productivityCalculation: 'weighted', // 'simple' | 'weighted' | 'ai'
  
  // 表示するタスク数
  maxUrgentTasks: 3,
  
  // 自動スケジュール設定
  autoSchedulePreferences: {
    workingHours: { start: 9, end: 18 },
    breakDuration: 15,
    taskMinDuration: 30
  }
};
```

---

## トラブルシューティング

### よくある問題と解決策

#### 1. 音声認識が動作しない

```javascript
// 音声認識対応チェック
const checkSpeechSupport = () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return {
      supported: false,
      message: 'このブラウザは音声認識をサポートしていません',
      alternatives: ['テキスト入力を使用', 'Chrome/Edgeブラウザを使用']
    };
  }
  
  return { supported: true };
};

// エラーハンドリング
const handleSpeechError = (error) => {
  const errorMessages = {
    'no-speech': '音声が検出されませんでした。もう一度お試しください。',
    'audio-capture': 'マイクへのアクセスが拒否されました。',
    'not-allowed': 'マイクの使用許可が必要です。',
    'network': 'ネットワークエラーが発生しました。'
  };
  
  const message = errorMessages[error] || '音声認識でエラーが発生しました。';
  showErrorNotification(message);
};
```

#### 2. AI分析が遅い

```javascript
// パフォーマンス最適化
const optimizeAIAnalysis = {
  // キャッシュ機能
  cacheAnalysis: (key, result) => {
    const cache = {
      timestamp: Date.now(),
      data: result,
      expiry: 5 * 60 * 1000 // 5分
    };
    localStorage.setItem(`ai_analysis_${key}`, JSON.stringify(cache));
  },
  
  // 並列処理
  performParallelAnalysis: async (tasks, appointments, events) => {
    const [urgentTasks, todayEvents, productivity] = await Promise.all([
      analyzeUrgentTasks(tasks),
      analyzeTodayEvents(events),
      calculateProductivity(tasks)
    ]);
    
    return { urgentTasks, todayEvents, productivity };
  }
};
```

#### 3. レスポンシブ表示の問題

```javascript
// レスポンシブ対応
const responsiveConfig = {
  // ブレークポイント別表示制御
  getLayoutConfig: (screenWidth) => {
    if (screenWidth < 768) {
      return {
        gridCols: 1,
        hideAdvanced: true,
        compactMode: true
      };
    } else if (screenWidth < 1024) {
      return {
        gridCols: 2,
        hideAdvanced: false,
        compactMode: false
      };
    } else {
      return {
        gridCols: 3,
        hideAdvanced: false,
        compactMode: false
      };
    }
  }
};
```

### デバッグ支援

```javascript
// デバッグ用ユーティリティ
const SmartDashboardDebug = {
  // AI分析結果の詳細ログ
  logAnalysisDetails: (analysis) => {
    console.group('🔍 Smart Dashboard AI Analysis');
    console.log('緊急タスク数:', analysis.urgentTasks.length);
    console.log('生産性スコア:', analysis.productivity.score);
    console.log('AI提案:', analysis.aiSuggestion.action);
    console.groupEnd();
  },
  
  // パフォーマンス計測
  measurePerformance: (operation, fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`⏱️ ${operation}: ${end - start}ms`);
    return result;
  }
};
```

---

このマニュアルは、スマートダッシュボードの包括的な実装ガイドです。AI機能とユーザビリティを両立させた次世代ダッシュボードの構築にご活用ください。
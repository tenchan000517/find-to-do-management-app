# モバイルモード Phase B: 高度機能 実装計画書

**フェーズ期間**: 2日間  
**実装日**: 2025年7月1日 〜 2025年7月2日  
**担当エンジニア**: AI・音声処理担当  
**前提条件**: Phase A完了、音声処理・AI統合の経験を有する

---

## 🎯 **Phase B 実装目標**

### **B.1 主要機能実装**
- **音声インターフェース**: 音声入力・出力・自然言語処理統合
- **AI予測UI**: ユーザー行動予測・自動画面変更・ゼロクリック操作
- **LINE Bot強化**: 感情認識・プロアクティブ機能・高度自然言語理解
- **アクセシビリティ**: 視覚・聴覚・運動障害対応・多言語サポート

### **B.2 技術要件**
- Google Gemini API活用・既存AI機能拡張
- Web Speech API・音声合成技術統合
- 機械学習による行動パターン分析
- リアルタイム感情・状況認識

---

## 📋 **Phase B 実装チェックリスト**

### **B.1 音声インターフェース実装 (0.7日)**
- [ ] Web Speech API統合・音声認識エンジン実装
- [ ] 自然言語処理・意図抽出ロジック実装
- [ ] 音声合成・多言語対応実装
- [ ] ノイズキャンセリング・音声品質向上

### **B.2 AI予測・自動化システム (0.8日)**
- [ ] ユーザー行動学習エンジン実装
- [ ] コンテキスト判定・画面自動変更実装
- [ ] プリディクティブUI・先回り機能実装
- [ ] ゼロクリック自動化ロジック実装

### **B.3 LINE Bot超知能化 (0.3日)**
- [ ] 既存LINE Bot機能拡張・感情認識追加
- [ ] プロアクティブメッセージング実装
- [ ] 高度自然言語理解・文脈把握強化
- [ ] グループチャット対応・マルチユーザー管理

### **B.4 アクセシビリティ・多言語対応 (0.2日)**
- [ ] スクリーンリーダー対応・ARIA属性実装
- [ ] 音声ナビゲーション・キーボード操作対応
- [ ] 大文字表示・高コントラストモード実装
- [ ] 日本語・英語完全対応・音声多言語化

---

## 🔧 **詳細実装ガイド**

### **B.1 音声インターフェース実装**

#### **B.1.1 音声認識・処理エンジン**
```typescript
// src/lib/mobile/voiceProcessing.ts
import { useEffect, useState, useRef } from 'react';

export interface VoiceCommand {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  rawText: string;
  context?: string;
}

export interface VoiceResponse {
  text: string;
  emotion: 'friendly' | 'encouraging' | 'informative' | 'celebratory';
  action?: {
    type: string;
    data: any;
  };
}

export class VoiceProcessor {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening: boolean = false;
  private geminiAPI: any; // Gemini API instance
  private userContext: any = {};
  private conversationHistory: any[] = [];

  constructor() {
    this.initializeSpeechRecognition();
    this.synthesis = window.speechSynthesis;
    this.geminiAPI = window.AI_SERVICE; // 既存のAIサービス活用
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ja-JP';
      this.recognition.maxAlternatives = 3;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onListeningStateChange?.(true);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onListeningStateChange?.(false);
      };

      this.recognition.onresult = (event) => {
        const results = Array.from(event.results);
        const finalResult = results[results.length - 1];
        
        if (finalResult.isFinal) {
          const transcript = finalResult[0].transcript;
          this.processVoiceInput(transcript);
        } else {
          // 中間結果の処理
          const interimTranscript = finalResult[0].transcript;
          this.onInterimResult?.(interimTranscript);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.onError?.(event.error);
        this.isListening = false;
        this.onListeningStateChange?.(false);
      };
    }
  }

  public async startListening(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    if (this.isListening) {
      this.stopListening();
      return;
    }

    try {
      // マイクロフォン許可確認
      await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recognition.start();
    } catch (error) {
      console.error('Microphone access denied:', error);
      throw error;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  private async processVoiceInput(transcript: string): Promise<void> {
    try {
      // 音声テキストを自然言語処理
      const command = await this.parseVoiceCommand(transcript);
      
      // 会話履歴に追加
      this.conversationHistory.push({
        type: 'user',
        text: transcript,
        timestamp: new Date(),
        command
      });

      // アクション実行
      if (command.intent !== 'unknown') {
        const response = await this.executeVoiceCommand(command);
        
        // 音声で応答
        await this.speakResponse(response);
        
        // 会話履歴に応答追加
        this.conversationHistory.push({
          type: 'assistant',
          text: response.text,
          timestamp: new Date(),
          emotion: response.emotion
        });

        // アクション実行
        if (response.action) {
          await this.executeAction(response.action);
        }
      } else {
        // 理解できない場合の応答
        await this.speakResponse({
          text: 'すみません、よく聞こえませんでした。もう一度お願いします。',
          emotion: 'friendly'
        });
      }

    } catch (error) {
      console.error('Voice processing error:', error);
      await this.speakResponse({
        text: 'エラーが発生しました。もう一度お試しください。',
        emotion: 'friendly'
      });
    }
  }

  private async parseVoiceCommand(transcript: string): Promise<VoiceCommand> {
    // 現在のコンテキスト情報を取得
    const currentContext = await this.getCurrentContext();
    
    // Gemini APIで意図解析
    const analysisPrompt = `
    音声コマンド解析:
    
    ユーザー発言: "${transcript}"
    
    現在のコンテキスト:
    - 画面: ${currentContext.currentPage}
    - 時刻: ${new Date().toLocaleString('ja-JP')}
    - 最近の操作: ${currentContext.recentActions?.slice(-3).join(', ') || 'なし'}
    - アクティブなタスク数: ${currentContext.activeTasks || 0}
    - 今日の予定数: ${currentContext.todayAppointments || 0}
    
    過去の会話履歴:
    ${this.conversationHistory.slice(-5).map(h => `${h.type}: ${h.text}`).join('\n')}
    
    以下の意図から最も適切なものを判定し、エンティティを抽出してください:
    
    1. TASK_CREATE - 新しいタスク作成
       例: "明日までにレポート作成", "会議資料準備のタスク追加"
       エンティティ: title, deadline, priority, assignee
    
    2. TASK_UPDATE - タスク状態更新
       例: "このタスク完了", "進行中に変更", "優先度を高に"
       エンティティ: taskId, status, property, value
    
    3. SCHEDULE_CREATE - 予定作成
       例: "明日10時に会議", "来週火曜日にミーティング"
       エンティティ: title, datetime, duration, attendees
    
    4. INFORMATION_REQUEST - 情報確認
       例: "今日の予定は？", "進捗状況教えて", "明日の締切は？"
       エンティティ: type, timeframe, filter
    
    5. NAVIGATION - 画面遷移
       例: "タスク一覧見せて", "プロジェクト画面に移動"
       エンティティ: destination, filter
    
    6. REMINDER_SET - リマインダー設定
       例: "30分後にアラーム", "明日の朝に通知"
       エンティティ: datetime, message
    
    7. SEARCH - 検索・フィルタ
       例: "重要なタスクだけ表示", "田中さんの作業検索"
       エンティティ: query, filter, scope
    
    8. HELP - ヘルプ・説明要求
       例: "使い方教えて", "この機能は何？"
       エンティティ: topic, context
    
    9. CASUAL_CONVERSATION - 雑談・感情表現
       例: "疲れた", "頑張ってる", "ありがとう"
       エンティティ: emotion, context
    
    10. UNKNOWN - 理解できない・不明確
    
    JSON形式で回答:
    {
      "intent": "TASK_CREATE",
      "entities": {
        "title": "レポート作成",
        "deadline": "2025-07-02",
        "priority": "medium"
      },
      "confidence": 0.95,
      "rawText": "${transcript}",
      "context": "task_management"
    }
    `;

    try {
      const result = await this.geminiAPI.evaluateWithGemini(analysisPrompt);
      return JSON.parse(result);
    } catch (error) {
      console.error('Voice command parsing error:', error);
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0,
        rawText: transcript
      };
    }
  }

  private async executeVoiceCommand(command: VoiceCommand): Promise<VoiceResponse> {
    switch (command.intent) {
      case 'TASK_CREATE':
        return await this.handleTaskCreation(command);
      
      case 'TASK_UPDATE':
        return await this.handleTaskUpdate(command);
      
      case 'SCHEDULE_CREATE':
        return await this.handleScheduleCreation(command);
      
      case 'INFORMATION_REQUEST':
        return await this.handleInformationRequest(command);
      
      case 'NAVIGATION':
        return await this.handleNavigation(command);
      
      case 'REMINDER_SET':
        return await this.handleReminderSet(command);
      
      case 'SEARCH':
        return await this.handleSearch(command);
      
      case 'HELP':
        return await this.handleHelp(command);
      
      case 'CASUAL_CONVERSATION':
        return await this.handleCasualConversation(command);
      
      default:
        return {
          text: 'すみません、よく理解できませんでした。もう少し具体的にお話しください。',
          emotion: 'friendly'
        };
    }
  }

  private async handleTaskCreation(command: VoiceCommand): Promise<VoiceResponse> {
    const { entities } = command;
    
    try {
      // タスク作成API呼び出し
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: entities.title,
          deadline: entities.deadline,
          priority: entities.priority || 'medium',
          assignedTo: entities.assignee,
          createdBy: 'voice-command'
        })
      });

      if (response.ok) {
        const task = await response.json();
        return {
          text: `「${entities.title}」のタスクを作成しました。${entities.deadline ? `期限は${new Date(entities.deadline).toLocaleDateString('ja-JP')}です。` : ''}頑張ってください！`,
          emotion: 'encouraging',
          action: {
            type: 'REFRESH_TASKS',
            data: { newTaskId: task.id }
          }
        };
      } else {
        throw new Error('タスク作成に失敗しました');
      }
    } catch (error) {
      return {
        text: 'タスクの作成中にエラーが発生しました。もう一度お試しください。',
        emotion: 'friendly'
      };
    }
  }

  private async handleTaskUpdate(command: VoiceCommand): Promise<VoiceResponse> {
    const { entities } = command;
    
    try {
      // 現在選択中のタスクIDを取得
      const taskId = entities.taskId || await this.getCurrentTaskId();
      
      if (!taskId) {
        return {
          text: '更新するタスクが見つかりません。タスクを選択してからもう一度お試しください。',
          emotion: 'friendly'
        };
      }

      const updateData: any = {};
      
      if (entities.status) {
        updateData.status = entities.status;
      }
      
      if (entities.property && entities.value) {
        updateData[entities.property] = entities.value;
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const responseMessages = {
          completed: 'タスクを完了しました！お疲れさまでした！',
          in_progress: 'タスクを進行中に変更しました。頑張ってください！',
          pending: 'タスクを保留中に変更しました。',
          deleted: 'タスクを削除しました。'
        };

        return {
          text: responseMessages[entities.status as keyof typeof responseMessages] || 'タスクを更新しました。',
          emotion: entities.status === 'completed' ? 'celebratory' : 'encouraging',
          action: {
            type: 'REFRESH_TASKS',
            data: { updatedTaskId: taskId }
          }
        };
      } else {
        throw new Error('タスク更新に失敗しました');
      }
    } catch (error) {
      return {
        text: 'タスクの更新中にエラーが発生しました。もう一度お試しください。',
        emotion: 'friendly'
      };
    }
  }

  private async handleInformationRequest(command: VoiceCommand): Promise<VoiceResponse> {
    const { entities } = command;
    
    try {
      let response: Response;
      let data: any;
      
      switch (entities.type) {
        case 'today_schedule':
          response = await fetch(`/api/appointments?date=${new Date().toISOString().split('T')[0]}`);
          data = await response.json();
          
          if (data.length === 0) {
            return {
              text: '今日の予定はありません。お疲れさまです！',
              emotion: 'friendly'
            };
          }
          
          const scheduleText = data.map((apt: any) => 
            `${new Date(apt.date).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}から${apt.title}`
          ).join(', ');
          
          return {
            text: `今日の予定は、${scheduleText}です。`,
            emotion: 'informative'
          };
        
        case 'task_progress':
          response = await fetch('/api/tasks?status=in_progress');
          data = await response.json();
          
          return {
            text: `現在進行中のタスクは${data.length}件です。${data.length > 0 ? '頑張ってください！' : '新しいタスクを始めてみませんか？'}`,
            emotion: 'encouraging'
          };
        
        case 'deadlines':
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          response = await fetch(`/api/tasks?deadline_before=${tomorrow.toISOString()}`);
          data = await response.json();
          
          if (data.length === 0) {
            return {
              text: '明日の締切はありません。余裕がありますね！',
              emotion: 'friendly'
            };
          }
          
          return {
            text: `明日締切のタスクが${data.length}件あります。頑張って完了させましょう！`,
            emotion: 'encouraging'
          };
        
        default:
          return {
            text: 'どの情報をお知りになりたいですか？「今日の予定」「進捗状況」「明日の締切」などと話しかけてください。',
            emotion: 'friendly'
          };
      }
    } catch (error) {
      return {
        text: '情報の取得中にエラーが発生しました。もう一度お試しください。',
        emotion: 'friendly'
      };
    }
  }

  private async handleCasualConversation(command: VoiceCommand): Promise<VoiceResponse> {
    const { entities } = command;
    
    const responses = {
      tired: [
        '少し休憩されてはいかがですか？無理は禁物ですよ。',
        'お疲れさまです。深呼吸して、リフレッシュしましょう！',
        '頑張りすぎず、適度に休んでくださいね。'
      ],
      encouraging: [
        'その調子です！あなたなら必ずできます！',
        '素晴らしい頑張りですね！継続は力なりです。',
        '順調に進んでいますね。この調子で行きましょう！'
      ],
      grateful: [
        'どういたしまして！いつでもお手伝いします。',
        'お役に立てて嬉しいです！',
        'こちらこそ、ありがとうございます！'
      ],
      default: [
        'どうされましたか？何かお手伝いできることがあれば教えてください。',
        'お疲れさまです！何か必要なことがあれば遠慮なくどうぞ。',
        'いつでもサポートいたします！何でもお聞かせください。'
      ]
    };

    const emotionType = entities.emotion || 'default';
    const responseList = responses[emotionType as keyof typeof responses] || responses.default;
    const randomResponse = responseList[Math.floor(Math.random() * responseList.length)];

    return {
      text: randomResponse,
      emotion: emotionType === 'tired' ? 'friendly' : 
              emotionType === 'encouraging' ? 'celebratory' : 'friendly'
    };
  }

  public async speakResponse(response: VoiceResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(response.text);
      
      // 感情に応じた音声設定
      switch (response.emotion) {
        case 'celebratory':
          utterance.rate = 1.1;
          utterance.pitch = 1.2;
          break;
        case 'encouraging':
          utterance.rate = 1.0;
          utterance.pitch = 1.1;
          break;
        case 'friendly':
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          break;
        case 'informative':
          utterance.rate = 0.9;
          utterance.pitch = 0.9;
          break;
      }

      utterance.lang = 'ja-JP';
      utterance.volume = 0.8;

      utterance.onend = () => resolve();
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        resolve(); // エラーでも続行
      };

      this.synthesis.speak(utterance);
    });
  }

  private async executeAction(action: { type: string; data: any }): Promise<void> {
    switch (action.type) {
      case 'REFRESH_TASKS':
        window.dispatchEvent(new CustomEvent('refreshTasks', { detail: action.data }));
        break;
      case 'NAVIGATE':
        window.location.href = action.data.url;
        break;
      case 'SHOW_NOTIFICATION':
        this.showNotification(action.data.message);
        break;
    }
  }

  private async getCurrentContext(): Promise<any> {
    return {
      currentPage: window.location.pathname,
      recentActions: JSON.parse(localStorage.getItem('recentActions') || '[]'),
      activeTasks: await this.getActiveTasksCount(),
      todayAppointments: await this.getTodayAppointmentsCount()
    };
  }

  private async getCurrentTaskId(): Promise<string | null> {
    // 現在選択中のタスクIDを取得（画面の状態から）
    const selectedElement = document.querySelector('[data-task-id].selected');
    return selectedElement?.getAttribute('data-task-id') || null;
  }

  private async getActiveTasksCount(): Promise<number> {
    try {
      const response = await fetch('/api/tasks?status=in_progress');
      const tasks = await response.json();
      return tasks.length;
    } catch {
      return 0;
    }
  }

  private async getTodayAppointmentsCount(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/appointments?date=${today}`);
      const appointments = await response.json();
      return appointments.length;
    } catch {
      return 0;
    }
  }

  private showNotification(message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FIND to DO', {
        body: message,
        icon: '/icons/icon-192x192.png'
      });
    }
  }

  // イベントハンドラ
  public onListeningStateChange?: (isListening: boolean) => void;
  public onInterimResult?: (transcript: string) => void;
  public onError?: (error: string) => void;

  public destroy(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}

// React Hook
export function useVoiceProcessor() {
  const [processor] = useState(() => new VoiceProcessor());
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    processor.onListeningStateChange = setIsListening;
    processor.onInterimResult = setInterimTranscript;
    processor.onError = setError;

    return () => {
      processor.destroy();
    };
  }, [processor]);

  const startListening = useCallback(async () => {
    try {
      await processor.startListening();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [processor]);

  const stopListening = useCallback(() => {
    processor.stopListening();
  }, [processor]);

  return {
    isListening,
    interimTranscript,
    error,
    startListening,
    stopListening
  };
}
```

### **B.2 AI予測・自動化システム実装**

#### **B.2.1 行動学習・予測エンジン**
```typescript
// src/lib/mobile/predictiveEngine.ts
export interface UserBehaviorPattern {
  userId: string;
  timePatterns: {
    activeHours: number[];
    peakProductivityTime: number;
    breakTimes: number[];
    weeklyPattern: Record<string, number>;
  };
  taskPatterns: {
    preferredTaskTypes: string[];
    averageCompletionTime: Record<string, number>;
    procrastinationTriggers: string[];
    motivationFactors: string[];
  };
  interactionPatterns: {
    preferredInputMethod: 'voice' | 'gesture' | 'touch';
    frequentActions: string[];
    navigationStyle: 'linear' | 'random' | 'efficient';
    helpSeekingBehavior: string[];
  };
  contextualPatterns: {
    locationBasedBehavior: Record<string, string[]>;
    timeBasedBehavior: Record<string, string[]>;
    moodBasedBehavior: Record<string, string[]>;
  };
}

export interface PredictionResult {
  nextAction: {
    type: string;
    confidence: number;
    reasoning: string;
    suggestedTiming: Date;
  };
  contextualSuggestions: Array<{
    suggestion: string;
    priority: number;
    category: string;
    reasoning: string;
  }>;
  riskAlerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    preventionActions: string[];
  }>;
  optimizationTips: Array<{
    tip: string;
    impact: number;
    difficulty: number;
    category: string;
  }>;
}

export class PredictiveEngine {
  private behaviorPattern: UserBehaviorPattern | null = null;
  private recentActions: any[] = [];
  private contextHistory: any[] = [];
  private geminiAPI: any;

  constructor() {
    this.geminiAPI = window.AI_SERVICE;
    this.loadUserBehaviorPattern();
    this.startBehaviorTracking();
  }

  private async loadUserBehaviorPattern(): Promise<void> {
    try {
      const response = await fetch('/api/user/behavior-pattern');
      if (response.ok) {
        this.behaviorPattern = await response.json();
      } else {
        // 初回ユーザーの場合、デフォルトパターンを作成
        this.behaviorPattern = await this.createDefaultBehaviorPattern();
      }
    } catch (error) {
      console.error('Failed to load behavior pattern:', error);
      this.behaviorPattern = await this.createDefaultBehaviorPattern();
    }
  }

  private async createDefaultBehaviorPattern(): Promise<UserBehaviorPattern> {
    const userId = this.getCurrentUserId();
    return {
      userId,
      timePatterns: {
        activeHours: [9, 10, 11, 14, 15, 16, 17],
        peakProductivityTime: 10,
        breakTimes: [12, 15],
        weeklyPattern: {
          monday: 0.8,
          tuesday: 0.9,
          wednesday: 1.0,
          thursday: 0.9,
          friday: 0.7,
          saturday: 0.3,
          sunday: 0.2
        }
      },
      taskPatterns: {
        preferredTaskTypes: ['development', 'planning'],
        averageCompletionTime: {
          'simple': 30,
          'medium': 120,
          'complex': 480
        },
        procrastinationTriggers: ['large_tasks', 'unclear_requirements'],
        motivationFactors: ['clear_goals', 'recognition', 'learning']
      },
      interactionPatterns: {
        preferredInputMethod: 'touch',
        frequentActions: ['check_tasks', 'update_status', 'view_schedule'],
        navigationStyle: 'efficient',
        helpSeekingBehavior: ['search_knowledge', 'ask_colleague']
      },
      contextualPatterns: {
        locationBasedBehavior: {
          'office': ['focus_work', 'meetings', 'collaboration'],
          'home': ['planning', 'learning', 'personal_tasks'],
          'commute': ['quick_checks', 'voice_commands', 'listening']
        },
        timeBasedBehavior: {
          'morning': ['planning', 'high_priority_tasks'],
          'afternoon': ['meetings', 'collaboration'],
          'evening': ['wrap_up', 'tomorrow_planning']
        },
        moodBasedBehavior: {
          'energetic': ['complex_tasks', 'creative_work'],
          'tired': ['simple_tasks', 'review'],
          'stressed': ['break_down_tasks', 'seek_help']
        }
      }
    };
  }

  private startBehaviorTracking(): void {
    // ユーザーアクションを追跡
    this.trackPageViews();
    this.trackTaskInteractions();
    this.trackTimePatterns();
    this.trackContextChanges();
  }

  private trackPageViews(): void {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      this.recordAction('page_navigation', { url: args[2] });
    }.bind(this);

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      this.recordAction('page_navigation', { url: args[2] });
    }.bind(this);

    window.addEventListener('popstate', () => {
      this.recordAction('page_navigation', { url: window.location.pathname });
    });
  }

  private trackTaskInteractions(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      if (target.closest('[data-task-id]')) {
        const taskId = target.closest('[data-task-id]')?.getAttribute('data-task-id');
        const action = this.inferTaskAction(target);
        
        this.recordAction('task_interaction', {
          taskId,
          action,
          timestamp: new Date(),
          element: target.tagName.toLowerCase()
        });
      }
    });

    // ジェスチャーアクションも追跡
    window.addEventListener('mobileDataUpdate', (event: any) => {
      this.recordAction('gesture_action', event.detail);
    });
  }

  private trackTimePatterns(): void {
    // 1分ごとにアクティビティを記録
    setInterval(() => {
      if (document.hasFocus()) {
        this.recordAction('active_time', {
          hour: new Date().getHours(),
          day: new Date().getDay(),
          url: window.location.pathname
        });
      }
    }, 60000);
  }

  private trackContextChanges(): void {
    // デバイス方向変更
    window.addEventListener('orientationchange', () => {
      this.recordAction('context_change', {
        type: 'orientation',
        orientation: screen.orientation?.angle
      });
    });

    // ネットワーク状態変更
    window.addEventListener('online', () => {
      this.recordAction('context_change', { type: 'network', online: true });
    });

    window.addEventListener('offline', () => {
      this.recordAction('context_change', { type: 'network', online: false });
    });
  }

  private recordAction(type: string, data: any): void {
    const action = {
      type,
      data,
      timestamp: new Date(),
      context: this.getCurrentContext()
    };

    this.recentActions.push(action);
    
    // 最新1000件のみ保持
    if (this.recentActions.length > 1000) {
      this.recentActions = this.recentActions.slice(-1000);
    }

    // 定期的にパターンを更新
    if (this.recentActions.length % 50 === 0) {
      this.updateBehaviorPattern();
    }
  }

  public async generatePredictions(): Promise<PredictionResult> {
    if (!this.behaviorPattern) {
      await this.loadUserBehaviorPattern();
    }

    const currentContext = this.getCurrentContext();
    const recentBehavior = this.recentActions.slice(-20);

    const predictionPrompt = `
    ユーザー行動予測分析:
    
    現在のコンテキスト:
    - 時刻: ${new Date().toLocaleString('ja-JP')}
    - 画面: ${currentContext.currentPage}
    - バッテリー: ${(navigator as any).getBattery ? 'チェック中' : '不明'}
    - ネットワーク: ${navigator.onLine ? 'オンライン' : 'オフライン'}
    
    ユーザー行動パターン:
    - アクティブ時間帯: ${this.behaviorPattern?.timePatterns.activeHours.join(', ')}
    - 生産性ピーク: ${this.behaviorPattern?.timePatterns.peakProductivityTime}時
    - 好みタスク: ${this.behaviorPattern?.taskPatterns.preferredTaskTypes.join(', ')}
    - 操作スタイル: ${this.behaviorPattern?.interactionPatterns.preferredInputMethod}
    
    最近の行動:
    ${recentBehavior.map(action => 
      `${action.timestamp.toLocaleTimeString()}: ${action.type} - ${JSON.stringify(action.data)}`
    ).join('\n')}
    
    以下の観点で予測・提案を生成:
    
    1. 次のアクション予測
       - 最も可能性の高い次の行動
       - 実行タイミングの提案
       - 理由・根拠
    
    2. コンテキスト別提案
       - 現在の状況に最適な作業
       - 効率化のための提案
       - 優先度の高いタスク
    
    3. リスクアラート
       - 注意すべき点（疲労、遅延等）
       - 予防すべき問題
       - 対策の提案
    
    4. 最適化ヒント
       - 生産性向上の具体的提案
       - 時間管理の改善点
       - ツール活用のコツ
    
    JSON形式で回答:
    {
      "nextAction": {
        "type": "check_deadlines",
        "confidence": 0.8,
        "reasoning": "午前中の習慣として締切確認を行う傾向",
        "suggestedTiming": "2025-07-01T10:30:00Z"
      },
      "contextualSuggestions": [
        {
          "suggestion": "重要度Aのタスクに集中しましょう",
          "priority": 9,
          "category": "productivity",
          "reasoning": "現在が生産性ピーク時間のため"
        }
      ],
      "riskAlerts": [
        {
          "type": "overload",
          "severity": "medium",
          "description": "今日のタスクが多すぎる可能性があります",
          "preventionActions": ["優先度の見直し", "一部タスクの延期検討"]
        }
      ],
      "optimizationTips": [
        {
          "tip": "音声コマンドを活用して入力時間を短縮",
          "impact": 8,
          "difficulty": 3,
          "category": "efficiency"
        }
      ]
    }
    `;

    try {
      const result = await this.geminiAPI.evaluateWithGemini(predictionPrompt);
      return JSON.parse(result);
    } catch (error) {
      console.error('Prediction generation error:', error);
      return this.getDefaultPrediction();
    }
  }

  public async executeAutomatedAction(prediction: PredictionResult): Promise<boolean> {
    const { nextAction } = prediction;
    
    // 高信頼度（0.9以上）の場合のみ自動実行
    if (nextAction.confidence < 0.9) {
      return false;
    }

    try {
      switch (nextAction.type) {
        case 'check_deadlines':
          await this.autoCheckDeadlines();
          break;
        case 'suggest_break':
          await this.autoSuggestBreak();
          break;
        case 'organize_tasks':
          await this.autoOrganizeTasks();
          break;
        case 'remind_meeting':
          await this.autoRemindMeeting();
          break;
        default:
          return false;
      }
      
      this.recordAction('automated_action', {
        type: nextAction.type,
        executed: true,
        confidence: nextAction.confidence
      });
      
      return true;
    } catch (error) {
      console.error('Automated action error:', error);
      return false;
    }
  }

  private async autoCheckDeadlines(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const response = await fetch(`/api/tasks?deadline_before=${tomorrow.toISOString()}`);
    const urgentTasks = await response.json();
    
    if (urgentTasks.length > 0) {
      this.showNotification(
        `明日までの締切タスクが${urgentTasks.length}件あります`,
        'deadline_check'
      );
    }
  }

  private async autoSuggestBreak(): Promise<void> {
    const lastBreak = this.getLastBreakTime();
    const workDuration = Date.now() - lastBreak;
    
    if (workDuration > 90 * 60 * 1000) { // 90分以上
      this.showNotification(
        '90分間集中されました。5分程度の休憩をお勧めします',
        'break_suggestion'
      );
    }
  }

  private async autoOrganizeTasks(): Promise<void> {
    const response = await fetch('/api/tasks?status=pending');
    const pendingTasks = await response.json();
    
    if (pendingTasks.length > 10) {
      this.showNotification(
        `未着手のタスクが${pendingTasks.length}件あります。整理してみませんか？`,
        'task_organization'
      );
    }
  }

  private getCurrentContext(): any {
    return {
      currentPage: window.location.pathname,
      timestamp: new Date(),
      hour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      online: navigator.onLine
    };
  }

  private inferTaskAction(element: HTMLElement): string {
    const className = element.className.toLowerCase();
    const tagName = element.tagName.toLowerCase();
    
    if (className.includes('complete') || className.includes('done')) {
      return 'complete';
    } else if (className.includes('edit')) {
      return 'edit';
    } else if (className.includes('delete')) {
      return 'delete';
    } else if (tagName === 'button') {
      return 'action';
    } else {
      return 'view';
    }
  }

  private async updateBehaviorPattern(): Promise<void> {
    if (!this.behaviorPattern) return;

    // 行動データを分析して patern を更新
    const analysis = this.analyzeBehaviorData();
    
    // 学習した パターンをサーバーに保存
    try {
      await fetch('/api/user/behavior-pattern', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this.behaviorPattern,
          ...analysis,
          lastUpdated: new Date()
        })
      });
    } catch (error) {
      console.error('Failed to update behavior pattern:', error);
    }
  }

  private analyzeBehaviorData(): Partial<UserBehaviorPattern> {
    const activeHours = this.extractActiveHours();
    const preferredActions = this.extractPreferredActions();
    
    return {
      timePatterns: {
        ...this.behaviorPattern!.timePatterns,
        activeHours
      },
      interactionPatterns: {
        ...this.behaviorPattern!.interactionPatterns,
        frequentActions: preferredActions
      }
    };
  }

  private extractActiveHours(): number[] {
    const hourCounts = new Array(24).fill(0);
    
    this.recentActions
      .filter(action => action.type === 'active_time')
      .forEach(action => {
        hourCounts[action.data.hour]++;
      });
    
    // アクティブ度が平均以上の時間帯を抽出
    const average = hourCounts.reduce((sum, count) => sum + count, 0) / 24;
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count > average)
      .map(({ hour }) => hour);
  }

  private extractPreferredActions(): string[] {
    const actionCounts: Record<string, number> = {};
    
    this.recentActions.forEach(action => {
      actionCounts[action.type] = (actionCounts[action.type] || 0) + 1;
    });
    
    return Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action]) => action);
  }

  private getDefaultPrediction(): PredictionResult {
    return {
      nextAction: {
        type: 'check_tasks',
        confidence: 0.5,
        reasoning: 'デフォルト提案',
        suggestedTiming: new Date()
      },
      contextualSuggestions: [],
      riskAlerts: [],
      optimizationTips: []
    };
  }

  private showNotification(message: string, type: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FIND to DO - AI提案', {
        body: message,
        icon: '/icons/icon-192x192.png',
        tag: type
      });
    }
  }

  private getCurrentUserId(): string {
    // セッションから ユーザーID を取得
    return 'current-user'; // 実装時は適切な方法で取得
  }

  private getLastBreakTime(): number {
    const lastBreakAction = this.recentActions
      .filter(action => action.type === 'break' || action.type === 'inactive_time')
      .slice(-1)[0];
    
    return lastBreakAction ? lastBreakAction.timestamp.getTime() : Date.now() - 2 * 60 * 60 * 1000;
  }
}

// React Hook
export function usePredictiveEngine() {
  const [engine] = useState(() => new PredictiveEngine());
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePredictions = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await engine.generatePredictions();
      setPredictions(result);
      
      // 高信頼度の予測は自動実行を試行
      if (result.nextAction.confidence > 0.9) {
        await engine.executeAutomatedAction(result);
      }
    } catch (error) {
      console.error('Failed to generate predictions:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [engine]);

  useEffect(() => {
    // 初回予測生成
    generatePredictions();
    
    // 5分ごとに予測を更新
    const interval = setInterval(generatePredictions, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [generatePredictions]);

  return {
    predictions,
    isGenerating,
    generatePredictions
  };
}
```

---

## 🧪 **Phase B テスト計画**

### **B.1 音声インターフェーステスト**
```typescript
// __tests__/mobile/VoiceProcessor.test.ts
import { VoiceProcessor } from '../../src/lib/mobile/voiceProcessing';

describe('VoiceProcessor', () => {
  let voiceProcessor: VoiceProcessor;
  
  beforeEach(() => {
    // Mock Web Speech API
    global.SpeechRecognition = jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
      addEventListener: jest.fn(),
      continuous: false,
      interimResults: false,
      lang: 'ja-JP'
    }));
    
    global.speechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      getVoices: jest.fn(() => [])
    } as any;
    
    voiceProcessor = new VoiceProcessor();
  });

  test('should parse task creation command', async () => {
    const command = await voiceProcessor.parseVoiceCommand('明日までにレポートを作成');
    
    expect(command.intent).toBe('TASK_CREATE');
    expect(command.entities.title).toContain('レポート');
    expect(command.confidence).toBeGreaterThan(0.7);
  });

  test('should handle task completion command', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    ) as jest.Mock;

    const response = await voiceProcessor.handleTaskUpdate({
      intent: 'TASK_UPDATE',
      entities: { status: 'completed', taskId: 'test-task' },
      confidence: 0.9,
      rawText: 'このタスク完了'
    });

    expect(response.emotion).toBe('celebratory');
    expect(response.text).toContain('完了');
  });
});
```

### **B.2 予測エンジンテスト**
```typescript
// __tests__/mobile/PredictiveEngine.test.ts
import { PredictiveEngine } from '../../src/lib/mobile/predictiveEngine';

describe('PredictiveEngine', () => {
  let engine: PredictiveEngine;
  
  beforeEach(() => {
    engine = new PredictiveEngine();
  });

  test('should generate predictions', async () => {
    const predictions = await engine.generatePredictions();
    
    expect(predictions.nextAction).toBeDefined();
    expect(predictions.nextAction.confidence).toBeGreaterThanOrEqual(0);
    expect(predictions.nextAction.confidence).toBeLessThanOrEqual(1);
  });

  test('should track user behavior', () => {
    engine.recordAction('task_interaction', {
      taskId: 'test-task',
      action: 'complete'
    });
    
    expect(engine.recentActions).toHaveLength(1);
  });
});
```

---

## 📊 **Phase B 成功指標**

### **B.1 定量指標**
- [ ] **音声認識精度**: 90%以上（日本語）
- [ ] **意図理解精度**: 85%以上（基本コマンド）
- [ ] **予測精度**: 70%以上（次のアクション）
- [ ] **応答時間**: 音声処理3秒以内、AI予測5秒以内

### **B.2 機能指標**
- [ ] **音声タスク作成**: 自然言語から正確なタスク作成
- [ ] **感情認識**: ユーザーの感情状態に応じた適切な応答
- [ ] **行動予測**: ユーザーの次のアクションを70%以上の精度で予測
- [ ] **自動実行**: 高信頼度予測の自動実行機能

### **B.3 ユーザビリティ指標**
- [ ] **学習コスト**: 音声コマンド5分以内で習得
- [ ] **エラー回復**: 音声認識失敗時の適切なフォローアップ
- [ ] **自然性**: AIとの対話が自然で親しみやすい

---

## 🚀 **Phase B 完了基準**

### **B.1 機能完了基準**
1. **音声インターフェース完了**
   - [ ] 8つの基本音声コマンド認識
   - [ ] 自然言語からのタスク・予定作成
   - [ ] 感情に応じた音声応答

2. **AI予測システム完了**
   - [ ] ユーザー行動パターン学習
   - [ ] 次のアクション予測・提案
   - [ ] 高信頼度アクションの自動実行

3. **LINE Bot強化完了**
   - [ ] 感情認識機能
   - [ ] プロアクティブメッセージ
   - [ ] 高度な自然言語理解

### **B.2 品質完了基準**
- [ ] 全テスト通過
- [ ] 音声認識各ブラウザ互換性確認
- [ ] AI応答の適切性確認
- [ ] プライバシー・セキュリティ確認

### **B.3 運用完了基準**
- [ ] 音声データ暗号化・削除機能
- [ ] AI応答のモニタリング機能
- [ ] ユーザーフィードバック収集機能

---

**次のアクション**: Phase A完了後、この計画に従ってPhase B実装を開始。音声とAIの力で、真に革新的なモバイル体験を実現します。
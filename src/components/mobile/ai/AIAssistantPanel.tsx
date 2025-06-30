'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff,
  Bot,
  User,
  Lightbulb,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowUp,
  Settings,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: MessageAction[];
  suggestions?: string[];
}

interface MessageAction {
  id: string;
  type: 'create_task' | 'schedule_event' | 'set_reminder' | 'search' | 'optimize';
  label: string;
  data?: any;
}

interface AIAssistantPanelProps {
  className?: string;
  minimized?: boolean;
  onMinimizeToggle?: (minimized: boolean) => void;
  onClose?: () => void;
}

export default function AIAssistantPanel({ 
  className = '', 
  minimized = false,
  onMinimizeToggle,
  onClose
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechRecognition = useRef<any>(null);

  useEffect(() => {
    // 初期メッセージの設定
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'assistant',
      content: 'こんにちは！AIアシスタントです。タスク管理、スケジュール調整、生産性向上のお手伝いをします。何かお困りのことはありますか？',
      timestamp: new Date(),
      suggestions: [
        '今日のタスクを教えて',
        '来週のスケジュールを最適化して',
        '集中できる時間を作って',
        '未完了のタスクを確認して'
      ]
    };

    setMessages([welcomeMessage]);
    generateSuggestions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Web Speech API の初期化
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      speechRecognition.current = new SpeechRecognition();
      speechRecognition.current.continuous = false;
      speechRecognition.current.interimResults = false;
      speechRecognition.current.lang = 'ja-JP';

      speechRecognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      speechRecognition.current.onerror = () => {
        setIsListening(false);
      };

      speechRecognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateSuggestions = () => {
    const commonSuggestions = [
      '今日何をすべき？',
      'タスクを作成して',
      'スケジュールを確認',
      '休憩時間を設定',
      '優先タスクを教えて',
      '来週の準備をして'
    ];
    setSuggestions(commonSuggestions);
  };

  const processMessage = async (message: string): Promise<ChatMessage> => {
    // AI応答の模擬処理
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    let response = '';
    let actions: MessageAction[] = [];

    // キーワードベースの応答生成
    if (message.includes('タスク') && message.includes('作成')) {
      response = 'タスクを作成しますね。どのようなタスクを作成しましょうか？タイトルと期限を教えてください。';
      actions = [{
        id: 'create-task',
        type: 'create_task',
        label: 'タスク作成画面を開く',
        data: { template: true }
      }];
    } else if (message.includes('今日') && (message.includes('タスク') || message.includes('スケジュール'))) {
      response = `今日は以下のタスクが予定されています：

1. プレゼンテーション資料作成 (期限: 今日 17:00)
2. メール返信 (優先度: 中)
3. コードレビュー (推定時間: 1時間)

最も重要な「プレゼンテーション資料作成」から始めることをお勧めします。集中できる時間を確保しましょうか？`;
      
      actions = [
        {
          id: 'focus-time',
          type: 'schedule_event',
          label: '集中時間をスケジュール',
          data: { duration: 90, type: 'focus' }
        },
        {
          id: 'view-tasks',
          type: 'search',
          label: '今日のタスクを表示',
          data: { filter: 'today' }
        }
      ];
    } else if (message.includes('スケジュール') && message.includes('最適化')) {
      response = `スケジュールを分析しました。以下の最適化を提案します：

✨ 推奨改善点：
• 午前中の集中作業時間を30分延長
• 午後2時に15分の休憩を追加
• 類似タスクをグループ化して効率UP

これらの変更により、生産性が約20%向上する見込みです。`;

      actions = [{
        id: 'apply-optimization',
        type: 'optimize',
        label: '最適化を適用',
        data: { optimizations: ['extend_focus', 'add_break', 'group_tasks'] }
      }];
    } else if (message.includes('集中') || message.includes('フォーカス')) {
      response = `集中時間を作成しましょう。あなたの生産性データを見ると、午前9-11時が最も集中できる時間帯です。

🎯 推奨設定：
• 時間: 90分間
• 通知OFF
• タスク: 重要度の高い作業
• 環境: 静かな場所

この時間をブロックしますか？`;

      actions = [{
        id: 'create-focus-block',
        type: 'schedule_event',
        label: '集中時間をブロック',
        data: { duration: 90, type: 'deep_work' }
      }];
    } else if (message.includes('未完了') || message.includes('残っている')) {
      response = `未完了のタスクを確認しました：

📋 優先度別の未完了タスク：
🔴 高優先度 (3件)
• プレゼン資料完成
• 顧客への返信
• 週次レポート作成

🟡 中優先度 (5件)
🟢 低優先度 (2件)

どのタスクから片付けましょうか？`;

      actions = [
        {
          id: 'show-high-priority',
          type: 'search',
          label: '高優先度タスクを表示',
          data: { filter: 'high_priority_incomplete' }
        },
        {
          id: 'suggest-order',
          type: 'optimize',
          label: '最適な順序を提案',
          data: { type: 'task_ordering' }
        }
      ];
    } else {
      // デフォルト応答
      response = `ご質問ありがとうございます。「${message}」について、以下のお手伝いができます：

• タスクの作成・管理
• スケジュールの最適化
• 生産性の分析・改善提案
• リマインダーの設定

具体的にどのようなサポートが必要でしょうか？`;
    }

    return {
      id: `msg-${Date.now()}`,
      type: 'assistant',
      content: response,
      timestamp: new Date(),
      actions,
      suggestions: generateContextualSuggestions(message)
    };
  };

  const generateContextualSuggestions = (userMessage: string): string[] => {
    if (userMessage.includes('タスク')) {
      return ['タスクの優先順位を教えて', 'タスクを完了にして', '新しいタスクを追加'];
    } else if (userMessage.includes('スケジュール')) {
      return ['明日の予定は？', '会議時間を調整して', '空き時間を見つけて'];
    } else if (userMessage.includes('集中')) {
      return ['他の集中時間も作って', '邪魔されない設定にして', '集中力を測定して'];
    } else {
      return ['もっと詳しく教えて', '他の提案は？', '設定を変更したい'];
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const assistantResponse = await processMessage(inputMessage);
      setMessages(prev => [...prev, assistantResponse]);
    } catch (error) {
      console.error('Failed to process message:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: '申し訳ありません。少し問題が発生しました。もう一度お試しください。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const startListening = () => {
    if (speechRecognition.current) {
      setIsListening(true);
      speechRecognition.current.start();
    }
  };

  const stopListening = () => {
    if (speechRecognition.current) {
      speechRecognition.current.stop();
      setIsListening(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleActionClick = (action: MessageAction) => {
    // アクション実行の模擬処理
    console.log('Action executed:', action);
    
    const actionMessage: ChatMessage = {
      id: `action-${Date.now()}`,
      type: 'assistant',
      content: `✅ 「${action.label}」を実行しました。`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, actionMessage]);
  };

  if (minimized) {
    return (
      <Card className={`fixed bottom-4 right-4 w-64 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-blue-500" />
              <span className="font-medium text-sm">AIアシスタント</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMinimizeToggle?.(!minimized)}
                className="h-6 w-6 p-0"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-96 h-[500px] flex flex-col ${className}`}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <span>AIアシスタント</span>
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMinimizeToggle?.(!minimized)}
              className="h-6 w-6 p-0"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {message.content}
                  </pre>
                </div>
                
                {/* アクションボタン */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.actions.map((action) => (
                      <Button
                        key={action.id}
                        size="sm"
                        variant="outline"
                        onClick={() => handleActionClick(action)}
                        className="w-full text-xs justify-start"
                      >
                        {action.type === 'create_task' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {action.type === 'schedule_event' && <Clock className="h-3 w-3 mr-1" />}
                        {action.type === 'optimize' && <Sparkles className="h-3 w-3 mr-1" />}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* 提案 */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs h-6 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="mt-1 text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString('ja-JP', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>

              <div className={`${message.type === 'user' ? 'order-1 mr-2' : 'order-2 ml-2'} mt-2`}>
                {message.type === 'user' ? (
                  <User className="h-6 w-6 text-gray-600" />
                ) : (
                  <Bot className="h-6 w-6 text-blue-500" />
                )}
              </div>
            </div>
          ))}

          {/* タイピングインジケータ */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2">
                <Bot className="h-6 w-6 text-blue-500" />
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div className="border-t p-4">
          {/* 提案チップ */}
          {suggestions.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs h-6 px-2 bg-gray-50 hover:bg-gray-100"
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  {suggestion}
                </Button>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="メッセージを入力..."
                className="w-full p-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={isListening ? stopListening : startListening}
              className={`h-8 w-8 p-0 ${isListening ? 'text-red-500' : 'text-gray-400'}`}
            >
              {isListening ? (
                <MicOff className="h-4 w-4 animate-pulse" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isTyping}
              size="sm"
              className="h-8 w-8 p-0"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
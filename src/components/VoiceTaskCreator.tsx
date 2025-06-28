"use client";
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface VoiceTaskCreatorProps {
  onTaskCreated?: (task: ParsedTask) => void;
  className?: string;
}

interface ParsedTask {
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  assignee?: string;
  project?: string;
  estimatedHours?: number;
}

export default function VoiceTaskCreator({ onTaskCreated, className }: VoiceTaskCreatorProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize Speech Recognition API if available
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ja-JP';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        processVoiceInput(transcript);
      };

      recognition.onerror = (event) => {
        setError(`音声認識エラー: ${event.error}`);
        setIsRecording(false);
        setIsProcessing(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setSuccess(false);
    setParsedTask(null);
    setTranscript('');

    if (recognitionRef.current) {
      setIsRecording(true);
      recognitionRef.current.start();
    } else {
      setError('音声認識がサポートされていません。最新のChrome/Edgeブラウザを使用してください。');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const processVoiceInput = async (text: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Call AI processing API to parse natural language
      const response = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('タスク解析に失敗しました');
      }

      const result = await response.json();
      
      if (result.success) {
        setParsedTask(result.task);
      } else {
        throw new Error(result.error || 'タスクの解析に失敗しました');
      }
    } catch (error) {
      // Fallback: Simple rule-based parsing
      const fallbackTask = parseTaskFallback(text);
      setParsedTask(fallbackTask);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback natural language processing
  const parseTaskFallback = (text: string): ParsedTask => {
    const lowerText = text.toLowerCase();
    
    // Extract title (remove time expressions and common words)
    let title = text.replace(/明日まで|今日まで|来週まで|月曜まで|火曜まで|水曜まで|木曜まで|金曜まで|土曜まで|日曜まで/g, '')
                   .replace(/高優先度|低優先度|緊急|急ぎ/g, '')
                   .replace(/を|に|の|で|から|まで/g, ' ')
                   .trim();

    // Extract due date
    let dueDate: string | undefined;
    const today = new Date();
    
    if (lowerText.includes('明日')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      dueDate = tomorrow.toISOString().split('T')[0];
    } else if (lowerText.includes('今日')) {
      dueDate = today.toISOString().split('T')[0];
    } else if (lowerText.includes('来週')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      dueDate = nextWeek.toISOString().split('T')[0];
    }

    // Extract priority
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (lowerText.includes('緊急') || lowerText.includes('急ぎ') || lowerText.includes('高優先度')) {
      priority = 'HIGH';
    } else if (lowerText.includes('低優先度') || lowerText.includes('余裕')) {
      priority = 'LOW';
    }

    // Estimate time based on task type
    let estimatedHours = 1;
    if (lowerText.includes('資料作成') || lowerText.includes('レポート') || lowerText.includes('文書')) {
      estimatedHours = 2;
    } else if (lowerText.includes('会議') || lowerText.includes('ミーティング')) {
      estimatedHours = 1;
    } else if (lowerText.includes('企画') || lowerText.includes('計画') || lowerText.includes('設計')) {
      estimatedHours = 3;
    }

    return {
      title: title || text,
      dueDate,
      priority,
      estimatedHours,
      description: `音声入力により作成: "${text}"`
    };
  };

  const createTask = async () => {
    if (!parsedTask) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsedTask,
          status: 'PLAN',
          userId: 'voice-user' // This should be the actual user ID
        })
      });

      if (!response.ok) {
        throw new Error('タスクの作成に失敗しました');
      }

      const createdTask = await response.json();
      setSuccess(true);
      
      if (onTaskCreated) {
        onTaskCreated(parsedTask);
      }

      // Reset form after success
      setTimeout(() => {
        setSuccess(false);
        setParsedTask(null);
        setTranscript('');
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'タスクの作成に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card variant="elevated" padding="normal" className={className}>
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🎤 音声でタスク作成
          </h3>
          <p className="text-sm text-gray-600">
            「明日までにA社の資料作成」のように話してください
          </p>
        </div>

        {/* Voice Recording Button */}
        <div className="flex justify-center">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white shadow-lg transition-all duration-200`}
          >
            {isRecording ? (
              <MicOff className="w-8 h-8" />
            ) : isProcessing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>
        </div>

        {/* Status Messages */}
        {isRecording && (
          <div className="text-center text-red-600 font-medium">
            🔴 録音中... 話してください
          </div>
        )}

        {isProcessing && (
          <div className="text-center text-blue-600 font-medium">
            🤖 AIが音声を分析中...
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">認識されたテキスト:</p>
            <p className="font-medium text-gray-900">"{transcript}"</p>
          </div>
        )}

        {/* Parsed Task Preview */}
        {parsedTask && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <h4 className="font-semibold text-blue-900">解析結果</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div><strong>タスク名:</strong> {parsedTask.title}</div>
              {parsedTask.dueDate && (
                <div><strong>期限:</strong> {new Date(parsedTask.dueDate).toLocaleDateString('ja-JP')}</div>
              )}
              <div><strong>優先度:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  parsedTask.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                  parsedTask.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {parsedTask.priority === 'HIGH' ? '高' : parsedTask.priority === 'MEDIUM' ? '中' : '低'}
                </span>
              </div>
              {parsedTask.estimatedHours && (
                <div><strong>予想時間:</strong> {parsedTask.estimatedHours}時間</div>
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button
                onClick={createTask}
                disabled={isProcessing}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    作成中...
                  </>
                ) : (
                  'タスク作成'
                )}
              </Button>
              <Button
                onClick={() => setParsedTask(null)}
                variant="outline"
                className="px-4"
              >
                キャンセル
              </Button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">タスクが正常に作成されました！</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Usage Examples */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>使用例:</strong></p>
          <p>• 「明日までにA社の資料作成」</p>
          <p>• 「来週までに緊急でシステム改修」</p>
          <p>• 「今日中に会議の準備を低優先度で」</p>
        </div>
      </div>
    </Card>
  );
}
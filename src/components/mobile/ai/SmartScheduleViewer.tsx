'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  User,
  MapPin,
  RefreshCw,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

interface ScheduleItem {
  id: string;
  type: 'task' | 'meeting' | 'break' | 'focus' | 'review';
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  aiOptimized: boolean;
  productivityScore?: number;
  location?: string;
  attendees?: string[];
  suggestions?: string[];
}

interface OptimizationSuggestion {
  id: string;
  type: 'reorder' | 'reschedule' | 'break' | 'focus';
  title: string;
  description: string;
  impact: number; // 1-10
  confidence: number; // 0-1
}

interface SmartScheduleViewerProps {
  className?: string;
  date?: Date;
  onItemClick?: (item: ScheduleItem) => void;
  onOptimizationApply?: (suggestions: OptimizationSuggestion[]) => void;
}

export default function SmartScheduleViewer({ 
  className = '', 
  date = new Date(),
  onItemClick,
  onOptimizationApply
}: SmartScheduleViewerProps) {
  const [selectedDate, setSelectedDate] = useState(date);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSchedule(selectedDate);
    
    // 現在時刻を1分ごとに更新
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, [selectedDate]);

  useEffect(() => {
    // 現在時刻までスクロール
    scrollToCurrentTime();
  }, [scheduleItems, viewMode]);

  const loadSchedule = async (date: Date) => {
    setLoading(true);
    try {
      // AI最適化されたスケジュールの模擬データ
      const mockSchedule: ScheduleItem[] = [
        {
          id: '1',
          type: 'focus',
          title: 'ディープワーク時間',
          description: 'プレゼンテーション資料作成に集中',
          startTime: '09:00',
          endTime: '10:30',
          duration: 90,
          priority: 'high',
          status: 'pending',
          aiOptimized: true,
          productivityScore: 95,
          suggestions: ['最高の集中力を発揮できる時間帯です', 'インターラプションを最小化推奨']
        },
        {
          id: '2',
          type: 'break',
          title: 'エネルギー回復休憩',
          description: '15分間の積極的休憩',
          startTime: '10:30',
          endTime: '10:45',
          duration: 15,
          priority: 'medium',
          status: 'pending',
          aiOptimized: true,
          productivityScore: 85,
          suggestions: ['軽い運動または瞑想を推奨']
        },
        {
          id: '3',
          type: 'meeting',
          title: 'チームスタンドアップ',
          description: 'プロジェクト進捗確認',
          startTime: '11:00',
          endTime: '11:30',
          duration: 30,
          priority: 'high',
          status: 'pending',
          aiOptimized: false,
          location: '会議室A',
          attendees: ['田中さん', '佐藤さん', '山田さん']
        },
        {
          id: '4',
          type: 'task',
          title: 'メール処理',
          description: '優先度の高いメールに対応',
          startTime: '11:30',
          endTime: '12:00',
          duration: 30,
          priority: 'medium',
          status: 'pending',
          aiOptimized: true,
          productivityScore: 75,
          suggestions: ['集中力が低下する前の処理推奨']
        },
        {
          id: '5',
          type: 'break',
          title: 'ランチ休憩',
          startTime: '12:00',
          endTime: '13:00',
          duration: 60,
          priority: 'low',
          status: 'pending',
          aiOptimized: false
        },
        {
          id: '6',
          type: 'review',
          title: 'コードレビュー',
          description: 'プルリクエストの確認と承認',
          startTime: '13:00',
          endTime: '14:00',
          duration: 60,
          priority: 'high',
          status: 'pending',
          aiOptimized: true,
          productivityScore: 88,
          suggestions: ['午後の集中力活用に適している']
        },
        {
          id: '7',
          type: 'meeting',
          title: 'クライアント打ち合わせ',
          description: '要件確認とスケジュール調整',
          startTime: '14:30',
          endTime: '15:30',
          duration: 60,
          priority: 'high',
          status: 'pending',
          aiOptimized: false,
          location: 'オンライン',
          attendees: ['クライアントA', '営業部']
        }
      ];

      setScheduleItems(mockSchedule);
      generateOptimizationSuggestions(mockSchedule);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateOptimizationSuggestions = (items: ScheduleItem[]) => {
    const suggestions: OptimizationSuggestion[] = [
      {
        id: '1',
        type: 'reorder',
        title: 'タスク順序最適化',
        description: 'メール処理をミーティング前に移動すると効率が15%向上',
        impact: 7,
        confidence: 0.87
      },
      {
        id: '2',
        type: 'break',
        title: '休憩時間調整',
        description: '午後2時頃に10分の休憩を追加すると集中力が維持できます',
        impact: 6,
        confidence: 0.82
      },
      {
        id: '3',
        type: 'focus',
        title: 'ディープワーク拡張',
        description: '朝の集中時間を30分延長すると重要タスクが完了しやすくなります',
        impact: 8,
        confidence: 0.91
      }
    ];

    setOptimizationSuggestions(suggestions);
  };

  const scrollToCurrentTime = () => {
    if (!timelineRef.current) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 現在時刻に対応する位置を計算（9時を基準点とする）
    const baseHour = 9;
    const hourHeight = 80; // 1時間あたりの高さ
    const scrollPosition = Math.max(0, (currentHour - baseHour) * hourHeight + (currentMinute / 60) * hourHeight - 100);
    
    timelineRef.current.scrollTop = scrollPosition;
  };

  const formatTime = (time: string) => {
    return time;
  };

  const getItemColor = (item: ScheduleItem) => {
    if (item.aiOptimized) {
      switch (item.type) {
        case 'focus':
          return 'border-purple-500 bg-purple-50';
        case 'break':
          return 'border-green-500 bg-green-50';
        case 'review':
          return 'border-blue-500 bg-blue-50';
        default:
          return 'border-indigo-500 bg-indigo-50';
      }
    }
    
    switch (item.priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'focus':
        return <Zap className="h-4 w-4 text-purple-500" />;
      case 'break':
        return <RefreshCw className="h-4 w-4 text-green-500" />;
      case 'meeting':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'review':
        return <Eye className="h-4 w-4 text-indigo-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const baseHour = 9;
    const hourHeight = 80;
    
    return (currentHour - baseHour) * hourHeight + (currentMinute / 60) * hourHeight;
  };

  const isCurrentTime = (item: ScheduleItem) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMinute] = item.startTime.split(':').map(Number);
    const [endHour, endMinute] = item.endTime.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    return currentTime >= startTime && currentTime <= endTime;
  };

  const renderTimelineView = () => (
    <div className="relative h-96 overflow-y-auto" ref={timelineRef}>
      <div className="relative min-h-full">
        {/* 時間軸 */}
        <div className="absolute left-0 top-0 w-16 h-full border-r border-gray-200">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="h-20 flex items-start justify-center pt-2 text-xs text-gray-500">
              {String(9 + i).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* 現在時刻線 */}
        <div 
          className="absolute left-16 right-0 h-0.5 bg-red-500 z-10"
          style={{ top: `${getCurrentTimePosition()}px` }}
        >
          <div className="absolute -left-2 -top-1 w-4 h-3 bg-red-500 rounded-sm"></div>
        </div>

        {/* スケジュール項目 */}
        <div className="ml-16 relative">
          {scheduleItems.map((item, index) => {
            const [startHour, startMinute] = item.startTime.split(':').map(Number);
            const baseHour = 9;
            const hourHeight = 80;
            const top = (startHour - baseHour) * hourHeight + (startMinute / 60) * hourHeight;
            const height = (item.duration / 60) * hourHeight;

            return (
              <div
                key={item.id}
                className={`absolute left-2 right-2 rounded-lg border-2 p-2 cursor-pointer transition-all duration-200 hover:shadow-md ${getItemColor(item)} ${
                  isCurrentTime(item) ? 'ring-2 ring-red-400' : ''
                }`}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  minHeight: '40px'
                }}
                onClick={() => onItemClick?.(item)}
              >
                <div className="flex items-start justify-between h-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getTypeIcon(item.type)}
                      {item.aiOptimized && (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      )}
                      <span className="font-medium text-sm truncate">{item.title}</span>
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-1">
                      {formatTime(item.startTime)} - {formatTime(item.endTime)}
                    </div>
                    
                    {item.description && (
                      <div className="text-xs text-gray-500 truncate">
                        {item.description}
                      </div>
                    )}

                    {item.productivityScore && (
                      <div className="flex items-center space-x-1 mt-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">
                          {item.productivityScore}% 生産性
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(item.status)}
                    <Badge variant="secondary" className={`text-xs ${
                      item.priority === 'high' ? 'bg-red-100 text-red-800' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {scheduleItems.map((item) => (
        <div
          key={item.id}
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${getItemColor(item)} ${
            isCurrentTime(item) ? 'ring-2 ring-red-400' : ''
          }`}
          onClick={() => onItemClick?.(item)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getTypeIcon(item.type)}
              {item.aiOptimized && (
                <TrendingUp className="h-4 w-4 text-green-500" />
              )}
              <span className="font-medium text-sm">{item.title}</span>
            </div>
            {getStatusIcon(item.status)}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>{formatTime(item.startTime)} - {formatTime(item.endTime)}</span>
            <span>{item.duration}分</span>
          </div>

          {item.description && (
            <p className="text-xs text-gray-500 mb-2">{item.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className={`text-xs ${
                item.priority === 'high' ? 'bg-red-100 text-red-800' :
                item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {item.priority}
              </Badge>
              
              {item.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{item.location}</span>
                </div>
              )}
            </div>

            {item.productivityScore && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">
                  {item.productivityScore}%
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span>スマートスケジュール</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'timeline' ? 'list' : 'timeline')}
            >
              {viewMode === 'timeline' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOptimizations(!showOptimizations)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 日付ナビゲーション */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="font-medium text-sm">
            {selectedDate.toLocaleDateString('ja-JP', { 
              month: 'long', 
              day: 'numeric',
              weekday: 'short'
            })}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* AI最適化提案 */}
        {showOptimizations && optimizationSuggestions.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm text-blue-800">AI最適化提案</h4>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onOptimizationApply?.(optimizationSuggestions)}
                className="text-xs"
              >
                全て適用
              </Button>
            </div>
            <div className="space-y-2">
              {optimizationSuggestions.slice(0, 2).map((suggestion) => (
                <div key={suggestion.id} className="text-xs">
                  <div className="font-medium text-blue-700">{suggestion.title}</div>
                  <div className="text-blue-600">{suggestion.description}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      効果: {suggestion.impact}/10
                    </Badge>
                    <span className="text-blue-500">
                      {Math.round(suggestion.confidence * 100)}% 確信度
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          viewMode === 'timeline' ? renderTimelineView() : renderListView()
        )}

        {/* 統計情報 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {scheduleItems.filter(item => item.aiOptimized).length}
              </div>
              <div className="text-xs text-gray-500">AI最適化</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {Math.round(scheduleItems.reduce((acc, item) => acc + (item.productivityScore || 0), 0) / scheduleItems.length) || 0}%
              </div>
              <div className="text-xs text-gray-500">予測生産性</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">
                {Math.round(scheduleItems.reduce((acc, item) => acc + item.duration, 0) / 60 * 10) / 10}h
              </div>
              <div className="text-xs text-gray-500">総作業時間</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
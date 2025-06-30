// Phase 3: Real-time Dashboard with WebSocket updates
"use client";

import { useEffect, useState, useRef } from 'react';
import { Activity, Zap, TrendingUp, Users, AlertCircle, CheckCircle, Clock, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface RealtimeEvent {
  id: string;
  type: 'task-completed' | 'project-updated' | 'user-joined' | 'risk-alert' | 'revenue-update' | 'notification';
  timestamp: string;
  userId?: string;
  userName?: string;
  data: {
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    value?: number;
    change?: number;
  };
}

interface LiveMetrics {
  activeUsers: number;
  tasksCompleted: number;
  projectsInProgress: number;
  revenue: number;
  riskScore: number;
  responseTime: number;
}

interface RealTimeDashboardProps {
  className?: string;
}

export default function RealTimeDashboard({ className }: RealTimeDashboardProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [metrics, setMetrics] = useState<LiveMetrics>({
    activeUsers: 0,
    tasksCompleted: 0,
    projectsInProgress: 0,
    revenue: 0,
    riskScore: 0,
    responseTime: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<number | null>(null);

  // WebSocket接続とリアルタイム更新
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      cleanup();
    };
  }, []);

  const connectWebSocket = () => {
    try {
      // WebSocket接続（実際のプロダクション環境では適切なURLに変更）
      const wsUrl = process.env.NODE_ENV === 'development' 
        ? 'ws://localhost:3000/ws' 
        : `wss://${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🟢 Real-time WebSocket connected');
        setIsConnected(true);
        
        // 定期的にpingを送信
        pingIntervalRef.current = window.setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        // 初期データリクエスト
        wsRef.current?.send(JSON.stringify({ 
          type: 'subscribe',
          channels: ['metrics', 'events', 'alerts']
        }));
      };

      wsRef.current.onmessage = (message) => {
        try {
          const data = JSON.parse(message.data);
          handleRealtimeMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔴 WebSocket disconnected');
        setIsConnected(false);
        
        // 自動再接続
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Reconnecting WebSocket...');
          connectWebSocket();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      // フォールバック: ポーリング
      startPollingFallback();
    }
  };

  const handleRealtimeMessage = (data: any) => {
    switch (data.type) {
      case 'metrics-update':
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          ...data.payload
        }));
        break;

      case 'new-event':
        setEvents(prevEvents => {
          const newEvent = data.payload as RealtimeEvent;
          return [newEvent, ...prevEvents.slice(0, 19)]; // 最新20件を保持
        });
        
        // 重要なイベントの通知
        if (data.payload.data.priority === 'critical') {
          showDesktopNotification(data.payload);
        }
        break;

      case 'bulk-update':
        if (data.payload.metrics) {
          setMetrics(data.payload.metrics);
        }
        if (data.payload.events) {
          setEvents(data.payload.events);
        }
        break;

      case 'pong':
        // Keep-alive response
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const showDesktopNotification = (event: RealtimeEvent) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(event.data.title, {
        body: event.data.description,
        icon: '/icons/icon-192x192.png',
        tag: event.id
      });
    }
  };

  const startPollingFallback = () => {
    console.log('🔄 Starting polling fallback...');
    
    const poll = async () => {
      try {
        const [metricsRes, eventsRes] = await Promise.all([
          fetch('/api/realtime/metrics'),
          fetch('/api/realtime/events')
        ]);

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData);
        }
      } catch (error) {
        console.error('Polling failed:', error);
      }
    };

    // 初回実行
    poll();
    
    // 30秒間隔でポーリング
    const pollInterval = setInterval(poll, 30000);
    
    return () => clearInterval(pollInterval);
  };

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'task-completed':
        return CheckCircle;
      case 'project-updated':
        return Target;
      case 'user-joined':
        return Users;
      case 'risk-alert':
        return AlertCircle;
      case 'revenue-update':
        return TrendingUp;
      default:
        return Activity;
    }
  };

  const getEventColor = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'currency':
        return `¥${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        return `${value}ms`;
      default:
        return value.toString();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 接続ステータス */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">リアルタイムダッシュボード</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'リアルタイム接続中' : 'オフライン'}
          </span>
          <Zap className={`w-4 h-4 ${isConnected ? 'text-green-500' : 'text-gray-400'}`} />
        </div>
      </div>

      {/* ライブメトリクス */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">アクティブユーザー</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.activeUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">完了タスク</p>
              <p className="text-2xl font-bold text-green-600">{metrics.tasksCompleted}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">進行中プロジェクト</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.projectsInProgress}</p>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">売上</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatValue(metrics.revenue, 'currency')}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">リスクスコア</p>
              <p className={`text-2xl font-bold ${
                metrics.riskScore > 7 ? 'text-red-600' : 
                metrics.riskScore > 4 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {formatValue(metrics.riskScore, 'percentage')}
              </p>
            </div>
            <AlertCircle className={`w-8 h-8 ${
              metrics.riskScore > 7 ? 'text-red-500' : 
              metrics.riskScore > 4 ? 'text-yellow-500' : 'text-green-500'
            }`} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">応答時間</p>
              <p className="text-2xl font-bold text-indigo-600">
                {formatValue(metrics.responseTime, 'time')}
              </p>
            </div>
            <Clock className="w-8 h-8 text-indigo-500" />
          </div>
        </Card>
      </div>

      {/* リアルタイムイベントフィード */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">リアルタイムイベント</h3>
          <Activity className="w-5 h-5 text-gray-500" />
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>イベントを監視中...</p>
            </div>
          ) : (
            events.map((event) => {
              const Icon = getEventIcon(event.type);
              return (
                <div
                  key={event.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${getEventColor(event.data.priority)}`}
                >
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{event.data.title}</p>
                      <span className="text-xs opacity-75">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs opacity-80 mt-1">{event.data.description}</p>
                    {event.userName && (
                      <p className="text-xs opacity-60 mt-1">by {event.userName}</p>
                    )}
                  </div>
                  {event.data.change && (
                    <div className={`text-xs font-medium ${
                      event.data.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {event.data.change > 0 ? '+' : ''}{event.data.change}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
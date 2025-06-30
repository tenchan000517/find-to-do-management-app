# リアルタイム機能 マニュアル

## 概要

リアルタイム機能は、WebSocket通信を基盤とした即座性の高いユーザー体験提供システムです。リアルタイム通知、ライブ更新、同期機能、リアルタイムコラボレーション、インスタント分析表示など、現代的なWebアプリケーションに必要な即時性機能を包括的に提供します。

### 主要特徴
- **WebSocket ベースリアルタイム通信**
- **インスタント通知システム**
- **ライブデータ更新機能**
- **リアルタイムコラボレーション**
- **即時分析結果表示**

---

## 目次

1. [システムアーキテクチャ](#システムアーキテクチャ)
2. [WebSocket通信基盤](#websocket通信基盤)
3. [リアルタイム通知システム](#リアルタイム通知システム)
4. [ライブデータ更新](#ライブデータ更新)
5. [同期機能](#同期機能)
6. [コラボレーション機能](#コラボレーション機能)
7. [リアルタイム分析](#リアルタイム分析)
8. [実装例](#実装例)
9. [パフォーマンス最適化](#パフォーマンス最適化)
10. [トラブルシューティング](#トラブルシューティング)

---

## システムアーキテクチャ

### 全体構成

```javascript
// リアルタイム機能システムの構成
const RealtimeArchitecture = {
  // 通信基盤
  communicationLayer: {
    websocketServer: 'WebSocketManager',
    connectionPool: 'ConnectionPoolManager',
    messageQueue: 'MessageQueueService',
    sessionManager: 'RealtimeSessionManager'
  },
  
  // 機能サービス
  realtimeServices: {
    notifications: 'RealtimeNotificationService',
    dataSync: 'RealtimeDataSyncService',
    collaboration: 'RealtimeCollaborationService',
    analytics: 'RealtimeAnalyticsService',
    monitoring: 'RealtimeMonitoringService'
  },
  
  // UI・コンポーネント
  clientComponents: {
    realtimeDashboard: 'RealTimeDashboard',
    notificationCenter: 'NotificationCenter',
    liveUpdates: 'LiveUpdateComponent',
    collaborationTools: 'CollaborationTools',
    statusIndicator: 'RealtimeStatusIndicator'
  }
};

// RealtimeProvider のメイン構造
export function RealtimeProvider({ children }) {
  const {
    connection,
    connectionStatus,
    notifications,
    liveData,
    collaborators,
    sendMessage,
    subscribe,
    unsubscribe
  } = useRealtimeConnection();

  return (
    <RealtimeContext.Provider value={{
      connection,
      connectionStatus,
      notifications,
      liveData,
      collaborators,
      sendMessage,
      subscribe,
      unsubscribe
    }}>
      <RealtimeStatusBar status={connectionStatus} />
      <NotificationOverlay notifications={notifications} />
      {children}
    </RealtimeContext.Provider>
  );
}
```

### データフロー

```javascript
// リアルタイムデータフロー管理
const RealtimeDataFlow = {
  // データ収集
  dataCollection: {
    userActions: 'ユーザーアクション捕捉',
    systemEvents: 'システムイベント監視',
    externalAPIs: '外部API変更検知',
    databaseChanges: 'データベース変更追跡'
  },
  
  // 処理・配信
  processing: {
    eventProcessing: 'イベント処理エンジン',
    messageRouting: 'メッセージルーティング',
    dataFiltering: 'データフィルタリング',
    prioritization: '優先度付け処理'
  },
  
  // クライアント配信
  clientDelivery: {
    websocketPush: 'WebSocket プッシュ配信',
    uiUpdates: 'UI リアルタイム更新',
    notifications: '通知表示',
    dataSync: 'データ同期処理'
  }
};
```

---

## WebSocket通信基盤

### WebSocket マネージャー

```javascript
// WebSocket 管理システム
class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.rooms = new Map();
    this.messageHandlers = new Map();
    this.heartbeatInterval = 30000; // 30秒
  }

  async initializeServer(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.startHeartbeat();
    
    console.log('WebSocket サーバーが初期化されました');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`クライアント接続: ${socket.id}`);
      
      // 接続登録
      this.registerConnection(socket);
      
      // 基本イベントハンドラー設定
      socket.on('authenticate', (data) => this.handleAuthentication(socket, data));
      socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
      socket.on('leave-room', (data) => this.handleLeaveRoom(socket, data));
      socket.on('message', (data) => this.handleMessage(socket, data));
      socket.on('heartbeat', () => this.handleHeartbeat(socket));
      socket.on('disconnect', () => this.handleDisconnection(socket));
      
      // カスタムイベントハンドラー登録
      this.registerCustomHandlers(socket);
    });
  }

  registerConnection(socket) {
    const connection = {
      id: socket.id,
      socket,
      userId: null,
      rooms: new Set(),
      lastHeartbeat: Date.now(),
      metadata: {}
    };
    
    this.connections.set(socket.id, connection);
    
    // 接続通知
    this.emit('connection-established', {
      connectionId: socket.id,
      timestamp: new Date()
    });
  }

  async handleAuthentication(socket, authData) {
    try {
      // JWT トークン検証
      const user = await this.verifyToken(authData.token);
      
      const connection = this.connections.get(socket.id);
      if (connection) {
        connection.userId = user.id;
        connection.metadata = {
          username: user.username,
          role: user.role,
          connectedAt: new Date()
        };
        
        // 認証成功通知
        socket.emit('authenticated', {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        });
        
        // ユーザー専用ルームに参加
        await this.joinRoom(socket.id, `user:${user.id}`);
        
        console.log(`ユーザー認証完了: ${user.username} (${socket.id})`);
      }
      
    } catch (error) {
      socket.emit('authentication-failed', {
        error: 'Invalid token'
      });
      console.error('認証失敗:', error);
    }
  }

  async joinRoom(connectionId, roomName) {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    // ルーム作成・参加
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    
    this.rooms.get(roomName).add(connectionId);
    connection.rooms.add(roomName);
    connection.socket.join(roomName);
    
    // ルーム参加通知
    this.broadcastToRoom(roomName, 'user-joined', {
      connectionId,
      userId: connection.userId,
      username: connection.metadata.username,
      roomName,
      timestamp: new Date()
    }, connectionId);
    
    return true;
  }

  broadcastToRoom(roomName, event, data, excludeConnectionId = null) {
    const room = this.rooms.get(roomName);
    if (!room) return;

    room.forEach(connectionId => {
      if (connectionId !== excludeConnectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
          connection.socket.emit(event, data);
        }
      }
    });
  }

  broadcastToUser(userId, event, data) {
    const userRoom = `user:${userId}`;
    this.io.to(userRoom).emit(event, data);
  }

  emit(event, data) {
    this.io.emit(event, data);
  }

  startHeartbeat() {
    setInterval(() => {
      const now = Date.now();
      
      this.connections.forEach((connection, connectionId) => {
        // 死活確認
        if (now - connection.lastHeartbeat > this.heartbeatInterval * 2) {
          console.log(`接続タイムアウト: ${connectionId}`);
          this.handleDisconnection(connection.socket);
        } else {
          // ハートビート送信
          connection.socket.emit('heartbeat-ping');
        }
      });
    }, this.heartbeatInterval);
  }

  handleHeartbeat(socket) {
    const connection = this.connections.get(socket.id);
    if (connection) {
      connection.lastHeartbeat = Date.now();
    }
  }

  handleDisconnection(socket) {
    const connection = this.connections.get(socket.id);
    if (!connection) return;

    // ルームから退出
    connection.rooms.forEach(roomName => {
      const room = this.rooms.get(roomName);
      if (room) {
        room.delete(socket.id);
        
        // 退出通知
        this.broadcastToRoom(roomName, 'user-left', {
          connectionId: socket.id,
          userId: connection.userId,
          username: connection.metadata.username,
          roomName,
          timestamp: new Date()
        });
        
        // 空のルーム削除
        if (room.size === 0) {
          this.rooms.delete(roomName);
        }
      }
    });

    // 接続削除
    this.connections.delete(socket.id);
    
    console.log(`クライアント切断: ${socket.id}`);
  }
}
```

### クライアント側 WebSocket フック

```javascript
// useRealtimeConnection フック
export function useRealtimeConnection() {
  const [socket, setSocket] = React.useState(null);
  const [connectionStatus, setConnectionStatus] = React.useState('disconnected');
  const [notifications, setNotifications] = React.useState([]);
  const [liveData, setLiveData] = React.useState(new Map());
  const [collaborators, setCollaborators] = React.useState([]);

  React.useEffect(() => {
    // WebSocket 接続初期化
    const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      forceNew: true
    });

    setSocket(newSocket);

    // 接続イベントハンドラー
    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      console.log('WebSocket 接続確立');
      
      // 認証実行
      const token = localStorage.getItem('auth_token');
      if (token) {
        newSocket.emit('authenticate', { token });
      }
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      console.log('WebSocket 接続切断');
    });

    newSocket.on('authenticated', (data) => {
      setConnectionStatus('authenticated');
      console.log('認証完了:', data.user);
    });

    newSocket.on('authentication-failed', () => {
      setConnectionStatus('authentication-failed');
      console.error('認証失敗');
    });

    // リアルタイム通知
    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50));
    });

    // ライブデータ更新
    newSocket.on('data-update', ({ key, data }) => {
      setLiveData(prev => new Map(prev.set(key, data)));
    });

    // コラボレーター更新
    newSocket.on('user-joined', (user) => {
      setCollaborators(prev => [...prev.filter(c => c.id !== user.userId), user]);
    });

    newSocket.on('user-left', (user) => {
      setCollaborators(prev => prev.filter(c => c.id !== user.userId));
    });

    // ハートビート
    newSocket.on('heartbeat-ping', () => {
      newSocket.emit('heartbeat');
    });

    // クリーンアップ
    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = React.useCallback((event, data) => {
    if (socket && connectionStatus === 'authenticated') {
      socket.emit(event, data);
    }
  }, [socket, connectionStatus]);

  const subscribe = React.useCallback((event, handler) => {
    if (socket) {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    }
  }, [socket]);

  const unsubscribe = React.useCallback((event, handler) => {
    if (socket) {
      socket.off(event, handler);
    }
  }, [socket]);

  const joinRoom = React.useCallback((roomName) => {
    sendMessage('join-room', { roomName });
  }, [sendMessage]);

  const leaveRoom = React.useCallback((roomName) => {
    sendMessage('leave-room', { roomName });
  }, [sendMessage]);

  return {
    socket,
    connectionStatus,
    notifications,
    liveData,
    collaborators,
    sendMessage,
    subscribe,
    unsubscribe,
    joinRoom,
    leaveRoom
  };
}
```

---

## リアルタイム通知システム

### 通知サービス

```javascript
// リアルタイム通知サービス
class RealtimeNotificationService {
  constructor(websocketManager) {
    this.wsManager = websocketManager;
    this.notificationQueue = new Map(); // ユーザーID -> 通知リスト
    this.subscriptions = new Map(); // 通知タイプ -> ユーザーリスト
  }

  async sendNotification(userId, notification) {
    try {
      // 通知データの構造化
      const formattedNotification = {
        id: this.generateNotificationId(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        priority: notification.priority || 'normal',
        timestamp: new Date(),
        read: false,
        actions: notification.actions || []
      };

      // リアルタイム配信
      this.wsManager.broadcastToUser(userId, 'notification', formattedNotification);

      // 通知履歴保存
      await this.saveNotificationHistory(userId, formattedNotification);

      // オフラインユーザー用キューイング
      if (!this.isUserOnline(userId)) {
        this.queueNotificationForOfflineUser(userId, formattedNotification);
      }

      return formattedNotification;

    } catch (error) {
      console.error('通知送信エラー:', error);
      throw new Error('通知の送信に失敗しました');
    }
  }

  async sendBulkNotification(userIds, notification) {
    const promises = userIds.map(userId => 
      this.sendNotification(userId, notification)
    );
    
    return await Promise.allSettled(promises);
  }

  async sendBroadcastNotification(notification, filter = null) {
    // 全ユーザーに通知送信（フィルター適用可能）
    const users = await this.getActiveUsers(filter);
    return await this.sendBulkNotification(users.map(u => u.id), notification);
  }

  subscribeToNotificationType(userId, notificationType) {
    if (!this.subscriptions.has(notificationType)) {
      this.subscriptions.set(notificationType, new Set());
    }
    this.subscriptions.get(notificationType).add(userId);
  }

  unsubscribeFromNotificationType(userId, notificationType) {
    const subscribers = this.subscriptions.get(notificationType);
    if (subscribers) {
      subscribers.delete(userId);
    }
  }

  async sendTypedNotification(notificationType, notification) {
    const subscribers = this.subscriptions.get(notificationType);
    if (subscribers && subscribers.size > 0) {
      return await this.sendBulkNotification(Array.from(subscribers), {
        ...notification,
        type: notificationType
      });
    }
  }

  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isUserOnline(userId) {
    // WebSocket 接続確認
    const userRoom = `user:${userId}`;
    const room = this.wsManager.rooms.get(userRoom);
    return room && room.size > 0;
  }

  queueNotificationForOfflineUser(userId, notification) {
    if (!this.notificationQueue.has(userId)) {
      this.notificationQueue.set(userId, []);
    }
    this.notificationQueue.get(userId).push(notification);
  }

  async deliverQueuedNotifications(userId) {
    const queuedNotifications = this.notificationQueue.get(userId);
    if (queuedNotifications && queuedNotifications.length > 0) {
      // キューされた通知を順次配信
      for (const notification of queuedNotifications) {
        this.wsManager.broadcastToUser(userId, 'notification', notification);
      }
      
      // キューをクリア
      this.notificationQueue.delete(userId);
    }
  }
}
```

### 通知センターコンポーネント

```javascript
// 通知センターコンポーネント
export function NotificationCenter() {
  const { notifications, sendMessage } = useRealtimeConnection();
  const [filter, setFilter] = React.useState('all');
  const [expandedNotification, setExpandedNotification] = React.useState(null);

  const filteredNotifications = React.useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  const markAsRead = React.useCallback((notificationId) => {
    sendMessage('mark-notification-read', { notificationId });
  }, [sendMessage]);

  const markAllAsRead = React.useCallback(() => {
    sendMessage('mark-all-notifications-read', {});
  }, [sendMessage]);

  const executeAction = React.useCallback((notificationId, actionId) => {
    sendMessage('execute-notification-action', { notificationId, actionId });
  }, [sendMessage]);

  return (
    <Card className="w-96 max-h-96 overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">通知</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {notifications.filter(n => !n.read).length}
            </Badge>
            <Button size="sm" variant="ghost" onClick={markAllAsRead}>
              全て既読
            </Button>
          </div>
        </div>

        {/* フィルター */}
        <div className="flex space-x-2">
          {['all', 'task', 'calendar', 'system', 'social'].map((filterType) => (
            <Button
              key={filterType}
              size="sm"
              variant={filter === filterType ? 'default' : 'outline'}
              onClick={() => setFilter(filterType)}
            >
              {getFilterLabel(filterType)}
            </Button>
          ))}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>通知はありません</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => {
                  if (!notification.read) markAsRead(notification.id);
                  setExpandedNotification(
                    expandedNotification === notification.id ? null : notification.id
                  );
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <NotificationIcon type={notification.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.timestamp))}前
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>

                    {/* 優先度インジケーター */}
                    {notification.priority === 'high' && (
                      <Badge variant="destructive" className="mt-2 text-xs">
                        高優先度
                      </Badge>
                    )}

                    {/* 展開詳細 */}
                    {expandedNotification === notification.id && (
                      <div className="mt-3 pt-3 border-t">
                        {notification.data && Object.keys(notification.data).length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-xs font-medium text-gray-700 mb-1">詳細情報</h5>
                            <div className="text-xs text-gray-600 space-y-1">
                              {Object.entries(notification.data).map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* アクションボタン */}
                        {notification.actions && notification.actions.length > 0 && (
                          <div className="flex space-x-2">
                            {notification.actions.map((action) => (
                              <Button
                                key={action.id}
                                size="sm"
                                variant={action.style || 'outline'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  executeAction(notification.id, action.id);
                                }}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// 通知オーバーレイ（ポップアップ通知）
export function NotificationOverlay({ notifications }) {
  const [visibleNotifications, setVisibleNotifications] = React.useState([]);

  React.useEffect(() => {
    // 新しい通知があればポップアップ表示
    const newNotifications = notifications
      .filter(n => !n.read && n.priority === 'high')
      .slice(0, 3); // 最大3件まで表示

    setVisibleNotifications(newNotifications);

    // 5秒後に自動消去
    const timer = setTimeout(() => {
      setVisibleNotifications([]);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications]);

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80 max-w-96 animate-slideInRight"
        >
          <div className="flex items-start space-x-3">
            <NotificationIcon type={notification.type} />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setVisibleNotifications(prev => 
                prev.filter(n => n.id !== notification.id)
              )}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## ライブデータ更新

### ライブデータ同期サービス

```javascript
// ライブデータ同期サービス
class RealtimeDataSyncService {
  constructor(websocketManager) {
    this.wsManager = websocketManager;
    this.subscriptions = new Map(); // データキー -> 購読者リスト
    this.dataCache = new Map(); // データキャッシュ
    this.syncInterval = 1000; // 1秒間隔
  }

  subscribe(dataKey, userId, options = {}) {
    if (!this.subscriptions.has(dataKey)) {
      this.subscriptions.set(dataKey, new Map());
    }
    
    this.subscriptions.get(dataKey).set(userId, {
      ...options,
      subscribedAt: new Date()
    });

    // 現在のデータを即座に送信
    const currentData = this.dataCache.get(dataKey);
    if (currentData) {
      this.wsManager.broadcastToUser(userId, 'data-update', {
        key: dataKey,
        data: currentData,
        timestamp: new Date()
      });
    }

    console.log(`データ購読開始: ${dataKey} by user ${userId}`);
  }

  unsubscribe(dataKey, userId) {
    const subscribers = this.subscriptions.get(dataKey);
    if (subscribers) {
      subscribers.delete(userId);
      
      // 購読者がいなくなったらキー削除
      if (subscribers.size === 0) {
        this.subscriptions.delete(dataKey);
        this.dataCache.delete(dataKey);
      }
    }

    console.log(`データ購読解除: ${dataKey} by user ${userId}`);
  }

  async updateData(dataKey, newData, source = 'system') {
    try {
      // データ変更検出
      const previousData = this.dataCache.get(dataKey);
      const hasChanged = !this.isDataEqual(previousData, newData);

      if (hasChanged) {
        // キャッシュ更新
        this.dataCache.set(dataKey, {
          ...newData,
          lastUpdated: new Date(),
          updatedBy: source
        });

        // 購読者に配信
        await this.broadcastDataUpdate(dataKey, newData);

        // 変更ログ記録
        await this.logDataChange(dataKey, previousData, newData, source);
      }

      return { success: true, changed: hasChanged };

    } catch (error) {
      console.error('データ更新エラー:', error);
      throw new Error('データの更新に失敗しました');
    }
  }

  async broadcastDataUpdate(dataKey, data) {
    const subscribers = this.subscriptions.get(dataKey);
    if (!subscribers) return;

    const updateMessage = {
      key: dataKey,
      data,
      timestamp: new Date()
    };

    // 各購読者に配信
    for (const [userId, subscription] of subscribers) {
      try {
        // フィルター適用（設定されている場合）
        let filteredData = data;
        if (subscription.filter) {
          filteredData = await this.applyDataFilter(data, subscription.filter);
        }

        this.wsManager.broadcastToUser(userId, 'data-update', {
          ...updateMessage,
          data: filteredData
        });

      } catch (error) {
        console.error(`データ配信エラー (User: ${userId}):`, error);
      }
    }
  }

  isDataEqual(data1, data2) {
    return JSON.stringify(data1) === JSON.stringify(data2);
  }

  async applyDataFilter(data, filter) {
    // フィルター処理実装
    if (typeof filter === 'function') {
      return filter(data);
    }
    
    if (typeof filter === 'object' && filter.fields) {
      // フィールド選択フィルター
      const filtered = {};
      filter.fields.forEach(field => {
        if (data[field] !== undefined) {
          filtered[field] = data[field];
        }
      });
      return filtered;
    }

    return data;
  }

  // 定期的なデータ同期
  startPeriodicSync() {
    setInterval(async () => {
      for (const dataKey of this.subscriptions.keys()) {
        try {
          const freshData = await this.fetchFreshData(dataKey);
          if (freshData) {
            await this.updateData(dataKey, freshData, 'periodic-sync');
          }
        } catch (error) {
          console.error(`定期同期エラー (${dataKey}):`, error);
        }
      }
    }, this.syncInterval);
  }

  async fetchFreshData(dataKey) {
    // データキーに応じてデータ取得
    switch (dataKey) {
      case 'task-updates':
        return await this.fetchTaskUpdates();
      case 'calendar-events':
        return await this.fetchCalendarEvents();
      case 'system-metrics':
        return await this.fetchSystemMetrics();
      default:
        return null;
    }
  }
}
```

### ライブ更新コンポーネント

```javascript
// ライブ更新表示コンポーネント
export function LiveUpdateComponent({ dataKey, children, fallback = null }) {
  const { liveData, sendMessage } = useRealtimeConnection();
  const [data, setData] = React.useState(null);
  const [lastUpdate, setLastUpdate] = React.useState(null);
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  React.useEffect(() => {
    // データ購読開始
    sendMessage('subscribe-data', { 
      dataKey,
      options: {
        filter: { fields: ['id', 'title', 'status', 'updatedAt'] }
      }
    });
    setIsSubscribed(true);

    // 購読解除
    return () => {
      sendMessage('unsubscribe-data', { dataKey });
      setIsSubscribed(false);
    };
  }, [dataKey, sendMessage]);

  React.useEffect(() => {
    // ライブデータ監視
    const currentData = liveData.get(dataKey);
    if (currentData) {
      setData(currentData.data);
      setLastUpdate(new Date(currentData.timestamp));
    }
  }, [liveData, dataKey]);

  if (!isSubscribed || !data) {
    return fallback || <LiveUpdateSkeleton />;
  }

  return (
    <div className="relative">
      {/* 更新インジケーター */}
      <LiveUpdateIndicator lastUpdate={lastUpdate} />
      
      {/* 実際のコンテンツ */}
      {typeof children === 'function' ? children(data) : children}
    </div>
  );
}

// 更新インジケーター
export function LiveUpdateIndicator({ lastUpdate }) {
  const [showPulse, setShowPulse] = React.useState(false);

  React.useEffect(() => {
    if (lastUpdate) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  return (
    <div className="absolute top-2 right-2 z-10">
      <div className={`flex items-center space-x-1 text-xs ${
        showPulse ? 'text-green-600' : 'text-gray-500'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          showPulse ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`} />
        <span>
          {lastUpdate ? `${formatDistanceToNow(lastUpdate)}前` : 'オフライン'}
        </span>
      </div>
    </div>
  );
}

// スケルトンローダー
export function LiveUpdateSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
}

// リアルタイムリスト
export function RealtimeList({ dataKey, itemComponent: ItemComponent, emptyMessage = "データがありません" }) {
  return (
    <LiveUpdateComponent dataKey={dataKey}>
      {(data) => {
        if (!data.items || data.items.length === 0) {
          return (
            <div className="text-center py-8 text-gray-500">
              {emptyMessage}
            </div>
          );
        }

        return (
          <div className="space-y-2">
            {data.items.map((item, index) => (
              <ItemComponent 
                key={item.id || index} 
                item={item} 
                index={index}
              />
            ))}
          </div>
        );
      }}
    </LiveUpdateComponent>
  );
}

// リアルタイムカウンター
export function RealtimeCounter({ dataKey, label, format = (value) => value }) {
  return (
    <LiveUpdateComponent dataKey={dataKey}>
      {(data) => (
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {format(data.count || 0)}
          </div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      )}
    </LiveUpdateComponent>
  );
}
```

---

## 同期機能

### データ同期エンジン

```javascript
// データ同期エンジン
class DataSynchronizationEngine {
  constructor(websocketManager) {
    this.wsManager = websocketManager;
    this.syncQueues = new Map(); // エンティティタイプ -> 同期キュー
    this.conflictResolvers = new Map(); // 競合解決戦略
    this.lockManager = new Map(); // 排他制御
  }

  async synchronizeEntity(entityType, entityId, changes, userId) {
    try {
      // 排他制御チェック
      const lockKey = `${entityType}:${entityId}`;
      if (this.lockManager.has(lockKey)) {
        throw new Error('Entity is currently locked by another user');
      }

      // ロック取得
      this.lockManager.set(lockKey, {
        userId,
        lockedAt: new Date(),
        timeout: setTimeout(() => this.releaseLock(lockKey), 30000) // 30秒でタイムアウト
      });

      // 現在のデータ取得
      const currentData = await this.getCurrentEntityData(entityType, entityId);
      
      // 競合検出
      const conflicts = await this.detectConflicts(currentData, changes);
      
      if (conflicts.length > 0) {
        // 競合解決
        const resolvedChanges = await this.resolveConflicts(conflicts, changes, userId);
        changes = resolvedChanges;
      }

      // データベース更新
      const updatedData = await this.updateEntityInDatabase(entityType, entityId, changes);

      // 他のユーザーに同期
      await this.broadcastEntityUpdate(entityType, entityId, updatedData, userId);

      // ロック解除
      this.releaseLock(lockKey);

      return {
        success: true,
        data: updatedData,
        conflicts: conflicts.length,
        resolvedAt: new Date()
      };

    } catch (error) {
      console.error('同期エラー:', error);
      throw error;
    }
  }

  async detectConflicts(currentData, incomingChanges) {
    const conflicts = [];
    
    for (const [field, newValue] of Object.entries(incomingChanges)) {
      if (currentData[field] !== newValue && currentData.lastModified > incomingChanges.lastRead) {
        conflicts.push({
          field,
          currentValue: currentData[field],
          incomingValue: newValue,
          lastModified: currentData.lastModified
        });
      }
    }

    return conflicts;
  }

  async resolveConflicts(conflicts, changes, userId) {
    const resolvedChanges = { ...changes };

    for (const conflict of conflicts) {
      const resolver = this.conflictResolvers.get(conflict.field) || this.defaultConflictResolver;
      const resolution = await resolver(conflict, userId);
      
      if (resolution.action === 'use_current') {
        delete resolvedChanges[conflict.field];
      } else if (resolution.action === 'merge') {
        resolvedChanges[conflict.field] = resolution.mergedValue;
      }
      // 'use_incoming' の場合は何もしない（元の値を使用）
    }

    return resolvedChanges;
  }

  defaultConflictResolver(conflict, userId) {
    // デフォルト：より新しい変更を採用
    return {
      action: 'use_incoming',
      reason: 'Using most recent change'
    };
  }

  async broadcastEntityUpdate(entityType, entityId, updatedData, excludeUserId) {
    // 関連するユーザーを特定
    const interestedUsers = await this.getInterestedUsers(entityType, entityId);
    
    for (const user of interestedUsers) {
      if (user.id !== excludeUserId) {
        this.wsManager.broadcastToUser(user.id, 'entity-updated', {
          entityType,
          entityId,
          data: updatedData,
          updatedBy: excludeUserId,
          timestamp: new Date()
        });
      }
    }
  }

  releaseLock(lockKey) {
    const lock = this.lockManager.get(lockKey);
    if (lock) {
      clearTimeout(lock.timeout);
      this.lockManager.delete(lockKey);
    }
  }

  // オフライン同期サポート
  async queueOfflineChanges(userId, changes) {
    if (!this.syncQueues.has(userId)) {
      this.syncQueues.set(userId, []);
    }
    
    this.syncQueues.get(userId).push({
      ...changes,
      queuedAt: new Date()
    });
  }

  async processOfflineQueue(userId) {
    const queue = this.syncQueues.get(userId);
    if (!queue || queue.length === 0) return;

    const results = [];
    
    for (const queuedChange of queue) {
      try {
        const result = await this.synchronizeEntity(
          queuedChange.entityType,
          queuedChange.entityId,
          queuedChange.changes,
          userId
        );
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    // キューをクリア
    this.syncQueues.delete(userId);

    return results;
  }
}
```

### 同期状態表示

```javascript
// 同期状態表示コンポーネント
export function SyncStatusIndicator() {
  const { connectionStatus, sendMessage } = useRealtimeConnection();
  const [syncStatus, setSyncStatus] = React.useState('synced');
  const [pendingChanges, setPendingChanges] = React.useState(0);
  const [lastSync, setLastSync] = React.useState(null);

  React.useEffect(() => {
    // 同期状態の監視
    const handleSyncStatus = (status) => {
      setSyncStatus(status.status);
      setPendingChanges(status.pendingChanges || 0);
      setLastSync(status.lastSync ? new Date(status.lastSync) : null);
    };

    const unsubscribe = subscribe('sync-status', handleSyncStatus);
    return unsubscribe;
  }, []);

  const forcSync = () => {
    sendMessage('force-sync', {});
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'synced': return <Check className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'offline': return <Wifi className="w-4 h-4 text-gray-400" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSyncMessage = () => {
    switch (syncStatus) {
      case 'syncing': return '同期中...';
      case 'synced': return '同期済み';
      case 'error': return '同期エラー';
      case 'offline': return 'オフライン';
      default: return '待機中';
    }
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      {getSyncIcon()}
      <span className={`${
        syncStatus === 'error' ? 'text-red-600' : 
        syncStatus === 'synced' ? 'text-green-600' : 'text-gray-600'
      }`}>
        {getSyncMessage()}
      </span>
      
      {pendingChanges > 0 && (
        <Badge variant="outline" className="text-xs">
          {pendingChanges} 件待機
        </Badge>
      )}
      
      {lastSync && (
        <span className="text-xs text-gray-500">
          最終: {format(lastSync, 'HH:mm:ss')}
        </span>
      )}
      
      {syncStatus === 'error' && (
        <Button size="sm" variant="outline" onClick={forcSync}>
          再同期
        </Button>
      )}
    </div>
  );
}

// エンティティ別同期状態
export function EntitySyncStatus({ entityType, entityId }) {
  const [entitySyncStatus, setEntitySyncStatus] = React.useState(null);
  const { subscribe } = useRealtimeConnection();

  React.useEffect(() => {
    const handleEntitySync = (data) => {
      if (data.entityType === entityType && data.entityId === entityId) {
        setEntitySyncStatus(data);
      }
    };

    const unsubscribe = subscribe('entity-sync-status', handleEntitySync);
    return unsubscribe;
  }, [entityType, entityId, subscribe]);

  if (!entitySyncStatus) return null;

  return (
    <div className="text-xs text-gray-500 flex items-center space-x-1">
      {entitySyncStatus.isLocked && (
        <>
          <Lock className="w-3 h-3" />
          <span>編集中: {entitySyncStatus.lockedBy}</span>
        </>
      )}
      {entitySyncStatus.hasConflicts && (
        <>
          <AlertTriangle className="w-3 h-3 text-yellow-500" />
          <span>競合検出</span>
        </>
      )}
      {entitySyncStatus.lastUpdated && (
        <span>
          更新: {formatDistanceToNow(new Date(entitySyncStatus.lastUpdated))}前
        </span>
      )}
    </div>
  );
}
```

---

## コラボレーション機能

### リアルタイムコラボレーションエンジン

```javascript
// リアルタイムコラボレーションエンジン
class RealtimeCollaborationEngine {
  constructor(websocketManager) {
    this.wsManager = websocketManager;
    this.activeSessions = new Map(); // セッションID -> セッション情報
    this.cursorPositions = new Map(); // ユーザーID -> カーソル位置
    this.userPresence = new Map(); // ルーム -> ユーザープレゼンス
  }

  async startCollaborationSession(sessionId, userId, metadata = {}) {
    try {
      // セッション作成・参加
      if (!this.activeSessions.has(sessionId)) {
        this.activeSessions.set(sessionId, {
          id: sessionId,
          participants: new Map(),
          createdAt: new Date(),
          metadata
        });
      }

      const session = this.activeSessions.get(sessionId);
      
      // 参加者追加
      session.participants.set(userId, {
        userId,
        joinedAt: new Date(),
        lastActivity: new Date(),
        cursor: null,
        selection: null
      });

      // ルーム参加
      await this.wsManager.joinRoom(userId, `collaboration:${sessionId}`);

      // 他の参加者に通知
      this.broadcastToSession(sessionId, 'participant-joined', {
        userId,
        participant: session.participants.get(userId),
        totalParticipants: session.participants.size
      }, userId);

      return {
        success: true,
        session: this.getSessionInfo(sessionId),
        participants: Array.from(session.participants.values())
      };

    } catch (error) {
      console.error('コラボレーションセッション開始エラー:', error);
      throw new Error('コラボレーションセッションの開始に失敗しました');
    }
  }

  updateCursorPosition(sessionId, userId, position) {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.participants.has(userId)) return;

    // カーソル位置更新
    const participant = session.participants.get(userId);
    participant.cursor = position;
    participant.lastActivity = new Date();

    // 他の参加者にカーソル位置を配信
    this.broadcastToSession(sessionId, 'cursor-updated', {
      userId,
      cursor: position,
      timestamp: new Date()
    }, userId);
  }

  updateSelection(sessionId, userId, selection) {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.participants.has(userId)) return;

    // 選択範囲更新
    const participant = session.participants.get(userId);
    participant.selection = selection;
    participant.lastActivity = new Date();

    // 他の参加者に選択範囲を配信
    this.broadcastToSession(sessionId, 'selection-updated', {
      userId,
      selection,
      timestamp: new Date()
    }, userId);
  }

  broadcastEdit(sessionId, userId, edit) {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.participants.has(userId)) return;

    // 編集を他の参加者に配信
    this.broadcastToSession(sessionId, 'edit-applied', {
      userId,
      edit,
      timestamp: new Date()
    }, userId);
  }

  broadcastToSession(sessionId, event, data, excludeUserId = null) {
    const roomName = `collaboration:${sessionId}`;
    this.wsManager.broadcastToRoom(roomName, event, data, excludeUserId);
  }

  async leaveCollaborationSession(sessionId, userId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // 参加者削除
    session.participants.delete(userId);

    // ルーム退出
    await this.wsManager.leaveRoom(userId, `collaboration:${sessionId}`);

    // 他の参加者に通知
    this.broadcastToSession(sessionId, 'participant-left', {
      userId,
      totalParticipants: session.participants.size
    });

    // セッションが空になった場合は削除
    if (session.participants.size === 0) {
      this.activeSessions.delete(sessionId);
    }
  }

  getSessionInfo(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      participantCount: session.participants.size,
      participants: Array.from(session.participants.values()),
      createdAt: session.createdAt,
      metadata: session.metadata
    };
  }

  // プレゼンス管理
  updateUserPresence(userId, roomId, presence) {
    if (!this.userPresence.has(roomId)) {
      this.userPresence.set(roomId, new Map());
    }
    
    this.userPresence.get(roomId).set(userId, {
      ...presence,
      lastSeen: new Date()
    });

    // プレゼンス更新を配信
    this.wsManager.broadcastToRoom(roomId, 'presence-updated', {
      userId,
      presence,
      timestamp: new Date()
    });
  }
}
```

### コラボレーションツール

```javascript
// コラボレーションツールコンポーネント
export function CollaborationTools({ sessionId, documentId }) {
  const { sendMessage, subscribe } = useRealtimeConnection();
  const [participants, setParticipants] = React.useState([]);
  const [cursors, setCursors] = React.useState(new Map());
  const [selections, setSelections] = React.useState(new Map());
  const [isCollaborating, setIsCollaborating] = React.useState(false);

  React.useEffect(() => {
    // コラボレーションセッション開始
    startCollaboration();

    // イベントリスナー設定
    const unsubscribers = [
      subscribe('participant-joined', handleParticipantJoined),
      subscribe('participant-left', handleParticipantLeft),
      subscribe('cursor-updated', handleCursorUpdate),
      subscribe('selection-updated', handleSelectionUpdate),
      subscribe('edit-applied', handleEditApplied)
    ];

    return () => {
      // セッション終了
      endCollaboration();
      unsubscribers.forEach(unsub => unsub());
    };
  }, [sessionId]);

  const startCollaboration = () => {
    sendMessage('start-collaboration', {
      sessionId,
      documentId,
      metadata: { documentType: 'task' }
    });
    setIsCollaborating(true);
  };

  const endCollaboration = () => {
    sendMessage('end-collaboration', { sessionId });
    setIsCollaborating(false);
  };

  const handleParticipantJoined = (data) => {
    setParticipants(prev => [...prev.filter(p => p.userId !== data.userId), data.participant]);
  };

  const handleParticipantLeft = (data) => {
    setParticipants(prev => prev.filter(p => p.userId !== data.userId));
    setCursors(prev => {
      const newCursors = new Map(prev);
      newCursors.delete(data.userId);
      return newCursors;
    });
    setSelections(prev => {
      const newSelections = new Map(prev);
      newSelections.delete(data.userId);
      return newSelections;
    });
  };

  const handleCursorUpdate = (data) => {
    setCursors(prev => new Map(prev.set(data.userId, data.cursor)));
  };

  const handleSelectionUpdate = (data) => {
    setSelections(prev => new Map(prev.set(data.userId, data.selection)));
  };

  const handleEditApplied = (data) => {
    // 編集内容をドキュメントに適用
    console.log('Edit applied:', data.edit);
  };

  const updateCursor = (position) => {
    sendMessage('update-cursor', {
      sessionId,
      position
    });
  };

  const updateSelection = (selection) => {
    sendMessage('update-selection', {
      sessionId,
      selection
    });
  };

  return (
    <div className="collaboration-tools">
      {/* 参加者表示 */}
      <ParticipantList participants={participants} />
      
      {/* カーソル表示 */}
      <CursorOverlay cursors={cursors} participants={participants} />
      
      {/* 選択範囲表示 */}
      <SelectionOverlay selections={selections} participants={participants} />
      
      {/* コラボレーション状態 */}
      <CollaborationStatus 
        isCollaborating={isCollaborating} 
        participantCount={participants.length}
      />
    </div>
  );
}

// 参加者リスト
export function ParticipantList({ participants }) {
  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
      <Users className="w-4 h-4 text-gray-600" />
      <span className="text-sm text-gray-600">共同編集中:</span>
      <div className="flex space-x-1">
        {participants.map((participant) => (
          <div
            key={participant.userId}
            className="flex items-center space-x-1 px-2 py-1 bg-white rounded border"
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getUserColor(participant.userId) }}
            />
            <span className="text-xs">{participant.username || 'Anonymous'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// カーソルオーバーレイ
export function CursorOverlay({ cursors, participants }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from(cursors.entries()).map(([userId, cursor]) => {
        const participant = participants.find(p => p.userId === userId);
        if (!cursor || !participant) return null;

        return (
          <div
            key={userId}
            className="absolute pointer-events-none"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div 
              className="w-px h-4 mb-1"
              style={{ backgroundColor: getUserColor(userId) }}
            />
            <div 
              className="px-1 py-0.5 text-xs text-white rounded whitespace-nowrap"
              style={{ backgroundColor: getUserColor(userId) }}
            >
              {participant.username || 'Anonymous'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 選択範囲オーバーレイ
export function SelectionOverlay({ selections, participants }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from(selections.entries()).map(([userId, selection]) => {
        const participant = participants.find(p => p.userId === userId);
        if (!selection || !participant) return null;

        return (
          <div
            key={userId}
            className="absolute rounded"
            style={{
              left: selection.start.x,
              top: selection.start.y,
              width: selection.end.x - selection.start.x,
              height: selection.end.y - selection.start.y,
              backgroundColor: getUserColor(userId, 0.2),
              border: `1px solid ${getUserColor(userId)}`
            }}
          />
        );
      })}
    </div>
  );
}

// コラボレーション状態表示
export function CollaborationStatus({ isCollaborating, participantCount }) {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${
        isCollaborating ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
      }`} />
      <span className={isCollaborating ? 'text-green-600' : 'text-gray-600'}>
        {isCollaborating ? 'リアルタイム共同編集中' : 'オフライン'}
      </span>
      {participantCount > 0 && (
        <span className="text-gray-500">
          ({participantCount}人が参加中)
        </span>
      )}
    </div>
  );
}

// ユーザー色生成ヘルパー
function getUserColor(userId, alpha = 1) {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const color = colors[Math.abs(hash) % colors.length];
  
  if (alpha < 1) {
    const rgb = color.match(/\w\w/g).map(x => parseInt(x, 16));
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }
  
  return color;
}
```

---

## リアルタイム分析

### リアルタイム分析エンジン

```javascript
// リアルタイム分析エンジン
class RealtimeAnalyticsEngine {
  constructor(websocketManager) {
    this.wsManager = websocketManager;
    this.metricsCollectors = new Map(); // メトリクスタイプ -> コレクター
    this.aggregatedData = new Map(); // 集計データキャッシュ
    this.updateInterval = 5000; // 5秒間隔
  }

  startMetricsCollection() {
    // 基本メトリクスコレクターを初期化
    this.initializeCollectors();
    
    // 定期更新開始
    this.startPeriodicUpdates();
  }

  initializeCollectors() {
    // タスクメトリクス
    this.metricsCollectors.set('tasks', new TaskMetricsCollector());
    
    // ユーザーアクティビティメトリクス
    this.metricsCollectors.set('user-activity', new UserActivityCollector());
    
    // システムパフォーマンスメトリクス
    this.metricsCollectors.set('system-performance', new SystemPerformanceCollector());
    
    // リアルタイム通知メトリクス
    this.metricsCollectors.set('notifications', new NotificationMetricsCollector());
  }

  startPeriodicUpdates() {
    setInterval(async () => {
      try {
        await this.updateAllMetrics();
      } catch (error) {
        console.error('メトリクス更新エラー:', error);
      }
    }, this.updateInterval);
  }

  async updateAllMetrics() {
    const updatePromises = Array.from(this.metricsCollectors.entries()).map(
      async ([metricType, collector]) => {
        try {
          const data = await collector.collect();
          const aggregated = await this.aggregateMetrics(metricType, data);
          
          // キャッシュ更新
          this.aggregatedData.set(metricType, aggregated);
          
          // 購読者に配信
          await this.broadcastMetricsUpdate(metricType, aggregated);
          
          return { metricType, success: true };
        } catch (error) {
          console.error(`メトリクス収集エラー (${metricType}):`, error);
          return { metricType, success: false, error };
        }
      }
    );

    await Promise.all(updatePromises);
  }

  async aggregateMetrics(metricType, rawData) {
    switch (metricType) {
      case 'tasks':
        return this.aggregateTaskMetrics(rawData);
      case 'user-activity':
        return this.aggregateUserActivity(rawData);
      case 'system-performance':
        return this.aggregateSystemPerformance(rawData);
      case 'notifications':
        return this.aggregateNotificationMetrics(rawData);
      default:
        return rawData;
    }
  }

  aggregateTaskMetrics(data) {
    return {
      total: data.tasks.length,
      completed: data.tasks.filter(t => t.status === 'completed').length,
      inProgress: data.tasks.filter(t => t.status === 'in_progress').length,
      pending: data.tasks.filter(t => t.status === 'pending').length,
      overdue: data.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length,
      completionRate: (data.tasks.filter(t => t.status === 'completed').length / data.tasks.length) * 100,
      averageCompletionTime: this.calculateAverageCompletionTime(data.tasks),
      productivity: this.calculateProductivityScore(data.tasks),
      timestamp: new Date()
    };
  }

  aggregateUserActivity(data) {
    return {
      activeUsers: data.activities.length,
      totalSessions: data.sessionCount,
      averageSessionDuration: data.averageSessionDuration,
      actionsByType: data.activities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {}),
      peakActivityHour: this.calculatePeakActivityHour(data.activities),
      engagementScore: this.calculateEngagementScore(data.activities),
      timestamp: new Date()
    };
  }

  async broadcastMetricsUpdate(metricType, data) {
    // メトリクス購読者に配信
    this.wsManager.emit('metrics-update', {
      type: metricType,
      data,
      timestamp: new Date()
    });

    // 特定のメトリクス購読者に配信
    this.wsManager.emit(`metrics-${metricType}`, data);
  }

  subscribeToMetrics(userId, metricTypes) {
    // ユーザーを指定メトリクスの購読者に追加
    metricTypes.forEach(metricType => {
      const roomName = `metrics:${metricType}`;
      this.wsManager.joinRoom(userId, roomName);
      
      // 現在のデータを即座に送信
      const currentData = this.aggregatedData.get(metricType);
      if (currentData) {
        this.wsManager.broadcastToUser(userId, `metrics-${metricType}`, currentData);
      }
    });
  }

  unsubscribeFromMetrics(userId, metricTypes) {
    metricTypes.forEach(metricType => {
      const roomName = `metrics:${metricType}`;
      this.wsManager.leaveRoom(userId, roomName);
    });
  }
}

// タスクメトリクスコレクター
class TaskMetricsCollector {
  async collect() {
    // データベースからタスクデータを取得
    const tasks = await this.getTasks();
    const projects = await this.getProjects();
    
    return {
      tasks,
      projects,
      collectedAt: new Date()
    };
  }

  async getTasks() {
    // 実際の実装ではデータベースクエリを実行
    return [];
  }

  async getProjects() {
    // 実際の実装ではデータベースクエリを実行
    return [];
  }
}
```

### リアルタイム分析ダッシュボード

```javascript
// リアルタイム分析ダッシュボード
export function RealtimeAnalyticsDashboard() {
  const { subscribe } = useRealtimeConnection();
  const [metrics, setMetrics] = React.useState({
    tasks: null,
    userActivity: null,
    systemPerformance: null,
    notifications: null
  });
  const [selectedTimeframe, setSelectedTimeframe] = React.useState('1h');

  React.useEffect(() => {
    // メトリクス購読
    const unsubscribers = [
      subscribe('metrics-tasks', (data) => {
        setMetrics(prev => ({ ...prev, tasks: data }));
      }),
      subscribe('metrics-user-activity', (data) => {
        setMetrics(prev => ({ ...prev, userActivity: data }));
      }),
      subscribe('metrics-system-performance', (data) => {
        setMetrics(prev => ({ ...prev, systemPerformance: data }));
      }),
      subscribe('metrics-notifications', (data) => {
        setMetrics(prev => ({ ...prev, notifications: data }));
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribe]);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">リアルタイム分析</h2>
        <div className="flex items-center space-x-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">5分</SelectItem>
              <SelectItem value="1h">1時間</SelectItem>
              <SelectItem value="24h">24時間</SelectItem>
              <SelectItem value="7d">7日間</SelectItem>
            </SelectContent>
          </Select>
          <RealtimeIndicator />
        </div>
      </div>

      {/* メトリクスカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <RealtimeMetricCard
          title="タスク完了率"
          value={metrics.tasks?.completionRate}
          unit="%"
          trend={calculateTrend(metrics.tasks?.completionRate)}
          color="blue"
        />
        <RealtimeMetricCard
          title="アクティブユーザー"
          value={metrics.userActivity?.activeUsers}
          trend={calculateTrend(metrics.userActivity?.activeUsers)}
          color="green"
        />
        <RealtimeMetricCard
          title="平均応答時間"
          value={metrics.systemPerformance?.averageResponseTime}
          unit="ms"
          trend={calculateTrend(metrics.systemPerformance?.averageResponseTime, true)}
          color="purple"
        />
        <RealtimeMetricCard
          title="通知送信数"
          value={metrics.notifications?.totalSent}
          trend={calculateTrend(metrics.notifications?.totalSent)}
          color="orange"
        />
      </div>

      {/* 詳細チャート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskMetricsChart data={metrics.tasks} />
        <UserActivityChart data={metrics.userActivity} />
        <SystemPerformanceChart data={metrics.systemPerformance} />
        <NotificationMetricsChart data={metrics.notifications} />
      </div>
    </div>
  );
}

// リアルタイムメトリクスカード
export function RealtimeMetricCard({ title, value, unit = '', trend, color = 'blue' }) {
  const [previousValue, setPreviousValue] = React.useState(value);
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    if (value !== previousValue) {
      setIsUpdating(true);
      setPreviousValue(value);
      
      const timer = setTimeout(() => setIsUpdating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [value, previousValue]);

  return (
    <Card className={`p-6 ${isUpdating ? 'ring-2 ring-blue-200 animate-pulse' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`w-3 h-3 rounded-full bg-${color}-500 ${isUpdating ? 'animate-ping' : ''}`} />
      </div>
      
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900">
          {value !== null && value !== undefined ? value.toLocaleString() : '--'}
          <span className="text-sm text-gray-500 ml-1">{unit}</span>
        </div>
        
        {trend && (
          <div className={`flex items-center mt-1 text-sm ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.direction === 'up' ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            <span>{Math.abs(trend.percentage)}%</span>
          </div>
        )}
      </div>
    </Card>
  );
}

// リアルタイムインジケーター
export function RealtimeIndicator() {
  const [lastUpdate, setLastUpdate] = React.useState(new Date());
  const { connectionStatus } = useRealtimeConnection();

  React.useEffect(() => {
    if (connectionStatus === 'authenticated') {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [connectionStatus]);

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <div className={`w-2 h-2 rounded-full ${
        connectionStatus === 'authenticated' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
      }`} />
      <span>
        {connectionStatus === 'authenticated' ? 'ライブ更新中' : 'オフライン'}
      </span>
      <span className="text-xs">
        {format(lastUpdate, 'HH:mm:ss')}
      </span>
    </div>
  );
}
```

---

## 実装例

### API エンドポイント実装

```javascript
// /api/realtime/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { WebSocketManager } from '@/services/WebSocketManager';
import { RealtimeNotificationService } from '@/services/RealtimeNotificationService';
import { RealtimeAnalyticsEngine } from '@/services/RealtimeAnalyticsEngine';

let wsManager: WebSocketManager;
let notificationService: RealtimeNotificationService;
let analyticsEngine: RealtimeAnalyticsEngine;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'status':
        return NextResponse.json({
          websocket: {
            connected: wsManager?.connections?.size || 0,
            rooms: wsManager?.rooms?.size || 0
          },
          notifications: {
            sent: await notificationService?.getNotificationStats() || 0
          },
          analytics: {
            metricsCollected: analyticsEngine?.metricsCollectors?.size || 0
          }
        });

      case 'metrics':
        const metrics = await analyticsEngine?.getCurrentMetrics();
        return NextResponse.json(metrics);

      default:
        return NextResponse.json({
          message: 'リアルタイム機能が利用可能です',
          features: [
            'WebSocket通信',
            'リアルタイム通知',
            'ライブデータ更新',
            'コラボレーション機能',
            'リアルタイム分析'
          ]
        });
    }

  } catch (error) {
    console.error('リアルタイムAPI エラー:', error);
    return NextResponse.json(
      { error: 'リアルタイム機能の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'send_notification':
        const result = await notificationService.sendNotification(
          data.userId,
          data.notification
        );
        return NextResponse.json({ success: true, result });

      case 'broadcast_notification':
        const broadcastResult = await notificationService.sendBroadcastNotification(
          data.notification,
          data.filter
        );
        return NextResponse.json({ success: true, result: broadcastResult });

      case 'update_metrics':
        await analyticsEngine.updateAllMetrics();
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('リアルタイムAPI POST エラー:', error);
    return NextResponse.json(
      { error: 'リアルタイム機能の実行に失敗しました' },
      { status: 500 }
    );
  }
}

// WebSocket サーバー初期化
export async function initializeRealtimeServices(server) {
  wsManager = new WebSocketManager();
  await wsManager.initializeServer(server);

  notificationService = new RealtimeNotificationService(wsManager);
  analyticsEngine = new RealtimeAnalyticsEngine(wsManager);
  
  analyticsEngine.startMetricsCollection();

  console.log('リアルタイムサービスが初期化されました');
}
```

### Next.js統合

```javascript
// lib/realtime.ts
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { initializeRealtimeServices } from '@/api/realtime/route';

let io: SocketIOServer;

export function getRealtimeServer() {
  if (!io) {
    const httpServer = createServer();
    io = new SocketIOServer(httpServer);
    initializeRealtimeServices(io);
  }
  return io;
}

// pages/_app.tsx (または app/layout.tsx)
import { RealtimeProvider } from '@/components/RealtimeProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <RealtimeProvider>
          {children}
        </RealtimeProvider>
      </body>
    </html>
  );
}
```

---

## パフォーマンス最適化

### 最適化戦略

```javascript
// パフォーマンス最適化管理
class RealtimePerformanceOptimizer {
  constructor() {
    this.connectionLimits = {
      maxConnectionsPerUser: 5,
      maxTotalConnections: 10000,
      maxRoomsPerConnection: 50
    };
    this.rateLimits = new Map(); // ユーザーID -> レート制限情報
    this.compressionEnabled = true;
    this.batchingEnabled = true;
    this.batchSize = 100;
    this.batchInterval = 50; // ms
  }

  optimizeConnection(socket, userData) {
    // 接続数制限チェック
    if (!this.checkConnectionLimits(userData.userId)) {
      socket.emit('connection-rejected', { 
        reason: 'Too many connections' 
      });
      socket.disconnect();
      return false;
    }

    // 圧縮設定
    if (this.compressionEnabled) {
      socket.compress(true);
    }

    // レート制限設定
    this.setupRateLimit(socket, userData.userId);

    return true;
  }

  setupRateLimit(socket, userId) {
    const rateLimit = {
      requests: 0,
      windowStart: Date.now(),
      maxRequests: 100, // 1分間に100リクエスト
      windowSize: 60000 // 1分
    };

    this.rateLimits.set(userId, rateLimit);

    // リクエスト前チェック
    socket.use((packet, next) => {
      if (this.checkRateLimit(userId)) {
        next();
      } else {
        socket.emit('rate-limit-exceeded');
      }
    });
  }

  checkRateLimit(userId) {
    const rateLimit = this.rateLimits.get(userId);
    if (!rateLimit) return true;

    const now = Date.now();
    
    // ウィンドウリセット
    if (now - rateLimit.windowStart > rateLimit.windowSize) {
      rateLimit.requests = 0;
      rateLimit.windowStart = now;
    }

    // リクエスト数チェック
    if (rateLimit.requests >= rateLimit.maxRequests) {
      return false;
    }

    rateLimit.requests++;
    return true;
  }

  // メッセージバッチング
  batchMessages(messages) {
    if (!this.batchingEnabled || messages.length <= 1) {
      return messages;
    }

    const batches = [];
    for (let i = 0; i < messages.length; i += this.batchSize) {
      batches.push({
        type: 'batch',
        messages: messages.slice(i, i + this.batchSize),
        timestamp: new Date()
      });
    }

    return batches;
  }

  // メモリ使用量監視
  monitorMemoryUsage() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        console.warn('高メモリ使用量検出:', memUsage);
        this.performMemoryCleanup();
      }
    }, 30000); // 30秒毎
  }

  performMemoryCleanup() {
    // 古い接続情報クリーンアップ
    const now = Date.now();
    const cutoff = 24 * 60 * 60 * 1000; // 24時間

    this.rateLimits.forEach((rateLimit, userId) => {
      if (now - rateLimit.windowStart > cutoff) {
        this.rateLimits.delete(userId);
      }
    });

    // ガベージコレクション実行
    if (global.gc) {
      global.gc();
    }
  }
}
```

---

## トラブルシューティング

### よくある問題と解決策

```javascript
// リアルタイム機能トラブルシューティング
const RealtimeTroubleshooting = {
  // 接続の問題
  connectionIssues: {
    'connection_failed': {
      description: 'WebSocket接続に失敗しました',
      causes: [
        'ネットワーク接続の問題',
        'ファイアウォールによるブロック',
        'プロキシサーバーの設定問題'
      ],
      solutions: [
        'ネットワーク接続の確認',
        'ポーリングフォールバックの有効化',
        'HTTPSでの接続試行'
      ]
    },
    'frequent_disconnections': {
      description: '頻繁な接続切断が発生します',
      causes: [
        'ネットワークの不安定性',
        'ハートビート設定の問題',
        'サーバー負荷の問題'
      ],
      solutions: [
        'ハートビート間隔の調整',
        '再接続ロジックの改善',
        'サーバー負荷分散の検討'
      ]
    }
  },

  // パフォーマンスの問題
  performanceIssues: {
    'high_latency': {
      description: 'メッセージ配信の遅延が発生します',
      solutions: [
        'メッセージバッチングの有効化',
        'サーバー地理的分散の検討',
        '不要な通信の削減'
      ]
    },
    'memory_leaks': {
      description: 'メモリリークが発生します',
      solutions: [
        'イベントリスナーの適切なクリーンアップ',
        '定期的なガベージコレクション',
        'キャッシュサイズの制限'
      ]
    }
  },

  // 同期の問題
  synchronizationIssues: {
    'data_conflicts': {
      description: 'データの競合が発生します',
      solutions: [
        '楽観的ロックの実装',
        '競合解決戦略の改善',
        'バージョン管理の実装'
      ]
    },
    'sync_delays': {
      description: 'データ同期の遅延が発生します',
      solutions: [
        '差分同期の実装',
        '同期間隔の調整',
        'バックグラウンド同期の活用'
      ]
    }
  }
};

// エラーハンドリング関数
export function handleRealtimeError(error, context) {
  console.error(`リアルタイム機能エラー [${context}]:`, error);
  
  switch (error.type) {
    case 'CONNECTION_ERROR':
      return {
        message: '接続エラーが発生しました。再接続を試行します。',
        action: 'retry_connection',
        retryAfter: 5000
      };
      
    case 'RATE_LIMIT_EXCEEDED':
      return {
        message: '送信頻度が制限を超えました。しばらく待ってから再試行してください。',
        action: 'wait_and_retry',
        retryAfter: 10000
      };
      
    case 'SYNC_CONFLICT':
      return {
        message: 'データの競合が検出されました。最新データを取得して再試行してください。',
        action: 'resolve_conflict'
      };
      
    default:
      return {
        message: '予期しないエラーが発生しました。',
        action: 'report_error'
      };
  }
}

// 診断ツール
export class RealtimeDiagnostics {
  static async runDiagnostics() {
    const results = {
      connection: await this.testConnection(),
      latency: await this.measureLatency(),
      throughput: await this.measureThroughput(),
      memory: this.checkMemoryUsage()
    };

    return results;
  }

  static async testConnection() {
    try {
      const socket = io('/test');
      return new Promise((resolve) => {
        socket.on('connect', () => {
          socket.close();
          resolve({ status: 'success', message: '接続成功' });
        });
        socket.on('connect_error', (error) => {
          resolve({ status: 'error', message: error.message });
        });
        setTimeout(() => {
          socket.close();
          resolve({ status: 'timeout', message: '接続タイムアウト' });
        }, 5000);
      });
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  static async measureLatency() {
    const socket = io('/test');
    const latencies = [];

    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await new Promise((resolve) => {
        socket.emit('ping', start);
        socket.once('pong', () => {
          latencies.push(Date.now() - start);
          resolve();
        });
      });
    }

    socket.close();

    return {
      average: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      min: Math.min(...latencies),
      max: Math.max(...latencies)
    };
  }

  static checkMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    return { status: 'unavailable' };
  }
}
```

---

## まとめ

このリアルタイム機能マニュアルでは、WebSocket通信を基盤とした包括的なリアルタイム体験提供システムの実装方法を説明しました。

### 主要機能
1. **WebSocket通信基盤** - 高性能な双方向通信システム
2. **リアルタイム通知** - インスタント通知・アラートシステム
3. **ライブデータ更新** - リアルタイムデータ同期機能
4. **同期機能** - 競合解決・排他制御
5. **コラボレーション** - リアルタイム共同編集機能
6. **リアルタイム分析** - ライブメトリクス・分析表示

### 技術的特徴
- Socket.IO による WebSocket 通信
- リアルタイムデータ同期
- 競合解決・排他制御
- パフォーマンス最適化
- 包括的なエラーハンドリング

このシステムにより、現代的なWebアプリケーションに必要な即時性とコラボレーション機能を提供できます。
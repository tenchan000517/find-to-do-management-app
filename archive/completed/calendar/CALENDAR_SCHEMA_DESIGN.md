# カレンダー機能データベーススキーマ設計

## 📋 要件に基づくスキーマ設計

### 1. calendar_events テーブル拡張
既存のcalendar_eventsテーブルに以下のフィールドを追加：

```prisma
model calendar_events {
  id               String          @id
  title            String
  date             String          // 初回日付
  time             String
  endTime          String?         // 終了時刻（新規追加）
  type             event_type      @default(MEETING)
  description      String          @default("")
  participants     String[]        @default([])
  location         String?
  
  // 新規追加フィールド
  userId           String          // イベント作成者
  projectId        String?         // 関連プロジェクト
  taskId           String?         // 関連タスク
  appointmentId    String?         // 関連アポ
  
  // カテゴリ・重要度
  category         event_category  @default(GENERAL)
  importance       Float           @default(0.5)
  
  // 繰り返し設定
  isRecurring      Boolean         @default(false)
  recurringPattern String?         // 繰り返しパターンID
  recurringEnd     String?         // 繰り返し終了日
  
  // 表示設定
  colorCode        String?         // カスタム色指定
  isAllDay         Boolean         @default(false)
  
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  
  // リレーション
  users            users           @relation(fields: [userId], references: [id])
  projects         projects?       @relation(fields: [projectId], references: [id])
  tasks            tasks?          @relation(fields: [taskId], references: [id])
  appointments     appointments?   @relation(fields: [appointmentId], references: [id])
  recurring_rules  recurring_rules? @relation(fields: [recurringPattern], references: [id])
}
```

### 2. 繰り返しルールテーブル（新規）

```prisma
model recurring_rules {
  id               String           @id @default(cuid())
  ruleName         String           // ルール名（例：毎週月曜会議）
  
  // 繰り返しタイプ
  recurrenceType   recurrence_type  // DAILY, WEEKLY, BIWEEKLY, MONTHLY
  
  // 週次・隔週設定
  weekdays         Int[]            // 0-6 (日-土) 複数選択可
  
  // 月次設定
  monthDay         Int?             // 毎月X日（1-31）
  monthWeek        Int?             // 第X週（1-5）
  monthWeekday     Int?             // 第X週のY曜日
  
  // 間隔設定
  interval         Int              @default(1) // 何回ごと
  
  // 有効期間
  startDate        String           // 開始日
  endDate          String?          // 終了日
  maxOccurrences   Int?             // 最大回数
  
  // 除外日
  excludeDates     String[]         @default([])
  
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  
  calendar_events  calendar_events[]
}
```

### 3. Enumの追加

```prisma
enum event_category {
  GENERAL       // 一般
  MEETING       // 会議
  APPOINTMENT   // アポ
  TASK_DUE      // タスク期限
  PROJECT       // プロジェクト
  PERSONAL      // 個人
  TEAM          // チーム
}

enum recurrence_type {
  DAILY         // 毎日
  WEEKLY        // 毎週
  BIWEEKLY      // 隔週
  MONTHLY       // 毎月
  CUSTOM        // カスタム
}
```

### 4. 既存テーブルのリレーション追加

```prisma
// usersテーブルに追加
model users {
  // 既存フィールド...
  calendar_events calendar_events[]
}

// projectsテーブルに追加
model projects {
  // 既存フィールド...
  calendar_events calendar_events[]
}

// tasksテーブルに追加
model tasks {
  // 既存フィールド...
  calendar_events calendar_events[]
}

// appointmentsテーブルに追加
model appointments {
  // 既存フィールド...
  calendar_events calendar_events[]
}
```

## 📊 データ統合の考え方

### 1. イベントソースの統一
- **calendar_events**: すべてのカレンダー表示項目の中心
- **tasks.dueDate**: 自動的にcalendar_eventsにレコード作成
- **appointments**: 自動的にcalendar_eventsにレコード作成

### 2. 色分け戦略
```typescript
// ユーザー別色: users.color
// カテゴリ別色: 
const CATEGORY_COLORS = {
  GENERAL: '#6B7280',
  MEETING: '#3B82F6',
  APPOINTMENT: '#10B981',
  TASK_DUE: '#F59E0B',
  PROJECT: '#8B5CF6',
  PERSONAL: '#EC4899',
  TEAM: '#06B6D4'
};

// 重要度別色:
const IMPORTANCE_COLORS = {
  HIGH: '#EF4444',    // 赤
  MEDIUM: '#F59E0B',  // オレンジ
  LOW: '#10B981'      // 緑
};
```

### 3. 繰り返しイベントの展開
- recurring_rulesに基づいて、表示期間のイベントを動的生成
- 除外日の考慮
- 個別編集時は新規レコードとして保存

## 🔄 マイグレーション戦略

### Phase 1: 基本スキーマ追加
1. calendar_eventsテーブル拡張
2. recurring_rulesテーブル作成
3. 既存データのuserId紐付け

### Phase 2: データ統合
1. 既存tasks.dueDateからcalendar_eventsへのデータ移行
2. appointmentsからcalendar_eventsへのデータ移行
3. 重複削除・整合性確認

### Phase 3: 機能実装
1. カレンダーUI実装
2. 繰り返し機能実装
3. LINE連携・通知機能実装

## 📝 実装時の注意点

1. **パフォーマンス**
   - 繰り返しイベントは表示期間分のみ展開
   - インデックス: date, userId, projectId

2. **データ整合性**
   - タスク削除時は関連calendar_events削除
   - アポ完了時はcalendar_eventsステータス更新

3. **タイムゾーン**
   - すべてJST前提で実装
   - 将来的な拡張を考慮した設計

4. **キャッシング**
   - 月次データは積極的にキャッシュ
   - 繰り返しルール変更時はキャッシュクリア
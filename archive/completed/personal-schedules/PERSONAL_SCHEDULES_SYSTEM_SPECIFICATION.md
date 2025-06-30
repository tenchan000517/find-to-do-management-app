# 個人予定管理システム 詳細仕様書

**作成日**: 2025-06-15  
**対象システム**: FIND to DO Management App  
**機能**: 個人予定管理機能追加  
**バージョン**: v1.0

---

## 📋 目次

1. [システム概要](#システム概要)
2. [現行システム分析](#現行システム分析)
3. [データベース設計](#データベース設計)
4. [API設計](#api設計)
5. [フロントエンド設計](#フロントエンド設計)
6. [LINEボット統合](#lineボット統合)
7. [実装計画](#実装計画)
8. [テスト仕様](#テスト仕様)

---

## 🎯 システム概要

### 目的
既存のタスク管理システムに**個人予定管理機能**を追加し、カレンダー表示で統合的に管理できるようにする。

### 要件
- 既存の`calendar_events`はパブリックイベントとして維持
- 新規の`personal_schedules`で個人予定を管理
- LINEボットからの自動分類対応
- 統合カレンダー表示での一元管理

### システム境界
- **対象**: 個人予定の作成・編集・削除・表示
- **非対象**: 既存システムの変更、パブリックイベントの仕様変更

---

## 📊 現行システム分析

### データベース構造 (Prisma Schema)
```sql
-- 現在のカレンダー関連テーブル
model calendar_events {
  id            String     @id
  title         String
  date          String     -- YYYY-MM-DD形式
  time          String     -- HH:mm形式
  endTime       String?
  type          event_type @default(MEETING)
  description   String     @default("")
  participants  String[]   @default([])
  location      String?
  
  -- 関連性フィールド
  userId        String?
  projectId     String?
  taskId        String?
  appointmentId String?
  
  -- カテゴリ・重要度
  category      event_category @default(EVENT)
  importance    Float          @default(0.5)
  
  -- 繰り返し設定
  isRecurring      Boolean @default(false)
  recurringPattern String?
  recurringEnd     String?
  
  -- 表示設定
  colorCode String?
  isAllDay  Boolean @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  -- リレーション
  users           users?           @relation(fields: [userId], references: [id])
  projects        projects?        @relation(fields: [projectId], references: [id])
  tasks           tasks?           @relation(fields: [taskId], references: [id])
  appointments    appointments?    @relation(fields: [appointmentId], references: [id])
  recurring_rules recurring_rules? @relation(fields: [recurringPattern], references: [id])
}

-- 関連Enum
enum event_category {
  GENERAL
  MEETING
  APPOINTMENT
  TASK_DUE
  PROJECT
  PERSONAL
  TEAM
  EVENT
}

enum event_type {
  MEETING
  EVENT
  DEADLINE
}
```

### 現行API構造
```
/api/calendar/
├── route.ts                 # 基本CRUD操作
├── events/
│   ├── route.ts            # 詳細イベント操作
│   └── [id]/route.ts       # 個別イベント操作
```

### 現行コンポーネント構造
```
src/components/calendar/
├── CalendarView.tsx         # メインカレンダー表示
├── MonthView.tsx           # 月表示
├── WeekView.tsx            # 週表示
├── DayView.tsx             # 日表示
├── EventCard.tsx           # イベントカード
├── EventEditModal.tsx      # イベント編集モーダル
├── DayEventsModal.tsx      # 日別イベント一覧
├── ColorTabs.tsx           # 色分けタブ
└── WeeklyPreview.tsx       # 週間プレビュー
```

### LINEボット現行処理フロー
```typescript
// src/app/api/webhook/line/route.ts:615-647
switch (type) {
  case 'schedule':
    // calendar_eventsテーブルに保存
    await prisma.calendar_events.create({
      data: {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: finalData.title || finalData.summary || '新しい予定',
        date: parsedDate,
        time: parsedTime,
        type: finalData.eventType || 'MEETING',
        description: finalData.description || '',
        participants: finalData.participants || [],
        location: finalData.location || null,
      },
    });
    break;
}
```

---

## 🗄️ データベース設計

### 新規テーブル: personal_schedules

```sql
model personal_schedules {
  id          String   @id @default(cuid())
  title       String
  date        String   -- YYYY-MM-DD形式 (calendar_eventsと統一)
  time        String   -- HH:mm形式 (calendar_eventsと統一)
  end_time    String?  -- HH:mm形式
  description String?  @default("")
  location    String?
  user_id     String   -- 必須 (個人予定のため)
  priority    String   @default("C") -- A/B/C/D優先度システム
  is_all_day  Boolean  @default(false)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  -- リレーション
  users       users    @relation(fields: [user_id], references: [id])
  
  @@map("personal_schedules")
}
```

### マイグレーション計画
```sql
-- Migration: 001_add_personal_schedules
CREATE TABLE personal_schedules (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  date VARCHAR NOT NULL,  -- YYYY-MM-DD
  time VARCHAR NOT NULL,  -- HH:mm
  end_time VARCHAR,       -- HH:mm
  description TEXT DEFAULT '',
  location VARCHAR,
  user_id VARCHAR NOT NULL,
  priority VARCHAR DEFAULT 'C',
  is_all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス追加
CREATE INDEX idx_personal_schedules_user_date ON personal_schedules(user_id, date);
CREATE INDEX idx_personal_schedules_date ON personal_schedules(date);
```

### データ関係図
```
users (1) -----> (N) personal_schedules
users (1) -----> (N) calendar_events
personal_schedules (独立)
calendar_events (既存のリレーション維持)
```

---

## 🔌 API設計

### 新規APIエンドポイント

#### 1. `/api/schedules/` (Personal Schedules CRUD)

**GET /api/schedules/**
```typescript
// Query Parameters
interface ScheduleListQuery {
  startDate?: string;    // YYYY-MM-DD
  endDate?: string;      // YYYY-MM-DD
  userId?: string;       // フィルター用
  priority?: 'A'|'B'|'C'|'D';
}

// Response
interface ScheduleListResponse {
  schedules: PersonalSchedule[];
  totalCount: number;
}
```

**POST /api/schedules/**
```typescript
// Request Body
interface CreateScheduleRequest {
  title: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  endTime?: string;      // HH:mm
  description?: string;
  location?: string;
  userId: string;        // 必須
  priority?: 'A'|'B'|'C'|'D';
  isAllDay?: boolean;
}

// Response
interface CreateScheduleResponse {
  schedule: PersonalSchedule;
}
```

**PUT /api/schedules/**
```typescript
// Request Body
interface UpdateScheduleRequest {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  endTime?: string;
  description?: string;
  location?: string;
  priority?: 'A'|'B'|'C'|'D';
  isAllDay?: boolean;
}
```

**DELETE /api/schedules/**
```typescript
// Query Parameters
interface DeleteScheduleQuery {
  id: string;
}
```

#### 2. `/api/schedules/[id]/` (Individual Operations)

**GET /api/schedules/[id]/**
```typescript
// Response
interface ScheduleDetailResponse {
  schedule: PersonalSchedule;
}
```

**PUT /api/schedules/[id]/**
```typescript
// Request Body - 上記UpdateScheduleRequestと同様 (idは不要)
```

**DELETE /api/schedules/[id]/**
```typescript
// Response
interface DeleteResponse {
  success: boolean;
}
```

### 既存API拡張

#### `/api/calendar/unified` (新規統合エンドポイント)

**GET /api/calendar/unified**
```typescript
// Query Parameters
interface UnifiedCalendarQuery {
  startDate: string;     // YYYY-MM-DD
  endDate: string;       // YYYY-MM-DD
  userId?: string;       // フィルター用
  includePersonal?: boolean;  // デフォルト: true
  includePublic?: boolean;    // デフォルト: true
}

// Response
interface UnifiedCalendarResponse {
  events: UnifiedCalendarEvent[];
  totalCount: number;
  sources: {
    calendar_events: number;
    personal_schedules: number;
    tasks: number;
    appointments: number;
  };
}
```

---

## 🎨 フロントエンド設計

### 新規型定義

```typescript
// src/types/personal-schedule.ts
export interface PersonalSchedule {
  id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  endTime?: string;      // HH:mm
  description?: string;
  location?: string;
  userId: string;
  priority: PriorityLevel; // 'A'|'B'|'C'|'D'
  isAllDay: boolean;
  createdAt: string;
  updatedAt: string;
}

// src/types/calendar.ts 拡張
export interface UnifiedCalendarEvent {
  // 既存のCalendarEventフィールド
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  type: EventType;
  category: EventCategory;
  description?: string;
  location?: string;
  
  // 新規フィールド
  source: 'calendar_events' | 'personal_schedules' | 'tasks' | 'appointments';
  isPersonal: boolean;
  priority?: PriorityLevel;
  
  // ソース特定フィールド
  userId?: string;
  projectId?: string;
  taskId?: string;
  appointmentId?: string;
  
  // 関連データ
  users?: {
    id: string;
    name: string;
    color: string;
  };
}

export type EventSource = 'all' | 'personal' | 'public' | 'tasks' | 'appointments';
```

### コンポーネント拡張計画

#### 1. CalendarView.tsx 拡張
```typescript
// 機能追加
interface CalendarViewState {
  // 既存
  events: UnifiedCalendarEvent[];  // 変更: CalendarEvent → UnifiedCalendarEvent
  loading: boolean;
  colorMode: ColorMode;
  
  // 新規
  sourceFilter: EventSource;      // フィルター機能
  showPersonalOnly: boolean;      // 個人予定のみ表示
}

// 新規メソッド
const fetchUnifiedEvents = async () => {
  const response = await fetch(`/api/calendar/unified?${params}`);
  const data = await response.json();
  setEvents(data.events);
};

const togglePersonalSchedules = () => {
  setShowPersonalOnly(!showPersonalOnly);
};
```

#### 2. EventCard.tsx 拡張
```typescript
// 表示の違い
const getEventIcon = (event: UnifiedCalendarEvent) => {
  switch (event.source) {
    case 'personal_schedules': return '📅';
    case 'calendar_events': return '📋';
    case 'tasks': return '✅';
    case 'appointments': return '🤝';
    default: return '📝';
  }
};

const getEventBorderStyle = (event: UnifiedCalendarEvent) => {
  return event.isPersonal 
個人予定はユーザーカラー
パブリックイベントはオレンジ
};
```

#### 3. EventEditModal.tsx 拡張
```typescript
interface EventEditModalProps {
  event?: UnifiedCalendarEvent;
  isPersonal?: boolean;        // 新規作成時の種別指定
  onSave: (event: UnifiedCalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

// 個人予定用の保存処理
const savePersonalSchedule = async (scheduleData: CreateScheduleRequest) => {
  const response = await fetch('/api/schedules/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scheduleData)
  });
  return response.json();
};
```

#### 4. 新規コンポーネント: PersonalScheduleForm.tsx
```typescript
interface PersonalScheduleFormProps {
  schedule?: PersonalSchedule;
  onSave: (schedule: PersonalSchedule) => void;
  onCancel: () => void;
}

export function PersonalScheduleForm({ schedule, onSave, onCancel }: PersonalScheduleFormProps) {
  // 個人予定専用のフォーム
  // 優先度選択、時間設定、場所入力など
}
```

### UIカラーシステム拡張

```typescript
// 個人予定用カラーパレット
export const PERSONAL_SCHEDULE_COLORS = {
  A: '#EF4444',    // 赤 - 最重要
  B: '#F59E0B',    // オレンジ - 重要
  C: '#3B82F6',    // 青 - 普通
  D: '#10B981'     // 緑 - 低優先度
} as const;

// ソース別カラー
export const SOURCE_COLORS = {
  personal_schedules: '#3B82F6',  // 青
  calendar_events: '#8B5CF6',     // 紫
  tasks: '#F59E0B',               // オレンジ
  appointments: '#10B981'         // 緑
} as const;
```

---

## 🤖 LINEボット統合

### 分類ロジック拡張

#### 現行処理 (src/app/api/webhook/line/route.ts:615-647)
```typescript
// 既存の分類
switch (type) {
  case 'schedule':
    // calendar_eventsに保存
    break;
  case 'task':
    // tasksに保存
    break;
  // ... その他
}
```

#### 拡張後の分類
```typescript
// 新しい分類ロジック
switch (type) {
  case 'personal_schedule':  // 新規追加
    await prisma.personal_schedules.create({
      data: {
        id: `ps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: finalData.title || finalData.summary || '新しい個人予定',
        date: parsedDate,
        time: parsedTime,
        end_time: finalData.endTime || null,
        description: finalData.description || '',
        location: finalData.location || null,
        user_id: systemUserId,
        priority: finalData.priority || 'C',
        is_all_day: finalData.isAllDay || false,
      },
    });
    break;
    
  case 'schedule':  // 既存 - パブリックイベント用
    // 既存のcalendar_events保存処理維持
    break;
}
```

### テキスト解析拡張

#### 分類キーワード拡張 (src/lib/ai/text-processor.ts)
```typescript
// 既存
export interface ExtractedData {
  type: 'schedule' | 'task' | 'project' | 'contact' | 'memo';
  // ... 他のフィールド
}

// 拡張後
export interface ExtractedData {
  type: 'personal_schedule' | 'schedule' | 'task' | 'project' | 'contact' | 'memo';
  // ... 他のフィールド
}

// 分類プロンプト拡張
const prompt = `
以下のLINEメッセージから、プロジェクト管理に必要な情報を抽出してください。

種類の判定基準:
- personal_schedule: 個人的な予定、プライベートな約束、個人の時間管理
- schedule: チームイベント、会議、公式な予定、他者との共有予定
- task: 作業タスク、TODO、完了すべき作業
- project: プロジェクト管理、長期計画
- contact: 人脈、連絡先情報
- memo: メモ、記録、ナレッジ

メッセージ: "${text}"

以下のJSON形式でのみ回答してください:
{
  "type": "personal_schedule|schedule|task|project|contact|memo",
  "title": "string",
  "description": "string",
  "datetime": "YYYY-MM-DDTHH:mm:ss (任意)",
  // ... 他のフィールド
}
`;
```

### コマンド解析拡張

```typescript
// src/app/api/webhook/line/route.ts:101-123
function extractCommand(text: string): string | undefined {
  const commandPatterns = [
    /^(個人予定|プライベート|私的|自分の予定)/, // 新規追加
    /^(予定|スケジュール|会議|ミーティング|アポ)/, // 既存
    /^(タスク|作業|仕事|TODO|やること)/,
    /^(プロジェクト|案件|PJ)/,
    /^(人脈|連絡先|コンタクト|名刺)/,
    /^(議事録|メモ|記録|要約)/
  ];
  
  for (const pattern of commandPatterns) {
    if (pattern.test(text)) {
      return text.match(pattern)?.[1];
    }
  }
  
  return undefined;
}
```

---

## 📝 実装計画

### Phase 1: データベース基盤 (1-2日)

#### 1.1 Prisma Schema拡張
- [ ] `prisma/schema.prisma`に`personal_schedules`モデル追加
- [ ] `users`モデルにリレーション追加
- [ ] マイグレーションファイル生成
- [ ] テストデータベースでマイグレーション実行

#### 1.2 型定義更新
- [ ] `src/types/personal-schedule.ts` 作成
- [ ] `src/types/calendar.ts` 拡張 (UnifiedCalendarEvent)
- [ ] 既存インポートの互換性確認

### Phase 2: API実装 (2-3日)

#### 2.1 Personal Schedules API
- [ ] `src/app/api/schedules/route.ts` (CRUD操作)
- [ ] `src/app/api/schedules/[id]/route.ts` (個別操作)
- [ ] バリデーション実装
- [ ] エラーハンドリング実装

#### 2.2 統合カレンダーAPI
- [ ] `src/app/api/calendar/unified/route.ts` 作成
- [ ] 既存の`/api/calendar/events`との互換性確保
- [ ] パフォーマンス最適化 (クエリ統合)

#### 2.3 APIテスト
- [ ] Postmanコレクション作成
- [ ] 単体テスト実装
- [ ] 統合テスト実行

### Phase 3: LINEボット統合 (1-2日)

#### 3.1 分類ロジック拡張
- [ ] `src/app/api/webhook/line/route.ts` の `saveClassifiedData` 関数拡張
- [ ] 個人予定の保存処理追加
- [ ] テストケース作成

#### 3.2 テキスト解析拡張
- [ ] `src/lib/ai/text-processor.ts` の `ExtractedData` 拡張
- [ ] 分類プロンプト更新
- [ ] 分類精度テスト

#### 3.3 動作確認
- [ ] LINEボットでの個人予定作成テスト
- [ ] パブリック予定との分類精度確認

### Phase 4: フロントエンド実装 (2-3日)

#### 4.1 コンポーネント拡張
- [ ] `CalendarView.tsx` - 統合イベント表示
- [ ] `EventCard.tsx` - ソース別表示
- [ ] `EventEditModal.tsx` - 個人予定編集対応

#### 4.2 新規コンポーネント
- [ ] `PersonalScheduleForm.tsx` 作成
- [ ] `SourceFilterTabs.tsx` 作成 (個人/パブリック切り替え)

#### 4.3 UIテスト
- [ ] レスポンシブデザイン確認
- [ ] 色分け表示テスト
- [ ] ユーザビリティテスト

### Phase 5: 統合テスト・最適化 (1日)

#### 5.1 エンドツーエンドテスト
- [ ] LINEボット → 個人予定作成 → カレンダー表示
- [ ] 手動作成 → 編集 → 削除フロー
- [ ] パフォーマンステスト

#### 5.2 データ検証
- [ ] 既存データの影響確認
- [ ] 新規データの整合性確認
- [ ] バックアップ・復旧手順確認

---

## 🧪 テスト仕様

### 単体テスト

#### API レイヤー
```typescript
// tests/api/schedules.test.ts
describe('Personal Schedules API', () => {
  test('POST /api/schedules - 正常作成', async () => {
    const scheduleData = {
      title: 'テスト予定',
      date: '2025-06-16',
      time: '14:00',
      userId: 'test_user_id',
      priority: 'B'
    };
    
    const response = await request(app)
      .post('/api/schedules')
      .send(scheduleData)
      .expect(201);
    
    expect(response.body.schedule.title).toBe('テスト予定');
  });
  
  test('GET /api/schedules - 日付フィルター', async () => {
    const response = await request(app)
      .get('/api/schedules?startDate=2025-06-16&endDate=2025-06-16')
      .expect(200);
    
    expect(response.body.schedules).toBeInstanceOf(Array);
  });
});
```

#### LINEボット統合テスト
```typescript
// tests/line-bot/classification.test.ts
describe('LINE Bot Classification', () => {
  test('個人予定の正しい分類', async () => {
    const testMessage = '明日の14時に歯医者の予定';
    const result = await extractDataFromTextWithAI(testMessage);
    
    expect(result.type).toBe('personal_schedule');
    expect(result.title).toContain('歯医者');
  });
  
  test('パブリック予定の正しい分類', async () => {
    const testMessage = '来週の月曜日にチーム会議';
    const result = await extractDataFromTextWithAI(testMessage);
    
    expect(result.type).toBe('schedule');
    expect(result.title).toContain('チーム会議');
  });
});
```

### 統合テスト

#### エンドツーエンドテスト
```typescript
// tests/e2e/personal-schedule-flow.test.ts
describe('Personal Schedule E2E Flow', () => {
  test('LINE → 作成 → 表示 → 編集 → 削除', async () => {
    // 1. LINEメッセージ送信シミュレーション
    const lineMessage = {
      events: [{
        type: 'message',
        message: { text: '明日の15時に美容院の予定' },
        source: { userId: 'test_user', groupId: 'test_group' },
        replyToken: 'test_token'
      }]
    };
    
    // 2. Webhook処理
    const webhookResponse = await request(app)
      .post('/api/webhook/line')
      .send(lineMessage)
      .expect(200);
    
    // 3. 個人予定が作成されたか確認
    const schedulesResponse = await request(app)
      .get('/api/schedules?userId=test_user')
      .expect(200);
    
    const createdSchedule = schedulesResponse.body.schedules
      .find(s => s.title.includes('美容院'));
    expect(createdSchedule).toBeDefined();
    
    // 4. 統合カレンダーに表示されるか確認
    const calendarResponse = await request(app)
      .get('/api/calendar/unified?includePersonal=true')
      .expect(200);
    
    const unifiedEvent = calendarResponse.body.events
      .find(e => e.id === createdSchedule.id);
    expect(unifiedEvent.source).toBe('personal_schedules');
    expect(unifiedEvent.isPersonal).toBe(true);
  });
});
```

### パフォーマンステスト

#### 大量データテスト
```sql
-- テストデータ生成
INSERT INTO personal_schedules (id, title, date, time, user_id, priority)
SELECT 
  'ps_' || generate_series || '_' || (random()*1000)::int,
  'テスト予定 ' || generate_series,
  (current_date + (generate_series % 365) * interval '1 day')::text,
  lpad((9 + (generate_series % 12))::text, 2, '0') || ':00',
  'test_user_' || ((generate_series % 100) + 1),
  CASE (generate_series % 4)
    WHEN 0 THEN 'A'
    WHEN 1 THEN 'B'
    WHEN 2 THEN 'C'
    ELSE 'D'
  END
FROM generate_series(1, 10000);
```

```typescript
// パフォーマンス測定
describe('Performance Tests', () => {
  test('統合カレンダーAPI - 1万件データで1秒以内', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/api/calendar/unified?startDate=2025-01-01&endDate=2025-12-31')
      .expect(200);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(responseTime).toBeLessThan(1000); // 1秒以内
    expect(response.body.events.length).toBeGreaterThan(0);
  });
});
```

---

## 📐 設計原則・制約事項

### 設計原則

1. **後方互換性の維持**
   - 既存の`calendar_events`テーブルは一切変更しない
   - 既存APIエンドポイントの動作は保持
   - フロントエンドの既存機能は影響を受けない

2. **データの分離**
   - 個人予定とパブリックイベントの明確な分離
   - 異なるテーブルでの管理によるデータ整合性確保

3. **拡張性**
   - 将来的な機能追加に対応できる設計
   - モジュラー構造による保守性向上

4. **パフォーマンス**
   - クエリ最適化による高速レスポンス
   - 適切なインデックス設計

### 制約事項

1. **技術制約**
   - Prisma ORMの制約に準拠
   - PostgreSQLの機能を活用
   - Next.js App Routerの規約に従う

2. **データ制約**
   - 日付形式: YYYY-MM-DD (ISO 8601)
   - 時刻形式: HH:mm (24時間制)
   - 優先度: A/B/C/D の4段階

3. **セキュリティ制約**
   - ユーザー認証必須
   - 個人データの適切な分離
   - APIアクセス制御

---

## 📊 期待される効果

### 機能面
- ✅ 個人予定の専用管理機能
- ✅ LINEボットからの自動分類・保存
- ✅ 統合カレンダー表示
- ✅ 優先度別の管理

### 技術面
- ✅ システムの安定性維持 (既存機能無変更)
- ✅ 拡張性の確保
- ✅ 保守性の向上

### ユーザー体験
- ✅ 直感的な個人予定管理
- ✅ LINEからの簡単登録
- ✅ 一元的なカレンダー表示
- ✅ 優先度による効率的な時間管理

---

## 📚 参考資料

### 既存システム文書
- `DATABASE_STRUCTURE_SPECIFICATION.md`
- `IMPLEMENTATION_MASTER_PLAN.md`
- `CALENDAR_IMPLEMENTATION_PROMPT.md`

### API仕様
- 既存カレンダーAPI: `/src/app/api/calendar/`
- LINEボットWebhook: `/src/app/api/webhook/line/`

---

**作成者**: Claude Code  
**レビュー**: 次期開発エンジニア  
**承認**: プロジェクトマネージャー  

---

*この仕様書は実装開始前に関係者全員でのレビューと承認が必要です。*
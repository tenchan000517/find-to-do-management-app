# タスク管理機能 現状実装報告書

作成日: 2025-01-14  
対象システム: Find To-Do Management App

## 1. 概要

本ドキュメントは、現在実装されているタスク管理機能の技術仕様と実装状況を記録したものです。今後の保守・改修作業において、エンジニアが現状を正確に把握できるよう、データベース構造、型定義、実装詳細を体系的にまとめています。

## 2. データベース構造

### 2.1 Taskテーブル (tasks)

| カラム名 | 型 | 制約 | 説明 |
|---------|---|------|------|
| id | String | PK, @default(cuid()) | 主キー |
| title | String | NOT NULL | タスクタイトル |
| description | String | @default("") | タスク詳細説明 |
| projectId | String? | FK → projects.id | 関連プロジェクトID（任意） |
| assignee | String | NOT NULL | 担当者名 |
| status | TaskStatus | @default(NOT_STARTED) | タスクステータス |
| priority | Priority | @default(MEDIUM) | 優先度 |
| dueDate | String | NOT NULL | 期限日 |
| createdAt | DateTime | @default(now()) | 作成日時 |
| updatedAt | DateTime | @updatedAt | 更新日時 |

### 2.2 列挙型定義

#### TaskStatus
```prisma
enum TaskStatus {
  NOT_STARTED  // 未着手
  STARTED      // 開始
  IN_PROGRESS  // 進行中
  NEARLY_DONE  // 完了間近
  COMPLETED    // 完了
}
```

#### Priority
```prisma
enum Priority {
  LOW     // 低
  MEDIUM  // 中
  HIGH    // 高
}
```

### 2.3 リレーション
- Task → Project: Many-to-One（任意）
- Project → Task: One-to-Many

## 3. 型定義

### 3.1 TypeScript インターフェース

**ファイル**: `/src/lib/types.ts`

```typescript
export interface Task {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  project?: Project;
  assigneeId: string;    // 現在未使用
  assignee: string;      // 担当者名として使用
  status: 0 | 25 | 50 | 75 | 100;  // パーセンテージ表現
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 ステータスマッピング

**ファイル**: `/src/lib/database/prisma-service.ts`

```typescript
// Prisma Enum → TypeScript数値
const reverseTaskStatusMap = {
  'NOT_STARTED': 0,
  'STARTED': 25,
  'IN_PROGRESS': 50,
  'NEARLY_DONE': 75,
  'COMPLETED': 100
};

// TypeScript数値 → Prisma Enum
const taskStatusMap = {
  0: 'NOT_STARTED',
  25: 'STARTED',
  50: 'IN_PROGRESS',
  75: 'NEARLY_DONE',
  100: 'COMPLETED'
};
```

## 4. API実装

### 4.1 エンドポイント

**ファイル**: `/src/app/api/tasks/route.ts`

| メソッド | パス | 機能 | パラメータ |
|---------|------|------|-----------|
| GET | /api/tasks | 全タスク取得 | なし |
| POST | /api/tasks | タスク作成 | Body: Task（id, createdAt, updatedAt除く） |
| PUT | /api/tasks | タスク更新 | Body: Task（createdAt除く） |
| DELETE | /api/tasks | タスク削除 | Query: id |

### 4.2 実装詳細
- Prisma ORMを使用（`prismaDataService`経由）
- エラーハンドリング: try-catchで500エラーを返却
- レスポンス形式: JSON

## 5. フロントエンド実装

### 5.1 カスタムフック

**ファイル**: `/src/hooks/useTasks.ts`

| 関数 | 機能 | 引数 | 戻り値 |
|------|------|------|--------|
| useTasks | タスク管理フック | なし | { tasks, loading, addTask, updateTask, deleteTask } |
| addTask | タスク追加 | Omit<Task, 'id' \| 'createdAt' \| 'updatedAt'> | Promise<void> |
| updateTask | タスク更新 | id: string, updates: Partial<Omit<Task, 'id' \| 'createdAt'>> | Promise<void> |
| deleteTask | タスク削除 | id: string | Promise<void> |

### 5.2 UIコンポーネント

#### タスク一覧ページ
**ファイル**: `/src/app/tasks/page.tsx`

機能:
- ビューモード切替（かんばん/リスト）
- 優先度フィルター
- タスク作成・編集モーダル
- ステータス更新（0%, 25%, 50%, 75%, 100%）

#### かんばんボード
**ファイル**: `/src/components/KanbanBoard.tsx`

機能:
- ドラッグ&ドロップ（@dnd-kit使用）
- 5列構成（ステータスごと）
- ユーザー別フィルタータブ
- 優先度の色分け表示

### 5.3 UI仕様

#### ステータス表示
| 数値 | 日本語表示 | 英語内部名 |
|------|-----------|-----------|
| 0% | 未着手 | NOT_STARTED |
| 25% | 開始 | STARTED |
| 50% | 進行中 | IN_PROGRESS |
| 75% | 完了間近 | NEARLY_DONE |
| 100% | 完了 | COMPLETED |

#### 優先度表示
| 値 | 日本語表示 | カラーコード |
|----|-----------|-------------|
| high | 高 | red-500 |
| medium | 中 | yellow-500 |
| low | 低 | blue-500 |

## 6. 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **スタイリング**: Tailwind CSS
- **ドラッグ&ドロップ**: @dnd-kit
- **状態管理**: React Hooks (useState, useEffect)

## 7. ファイル構成

```
src/
├── app/
│   ├── api/
│   │   └── tasks/
│   │       └── route.ts        # API実装
│   └── tasks/
│       └── page.tsx            # タスク一覧ページ
├── components/
│   └── KanbanBoard.tsx         # かんばんボードコンポーネント
├── hooks/
│   └── useTasks.ts             # タスク管理カスタムフック
├── lib/
│   ├── types.ts                # 型定義
│   └── database/
│       └── prisma-service.ts   # Prismaサービス
└── prisma/
    └── schema.prisma           # データベーススキーマ
```

## 8. 現在の制限事項

1. **担当者管理**: assigneeフィールドは文字列入力（ユーザーマスター未実装）
2. **ステータス**: 5段階の固定値のみ対応
3. **サブタスク**: 未対応
4. **依存関係**: タスク間の依存関係管理なし
5. **履歴管理**: 変更履歴の記録なし
6. **添付ファイル**: ファイルアップロード未対応
7. **一括操作**: 複数タスクの一括更新・削除未対応
8. **通知機能**: リマインダー・通知機能なし

## 9. 統合状況

- プロジェクト管理機能と連携（projectId経由）
- ダッシュボードでの統計表示対応
- ガントチャート表示対応（GanttChartコンポーネント）

---

### 備考
*今後の改善案については、以下のような方向性が考えられます：ユーザーマスターの実装、サブタスク機能、通知機能、一括操作、検索・フィルター機能の強化など。詳細は要件に応じて検討が必要です。*


ユーザーマスター登録
川島

  userId: 'Ua1ffc5321b117a134dfe6eb8a3827294',
1281631920308097046

弓木野

  userId: 'Uf1bb3a48bf5974b39540482116dd6d09',
1131429130823536702
漆畑

  userId: 'U869a0f7f41941e953d75f5e5f73d947f',
976427276340166696

池本
  userId: 'U65edb578f123dd915c6519f4b5730266',
  1143373602675232859
飯田
  userId: 'U89f20854525d480262ad4d290b5767d2',
  1232977995673894937


  ● 🔧 現在の問題点と修正が必要な箇所

  🚨 発見された問題

  1. モーダルのUX問題
    - 保存完了後にモーダルが閉じない
    - 保存中のローディング表示がない
    - 保存状態が不明確
  2. データ破損問題
    - タイトルが「Updated Title」に勝手に変更される
    - 日付が正しく保存されない（24日→25日表示）

  📁 修正対象ファイル

  主要修正ファイル:
  - /src/components/calendar/EventEditModal.tsx - モーダルのUX改善
  - /src/app/api/calendar/events/[id]/route.ts - PUT API修正
  - /src/components/calendar/CalendarView.tsx - 親コンポーネント連携

  🗄️ データベース情報

  接続方法:
  # Prisma Studio でデータベース確認
  npx prisma studio
  # ブラウザで http://localhost:5555 にアクセス

  # 直接データベース確認
  npx prisma db push  # スキーマ同期

  重要テーブル:
  - calendar_events - カレンダーイベント
  - personal_schedules - 個人予定

  🌐 サーバー情報

  現在の起動状況:
  - ポート: 3000
  - URL: http://localhost:3000
  - 状態: 起動中
  - フレームワーク: Next.js 15.3.3 (Turbopack)

  🛠️ JST統一対応済み

  実装済み機能:
  - /src/lib/utils/datetime-jst.ts - JST統一ユーティリティ
  - API全体でJST基準の日時処理
  - フロントエンドコンポーネントでJST対応

  🎯 次のClaude Codeでの修正作業

  1. EventEditModal.tsx の改善
    - 保存中ローディング追加
    - 保存完了後モーダル自動クローズ
    - エラーハンドリング強化
  2. データ保存問題の調査
    - PUT API のデータ変更箇所特定
    - 日付計算のJST対応確認
    - フォームデータの正確性確認
  3. デバッグ情報追加
    - 保存前後のデータログ出力
    - API レスポンス詳細確認

  問題のイベントID: personal_ps_1750033274803_5a70etu3r
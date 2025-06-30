# タスク管理機能改善 実装指示書

作成日: 2025-01-14  
対象: 実装担当エンジニア

## 重要事項

**必須参照ドキュメント**
1. `TASK_MANAGEMENT_CURRENT_STATUS_REPORT.md` - 現状の実装詳細
2. `TASK_MANAGEMENT_IMPROVEMENT_PLAN.md` - 改善計画全体

**実装前の必須確認**
- 現在のブランチ: `ui-improvements-proposal`
- 作業開始前に`git status`で現在の変更状況を確認すること
- 型定義の変更時は必ず全関連ファイルを同時に更新すること

## Phase 1: データベース基盤構築

### 1.1 事前準備 - ユーザーマスター登録

**対象ファイル**: `prisma/schema.prisma`

**追加する初期ユーザーデータ**（現状報告書末尾に記載された情報を使用）:
```typescript
// 初期ユーザーデータ
const initialUsers = [
  {
    name: "川島",
    lineUserId: "Ua1ffc5321b117a134dfe6eb8a3827294",
    color: "#FF5733", // 赤系
    email: null
  },
  {
    name: "弓木野", 
    lineUserId: "Uf1bb3a48bf5974b39540482116dd6d09",
    color: "#33FF57", // 緑系
    email: null
  },
  {
    name: "漆畑",
    lineUserId: "U869a0f7f41941e953d75f5e5f73d947f", 
    color: "#F5FF33", // 黄系
    email: null
  },
  {
    name: "池本",
    lineUserId: null, // 後で登録
    color: "#FF33F5", // ピンク系
    email: null
  },
  {
    name: "飯田",
    lineUserId: null, // 後で登録
    color: "#3357FF", // 青系
    email: null
  }
];
```

### 1.2 Prismaスキーマ更新

**対象ファイル**: `prisma/schema.prisma`

**重要**: 既存のTaskモデルとの整合性を保つため、以下の順序で実装すること

1. **新規モデル追加**
```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  email        String?  @unique
  lineUserId   String?  @unique
  color        String   // カラーコード
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  tasks        Task[]
  collaborations TaskCollaborator[]
  
  @@map("users")
}

model TaskCollaborator {
  id         String   @id @default(cuid())
  taskId     String
  userId     String
  createdAt  DateTime @default(now())
  
  task       Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([taskId, userId])
  @@map("task_collaborators")
}

model TaskArchive {
  id             String       @id @default(cuid())
  originalTaskId String       @unique
  taskData       Json
  archiveLevel   ArchiveLevel @default(SOFT)
  archivedAt     DateTime     @default(now())
  
  @@map("task_archives")
}

enum ArchiveLevel {
  SOFT      // 1ヶ月以内、復元可能
  PERMANENT // 1ヶ月以降、完全アーカイブ
  
  @@map("archive_level")
}
```

2. **既存列挙型の更新**
```prisma
enum TaskStatus {
  IDEA       // アイデア
  PLAN       // 計画中  
  DO         // 実行中
  CHECK      // 課題・改善
  COMPLETE   // 完了
  KNOWLEDGE  // ナレッジ昇華
  DELETE     // リスケ
  
  @@map("task_status")
}

enum Priority {
  A  // 最優先（緊急かつ重要）
  B  // 重要（緊急ではないが重要）
  C  // 緊急（緊急だが重要ではない）
  D  // その他（緊急でも重要でもない）
  
  @@map("priority")
}
```

3. **Taskモデルの更新**（段階的に実装）
```prisma
model Task {
  id          String     @id @default(cuid())
  title       String
  description String     @default("")
  projectId   String?
  userId      String     // assigneeから変更
  status      TaskStatus @default(IDEA)
  priority    Priority   @default(C)
  dueDate     String?    // 必須から任意に変更
  isArchived  Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  project     Project?   @relation(fields: [projectId], references: [id])
  user        User       @relation(fields: [userId], references: [id])
  collaborators TaskCollaborator[]
  
  @@map("tasks")
}
```

### 1.3 マイグレーション戦略

**必須手順**:
1. `npx prisma db push` でスキーマをプッシュ
2. 初期ユーザーデータのシードスクリプト作成
3. 既存タスクデータの移行スクリプト作成

**移行用スクリプト**: `scripts/migrate-tasks.ts`
```typescript
// 既存のassigneeフィールドから新しいuserIdへのマッピング
const userMapping = {
  "川島": "川島のuserId",
  "弓木野": "弓木野のuserId",
  // ... 他のユーザー
};

// 既存ステータスの変換
const statusMapping = {
  "NOT_STARTED": "IDEA",
  "STARTED": "PLAN", 
  "IN_PROGRESS": "DO",
  "NEARLY_DONE": "CHECK",
  "COMPLETED": "COMPLETE"
};

// 既存優先度の変換
const priorityMapping = {
  "HIGH": "A",
  "MEDIUM": "B", 
  "LOW": "C"
};
```

## Phase 2: 型定義の更新

### 2.1 基本型定義の更新

**対象ファイル**: `src/lib/types.ts`

**重要**: 既存のコードとの互換性を維持するため、段階的に更新すること

```typescript
// 新規追加
export interface User {
  id: string;
  name: string;
  email?: string;
  lineUserId?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCollaborator {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

// 既存Taskインターフェースの更新
export interface Task {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  project?: Project;
  userId: string;              // assigneeIdから変更
  user?: User;                // assigneeから変更
  collaborators?: TaskCollaborator[];
  status: 'IDEA' | 'PLAN' | 'DO' | 'CHECK' | 'COMPLETE' | 'KNOWLEDGE' | 'DELETE';
  priority: 'A' | 'B' | 'C' | 'D';
  dueDate?: string;           // 必須から任意に変更
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// 表示用の定数
export const TASK_STATUS_LABELS = {
  IDEA: 'アイデア',
  PLAN: '計画中',
  DO: '実行中', 
  CHECK: '課題・改善',
  COMPLETE: '完了',
  KNOWLEDGE: 'ナレッジ昇華',
  DELETE: 'リスケ'
} as const;

export const PRIORITY_LABELS = {
  A: '最優先',
  B: '重要', 
  C: '緊急',
  D: '要検討'
} as const;
```

### 2.2 ステータスマッピングの更新

**対象ファイル**: `src/lib/database/prisma-service.ts`

**重要**: 既存のマッピングは完全に置き換えること

```typescript
// 新しいステータスマッピング（旧コードを完全に削除）
export const TASK_STATUS_TO_PRISMA = {
  'IDEA': 'IDEA',
  'PLAN': 'PLAN', 
  'DO': 'DO',
  'CHECK': 'CHECK',
  'COMPLETE': 'COMPLETE',
  'KNOWLEDGE': 'KNOWLEDGE',
  'DELETE': 'DELETE'
} as const;

export const PRISMA_TO_TASK_STATUS = {
  'IDEA': 'IDEA',
  'PLAN': 'PLAN',
  'DO': 'DO', 
  'CHECK': 'CHECK',
  'COMPLETE': 'COMPLETE',
  'KNOWLEDGE': 'KNOWLEDGE',
  'DELETE': 'DELETE'
} as const;

// 優先度マッピング
export const PRIORITY_TO_PRISMA = {
  'A': 'A',
  'B': 'B',
  'C': 'C', 
  'D': 'D'
} as const;
```

## Phase 3: API実装

### 3.1 User API

**新規ファイル**: `src/app/api/users/route.ts`

**必須機能**:
- GET: 全ユーザー取得（isActive=trueのみ）
- POST: ユーザー作成
- PUT: ユーザー更新

**新規ファイル**: `src/app/api/users/line/[lineId]/route.ts`

**必須機能**:
- GET: LINEユーザーIDでユーザー検索

### 3.2 Task API の更新

**対象ファイル**: `src/app/api/tasks/route.ts`

**重要な修正点**:
1. 既存のassigneeフィールドの処理を削除
2. userIdフィールドの処理を追加
3. collaboratorsの処理を追加
4. isArchived=falseの条件を追加

**必須の include 設定**:
```typescript
const includeOptions = {
  user: true,
  project: true,
  collaborators: {
    include: {
      user: true
    }
  }
};
```

### 3.3 新規APIエンドポイント

**ファイル**: `src/app/api/tasks/[id]/collaborators/route.ts`
- POST: コラボレーター追加
- DELETE: コラボレーター削除

**ファイル**: `src/app/api/tasks/[id]/archive/route.ts`
- POST: タスクアーカイブ
- DELETE: タスク復元

## Phase 4: カスタムフック更新

### 4.1 useTasks フックの更新

**対象ファイル**: `src/hooks/useTasks.ts`

**重要な変更点**:
1. 型定義の更新（新しいTaskインターフェースに合わせる）
2. API呼び出しの更新（新しいフィールドに対応）
3. エラーハンドリングの強化

**必須機能追加**:
```typescript
// 新規追加する関数
const moveTaskToUser = async (taskId: string, newUserId: string) => {
  // ユーザー間でタスクを移動
};

const archiveTask = async (taskId: string) => {
  // タスクをアーカイブ
};

const addCollaborator = async (taskId: string, userId: string) => {
  // コラボレーター追加
};
```

### 4.2 新規カスタムフック

**新規ファイル**: `src/hooks/useUsers.ts`
- ユーザー一覧取得
- LINEユーザーID検索
- ユーザー作成・更新

## Phase 5: UI コンポーネント更新

### 5.1 KanbanBoard の大幅更新

**対象ファイル**: `src/components/KanbanBoard.tsx`

**重要な実装要件**:
1. 既存のdnd-kit設定を保持
2. 新しいステータス（7列）に対応
3. タブ切替機能の追加
4. ユーザー色の適用

**必須のタブ構成**:
```typescript
const tabs = [
  { id: 'status', label: 'ステータス別' },
  { id: 'user', label: 'ユーザー別' }
];
```

**必須のカラム定義**:
```typescript
const statusColumns = [
  { id: 'IDEA', label: 'アイデア' },
  { id: 'PLAN', label: '計画中' },
  { id: 'DO', label: '実行中' },
  { id: 'CHECK', label: '課題・改善' },
  { id: 'COMPLETE', label: '完了' },
  { id: 'KNOWLEDGE', label: 'ナレッジ昇華' },
  { id: 'DELETE', label: 'リスケ' }
];
```

### 5.2 タスクモーダルの更新

**対象ファイル**: `src/app/tasks/page.tsx`

**重要な修正点**:
1. assigneeフィールドを削除
2. userIdドロップダウンを追加
3. collaboratorsマルチセレクトを追加
4. 新しいステータス・優先度に対応

**必須のドロップダウンコンポーネント**:
```typescript
// ユーザー選択ドロップダウン
<select name="userId" required>
  {users.map(user => (
    <option key={user.id} value={user.id}>
      {user.name}
    </option>
  ))}
</select>
```

### 5.3 ナレッジ昇華UI

**対象ファイル**: `src/components/KnowledgeCard.tsx` (新規)

**必須機能**:
- 「ナレッジ昇華待機中」の目立つラベル
- 「ナレッジ登録」ボタン
- ユーザーカラーの適用

## 実装時の注意事項

### データ型の整合性
1. **dateフィールド**: 既存のstring型を維持（ISO 8601形式）
2. **ID型**: 全てstring型（CUID使用）
3. **boolean型**: isArchived, isActiveなど明示的に定義

### エラーハンドリング
1. **必須**: 全てのAPI呼び出しでtry-catch使用
2. **必須**: ユーザーフレンドリーなエラーメッセージ
3. **必須**: 楽観的更新の失敗時のロールバック

### パフォーマンス
1. **必須**: アーカイブタスクの除外クエリ
2. **推奨**: ユーザーデータのキャッシュ
3. **推奨**: 不要なre-renderの防止

### セキュリティ
1. **必須**: LINEユーザーIDの適切な検証
2. **必須**: SQLインジェクション対策（Prismaで自動対応）
3. **必須**: XSS対策（入力値のサニタイズ）

## テスト項目

### 必須テスト
1. 既存タスクの表示確認
2. 新しいステータス変更の動作確認
3. ユーザー間タスク移動の確認
4. アーカイブ・復元の確認
5. コラボレーター機能の確認

### 回帰テスト
1. 既存のドラッグ&ドロップ機能
2. プロジェクト連携機能
3. 既存のフィルタリング機能

## 完了条件

- [ ] 全てのTypeScriptコンパイルエラーが解消
- [ ] 既存機能の回帰テスト完了
- [ ] 新機能の動作確認完了
- [ ] パフォーマンステスト完了
- [ ] 初期ユーザーデータの登録完了

## 緊急時の連絡先

実装中に不明な点がある場合は、現状報告書と改善計画書を再確認し、必要に応じて質問してください。

---

**重要**: この指示書に従って段階的に実装することで、型の不一致やオーバーエンジニアリングを防ぎ、確実に改善計画を完遂できます。
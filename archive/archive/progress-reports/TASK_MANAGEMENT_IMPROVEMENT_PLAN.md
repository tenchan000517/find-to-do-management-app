# タスク管理機能 改善計画書

作成日: 2025-01-14  
対象システム: Find To-Do Management App

## 1. 改善概要

本計画書は、現状のタスク管理機能に対する包括的な改善計画を示すものです。ユーザー管理の導入、ステータス体系の刷新、UIの高度化、アーカイブ機能の実装を通じて、より効率的で使いやすいタスク管理システムを実現します。

## 2. 改善項目一覧

### 2.1 ユーザーマスター機能の追加
- 事前登録型ユーザー管理
- LINEユーザーID連携
- ユーザー別カラーテーマ
- コラボレーター機能

### 2.2 ステータス体系の刷新
- 7段階のワークフローステータス
- PDCAサイクルベースの設計

### 2.3 カンバンボードの高度化
- タブ切替機能（ステータス別/ユーザー別）
- ドラッグ&ドロップによるユーザー間タスク移動
- ユーザー別色分け表示

### 2.4 優先度システムの再定義
- アイゼンハワーマトリクス準拠の4段階

### 2.5 ナレッジ管理機能
- ナレッジ昇華プロセス
- ナレッジ登録連携

### 2.6 アーカイブシステム
- 段階的アーカイブ処理
- 復元機能

## 3. データベース設計変更

### 3.1 新規テーブル

#### Userテーブル
```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  email        String?  @unique
  lineUserId   String?  @unique
  color        String   // #FF5733 などのカラーコード
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  tasks        Task[]
  collaborations TaskCollaborator[]
  
  @@map("users")
}
```

#### TaskCollaboratorテーブル（コラボレーター管理）
```prisma
model TaskCollaborator {
  id         String   @id @default(cuid())
  taskId     String
  userId     String
  createdAt  DateTime @default(now())
  
  task       Task     @relation(fields: [taskId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
  
  @@unique([taskId, userId])
  @@map("task_collaborators")
}
```

#### TaskArchiveテーブル
```prisma
model TaskArchive {
  id             String   @id @default(cuid())
  originalTaskId String   @unique
  taskData       Json     // 圧縮されたタスクデータ
  archiveLevel   ArchiveLevel @default(SOFT)
  archivedAt     DateTime @default(now())
  
  @@map("task_archives")
}

enum ArchiveLevel {
  SOFT      // 1ヶ月以内、復元可能
  PERMANENT // 1ヶ月以降、完全アーカイブ
}
```

### 3.2 既存テーブルの変更

#### Taskテーブル
```prisma
model Task {
  id          String     @id @default(cuid())
  title       String
  description String     @default("")
  projectId   String?
  userId      String     // assigneeからuserIdに変更
  status      TaskStatus @default(IDEA)
  priority    Priority   @default(C)
  dueDate     String?    // 任意に変更
  isArchived  Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  project     Project?   @relation(fields: [projectId], references: [id])
  user        User       @relation(fields: [userId], references: [id])
  collaborators TaskCollaborator[]
  
  @@map("tasks")
}
```

#### 列挙型の変更
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

## 4. 型定義の更新

### 4.1 User型
```typescript
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
```

### 4.2 Task型の更新
```typescript
export interface Task {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  project?: Project;
  userId: string;        // assigneeIdから変更
  user?: User;          // リレーション
  collaborators?: User[]; // コラボレーター
  status: 'IDEA' | 'PLAN' | 'DO' | 'CHECK' | 'COMPLETE' | 'KNOWLEDGE' | 'DELETE';
  priority: 'A' | 'B' | 'C' | 'D';
  dueDate?: string;     // 任意に変更
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## 5. API設計

### 5.1 User API
```
GET    /api/users              - 全ユーザー取得
POST   /api/users              - ユーザー作成
PUT    /api/users/:id          - ユーザー更新
DELETE /api/users/:id          - ユーザー削除（論理削除）
GET    /api/users/line/:lineId - LINEユーザーID検索
```

### 5.2 Task API（更新）
```
GET    /api/tasks              - タスク一覧（アーカイブ除外）
GET    /api/tasks/archived     - アーカイブタスク一覧
POST   /api/tasks              - タスク作成
PUT    /api/tasks/:id          - タスク更新
DELETE /api/tasks/:id          - タスク削除（アーカイブ）
POST   /api/tasks/:id/restore  - タスク復元
POST   /api/tasks/:id/collaborators - コラボレーター追加
DELETE /api/tasks/:id/collaborators/:userId - コラボレーター削除
```

### 5.3 Knowledge API
```
POST   /api/knowledge/from-task/:taskId - タスクからナレッジ作成
```

## 6. UI/UX設計

### 6.1 カンバンボード改善

#### タブ構成
1. **ステータス別表示タブ**
   - アイデア
   - 計画中
   - 実行中
   - 課題・改善
   - 完了
   - ナレッジ昇華
   - リスケ

2. **ユーザー別表示タブ**
   - ユーザーごとのタスク一覧
   - ドラッグ&ドロップでユーザー間移動

#### カード表示
- ユーザーカラーによる背景色/ボーダー色
- 優先度バッジ（A/B/C/D）
- コラボレーターアイコン表示

### 6.2 タスク作成・編集モーダル

#### フォーム項目
- タイトル（必須）
- 説明
- 担当者（ドロップダウン選択）
- プロジェクト（ドロップダウン選択）
- ステータス（ドロップダウン選択）
- 優先度（ラジオボタン）
- 期限（任意）
- コラボレーター（複数選択可能）

### 6.3 フィルタリング機能

#### フィルター条件
- 優先度（A/B/C/D）
- ステータス
- 担当者
- プロジェクト
- 期限（期限切れ/今週/今月など）

### 6.4 ナレッジ昇華UI

#### 特殊カード表示
- 「ナレッジ昇華待機中」ラベル
- 「ナレッジ登録」ボタン（目立つデザイン）
- 登録後の自動完了処理

## 7. 実装手順

### Phase 1: データベース基盤（1週間）
1. Userテーブル作成
2. TaskCollaboratorテーブル作成
3. TaskArchiveテーブル作成
4. Taskテーブル更新
5. マイグレーション実行

### Phase 2: API開発（1週間）
1. User APIの実装
2. Task APIの更新
3. アーカイブ機能の実装
4. Knowledge連携APIの実装

### Phase 3: UI実装（2週間）
1. ユーザー選択ドロップダウン
2. 新ステータス対応
3. カンバンボードのタブ切替
4. ユーザー別カラー表示
5. フィルタリング機能
6. ナレッジ昇華UI

### Phase 4: 統合・テスト（1週間）
1. LINE連携テスト
2. アーカイブ・復元テスト
3. パフォーマンステスト
4. UIテスト

## 8. 技術的考慮事項

### 8.1 パフォーマンス
- アーカイブされたタスクの除外によるクエリ最適化
- ユーザーカラーのキャッシュ
- タブ切替時の状態保持

### 8.2 データ整合性
- ユーザー削除時のタスク処理
- アーカイブ時のリレーション保持
- コラボレーター重複防止

### 8.3 セキュリティ
- LINEユーザーIDの暗号化保存
- ユーザー間のタスク移動権限（現状は制限なし）

### 8.4 バックアップ
- アーカイブデータの定期バックアップ
- 復元テストの定期実施

## 9. 移行計画

1. **既存データの移行**
   - assigneeからuserIdへのマッピング
   - 既存ステータスの新ステータスへの変換
   - 優先度の変換（HIGH→A, MEDIUM→B, LOW→C）

2. **段階的リリース**
   - Phase 1: ユーザーマスター機能
   - Phase 2: 新ステータス・優先度
   - Phase 3: UI改善
   - Phase 4: アーカイブ機能

## 10. 成功指標

- タスク登録時間の短縮（ユーザー選択の効率化）
- ステータス管理の明確化
- アーカイブによるパフォーマンス向上
- ユーザビリティの向上（カラー識別）

---

本計画書に基づいて段階的に実装を進めることで、より高度で使いやすいタスク管理システムを実現します。
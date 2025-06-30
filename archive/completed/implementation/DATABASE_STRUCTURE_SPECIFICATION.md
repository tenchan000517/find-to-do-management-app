# データベース構造仕様書

## 概要
FIND to DO タスク管理システムのデータベース構造仕様書です。PostgreSQLとPrisma ORMを使用しています。

---

## 1. データベース設定

### 接続情報
- **データベース**: PostgreSQL
- **ORM**: Prisma v6.9.0
- **プロバイダー**: Neon Database (クラウドPostgreSQL)

### 設定ファイル
- **スキーマファイル**: `prisma/schema.prisma`
- **接続文字列**: 環境変数 `DATABASE_URL`

---

## 2. モデル定義

### 2.1 Users（ユーザー）
ユーザー情報を管理するテーブル

```prisma
model users {
  id                 String               @id
  name               String
  email              String?              @unique
  lineUserId         String?              @unique
  color              String
  isActive           Boolean              @default(true)
  createdAt          DateTime             @default(now())
  updatedAt          DateTime
  task_collaborators task_collaborators[]
  tasks              tasks[]
}
```

#### フィールド説明
- `id`: 主キー（CUID形式）
- `name`: ユーザー名（必須）
- `email`: メールアドレス（オプション、一意制約）
- `lineUserId`: LINE連携用ID（オプション、一意制約）
- `color`: ユーザー識別用カラー（必須）
- `isActive`: アクティブ状態（デフォルト: true）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

#### リレーション
- `tasks`: 担当しているタスク（1対多）
- `task_collaborators`: タスクコラボレーター（1対多）

---

### 2.2 Projects（プロジェクト）
プロジェクト情報を管理するテーブル

```prisma
model projects {
  id          String         @id
  name        String
  description String         @default("")
  status      project_status @default(PLANNING)
  progress    Int            @default(0)
  startDate   String
  endDate     String?
  teamMembers String[]       @default([])
  priority    priority       @default(C)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime
  tasks       tasks[]
}
```

#### フィールド説明
- `id`: 主キー（CUID形式）
- `name`: プロジェクト名（必須）
- `description`: 説明（デフォルト: 空文字）
- `status`: ステータス（PLANNING/ACTIVE/ON_HOLD/COMPLETED）
- `progress`: 進捗率（0-100）
- `startDate`: 開始日（文字列）
- `endDate`: 終了日（オプション）
- `teamMembers`: チームメンバーIDの配列
- `priority`: 優先度（A/B/C/D）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

#### リレーション
- `tasks`: 関連タスク（1対多）

---

### 2.3 Tasks（タスク）
タスク情報を管理するテーブル

```prisma
model tasks {
  id                 String               @id
  title              String
  description        String               @default("")
  projectId          String?
  userId             String
  status             task_status          @default(IDEA)
  priority           priority             @default(C)
  dueDate            String?
  isArchived         Boolean              @default(false)
  createdAt          DateTime             @default(now())
  updatedAt          DateTime
  task_collaborators task_collaborators[]
  projects           projects?            @relation(fields: [projectId], references: [id])
  users              users                @relation(fields: [userId], references: [id])
}
```

#### フィールド説明
- `id`: 主キー（CUID形式）
- `title`: タスク名（必須）
- `description`: 説明（デフォルト: 空文字）
- `projectId`: 関連プロジェクトID（オプション）
- `userId`: 担当者ID（必須）
- `status`: ステータス（7段階ワークフロー）
- `priority`: 優先度（A/B/C/D）
- `dueDate`: 期限日（オプション）
- `isArchived`: アーカイブ状態（デフォルト: false）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

#### リレーション
- `projects`: 関連プロジェクト（多対1）
- `users`: 担当者（多対1）
- `task_collaborators`: コラボレーター（1対多）

---

### 2.4 Task_collaborators（タスクコラボレーター）
タスクの協力者を管理するテーブル

```prisma
model task_collaborators {
  id        String   @id
  taskId    String
  userId    String
  createdAt DateTime @default(now())
  tasks     tasks    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  users     users    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([taskId, userId])
}
```

#### フィールド説明
- `id`: 主キー（CUID形式）
- `taskId`: タスクID（必須）
- `userId`: ユーザーID（必須）
- `createdAt`: 作成日時

#### 制約
- `[taskId, userId]`: 複合ユニーク制約（同一タスクに同一ユーザーは1回のみ）
- カスケード削除（タスクまたはユーザー削除時に自動削除）

---

### 2.5 Task_archives（タスクアーカイブ）
削除・アーカイブされたタスクを管理するテーブル

```prisma
model task_archives {
  id             String        @id
  originalTaskId String        @unique
  taskData       Json
  archiveLevel   archive_level @default(SOFT)
  archivedAt     DateTime      @default(now())
}
```

#### フィールド説明
- `id`: 主キー（CUID形式）
- `originalTaskId`: 元のタスクID（一意制約）
- `taskData`: タスクデータのJSON
- `archiveLevel`: アーカイブレベル（SOFT/PERMANENT）
- `archivedAt`: アーカイブ日時

---

### 2.6 Connections（人脈）
人脈・コネクション情報を管理するテーブル

```prisma
model connections {
  id           String          @id
  date         String
  location     String
  company      String
  name         String
  position     String
  type         connection_type @default(COMPANY)
  description  String
  conversation String
  potential    String
  businessCard String?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime
}
```

#### フィールド説明
- `id`: 主キー（CUID形式）
- `date`: 出会った日付
- `location`: 出会った場所
- `company`: 会社名
- `name`: 氏名（必須）
- `position`: 役職
- `type`: タイプ（STUDENT/COMPANY）
- `description`: 説明・メモ
- `conversation`: 会話内容
- `potential`: ポテンシャル
- `businessCard`: 名刺画像（オプション）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

---

### 2.7 Calendar_events（カレンダーイベント）
予定・イベント情報を管理するテーブル

```prisma
model calendar_events {
  id           String     @id
  title        String
  date         String
  time         String
  type         event_type @default(MEETING)
  description  String     @default("")
  participants String[]   @default([])
  location     String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime
}
```

#### フィールド説明
- `id`: 主キー（CUID形式）
- `title`: イベント名（必須）
- `date`: 日付
- `time`: 時間
- `type`: タイプ（MEETING/EVENT/DEADLINE）
- `description`: 説明（デフォルト: 空文字）
- `participants`: 参加者の配列
- `location`: 場所（オプション）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

---

### 2.8 Appointments（アポイントメント）
営業・商談のアポイントメント管理テーブル

```prisma
model appointments {
  id          String             @id
  companyName String
  contactName String
  phone       String
  email       String
  status      appointment_status @default(PENDING)
  lastContact String?
  nextAction  String
  notes       String             @default("")
  priority    priority           @default(C)
  createdAt   DateTime           @default(now())
  updatedAt   DateTime
}
```

#### フィールド説明
- `id`: 主キー（CUID形式）
- `companyName`: 会社名（必須）
- `contactName`: 担当者名（必須）
- `phone`: 電話番号（必須）
- `email`: メールアドレス（必須）
- `status`: ステータス（PENDING/CONTACTED/INTERESTED/NOT_INTERESTED/SCHEDULED）
- `lastContact`: 最終連絡日（オプション）
- `nextAction`: 次のアクション（必須）
- `notes`: メモ（デフォルト: 空文字）
- `priority`: 優先度（A/B/C/D）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

---

### 2.9 Knowledge_items（ナレッジアイテム）
知識・情報を管理するテーブル

```prisma
model knowledge_items {
  id        String             @id
  title     String
  category  knowledge_category @default(BUSINESS)
  content   String
  author    String
  tags      String[]           @default([])
  likes     Int                @default(0)
  createdAt DateTime           @default(now())
  updatedAt DateTime
}
```

#### フィールド説明
- `id`: 主キー（CUID形式）
- `title`: タイトル（必須）
- `category`: カテゴリ（INDUSTRY/SALES/TECHNICAL/BUSINESS）
- `content`: 内容（必須）
- `author`: 著者（必須）
- `tags`: タグの配列
- `likes`: いいね数（デフォルト: 0）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

---

### 2.10 Line_integration_logs（LINE連携ログ）
LINE連携の処理ログを管理するテーブル

```prisma
model line_integration_logs {
  id               String            @id
  messageId        String
  groupId          String
  userId           String
  originalMessage  String
  processedMessage String
  extractedData    Json?
  processingStatus processing_status @default(PENDING)
  confidence       Float             @default(0.0)
  createdItems     Json              @default("[]")
  userConfirmation Boolean?
  errorMessage     String?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime
}
```

#### フィールド説明
- `id`: 主キー（CUID形式）
- `messageId`: LINEメッセージID
- `groupId`: LINEグループID
- `userId`: LINEユーザーID
- `originalMessage`: 元のメッセージ
- `processedMessage`: 処理後メッセージ
- `extractedData`: 抽出データ（JSON）
- `processingStatus`: 処理ステータス（PENDING/PROCESSED/FAILED/MANUAL_REVIEW）
- `confidence`: 処理精度（0.0-1.0）
- `createdItems`: 作成されたアイテム（JSON配列）
- `userConfirmation`: ユーザー確認状態
- `errorMessage`: エラーメッセージ
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

---

## 3. 列挙型（Enum）定義

### 3.1 task_status（タスクステータス）
7段階ワークフロー
```prisma
enum task_status {
  IDEA      // アイデア
  PLAN      // 計画中
  DO        // 実行中
  CHECK     // 課題・改善
  COMPLETE  // 完了
  KNOWLEDGE // ナレッジ昇華
  DELETE    // リスケ
}
```

### 3.2 project_status（プロジェクトステータス）
```prisma
enum project_status {
  PLANNING  // 企画中
  ACTIVE    // 進行中
  ON_HOLD   // 保留中
  COMPLETED // 完了
}
```

### 3.3 priority（優先度）
アイゼンハワーマトリックス
```prisma
enum priority {
  A  // 緊急・重要
  B  // 緊急・重要でない
  C  // 緊急でない・重要
  D  // 緊急でない・重要でない
}
```

### 3.4 connection_type（コネクションタイプ）
```prisma
enum connection_type {
  STUDENT   // 学生
  COMPANY   // 企業・その他
}
```

### 3.5 event_type（イベントタイプ）
```prisma
enum event_type {
  MEETING   // ミーティング
  EVENT     // イベント
  DEADLINE  // 締切
}
```

### 3.6 appointment_status（アポイントメントステータス）
```prisma
enum appointment_status {
  PENDING        // 未処理
  CONTACTED      // 連絡済み
  INTERESTED     // 興味あり
  NOT_INTERESTED // 興味なし
  SCHEDULED      // 予定設定済み
}
```

### 3.7 knowledge_category（ナレッジカテゴリ）
```prisma
enum knowledge_category {
  INDUSTRY   // 業界情報
  SALES      // 営業
  TECHNICAL  // 技術
  BUSINESS   // ビジネス
}
```

### 3.8 processing_status（処理ステータス）
```prisma
enum processing_status {
  PENDING        // 処理待ち
  PROCESSED      // 処理済み
  FAILED         // 失敗
  MANUAL_REVIEW  // 手動確認要
}
```

### 3.9 archive_level（アーカイブレベル）
```prisma
enum archive_level {
  SOFT       // ソフト削除
  PERMANENT  // 完全削除
}
```

---

## 4. データベース初期化

### 4.1 マイグレーション
```bash
npx prisma db push
```

### 4.2 シードデータ
- **ユーザー**: 5名（川島、弓木野、漆畑、池本、飯田）
- **プロジェクト**: 15件（実際の進行中プロジェクト）
- **コネクション**: 51件（人脈データ）
- **カレンダーイベント**: 51件（予定データ）

### 4.3 現在のデータ状況
```
👥 ユーザー: 5名
📝 タスク: 0件（新規作成対応）
🚀 プロジェクト: 15件
📞 アポイントメント: 0件（新規作成対応）
🤝 コネクション: 51件
📅 カレンダーイベント: 51件
```

---

## 5. API設計

### 5.1 エンドポイント一覧
- `GET/POST /api/users` - ユーザー管理
- `GET/POST/PUT/DELETE /api/tasks` - タスク管理
- `GET/POST/PUT/DELETE /api/projects` - プロジェクト管理
- `GET/POST/PUT/DELETE /api/connections` - コネクション管理
- `GET/POST/PUT/DELETE /api/calendar` - カレンダー管理
- `GET/POST/PUT/DELETE /api/appointments` - アポイントメント管理

### 5.2 認証
- LINE連携によるユーザー識別
- セッション管理なし（現在の実装）

---

## 6. パフォーマンス考慮事項

### 6.1 インデックス
現在の実装では自動インデックスのみ
- 主キー（id）
- ユニーク制約（email, lineUserId）
- 外部キー制約

### 6.2 最適化案
- `tasks.userId` にインデックス追加
- `tasks.projectId` にインデックス追加
- `calendar_events.date` にインデックス追加
- `connections.type` にインデックス追加

---

## 7. セキュリティ

### 7.1 データ保護
- 機密情報は含まれていない設計
- ユーザーデータは最小限
- LINE連携IDによる識別

### 7.2 入力検証
- Prismaスキーマレベルでの型チェック
- 必須フィールドの強制
- 一意制約による重複防止

---

## 8. 今後の拡張計画

### 8.1 追加予定機能
- タスクの依存関係管理
- プロジェクトのマイルストーン管理
- 通知機能
- ファイル添付機能

### 8.2 スキーマ変更予定
- タスクの時間追跡フィールド
- プロジェクトの予算管理
- ユーザーの権限管理
- 監査ログテーブル

---

**作成日**: 2025年6月14日  
**バージョン**: 1.0  
**最終更新**: データベース構造の完全実装後
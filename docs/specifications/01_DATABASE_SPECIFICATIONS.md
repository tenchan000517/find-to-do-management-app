# データベース仕様書

## 1. データベース概要

### 1.1 基本情報
- **DBMS**: PostgreSQL
- **ORM**: Prisma
- **文字エンコーディング**: UTF-8
- **タイムゾーン**: JST (Asia/Tokyo)
- **テーブル数**: 37テーブル
- **Enum数**: 15種類

### 1.2 設計原則
- **正規化**: 第3正規形まで適用
- **命名規則**: snake_case (テーブル名)、camelCase (フィールド名)
- **外部キー制約**: カスケード削除設定
- **インデックス**: パフォーマンス最適化のための戦略的配置
- **監査**: createdAt, updatedAt による変更履歴管理

## 2. コアエンティティ

### 2.1 ユーザー管理

#### users テーブル
```sql
model users {
  id                    String    @id
  name                  String
  email                 String?   @unique
  lineUserId            String?   @unique
  discordId             String?   @unique
  color                 String
  isActive              Boolean   @default(true)
  role                  UserRole  @default(MEMBER)
  weeklyCommitHours     Int?      @default(20)
  currentLoadPercentage Float?    @default(0.0)
  mbtiType              String?
  
  -- メタデータ
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  lastLoginAt           DateTime?
  loginCount            Int       @default(0)
  
  -- JSON フィールド
  skills                Json      @default("{}")
  preferences           Json      @default("{}")
  workStyle             Json      @default("{}")
  permissions           Json      @default("{}")
  securitySettings      Json      @default("{}")
  studentResourceData   Json      @default("{}")
}
```

**主要な関係性**:
- 1対多: tasks (作成者・担当者・ユーザー)
- 1対多: projects (マネージャー・作成者)
- 1対多: appointments (担当者・作成者)
- 1対多: calendar_events (ユーザー・担当者・作成者)
- 1対多: knowledge_items (担当者・作成者)
- 1対多: connections (担当者・作成者)

### 2.2 タスク管理

#### tasks テーブル
```sql
model tasks {
  id                  String        @id
  title               String
  description         String        @default("")
  projectId           String?
  userId              String
  status              task_status   @default(IDEA)
  priority            priority      @default(C)
  dueDate             String?
  isArchived          Boolean       @default(false)
  
  -- パフォーマンス関連
  estimatedHours      Float         @default(0)
  actualHours         Float         @default(0)
  difficultyScore     Int           @default(3)
  aiIssueLevel        String        @default("C")
  resourceWeight      Float         @default(1.0)
  
  -- 担当・作成管理
  assignedTo          String?
  createdBy           String?
  
  -- メタデータ
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
}
```

**ステータス定義**:
```sql
enum task_status {
  IDEA      -- アイデア段階
  PLAN      -- 計画段階  
  DO        -- 実行中
  CHECK     -- 確認中
  COMPLETE  -- 完了
  KNOWLEDGE -- ナレッジ化済み
  DELETE    -- 削除予定
}
```

#### task_relationships テーブル (MECE管理)
```sql
model task_relationships {
  id               String            @id
  sourceTaskId     String
  targetTaskId     String?
  projectId        String?
  relationshipType relationship_type
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
}

enum relationship_type {
  TRANSFERABLE  -- 移譲可能
  SIMULTANEOUS  -- 同時実行可能
  DEPENDENT     -- 依存関係
}
```

### 2.3 プロジェクト管理

#### projects テーブル
```sql
model projects {
  id                    String         @id
  name                  String
  description           String         @default("")
  status                project_status @default(PLANNING)
  progress              Int            @default(0)
  startDate             String
  endDate               String?
  teamMembers           String[]       @default([])
  priority              priority       @default(C)
  
  -- 分析関連
  phase                 String         @default("concept")
  kgi                   String         @default("")
  successProbability    Float          @default(0.0)
  activityScore         Float          @default(0.0)
  connectionPower       Int            @default(0)
  lastActivityDate      DateTime       @default(now())
  phaseChangeDate       DateTime       @default(now())
  
  -- 担当・作成管理
  assignedTo            String?
  createdBy             String?
  
  -- メタデータ
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt
}
```

### 2.4 アポイントメント管理

#### appointments テーブル
```sql
model appointments {
  id              String               @id
  companyName     String
  contactName     String
  phone           String
  email           String
  status          appointment_status   @default(PENDING)
  lastContact     String?
  nextAction      String
  notes           String               @default("")
  priority        priority             @default(C)
  informationUrl  String?
  meetingUrl      String?
  
  -- 担当・作成管理
  assignedTo      String?
  createdBy       String?
  
  -- メタデータ
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
}
```

#### appointment_details テーブル (詳細管理)
```sql
model appointment_details {
  id                 String                 @id
  appointmentId      String                 @unique
  processingStatus   appointment_processing @default(PENDING)
  relationshipStatus relationship_status    @default(FIRST_CONTACT)
  phaseStatus        appointment_phase      @default(LEAD)
  sourceType         appointment_source     @default(REFERRAL)
  
  -- ビジネス情報
  importance         Float                  @default(0.0)
  businessValue      Float                  @default(0.0)
  contractValue      Float?
  closingProbability Float                  @default(0.0)
  
  -- 詳細データ (JSON)
  followUpActions    String[]               @default([])
  meetingHistory     Json[]                 @default([])
  decisionMakers     String[]               @default([])
  competitors        String[]               @default([])
  painPoints         String[]               @default([])
  
  -- テキストフィールド
  sourceDetails      String                 @default("")
  budgetInfo         String                 @default("")
  timeline           String                 @default("")
  proposalStatus     String                 @default("")
  nextMilestone      String                 @default("")
  internalNotes      String                 @default("")
  
  -- メタデータ
  createdAt          DateTime               @default(now())
  updatedAt          DateTime               @updatedAt
}
```

### 2.5 カレンダー・スケジュール

#### calendar_events テーブル (統合イベント)
```sql
model calendar_events {
  id               String           @id
  title            String
  date             String
  time             String
  endTime          String?
  type             event_type       @default(MEETING)
  category         event_category   @default(EVENT)
  description      String           @default("")
  location         String?
  participants     String[]         @default([])
  colorCode        String?
  importance       Float            @default(0.5)
  isAllDay         Boolean          @default(false)
  isRecurring      Boolean          @default(false)
  meetingUrl       String?
  
  -- 関連エンティティ
  appointmentId    String?
  taskId           String?
  projectId        String?
  userId           String?
  recurringPattern String?
  
  -- 担当・作成管理
  assignedTo       String?
  createdBy        String?
  
  -- メタデータ
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}
```

#### personal_schedules テーブル (個人予定)
```sql
model personal_schedules {
  id          String   @id
  title       String
  date        String
  time        String
  endTime     String?
  description String?  @default("")
  location    String?
  userId      String
  priority    priority @default(C)
  isAllDay    Boolean  @default(false)
  
  -- メタデータ
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 2.6 ナレッジ管理

#### knowledge_items テーブル
```sql
model knowledge_items {
  id                 String             @id
  title              String
  category           knowledge_category @default(BUSINESS)
  content            String
  author             String
  tags               String[]           @default([])
  likes              Int                @default(0)
  
  -- 自動生成関連
  auto_generated     Boolean            @default(false)
  source_document_id String?
  source_page_number Int?
  source_type        String?
  source_url         String?
  
  -- 担当・作成管理
  assignedTo         String?
  createdBy          String?
  
  -- メタデータ
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
}
```

### 2.7 人脈・コネクション管理

#### connections テーブル
```sql
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
  email        String?
  phone        String?
  
  -- 担当・作成管理
  assignedTo   String?
  createdBy    String?
  
  -- メタデータ
  createdAt    DateTime        @default(now())
  updatedAt    DateTime
}
```

## 3. 高度な機能テーブル

### 3.1 学生リソース管理 (Phase 1)

#### student_resources テーブル
```sql
model student_resources {
  id                     String   @id
  userId                 String   @unique
  
  -- 時間管理
  weeklyCommitHours      Int      @default(20)
  currentLoadPercentage  Float    @default(0.0)
  semesterAvailability   Json     @default("{}")
  emergencyAvailableHours Json    @default("{}")
  
  -- スキル・適性
  technicalSkills        Json     @default("[]")
  softSkills             Json     @default("[]")
  learningPreferences    Json     @default("{}")
  projectExperience      Json     @default("[]")
  
  -- パフォーマンス
  taskCompletionRate     Float    @default(1.0)
  qualityScore           Float    @default(1.0)
  collaborationScore     Float    @default(1.0)
  
  -- MBTI分析
  mbtiAnalysis           Json     @default("{}")
  personalityStrengths   Json     @default("[]")
  optimalRoles           Json     @default("[]")
  stressFactors          Json     @default("[]")
  motivationFactors      Json     @default("[]")
  
  -- メタデータ
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}
```

### 3.2 財務管理・LTV分析 (Phase 2)

#### project_financial_details テーブル
```sql
model project_financial_details {
  id                              String    @id
  projectId                       String
  
  -- 基本契約情報
  baseContractValue               Decimal   @default(0) @db.Decimal(12,2)
  contractType                    String    @default("FIXED")
  paymentSchedule                 Json      @default("{}")
  
  -- 収益予測
  additionalWorkProbability       Float     @default(0.3)
  additionalWorkExpectedValue     Decimal   @default(0) @db.Decimal(12,2)
  maintenanceContractProbability  Float     @default(0.5)
  maintenanceAnnualValue          Decimal   @default(0) @db.Decimal(12,2)
  referralProbability             Float     @default(0.2)
  referralExpectedValue           Decimal   @default(0) @db.Decimal(12,2)
  
  -- コスト詳細
  directLaborCost                 Decimal   @default(0) @db.Decimal(12,2)
  indirectLaborCost               Decimal   @default(0) @db.Decimal(12,2)
  externalContractorCost          Decimal   @default(0) @db.Decimal(12,2)
  toolLicenseCost                 Decimal   @default(0) @db.Decimal(12,2)
  infrastructureCost              Decimal   @default(0) @db.Decimal(12,2)
  
  -- リスク・品質管理
  riskBufferPercentage            Float     @default(0.15)
  qualityAssuranceCost            Decimal   @default(0) @db.Decimal(12,2)
  contingencyReserve              Decimal   @default(0) @db.Decimal(12,2)
  
  -- 予測精度・メタデータ
  confidenceLevel                 Float     @default(0.8)
  predictionModelVersion          String    @default("v1.0")
  lastUpdatedAt                   DateTime  @default(now())
  createdBy                       String?
  
  -- メタデータ
  createdAt                       DateTime  @default(now())
  updatedAt                       DateTime  @updatedAt
}
```

### 3.3 AI・自動化テーブル

#### ai_content_analysis テーブル
```sql
model ai_content_analysis {
  id                 String           @id
  source_document_id String
  analysis_type      ai_analysis_type @default(COMPREHENSIVE)
  
  -- 抽出データ (JSON)
  extracted_tasks    Json             @default("[]")
  extracted_events   Json             @default("[]")
  extracted_projects Json             @default("[]")
  extracted_contacts Json             @default("[]")
  extracted_dates    Json             @default("[]")
  
  -- AI分析結果
  confidence_score   Float            @default(0.0)
  model_version      String           @default("gemini-1.5")
  processing_time    Int              @default(0)
  keywords           String[]         @default([])
  sentiment_score    Float?
  urgency_level      urgency_level    @default(MEDIUM)
  business_value     Float            @default(0.0)
  recommendations    Json             @default("[]")
  auto_suggestions   Json             @default("[]")
  
  -- テキストフィールド
  summary            String           @default("")
  title              String           @default("")
  agenda             String           @default("")
  
  -- 担当・作成管理
  assignedTo         String?
  createdBy          String?
  
  -- メタデータ
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
}
```

### 3.4 LINE統合

#### line_integration_logs テーブル
```sql
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
  
  -- メタデータ
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
}
```

## 4. インデックス戦略

### 4.1 主要インデックス

#### パフォーマンス最適化
```sql
-- ユーザー関連
@@index([email], map: "idx_users_email")
@@index([lineUserId], map: "idx_users_line_id")
@@index([isActive], map: "idx_users_active")

-- タスク関連  
@@index([userId, isArchived, status], map: "idx_tasks_filter")
@@index([projectId], map: "idx_tasks_project")
@@index([dueDate], map: "idx_tasks_due")
@@index([assignedTo, status], map: "idx_tasks_assigned_status")

-- プロジェクト関連
@@index([status], map: "idx_projects_status")
@@index([assignedTo], map: "idx_projects_assigned_to")
@@index([updatedAt], map: "idx_projects_updated")

-- カレンダー関連
@@index([date], map: "idx_calendar_date")
@@index([userId, date], map: "idx_calendar_user_date")
@@index([appointmentId], map: "idx_calendar_appointment")
@@index([taskId], map: "idx_calendar_task")
@@index([projectId], map: "idx_calendar_project")
```

### 4.2 複合インデックス

#### 分析・検索最適化
```sql
-- 関係性管理
@@index([sourceTaskId], map: "idx_task_relationships_source")
@@index([targetTaskId], map: "idx_task_relationships_target")
@@index([relationshipType], map: "idx_task_relationships_type")

-- AI分析
@@index([source_document_id], map: "idx_ai_analysis_source")
@@index([confidence_score], map: "idx_ai_analysis_confidence")
@@index([urgency_level], map: "idx_ai_analysis_urgency")

-- 営業管理
@@index([customerId], map: "idx_opportunities_customer_id")
@@index([stage], map: "idx_opportunities_stage")
@@index([expectedCloseDate], map: "idx_opportunities_expected_close")
```

## 5. データ整合性・制約

### 5.1 外部キー制約
- **カスケード削除**: プロジェクト削除時の関連タスク・イベント削除
- **参照整合性**: ユーザー・担当者の存在チェック
- **孤立データ防止**: 関連エンティティの適切な削除連鎖

### 5.2 ビジネスルール制約
- **優先度制約**: A-D の4段階制限
- **ステータス遷移**: 定義されたワークフロー遵守
- **日時検証**: 開始日 ≤ 終了日 の制約
- **権限チェック**: ロールベースアクセス制御

### 5.3 データ品質管理
- **必須フィールド**: NOT NULL制約の適切な設定
- **デフォルト値**: 業務ルールに基づくデフォルト設定
- **文字長制限**: パフォーマンスとセキュリティの両立
- **JSON検証**: 構造化データの型安全性確保

## 6. バックアップ・運用

### 6.1 バックアップ戦略
- **定期バックアップ**: 日次自動バックアップ
- **ポイントインタイム復旧**: トランザクションログ保持
- **クロスリージョン**: 災害対策のための地理的分散

### 6.2 パフォーマンス監視
- **クエリパフォーマンス**: 実行計画の定期分析
- **インデックス使用率**: 未使用インデックスの検出・削除
- **テーブルサイズ**: 成長率監視・アーカイブ戦略

---

*このデータベース仕様書は、Prismaスキーマの実装状況に基づいて作成されており、システムの成長に伴い継続的に更新されます。*
# Phase 1: データ基盤強化 - 実装ガイド

**実装期間:** 2-3週間  
**目標:** 既存機能を壊さずにデータ構造を拡張  
**前提条件:** `docs/CURRENT_SYSTEM_ANALYSIS.md` の内容把握済み

---

## 🎯 Phase 1の実装目標

1. **ユーザープロファイル管理** - スキル、QOL、志向性
2. **プロジェクトAI分析基盤** - フェーズ、成功確率、アクティビティ
3. **タスクAI評価基盤** - リソースウェイト、ISSUE度、難易度
4. **アラートシステム基盤** - プロジェクト・ユーザーアラート
5. **AI評価履歴管理** - 判定結果の蓄積

---

## 📋 実装前チェックリスト

- [ ] `docs/CURRENT_SYSTEM_ANALYSIS.md` 確認済み
- [ ] 現在のブランチ確認: `git branch`
- [ ] データベースバックアップ: `pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql`
- [ ] 既存機能動作確認: 全ページアクセスOK
- [ ] 開発環境起動確認: `npm run dev`

---

## 🗄️ データベーススキーマ拡張

### **1.1 既存テーブル拡張（破壊的変更なし）**

#### **users テーブル拡張:**
```sql
-- ユーザースキル情報（6カテゴリ、1-10評価）
ALTER TABLE users ADD COLUMN skills JSON DEFAULT '{"engineering": 5, "sales": 5, "creative": 5, "marketing": 5, "management": 5, "pr": 5}';

-- ユーザー志向性・QOL設定
ALTER TABLE users ADD COLUMN preferences JSON DEFAULT '{"qol_weight": 1.0, "target_areas": [], "strengths": [], "weaknesses": []}';

-- 作業スタイル情報
ALTER TABLE users ADD COLUMN work_style JSON DEFAULT '{"focus_time": "morning", "collaboration_preference": "medium", "stress_tolerance": "medium"}';
```

#### **projects テーブル拡張:**
```sql
-- プロジェクトフェーズ管理
ALTER TABLE projects ADD COLUMN phase VARCHAR(50) DEFAULT 'concept';

-- KGI設定
ALTER TABLE projects ADD COLUMN kgi TEXT DEFAULT '';

-- AI算出指標
ALTER TABLE projects ADD COLUMN success_probability FLOAT DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN activity_score FLOAT DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN connection_power INT DEFAULT 0;

-- アクティビティ追跡
ALTER TABLE projects ADD COLUMN last_activity_date TIMESTAMP DEFAULT NOW();
ALTER TABLE projects ADD COLUMN phase_change_date TIMESTAMP DEFAULT NOW();
```

#### **tasks テーブル拡張:**
```sql
-- 工数管理
ALTER TABLE tasks ADD COLUMN estimated_hours FLOAT DEFAULT 0;
ALTER TABLE tasks ADD COLUMN actual_hours FLOAT DEFAULT 0;

-- AI評価項目
ALTER TABLE tasks ADD COLUMN difficulty_score INT DEFAULT 3;
ALTER TABLE tasks ADD COLUMN ai_issue_level VARCHAR(1) DEFAULT 'C';
ALTER TABLE tasks ADD COLUMN resource_weight FLOAT DEFAULT 1.0;
```

### **1.2 新規テーブル作成**

#### **プロジェクト関係性マッピング:**
```sql
CREATE TABLE project_relationships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  related_type VARCHAR(50) NOT NULL, -- 'task', 'appointment', 'connection', 'calendar'
  related_id TEXT NOT NULL,
  relationship_strength FLOAT DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, related_type, related_id)
);
```

#### **AI評価履歴:**
```sql
CREATE TABLE ai_evaluations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  entity_type VARCHAR(50) NOT NULL,
  entity_id TEXT NOT NULL,
  evaluation_type VARCHAR(50) NOT NULL, -- 'resource_weight', 'success_probability', 'issue_level'
  score FLOAT NOT NULL,
  reasoning TEXT,
  confidence FLOAT DEFAULT 0.0,
  model_version VARCHAR(50) DEFAULT 'gemini-1.5',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **プロジェクトアラート:**
```sql
CREATE TABLE project_alerts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'progress_stagnation', 'activity_stagnation', 'phase_stagnation'
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **ユーザーアラート:**
```sql
CREATE TABLE user_alerts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'workload_risk', 'low_priority_overload'
  severity VARCHAR(20) DEFAULT 'medium',
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **プロジェクトフェーズ履歴:**
```sql
CREATE TABLE project_phase_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_phase VARCHAR(50),
  to_phase VARCHAR(50) NOT NULL,
  changed_by TEXT REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **1.3 Prismaスキーマ更新**

**prisma/schema.prisma に追加:**
```prisma
// 既存モデルの拡張
model users {
  // 既存フィールドはそのまま保持...
  skills                Json                   @default("{}")
  preferences           Json                   @default("{}")
  workStyle             Json                   @default("{}")
  
  // 新規リレーション
  user_alerts           user_alerts[]
  project_phase_history project_phase_history[]
}

model projects {
  // 既存フィールドはそのまま保持...
  phase                 String                  @default("concept")
  kgi                   String                  @default("")
  successProbability    Float                   @default(0.0)
  activityScore         Float                   @default(0.0)
  connectionPower       Int                     @default(0)
  lastActivityDate      DateTime                @default(now())
  phaseChangeDate       DateTime                @default(now())
  
  // 新規リレーション
  project_relationships project_relationships[]
  project_alerts        project_alerts[]
  project_phase_history project_phase_history[]
}

model tasks {
  // 既存フィールドはそのまま保持...
  estimatedHours      Float  @default(0)
  actualHours         Float  @default(0)
  difficultyScore     Int    @default(3)
  aiIssueLevel        String @default("C")
  resourceWeight      Float  @default(1.0)
}

// 新規モデル
model project_relationships {
  id                   String   @id @default(cuid())
  projectId            String
  relatedType          String
  relatedId            String
  relationshipStrength Float    @default(1.0)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  projects             projects @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, relatedType, relatedId])
}

model ai_evaluations {
  id             String   @id @default(cuid())
  entityType     String
  entityId       String
  evaluationType String
  score          Float
  reasoning      String?
  confidence     Float    @default(0.0)
  modelVersion   String   @default("gemini-1.5")
  createdAt      DateTime @default(now())
}

model project_alerts {
  id          String    @id @default(cuid())
  projectId   String
  alertType   String
  severity    String    @default("medium")
  message     String
  isRead      Boolean   @default(false)
  isResolved  Boolean   @default(false)
  triggeredAt DateTime  @default(now())
  resolvedAt  DateTime?
  createdAt   DateTime  @default(now())
  projects    projects  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model user_alerts {
  id                String   @id @default(cuid())
  userId            String
  alertType         String
  severity          String   @default("medium")
  message           String
  relatedEntityType String?
  relatedEntityId   String?
  isRead            Boolean  @default(false)
  createdAt         DateTime @default(now())
  users             users    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model project_phase_history {
  id        String   @id @default(cuid())
  projectId String
  fromPhase String?
  toPhase   String
  changedBy String?
  reason    String?
  createdAt DateTime @default(now())
  projects  projects @relation(fields: [projectId], references: [id], onDelete: Cascade)
  users     users?   @relation(fields: [changedBy], references: [id])
}
```

---

## 🔧 実装手順

### **ステップ1: データベース変更実行**
```bash
# 1. マイグレーション実行
npx prisma migrate dev --name "add-ai-features-phase1"

# 2. Prisma Client生成
npx prisma generate

# 3. ビルドテスト
npm run build
```

### **ステップ2: 型定義更新**

**src/lib/types.ts に追加:**
```typescript
// 新規インターフェース（既存は変更しない）

export interface UserSkills {
  engineering: number;  // 1-10
  sales: number;
  creative: number;
  marketing: number;
  management: number;
  pr: number;
}

export interface UserPreferences {
  qol_weight: number;  // 0.5-2.0
  target_areas: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface WorkStyle {
  focus_time: 'morning' | 'afternoon' | 'evening' | 'night';
  collaboration_preference: 'low' | 'medium' | 'high';
  stress_tolerance: 'low' | 'medium' | 'high';
}

export interface ProjectAlert {
  id: string;
  projectId: string;
  alertType: 'progress_stagnation' | 'activity_stagnation' | 'phase_stagnation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  isRead: boolean;
  isResolved: boolean;
  triggeredAt: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface UserAlert {
  id: string;
  userId: string;
  alertType: 'workload_risk' | 'low_priority_overload';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AIEvaluation {
  id: string;
  entityType: string;
  entityId: string;
  evaluationType: 'resource_weight' | 'success_probability' | 'issue_level';
  score: number;
  reasoning?: string;
  confidence: number;
  modelVersion: string;
  createdAt: string;
}

// 既存インターフェース拡張（オプショナルで追加）
export interface User {
  // 既存フィールドはそのまま...
  skills?: UserSkills;
  preferences?: UserPreferences;
  workStyle?: WorkStyle;
}

export interface Project {
  // 既存フィールドはそのまま...
  phase?: string;
  kgi?: string;
  successProbability?: number;
  activityScore?: number;
  connectionPower?: number;
  lastActivityDate?: string;
  phaseChangeDate?: string;
}

export interface Task {
  // 既存フィールドはそのまま...
  estimatedHours?: number;
  actualHours?: number;
  difficultyScore?: number;
  aiIssueLevel?: 'A' | 'B' | 'C' | 'D';
  resourceWeight?: number;
}
```

### **ステップ3: 新規API作成**

#### **ユーザープロファイルAPI:**
**src/app/api/users/[id]/profile/route.ts（新規作成）:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prismaDataService.getUserById(id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      skills: user.skills || {
        engineering: 5, sales: 5, creative: 5,
        marketing: 5, management: 5, pr: 5
      },
      preferences: user.preferences || {
        qol_weight: 1.0, target_areas: [], strengths: [], weaknesses: []
      },
      workStyle: user.workStyle || {
        focus_time: 'morning',
        collaboration_preference: 'medium',
        stress_tolerance: 'medium'
      }
    });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { skills, preferences, workStyle } = await request.json();
    
    // 入力値検証
    if (skills) {
      const skillKeys = ['engineering', 'sales', 'creative', 'marketing', 'management', 'pr'];
      for (const key of skillKeys) {
        if (skills[key] && (skills[key] < 1 || skills[key] > 10)) {
          return NextResponse.json({ error: `Skill ${key} must be 1-10` }, { status: 400 });
        }
      }
    }

    if (preferences?.qol_weight && (preferences.qol_weight < 0.5 || preferences.qol_weight > 2.0)) {
      return NextResponse.json({ error: 'QOL weight must be 0.5-2.0' }, { status: 400 });
    }

    const updatedUser = await prismaDataService.updateUser(id, {
      skills,
      preferences,
      workStyle
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## ✅ Phase 1完了検証

### **必須チェックリスト:**
- [ ] `npm run build` 成功
- [ ] `npm run dev` でサーバー起動成功
- [ ] 既存ページ全て正常動作確認
  - [ ] http://localhost:3000/ - ダッシュボード
  - [ ] http://localhost:3000/tasks - タスク管理（4種Kanban動作）
  - [ ] http://localhost:3000/projects - プロジェクト管理
  - [ ] http://localhost:3000/calendar - カレンダー
  - [ ] http://localhost:3000/connections - コネクション
  - [ ] http://localhost:3000/appointments - アポイント
- [ ] 新規API動作確認
  - [ ] `GET /api/users/[id]/profile` レスポンス確認
  - [ ] `PUT /api/users/[id]/profile` 更新確認
- [ ] データベース整合性確認
  - [ ] 既存データ保持: `SELECT COUNT(*) FROM users, tasks, projects;`
  - [ ] 新規テーブル作成: `\dt` で5テーブル確認
  - [ ] 新規列追加: `\d users, projects, tasks` で追加列確認
- [ ] LINE Bot継続動作確認
  - [ ] テストメッセージ送信・処理確認

### **Phase 1完了報告テンプレート:**
```markdown
## Phase 1実装完了報告

### 実装内容
✅ データベーススキーマ拡張: 5新規テーブル、3既存テーブル拡張
✅ 型定義追加: 6新規インターフェース、3既存拡張
✅ 新規API実装: /api/users/[id]/profile (GET/PUT)
✅ Prismaマイグレーション: "add-ai-features-phase1"

### 検証結果
✅ 既存機能正常動作確認: 全6ページ動作OK
✅ 新機能動作確認: プロファイルAPI動作OK
✅ データ整合性確認: 既存データ保持、新規構造追加
✅ パフォーマンステスト: レスポンス時間影響なし

### 次Phase準備状況
✅ Phase 2開始準備完了
次回実装: docs/PHASE2_AI_ENGINE.md 参照
```

---

## 🚨 トラブルシューティング

### **マイグレーション失敗時:**
```bash
# 1. マイグレーション状態確認
npx prisma migrate status

# 2. 強制リセット（注意: 開発環境のみ）
npx prisma migrate reset

# 3. バックアップから復旧
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

### **ビルドエラー時:**
```bash
# 1. 型エラー確認
npx tsc --noEmit

# 2. Prisma再生成
npx prisma generate

# 3. 依存関係再インストール
rm -rf node_modules package-lock.json
npm install
```

### **API動作確認方法:**
```bash
# プロファイル取得テスト
curl -X GET "http://localhost:3000/api/users/[実際のユーザーID]/profile"

# プロファイル更新テスト
curl -X PUT "http://localhost:3000/api/users/[実際のユーザーID]/profile" \
  -H "Content-Type: application/json" \
  -d '{"skills":{"engineering":8}}'
```

---

**Phase 1完了後、`docs/PHASE2_AI_ENGINE.md` に進んでください。**
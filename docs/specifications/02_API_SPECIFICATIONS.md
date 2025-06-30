# API仕様書

## 1. API概要

### 1.1 基本情報
- **ベースURL**: `/api`
- **プロトコル**: HTTP/HTTPS
- **データ形式**: JSON
- **認証方式**: NextAuth.js (OAuth)
- **レート制限**: 実装済み（エンドポイント別）
- **API総数**: 100+ エンドポイント

### 1.2 認証・認可

#### 認証ヘッダー
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### 権限レベル
```typescript
enum UserRole {
  ADMIN      // システム管理者
  MANAGER    // プロジェクトマネージャー
  MEMBER     // 一般メンバー
  GUEST      // ゲストユーザー
  STUDENT    // 学生ユーザー
  ENTERPRISE // エンタープライズユーザー
}
```

### 1.3 レスポンス形式

#### 成功レスポンス
```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "message": "操作が正常に完了しました"
}
```

#### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値に誤りがあります",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ]
  }
}
```

## 2. コアエンティティAPI

### 2.1 タスク管理API

#### GET /api/tasks
**概要**: タスク一覧取得

**パラメータ**:
```typescript
interface GetTasksParams {
  page?: number;           // ページ番号 (デフォルト: 1)
  limit?: number;          // 取得件数 (デフォルト: 50)
  status?: task_status;    // ステータスフィルター
  priority?: priority;     // 優先度フィルター
  projectId?: string;      // プロジェクトIDフィルター
  assignedTo?: string;     // 担当者フィルター
  dueDate?: string;        // 期限フィルター (YYYY-MM-DD)
  isArchived?: boolean;    // アーカイブ状態
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_1",
        "title": "システム設計書作成",
        "description": "API仕様書とデータベース設計書の作成",
        "status": "DO",
        "priority": "A",
        "dueDate": "2025-07-01",
        "estimatedHours": 8.0,
        "actualHours": 3.5,
        "resourceWeight": 1.2,
        "project": {
          "id": "project_1",
          "name": "新システム開発"
        },
        "assignee": {
          "id": "user_1",
          "name": "田中太郎"
        },
        "createdAt": "2025-06-29T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 50,
      "totalPages": 3
    }
  }
}
```

#### POST /api/tasks
**概要**: タスク作成

**リクエストボディ**:
```json
{
  "title": "新機能実装",
  "description": "ユーザー管理機能の実装",
  "projectId": "project_1",
  "priority": "A",
  "dueDate": "2025-07-15",
  "estimatedHours": 12.0,
  "assignedTo": "user_2"
}
```

#### PUT /api/tasks/[id]
**概要**: タスク更新

#### DELETE /api/tasks/[id]
**概要**: タスク削除（アーカイブ）

#### POST /api/tasks/[id]/assignee
**概要**: 担当者変更

#### POST /api/tasks/[id]/archive
**概要**: タスクアーカイブ

### 2.2 プロジェクト管理API

#### GET /api/projects
**概要**: プロジェクト一覧取得

**パラメータ**:
```typescript
interface GetProjectsParams {
  page?: number;
  limit?: number;
  status?: project_status;
  priority?: priority;
  assignedTo?: string;
  phase?: string;
  includeArchived?: boolean;
}
```

#### POST /api/projects
**概要**: プロジェクト作成

**リクエストボディ**:
```json
{
  "name": "新ECサイト構築",
  "description": "モバイル対応ECサイトの構築プロジェクト",
  "startDate": "2025-07-01",
  "endDate": "2025-12-31",
  "priority": "A",
  "phase": "planning",
  "teamMembers": ["user_1", "user_2", "user_3"],
  "kgi": "月間売上1000万円達成"
}
```

#### GET /api/projects/[id]/analytics
**概要**: プロジェクト分析データ取得

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "project_1",
      "name": "新ECサイト構築",
      "progress": 65,
      "successProbability": 0.85,
      "activityScore": 8.7,
      "connectionPower": 12
    },
    "tasks": {
      "total": 45,
      "completed": 28,
      "inProgress": 12,
      "pending": 5
    },
    "timeline": {
      "estimatedCompletion": "2025-11-15",
      "daysRemaining": 140,
      "milestones": [
        {
          "name": "β版リリース",
          "date": "2025-09-01",
          "status": "completed"
        }
      ]
    },
    "team": {
      "members": 8,
      "averageLoad": 0.75,
      "mbtiCompatibility": 0.82
    }
  }
}
```

### 2.3 アポイントメント管理API

#### GET /api/appointments
**概要**: アポイントメント一覧取得

#### POST /api/appointments
**概要**: アポイントメント作成

**リクエストボディ**:
```json
{
  "companyName": "株式会社サンプル",
  "contactName": "山田花子",
  "phone": "03-1234-5678",
  "email": "yamada@sample.co.jp",
  "nextAction": "提案書作成",
  "priority": "A",
  "notes": "システム導入に積極的",
  "details": {
    "sourceType": "REFERRAL",
    "businessValue": 8.5,
    "closingProbability": 0.7,
    "contractValue": 5000000,
    "decisionMakers": ["山田花子", "田中部長"],
    "painPoints": ["業務効率化", "コスト削減"]
  }
}
```

#### PUT /api/appointments/[id]/schedule
**概要**: アポイントメント日程調整

#### POST /api/appointments/[id]/complete
**概要**: アポイントメント完了処理

### 2.4 カレンダーAPI

#### GET /api/calendar/unified
**概要**: 統合カレンダーデータ取得

**パラメータ**:
```typescript
interface GetUnifiedCalendarParams {
  startDate: string;    // 開始日 (YYYY-MM-DD)
  endDate: string;      // 終了日 (YYYY-MM-DD)
  userId?: string;      // ユーザーフィルター
  includePersonal?: boolean;    // 個人予定含む
  includeAppointments?: boolean; // アポイント含む
  includeTasks?: boolean;       // タスク期限含む
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event_1",
        "title": "プロジェクト定例会議",
        "date": "2025-07-01",
        "time": "10:00",
        "endTime": "11:00",
        "type": "MEETING",
        "category": "PROJECT",
        "source": "calendar_events",
        "relatedEntity": {
          "type": "project",
          "id": "project_1",
          "name": "新ECサイト構築"
        },
        "participants": ["user_1", "user_2"],
        "location": "会議室A",
        "importance": 0.8
      }
    ],
    "summary": {
      "totalEvents": 25,
      "meetings": 8,
      "appointments": 5,
      "deadlines": 12
    }
  }
}
```

## 3. 統合・分析API

### 3.1 統合ダッシュボードAPI

#### GET /api/dashboard/integrated
**概要**: システム統合状況取得

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "systemHealth": {
      "overall": 0.92,
      "phases": {
        "phase1": {
          "name": "学生リソース管理",
          "status": 0.95,
          "components": {
            "resourceAllocation": 0.98,
            "mbtiAnalysis": 0.92,
            "performanceTracking": 0.95
          }
        },
        "phase2": {
          "name": "財務・LTV分析",
          "status": 0.88,
          "components": {
            "financialTracking": 0.90,
            "ltvAnalysis": 0.85,
            "revenueForecasting": 0.88
          }
        }
      }
    },
    "realTimeMetrics": {
      "activeUsers": 127,
      "tasksCompleted": 45,
      "projectsActive": 12,
      "appointmentsToday": 8
    },
    "integration": {
      "lineBot": {
        "status": "healthy",
        "messagesProcessed": 234,
        "successRate": 0.96
      },
      "ai": {
        "status": "healthy",
        "analysisCompleted": 67,
        "averageConfidence": 0.87
      }
    }
  }
}
```

### 3.2 AI機能API

#### POST /api/ai/evaluate
**概要**: AI評価実行

**リクエストボディ**:
```json
{
  "entityType": "task",
  "entityId": "task_1",
  "evaluationType": "success_probability"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "evaluation": {
      "score": 0.85,
      "confidence": 0.92,
      "reasoning": "タスクの複雑度と担当者のスキルレベルから高い成功確率",
      "recommendations": [
        "週次進捗確認の設定を推奨",
        "リスクとなる技術要素の事前調査"
      ]
    },
    "modelVersion": "gemini-1.5",
    "processedAt": "2025-06-29T12:30:00Z"
  }
}
```

#### POST /api/ai/sales-prediction
**概要**: 営業成約確率予測

#### POST /api/ai/conversion-prediction
**概要**: コンバージョン予測

### 3.3 分析API

#### GET /api/analytics/dashboard
**概要**: 統合分析ダッシュボード

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "ga4": {
      "sessions": 12540,
      "users": 8930,
      "pageviews": 45670,
      "conversionRate": 0.034,
      "averageSessionDuration": 185
    },
    "searchConsole": {
      "impressions": 234567,
      "clicks": 8901,
      "ctr": 0.038,
      "averagePosition": 12.5,
      "topQueries": [
        {
          "query": "タスク管理 ツール",
          "clicks": 450,
          "impressions": 12000
        }
      ]
    },
    "business": {
      "totalProjects": 45,
      "completionRate": 0.78,
      "averageProjectDuration": 120,
      "clientSatisfaction": 4.6
    }
  }
}
```

#### GET /api/analytics/sales-performance
**概要**: 営業パフォーマンス分析

## 4. 外部連携API

### 4.1 LINE Webhook API

#### POST /api/webhook/line
**概要**: LINE Webhookイベント処理

**リクエストヘッダー**:
```http
X-Line-Signature: <署名>
Content-Type: application/json
```

**リクエストボディ**:
```json
{
  "events": [
    {
      "type": "message",
      "timestamp": 1719650400000,
      "source": {
        "type": "group",
        "groupId": "group_1",
        "userId": "user_1"
      },
      "message": {
        "type": "text",
        "text": "@FIND to DO 明日の10時から会議の予定を追加して"
      }
    }
  ]
}
```

**処理フロー**:
1. 署名検証
2. メッセージ解析 (Gemini AI)
3. エンティティ抽出
4. データベース保存
5. 確認メッセージ送信

### 4.2 Google連携API

#### POST /api/webhook/google-docs-gas
**概要**: Google Apps Script Webhook

#### GET /api/google-docs/analytics
**概要**: Google Docs分析データ取得

## 5. リアルタイム機能

### 5.1 WebSocket API

#### エンドポイント
```
ws://localhost:3000/api/realtime
wss://production-domain.com/api/realtime
```

#### 接続認証
```javascript
const socket = new WebSocket('ws://localhost:3000/api/realtime', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### イベント形式

**メトリクス更新**:
```json
{
  "type": "metrics_update",
  "data": {
    "activeUsers": 128,
    "tasksCompleted": 46,
    "timestamp": "2025-06-29T12:35:00Z"
  }
}
```

**エンティティ更新**:
```json
{
  "type": "entity_update",
  "data": {
    "entityType": "task",
    "entityId": "task_1",
    "action": "status_changed",
    "changes": {
      "status": "COMPLETE"
    },
    "user": {
      "id": "user_1",
      "name": "田中太郎"
    }
  }
}
```

### 5.2 通知API

#### GET /api/realtime/events
**概要**: リアルタイムイベントフィード取得

#### POST /api/alerts
**概要**: アラート作成

## 6. セキュリティ・制限

### 6.1 レート制限

| エンドポイント | 制限 | 期間 |
|---------------|------|------|
| `/api/ai/*` | 100 requests | 1 hour |
| `/api/webhook/line` | 1000 requests | 1 minute |
| `/api/analytics/*` | 500 requests | 1 hour |
| その他 | 1000 requests | 1 hour |

### 6.2 入力値検証

#### 必須フィールド
- すべてのPOST/PUTリクエストで必須フィールドチェック
- データ型・形式バリデーション
- 文字長制限・特殊文字制限

#### SQL インジェクション対策
- Prisma ORM による自動エスケープ
- パラメータ化クエリの使用
- 入力値サニタイゼーション

### 6.3 権限制御

#### エンドポイント別権限
```typescript
const PERMISSIONS = {
  'api/tasks': ['READ', 'CREATE', 'UPDATE'],
  'api/projects': ['READ', 'CREATE', 'UPDATE', 'DELETE'],
  'api/admin/*': ['ADMIN'],
  'api/analytics/dashboard': ['MANAGER', 'ADMIN']
};
```

## 7. エラーコード一覧

| コード | 説明 | HTTPステータス |
|--------|------|---------------|
| `VALIDATION_ERROR` | 入力値エラー | 400 |
| `UNAUTHORIZED` | 認証エラー | 401 |
| `FORBIDDEN` | 権限エラー | 403 |
| `NOT_FOUND` | リソース未発見 | 404 |
| `CONFLICT` | データ競合 | 409 |
| `RATE_LIMIT_EXCEEDED` | レート制限超過 | 429 |
| `INTERNAL_ERROR` | 内部サーバーエラー | 500 |
| `SERVICE_UNAVAILABLE` | サービス利用不可 | 503 |

## 8. 開発・テスト

### 8.1 API テスト

#### 単体テスト
```bash
npm run test:api
```

#### 統合テスト
```bash
npm run test:integration
```

#### パフォーマンステスト
```bash
npm run test:performance
```

### 8.2 モック・スタブ

#### 開発環境
- Gemini API モック
- LINE API モック  
- Google APIs モック

#### テストデータ
```bash
npm run db:seed
```

---

*このAPI仕様書は、実装されている機能に基づいて作成されており、新機能追加に伴い継続的に更新されます。*
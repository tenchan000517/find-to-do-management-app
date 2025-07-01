# API仕様書

## 1. API概要

### 1.1 基本情報
- **ベースURL**: `/api`
- **プロトコル**: HTTP/HTTPS
- **データ形式**: JSON
- **認証方式**: NextAuth.js (OAuth)
- **レート制限**: 実装済み（エンドポイント別）
- **API総数**: 100+ エンドポイント
- **🚀 NEW: リソースベーススケジューリングAPI**: ウエイト・容量ベース自動スケジューリング
- **🚀 NEW: AI駆動テンプレートAPI**: 自然言語からのプロジェクト自動生成

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

## 🚀 NEW: リソースベーススケジューリングAPI

### 9.1 /api/ai/resource-schedule

#### POST /api/ai/resource-schedule
**概要**: 業界初のウエイト・容量ベース自動スケジューリング

**認証**: 必要  
**権限**: MEMBER以上

**リクエストボディ**:
```json
{
  "projectDescription": "学生の期末レポート作成プロジェクト",
  "userType": "student",
  "constraints": {
    "availableHours": ["19:00-22:00"],
    "blockedHours": ["09:00-16:00"]
  },
  "deadline": "2025-07-15",
  "projectWeight": 8,
  "preferences": {
    "optimizationMode": "balanced",
    "allowTaskSplitting": true,
    "prioritizeHighWeight": true,
    "energyBasedScheduling": true
  }
}
```

**リクエストパラメータ**:
- `projectDescription` (string, required): プロジェクトの概要
- `userType` (enum, required): ユーザータイプ (`student` | `employee` | `freelancer` | `entrepreneur` | `parent` | `retiree`)
- `constraints` (object, required): 制約条件
  - `availableHours` (array): 利用可能時間帯
  - `blockedHours` (array): 利用不可時間帯
- `deadline` (string, required): 期限日（ISO 8601形式）
- `projectWeight` (number, required): プロジェクト総ウエイト
- `preferences` (object, optional): 最適化設定

**レスポンス**:
```json
{
  "success": true,
  "schedule": [
    {
      "id": "task-1",
      "startTime": "19:00",
      "endTime": "21:00",
      "title": "レポート企画・構成作成",
      "type": "task",
      "priority": "high",
      "estimatedProductivity": 85,
      "weight": 6,
      "canBeSplit": true
    }
  ],
  "metadata": {
    "totalTasks": 5,
    "scheduledTasks": 5,
    "estimatedProductivity": 82,
    "isDemoMode": false,
    "totalWeight": 24,
    "capacityUtilization": 0.75
  },
  "resourceAllocation": {
    "dailyCapacity": {
      "totalWeightLimit": 8,
      "usedWeight": 6,
      "remainingWeight": 2,
      "utilizationRate": 0.75
    },
    "timeAllocation": {
      "totalAvailableHours": 3,
      "allocatedHours": 2.5,
      "freeHours": 0.5,
      "timeUtilizationRate": 0.83
    },
    "taskDistribution": {
      "lightTasks": 2,
      "heavyTasks": 3,
      "lightTaskCapacity": 4,
      "heavyTaskCapacity": 2
    },
    "energyDistribution": {
      "highEnergyTasks": 2,
      "mediumEnergyTasks": 2,
      "lowEnergyTasks": 1
    },
    "riskAssessment": {
      "overloadRisk": "low",
      "burnoutRisk": "low",
      "efficiencyRisk": "medium"
    }
  },
  "futurePrediction": {
    "weeklyCapacity": [
      {
        "week": 1,
        "capacityStatus": "optimal",
        "estimatedWorkload": 8
      },
      {
        "week": 2,
        "capacityStatus": "medium",
        "estimatedWorkload": 10
      },
      {
        "week": 3,
        "capacityStatus": "high",
        "estimatedWorkload": 12
      },
      {
        "week": 4,
        "capacityStatus": "low",
        "estimatedWorkload": 6
      }
    ],
    "riskAlerts": [
      "Week 3で容量超過の可能性があります"
    ],
    "recommendations": [
      "Week 2での前倒し実行を推奨",
      "重量タスクの分割を検討してください"
    ]
  },
  "userProfile": {
    "id": "profile_12345",
    "userId": "user_67890",
    "userType": "student",
    "commitmentRatio": 0.8,
    "dailyCapacity": {
      "lightTaskSlots": 4,
      "heavyTaskSlots": 2,
      "totalWeightLimit": 8,
      "continuousWorkHours": 3
    },
    "timeConstraints": {
      "unavailableHours": ["09:00-16:00"],
      "preferredWorkHours": ["19:00-22:00"],
      "maxWorkingHours": 3
    },
    "workingPattern": {
      "productiveHours": ["19:00-21:00"],
      "focusCapacity": "high",
      "multitaskingAbility": 0.6
    },
    "personalConstraints": {},
    "preferences": {
      "earlyStart": false,
      "lateWork": true,
      "weekendWork": true,
      "breakFrequency": "medium"
    }
  },
  "generatedAt": "2025-07-01T01:15:30.000Z",
  "isDemoMode": false
}
```

**エラーレスポンス**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_USER_TYPE",
    "message": "指定されたユーザータイプはサポートされていません",
    "details": {
      "supportedTypes": ["student", "employee", "freelancer", "entrepreneur", "parent", "retiree"]
    }
  }
}
```

**ステータスコード**:
- `200 OK`: 正常にスケジュール生成完了
- `400 Bad Request`: リクエストパラメータエラー
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: 権限不足
- `429 Too Many Requests`: レート制限超過
- `500 Internal Server Error`: サーバー内部エラー

### 9.2 ユーザータイプ別制約

#### 学生 (student)
```json
{
  "dailyCapacity": {
    "totalWeightLimit": 8,
    "lightTaskSlots": 4,
    "heavyTaskSlots": 2,
    "continuousWorkHours": 3
  },
  "timeConstraints": {
    "unavailableHours": ["09:00-16:00"],
    "preferredWorkHours": ["19:00-22:00"],
    "maxWorkingHours": 3
  }
}
```

#### 会社員 (employee)
```json
{
  "dailyCapacity": {
    "totalWeightLimit": 12,
    "lightTaskSlots": 4,
    "heavyTaskSlots": 2,
    "continuousWorkHours": 4
  },
  "timeConstraints": {
    "unavailableHours": ["09:00-18:00"],
    "preferredWorkHours": ["19:00-21:00"],
    "maxWorkingHours": 3
  }
}
```

#### フリーランス (freelancer)
```json
{
  "dailyCapacity": {
    "totalWeightLimit": 18,
    "lightTaskSlots": 6,
    "heavyTaskSlots": 3,
    "continuousWorkHours": 8
  },
  "timeConstraints": {
    "unavailableHours": [],
    "preferredWorkHours": ["09:00-18:00"],
    "maxWorkingHours": 8
  }
}
```

### 9.3 AI駆動プロジェクトテンプレートAPI

#### POST /api/project-templates/quick-create
**概要**: 自然言語からの自動プロジェクト生成

**リクエストボディ**:
```json
{
  "input": "学生の期末レポート作成プロジェクト、個人作業、2週間"
}
```

**レスポンス**:
```json
{
  "projectName": "期末レポート作成プロジェクト",
  "description": "学生の期末レポート作成を効率的に進めるプロジェクト",
  "teamSize": 1,
  "timeline": "2週間",
  "phases": [
    {
      "name": "企画・調査フェーズ",
      "duration": "3日",
      "tasks": [
        {
          "title": "テーマ選定・研究",
          "description": "レポートテーマの選定と基礎調査",
          "estimatedHours": 4,
          "priority": "A",
          "dependencies": [],
          "skillRequirements": ["調査分析"],
          "deliverables": ["テーマ決定書"]
        }
      ]
    }
  ],
  "budgetBreakdown": {
    "total": 0
  },
  "riskFactors": [
    "参考文献不足",
    "時間管理の困難"
  ],
  "successMetrics": [
    "期限内提出",
    "品質基準達成"
  ],
  "resources": {
    "humanResources": ["学生"],
    "technicalResources": ["PC", "文献データベース"],
    "externalServices": []
  },
  "status": "created",
  "createdAt": "2025-07-01T01:20:00.000Z"
}
```

---

*このAPI仕様書は、実装されている機能に基づいて作成されており、新機能追加に伴い継続的に更新されます。*
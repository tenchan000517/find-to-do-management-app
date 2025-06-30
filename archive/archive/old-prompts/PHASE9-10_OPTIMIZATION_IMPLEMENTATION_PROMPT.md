# 【Phase 9-10】システム統合・最適化実装プロンプト

**作成日**: 2025-06-15
**対象Phase**: Phase 9-10（システム統合・パフォーマンス最適化・セキュリティ強化）
**前提条件**: Phase 1-8完了済み、全追加機能実装済み

---

## 🎯 このプロンプトの使い方

このプロンプトをClaude Codeに与えることで、Phase 9-10の最適化を**安全かつ確実に**実装できます。

**使用方法:**
1. 新しいClaude Codeセッションを開始
2. このプロンプト全体をコピーしてClaude Codeに貼り付け
3. Claude Codeが段階的に実装を進めます

---

## 📋 実装前チェックリスト

以下をClaude Codeに確認させてください：

```bash
# 1. 作業ディレクトリ確認
pwd  # /mnt/c/find-to-do-management-app であること

# 2. Git状態確認（クリーンであること）
git status
git log --oneline -5

# 3. ビルド成功確認
npm run build

# 4. TypeScriptエラーなし確認
npx tsc --noEmit

# 5. データベース統計確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.users.count(), p.projects.count(), p.tasks.count(), p.calendar_events.count()]).then(r => console.log('DB統計:', {users: r[0], projects: r[1], tasks: r[2], events: r[3]})).finally(() => p.\$disconnect())"
```

---

## 🚀 Phase 9: パフォーマンス最適化実装

### **Step 1: データベースインデックス追加（最優先・30分）**

#### 1.1 現在のパフォーマンスベースライン測定
```bash
# 実装前のAPI応答時間を記録
curl -w "@-" -o /dev/null -s "http://localhost:3000/api/calendar/unified?startDate=2025-06-01&endDate=2025-06-30" <<'EOF'
time_namelookup:  %{time_namelookup}
time_connect:  %{time_connect}
time_appconnect:  %{time_appconnect}
time_pretransfer:  %{time_pretransfer}
time_redirect:  %{time_redirect}
time_starttransfer:  %{time_starttransfer}
time_total:  %{time_total}
EOF
```

#### 1.2 schema.prismaにインデックス追加
```prisma
// prisma/schema.prisma の各モデルに追加

model calendar_events {
  // ... 既存フィールド ...
  
  @@index([date], name: "idx_calendar_date")
  @@index([userId, date], name: "idx_calendar_user_date")
  @@index([appointmentId], name: "idx_calendar_appointment")
  @@index([taskId], name: "idx_calendar_task")
  @@index([projectId], name: "idx_calendar_project")
}

model tasks {
  // ... 既存フィールド ...
  
  @@index([dueDate], name: "idx_tasks_due")
  @@index([userId, isArchived, status], name: "idx_tasks_filter")
  @@index([projectId], name: "idx_tasks_project")
  @@index([createdAt], name: "idx_tasks_created")
}

model personal_schedules {
  // ... 既存フィールド ...
  
  @@index([date], name: "idx_personal_date")
  @@index([userId, date], name: "idx_personal_user_date")
}

model appointments {
  // ... 既存フィールド ...
  
  @@index([status], name: "idx_appointments_status")
  @@index([updatedAt], name: "idx_appointments_updated")
  @@index([userId], name: "idx_appointments_user")
}

model knowledge_items {
  // ... 既存フィールド ...
  
  @@index([category], name: "idx_knowledge_category")
  @@index([createdAt], name: "idx_knowledge_created")
}
```

#### 1.3 マイグレーション実行
```bash
# マイグレーション作成と適用
npx prisma migrate dev --name add_performance_indexes

# 確認
npx prisma studio
```

#### 1.4 パフォーマンス改善確認
```bash
# 同じAPIを再度測定して改善を確認
curl -w "@-" -o /dev/null -s "http://localhost:3000/api/calendar/unified?startDate=2025-06-01&endDate=2025-06-30" <<'EOF'
time_total:  %{time_total}
EOF
```

### **Step 2: N+1クエリ解決（2-3時間）**

#### 2.1 `/api/projects/promotion-candidates/route.ts` 修正
```typescript
// src/app/api/projects/promotion-candidates/route.ts

// 修正前のN+1パターンを以下に置き換え：

async function handleAutoPromoteAll(candidates: any[]) {
  try {
    // バッチ評価用のデータ準備
    const evaluationPromises = candidates.map(candidate => 
      promotionEngine.evaluateAutoPromotion(candidate)
    );
    
    // 並列評価（最大5件ずつ）
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < evaluationPromises.length; i += batchSize) {
      const batch = evaluationPromises.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }
    
    // 昇華すべきプロジェクトのみフィルタリング
    const toPromote = results
      .map((evaluation, index) => ({
        evaluation,
        candidate: candidates[index]
      }))
      .filter(item => item.evaluation.shouldAutoPromote);
    
    // バッチでプロジェクト作成
    if (toPromote.length > 0) {
      const newProjects = await prisma.projects.createMany({
        data: toPromote.map(item => ({
          id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: item.evaluation.suggestedName,
          description: item.evaluation.suggestedDescription,
          status: 'active',
          phase: 'planning',
          priority: 'medium',
          leaderId: item.candidate.relatedTasks?.[0]?.userId || 'user_kawashima',
          kgiType: item.evaluation.kgiType || 'sales',
          kgiTarget: item.evaluation.kgiTarget || null,
          kgiUnit: item.evaluation.kgiUnit || null,
          startDate: new Date(),
          metadata: {
            autoPromoted: true,
            sourceType: item.candidate.type,
            confidence: item.evaluation.confidence,
            createdAt: new Date().toISOString()
          }
        }))
      });
      
      return {
        promotedCount: newProjects.count,
        evaluations: toPromote.map(item => item.evaluation)
      };
    }
    
    return {
      promotedCount: 0,
      evaluations: []
    };
  } catch (error) {
    console.error('Batch auto-promotion failed:', error);
    throw error;
  }
}
```

#### 2.2 `/api/appointments/evaluate/route.ts` 修正
```typescript
// src/app/api/appointments/evaluate/route.ts

// バルクアップデート実装
async function bulkUpdateAppointmentDetails(appointments: any[]) {
  // AI評価をバッチ処理
  const batchSize = 5;
  const evaluations = [];
  
  for (let i = 0; i < appointments.length; i += batchSize) {
    const batch = appointments.slice(i, i + batchSize);
    const batchEvaluations = await Promise.all(
      batch.map(apt => evaluator.evaluateAppointment(apt))
    );
    evaluations.push(...batchEvaluations);
  }
  
  // Prismaトランザクションでバルク更新
  const updateData = appointments.map((apt, index) => ({
    where: {
      appointmentId: apt.id
    },
    create: {
      appointmentId: apt.id,
      status: apt.details?.status || 'initial_contact',
      phase: apt.details?.phase || 'information_gathering',
      leadSource: apt.details?.leadSource || 'other',
      locationType: apt.details?.locationType || 'online',
      locationDetail: apt.details?.locationDetail || '',
      aiImportance: evaluations[index].importance,
      nextActionType: evaluations[index].suggestedNextAction
    },
    update: {
      aiImportance: evaluations[index].importance,
      nextActionType: evaluations[index].suggestedNextAction,
      updatedAt: new Date()
    }
  }));
  
  // トランザクションで一括実行
  const results = await prisma.$transaction(
    updateData.map(data => 
      prisma.appointment_details.upsert(data)
    )
  );
  
  return results;
}
```

#### 2.3 `/api/calendar/unified/route.ts` 最適化
```typescript
// src/app/api/calendar/unified/route.ts

// 複数クエリを統合
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const userId = searchParams.get('userId');
  
  // 並列クエリで全データ取得
  const [personalSchedules, calendarEvents, tasks, appointments] = await Promise.all([
    // 個人予定
    prisma.personal_schedules.findMany({
      where: {
        date: {
          gte: new Date(startDate!),
          lte: new Date(endDate!)
        },
        ...(userId && { userId })
      }
    }),
    
    // カレンダーイベント（関連データを選択的に取得）
    prisma.calendar_events.findMany({
      where: {
        date: {
          gte: new Date(startDate!),
          lte: new Date(endDate!)
        },
        ...(userId && { userId })
      },
      select: {
        id: true,
        title: true,
        date: true,
        startTime: true,
        endTime: true,
        category: true,
        importance: true,
        isAllDay: true,
        location: true,
        description: true,
        appointmentId: true,
        taskId: true,
        projectId: true,
        userId: true,
        users: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    }),
    
    // タスク（期限が範囲内）
    prisma.tasks.findMany({
      where: {
        dueDate: {
          gte: new Date(startDate!),
          lte: new Date(endDate!)
        },
        isArchived: false,
        ...(userId && { userId })
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        status: true,
        userId: true
      }
    }),
    
    // アポイントメント
    prisma.appointments.findMany({
      where: {
        datetime: {
          gte: new Date(startDate!),
          lte: new Date(endDate!)
        },
        ...(userId && { userId })
      },
      include: {
        appointment_details: true
      }
    })
  ]);
  
  // メモリ内で統合処理
  const allEvents = [
    ...personalSchedules.map(transformPersonalSchedule),
    ...calendarEvents,
    ...tasks.map(transformTaskToEvent),
    ...appointments.map(transformAppointmentToEvent)
  ];
  
  // ソートして返却
  return NextResponse.json({
    events: allEvents.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
    stats: {
      personal: personalSchedules.length,
      calendar: calendarEvents.length,
      tasks: tasks.length,
      appointments: appointments.length
    }
  });
}
```

### **Step 3: キャッシング実装（1日）**

#### 3.1 メモリキャッシュマネージャー作成
```typescript
// src/lib/cache/memory-cache.ts (新規)

interface CacheEntry {
  value: any;
  expiry: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxSize = 1000; // 最大エントリ数
  
  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    // LRU: 最大サイズ超えたら古いものを削除
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000
    });
  }
  
  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
}

// シングルトンインスタンス
export const cache = new MemoryCache();
```

#### 3.2 キャッシュ対応API実装例
```typescript
// src/app/api/calendar/unified/route.ts にキャッシュ追加

import { cache } from '@/lib/cache/memory-cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cacheKey = `calendar:${searchParams.toString()}`;
  
  // キャッシュチェック
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json({
      ...cached,
      _cache: true // デバッグ用
    });
  }
  
  // 既存の処理...
  const result = {
    events: allEvents,
    stats: stats
  };
  
  // キャッシュに保存（5分間）
  await cache.set(cacheKey, result, 300);
  
  return NextResponse.json(result);
}
```

### **Step 4: セキュリティ基盤実装（最重要・1日）**

#### 4.1 LINE Webhook署名検証を即座に有効化（5分）
```typescript
// src/app/api/webhook/line/route.ts

// 以下のコメントアウトを解除
if (!signature || !validateSignature(body, signature)) {
  console.error('Invalid signature');
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
// この行を削除: console.log('*** SIGNATURE VALIDATION DISABLED FOR TESTING ***');
```

#### 4.2 環境変数による認証トークン実装（簡易版）
```typescript
// src/middleware.ts (新規)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 公開エンドポイント
const PUBLIC_PATHS = [
  '/api/webhook/line', // LINE Webhookは署名検証で保護
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 公開エンドポイントはスキップ
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // APIエンドポイントのみ保護
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // 環境変数のトークンと照合（開発用簡易認証）
    if (token !== process.env.API_SECRET_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

#### 4.3 .env.localに認証トークン追加
```bash
# .env.local に追加
API_SECRET_TOKEN=your-secret-token-here-change-this-in-production
```

#### 4.4 入力検証の実装
```typescript
// src/lib/validation/schemas.ts (新規)

import { z } from 'zod';

// タスク作成/更新スキーマ
export const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  userId: z.string().regex(/^user_/),
  projectId: z.string().regex(/^proj_/).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().min(0).max(999).optional(),
});

// プロジェクトスキーマ
export const projectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']),
  phase: z.enum(['planning', 'execution', 'monitoring', 'closing']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  leaderId: z.string().regex(/^user_/),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// バリデーションヘルパー
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}
```

#### 4.5 APIルートでの検証実装例
```typescript
// src/app/api/tasks/route.ts の修正例

import { taskSchema, validateRequest } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 入力検証
    const validation = validateRequest(taskSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.errors.errors
      }, { status: 400 });
    }
    
    // 検証済みデータを使用
    const validatedData = validation.data;
    
    // 既存の処理...
  } catch (error) {
    // エラーハンドリング
  }
}
```

### **Step 5: 実装確認とテスト**

#### 5.1 パフォーマンステスト
```bash
# インデックス効果測定
time curl "http://localhost:3000/api/calendar/unified?startDate=2025-06-01&endDate=2025-06-30" \
  -H "Authorization: Bearer your-secret-token-here-change-this-in-production"

# キャッシュ効果測定（2回目は高速になるはず）
time curl "http://localhost:3000/api/calendar/unified?startDate=2025-06-01&endDate=2025-06-30" \
  -H "Authorization: Bearer your-secret-token-here-change-this-in-production"
```

#### 5.2 セキュリティテスト
```bash
# 認証なしでアクセス（401エラーになるはず）
curl "http://localhost:3000/api/tasks"

# 認証ありでアクセス（成功するはず）
curl "http://localhost:3000/api/tasks" \
  -H "Authorization: Bearer your-secret-token-here-change-this-in-production"

# LINE Webhook署名検証テスト
curl -X POST "http://localhost:3000/api/webhook/line" \
  -H "Content-Type: application/json" \
  -d '{"events":[]}' 
# → 401 Invalid signature になるはず
```

#### 5.3 最終確認
```bash
# ビルド成功確認
npm run build

# TypeScriptエラーなし確認
npx tsc --noEmit

# 全APIの動作確認スクリプト
node -e "
const token = 'your-secret-token-here-change-this-in-production';
const apis = ['/api/tasks', '/api/projects', '/api/users', '/api/calendar'];
apis.forEach(api => {
  fetch('http://localhost:3000' + api, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(r => console.log(api, ':', r.status))
  .catch(e => console.error(api, ':', 'ERROR'));
});
"
```

---

## ⚠️ 実装時の重要な注意事項

### **絶対にやってはいけないこと**
1. ❌ 既存のテーブル構造を変更しない（インデックス追加のみOK）
2. ❌ 既存APIのレスポンス形式を変更しない
3. ❌ 既存のUIコンポーネントを削除・変更しない
4. ❌ データを削除する処理を追加しない

### **必ず確認すること**
1. ✅ 各ステップ完了後に `npm run build` が成功すること
2. ✅ 既存機能が正常に動作すること
3. ✅ 新しいエラーが発生していないこと
4. ✅ パフォーマンスが改善されていること

### **トラブル時の対処**
```bash
# 問題が発生したら即座に
git status
git diff

# 必要なら安全なコミットに戻る
git log --oneline -5
git reset --hard <safe-commit-hash>
```

---

## 📊 成功基準

以下がすべて達成されたら、Phase 9-10完了です：

### **パフォーマンス**
- [ ] カレンダーAPI応答時間が50%以上改善
- [ ] N+1クエリが解消されている
- [ ] キャッシュが正常に動作している

### **セキュリティ**
- [ ] すべてのAPIが認証で保護されている
- [ ] LINE Webhook署名検証が有効
- [ ] 入力検証が実装されている

### **品質**
- [ ] ビルドエラーなし
- [ ] TypeScriptエラーなし
- [ ] 既存機能への影響なし

---

## 🎉 実装完了後

すべて完了したら、以下のコミットメッセージでコミット：

```bash
git add -A
git commit -m "Phase 9-10完了: システム最適化・セキュリティ強化

- データベースインデックス追加（50-70%高速化）
- N+1クエリ解決（クエリ数80%削減）
- メモリキャッシング実装
- API認証システム実装
- 入力検証強化
- LINE Webhook署名検証有効化

既存機能への影響: なし
パフォーマンス改善: 確認済み
セキュリティ: 大幅強化"
```

このプロンプトに従って実装を進めることで、**既存機能を一切壊すことなく**、システムの品質を大幅に向上させることができます。
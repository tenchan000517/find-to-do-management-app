# データベース操作ナレッジ - Prisma実装で躓きがちなポイント

## 🎯 目的
このドキュメントは、Prismaを使用したデータベース操作で遭遇しがちな問題と解決方法をまとめたものです。Phase 2-4実装で実際に発生した問題を基に作成しています。

**📅 最終更新:** 2025-06-15 (Phase 5完了時点)

---

## 🔧 よくある問題と解決方法

### 1. `@updatedAt`アノテーション忘れ

**❌ 問題:**
```prisma
model users {
  id        String   @id
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime  // ❌ アノテーションなし
}
```

**❌ エラー:**
```
Argument `updatedAt` is missing.
```

**✅ 解決:**
```prisma
model users {
  id        String   @id
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt  // ✅ 自動更新アノテーション
}
```

**💡 原因:** Prismaクライアントは`@updatedAt`アノテーションがないと、手動で`updatedAt`値の指定を要求します。

---

### 2. Prismaクライアント再生成忘れ

**❌ 問題:** スキーマを変更後、古いクライアントを使用

**❌ エラー:**
```
Object literal may only specify known properties, and 'newField' does not exist
```

**✅ 解決手順:**
```bash
# 1. スキーマ変更後は必ず実行
npx prisma db push          # データベースに反映
npx prisma generate         # クライアント再生成

# 2. または統合コマンド
npm run build               # generate + build を実行
```

**💡 重要:** スキーマ変更時は必ずPrismaクライアントの再生成が必要です。

---

### 3. 必須フィールドの欠如

**❌ 問題:**
```javascript
await prisma.projects.create({
  data: {
    name: "テストプロジェクト",
    // startDate: 欠如
  }
})
```

**❌ エラー:**
```
Argument `startDate` is missing.
```

**✅ 解決:**
```javascript
await prisma.projects.create({
  data: {
    name: "テストプロジェクト", 
    startDate: new Date().toISOString(), // ✅ 必須フィールド追加
  }
})
```

**💡 チェック方法:** スキーマで`?`がないフィールドは必須です。

---

### 4. データベースドリフトエラー

**❌ 問題:**
```
Drift detected: Your database schema is not in sync with your migration history.
```

**✅ 解決手順:**
```bash
# 開発環境で安全にリセット
npx prisma migrate reset --force

# または段階的対応
npx prisma migrate dev --name "describe-changes"
```

**💡 原因:** `prisma db push`と`prisma migrate`の混在使用で発生します。

---

### 5. 型の不一致エラー

**❌ 問題:**
```javascript
// スキーマ: Float型
successProbability: Float

// コード: Number型で挿入
successProbability: 0  // ❌ 型不一致の可能性
```

**✅ 解決:**
```javascript
successProbability: 0.0  // ✅ 明示的なFloat型
```

---

## 🛠️ ベストプラクティス

### 1. スキーマ設計の原則

```prisma
model example_table {
  id          String   @id @default(cuid())  // ✅ 一意ID
  name        String                          // ✅ 必須フィールド
  description String?                         // ✅ オプショナル明示
  status      status_enum @default(ACTIVE)    // ✅ デフォルト値
  createdAt   DateTime @default(now())        // ✅ 作成日時
  updatedAt   DateTime @updatedAt             // ✅ 更新日時
}
```

### 2. 安全な開発フロー

```bash
# 1. スキーマ変更
nano prisma/schema.prisma

# 2. データベース同期
npx prisma db push

# 3. クライアント再生成  
npx prisma generate

# 4. ビルドテスト
npm run build

# 5. 動作確認
node test-script.js
```

### 3. テストデータ作成のテンプレート

```javascript
// safe-test-data.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  try {
    // 1. 既存データ確認
    const existingUser = await prisma.users.findFirst();
    if (existingUser) {
      console.log('Using existing user:', existingUser.id);
      return existingUser;
    }

    // 2. 新規作成（すべての必須フィールド指定）
    const newUser = await prisma.users.create({
      data: {
        id: `user_${Date.now()}`,
        name: 'Test User',
        email: `test_${Date.now()}@example.com`,  // ユニーク制約対応
        color: '#FF0000',
        isActive: true,
        // updatedAt は @updatedAt で自動設定
      }
    });

    return newUser;
  } catch (error) {
    console.error('Error:', error.message);
    // エラー原因の特定ヒント
    if (error.code === 'P2002') {
      console.log('💡 Unique constraint violation - check email/id uniqueness');
    }
    if (error.message.includes('missing')) {
      console.log('💡 Missing required field - check schema for non-optional fields');
    }
  } finally {
    await prisma.$disconnect();
  }
}
```

---

## 🚨 緊急時の対処法

### データベースが壊れた場合

```bash
# 1. バックアップから復旧（本番環境）
pg_restore backup_file.sql

# 2. 開発環境でのリセット
npx prisma migrate reset --force
npx prisma db push
npx prisma generate

# 3. テストデータ再作成
node create-test-data.js
```

### 移行が失敗した場合

```bash
# 1. 安全なコミットに戻る
git log --oneline
git reset --hard <safe_commit_hash>

# 2. スキーマを段階的に変更
# 大きな変更を小さく分割

# 3. 各段階でテスト
npx prisma db push
npm run build
```

---

## 🚀 Phase 4実装で発生した新たな問題 (2025-06-15追加)

### 6. Service層メソッド名の不一致

**❌ 問題:**
Phase 4実装中に、AlertEngineとNotificationServiceで以下のエラーが発生:
```typescript
// ❌ 存在しないメソッド名を使用
const projects = await prismaDataService.getAllProjects(); // エラー
const users = await prismaDataService.getAllUsers(); // エラー
```

**❌ エラー:**
```
Property 'getAllProjects' does not exist on type 'PrismaDataService'. Did you mean 'getProjects'?
```

**✅ 解決:**
既存のprismaDataServiceメソッド名を正確に使用:
```typescript
// ✅ 正しいメソッド名
const projects = await prismaDataService.getProjects();
const users = await prismaDataService.getUsers();
const tasks = await prismaDataService.getAllTasks(); // このメソッドは存在する
const events = await prismaDataService.getCalendarEvents();
```

**🔍 調査方法:**
```bash
# メソッド名確認
grep -n "async.*Project" src/lib/database/prisma-service.ts
grep -n "async.*User" src/lib/database/prisma-service.ts
```

### 7. TypeScript型安全性とany型インデックス

**❌ 問題:**
アラートAPIで重要度ソート時に型エラー:
```typescript
// ❌ any型での辞書アクセス
const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
alerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]); // エラー
```

**❌ エラー:**
```
Element implicitly has an 'any' type because expression of type 'any' can't be used to index type
```

**✅ 解決:**
明示的な型指定とフォールバック値:
```typescript
// ✅ 型安全なアプローチ
const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
alerts.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));
```

### 8. 新機能実装時のビルド順序

**⚠️ 重要な教訓:**
新しいサービス層を実装する際は以下の順序を厳守:

1. **データベースメソッド追加** (prisma-service.ts)
2. **型定義確認・追加** (types.ts)
3. **サービス層実装** (alert-engine.ts, notification-service.ts)
4. **API層実装** (route.ts)
5. **ビルドテスト実行** (`npm run build`)

**🎯 効率的デバッグ:**
```bash
# 段階的ビルドで問題箇所を特定
npm run build 2>&1 | head -20  # 最初のエラーのみ表示
```

### 9. Next.js 15 API Route パラメーター型エラー (Phase 5で発見)

**❌ 問題:**
```typescript
// ❌ 古い形式 - Next.js 15でエラー
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id; // エラー
}
```

**❌ エラー:**
```
Type "{ params: { id: string; }; }" is not a valid type for the function's second argument.
```

**✅ 解決:**
```typescript
// ✅ Next.js 15対応の新形式
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const projectId = params.id; // 正常動作
}
```

**💡 原因:** Next.js 15では`params`が非同期になり、Promiseラップが必要になりました。

### 10. TypeScript Union型でのプロパティアクセスエラー (Phase 5で発見)

**❌ 問題:**
```typescript
// ❌ Union型で存在しないプロパティへのアクセス
type ProjectAlert = { id: string; triggeredAt: string; severity: string; };
type UserAlert = { id: string; severity: string; }; // triggeredAtなし

const alerts: (ProjectAlert | UserAlert)[] = [...];
alerts.sort((a, b) => 
  new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime() // エラー
);
```

**❌ エラー:**
```
Property 'triggeredAt' does not exist on type 'ProjectAlert | UserAlert'.
Property 'triggeredAt' does not exist on type 'UserAlert'.
```

**✅ 解決:**
```typescript
// ✅ 型ガードを使用したアクセス
const allAlerts = [...projectAlerts, ...userAlerts].sort((a, b) => {
  const aIsProject = 'projectId' in a;
  const bIsProject = 'projectId' in b;
  const aDate = aIsProject ? (a as ProjectAlert).triggeredAt || a.createdAt : a.createdAt;
  const bDate = bIsProject ? (b as ProjectAlert).triggeredAt || b.createdAt : b.createdAt;
  return new Date(bDate).getTime() - new Date(aDate).getTime();
});
```

**💡 原因:** Union型では全ての型に共通するプロパティのみアクセス可能。型ガードで判定が必要。

### 11. Prisma戻り値の暗黙的any型エラー (Phase 5で発見)

**❌ 問題:**
```typescript
// ❌ Prismaクエリ結果のmapで型エラー
const metrics = await prisma.discord_metrics.findMany();
const formatted = metrics.map((metric) => ({ // metric: any エラー
  id: metric.id,
  date: metric.date.toISOString()
}));
```

**❌ エラー:**
```
Parameter 'metric' implicitly has an 'any' type. ts(7006)
```

**✅ 解決:**
```typescript
// ✅ 明示的な型注釈
const formatted = metrics.map((metric: any) => ({
  id: metric.id,
  date: metric.date.toISOString()
}));

// ✅ より良い解決法: 型定義
type DiscordMetric = {
  id: string;
  date: Date;
  // その他フィールド
};

const formatted = metrics.map((metric: DiscordMetric) => ({
  id: metric.id,
  date: metric.date.toISOString()
}));
```

**💡 原因:** TypeScript strict modeでは暗黙的なany型を禁止。明示的な型注釈が必要。

### 12. オプショナルプロパティの空オブジェクト初期化 (Phase 5で発見)

**❌ 問題:**
```typescript
// ❌ 空オブジェクトからプロパティアクセス
const skills = user.skills || {};
const management = skills.management; // エラー: Property 'management' does not exist on type '{}'
```

**✅ 解決:**
```typescript
// ✅ デフォルト値付きの初期化
const skills = user.skills || { management: 5, engineering: 5, sales: 5, creative: 5, marketing: 5, pr: 5 };
const management = skills.management; // 正常動作

// ✅ Optional chainingアプローチ
const management = user.skills?.management || 5;
```

**💡 原因:** 空オブジェクト`{}`にはどのプロパティも存在しないためTypeScriptエラー。適切なデフォルト値が必要。

---

## 📋 チェックリスト

### スキーマ変更時
- [ ] 必須フィールドにデフォルト値または初期値設定
- [ ] `@updatedAt`アノテーション追加
- [ ] ユニーク制約の確認  
- [ ] 外部キー関係の整合性確認

### 実装時
- [ ] `npx prisma generate`実行
- [ ] `npm run build`でエラーチェック
- [ ] テストデータでの動作確認
- [ ] 既存APIの動作確認

### コミット前
- [ ] 全APIエンドポイントの動作確認
- [ ] データ整合性の確認
- [ ] ビルドエラー0件の確認
- [ ] テストスクリプトの実行

---

## 🔗 参考リソース

- [Prisma公式ドキュメント](https://www.prisma.io/docs)
- [Prismaエラーコード一覧](https://www.prisma.io/docs/reference/api-reference/error-reference)
- [Next.js + Prisma ベストプラクティス](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props#with-prisma)

---

---

## 💡 カレンダー機能実装での追加知見 (2025-06-15追加)

### 13. Prisma型エラーの頻出パターンと解決

**重要:** カレンダー機能実装において、以下のPrisma型エラーが頻繁に発生します。

#### パターン1: Next.js 15での動的ルートパラメーター
**❌ 問題:**
```typescript
// ❌ Next.js 15では型エラー
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params; // エラー
}
```

**✅ 解決:**
```typescript
// ✅ Next.js 15対応
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // 正常動作
}
```

#### パターン2: 暗黙的any型エラー
**❌ 問題:**
```typescript
// ❌ 暗黙的any型エラー
events.map(event => ({ // エラー: Parameter 'event' implicitly has an 'any' type
  id: event.id,
  title: event.title
}))
```

**✅ 解決:**
```typescript
// ✅ 明示的型注釈
events.map((event: any) => ({
  id: event.id,
  title: event.title
}))

// ✅ より良い解決法：型定義使用
import { CalendarEvent } from '@/types/calendar';
events.map((event: CalendarEvent) => ({
  id: event.id,
  title: event.title
}))
```

#### パターン3: Prismaスキーマ変更後の型同期エラー
**❌ 問題:**
```typescript
// ❌ 新フィールドが型定義に存在しない
await prisma.calendar_events.create({
  data: {
    title: "Meeting",
    userId: "user_1", // スキーマ追加後のフィールド
    importance: 0.8   // 型定義にない
  }
})
```

**✅ 解決手順:**
```bash
# 1. 必ずPrismaクライアント再生成
npx prisma generate

# 2. TypeScript型定義更新確認
npx tsc --noEmit

# 3. 開発サーバー再起動
npm run dev
```

### 14. カレンダー特有の型安全性確保

**🎯 推奨パターン:**
```typescript
// ✅ カレンダーイベント作成時の型安全パターン
import { PrismaCalendarEvent, CalendarEvent } from '@/types/calendar';

// 1. Prisma戻り値用の型
type PrismaCalendarEvent = {
  id: string;
  title: string;
  date: string;
  userId: string;
  category: 'GENERAL' | 'MEETING' | 'APPOINTMENT';
  importance: number;
  // ... その他フィールド
};

// 2. フロントエンド用の型
type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  colorCode?: string;
  isAllDay?: boolean;
};

// 3. 変換関数での型安全性
function transformPrismaToCalendarEvent(prismaEvent: PrismaCalendarEvent): CalendarEvent {
  return {
    id: prismaEvent.id,
    title: prismaEvent.title,
    date: prismaEvent.date,
    time: prismaEvent.time || '00:00',
    colorCode: prismaEvent.colorCode || CATEGORY_COLORS[prismaEvent.category],
    isAllDay: prismaEvent.isAllDay || false
  };
}
```

**💡 重要:** カレンダー機能では特にPrisma型エラーが頻発するため、上記のパターンを必ず参照して実装してください。

---

**作成日:** 2025-06-15  
**最終更新:** カレンダー機能Phase 1-2実装完了時  
**対象プロジェクト:** find-to-do-management-app
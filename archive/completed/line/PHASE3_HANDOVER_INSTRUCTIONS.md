# Phase 3 リファクタリング引き継ぎ指示書

**作成日**: 2025-06-19  
**状況**: Phase 3部分完成 - 残り2ファイルの実装が必要  
**次のエンジニア向け**: database-service.ts と event-router.ts の実装指示

---

## 🎯 現在の状況

### ✅ 完了済み (3/5ファイル)
- **webhook-validator.ts** ✅ 実装完了
- **message-processor.ts** ✅ 実装完了
- **postback-handler.ts** ✅ 実装完了

### ⏳ 残り作業 (2/5ファイル)
- **database-service.ts** - データベース操作の分離
- **event-router.ts** - イベントルーティングの分離

### 📁 実装済みファイル詳細

#### 1. webhook-validator.ts (90行)
**機能**: LINE Webhook署名検証・リクエスト解析
**場所**: `/src/lib/line/webhook-validator.ts`
**エクスポート**:
- `validateSignature()` - HMAC-SHA256署名検証
- `parseWebhookBody()` - リクエストボディ解析
- `createWebhookResponse()` - レスポンス生成
- 型定義: `LineWebhookEvent`, `LineMessage`, `LineWebhookBody`

#### 2. message-processor.ts (220行)
**機能**: メッセージ処理・メンション検知・コマンド解析
**場所**: `/src/lib/line/message-processor.ts`
**エクスポート**:
- `handleMessage()` - メインメッセージ処理
- `isMentioned()` - メンション検知
- `cleanMessageText()` - メンション除去
- `extractCommand()` - コマンド抽出
- `handleSessionInput()` - セッション入力処理
- `processTextMessage()` - AI統合テキスト処理

#### 3. postback-handler.ts (520行)
**機能**: ボタン操作・UIフロー管理
**場所**: `/src/lib/line/postback-handler.ts`
**エクスポート**:
- `handlePostback()` - メインポストバック処理
**注意**: database-service.tsの関数を一時的にroute.tsからインポート

---

## 🔧 次のエンジニアの実装タスク

### ⚠️ 重要な注意事項
前回の実装で **データベーススキーマとの不一致** による型エラーが多数発生しました。  
**必ず** 実際のPrismaスキーマを確認してフィールド名を正確に合わせてください。

### タスク1: database-service.ts 実装

#### 📋 抽出対象関数
route.ts の以下の関数を抽出：
- `saveClassifiedData()` (991-1261行, 271行)
- `updateExistingRecord()` (1264-1440行, 177行)

#### 🔍 主要要件
1. **Prismaスキーマとの整合性確保**
   ```bash
   # 事前にスキーマ確認必須
   npx prisma generate
   cat prisma/schema.prisma | grep -A 20 "model calendar_events"
   cat prisma/schema.prisma | grep -A 20 "model tasks"
   # 他の全モデルも確認
   ```

2. **対象データ型 (7種類)**
   - `personal_schedule` → `personal_schedules` テーブル
   - `schedule` → `calendar_events` テーブル  
   - `task` → `tasks` テーブル
   - `project` → `projects` テーブル
   - `contact` → `connections` テーブル
   - `appointment` → `appointments` テーブル
   - `memo` → `knowledge_items` テーブル

3. **重要な型エラー回避ポイント**
   - 必須フィールドの確認（例: `knowledge_items.author`は必須）
   - フィールド名の正確性（例: `title` vs `subject`）
   - Enum値の確認（例: task.status = 'PENDING' vs 'TODO'）

#### 📄 実装テンプレート
```typescript
// src/lib/line/database-service.ts
import { PrismaClient } from '@prisma/client';
import { getJSTISOString, getJSTTimestampForID } from '@/lib/utils/datetime-jst';
import { convertPriority } from '@/lib/utils/line-helpers';

let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function saveClassifiedData(
  extractedData: any,
  sessionInfo: { type: string; data: Record<string, any> } | null,
  userId: string
): Promise<string | null> {
  // route.ts 991-1261行の内容を移植
  // ⚠️ Prismaスキーマに合わせてフィールド名を修正
}

export async function updateExistingRecord(
  recordId: string,
  sessionInfo: { type: string; data: Record<string, any> },
  userId: string
): Promise<void> {
  // route.ts 1264-1440行の内容を移植
  // ⚠️ Prismaスキーマに合わせてフィールド名を修正
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
```

### タスク2: event-router.ts 実装

#### 📋 抽出対象関数
route.ts の以下の関数を抽出：
- `handleFollow()` (371-377行)
- `handleJoin()` (380-386行)
- `handleEvent()` (916-943行) - メインイベントルーター

#### 📄 実装テンプレート
```typescript
// src/lib/line/event-router.ts
import { LineWebhookEvent } from './webhook-validator';
import { handleMessage } from './message-processor';
import { handlePostback } from './postback-handler';
import { sendReplyMessage, createWelcomeMessage, createJoinMessage } from './notification';

async function handleFollow(event: LineWebhookEvent): Promise<void> {
  // route.ts 371-377行の内容を移植
}

async function handleJoin(event: LineWebhookEvent): Promise<void> {
  // route.ts 380-386行の内容を移植
}

export async function handleEvent(event: LineWebhookEvent): Promise<void> {
  // route.ts 916-943行の内容を移植
  // switch文で各イベントタイプを適切なハンドラーに振り分け
}
```

### タスク3: route.ts 更新

database-service.ts と event-router.ts が完成したら、route.tsを簡潔に更新：

```typescript
// src/app/api/webhook/line/route.ts (新版)
import { NextRequest, NextResponse } from 'next/server';
import { getJSTISOString } from '@/lib/utils/datetime-jst';
import { 
  validateSignature,
  parseWebhookBody,
  createWebhookResponse
} from '@/lib/line/webhook-validator';
import { handleEvent } from '@/lib/line/event-router';

export async function GET() {
  return NextResponse.json({ 
    status: 'OK', 
    message: 'LINE Webhook endpoint is active',
    timestamp: getJSTISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log('🚀 WEBHOOK ENDPOINT HIT! Time:', getJSTISOString());
  
  try {
    // Parse and validate webhook body
    const { success, body, parsedBody, error } = await parseWebhookBody(request);
    if (!success || !body || !parsedBody) {
      return error || createWebhookResponse('Invalid request', 400);
    }
    
    // Validate signature
    const signature = request.headers.get('x-line-signature');
    if (!signature || !validateSignature(body, signature)) {
      return createWebhookResponse('Invalid signature', 401);
    }
    
    // Process all events
    await Promise.all(parsedBody.events.map(handleEvent));
    
    return createWebhookResponse('Success');
    
  } catch (error) {
    console.error('Webhook error:', error);
    return createWebhookResponse('Internal server error', 500);
  }
}
```

### タスク4: postback-handler.ts 更新

database-service.ts 完成後、import文を更新：

```typescript
// src/lib/line/postback-handler.ts (import部分のみ更新)
import { saveClassifiedData, updateExistingRecord } from './database-service';

// 以下の一時的なコードを削除：
// async function saveClassifiedData(recordId: any, sessionInfo: any, userId: string): Promise<string | null> { ... }
// async function updateExistingRecord(recordId: string, sessionInfo: any, userId: string): Promise<void> { ... }
```

---

## 🧪 テスト・検証手順

### 1. ビルドテスト
```bash
npm run build
npm run typecheck
```

### 2. 型エラー修正
エラーが出た場合は、必ずPrismaスキーマと照合：
```bash
npx prisma studio  # ブラウザでスキーマ確認
```

### 3. 手動LINEテスト
実装完了後、基本フローをテスト：
- メッセージ送信 → AI分析 → 分類確認 → 保存
- ボタン操作 → ポストバック処理 → データベース保存

---

## 📊 期待される結果

### Before (現在)
```
route.ts: 1,447行 (全機能混在)
```

### After (完成時)
```
route.ts: 約50行 (薄いラッパー)
├── webhook-validator.ts: 90行 ✅
├── message-processor.ts: 220行 ✅ 
├── postback-handler.ts: 520行 ✅
├── database-service.ts: 450行 ⏳
└── event-router.ts: 150行 ⏳
```

**効果**: 96%のコード削減 + 責任分離による保守性向上

---

## ⚠️ 注意事項・トラブルシューティング

### データベーススキーマ不一致エラー
最も多いエラーパターン。必ず事前確認：
```bash
# 各テーブルのフィールド一覧確認
npx prisma studio
```

### よくある型エラー例
- `attendees` フィールドが存在しない
- `priority` フィールドがEnum制約
- `status` フィールドの許可値不一致  
- 必須フィールド（`author`, `subject`等）の不足

### 循環参照エラー
- import文の循環を避ける
- 必要に応じて動的importを使用

---

## 📝 次のエンジニアへのメッセージ

1. **Prismaスキーマの事前確認は必須** - 型エラーの90%がスキーマ不一致
2. **段階的実装を推奨** - database-service.ts → event-router.ts → route.ts更新の順
3. **ビルドテストを頻繁に実行** - 各ファイル完成後にテスト
4. **既存機能の動作確認** - LINEボット基本機能が動作することを確認

Phase 3完成まであと少しです。頑張ってください！

---

**参考資料**:
- `docs/essential/CLAUDE.md` - 開発ナレッジベース
- `docs/active/current/LINE_REFACTORING_PLAN_WITH_MANUAL_TESTING.md` - 全体計画
- `prisma/schema.prisma` - データベーススキーマ
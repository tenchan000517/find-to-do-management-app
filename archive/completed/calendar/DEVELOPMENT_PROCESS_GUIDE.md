# 開発プロセスガイド - Phase 7-10 実装手順書

**作成日**: 2025-06-15  
**基準**: Claude Code開発手法論準拠

---

## 📋 開発プロセス概要

本ガイドは、アポ管理・ナレッジ管理・プロジェクト管理統合システムの開発において、各開発者が従うべき具体的な手順を定義します。

---

## 🚀 Phase別開発手順

### **Phase 7: AI呼び出し基盤整備**

#### **Day 1-2: AI Call Manager実装**

```bash
# 1. 作業開始前の確認
git status
npm run build
npx tsc --noEmit

# 2. ブランチ作成
git checkout -b phase7-ai-call-manager

# 3. TodoWrite設定
```

**実装タスク**:
```javascript
{
  "todos": [
    {
      "id": "ph7_01",
      "content": "AI Call Managerクラス作成",
      "status": "pending",
      "priority": "high"
    },
    {
      "id": "ph7_02", 
      "content": "レート制限機能実装",
      "status": "pending",
      "priority": "high"
    },
    {
      "id": "ph7_03",
      "content": "キャッシング機能実装",
      "status": "pending",
      "priority": "high"
    },
    {
      "id": "ph7_04",
      "content": "使用量追跡機能実装",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

**ファイル作成順序**:
1. `src/lib/ai/call-manager.ts`
2. `src/lib/ai/rate-limiter.ts`
3. `src/lib/ai/cache-manager.ts`
4. `src/lib/ai/usage-tracker.ts`

#### **Day 3-4: 既存機能リファクタリング**

```bash
# 動作確認
npm run dev
# 別ターミナルで
curl http://localhost:3000/api/webhook/line -X POST -d '{"events":[{"type":"message","message":{"text":"テストメッセージ"}}]}'
```

**リファクタリング対象**:
1. `src/lib/ai/text-processor.ts`
2. `src/lib/ai/evaluation-engine.ts`
3. 各APIエンドポイント

#### **Day 5: モニタリング機能**

**実装内容**:
1. `src/app/api/admin/ai-usage/route.ts`
2. `src/components/admin/AIUsageDashboard.tsx`
3. データベーステーブル追加

```bash
# マイグレーション実行
npx prisma migrate dev --name add_ai_call_logs

# 動作確認
curl http://localhost:3000/api/admin/ai-usage
```

#### **Phase 7 完了チェックリスト**

```bash
# 全体動作確認
npm run build
npx tsc --noEmit

# AI機能テスト
node scripts/test-ai-functions.js

# コミット
git add .
git commit -m "Phase 7完了: AI呼び出し基盤整備

- AI Call Manager実装
- レート制限・キャッシング機能
- 既存AI機能のリファクタリング
- 使用量モニタリング機能

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### **Phase 8: アポ管理システム実装**

#### **Week 1: 基本機能実装**

**Day 1: データモデル準備**

```bash
# Prismaスキーマ更新
# prisma/schema.prismaに appointment_details を追加

# マイグレーション
npx prisma migrate dev --name add_appointment_details

# 型生成
npx prisma generate
```

**Day 2-3: カンバンUI実装**

```typescript
// 実装順序
1. src/components/appointments/AppointmentKanban.tsx
2. src/components/appointments/StatusKanban.tsx
3. src/components/appointments/PhaseKanban.tsx
4. src/components/appointments/LeadSourceKanban.tsx

// 共通コンポーネント
5. src/components/appointments/AppointmentCard.tsx
6. src/hooks/useAppointmentDrag.ts
```

**Day 4-5: API実装**

```bash
# API実装順序
1. /api/appointments/[id]/details
2. /api/appointments/kanban/[type]
3. /api/appointments/[id]/complete
4. /api/appointments/[id]/reschedule
```

#### **Week 2: AI連携・自動化**

**Day 1-2: AI重要度計算**

```typescript
// src/lib/ai/appointment-evaluator.ts
export class AppointmentEvaluator {
  constructor(private callManager: AICallManager) {}
  
  async evaluateImportance(appointment: AppointmentWithDetails) {
    // AI Call Manager経由で呼び出し
    const result = await this.callManager.callGemini(prompt);
    return parseImportanceScore(result);
  }
}
```

**Day 3: コネクション連携**

```bash
# 実装ファイル
src/lib/services/appointment-connection-sync.ts

# テスト
node scripts/test-appointment-sync.js
```

**Day 4-5: LINE Bot連携**

```typescript
// 追加実装
1. src/lib/line/appointment-follower.ts
2. src/lib/line/weekly-summary.ts
3. /api/cron/appointment-follow-up
```

---

### **Phase 9: ナレッジ管理システム実装**

#### **Week 1: 基本昇華機能**

**実装チェックポイント**:

```bash
# タスク昇華テスト
curl -X POST http://localhost:3000/api/tasks/[id]/upgrade-to-knowledge

# プロジェクトテンプレート化テスト  
curl -X POST http://localhost:3000/api/projects/[id]/create-template
```

#### **Week 2: 活用機能**

**UI実装順序**:
1. プロジェクト作成画面のテンプレート選択
2. タスク登録時の関連ナレッジ表示
3. アポ登録時の関連情報表示

---

### **Phase 10: 統合・最適化**

#### **統合テストシナリオ**

```bash
# 1. アポ→タスク自動生成
curl -X POST http://localhost:3000/api/appointments/[id]/complete \
  -d '{"createTask": true}'

# 2. タスク→ナレッジ昇華
curl -X POST http://localhost:3000/api/tasks/[id]/upgrade-to-knowledge

# 3. プロジェクト→テンプレート化
curl -X POST http://localhost:3000/api/projects/[id]/create-template
```

---

## 🔧 日次開発フロー

### **1. 朝の作業開始**

```bash
# 環境確認
pwd
git branch
git pull origin main

# ビルド状態確認
npm run build
npx tsc --noEmit

# データベース状態確認
node -e "
const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.users.count(),
  p.projects.count(),
  p.tasks.count(),
  p.appointments.count(),
  p.knowledge_items.count()
]).then(r => console.log('DB統計:', r)).finally(() => p.$disconnect())"

# AI使用量確認（Phase 7以降）
curl http://localhost:3000/api/admin/ai-usage | jq '.today'
```

### **2. 実装作業**

```javascript
// TodoWrite活用例
{
  "todos": [
    {
      "id": "daily_01",
      "content": "現在の実装箇所の動作確認",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "id": "daily_02",
      "content": "新機能の実装",
      "status": "pending",
      "priority": "high"
    },
    {
      "id": "daily_03",
      "content": "テスト・動作確認",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

### **3. 実装時の確認事項**

```bash
# TypeScriptエラーチェック（常時）
npx tsc --noEmit --watch

# 開発サーバー起動
npm run dev

# ログ監視
tail -f .next/server/app/api/*
```

### **4. コミット前チェック**

```bash
# 1. TypeScriptエラー確認
npx tsc --noEmit

# 2. ビルド確認
npm run build

# 3. 既存機能の動作確認
curl http://localhost:3000/api/tasks
curl http://localhost:3000/api/projects
curl http://localhost:3000/api/users

# 4. 新機能の動作確認
# Phase別のテストコマンド実行

# 5. コミット
git add .
git status
git commit -m "適切なコミットメッセージ"
```

---

## 🚨 トラブルシューティング

### **よくある問題と対処法**

#### **1. TypeScriptエラー**

```bash
# エラー詳細確認
npx tsc --noEmit | head -20

# 型定義再生成
npx prisma generate
```

#### **2. ビルドエラー**

```bash
# キャッシュクリア
rm -rf .next
npm run build
```

#### **3. AI API エラー**

```bash
# レート制限確認
curl http://localhost:3000/api/admin/ai-usage

# キャッシュ状態確認
curl http://localhost:3000/api/admin/cache-stats
```

#### **4. データベースエラー**

```bash
# スキーマ同期
npx prisma db push

# マイグレーションリセット（開発環境のみ）
npx prisma migrate reset
```

---

## 📊 品質管理チェックリスト

### **実装完了基準**

- [ ] TypeScriptエラー: 0件
- [ ] ESLintエラー: 0件（警告は許容）
- [ ] ビルド成功
- [ ] 既存機能への影響なし
- [ ] 新機能の動作確認完了
- [ ] ドキュメント更新

### **コードレビューポイント**

1. **AI呼び出し**
   - AI Call Manager経由か
   - エラーハンドリング実装
   - キャッシュ考慮

2. **データベース操作**
   - Prisma ORM使用
   - トランザクション考慮
   - N+1問題回避

3. **UI/UX**
   - レスポンシブ対応
   - ローディング状態
   - エラー表示

---

## 📚 参考資料

- [Claude Code開発手法論](./CLAUDE_CODE_DEVELOPMENT_METHODOLOGY.md)
- [統合実装計画書](./INTEGRATED_IMPLEMENTATION_PLAN.md)
- [データベース操作ナレッジ](./DATABASE_OPERATIONS_KNOWLEDGE.md)
- [実装インデックス](./MASTER_IMPLEMENTATION_INDEX.md)

---

**このガイドに従って開発を進めることで、品質を保ちながら効率的に Phase 7-10 の実装を完了できます。**
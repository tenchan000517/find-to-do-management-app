# 🤖 Claude開発ナレッジベース

このファイルは、Claude Code（AI）が開発作業を効率的に進めるためのナレッジベースです。

---

## ⚠️ **重要な作業前チェック**

### **🔥 必須: Next.jsプロセス終了**
**作業報告・コミット・ビルド前に必ず実行:**

```bash
# 既存Next.jsプロセスを確認
ps aux | grep next | grep -v grep

# 強制終了（PIDを確認して実行）
kill -9 <PID1> <PID2> <PID3> <PID4>

# または一括終了
pkill -f "next dev"
```

**理由**: 
- 既存のNext.jsプロセスが残っていると新しい`npm run dev`が無限ループで読み込み中になる
- `next-server`プロセスが残り続けてコンパイルが進まない

---

## 🛠️ **開発環境設定**

### **データベース接続**
```bash
DATABASE_URL="postgres://neondb_owner:npg_VKJPW8pIfQq0@ep-calm-butterfly-a55pupnn-pooler.us-east-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"
```

### **API Keys**
```bash
GEMINI_API_KEY="AIzaSyB2fqjY3f78rr4rmB0oqTc5FMn8lx-79mY"
LINE_CHANNEL_SECRET="723ccdd34f2c47cf2f7412f1e5e5c22b"
LINE_CHANNEL_ACCESS_TOKEN="aI0oSLTslmGdjPXBZWuCtYxdyg+cUvpGY+7ZBAYMTzDyPUEUKChMDOEMIx7aQZlTKrgWwFjmIfWgB888ocB1roIrF96PJk4ekdFhT/QuZZF4hIFu3+XarkdcjhYUgawaqmBc41prRCgV0fK7jq/m5wdB04t89/1O/w1cDnyilFU="
```

---

## 📊 **プロジェクト状況**

### **現在のPhase**: Phase 16完了 + 担当者システム完全実装完了（Phase 1+2）+ LINE修正UI完了 + カレンダー統合修正完了 + LINEボットリファクタリングPhase 2完了 + LINEボット担当者表示問題修正完了
- **🎯 担当者システム完全実装完了**: 「作成者中心」→「担当者中心」設計の完全移行完了
- **📱 LINE修正UI完全実装完了**: modify_field_*ハンドラー・担当者選択UI・保存機能完成
- **🔧 Phase 2フロントエンド完了**: 14ファイル横断更新・UI統一・カンバンD&D実装
- **⚡ 型安全性向上**: CalendarEvent型統一・null/undefined整合性確保
- **AI要約生成システム根本原因解決完了**
- **API制限エラー対策**: Gemini API最適化実装
- **LINEボット重複コード解消・リファクタリング完了**: notification.ts分割・責任分離実装
- **🚀 LINEボット担当者表示問題修正完了**: assigneeリレーション→assignedToフィールド統一・フィルタリング機能修正

### **🎉 最新完了状況（2025-06-19 18:40）**

#### **✅ LINEボット担当者表示問題修正完了！**
- **問題解決**: LINEボット作成アポイントメントの担当者が表示されない問題を根本解決
- **データ統一**: assigneeリレーション → assignedToフィールドに完全統一
- **表示改善**: 担当者表示をカラーラベル（氏名のみ）形式に統一
- **フィルタリング修正**: ユーザーフィルタでassignedToフィールド使用・カンバンAPIでuserIdパラメータ実装
- **データ整合性**: prisma-service.tsでassignedToId値の正確な設定・API応答の統一

### **📅 以前の完了状況（2025-06-19 08:56）**

#### **✅ LINEボットリファクタリング Phase 2完了！**
- **巨大ファイル分割**: notification.ts (2,055行) → 4ファイル分割 (95%削減)
- **責任分離実装**: line-sender.ts・line-messages.ts・line-flex-ui.ts・line-menu.ts
- **保守性向上**: 単一責任原則・依存関係整理・テスト容易性確保
- **後方互換性**: 既存route.ts修正不要・全エクスポート関数利用可能
- **品質確認**: ビルド成功・型エラー修正済み

### **📅 以前の完了状況（2025-06-18 01:15）**

#### **✅ カレンダー統合修正完了！**
- **UTC/JST問題解決**: 全カレンダー表示をJST基準に統一
- **統合API切り替え**: `/api/calendar/unified`使用でタスク・アポ・個人予定表示
- **データ表示改善**: タスク期限（📋）・アポイントメント（🤝）の自動反映
- **型安全性確保**: UnifiedCalendarEvent型定義追加

### **📅 以前の完了状況（2025-06-17 23:00）**

#### **✅ LINE修正UI完全実装完了！**
- **修正UIカルーセル**: 2画面統合・種類選択統合・保存フロー最適化済み
- **データ優先順位**: セッション上書き・DB保存データフォールバック実装済み
- **全フロー完成**: 分類確認→🔧修正→修正UIカルーセル→保存
- **保存忘れ防止**: 保存ボタンを1画面目に移動

#### **📱 実装済みLINE修正UIフロー**
```
1. AI分析 → 分類確認（✅正しい / 🔧修正）
2. 🔧修正 → 修正UIカルーセル:
   • 📝基本情報編集: 🔄種類選択・📋タイトル・📝説明・🎯優先度・👤担当者・💾保存・❌キャンセル
   • 🕒日時・場所編集: 📅日時・📍場所・⏰期限・⏱️工数
3. 保存 → 完了
```

#### **🔧 テスト手順（完成版）**
```bash
1. LINEで「明日14時に資料作成」送信
2. 分類確認で🔧修正クリック
3. 修正UIカルーセルで🔄種類選択
4. 📅予定に変更
5. 保存確認 → 完了！
```

#### **🎯 担当者システム完全実装完了状況**

**✅ Phase 1完了項目:**
- **データベース設計**: 全エンティティに`createdBy`/`assignedTo`フィールド実装
- **型定義更新**: TypeScript型に担当者システム反映
- **API保存処理**: 作成時に担当者自動設定（デフォルト：作成者）
- **LINE統合完了**: 
  - modify_field_*イベントハンドラー実装
  - 担当者選択UI（縦1列・最大5名・間隔付き）
  - confirm_save_*ハンドラー実装
  - Foreign key制約修正（user_プレフィックス対応）
- **動作検証完了**: LINE担当者選択 → DB保存 → 反映確認

**✅ Phase 2完了項目（NEW 2025-06-17）:**
- **フロントエンド完全移行**: 作成者中心→担当者中心設計への100%移行達成
- **UI統一実装**: 14ファイル横断更新（TaskModal, ProjectDetailModal, AppointmentModal, ConnectionModal, KnowledgeModal, TaskList, ProjectsTable, Dashboard, CalendarEventCard, UserKanbanBoard等）
- **カンバンシステム**: UserKanbanBoard ドラッグ&ドロップ担当者変更機能実装
- **アバター表示統一**: 色付き円+名前頭文字パターン全コンポーネント採用
- **型安全性向上**: CalendarEvent型定義統一・null/undefined型整合性確保
- **後方互換性完全維持**: 既存データ完全サポート・段階的移行対応
- **実装統計**: 14ファイル変更・+411行追加・-135行削除・正味+276行増加

**📋 担当者概念マッピング完成:**
- **Task**: タスク担当者（担当者）
- **Project**: プロジェクトマネージャー（PMマネージャー）
- **CalendarEvent**: イベント責任者（イベント責任者）- パブリック可能
- **Connection**: 関係構築担当者（関係構築担当者）- オプショナル
- **Appointment**: 営業担当者（営業担当者）
- **KnowledgeItem**: ナレッジ管理者（管理者）- オプショナル・作成者表示併存
- **PersonalSchedule**: 所有者固定（担当者概念なし）

**🔄 移行戦略完了:**
- ✅ Legacy フィールド保持で後方互換性確保
- ✅ 新規作成時は担当者システム使用
- ✅ 既存データ移行スクリプト準備済み
- ✅ UI全面対応完了
- ✅ 技術パターン統一：担当者優先フォールバック（assignedTo → userId → user）

**🎉 担当者システム完成！**
全てのUI/UXで担当者中心の体験が可能になりました。

### **システム規模**
- **20テーブル**: 完全実装
- **34API**: 全CRUD + AI機能
- **API最適化**: 10回/doc → 3回/doc
- **処理能力**: 5ドキュメント/分対応

---

## 🔧 **よく使うコマンド**

### **ビルド・型チェック**
```bash
npm run build
npm run typecheck
npm run lint
```

### **データベース確認**
```bash
# 要約生成状況確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.ai_content_analysis.aggregate({_count: {_all: true}, where: {summary: {not: {in: ['', '要約未生成', '要約を生成できませんでした']}}}}).then(r => console.log(\`要約生成済み: \${r._count._all}件\`)).finally(() => p.\$disconnect());"

# 最新データ確認  
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.ai_content_analysis.findMany({take: 3, orderBy: {createdAt: 'desc'}, select: {title: true, summary: true}}).then(r => r.forEach((x,i) => console.log(\`\${i+1}. \${x.title}: \${x.summary.substring(0,50)}...\`))).finally(() => p.\$disconnect());"
```

### **Git操作**
```bash
git status
git add .
git commit -m "commit message"
git push
```

---

## 🚨 **トラブルシューティング**

### **Next.js起動しない**
1. **既存プロセス確認**: `ps aux | grep next`
2. **強制終了**: `kill -9 <PID>`
3. **再起動**: `npm run dev`

### **型エラー**
```bash
npm run typecheck
```

### **ビルドエラー**
```bash
npm run build
```

---

## 📝 **最新の技術実装**

### **LINEボット担当者表示問題修正 (2025-06-19)**
- **データモデル統一**: assigneeリレーション → assignedToフィールド完全移行
- **API修正**: カンバンAPIでuserIdパラメータによるフィルタリング実装
- **フロントエンド統一**: リスト・カンバン表示で担当者をカラーラベル形式に統一
- **データ整合性確保**: prisma-service.tsでassignedToId値の正確なマッピング実装

### **Phase 16: AI要約生成システム最適化**
- **統合エンティティ抽出**: セクション別→統合処理でAPI呼び出し70%削減
- **API遅延制御**: 2-3秒間隔でGemini API Rate Limit対策
- **短文閾値拡大**: 500→800文字で原文保存を促進
- **デバッグログ強化**: Gemini AIレスポンス詳細追跡

### **根本原因解決**
1. **Rate Limit対策**: 15回/分制限 → 5ドキュメント/分処理可能
2. **短いコンテンツ修正**: createEmptyResultWithOriginalContent実装
3. **失敗データ対応**: 19件の要約失敗タブメタデータ削除
4. **API効率化**: 10回/doc → 3回/doc（セクション分割+統合抽出+要約生成）

### **改良されたフロー**
1. **Webhookフロー**: Google Docsタイトル直接使用
2. **統合処理**: 全セクション一括エンティティ抽出
3. **スロットリング**: API呼び出し間遅延制御

---

### **🛠️ 緊急実装手順（Phase A）**

#### **1. Redis環境準備**
```bash
# Docker ComposeにRedis追加
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

# 環境変数追加
REDIS_URL="redis://localhost:6379"
```

#### **2. セッション管理Redis移行**
```typescript
// src/lib/line/session-manager.ts 改修
import Redis from 'ioredis';

class RedisSessionManager {
  private redis = new Redis(process.env.REDIS_URL);
  
  async startSession(userId: string, groupId: string, type: string) {
    const sessionKey = `session:${userId}:${groupId}`;
    const session = { userId, groupId, type, startTime: Date.now() };
    await this.redis.setex(sessionKey, 1800, JSON.stringify(session)); // 30分
  }
}
```

#### **3. 署名検証有効化**
```typescript
// src/app/api/webhook/line/route.ts
// コメントアウトを解除
if (!signature || !validateSignature(body, signature)) {
  console.error('Invalid signature');
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
// console.log('*** SIGNATURE VALIDATION DISABLED FOR TESTING ***'); // 削除
```

#### **4. 自動ユーザー登録**
```typescript
// 初回メッセージ検知でユーザー作成
async function handleFirstTimeUser(lineUserId: string, displayName: string) {
  const existingUser = await prisma.users.findFirst({
    where: { lineUserId }
  });
  
  if (!existingUser) {
    return await prisma.users.create({
      data: {
        lineUserId,
        name: displayName,
        email: `${lineUserId}@line.temp`,
        role: 'member', // デフォルト役割
        createdAt: new Date()
      }
    });
  }
  return existingUser;
}
```

---

---

## 📋 **ドキュメント管理ルール**

### **課題・ISSUE管理の役割分離**

#### **アクティブ開発課題** (`docs/active/current/`)
- **用途**: 当日〜数日以内に実装予定の課題
- **内容**: 詳細仕様・具体的実装方法・コード例
- **ファイル**: `ACTIVE_TASKS_2025-06-19.md`
- **特徴**: 即座に取り掛かれる状態のタスク

#### **システム全体課題** (`docs/core/`)
- **用途**: 長期的なシステム改善・技術課題
- **内容**: 概要レベルの機能説明・技術要件
- **ファイル**: `CURRENT_ISSUES_AND_IMPROVEMENTS.md`
- **特徴**: 将来実装予定の大型機能・研究課題

#### **管理方針**
- ✅ **重複回避**: 同じ課題は両方に記載しない
- ✅ **移動管理**: アクティブ→コア、コア→アクティブの移動ルール明確化
- ✅ **更新責任**: アクティブは頻繁更新、コアは安定管理
- ✅ **詳細度**: アクティブは実装詳細、コアは概要・方針

---

## 📚 **関連ドキュメント**

### **担当者システム**
- `/docs/ASSIGNEE_SYSTEM_CORE_GUIDANCE.md`: 担当者システム完全ガイド
- `/migrate-to-assignee-system.sql`: データ移行スクリプト
- `/src/lib/types.ts`: 担当者対応型定義

### **LINE統合**
- `/src/app/api/webhook/line/route.ts`: 担当者対応Webhookハンドラー
- `/src/lib/line/notification.ts`: 担当者選択UI実装
- `/src/lib/line/assignee-resolver.ts`: 担当者検索・解決システム

---

*最終更新: 2025-06-19 18:40*  
*重要更新: LINEボット担当者表示問題修正完了・assigneeリレーション→assignedToフィールド統一*  
*次回更新: 次期フェーズ開始時または重要アーキテクチャ変更時*
# 🎯 FIND to DO システム - マスター開発プロンプト

**作成日**: 2025-06-16  
**最終更新**: 2025-06-17 21:30  
**対象**: すべての開発者・エンジニア（人間・AI・Claude Code）  
**目的**: **このドキュメント一つで全員が同じように開発を始められる統一プロンプト**

---

## 🚀 **開発開始手順（必須）**

### **📌 Step 1: 現在の状態確認とコミット**
```bash
# 必須: 作業前の状態保存
git status
git add .
git commit -m "作業開始前の状態保存: $(date +'%Y-%m-%d %H:%M')"

# Next.jsプロセスクリーンアップ
pkill -f "next dev"
```

### **📌 Step 2: 必須ドキュメントの確認**

#### **開発タイプ別の読むべきドキュメント**

| 開発タイプ | 必須ドキュメント | 読む順番 |
|-----------|-----------------|----------|
| **LINE改修（最優先）** | 1. このドキュメント全体<br>2. [`LINE_REGISTRATION_SYSTEM_COMPLETE_ANALYSIS_AND_IMPROVEMENT_PLAN.md`](../LINE_REGISTRATION_SYSTEM_COMPLETE_ANALYSIS_AND_IMPROVEMENT_PLAN.md)<br>3. [`DEVELOPER_REFERENCE_INDEX.md`](../reference/DEVELOPER_REFERENCE_INDEX.md) | 上から順に |
| **新機能開発** | 1. このドキュメント全体<br>2. [`UNIVERSAL_DEVELOPMENT_GUIDE.md`](./UNIVERSAL_DEVELOPMENT_GUIDE.md)<br>3. [`DEVELOPER_REFERENCE_INDEX.md`](../reference/DEVELOPER_REFERENCE_INDEX.md) | 上から順に |
| **UI/UX改善** | 1. このドキュメント全体<br>2. [`UI_UX_DESIGN_GUIDELINES.md`](./UI_UX_DESIGN_GUIDELINES.md)<br>3. [`UI_COMPONENT_IMPLEMENTATION_PLAN.md`](../UI_COMPONENT_IMPLEMENTATION_PLAN.md) | 上から順に |
| **バグ修正** | 1. このドキュメントの基本仕様<br>2. [`DEVELOPER_REFERENCE_INDEX.md`](../reference/DEVELOPER_REFERENCE_INDEX.md)<br>3. [`UNIVERSAL_DEVELOPMENT_KNOWLEDGE_BASE.md`](../reference/UNIVERSAL_DEVELOPMENT_KNOWLEDGE_BASE.md) | 該当箇所のみ |
| **カレンダー機能** | 1. このドキュメント全体<br>2. [`CALENDAR_FEATURE_MASTER_DESIGN.md`](../reference/CALENDAR_FEATURE_MASTER_DESIGN.md) | 上から順に |

### **📌 Step 3: 開発環境の準備**
```bash
# 品質チェック（エラーがあれば解消してから開始）
npx tsc --noEmit
npm run lint         # ESLintエラー: 0件必須
npm run build        # ビルド成功必須

# データベース状態確認
npx prisma generate  # 型定義の同期
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.tasks.count(), p.projects.count(), p.users.count()]).then(([tasks, projects, users]) => console.log(\`Data: Tasks(\${tasks}), Projects(\${projects}), Users(\${users})\`)).finally(() => p.\$disconnect());"
```

### **📌 Step 4: 作業開始の宣言**
```bash
# 開発サーバー起動
npm run dev

# 作業内容の明確化（例）
echo "作業開始: [機能名/修正内容]"
echo "予定時間: [X時間]"
echo "完了条件: [具体的な完了条件]"
```

---

## 🏛️ **システム基本仕様（絶対変更禁止）**

### **アーキテクチャ**
```
Google Docs → GAS Webhook → Next.js API → AI Processing → PostgreSQL
     ↓                           ↓              ↓
 LINE Bot ←→ Session Management ←→ Business Logic
```

### **技術スタック**
| 層 | 技術 | バージョン | 変更可否 |
|----|------|------------|----------|
| **Frontend** | Next.js + TypeScript + Tailwind | 15.x | ❌ 変更禁止 |
| **Backend** | Next.js API Routes + TypeScript | 15.x | ❌ 変更禁止 |
| **Database** | PostgreSQL + Prisma ORM | Latest | ❌ 変更禁止 |
| **AI** | Google Gemini API | 2.0-flash | ⚠️ 使用量注意 |
| **External** | LINE Bot, GAS, Discord Bot | - | ✅ 拡張可能 |

### **環境設定（機密情報）**
```bash
DATABASE_URL="postgres://neondb_owner:npg_VKJPW8pIfQq0@ep-calm-butterfly-a55pupnn-pooler.us-east-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"
GEMINI_API_KEY="AIzaSyB2fqjY3f78rr4rmB0oqTc5FMn8lx-79mY"
LINE_CHANNEL_SECRET="723ccdd34f2c47cf2f7412f1e5e5c22b"
LINE_CHANNEL_ACCESS_TOKEN="aI0oSLTslmGdjPXBZWuCtYxdyg+cUvpGY+7ZBAYMTzDyPUEUKChMDOEMIx7aQZlTKrgWwFjmIfWgB888ocB1roIrF96PJk4ekdFhT/QuZZF4hIFu3+XarkdcjhYUgawaqmBc41prRCgV0fK7jq/m5wdB04t89/1O/w1cDnyilFU="
```

---

## 📊 **現在のシステム実装状況**

### **✅ 完全実装済み（変更・追加実装禁止）**

#### **データベース設計（20テーブル + 担当者システム）**
| テーブル名 | 用途 | レコード数 | 担当者システム | 状態 |
|-----------|------|------------|---------------|------|
| `users` | ユーザー管理 | 5名 | ✅完成 | ✅完成 |
| `projects` | プロジェクト管理 | 16件 | ✅完成 | ✅完成 |
| `tasks` | タスク管理 | 65件 | ✅完成 | ✅完成 |
| `appointments` | アポ管理 | 10件 | ✅完成 | ✅完成 |
| `connections` | 人脈管理 | 45件 | ✅完成 | ✅完成 |
| `ai_content_analysis` | AI要約データ | 65件 | ✅完成 | ✅完成 |
| `google_docs_sources` | GAS統合 | 66タブ | - | ✅完成 |
| `calendar_events` | カレンダー基本 | 76件 | ✅完成 | 🔄部分実装 |
| `knowledge_items` | ナレッジ管理 | 10件 | ✅完成 | ✅完成 |

#### **API実装（40エンドポイント）**
| カテゴリ | エンドポイント | 機能 | 状態 |
|----------|----------------|------|------|
| **基本CRUD** | `/api/tasks`, `/api/projects`, `/api/users` | 基本データ操作 | ✅完成 |
| **担当者管理** | `/api/tasks/[id]/assignee`, `/api/projects/[id]/assignee` | 担当者変更・取得 | ✅完成 |
| **AI統合** | `/api/ai/evaluate`, `/api/ai-content-analysis` | AI分析・評価 | ✅完成 |
| **外部連携** | `/api/webhook/line`, `/api/webhook/google-docs-gas` | LINE・GAS統合 | ✅完成 |
| **高度機能** | `/api/projects/promotion-candidates` | 自動昇格判定 | ✅完成 |

#### **担当者システム（2025-06-17完成）**
- **全エンティティ対応**: 7テーブル・219件データに担当者フィールド追加
- **作成者・担当者分離**: createdBy/assignedToフィールドで責任明確化
- **チーム協働実現**: マネージャーによる部下への割り当て可能
- **後方互換性保持**: 既存APIと並行動作・段階的移行対応

#### **AI機能（Gemini統合完成）**
- **要約生成システム**: Google Docs → AI要約 → DB保存（Phase 16完了）
- **統合エンティティ抽出**: API呼び出し70%削減最適化済み
- **プロジェクト評価**: 成功確率・リソース・ISSUE度自動評価
- **スロットリング制御**: API制限対策（15回/分 → 5ドキュメント/分処理）

### **🔄 部分実装（拡張実装対象）**

#### **カレンダー機能（30%実装済み）**
| Phase | 機能 | 実装状況 | 設計書 |
|-------|------|----------|--------|
| Phase 1-2 | 基本UI・データ表示 | ✅完成 | [`CALENDAR_FEATURE_MASTER_DESIGN.md`](./CALENDAR_FEATURE_MASTER_DESIGN.md) |
| Phase 3 | 色分けタブシステム | ❌未実装 | 詳細設計完備 |
| Phase 4 | 繰り返し予定 | ❌未実装 | 詳細設計完備 |
| Phase 5-10 | AI統合・チーム機能 | ❌未実装 | 詳細設計完備 |

#### **認証・権限システム（0%実装）**
- NextAuth.js導入予定
- ユーザー権限管理
- セッション管理

### **❌ 完全未実装（新規実装対象）**
1. **ナレッジ管理システム高度化**
2. **チーム機能・権限管理**
3. **統合ダッシュボード強化**
4. **外部API拡張（Google Calendar、Outlook）**

---

## 🚨 **絶対遵守ルール（システム破壊防止）**

### **❌ 絶対禁止事項**

#### **データベース関連**
```sql
-- 絶対禁止：既存テーブル・列の削除
DROP TABLE tasks;
ALTER TABLE users DROP COLUMN email;

-- 絶対禁止：既存データの一括削除
DELETE FROM users WHERE id > 0;
```

#### **API関連**
```typescript
// 絶対禁止：既存APIの破壊的変更
export async function GET() {
  // レスポンス形式変更禁止
  return { completely_different_format: "breaks_ui" };
}

// 絶対禁止：既存エンドポイントの削除
```

#### **依存関係関連**
```bash
# 絶対禁止：メジャーバージョン変更
npm install next@14  # Next.js 15 → 14 にダウングレード
npm install typescript@4  # TypeScript 5 → 4
```

### **✅ 安全な実装パターン**

#### **データベース拡張**
```sql
-- 安全：新規テーブル追加
CREATE TABLE new_feature_table (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 安全：列追加（DEFAULT値必須）
ALTER TABLE users ADD COLUMN new_field JSON DEFAULT '{}';
```

#### **API拡張**
```typescript
// 安全：新規エンドポイント
// src/app/api/new-feature/route.ts
export async function GET() {
  // 新機能の実装
}

// 安全：既存APIの後方互換拡張
export async function GET() {
  const data = await existingLogic();
  return NextResponse.json({
    ...data,  // 既存データ保持
    newField: newData  // 新機能追加
  });
}
```

---

## 🎯 **開発優先順位と戦略**

### **✅ 完了済み: 担当者システム改修（2025-06-17）**
1. **全エンティティ担当者システム実装完了**
   - 7テーブル・219件データの安全な移行完了
   - 6つの新API（担当者変更・取得）実装
   - 真のチーム協働ツール実現
   - 後方互換性100%保持

### **✅ 完了：カレンダー統合修正（2025-06-18 01:10）**

#### **解決済み技術課題**
- **UTC/JST混在問題**: カレンダー全体をJST基準に統一
- **統合API実装**: `/api/calendar/unified`でタスク・アポ・個人予定・イベント一元管理
- **データ表示改善**: タスク期限（📋）・アポイントメント（🤝）の自動カレンダー反映

### **🔄 進行中：LINE登録シーケンス改善（2025-06-17 19:10現在）**

#### **✅ 基盤実装完了項目**
- **メニューセッション管理**: 2分タイムアウト・セッション終了ボタン
- **個人予定登録**: personal_schedule複合タイプ対応
- **Postback解析修正**: 複合タイプ名の正確な分割処理
- **replyToken問題解決**: LINE APIエラー400解消

#### **🔄 現在改善中の技術課題**

##### **複合タイプPostback解析**
```typescript
// 修正済み: add_field_personal_schedule_datetime
const parts = data.split('_');
const fieldKey = parts[parts.length - 1]; // 'datetime'
const type = parts.slice(2, -1).join('_'); // 'personal_schedule'
```

##### **LINE API制限対策**
- **replyToken有効期限**: setTimeout削除・pushMessage併用
- **Flexメッセージ400エラー**: テキストメニューフォールバック実装

#### **📋 次エンジニア継続タスク**

##### **P1: 登録テスト継続**
1. **他エンティティ検証**: task/project/appointment/contact登録テスト
2. **postback解析**: 同様の複合タイプ名問題の修正適用
3. **エラーハンドリング**: 各エンティティでのLINE API制限対策

##### **P2: UIボタン最適化**
- Flexメッセージ vs テキストメニューの使い分け基準確立
- 担当者選択UIの改善
- 項目選択フローの最適化

#### **💡 現在の利用方法**
```
1. 「メニュー」送信 → メニューUI表示
2. 「📅 個人予定」選択 → personal_scheduleモード
3. 「明日14時に歯医者」送信 → AI解析・保存
4. 「📝 詳細入力」→ 「📅 日時」選択 → 項目別追加入力
5. 「💾 保存」で完了
```

#### **🚨 解決された技術問題**
- **400エラー**: LINE replyToken有効期限問題 → pushMessage併用で解決
- **postback解析エラー**: 複合タイプ名分割処理 → 正確な解析ロジック実装

#### **Phase C: UI/UX担当者システム実装** 🟡重要
**期間**: 3-5日  
**前提**: Phase A・B完了後実施

1. **基本コンポーネント実装**
   - `components/assignee/AssigneeSelector.tsx`
   - `components/assignee/AssigneeDisplay.tsx`
   - 担当者変更ボタン・ドロップダウン

2. **既存コンポーネント改修**
   - `KanbanBoard.tsx` - 担当者フィルター統合
   - `TaskCard.tsx` - 作成者・担当者分離表示
   - `Dashboard.tsx` - 担当者別集計機能

3. **カンバンボード統合**
   - ドラッグ&ドロップ + 担当者変更統合
   - バルク操作（複数タスク一括変更）

**詳細計画**: 
- [`ASSIGNEE_SYSTEM_REDESIGN_PROPOSAL.md`](../ASSIGNEE_SYSTEM_REDESIGN_PROPOSAL.md)

### **優先度2：LINE改修完了後実装**
1. **UI/UX担当者システム実装（Phase C）**
   - 担当者コンポーネント・カンバンボード統合
   - 実装期間：3-5日
   - 前提：LINE Phase A・B完了

2. **UI/UXデザイン統一 Phase 1**
   - Lucide React導入・絵文字置き換え（11ファイル）
   - 共通Button・Modal・Cardコンポーネント作成
   - 設計書完備：[`UI_UX_DESIGN_GUIDELINES.md`](./UI_UX_DESIGN_GUIDELINES.md)
   - 実装期間：1週間

### **優先度3：今月完了**
1. **カレンダー機能完全実装**
   - Phase 3-6：色分けタブ・繰り返し予定・データ統合
   - 設計書完備済み：466行の詳細仕様
   - 実装期間：1-2週間

2. **認証システム導入**
   - NextAuth.js統合
   - 実装期間：3-5日

### **優先度4：長期計画**
1. **ナレッジ管理システム強化**
2. **チーム機能・権限管理**
3. **外部API拡張（Google Calendar、Outlook）**

---

## 🛠️ **開発実行ガイド**

### **新機能開発時の必須手順**

#### **Step 1: 設計確認**
1. 該当機能の設計書確認（`docs/`内）
2. 既存実装の重複チェック
3. データベーススキーマ影響確認

#### **Step 2: 実装**
```bash
# 1. データベース変更時
npx prisma generate
npx prisma db push
npm run typecheck

# 2. API実装時
# src/app/api/[new-endpoint]/route.ts作成
npm run typecheck

# 3. フロントエンド実装時
# コンポーネント・Hook作成
npm run lint
npm run build
```

#### **Step 3: 品質確保**
```bash
# 必須チェック
npm run typecheck  # 型エラー：0件
npm run lint       # ESLintエラー：0件
npm run build      # ビルド成功

# データ整合性確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.[新テーブル].count().then(count => console.log(\`Count: \${count}\`)).finally(() => p.\$disconnect());"
```

### **よく使う確認コマンド**
```bash
# システム状態確認
git status
ps aux | grep next | grep -v grep

# データベース確認
npx prisma studio  # GUI管理画面
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.tasks.count(), p.projects.count()]).then(([tasks, projects]) => console.log(\`Tasks: \${tasks}, Projects: \${projects}\`)).finally(() => p.\$disconnect());"

# AI要約生成状況確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.ai_content_analysis.aggregate({_count: {_all: true}, where: {summary: {not: {in: ['', '要約未生成', '要約を生成できませんでした']}}}}).then(r => console.log(\`要約生成済み: \${r._count._all}件\`)).finally(() => p.\$disconnect());"
```

---

## 💡 **実装のコツ・ベストプラクティス**

### **型安全性の活用**
```typescript
// ✅ Good: 厳密な型定義
interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

// ❌ Bad: any型使用
function createTask(data: any) { ... }
```

### **エラーハンドリング**
```typescript
// ✅ Good: 適切なエラーハンドリング
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const result = await prisma.tasks.create({ data });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { error: 'タスク作成に失敗しました' },
      { status: 500 }
    );
  }
}
```

### **Prisma操作最適化**
```typescript
// ✅ Good: 関連データ取得最適化
const tasks = await prisma.tasks.findMany({
  include: {
    project: {
      select: { title: true, status: true }
    },
    assignee: {
      select: { name: true, email: true }
    }
  }
});

// ❌ Bad: N+1問題発生
const tasks = await prisma.tasks.findMany();
for (const task of tasks) {
  const project = await prisma.projects.findUnique({...});
}
```

---

## 📚 **重要な参考情報**

### **外部API制限・注意事項**
| API | 制限 | 対策 |
|-----|------|------|
| **Gemini API** | 15回/分 | スロットリング実装済み |
| **LINE Messaging** | 1000回/月 | 使用量監視 |
| **Neon Database** | 接続数制限 | Connection pooling |

### **パフォーマンス指標**
- TypeScript型エラー：**0件維持**
- ビルド時間：**<30秒**
- API応答時間：**<500ms**
- データベースクエリ：**<100ms**

### **セキュリティ要件**
- 機密情報のコミット禁止
- API Keyの環境変数管理
- ユーザー入力のサニタイズ
- SQLインジェクション対策（Prisma使用）

---

## 🚀 **成功のための心構え**

### **開発哲学**
1. **品質第一**: 動くコードよりも保守可能なコード
2. **段階的実装**: 小さな単位での確実な実装
3. **文書化重視**: 未来の自分・他者への配慮
4. **一貫性保持**: 既存パターンの踏襲
5. **UI/UX統一**: デザインガイドライン100%遵守

### **効率化のポイント**
- **重複実装の回避**: 既存機能の再利用
- **型システム活用**: TypeScriptの恩恵最大化
- **テスト駆動**: 実装前のテストケース検討
- **継続的リファクタリング**: 品質の継続的向上

---

## 🔄 **継続的改善**

### **このプロンプトの更新ルール**
1. **新機能実装完了時**: 実装状況セクション更新
2. **新しいベストプラクティス発見時**: 該当セクション追加
3. **問題・トラブル発生時**: 禁止事項・対策に追加
4. **技術スタック変更時**: 基本仕様セクション更新

### **品質保証の継続**
- 開発完了時の品質チェックリスト実行
- 定期的なドキュメント整合性確認
- 新規参加者向けのオンボーディング改善

---

**このプロンプトに従うことで、誰でも高品質で一貫性のある開発を実現できます。**

---

## 🏁 **開発完了時の手順（必須）**

### **📌 Step 1: 品質確認**
```bash
# 必須: すべてエラー0件
npm run typecheck
npm run lint
npm run build

# Next.jsプロセス停止
pkill -f "next dev"
```

### **📌 Step 2: ドキュメント更新**
- [ ] 実装内容に応じた技術ドキュメント更新
- [ ] 新しいコンポーネント・APIの追加
- [ ] トラブルシューティング事例の記録

### **📌 Step 3: コミット・引き継ぎ**
```bash
# 変更内容確認
git status
git diff

# 意味のあるコミットメッセージ
git commit -m "[機能名] 実装完了: [具体的な変更内容]

- [変更点1]
- [変更点2] 
- TypeScript型エラー: 0件
- ビルドテスト: 成功"

# 引き継ぎメモ作成（次の開発者向け）
echo "完了: [機能名]"
echo "次のタスク: [推奨される次の作業]"
echo "注意事項: [あれば記載]"
```

---

## 📋 **Claude Code向け指示**

**あなたがこのドキュメントを読んでいる場合：**

1. **まず上記のStep 1-4を実行してください**
2. **開発タイプに応じて必須ドキュメントを読んでください**
3. **「何をしましょう？」と聞く前に、必要な情報収集を完了してください**
4. **UI/UX関連の作業では必ずデザインガイドラインを確認してください**

これにより、あなたが「何をしましょう？」と聞いた時には、すでに：
- ✅ 現在の状態を把握済み
- ✅ 必要なドキュメントを読了済み
- ✅ 開発環境の準備完了済み
- ✅ 作業内容が明確化済み

の状態になっています。

---

*最終更新: 2025-06-18 01:15*  
*重要更新: カレンダー統合修正完了・JST統一・タスク/アポ表示実装*  
*次回更新: LINE冗長性リファクタリング完了時*
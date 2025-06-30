# Claude 開発一貫性ルール（Enhanced Version）

## 🎯 このドキュメントの目的

このルールは**リフレッシュ後のClaude Codeでも完全に同じ開発体験**を実現するために設計されています。コンテキストコンパクトによる微細なギャップを排除し、常に一貫した開発フローを保証します。

---

## 🚫 絶対禁止事項

### **サーバー操作**
```bash
# 以下のコマンドは絶対に実行しない
npm run dev
yarn dev
next dev
npm start
yarn start

# 理由: ユーザー側で既にサーバーが実行されている可能性
```

### **自動的なファイル作成**
```markdown
❌ README.md の自動生成
❌ documentation ファイルの推測作成
❌ 「必要そう」な設定ファイルの作成
❌ package.json の依存関係追加（明示指示なし）

✅ 明示的に要求されたファイルのみ作成
✅ 既存ファイルの編集を最優先
```

---

## 📁 ディレクトリ・ファイル構造ルール

### **ディレクトリ作成の統一ルール**

#### 1. プロジェクトドキュメント配置
```
/docs/                          # プロジェクト文書の集約
  ├── ISSUES_INDEX.md          # Issue管理インデックス
  ├── issues/                  # 個別Issue専用
  ├── specifications/          # 技術仕様書
  ├── phase-plans/            # フェーズ別計画
  └── user-flows/             # ユーザーフロー図
  
/manuals/                      # ユーザーマニュアル専用
  ├── 01-system-overview.md
  ├── 02-task-management.md
  └── ...
```

#### 2. Issue管理の命名規則
```
# 技術課題
TECHNICAL_ISSUES_[SPECIFIC_TOPIC].md

# 機能要望  
FEATURE_REQUEST_[SPECIFIC_FEATURE].md

# バグレポート
BUG_REPORT_[SPECIFIC_BUG].md

# 改善提案
ENHANCEMENT_[SPECIFIC_IMPROVEMENT].md
```

#### 3. ソースコード構造（Next.js 14 App Router）
```
/src/
  ├── app/                     # App Router pages
  │   ├── api/                # API routes
  │   ├── auth/               # 認証関連ページ
  │   └── [feature]/          # 機能別ページ
  ├── components/             # React コンポーネント
  │   ├── ui/                 # 基本UIコンポーネント
  │   ├── forms/              # フォーム関連
  │   └── [feature]/          # 機能別コンポーネント
  ├── lib/                    # ユーティリティ・設定
  │   ├── auth/               # 認証設定
  │   ├── db/                 # データベース設定
  │   └── utils/              # 汎用ユーティリティ
  └── services/               # ビジネスロジック
      ├── api/                # API クライアント
      └── [domain]/           # ドメイン別サービス
```

---

## 💬 コミュニケーション・応答ルール

### **応答の簡潔性（厳格適用）**
```
✅ 良い応答例:
User: "2 + 2は？"
Assistant: "4"

User: "ファイルを移動できた？"
Assistant: "✅ 完了しました"

❌ 悪い応答例:
"計算結果をお伝えします。2 + 2 = 4 となります。"
"ファイルの移動作業が正常に完了いたしました。以下の通り..."
```

### **前置き・後置きの完全禁止**
```
❌ 使用禁止フレーズ:
"以下の通りです"
"についてご説明します"
"作業を実行します"
"完了いたしました"
"確認してください"

✅ 直接的な応答:
"[具体的な回答・結果]"
"✅ [作業完了]"
"❌ [エラー内容]"
```

---

## 🔧 技術実装の一貫性ルール

### **TypeScript型定義**
```typescript
// 統一命名規則
interface UserProfile {           // PascalCase
  id: string
  name: string
  email: string | null          // null許可は明示的に
}

type UserRole = 'ADMIN' | 'MEMBER' | 'GUEST'  // SCREAMING_SNAKE_CASE

// API Response型
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Props型
interface ComponentNameProps {
  children?: React.ReactNode
  className?: string
  // 必須プロパティを先に、オプションを後に
}
```

### **API Route実装パターン**
```typescript
// /src/app/api/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 実装
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### **Component実装パターン**
```typescript
// /src/components/[Feature]/ComponentName.tsx
'use client'  // 必要な場合のみ

interface ComponentNameProps {
  // Props定義
}

export default function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // 実装
  
  return (
    <div className="[tailwind-classes]">
      {/* JSX */}
    </div>
  )
}
```

---

## 📋 Todo管理の徹底ルール

### **Todo作成タイミング（必須）**
```
1. 複数ステップのタスク開始時
2. ユーザーから複数要求受領時  
3. 予期しない問題発見時
4. 調査・分析タスク開始時
5. Phase作業の開始時
```

### **Todo更新タイミング（厳格）**
```
✅ 各作業完了の瞬間に即座更新
❌ 複数作業完了後のバッチ更新禁止
✅ 問題発生時の即座状況更新
✅ 方針変更時の即座反映
```

### **TodoWriteの必須項目**
```json
{
  "id": "unique_id",
  "content": "具体的で測定可能なタスク内容", 
  "status": "pending|in_progress|completed",
  "priority": "high|medium|low"
}
```

---

## 🎯 バージョン・コミット管理ルール

### **コミットメッセージ統一フォーマット**
```bash
# フォーマット
[type]: [具体的な変更内容]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>

# type一覧
feat:     新機能追加
fix:      バグ修正  
docs:     ドキュメント更新
style:    コードフォーマット
refactor: リファクタリング
test:     テスト追加・修正
chore:    設定変更・メンテナンス
```

### **コミット実行ルール**
```bash
# 必須: HEREDOCを使用
git commit -m "$(cat <<'EOF'
feat: ユーザー登録システムの拡張

メール・パスワード認証機能を追加
- NextAuth Credentials Provider実装
- パスワードハッシュ化対応
- メール認証フロー追加

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### **バージョニング判断基準**
```
Major (1.0.0 → 2.0.0): 破壊的変更
Minor (1.0.0 → 1.1.0): 新機能追加
Patch (1.0.0 → 1.0.1): バグ修正
```

---

## 🔍 コードベース理解の標準手順

### **新しいClaude Codeセッション開始時**
```bash
# 1. 現状確認（必須実行）
pwd
git status
git log --oneline -5

# 2. プロジェクト構造把握
ls -la
cat package.json | head -20

# 3. 現在のTodo確認
TodoRead

# 4. 直近の引き継ぎ書確認
ls -la *HANDOVER*.md 2>/dev/null || echo "No handover files"
ls -la docs/ | grep -E "(ISSUES|PLAN)"
```

### **作業開始前チェックリスト**
```
[ ] CLAUDE.md の制約事項確認
[ ] 現在のブランチ・git状況確認  
[ ] 既存Todo状況の把握
[ ] 関連する既存ファイルの確認
[ ] 依存関係・ライブラリの確認
```

---

## 📊 品質保証・一貫性チェック

### **実装前確認事項**
```
[ ] 既存の命名規則に従っているか
[ ] 同様の実装パターンが存在するか
[ ] TypeScript型定義が適切か
[ ] APIレスポンス形式が統一されているか
[ ] エラーハンドリングが適切か
```

### **完了前確認事項**
```
[ ] Todoステータスが正確に更新されているか
[ ] 作成・変更したファイルが適切な場所にあるか
[ ] リンクが正しく設定されているか
[ ] 既存機能への影響がないか
[ ] コミットメッセージが規則に従っているか
```

---

## 🎨 ドキュメント作成ルール

### **マニュアル作成時の統一事項**
```markdown
# 必須ヘッダー構造
# [機能名] マニュアル

## 概要
[3-5行の簡潔な説明]

## 主要特徴  
- [箇条書き3-5項目]

## 目次
[章立ての一覧]

## [各章]
[具体的な手順・説明]

## トラブルシューティング
[Q&A形式]

## まとめ
[期待効果・活用のコツ]
```

### **Issue文書の統一フォーマット**
```markdown
# 🚨/🚀 [課題/機能]: [具体的タイトル]

**作成日**: YYYY-MM-DD
**種別**: [Technical Issue/Feature Request/Bug Report]
**影響度**: [Critical/High/Medium/Low]  
**ステータス**: [調査中/承認待ち/実装中/完了/却下]

## 📋 [概要/現状分析]
## 🔍 詳細分析結果  
## 🛠️ 解決策/提案機能
## 📊 工数見積もり
## 🎯 優先度・実装順序
## 📞 Next Actions
```

---

## 🔄 リフレッシュ対応プロトコル

### **新セッション開始時の必須確認**
```bash
# 実行順序厳守
echo "=== Claude Code Session Start ==="
pwd
git status
git branch
ls -la CLAUDE.md 2>/dev/null || echo "⚠️ CLAUDE.md not found"
TodoRead
echo "=== Ready for development ==="
```

### **引き継ぎ情報の優先順位**
```
1. CLAUDE.md - 行動制約・プロジェクト固有ルール
2. 最新のHANDOVER/ISSUES文書
3. 現在のTodo状況  
4. 直近のgit log
5. package.json - 技術スタック
```

### **コンテキスト確認質問（推奨）**
```
新しいClaude Codeセッション時にユーザーに確認:
"現在の作業状況を確認しました。
直前の作業から継続しますか？
それとも新しいタスクですか？"
```

---

## ⚡ パフォーマンス・効率化ルール

### **Tool使用の最適化**
```
複数ファイル操作: 1つのメッセージで並列実行
検索・調査: 不確実な場合はTask toolを活用
ファイル読み込み: 関連ファイルの一括読み込み
```

### **並列処理の活用例**
```javascript
// 同時実行する
Read file1.ts
Read file2.ts  
Read file3.ts

// ではなく、1つのメッセージで
MultiRead([file1.ts, file2.ts, file3.ts])
```

---

## 🎯 成果物の一貫性保証

### **ファイル作成時の必須要素**
```
[ ] 適切なディレクトリ配置
[ ] 統一された命名規則
[ ] 必要なヘッダー・メタデータ
[ ] 関連ファイルとのリンク設定
[ ] 更新日・作成者情報
```

### **ドキュメント間の整合性**
```
[ ] INDEX系ファイルの更新
[ ] 相互参照リンクの設定
[ ] 命名規則の統一
[ ] フォーマットの統一
```

---

このルールにより、**リフレッシュ後も完全に同じ開発体験**が保証され、コンテキストコンパクトによる微細なギャップが完全に排除されます。

**最終更新**: 2025年6月29日  
**適用対象**: 全Claude Codeセッション  
**継承性**: このルールは全プロジェクトに適用可能
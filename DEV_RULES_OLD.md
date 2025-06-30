# 開発ルール・技術標準

**最終更新**: 2025年6月30日  
**責任者**: CTO Level  
**目的**: Claude Code リフレッシュ時の開発一貫性確保

---

## 🛠️ 技術スタック・環境

### **必須技術スタック**
```
Frontend: Next.js 15.3.3 + React 19 + TypeScript 5 + Tailwind CSS 4
Backend: Next.js API Routes + Prisma 6.9.0
Database: PostgreSQL + Prisma ORM
Auth: NextAuth.js 4.24.11
Integration: LINE Bot SDK, Google APIs, GA4
Testing: Jest 30.0.3 + ts-jest
Deployment: Vercel
```

### **利用可能なスクリプト**
```bash
npm run dev          # 開発サーバー（--turbopack）
npm run build        # プロダクションビルド
npm run lint         # ESLint実行
npm run test         # Jest実行
npm run test:watch   # Jest watch mode
npm run test:coverage # カバレッジ測定

# 注意: typecheckスクリプトは存在しない
# 代替: npx tsc --noEmit を使用
```

---

## 📂 ディレクトリ構造ルール

### **必須ディレクトリ**
```
/src/                        # ソースコード（変更可能）
/manuals/                    # ユーザーマニュアル（更新義務あり）
/docs/user-flows/            # ユーザーフロー（更新義務あり）
/docs/specifications/        # 技術仕様（更新義務あり）
/phases/                     # フェーズ管理（新設）
/issues/                     # Issue管理（新設）
```

### **一時ディレクトリ**
```
/temp/                       # 作業用一時ファイル
/active/                     # 進行中作業ファイル
```

---

## ⚡ チェック作業の重複回避・統一ルール

### **基本原則：「誰がいつやっても同じ手順・同じ判断・無駄なし」**

#### **チェック実行の責任分担**
```
引き継ぎ前の人（現在の作業者）:
✅ 全チェック実行・結果記録・問題解決
✅ HANDOVER.md にチェック結果を記録

引き継ぎ後の人（新しい作業者）:
✅ HANDOVER.md のチェック結果確認のみ
❌ 同じチェックを再実行しない（無駄排除）
```

#### **統一チェック手法（全員必須遵守）**
```bash
# 型チェック（方法統一）
npx tsc --noEmit

# ビルドチェック（方法統一）
npm run build

# リントチェック（方法統一）
npm run lint

# テストチェック（方法統一）
npm run test
```

#### **判断基準の統一**
```
TypeScript Errors: 必須修正（作業停止）
TypeScript Warnings: 無視可能（継続可能）
ESLint Errors: 必須修正（作業停止）
ESLint Warnings: 無視可能（継続可能）
Jest Test Failures: 必須修正（作業停止）
Build Failures: 必須修正（作業停止）
```

#### **チェック結果の記録フォーマット**
```markdown
# HANDOVER.md 内での記録例

## チェック実行結果（引き継ぎ後は再実行不要）
- 型チェック: ✅ PASS（2025-06-30 10:30実行）
- ビルドチェック: ✅ PASS（2025-06-30 10:32実行）
- リントチェック: ⚠️ WARNING 3件（無視可能、2025-06-30 10:33実行）
- テスト: ✅ PASS（2025-06-30 10:35実行）

## 重要: 次の作業者はチェック再実行禁止
上記結果を信頼して作業継続してください。
```

#### **システム走査の効率化**
```bash
# 既存型定義・ステータスの把握（初回のみ実行）
rg "type|interface|enum" src/ --type ts > temp/existing-types.txt
rg "status.*=|Status.*=" src/ --type ts > temp/existing-statuses.txt

# 重複チェック時は差分確認のみ
diff temp/existing-types.txt temp/new-search-result.txt
```

---

## 🔄 Claude Code リフレッシュ時の標準プロトコル

### **必須読み込みファイル（順序厳守）**
```bash
1. cat CLAUDE.md                           # 絶対ルール確認
2. cat DEV_RULES.md                        # 技術標準確認（このファイル）
3. cat phases/current/PHASE_PLAN.md       # 現在フェーズ計画確認
4. cat phases/current/PROGRESS_REPORT.md  # 進捗状況確認
5. cat phases/current/HANDOVER.md         # 引き継ぎ確認（存在時）
6. TodoRead                                # Todo状況確認
```

### **復帰確認時間**
- **目標**: 5分以内
- **必須**: 迷いなく次のアクションを決定

### **既存システム把握・重複防止プロトコル**

#### **新機能実装前の必須確認**
```bash
# 1. 既存型定義の確認（重複型定義防止）
rg "interface|type|enum" src/ --type ts | grep -i "新機能名"

# 2. 既存ステータス値の確認（COMPLETE vs completed 問題防止）
rg "status|Status" src/ --type ts | grep -E "(=|:)"

# 3. 既存コンポーネント・サービスの確認（重複実装防止）
find src/ -name "*新機能関連*.ts*" -o -name "*似た機能名*.ts*"

# 4. 既存API エンドポイントの確認（重複API防止）
find src/app/api/ -name "*関連機能*" -type d
```

#### **重複・矛盾防止チェックリスト**
```
新機能実装時:
[ ] 既存の型定義を再利用しているか？
[ ] 既存のステータス値（COMPLETE等）を使用しているか？
[ ] 似た機能の既存実装を調査・再利用したか？
[ ] 既存APIエンドポイントとの重複がないか？
[ ] 既存のディレクトリ構造・命名規則に従っているか？

新型定義作成時:
[ ] 既存のinterfaceで代用できないか？
[ ] enumの値が既存と重複・矛盾していないか？
[ ] 命名が既存パターンと一貫しているか？
```

#### **システム全体一貫性の維持**
```bash
# 定期的な一貫性チェック（フェーズ完了時）
npm run lint                           # コードスタイル一貫性
npx tsc --noEmit                      # 型定義一貫性
rg "TODO|FIXME|HACK" src/ --type ts   # 技術債務確認
```

---

## 📝 コード品質基準

### **命名規則**
```typescript
// ファイル名: kebab-case
user-profile-modal.tsx
sales-analytics.service.ts

// 関数名: camelCase
getUserProfile()
calculateSalesMetrics()

// コンポーネント: PascalCase
UserProfileModal
SalesAnalyticsComponent

// 定数: UPPER_SNAKE_CASE
const API_BASE_URL = "..."
const MAX_RETRY_COUNT = 3
```

### **ディレクトリ命名**
```
/src/components/             # React コンポーネント
/src/services/              # ビジネスロジック
/src/lib/                   # ユーティリティ
/src/app/api/               # API Routes
/src/hooks/                 # カスタムフック
```

### **コミットメッセージ形式**
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
refactor: リファクタリング
test: テスト追加・修正
style: コードスタイル修正
chore: その他の変更

例:
feat: ユーザープロフィール編集機能を追加
fix: タスク削除時のエラーハンドリングを修正
docs: API仕様書にエンドポイント追加
```

---

## 🔄 開発ワークフロー

### **作業開始前の必須確認**
```bash
1. pwd && git status && git branch    # 現在位置・ブランチ確認
2. npm run lint                       # コード品質確認
3. npx tsc --noEmit                   # 型チェック実行
4. npm run test                       # テスト実行
```

### **新機能実装時**
```bash
1. phases/current/PROGRESS_REPORT.md にタスク追加
2. TodoWrite でタスク管理開始
3. 実装作業
4. 関連ドキュメント更新（必須）
   - manuals/ （該当する場合）
   - docs/user-flows/ （UI変更の場合）
   - docs/specifications/ （API変更の場合）
5. テスト作成・実行
6. コード品質チェック
7. TodoWrite でタスク完了
8. phases/current/PROGRESS_REPORT.md 更新
```

### **作業完了後の必須更新**
```bash
1. TodoWrite でステータス更新
2. phases/current/PROGRESS_REPORT.md 進捗反映
3. 関連ドキュメントのギャップ確認・修正
4. npm run lint && npx tsc --noEmit
5. Git commit（メッセージ形式遵守）
```

---

## 📚 ドキュメント管理ルール

### **更新義務があるドキュメント**

#### 機能追加・変更時
```
manuals/                     # 該当機能のユーザーマニュアル
docs/user-flows/            # ユーザー操作フロー
docs/specifications/        # API仕様・技術仕様
```

#### 更新チェックリスト（実装と同時実行必須）
```
新機能追加時（実装完了 = ドキュメント更新完了）:
[ ] manuals/該当ファイル.md に機能説明追加
[ ] docs/user-flows/ にユーザー操作フロー追加  
[ ] docs/specifications/ にAPI仕様追加
[ ] 実装コードとドキュメントが100%一致確認

既存機能変更時（変更完了 = ドキュメント同期完了）:
[ ] 変更内容がmanuals/に反映済み
[ ] 変更されたフローがuser-flows/に反映済み
[ ] 変更されたAPIがspecifications/に反映済み
[ ] 古い情報が削除済み

機能廃止時（廃止完了 = ドキュメント削除完了）:
[ ] 該当ドキュメントを削除またはdeprecated マーク
[ ] 関連するuser-flowsから削除
[ ] APIドキュメントから削除
```

### **ドキュメント更新の強制確認**
```bash
# 実装完了時の必須確認プロンプト
echo "=== 実装完了前の必須ドキュメント更新確認 ==="
echo "1. manuals/ 更新完了？ (y/n)"
read manual_done
echo "2. user-flows/ 更新完了？ (y/n)"
read flow_done  
echo "3. specifications/ 更新完了？ (y/n)"
read spec_done

if [[ "$manual_done" != "y" ]] || [[ "$flow_done" != "y" ]] || [[ "$spec_done" != "y" ]]; then
  echo "❌ ドキュメント更新未完了 - 実装完了と見なしません"
  exit 1
fi
echo "✅ ドキュメント更新確認完了"
```

### **ドキュメント品質基準**
- **正確性**: 実装と100%一致（ずれ許容度0%）
- **完全性**: 操作手順に漏れなし
- **明確性**: 初回利用者でも理解可能
- **最新性**: 機能変更と**同時**更新（後回し禁止）
- **一貫性**: 既存ドキュメントとの命名・形式統一

---

## 🎯 Issue管理プロセス

### **Issue作成時**
```bash
1. issues/[TYPE]_[TOPIC].md 作成
   TYPE: BUG, FEATURE, IMPROVEMENT, RESEARCH
2. phases/current/PROGRESS_REPORT.md に追加
3. TodoWrite でトラッキング開始
```

### **Issue解決時**
```bash
1. 解決内容を issues/[ID].md に記録
2. 関連ドキュメント更新確認
3. phases/current/PROGRESS_REPORT.md から削除
4. TodoWrite で完了マーク
5. Archive処理（必要に応じて）
```

---

## ⚠️ 品質保証チェックポイント

### **Claude Code リフレッシュ前**
```bash
# 次のClaude Codeが迷わないための準備
1. phases/current/HANDOVER.md 作成・更新
2. 進行中作業の明確な記録
3. 重要な判断・前提の文書化
4. 次やるべきことの具体的指示
```

### **エラー防止**
```bash
# よくあるエラーの防止
1. npm run typecheck → npx tsc --noEmit 使用
2. 存在しないスクリプト実行前にpackage.json確認
3. ファイル作成前にディレクトリ存在確認
4. ドキュメント更新漏れチェック
```

---

## 🔧 トラブルシューティング

### **よくある問題と解決策**

#### TypeScript型チェック
```bash
# ❌ 失敗パターン
npm run typecheck

# ✅ 正しいパターン  
npx tsc --noEmit
```

#### ドキュメント不整合
```bash
# 新機能実装後の必須確認
grep -r "新機能名" manuals/
grep -r "新機能名" docs/user-flows/
grep -r "新機能名" docs/specifications/
```

#### Phase切り替え時
```bash
# 現在フェーズ完了時
mv phases/current/* phases/completed/phase-X/
mkdir -p phases/current
# 次フェーズ準備
```

---

## 📋 開発効率化ツール

### **推奨VSCode拡張**
```
- TypeScript Importer
- Tailwind CSS IntelliSense  
- Prisma
- ESLint
- Prettier
- Git Lens
```

### **便利なコマンド**
```bash
# プロジェクト全体検索
rg "検索語" --type ts --type tsx

# ファイル一括確認
find src/ -name "*.ts" -o -name "*.tsx" | head -10

# 型エラー詳細確認
npx tsc --noEmit --pretty
```

---

**管理責任者**: CTO Level  
**適用対象**: 全開発者・Claude Code  
**更新頻度**: 技術スタック変更時のみ  
**次回見直し**: 技術的な大幅変更時
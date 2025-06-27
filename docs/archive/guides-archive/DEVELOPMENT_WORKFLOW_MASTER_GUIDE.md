# 🔄 UI/UXカンバン改善プロジェクト - 開発ワークフロー完全ガイド

**作成日**: 2025-06-17  
**対象**: 全フェーズ担当エンジニア  
**目的**: タイミング・ドキュメント参照・コミット・更新の完全な開発フロー指示

---

## 📋 開発フロー全体概要

### 🎯 ワークフローの構成
```
プロジェクト参画 → Phase準備 → 日次開発 → Phase完了 → 引き継ぎ
     ↓              ↓          ↓         ↓         ↓
 初期設定      作業前準備   実装・テスト  品質確認   次Phase準備
```

### 📚 ドキュメント分類・参照タイミング

#### 🔴 **MASTER級ドキュメント**（必須・常時参照）
- `UNIFIED_DEVELOPMENT_MASTER_PROMPT.md` - 開発ルール・品質基準
- `REQUIREMENTS_DEFINITION_COMPREHENSIVE.md` - 包括要件定義

#### 🟡 **PHASE級ドキュメント**（Phase開始時・実装中参照）
- `PERFECT_PHASE_IMPLEMENTATION_PLAN.md` - フェーズ別詳細実装計画

#### 🟢 **REFERENCE級ドキュメント**（必要時参照）
- 各種技術ドキュメント・API仕様

---

## 🚀 Phase開始時ワークフロー

### 📅 **Step 1: プロジェクト参画・初期設定**（1-2時間）

#### 1.1 環境準備・確認
```bash
# 現在時刻と担当Phase記録
echo "Phase X開始: $(date)" >> DEVELOPMENT_LOG.md

# 環境確認
git status        # clean状態確認

#### 1.2 必須ドキュメント読込（順序厳守）
```
📖 読込順序（30-45分）:
1. UNIFIED_DEVELOPMENT_MASTER_PROMPT.md      # 15分: 全体ルール・品質基準
2. REQUIREMENTS_DEFINITION_COMPREHENSIVE.md  # 15分: 包括要件・担当Phase要件
3. PERFECT_PHASE_IMPLEMENTATION_PLAN.md     # 15分: 担当Phase詳細実装
```

#### 1.3 現状把握・ベースライン確立
```bash
# 品質ベースライン確認・記録
echo "## Phase X ベースライン確認 $(date)" >> DEVELOPMENT_LOG.md
npx tsc --noEmit 2>&1 | tee -a DEVELOPMENT_LOG.md
npm run lint 2>&1 | tee -a DEVELOPMENT_LOG.md
npm run build 2>&1 | tee -a DEVELOPMENT_LOG.md

# 結果がエラー0件・ビルド成功でない場合は作業停止・報告
```

#### 1.4 作業前状態保存
```bash
# 必須コミット（作業開始前の安全な状態）
git add .
git commit -m "Phase X開始前ベースライン保存

- TypeScriptエラー: X件
- ESLintエラー: X件  
- ビルド状況: 成功/失敗
- 開始時刻: $(date)

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### **よく使う確認コマンド**
```bash
# システム状態確認
git status
ps aux | grep next | grep -v grep

# データベース確認
npx prisma studio  # GUI管理画面
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.tasks.count(), p.projects.count()]).then(([tasks, projects]) => console.log(\`Tasks: \${tasks}, Projects: \${projects}\`)).finally(() => p.\$disconnect());"

```

---

# データ整合性確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.[新テーブル].count().then(count => console.log(\`Count: \${count}\`)).finally(() => p.\$disconnect());"
```

```
### 📋 **Step 2: Phase実装戦略策定**（30分）

#### 2.1 担当Phase詳細分析
```markdown
# PHASE_X_STRATEGY.md 作成
## Phase X 実装戦略

### 📋 必須完了項目
- [ ] 項目1: 詳細・工数見積もり
- [ ] 項目2: 詳細・工数見積もり

### 🔧 技術的課題・リスク
- 課題1: 対応方針
- 課題2: 対応方針

### 📅 5日間詳細スケジュール
**Day 1**: 実装項目・目標
**Day 2**: 実装項目・目標
**Day 3**: 実装項目・目標
**Day 4**: 実装項目・目標
**Day 5**: 統合・テスト・完了

### 🎯 Day別完了基準
**Day 1完了基準**: 具体的チェック項目
**Day 2完了基準**: 具体的チェック項目
```

#### 2.2 戦略コミット
```bash
git add PHASE_X_STRATEGY.md
git commit -m "Phase X実装戦略策定完了

- 5日間詳細計画確定
- 技術課題・対応方針明確化
- 完了基準設定

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 🔄 日次開発ワークフロー

### 🌅 **Step 3: 日次開始時ワークフロー**（15分）

#### 3.1 作業開始前チェック
```bash
# 日次開始ログ
echo "## Day X 開始 $(date)" >> DEVELOPMENT_LOG.md

# 品質状況確認
npx tsc --noEmit
npm run lint
npm run build

# 問題ある場合は解決してから作業開始
```

#### 3.2 当日実装項目確認
```markdown
# 当日の実装項目をDEVELOPMENT_LOG.mdに追記

### Day X 実装予定 $(date)
**実装項目**:
- 項目1: 詳細・期待完了時間
- 項目2: 詳細・期待完了時間

**参照ドキュメント**:
- PERFECT_PHASE_IMPLEMENTATION_PLAN.md: Phase X Day X
- その他技術ドキュメント

**完了基準**:
- [ ] 機能動作確認
- [ ] TypeScript・ESLintエラー0件
- [ ] 既存機能破綻なし
```

#### 3.3 作業開始コミット
```bash
git add .
git commit -m "Day X作業開始

予定実装項目:
- 項目1
- 項目2

品質確認: ✅ TS・ESLint・Build全て正常

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 🔨 **Step 4: 実装中ワークフロー**

#### 4.1 機能単位実装サイクル（1-2時間ごと）

##### ✅ **実装 → テスト → コミット**サイクル
```bash
# 1. 機能実装（30-60分）
# ├ コード実装
# ├ 随時 TypeScript・ESLintエラーチェック・即修正
# └ 基本動作確認

# 2. 品質チェック（5-10分）
npx tsc --noEmit    # エラーあれば即修正
npm run lint        # エラーあれば即修正
npm run build       # 失敗あれば即修正

# 3. 機能テスト（10-15分）
# ├ 実装機能動作確認
# ├ 既存機能破綻確認
# └ レスポンシブ動作確認（主要ブレークポイント）

# 4. 機能完了コミット（5分）
git add .
git commit -m "機能X実装完了

実装内容:
- 具体的実装内容1
- 具体的実装内容2

動作確認:
- ✅ 機能動作正常
- ✅ 既存機能保持
- ✅ レスポンシブ対応

品質確認:
- ✅ TypeScriptエラー: 0件
- ✅ ESLintエラー: 0件
- ✅ ビルド成功

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### 4.2 進捗記録更新（1-2時間ごと）
```markdown
# DEVELOPMENT_LOG.mdに追記

### Day X 進捗更新 $(date +"%H:%M")
**完了項目**:
- ✅ 機能X実装完了: 詳細
- 🔄 機能Y実装中: 進捗率・残課題

**技術メモ**:
- 実装時の重要な発見・注意点
- 参考にした実装方法

**課題・解決**:
- 課題1: 解決方法
- 課題2: 対応中・対応方針
```

#### 4.3 エラー・課題発生時の対応

##### 🚨 **TypeScript・ESLintエラー発生時**
```bash
# 即座に作業停止・エラー解決
npx tsc --noEmit    # エラー詳細確認
npm run lint        # エラー詳細確認

# エラー解決作業
# 解決後確認
npx tsc --noEmit    # 0件確認
npm run lint        # 0件確認

# 解決コミット
git add .
git commit -m "品質エラー解決

解決内容:
- TypeScriptエラー: 具体的解決内容
- ESLintエラー: 具体的解決内容

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

##### 🚨 **機能破綻・重大問題発生時**
```bash
# 緊急ログ記録
echo "🚨 CRITICAL ISSUE $(date)" >> DEVELOPMENT_LOG.md
echo "問題詳細: 具体的問題内容" >> DEVELOPMENT_LOG.md
echo "影響範囲: 影響するページ・機能" >> DEVELOPMENT_LOG.md

# 安全な状態にロールバック
git log --oneline | head -10    # 直近の安定コミット確認
git reset --hard <STABLE_COMMIT>

# 問題分析・解決策検討
# 解決後は段階的に再実装
```

### 🌆 **Step 5: 日次終了時ワークフロー**（15分）

#### 5.1 日次完了確認・記録
```markdown
# DEVELOPMENT_LOG.mdに日次サマリー追記

## Day X 完了サマリー $(date)

### ✅ 完了項目
- 項目1: 実装完了・動作確認済み
- 項目2: 実装完了・動作確認済み

### 🔄 継続項目
- 項目3: 進捗率・残作業・明日の予定

### 📋 品質状況
- TypeScriptエラー: 0件 ✅
- ESLintエラー: 0件 ✅
- ビルド: 成功 ✅
- 既存機能: 全て正常 ✅

### 🎯 明日の予定
- 実装予定項目1
- 実装予定項目2

### 📝 技術メモ・引き継ぎ
- 重要な実装ポイント
- 注意すべき事項
```

#### 5.2 日次完了コミット
```bash
# 必須最終チェック
npx tsc --noEmit    # 0件必須
npm run lint        # 0件必須
npm run build       # 成功必須

# 日次完了コミット
git add .
git commit -m "Day X完了

完了項目:
- 項目1: 実装・テスト完了
- 項目2: 実装・テスト完了

継続項目:
- 項目3: 進捗率・明日継続

品質状況: 全基準クリア ✅
- TypeScript: 0件
- ESLint: 0件  
- Build: 成功
- 既存機能: 正常

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 🏁 Phase完了時ワークフロー

### 📋 **Step 6: Phase統合・最終テスト**（Day 5）

#### 6.1 統合テスト実施（2-3時間）
```bash
# 統合テスト開始ログ
echo "## Phase X 統合テスト開始 $(date)" >> DEVELOPMENT_LOG.md

# 品質基準最終確認
npx tsc --noEmit 2>&1 | tee -a DEVELOPMENT_LOG.md
npm run lint 2>&1 | tee -a DEVELOPMENT_LOG.md
npm run build 2>&1 | tee -a DEVELOPMENT_LOG.md
```

#### 6.2 機能完全性テスト
```markdown
# PHASE_X_TEST_RESULTS.md 作成

## Phase X 統合テスト結果

### 📋 実装完了項目チェック
- [ ] 必須項目1: 実装完了・動作確認
- [ ] 必須項目2: 実装完了・動作確認
- [ ] 必須項目3: 実装完了・動作確認

### 🖥️ ブラウザ動作確認
- [ ] Chrome: 正常動作
- [ ] Firefox: 正常動作  
- [ ] Safari: 正常動作
- [ ] Edge: 正常動作

### 📱 レスポンシブ動作確認
- [ ] モバイル (320px-): 正常動作
- [ ] タブレット (768px-): 正常動作
- [ ] デスクトップ (1024px+): 正常動作

### 🔗 既存機能影響確認
- [ ] 他ページ機能: 正常動作
- [ ] API連携: 正常動作
- [ ] データ整合性: 問題なし

### 📊 パフォーマンス確認
- [ ] レスポンス時間: <200ms
- [ ] メモリ使用量: 正常範囲
- [ ] バンドルサイズ: 許容範囲
```

#### 6.3 Phase完了報告書作成
```markdown
# PHASE_X_COMPLETION_REPORT.md 作成

## Phase X 完了報告書

### 📊 実装サマリー
**実装期間**: 開始日 〜 完了日  
**実装工数**: X人日  
**品質基準**: 全項目達成  

### ✅ 完了項目詳細
1. **項目1**: 詳細実装内容・技術的ポイント
2. **項目2**: 詳細実装内容・技術的ポイント
3. **項目3**: 詳細実装内容・技術的ポイント

### 📂 作成・変更ファイル
**新規作成**: X件
- src/components/xxx/Xxx.tsx
- src/lib/xxx/xxx.ts

**変更**: X件  
- src/components/xxx/Xxx.tsx: 変更内容
- src/pages/xxx.tsx: 変更内容

**削除**: X件
- src/components/xxx/OldXxx.tsx: 削除理由

### 🔧 技術実装ポイント
- **重要な実装詳細1**: 説明・今後の注意点
- **重要な実装詳細2**: 説明・今後の注意点

### 📋 品質基準達成状況
- ✅ TypeScriptエラー: 0件
- ✅ ESLintエラー: 0件
- ✅ ビルド成功: 100%
- ✅ 機能動作: 100%
- ✅ ブラウザ対応: 100%
- ✅ レスポンシブ: 100%

### ➡️ 次Phase引き継ぎ事項
1. **重要な引き継ぎ1**: 詳細・注意点
2. **重要な引き継ぎ2**: 詳細・注意点

### 💡 改善提案・課題
- **提案1**: 詳細・実装時期
- **課題1**: 詳細・対応方針
```

### 🎯 **Step 7: Phase完了・引き継ぎ準備**

#### 7.1 ドキュメント更新
```bash
# 進捗管理ドキュメント更新
# docs\reference\INTEGRATED_PROJECT_STATUS_REPORT.mdの該当項目を完了に更新

# 完了状況をREQUIREMENTS_DEFINITION_COMPREHENSIVE.mdに反映
# 該当受入れ基準項目をチェック済みに更新
```

#### 7.2 Phase完了コミット
```bash
# 最終品質チェック
npx tsc --noEmit    # 0件必須
npm run lint        # 0件必須
npm run build       # 成功必須

# Phase完了コミット
git add .
git commit -m "Phase X完了 - 全要件達成・品質基準クリア

Phase X実装完了サマリー:
✅ 必須項目1: 実装・テスト完了
✅ 必須項目2: 実装・テスト完了  
✅ 必須項目3: 実装・テスト完了

品質基準達成:
✅ TypeScript: 0件
✅ ESLint: 0件
✅ Build: 成功
✅ 全ブラウザ動作確認
✅ レスポンシブ動作確認
✅ 既存機能100%保持

作成ファイル: X件
変更ファイル: X件
テスト完了: 100%

次Phase準備完了

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### 7.3 次Phase準備・引き継ぎ
```markdown
# PHASE_X_TO_PHASE_Y_HANDOFF.md 作成

## Phase X → Phase Y 引き継ぎ書

### 📋 完了状況
- Phase X: 100%完了・品質基準達成
- 次Phase準備: 完了

### 🔧 技術的引き継ぎ
1. **重要実装1**: 詳細・今後の活用方法
2. **重要実装2**: 詳細・今後の活用方法

### ⚠️ 注意事項・制約
1. **制約1**: 詳細・回避方法
2. **制約2**: 詳細・回避方法

### 📚 Phase Y実装者への推奨事項
1. **推奨1**: 理由・実装時の注意点
2. **推奨2**: 理由・実装時の注意点

### 🎯 Phase Y成功のためのヒント
- ヒント1: 具体的アドバイス
- ヒント2: 具体的アドバイス
```

---

## 🔄 継続的品質管理

### 📊 **品質監視・定期チェック**

#### 毎時実行（実装中）
```bash
# 軽量チェック
npx tsc --noEmit --incremental
npm run lint --cache
```

#### 毎日実行（作業開始・終了時）
```bash
# 完全チェック
npx tsc --noEmit
npm run lint  
npm run build
```

#### 週次実行（Phase完了時）
```bash
# 包括的チェック
npm run typecheck
npm run lint
npm run build  
npm run test    # テストがある場合
npm audit       # セキュリティチェック
```

### 🚨 **緊急時対応フロー**

#### Critical Issue発生時
```bash
# 1. 即座に作業停止
echo "🚨 CRITICAL ISSUE $(date)" >> DEVELOPMENT_LOG.md

# 2. 問題記録
echo "問題: 具体的問題" >> DEVELOPMENT_LOG.md
echo "影響: 影響範囲" >> DEVELOPMENT_LOG.md

# 3. 安全な状態に復旧
git stash    # 作業中内容を一時保存
git reset --hard HEAD    # 最後の安定コミットに戻る

# 4. 問題分析・解決
# 問題の根本原因分析
# 解決策検討・実装
# 段階的テスト・検証

# 5. 解決報告
echo "解決: 解決方法" >> DEVELOPMENT_LOG.md
git add .
git commit -m "Critical Issue解決

問題: 具体的問題内容
解決: 具体的解決方法
対策: 再発防止策

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 📋 タイミング別参照ドキュメントマトリックス

| タイミング | 必須参照ドキュメント | 参照目的 | 所要時間 |
|------------|---------------------|----------|----------|
| **プロジェクト参画時** | UNIFIED_DEVELOPMENT_MASTER_PROMPT.md | 全体ルール・品質基準把握 | 15分 |
| | REQUIREMENTS_DEFINITION_COMPREHENSIVE.md | 包括要件・担当Phase要件把握 | 15分 |
| | PERFECT_PHASE_IMPLEMENTATION_PLAN.md | 詳細実装計画把握 | 15分 |
| **Phase開始時** | 上記3点 + CURRENT_ISSUES_AND_IMPROVEMENTS.md | 現状課題・注意事項把握 | 5分 |
| **日次開始時** | PERFECT_PHASE_IMPLEMENTATION_PLAN.md | 当日実装項目確認 | 5分 |
| **実装中** | 技術ドキュメント・API仕様 | 実装詳細確認 | 随時 |
| **エラー発生時** | UNIFIED_DEVELOPMENT_MASTER_PROMPT.md | エラー対応手順確認 | 5分 |
| **Phase完了時** | REQUIREMENTS_DEFINITION_COMPREHENSIVE.md | 受入れ基準確認 | 10分 |
| **引き継ぎ時** | 全ドキュメント | 完了状況・引き継ぎ内容整理 | 30分 |

---

## 🎯 成功するワークフローのポイント

### ✅ **品質ファースト**
- TypeScript・ESLintエラーは即座に解決
- 毎コミット前の必須チェック
- 問題発生時の迅速な復旧

### ⏰ **タイミング重視**
- 適切なタイミングでの適切なドキュメント参照
- 定期的な進捗記録・状況共有
- 段階的実装・早期問題発見

### 📝 **記録・トレーサビリティ**
- 全ての実装・決定・課題の詳細記録
- 将来の参照・引き継ぎに役立つ情報蓄積
- 学習・改善のためのナレッジ共有

### 🔄 **継続的改善**
- ワークフロー自体の改善・最適化
- チーム全体の効率性向上
- 品質基準の維持・向上

---

**このワークフローに従うことで、5週間で世界レベルのエンタープライズシステムを確実に完成させることができます。**

*作成者: Claude Code*  
*最終更新: 2025-06-17*  
*適用開始: 即座に適用可能*
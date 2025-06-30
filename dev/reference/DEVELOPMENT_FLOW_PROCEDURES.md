# 開発フロー・ルーティーン手順書

**最終更新**: 2025年6月30日  
**責任者**: CTO Level  
**目的**: Claude Code リフレッシュ時の一貫性確保のための具体的手順定義

---

## 🔄 Claude Code リフレッシュ後の標準手順

### **Step 1: 必須ファイル読み込み（順序厳守）**
```bash
# 5分以内での状況把握を目標
1. cat CLAUDE.md                           # 絶対ルール確認
2. cat DEV_RULES.md                        # 汎用技術標準確認
3. cat PROJECT_SPECIFIC_RULES.md           # プロジェクト固有ルール確認
4. cat phases/current/PHASE_PLAN.md       # 現在フェーズ計画確認
5. cat phases/current/PROGRESS_REPORT.md  # 進捗状況確認
6. cat phases/current/HANDOVER.md         # 引き継ぎ確認（存在時）
7. TodoRead                                # Todo状況確認
```

### **Step 2: 状況把握・判断**
```bash
# 基本情報確認
pwd && git status && git branch

# 状況判断
echo "現在の状況："
echo "- フェーズ: [PHASE_PLAN.mdから確認]"
echo "- 進捗: [PROGRESS_REPORT.mdから確認]"
echo "- 次やること: [HANDOVER.mdまたはTodoから確認]"
```

### **Step 3: 作業開始準備**
```bash
# HANDOVER.mdが存在する場合は削除
if [ -f "phases/current/HANDOVER.md" ]; then
  echo "HANDOVER.md確認済み - 削除します"
  rm phases/current/HANDOVER.md
fi

# 作業開始宣言
echo "作業を開始します"
```

---

## 🎯 新規フェーズ開始手順

### **前提条件**: 前フェーズが完了済み

### **Step 1: 現在フェーズの完了処理**
```bash
# 現在のフェーズ番号確認
CURRENT_PHASE=$(grep "^# Phase" phases/current/PHASE_PLAN.md | head -1)

# completed/にアーカイブ
mkdir -p phases/completed/
mv phases/current/PHASE_PLAN.md "phases/completed/phase-X-PHASE_PLAN.md"
mv phases/current/PROGRESS_REPORT.md "phases/completed/phase-X-PROGRESS_REPORT.md"

# current/をクリア
rm -f phases/current/*
```

### **Step 2: 次フェーズの開始**
```bash
# planned/から次フェーズを移動
NEXT_PHASE=$(ls phases/planned/ | head -1)
mv "phases/planned/$NEXT_PHASE" "phases/current/PHASE_PLAN.md"

# 新しいPROGRESS_REPORT.md作成
echo "# Phase X 進捗報告

## 開始日
$(date '+%Y年%m月%d日')

## 現在のステータス
- 全体進捗: 0%
- 次にやること: フェーズ計画確認・作業準備

## 完了済み
（まだありません）

## 進行中
- [ ] フェーズ開始準備

## 課題・ブロッカー
（まだありません）
" > phases/current/PROGRESS_REPORT.md
```

### **Step 3: 全体進捗の更新**
```bash
# phases/OVERALL_PROGRESS.md を更新
echo "フェーズ切り替え完了 - 全体進捗を更新してください"
```

---

## 📋 進捗報告更新手順

### **トリガー**: ユーザーから「コミットして進捗報告してください」の指示

### **Step 1: 作業内容のコミット**
```bash
# ステージング・コミット
git add .
git commit -m "$(cat <<'EOF'
[コミットメッセージ]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### **Step 2: 進捗報告の更新**
```bash
# phases/current/PROGRESS_REPORT.md を更新
# - 完了したタスクを「完了済み」に移動
# - 進行中タスクの進捗率更新
# - 新しい課題・ブロッカーがあれば追加
# - 次にやることを明確化
```

### **Step 3: Todo管理の同期**
```bash
# TodoWrite で完了したタスクをマーク
# 新しいタスクがあれば追加
TodoWrite
```

---

## 🔄 引き継ぎ準備手順

### **トリガー**: Claude Code リフレッシュが必要と判断した時

### **Step 1: HANDOVER.md作成**
```bash
echo "# Claude Code 引き継ぎ書

## 現在の作業状況
**日時**: $(date '+%Y年%m月%d日 %H:%M')
**フェーズ**: [現在のフェーズ]
**全体進捗**: [X%]

## 進行中の作業
### 現在作業中のファイル
- ファイルパス: [具体的なパス]
- 作業内容: [何をしているか]
- 進捗状況: [どこまで完了しているか]

### 次にやるべきこと
1. [具体的な次のアクション]
2. [注意点・前提条件]
3. [期待される成果物]

## 重要な判断・前提条件
### 技術的判断
- [技術選択の理由]
- [設計方針]
- [制約・制限事項]

### ビジネス判断
- [機能要件の解釈]
- [優先度の判断根拠]

## チェック実行結果（次の作業者は再実行不要）
- 型チェック: [✅ PASS / ❌ FAIL / ⚠️ WARNING] ($(date '+%Y-%m-%d %H:%M')実行)
- ビルドチェック: [✅ PASS / ❌ FAIL] ($(date '+%Y-%m-%d %H:%M')実行)
- リントチェック: [✅ PASS / ⚠️ WARNING X件] ($(date '+%Y-%m-%d %H:%M')実行)
- テスト: [✅ PASS / ❌ FAIL] ($(date '+%Y-%m-%d %H:%M')実行)

## 重要: 次の作業者への指示
上記チェック結果を信頼して作業継続してください。
再実行は不要です。

## 作業再開時の手順
1. phases/current/HANDOVER.md 確認（このファイル）
2. 進行中ファイルの確認・理解
3. 次やるべきことの実行
4. このファイルを削除して作業開始
" > phases/current/HANDOVER.md
```

### **Step 2: 最終確認**
```bash
# 引き継ぎ情報の完全性確認
echo "引き継ぎ準備チェックリスト:"
echo "[ ] 現在の作業状況が明確に記載されているか"
echo "[ ] 次やるべきことが具体的に書かれているか"  
echo "[ ] 重要な判断・前提が記録されているか"
echo "[ ] チェック結果が記録されているか"
echo "[ ] 作業再開手順が明確か"
```

---

## 🎯 フェーズ完了判定・完了手順

### **完了判定条件**
```bash
# PHASE_PLAN.mdの完了条件をすべて満たしているかチェック
echo "フェーズ完了判定:"
echo "[ ] 必須条件（Must Have）すべて完了"
echo "[ ] 望ましい条件（Should Have）の達成状況確認"
echo "[ ] 成功指標の達成確認"
echo "[ ] 関連ドキュメントの更新完了"
```

### **フェーズ完了時の手順**
```bash
# Step 1: 最終ドキュメント更新
echo "=== フェーズ完了時の必須ドキュメント更新 ==="
echo "1. manuals/ 更新完了？ (y/n)"
echo "2. user-flows/ 更新完了？ (y/n)"
echo "3. specifications/ 更新完了？ (y/n)"

# Step 2: 最終チェック実行
npm run lint
npx tsc --noEmit
npm run test

# Step 3: フェーズ完了コミット
git add .
git commit -m "feat: Phase X 完了

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Step 4: フェーズアーカイブ（新規フェーズ開始手順を参照）
```

---

## 🚨 Issue発生時の手順

### **計画外Issue発生時**
```bash
# Step 1: Issue記録
echo "# Issue: [Issue名]

## 発見日時
$(date '+%Y年%m月%d日 %H:%M')

## 概要
[Issue内容]

## 影響度
- フェーズ計画への影響: [なし/軽微/大]
- 緊急度: [低/中/高]

## 対応方針
[対応予定]

## ステータス
- [ ] 調査中
- [ ] 対応中  
- [ ] 解決済み
" > issues/[TYPE]_[TOPIC].md

# Step 2: 進捗報告に追加
# phases/current/PROGRESS_REPORT.md の「課題・ブロッカー」セクションに追加

# Step 3: TodoWrite でトラッキング開始
TodoWrite
```

### **Issue解決時**
```bash
# Step 1: Issue記録更新
# issues/[ID].md のステータスを「解決済み」に更新

# Step 2: 進捗報告から削除
# phases/current/PROGRESS_REPORT.md から該当Issue削除

# Step 3: TodoWrite で完了マーク
TodoWrite

# Step 4: 必要に応じてアーカイブ
# 重要でないIssueは issues/archive/ に移動
```

---

## ⚠️ エラー・例外処理

### **phases/current/が空の場合**
```bash
echo "警告: 現在進行中のフェーズがありません"
echo "新規フェーズを開始するか、planned/から選択してください"
```

### **HANDOVER.mdが古い場合（24時間以上前）**
```bash
echo "警告: HANDOVER.mdが古い可能性があります"
echo "内容を確認してから作業を開始してください"
```

### **チェック実行結果でエラーがある場合**
```bash
echo "エラー: チェックに失敗しています"
echo "以下を解決してから作業を継続してください:"
echo "- 型エラー: 必須修正"
echo "- ビルドエラー: 必須修正"  
echo "- テスト失敗: 必須修正"
echo "- リントエラー: 必須修正"
```

---

## 📊 フロー実行の効率化

### **よく使うコマンドのエイリアス**
```bash
# 状況確認ワンライナー
alias status_check="pwd && git status && git branch && echo '=== Current Phase ===' && head -5 phases/current/PHASE_PLAN.md"

# リフレッシュ後の標準読み込み
alias refresh_start="cat CLAUDE.md && echo '---' && cat DEV_RULES.md | head -20 && echo '---' && cat PROJECT_SPECIFIC_RULES.md | head -20"

# フェーズ進捗確認
alias phase_status="cat phases/current/PROGRESS_REPORT.md | head -20"
```

### **自動化可能な部分**
```bash
# HANDOVER.mdテンプレート生成
alias create_handover="cp templates/HANDOVER_TEMPLATE.md phases/current/HANDOVER.md"

# フェーズ完了時の自動チェック
alias phase_complete_check="npm run lint && npx tsc --noEmit && npm run test && echo 'すべてのチェックが完了しました'"
```

---

**管理責任者**: CTO Level  
**適用対象**: 全開発者・Claude Code  
**更新頻度**: フロー改善時  
**関連ドキュメント**: DEV_RULES.md, PROJECT_SPECIFIC_RULES.md
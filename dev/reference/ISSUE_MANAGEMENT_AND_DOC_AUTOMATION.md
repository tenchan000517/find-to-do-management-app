# Issue管理システム + ドキュメント自動更新の仕組み

**最終更新**: 2025年6月30日  
**責任者**: CTO Level  
**目的**: Issue管理とドキュメント一貫性確保の自動化システム設計

---

## 🎯 システム概要

### **解決すべき課題**
1. **計画外Issue発生時**の記録・管理
2. **機能実装・更新時**のドキュメント更新漏れ防止
3. **既存定義との重複・矛盾**の自動検出
4. **manuals/, user-flows/, specifications/** の一貫性確保

### **基本方針**
- Issue発生は**フェーズ計画に影響しない**（ユーザー指示がない限り）
- ドキュメント更新は**実装完了と同時**（後回し禁止）
- 重複・矛盾は**自動検出・警告**
- 更新漏れは**強制確認プロンプト**で防止

---

## 📋 Issue管理システム設計

### **Issue分類・命名ルール**
```bash
issues/
├── BUG_[具体的な問題名].md          # バグ・不具合
├── FEATURE_[機能名].md              # 新機能要求
├── IMPROVEMENT_[改善内容].md        # 既存機能改善
├── RESEARCH_[調査内容].md           # 技術調査・検証
├── BLOCKER_[ブロッカー内容].md      # 作業阻害要因
└── URGENT_[緊急対応内容].md         # 緊急対応事項
```

### **Issue記録テンプレート**
```markdown
# Issue: [Issue種別] - [具体的なタイトル]

## 基本情報
**発見日時**: [YYYY年MM月DD日 HH:MM]  
**報告者**: [Claude Code / User指示]  
**種別**: [BUG/FEATURE/IMPROVEMENT/RESEARCH/BLOCKER/URGENT]  
**影響度**: [高/中/低]  
**緊急度**: [高/中/低]

## 概要・詳細
### 問題・要求の内容
[具体的な内容記述]

### 発生条件・再現手順（該当する場合）
1. [手順1]
2. [手順2]
3. [結果]

### 期待される結果・成果物
[何を期待するか]

## 影響分析
### フェーズ計画への影響
- **現在フェーズ**: [影響あり/なし]
- **今後のフェーズ**: [影響あり/なし]
- **スケジュール**: [遅延リスク: 高/中/低/なし]

### 関連システム・機能への影響
- **影響範囲**: [具体的な範囲]
- **依存関係**: [他の機能との関係]
- **技術的制約**: [技術的な制限事項]

## 対応方針・計画
### 対応優先度
- **即座対応**: [要/不要] - [理由]
- **フェーズ内対応**: [要/不要] - [理由]
- **次フェーズ対応**: [要/不要] - [理由]
- **将来対応**: [要/不要] - [理由]

### 想定対応内容
1. **調査・分析**: [必要な調査内容]
2. **実装・修正**: [具体的な作業内容]
3. **テスト・検証**: [確認方法]
4. **ドキュメント更新**: [更新が必要なドキュメント]

### 工数見積もり
- **調査時間**: [X時間]
- **実装時間**: [X時間]
- **テスト時間**: [X時間]
- **ドキュメント更新時間**: [X時間]
- **合計**: [X時間]

## ステータス管理
### 現在のステータス
- [ ] 未着手
- [ ] 調査中
- [ ] 対応中
- [ ] テスト中
- [ ] 完了

### 進捗記録
- **[YYYY/MM/DD]**: [進捗内容]
- **[YYYY/MM/DD]**: [進捗内容]

## 解決記録
### 最終対応内容
[実際に行った対応]

### 解決日時
[YYYY年MM月DD日 HH:MM]

### 学習・改善点
[今後の予防策・改善点]

---
**最終更新**: [YYYY年MM月DD日]  
**ステータス**: [未着手/調査中/対応中/完了]
```

---

## 🔄 ドキュメント自動更新システム設計

### **更新対象ドキュメント**
```bash
manuals/                     # ユーザーマニュアル
├── [機能番号]-[機能名].md
docs/user-flows/            # ユーザーフロー
├── 01_BASIC_USER_FLOWS.md
├── 02_INTEGRATION_FLOWS.md
docs/specifications/        # 技術仕様
├── 00_SYSTEM_OVERVIEW.md
├── 01_DATABASE_SPECIFICATIONS.md
├── 02_API_SPECIFICATIONS.md
```

### **更新トリガー・検出ルール**
```bash
# 新機能実装時の自動検出
- src/app/api/新規ディレクトリ作成
- src/components/新規コンポーネント作成
- prisma/schema.prisma変更
- package.json依存関係追加

# 既存機能変更時の自動検出
- src/app/api/*/route.ts変更
- データベーススキーマ変更
- 重要な設定ファイル変更
```

### **自動チェック・警告システム**
```bash
#!/bin/bash
# ドキュメント一貫性チェックスクリプト

echo "=== ドキュメント一貫性チェック開始 ==="

# 1. 新機能のドキュメント化チェック
echo "新機能のドキュメント化状況チェック..."
NEW_APIS=$(find src/app/api -name "route.ts" -newer manuals/ 2>/dev/null | wc -l)
if [ $NEW_APIS -gt 0 ]; then
  echo "⚠️  警告: 新しいAPIエンドポイントがmanuals/で未文書化です"
  echo "対象: $NEW_APIS 個のAPI"
fi

# 2. 重複定義チェック
echo "重複定義チェック..."
DUPLICATE_TYPES=$(rg "interface|type|enum" src/ --type ts | grep -E "(User|Task|Project)" | sort | uniq -d | wc -l)
if [ $DUPLICATE_TYPES -gt 0 ]; then
  echo "⚠️  警告: 重複する型定義が検出されました"
  rg "interface|type|enum" src/ --type ts | grep -E "(User|Task|Project)" | sort | uniq -d
fi

# 3. ステータス値の一貫性チェック
echo "ステータス値一貫性チェック..."
STATUS_CONFLICTS=$(rg "status.*=" src/ --type ts | grep -v "COMPLETE" | grep -i "complete" | wc -l)
if [ $STATUS_CONFLICTS -gt 0 ]; then
  echo "⚠️  警告: ステータス値の命名が不一致です"
  echo "COMPLETE を使用してください（completed ではなく）"
fi

# 4. ドキュメントリンク切れチェック
echo "ドキュメントリンク整合性チェック..."
BROKEN_LINKS=$(grep -r "\[.*\](.*\.md)" docs/ manuals/ | grep -v "http" | wc -l)
if [ $BROKEN_LINKS -gt 0 ]; then
  echo "⚠️  警告: 内部リンクが切れている可能性があります"
fi

echo "=== ドキュメント一貫性チェック完了 ==="
```

---

## 🚀 実装完了時の強制確認システム

### **実装完了判定トリガー**
```bash
# Git commit前の強制チェック
#!/bin/bash
# pre-commit-doc-check.sh

echo "=== 実装完了時のドキュメント更新確認 ==="

# 変更されたファイルの種類を判定
CHANGED_APIS=$(git diff --cached --name-only | grep "src/app/api.*route.ts" | wc -l)
CHANGED_COMPONENTS=$(git diff --cached --name-only | grep "src/components.*tsx" | wc -l)
CHANGED_SCHEMA=$(git diff --cached --name-only | grep "prisma/schema.prisma" | wc -l)

# API変更の場合
if [ $CHANGED_APIS -gt 0 ]; then
  echo "🔍 API変更が検出されました"
  echo ""
  echo "以下のドキュメント更新が必要です:"
  echo "1. manuals/ の該当ファイル"
  echo "2. docs/specifications/02_API_SPECIFICATIONS.md"
  echo ""
  read -p "1. manuals/ 更新完了？ (y/n): " manual_done
  read -p "2. API仕様書 更新完了？ (y/n): " spec_done
  
  if [[ "$manual_done" != "y" ]] || [[ "$spec_done" != "y" ]]; then
    echo "❌ ドキュメント更新が未完了です"
    echo "実装完了とは見なしません。コミットを中止します。"
    exit 1
  fi
fi

# コンポーネント変更の場合
if [ $CHANGED_COMPONENTS -gt 0 ]; then
  echo "🔍 UI/コンポーネント変更が検出されました"
  echo ""
  read -p "user-flows/ 更新完了？ (y/n): " flow_done
  
  if [[ "$flow_done" != "y" ]]; then
    echo "❌ ユーザーフロー更新が未完了です"
    exit 1
  fi
fi

# データベーススキーマ変更の場合
if [ $CHANGED_SCHEMA -gt 0 ]; then
  echo "🔍 データベーススキーマ変更が検出されました"
  echo ""
  read -p "docs/specifications/01_DATABASE_SPECIFICATIONS.md 更新完了？ (y/n): " db_done
  
  if [[ "$db_done" != "y" ]]; then
    echo "❌ データベース仕様書更新が未完了です"
    exit 1
  fi
fi

echo "✅ すべてのドキュメント更新確認が完了しました"
```

### **自動更新テンプレート生成**
```bash
#!/bin/bash
# generate-doc-templates.sh

echo "=== ドキュメントテンプレート自動生成 ==="

# 新しいAPIエンドポイントのマニュアルテンプレート生成
generate_api_manual_template() {
  local api_path=$1
  local manual_file="manuals/$(basename $api_path)-api.md"
  
  if [ ! -f "$manual_file" ]; then
    echo "# $(basename $api_path) API マニュアル

## 📋 概要
[このAPIの目的・機能概要]

## 🎯 主要機能
- 機能1: [説明]
- 機能2: [説明]

## 💡 使い方・操作手順
### 基本的な使用方法
1. [手順1]
2. [手順2]

### APIエンドポイント
\`\`\`
GET/POST $(echo $api_path | sed 's/src\/app//g' | sed 's/route.ts//g')
\`\`\`

### リクエスト例
\`\`\`json
{
  \"example\": \"request\"
}
\`\`\`

### レスポンス例
\`\`\`json
{
  \"example\": \"response\"
}
\`\`\`

## 🔧 設定・パラメータ
[設定項目の説明]

## ❗ 注意事項・制限
[重要な注意点]

## 🆘 トラブルシューティング
[よくある問題と解決方法]

## 🔗 関連機能
[関連する機能への参照]
" > "$manual_file"
    echo "📝 マニュアルテンプレート生成: $manual_file"
  fi
}

# 新しいAPIを検出してテンプレート生成
find src/app/api -name "route.ts" -newer manuals/ 2>/dev/null | while read api_file; do
  generate_api_manual_template "$api_file"
done
```

---

## 📊 Issue管理・ドキュメント更新の統合フロー

### **統合フロー全体像**
```
機能実装・変更
    ↓
自動検出・チェック実行
    ↓
⚠️ 問題検出 → Issue自動作成
    ↓
実装完了時強制確認
    ↓
❌ 未完了 → コミット拒否
✅ 完了 → コミット許可
    ↓
進捗報告更新
    ↓
フェーズ完了判定
```

### **Issue解決時の統合フロー**
```bash
# Issue解決時の自動処理
resolve_issue() {
  local issue_file=$1
  
  echo "=== Issue解決処理開始 ==="
  
  # 1. Issue記録更新
  echo "Issue記録を解決済みに更新..."
  sed -i 's/- \[ \] 完了/- [x] 完了/' "$issue_file"
  echo "解決日時: $(date '+%Y年%m月%d日 %H:%M')" >> "$issue_file"
  
  # 2. 進捗報告から削除
  echo "進捗報告からIssue削除..."
  issue_title=$(head -1 "$issue_file" | sed 's/# Issue: //')
  sed -i "/$issue_title/d" phases/current/PROGRESS_REPORT.md
  
  # 3. 関連ドキュメントの更新確認
  echo "関連ドキュメント更新確認..."
  if grep -q "FEATURE\|IMPROVEMENT" "$issue_file"; then
    echo "機能追加・改善Issueです。ドキュメント更新を確認してください。"
    read -p "関連ドキュメント更新完了？ (y/n): " doc_updated
    if [[ "$doc_updated" != "y" ]]; then
      echo "⚠️  ドキュメント更新を完了してから解決処理を行ってください"
      return 1
    fi
  fi
  
  # 4. Todoリスト同期
  echo "TodoWrite でIssue完了をマーク..."
  # TodoWrite呼び出し（実際の実装では適切に呼び出し）
  
  # 5. アーカイブ判定
  if grep -q "重要度: 低" "$issue_file"; then
    echo "低重要度Issueをアーカイブします"
    mkdir -p issues/archive/
    mv "$issue_file" "issues/archive/"
  fi
  
  echo "✅ Issue解決処理完了"
}
```

---

## 🔧 自動化・効率化の実装

### **Git Hooks統合**
```bash
# .git/hooks/pre-commit
#!/bin/bash
# ドキュメント一貫性チェックをコミット前に実行

./scripts/doc-consistency-check.sh
if [ $? -ne 0 ]; then
  echo "❌ ドキュメント一貫性チェックでエラーが発生しました"
  echo "問題を解決してから再度コミットしてください"
  exit 1
fi

./scripts/pre-commit-doc-check.sh
if [ $? -ne 0 ]; then
  echo "❌ ドキュメント更新確認でエラーが発生しました"
  exit 1
fi

echo "✅ すべてのチェックが完了しました"
```

### **定期実行タスク**
```bash
# .github/workflows/doc-consistency.yml
name: Document Consistency Check

on:
  schedule:
    - cron: '0 9 * * 1'  # 毎週月曜日9時
  workflow_dispatch:

jobs:
  consistency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: ドキュメント一貫性チェック
        run: |
          ./scripts/doc-consistency-check.sh
          
      - name: Issue自動作成（問題検出時）
        if: failure()
        run: |
          ./scripts/create-consistency-issue.sh
```

### **Claude Code用のヘルパーコマンド**
```bash
# 開発ルーティーン用のコマンドエイリアス
alias issue_create="./scripts/create-issue.sh"
alias issue_resolve="./scripts/resolve-issue.sh"
alias doc_check="./scripts/doc-consistency-check.sh"
alias doc_update_check="./scripts/pre-commit-doc-check.sh"
alias phase_complete="./scripts/phase-completion-check.sh"

# 使用例
# issue_create FEATURE "新しい分析機能"
# issue_resolve issues/FEATURE_新しい分析機能.md
# doc_check
```

---

## 📈 効果測定・改善

### **測定指標**
```bash
# ドキュメント品質指標
- ドキュメント更新漏れ件数: [月次集計]
- Issue解決時間: [平均日数]
- 重複定義検出・修正件数: [月次集計]
- リンク切れ検出・修正件数: [月次集計]

# 開発効率指標
- Claude Codeリフレッシュ後復帰時間: [分]
- フェーズ完了時のドキュメント完成率: [%]
- Issue管理の負荷: [時間/Issue]
```

### **継続改善プロセス**
```bash
# 月次レビュー項目
[ ] Issue管理の効率性
[ ] ドキュメント更新プロセスの改善点
[ ] 自動化スクリプトの精度向上
[ ] 新しいチェック項目の追加検討
```

---

**管理責任者**: CTO Level  
**適用対象**: 全開発者・Claude Code  
**更新頻度**: システム改善時  
**関連ドキュメント**: DEVELOPMENT_FLOW_PROCEDURES.md, DOCUMENT_FORMATS.md
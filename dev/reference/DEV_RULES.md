# 汎用的開発ルール・技術標準

**最終更新**: 2025年6月30日  
**責任者**: CTO Level  
**目的**: Claude Code リフレッシュ時の開発一貫性確保（技術スタック非依存）

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

#### **統一チェック手法（プロジェクト固有コマンドは別途定義）**
```bash
# 型チェック（各プロジェクトのPROJECT_SPECIFIC_RULES.mdで具体的コマンド定義）
[TYPE_CHECK_COMMAND]

# ビルドチェック（各プロジェクトで定義）
[BUILD_COMMAND]

# リントチェック（各プロジェクトで定義）
[LINT_COMMAND]

# テストチェック（各プロジェクトで定義）
[TEST_COMMAND]
```

#### **判断基準の統一**
```
Type Errors: 必須修正（作業停止）
Type Warnings: 無視可能（継続可能）
Lint Errors: 必須修正（作業停止）
Lint Warnings: 無視可能（継続可能）
Test Failures: 必須修正（作業停止）
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
[SEARCH_COMMAND] "type|interface|enum" [SOURCE_DIR] > temp/existing-types.txt
[SEARCH_COMMAND] "status.*=|Status.*=" [SOURCE_DIR] > temp/existing-statuses.txt

# 重複チェック時は差分確認のみ
diff temp/existing-types.txt temp/new-search-result.txt
```

---

## 🔄 Claude Code リフレッシュ時の標準プロトコル

### **必須読み込みファイル（順序厳守）**
```bash
1. cat CLAUDE.md                           # 絶対ルール確認
2. cat DEV_RULES.md                        # 汎用技術標準確認
3. cat PROJECT_SPECIFIC_RULES.md           # プロジェクト固有ルール確認
4. cat phases/current/PHASE_PLAN.md       # 現在フェーズ計画確認
5. cat phases/current/PROGRESS_REPORT.md  # 進捗状況確認
6. cat phases/current/HANDOVER.md         # 引き継ぎ確認（存在時）
7. TodoRead                                # Todo状況確認
```

### **復帰確認時間**
- **目標**: 5分以内
- **必須**: 迷いなく次のアクションを決定

### **既存システム把握・重複防止プロトコル**

#### **新機能実装前の必須確認**
```bash
# 1. 既存型定義の確認（重複型定義防止）
[SEARCH_COMMAND] "interface|type|enum" [SOURCE_DIR] | grep -i "新機能名"

# 2. 既存ステータス値の確認（COMPLETE vs completed 問題防止）
[SEARCH_COMMAND] "status|Status" [SOURCE_DIR] | grep -E "(=|:)"

# 3. 既存コンポーネント・サービスの確認（重複実装防止）
find [SOURCE_DIR] -name "*新機能関連*.[EXTENSION]" -o -name "*似た機能名*.[EXTENSION]"

# 4. 既存API エンドポイントの確認（重複API防止）
find [API_DIR] -name "*関連機能*" -type d
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
[LINT_COMMAND]                             # コードスタイル一貫性
[TYPE_CHECK_COMMAND]                       # 型定義一貫性
[SEARCH_COMMAND] "TODO|FIXME|HACK" [SOURCE_DIR] # 技術債務確認
```

---

## 🔄 開発ワークフロー

### **作業開始前の必須確認**
```bash
1. pwd && git status && git branch        # 現在位置・ブランチ確認
2. [LINT_COMMAND]                         # コード品質確認
3. [TYPE_CHECK_COMMAND]                   # 型チェック実行
4. [TEST_COMMAND]                         # テスト実行
```

### **新機能実装時**
```bash
1. phases/current/PROGRESS_REPORT.md にタスク追加
2. TodoWrite でタスク管理開始
3. 実装作業
4. 関連ドキュメント更新（必須）
   - [PROJECT_DOCUMENTATION_DIRS] （該当する場合）
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
4. [LINT_COMMAND] && [TYPE_CHECK_COMMAND]
5. Git commit（メッセージ形式遵守）
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
1. [CHECK_AVAILABLE_COMMANDS] 存在しないコマンド実行前に確認
2. ファイル作成前にディレクトリ存在確認
3. ドキュメント更新漏れチェック
4. プロジェクト固有ルールとの整合性確認
```

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

## 🔧 トラブルシューティング

### **よくある問題と解決策**

#### プロジェクト固有コマンドエラー
```bash
# ❌ 失敗パターン
存在しないコマンド実行

# ✅ 正しいパターン  
PROJECT_SPECIFIC_RULES.md でコマンド確認後実行
```

#### ドキュメント不整合
```bash
# 新機能実装後の必須確認
[SEARCH_COMMAND] "新機能名" [DOCUMENTATION_DIRS]
# プロジェクト固有のドキュメント構造確認
```

#### Phase切り替え時
```bash
# 現在フェーズ完了時
mv phases/current/* phases/completed/phase-X/
mkdir -p phases/current
# 次フェーズ準備
```

---

## 📋 開発効率化

### **推奨検索・確認コマンド**
```bash
# プロジェクト全体検索（具体的コマンドはプロジェクト固有）
[SEARCH_COMMAND] "検索語" [SOURCE_DIR]

# ファイル一括確認
find [SOURCE_DIR] -name "*.[EXTENSION]" | head -10

# エラー詳細確認
[TYPE_CHECK_COMMAND] --verbose
```

---

**管理責任者**: CTO Level  
**適用対象**: 全開発者・Claude Code（技術スタック非依存）  
**更新頻度**: 汎用的開発手法変更時のみ  
**プロジェクト固有事項**: PROJECT_SPECIFIC_RULES.md で管理
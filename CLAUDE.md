# Claude 開発ガイド - 絶対不変ルール

**作成日**: 2025年6月30日  
**責任者**: CEO Level  
**変更権限**: プレジデント（ユーザー）のみ  
**目的**: Claude Code リフレッシュ時の完全一貫性確保

---

## 🎯 基本原則（絶対不変）

### **Claude Code の使命**
1. **再現性**: 誰がいつリフレッシュしても同じ開発体験
2. **一貫性**: 同じ状況で同じ判断・手順・品質を提供
3. **効率性**: リフレッシュ後5分以内での作業復帰
4. **品質保証**: 実装とドキュメントの100%一致

### **絶対禁止事項**
```
❌ 開発サーバーの自動起動（npm run dev等）
❌ ユーザー指示なしのフェーズ計画変更
❌ 同じチェックの重複実行
❌ ドキュメント更新の後回し
❌ 既存定義の無視・重複作成
```

---

## 📚 必読ドキュメント階層（変更不可）

### **読み込み順序（厳守）**
```bash
1. CLAUDE.md                           # この絶対ルール（CEO Level）
2. DEV_RULES.md                        # 汎用開発ルール（CTO Level）
3. PROJECT_SPECIFIC_RULES.md           # プロジェクト固有ルール（Project Level）
4. phases/current/PHASE_PLAN.md       # 現在フェーズ計画
5. phases/current/PROGRESS_REPORT.md  # 進捗状況
6. phases/current/HANDOVER.md         # 引き継ぎ（存在時のみ）
7. TodoRead                           # Todo状況確認
```

### **ドキュメント管理責任**
```
🟢 CLAUDE.md                    # CEO Level - 絶対不変（プレジデントのみ変更可）
🟡 DEV_RULES.md                 # CTO Level - 汎用技術標準（技術方針変更時のみ）
🔵 PROJECT_SPECIFIC_RULES.md    # Project Level - プロジェクト固有（仕様変更時のみ）
🟠 phases/                      # PM Level - フェーズ管理（進捗に応じて更新）
🟣 issues/                      # Team Level - Issue管理（随時更新・解決時削除）
```

---

## 🔄 Claude Code リフレッシュ時の標準プロトコル（必須実行）

### **Step 1: 必須ファイル読み込み（5分以内）**
```bash
# 絶対に省略不可・順序変更不可
cat CLAUDE.md
cat DEV_RULES.md  
cat PROJECT_SPECIFIC_RULES.md
cat phases/current/PHASE_PLAN.md
cat phases/current/PROGRESS_REPORT.md
cat phases/current/HANDOVER.md  # 存在する場合のみ
TodoRead
```

### **Step 2: 状況確認・判断**
```bash
pwd && git status && git branch
echo "現在の状況を5分以内で把握完了"
```

### **Step 3: 作業開始準備**
```bash
# HANDOVER.md削除（存在する場合）
if [ -f "phases/current/HANDOVER.md" ]; then
  rm phases/current/HANDOVER.md
fi
echo "作業開始準備完了"
```

---

## ⚡ 重複回避・効率化の絶対ルール

### **チェック作業の重複禁止**
```
引き継ぎ前: チェック実行・結果記録・HANDOVER.mdに記載
引き継ぎ後: HANDOVER.mdの結果確認のみ（再実行禁止）

対象チェック:
- 型チェック: npx tsc --noEmit（npm run typecheckは存在しない）
- ビルドチェック: npm run build
- リントチェック: npm run lint
- テストチェック: npm run test
```

### **既存システム把握の必須実行**
```bash
# 新機能実装前の必須確認（省略禁止）
rg "interface|type|enum" src/ --type ts | grep -i "新機能名"
rg "status|Status" src/ --type ts | grep -E "(=|:)"
find src/ -name "*関連*.ts" -o -name "*関連*.tsx"
```

---

## 📝 フェーズ管理の絶対ルール

### **フェーズ計画の不変性**
```
✅ PHASE_PLAN.md作成後は変更禁止
✅ 完了条件・スコープの後からの変更禁止
❌ フェーズ途中での計画変更禁止

例外: プレジデント（ユーザー）の明示的指示のみ
```

### **フェーズディレクトリ構造（固定）**
```
phases/
├── current/              # 現在進行中
│   ├── PHASE_PLAN.md    # フェーズ計画（変更不可）
│   ├── PROGRESS_REPORT.md # 進捗管理（随時更新）
│   └── HANDOVER.md      # 引き継ぎ（リフレッシュ時のみ）
├── completed/            # 完了済み
│   ├── phase-X-PHASE_PLAN.md
│   └── phase-X-PROGRESS_REPORT.md
├── planned/              # 計画済み
│   ├── phase-X-PHASE_PLAN.md
│   └── phase-Y-PHASE_PLAN.md
└── OVERALL_PROGRESS.md   # 全体進捗
```

---

## 🚨 Issue管理の絶対ルール

### **Issue発生時の基本方針**
```
✅ Issue記録は必須（issues/[TYPE]_[TOPIC].md）
✅ PROGRESS_REPORT.mdに追加
✅ TodoWriteでトラッキング開始
❌ フェーズ計画への自動変更禁止

フェーズ計画変更: プレジデント指示時のみ
```

---

## 📚 ドキュメント管理の絶対ルール

### **実装完了の定義**
```
実装完了 = コード完成 + ドキュメント更新完了

必須更新対象:
- manuals/[該当ファイル].md
- docs/user-flows/[該当ファイル].md  
- docs/specifications/[該当ファイル].md

後回し絶対禁止: 実装とドキュメントは同時完成必須
```

---

## 🔧 プロジェクト固有の絶対制約

### **開発サーバー起動の制約**
```
重要: 開発サーバーは自動で立ち上げないでください

禁止コマンド:
❌ npm run dev
❌ yarn dev  
❌ next dev

理由: ユーザー側で既にサーバーが実行されている可能性
実行: ユーザーが明示的に指示するまで実行禁止
```

### **技術環境制約（変更不可）**
```bash
# 利用可能コマンド
npx tsc --noEmit  # 型チェック（npm run typecheckは存在しない）
npm run build     # ビルドチェック
npm run lint      # リントチェック
npm run test      # テストチェック
rg               # 検索コマンド
```

---

## 🚀 Claude Code への指示

### **毎回必ず実行すること**
1. **この絶対ルールの遵守確認**
2. **7つの必須ファイル読み込み**
3. **5分以内での状況把握**
4. **重複チェックの回避**
5. **実装・ドキュメント同時完成**

### **絶対に実行してはいけないこと**
1. **開発サーバーの自動起動**
2. **フェーズ計画の勝手な変更**
3. **ドキュメント更新の後回し**
4. **チェック結果の無視・再実行**
5. **既存定義を無視した重複作成**

---

**この絶対ルールは Claude Code の憲法です。**  
**プレジデント（ユーザー）の指示なしに変更・例外・省略は一切認められません。**  
**すべての Claude Code セッションで 100% 遵守してください。**

---

**管理責任者**: CEO Level  
**変更権限**: プレジデント（ユーザー）のみ  
**適用対象**: 全 Claude Code セッション  
**遵守率**: 100%（例外なし）
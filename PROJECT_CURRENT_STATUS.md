# 📊 Project Current Status - FIND to DO Management App

**最終更新**: 2025年6月29日  
**プロジェクトマネージャー**: Development Lead  
**現在フェーズ**: Phase 4 - Reverse Engineering & Enhancement  
**Claude Code指示書**: このファイルが現在の作業指示の最新版です

---

## 🎯 Current Sprint Status

### **今すぐ着手すべき作業（優先度順）**

#### 1. 🚨 最優先: リアルタイム監視機能の修正
- **Issue**: `docs/issues/TECHNICAL_ISSUES_REALTIME_MONITORING.md`
- **Status**: 解決策選択待ち
- **Action**: Vercel Cron Jobs または GitHub Actions選択・実装
- **Deadline**: 2025年7月5日まで

#### 2. 📋 継続作業: 分析マニュアル完成
- **残り作業**: 3つのマニュアル作成
  - `manuals/08-5-project-analytics.md`
  - `manuals/08-6-social-analytics.md`  
  - `manuals/08-7-realtime-features.md`
- **Status**: 4/7完了（57%）
- **Deadline**: 2025年7月10日まで

#### 3. 🔍 承認待ち: ユーザー登録システム拡張
- **Issue**: `docs/issues/FEATURE_REQUEST_USER_REGISTRATION_ENHANCEMENT.md`
- **Status**: オーナー承認待ち
- **Action**: 承認後に段階的実装開始

---

## 📂 Active Development Areas

### **Currently Working Directory Structure**
```
/mnt/c/find-to-do-management-app/
├── 🟢 CLAUDE.md                    # CEO Level - 絶対不変
├── 🟡 CLAUDE_ENHANCED_CONSISTENCY_RULES.md  # CTO Level - 技術標準
├── 🔵 PROJECT_CURRENT_STATUS.md    # PM Level - 現在の指示（このファイル）
├── docs/
│   ├── 🔵 ISSUES_INDEX.md          # PM Level - Issue管理
│   └── issues/                     # Team Level - 個別Issue
├── manuals/                        # Team Level - 進行中マニュアル
└── src/                           # Team Level - 実装コード
```

### **Document Lifecycle Management**
```
🟢 永続的（変更禁止）: CLAUDE.md
🟡 基盤ルール（CTO承認のみ）: ENHANCED_CONSISTENCY_RULES.md
🔵 プロジェクト管理（PM更新）: PROJECT_CURRENT_STATUS.md, ISSUES_INDEX.md
🟠 作業文書（完了後削除）: Phase計画書、一時的Issue、完了済みバグ
```

---

## 🚀 New Claude Code Session Protocol

### **リフレッシュ後の標準起動手順**

#### Step 1: 必須ファイル確認（順序厳守）
```bash
# 1. 絶対ルールの確認
cat CLAUDE.md

# 2. 技術標準の確認  
cat CLAUDE_ENHANCED_CONSISTENCY_RULES.md

# 3. 現在の作業指示確認（このファイル）
cat PROJECT_CURRENT_STATUS.md

# 4. 現在の状況把握
pwd && git status && git branch
TodoRead
```

#### Step 2: 現在フェーズの確認
```bash
# Active Issue確認
cat docs/ISSUES_INDEX.md | head -20

# 進行中作業の確認
ls -la manuals/08-*.md | grep -v "archive"
```

#### Step 3: 作業開始確認プロンプト
```
新Claude Codeは以下を確認後、作業開始:
"現在のPhase 4作業を継続しますか？
それとも新しい指示がありますか？

優先作業:
1. リアルタイム監視修正
2. 分析マニュアル完成  
3. ユーザー登録拡張（承認待ち）"
```

---

## 📋 Current Active Issues

### **🚨 Technical Issues（要対応）**
| Issue | File | Priority | Deadline |
|-------|------|----------|----------|
| リアルタイム監視ギャップ | `docs/issues/TECHNICAL_ISSUES_REALTIME_MONITORING.md` | High | 2025-07-05 |

### **🚀 Feature Requests（承認待ち）**
| Request | File | Status | Approver |
|---------|------|--------|----------|
| ユーザー登録拡張 | `docs/issues/FEATURE_REQUEST_USER_REGISTRATION_ENHANCEMENT.md` | 承認待ち | Product Owner |

### **📖 Documentation Tasks（進行中）**
| Task | Progress | Assignee | Deadline |
|------|----------|----------|----------|
| 分析マニュアル群 | 4/7 (57%) | Development Team | 2025-07-10 |

---

## 🎯 Sprint Goals & KPIs

### **Phase 4 Completion Criteria**
- [ ] リアルタイム監視問題解決（技術課題）
- [ ] 分析マニュアル7個完成（ドキュメント）
- [ ] LINE連携マニュアル完成（✅ 完了済み）
- [ ] Issue管理システム確立（✅ 完了済み）

### **Success Metrics**
- **技術債務**: リアルタイム監視の実装ギャップ解決
- **ドキュメント完成度**: 20個→27個マニュアル（135%拡張）
- **ユーザビリティ**: LINE↔Web統合体験の確立

---

## ⚙️ Development Workflow Rules

### **ファイル作成・削除ルール**

#### 新規Issue作成時
```bash
# 1. 個別Issueファイル作成
touch docs/issues/[TYPE]_[SPECIFIC_TOPIC].md

# 2. INDEX更新（必須）
# docs/ISSUES_INDEX.md に追加

# 3. PROJECT_CURRENT_STATUS.md 更新（必須）
# このファイルのActive Issuesセクション更新
```

#### Issue解決時
```bash
# 1. 解決済みマーク
# docs/ISSUES_INDEX.md でステータス更新

# 2. 一時的Issueは削除
mv docs/issues/[RESOLVED_ISSUE].md archive/

# 3. PROJECT_CURRENT_STATUS.md から削除
# Active Issuesから除外
```

### **作業完了時のクリーンアップ**

#### Phase完了時
```bash
# 1. 完了済み計画書をアーカイブ
mkdir -p archive/phase-plans/
mv docs/phase-plans/PHASE4_*.md archive/phase-plans/

# 2. 一時的ドキュメントを削除
rm -f *HANDOVER*.md  # 引き継ぎ書は削除
rm -f *TEMPORARY*.md  # 一時ファイル削除

# 3. PROJECT_CURRENT_STATUS.md 更新
# 次のPhaseに向けた更新
```

---

## 🔄 Directory Lifecycle Management

### **永続ディレクトリ（削除禁止）**
```
/src/                  # ソースコード
/manuals/              # ユーザーマニュアル
/docs/issues/          # Issue管理
```

### **一時ディレクトリ（Phase完了時削除）**
```
/docs/phase-plans/     # Phase計画書
/archive/              # 一時アーカイブ
/temp/                 # 作業用一時ファイル
```

### **アーカイブルール**
```
完了済みPhase計画書 → archive/phase-plans/
解決済みIssue → archive/issues/
廃止された機能ドキュメント → archive/deprecated/
```

---

## 🎯 Next Claude Code Instructions

### **即座に実行すべきコマンド**
```bash
# 現状確認
cat CLAUDE.md
cat CLAUDE_ENHANCED_CONSISTENCY_RULES.md  
cat PROJECT_CURRENT_STATUS.md
pwd && git status && TodoRead

# 作業選択
echo "優先作業:"
echo "1. リアルタイム監視修正"
echo "2. 分析マニュアル完成"
echo "3. 新しい指示待ち"
```

### **作業開始前の確認事項**
- [ ] 最優先Issue（リアルタイム監視）の状況確認
- [ ] 進行中マニュアル（08-5,08-6,08-7）の状況確認  
- [ ] 新しい指示・変更がないか確認

### **作業完了後の必須更新**
- [ ] TodoWrite でステータス更新
- [ ] PROJECT_CURRENT_STATUS.md の進捗反映
- [ ] docs/ISSUES_INDEX.md の状況更新

---

## 📞 Escalation & Decision Points

### **技術判断が必要な場合**
- リアルタイム監視の解決策選択
- 新しい技術スタックの導入
- アーキテクチャの大幅変更

### **プロダクト判断が必要な場合**  
- ユーザー登録拡張の承認
- 新機能の優先度決定
- リソース配分の変更

### **即座に実行可能な作業**
- 分析マニュアルの継続作成
- 既存Issue の調査・対応
- ドキュメントの改善・更新

---

**管理責任者**: Development Lead  
**適用期間**: Phase 4 完了まで  
**次回更新**: Issue解決・新指示受領時  
**Claude Code**: このファイルの指示に従って作業実行
# 📁 ファイル整理・統合計画書

**作成日**: 2025-06-16  
**目的**: 散らばったスクリプト・不要ファイルの整理とscriptsディレクトリ統合

---

## 🎯 **現状分析**

### **散らばったファイルの現状**

#### **ルートレベルのスクリプトファイル（8ファイル）**
| ファイル | 用途 | 使用頻度 | 処理方針 |
|---------|------|----------|----------|
| `gas-complete-unified-system.js` | **現在使用中**のGAS統合システム | 高 | 🟢 保持 |
| `backup_gas_v1.gs` | GASバックアップ | 低 | 🔄 scripts/archiveに移動 |
| `check-database-data.js` | DB確認用 | 中 | 🔄 scripts/operationsに移動 |
| `check-tab-ids.js` | タブID確認用 | 低 | 🔄 scripts/operationsに移動 |
| `generate-remaining-summaries.js` | 要約生成用 | 低 | 🔄 scripts/operationsに移動 |
| `generate-summaries.js` | 要約生成用（旧版） | 低 | 🔄 scripts/archiveに移動 |
| `import-seed-data.js` | シードデータ | 中 | 🔄 scripts/setupに移動 |
| `register-users.js` | ユーザー登録用 | 中 | 🔄 scripts/setupに移動 |

#### **gas-archiveディレクトリ（32ファイル）**
| カテゴリ | ファイル数 | 処理方針 |
|----------|------------|----------|
| DocumentSyncScript_v3_*.gs | 7ファイル | 🗑️ 削除（最新版が別途存在） |
| fix-*.js | 8ファイル | 🗑️ 削除（一時修正用） |
| test-*.* | 11ファイル | 🗑️ 削除（開発時テスト用） |
| update-*.js | 6ファイル | 🗑️ 削除（一時更新用） |

#### **scriptsディレクトリ（19ファイル）**
| カテゴリ | ファイル数 | 状態 |
|----------|------------|------|
| check-*.js | 4ファイル | ✅ 適切に整理済み |
| setup系 | 3ファイル | ✅ 適切に整理済み |
| migration系 | 2ファイル | ✅ 適切に整理済み |
| operation系 | 10ファイル | ✅ 適切に整理済み |

---

## 📋 **整理計画**

### **Phase 1: gas-archiveディレクトリ削除**
**対象**: 32ファイル（完全に不要）
```bash
# 安全な削除確認
ls -la gas-archive/
# 削除実行
rm -rf gas-archive/
```

**理由**:
- 現在のGAS統合システム（gas-complete-unified-system.js）で全機能カバー済み
- テスト・修正用ファイルは開発完了により不要
- バージョン管理で履歴は保持済み

### **Phase 2: ルートスクリプトファイル整理**

#### **2.1 scriptsディレクトリ構造再編**
```
scripts/
├── setup/           # 初期設定・セットアップ
│   ├── import-seed-data.js
│   ├── register-users.js
│   └── seed-users.ts
├── operations/      # 日常運用・確認
│   ├── check-database-data.js
│   ├── check-tab-ids.js
│   ├── generate-remaining-summaries.js
│   └── [既存の運用ファイル]
├── migration/       # データ移行
│   └── migrate-tasks.ts
└── archive/         # アーカイブ
    ├── backup_gas_v1.gs
    └── generate-summaries.js (旧版)
```

#### **2.2 移動対象ファイル**
| 現在の場所 | 移動先 | 理由 |
|-----------|--------|------|
| `/check-database-data.js` | `/scripts/operations/` | 運用確認用 |
| `/check-tab-ids.js` | `/scripts/operations/` | 運用確認用 |
| `/generate-remaining-summaries.js` | `/scripts/operations/` | 運用処理用 |
| `/import-seed-data.js` | `/scripts/setup/` | 初期設定用 |
| `/register-users.js` | `/scripts/setup/` | 初期設定用 |
| `/backup_gas_v1.gs` | `/scripts/archive/` | バックアップ |
| `/generate-summaries.js` | `/scripts/archive/` | 旧版アーカイブ |

#### **2.3 保持するルートファイル**
- `gas-complete-unified-system.js` - 現在使用中の統合システム
- `next.config.js` - Next.js設定（移動不可）

---

## 🚀 **実行手順**

### **Step 1: 安全性確認**
```bash
# 現在使用中のファイル確認
grep -r "gas-archive" . --exclude-dir=node_modules
grep -r "check-database-data" . --exclude-dir=node_modules

# バックアップ作成（念のため）
tar -czf file-cleanup-backup-$(date +%Y%m%d).tar.gz gas-archive/ *.js *.gs
```

### **Step 2: ディレクトリ構造作成**
```bash
mkdir -p scripts/setup
mkdir -p scripts/operations  
mkdir -p scripts/archive
```

### **Step 3: ファイル移動**
```bash
# setup系
mv import-seed-data.js scripts/setup/
mv register-users.js scripts/setup/

# operations系
mv check-database-data.js scripts/operations/
mv check-tab-ids.js scripts/operations/
mv generate-remaining-summaries.js scripts/operations/

# archive系
mv backup_gas_v1.gs scripts/archive/
mv generate-summaries.js scripts/archive/
```

### **Step 4: 不要ディレクトリ削除**
```bash
# 最終確認
ls -la gas-archive/

# 削除実行
rm -rf gas-archive/
```

### **Step 5: 整理後確認**
```bash
# ルートディレクトリ確認
ls -la *.js *.gs

# scripts構造確認
tree scripts/
```

---

## 📊 **効果・メリット**

### **整理前 → 整理後**
| 項目 | 整理前 | 整理後 | 改善 |
|------|--------|--------|------|
| **ルートファイル数** | 41ファイル(.js/.gs) | 2ファイル | **95%削減** |
| **gas-archive** | 32ファイル | 削除 | **完全整理** |
| **scripts構造** | フラット構造 | 階層構造 | **分類明確化** |

### **開発効率向上**
- 🎯 **目的明確化**: ファイルの用途が構造から分かる
- 🔍 **検索効率**: 必要なスクリプトを即座に特定
- 🧹 **保守性向上**: 不要ファイルによる混乱解消
- 📱 **新規参加者**: 直感的な構造理解

### **リスク軽減**
- 🚫 **誤削除防止**: 重要ファイルと不要ファイルの明確分離
- 📂 **バージョン管理**: アーカイブによる履歴保持
- 🔒 **安全性向上**: 現在使用中ファイルの保護

---

## ⚠️ **注意事項・制約**

### **移動禁止ファイル**
- `gas-complete-unified-system.js` - **現在使用中**
- `next.config.js` - Next.js設定ファイル
- `package.json`, `tsconfig.json` 等 - 設定ファイル

### **削除前確認事項**
- [ ] gas-archiveファイルが他所から参照されていないか
- [ ] 移動対象ファイルの依存関係確認
- [ ] バックアップ作成完了確認

### **実行後作業**
- [ ] README.mdのscripts説明更新
- [ ] ドキュメント内のファイルパス更新
- [ ] チーム共有（ファイル移動の通知）

---

## 📚 **関連ドキュメント更新**

### **更新対象**
1. **README.md**: scriptsディレクトリ説明追加
2. **DEVELOPER_REFERENCE_INDEX.md**: ファイルパス更新
3. **MASTER_DEVELOPMENT_PROMPT.md**: 運用スクリプト情報更新

### **新規作成**
1. **scripts/README.md**: scripts使用方法説明
2. **運用マニュアル**: 各スクリプトの使用手順

---

**この整理により、プロジェクトの保守性・可読性が大幅に向上し、新規参加者の理解も促進されます。**

*計画作成日: 2025-06-16*  
*実行予定: 即座に実行可能*
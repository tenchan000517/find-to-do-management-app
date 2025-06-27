# バックアップ戦略と文書管理ガイドライン

## 🛡️ 多層防御バックアップ戦略

### 1. リアルタイムバックアップ
```bash
# 重要文書の自動バックアップスクリプト
#!/bin/bash
BACKUP_DIR="/mnt/c/find-to-do-backup/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# docsフォルダの完全バックアップ
rsync -av --delete ./docs/ "$BACKUP_DIR/docs/"

# 重要ファイルのリスト化
find . -name "*.md" -o -name "*.json" | grep -E "(docs|archive|scripts)" > "$BACKUP_DIR/important_files.txt"
```

### 2. Git戦略の改善

#### ブランチ保護
```bash
# 文書専用ブランチの作成
git checkout -b docs-backup
git add docs/ archive/
git commit -m "Documentation backup $(date)"
git push origin docs-backup
```

#### 危険なコマンドの回避
```bash
# ❌ 絶対に使用しない
git filter-branch --index-filter "git rm -r --cached --ignore-unmatch docs/"

# ✅ 安全な代替手段
# 1. 特定ファイルのみを.gitignoreに追加
echo "secrets.env" >> .gitignore
git rm --cached secrets.env
git commit -m "Remove sensitive file"

# 2. 履歴を保持したまま移動
git mv sensitive-file.txt archive/removed/
```

### 3. 定期エクスポート

#### 週次バックアップ
- 毎週金曜日: 全文書をZIPアーカイブ
- Google Drive/OneDriveへアップロード
- 3世代保持（3週間分）

#### 月次スナップショット
- 月末: プロジェクト全体のスナップショット
- 外部ストレージに保存
- 6ヶ月保持

### 4. 文書管理ルール

#### ディレクトリ構造
```
docs/
├── current/          # 現在の文書
├── archive/          # アーカイブ済み
├── templates/        # テンプレート
└── backup-index.md   # バックアップ履歴

.backup/              # ローカルバックアップ（.gitignore）
└── daily/           # 日次自動バックアップ
```

#### 命名規則
- 日付プレフィックス: `YYYYMMDD_document_name.md`
- バージョン番号: `v1.0`, `v1.1`
- ステータスサフィックス: `_DRAFT`, `_FINAL`, `_ARCHIVED`

### 5. 復旧手順

#### レベル1: ローカル復旧
```bash
# 直近のバックアップから復元
cp -r .backup/daily/latest/docs/* ./docs/
```

#### レベル2: Git履歴から復旧
```bash
# 特定コミットから復元
git checkout <commit-hash> -- docs/
```

#### レベル3: 外部バックアップ
1. Google Drive/OneDriveから最新のZIPをダウンロード
2. 展開して必要なファイルを復元

### 6. 予防措置

#### pre-commitフック
```bash
#!/bin/bash
# .git/hooks/pre-commit

# 重要ファイルの削除を検知
deleted_docs=$(git diff --cached --name-only --diff-filter=D | grep -E "(docs/|\.md$)")
if [ ! -z "$deleted_docs" ]; then
    echo "⚠️  警告: 重要文書の削除が検出されました:"
    echo "$deleted_docs"
    echo "本当に削除しますか？ (y/N)"
    read confirm
    if [ "$confirm" != "y" ]; then
        exit 1
    fi
fi
```

#### 権限管理
- `main`ブランチ: 保護設定
- Force push: 無効化
- 削除操作: レビュー必須

### 7. 災害復旧計画

#### 優先順位
1. **最優先**: 要件定義、仕様書
2. **高**: 実装ガイド、API仕様
3. **中**: 進捗レポート、議事録
4. **低**: 一時的なメモ、下書き

#### 復旧時間目標
- RPO (Recovery Point Objective): 1日
- RTO (Recovery Time Objective): 4時間

### 8. 定期監査

#### 月次チェックリスト
- [ ] バックアップの完全性確認
- [ ] 復旧テストの実施
- [ ] 文書インベントリの更新
- [ ] アクセス権限の見直し

### 9. ツール推奨

#### バックアップツール
- **rsync**: ローカル同期
- **rclone**: クラウドストレージ同期
- **git-lfs**: 大容量ファイル管理

#### 文書管理
- **Obsidian**: Markdown管理
- **Notion**: チーム共有
- **Confluence**: エンタープライズ

### 10. 緊急連絡先

- バックアップ管理者: [担当者名]
- クラウドストレージ管理: [担当者名]
- Git管理者: [担当者名]

---

**重要**: このガイドラインは定期的に見直し、更新すること。バックアップは保険と同じ - 必要になってからでは遅い。

*最終更新: 2025年6月28日*
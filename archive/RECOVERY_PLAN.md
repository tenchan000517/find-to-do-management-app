# 文書復旧計画

## 🔄 失われた文書の再構築計画

### Phase 1: 即座に再構築可能な文書

以下の文書は、現在のコードベースから情報を抽出して再構築できます：

#### 1. API仕様書
- ソース: `src/app/api/`ディレクトリ
- 方法: 各routeファイルからエンドポイント仕様を抽出

#### 2. データベース設計書
- ソース: `prisma/schema.prisma`
- 方法: スキーマから自動生成

#### 3. 環境変数ガイド
- ソース: 実際の使用箇所を検索
- 方法: コード内の`process.env`参照を収集

### Phase 2: コミット履歴から推測

#### 完了済みPhase 1-12の内容
```bash
# Phase別の変更内容を抽出
git log --grep="Phase [0-9]" --oneline > phase_history.txt
git log --grep="フェーズ[0-9]" --oneline >> phase_history.txt
```

### Phase 3: 実装から逆算

#### 現在の機能一覧
1. **認証システム** (Phase 1)
   - Google OAuth
   - ロールベースアクセス制御

2. **タスク管理** (Phase 2-3)
   - カンバンボード
   - ドラッグ&ドロップ

3. **カレンダー** (Phase 3-4)
   - イベント管理
   - 繰り返し設定

4. **AI統合** (Phase 7, 10-12)
   - Gemini API
   - コンテンツ分析

5. **外部連携** (Phase 8-11)
   - LINE Bot
   - Discord
   - Google Docs

### 優先復旧リスト

#### 最優先（今週中）
1. [ ] 要件定義書の再作成
2. [ ] API仕様書の自動生成
3. [ ] データベース設計書

#### 高優先（来週）
1. [ ] LINE Bot設定ガイド
2. [ ] Discord統合ガイド
3. [ ] デプロイ手順書

#### 中優先（再来週）
1. [ ] Phase 1-12の詳細記録
2. [ ] トラブルシューティングガイド
3. [ ] パフォーマンスチューニングガイド

### 再構築用スクリプト

```bash
#!/bin/bash
# 文書再構築支援スクリプト

# APIドキュメント生成
echo "# API仕様書" > docs/API_SPECIFICATION.md
echo "自動生成日: $(date)" >> docs/API_SPECIFICATION.md

# 各APIルートを検索
find src/app/api -name "route.ts" | while read file; do
    echo "## $(dirname $file | sed 's|src/app/api/||')" >> docs/API_SPECIFICATION.md
    # メソッドを抽出
    grep -E "export async function (GET|POST|PUT|DELETE|PATCH)" "$file" >> docs/API_SPECIFICATION.md
done

# 環境変数一覧
echo "# 環境変数一覧" > docs/ENV_VARIABLES.md
grep -r "process.env" src/ | grep -oE "process\.env\.[A-Z_]+" | sort -u >> docs/ENV_VARIABLES.md
```

### Windows復元ポイントからの部分復旧

6/26の復元ポイントから回復可能な可能性があるファイル：
- 要件定義書
- 初期設計文書
- Phase 1-6のガイド

### 今後の行動計画

1. **今日中**
   - Windows復元ポイントの確認
   - 回復可能なファイルのリストアップ

2. **明日**
   - API仕様書の自動生成開始
   - データベース設計書の作成

3. **今週末**
   - Phase 17-27計画の詳細化
   - バックアップシステムの実装

---

**注意**: この復旧作業は段階的に進め、新たに作成した文書は即座にバックアップすること。

*作成日: 2025年6月28日*
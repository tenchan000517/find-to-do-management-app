# GA4統合分析ダッシュボード　開発ワークフロー

## 🎯 エンジニア共通開発プロンプト

### 開始時の必須確認事項

```bash
# 1. 現在のフェーズ確認
git log --oneline -10  # 最新コミットから進捗確認

# 2. 実装状況確認
curl http://localhost:3000/api/analytics/test  # 基盤テスト

# 3. ドキュメント参照順序
# ①README.md → ②該当フェーズ実装ガイド → ③技術仕様書
```

---

## 📋 開発ルーティーン

### Step 1: コンテキスト把握（5分）
```markdown
1. `README.md` で全体状況確認
2. `git log --oneline --since="1 week ago"` で直近の進捗確認
3. 現在のフェーズを特定（1-4のどこか）
4. `PHASE_IMPLEMENTATION_GUIDE.md` の該当セクション読み込み
```

### Step 2: 作業環境準備（5分）
```bash
# 依存関係確認
npm install

# 環境変数確認
echo $GA4_PROPERTY_ID
echo $GOOGLE_APPLICATION_CREDENTIALS

# 開発サーバー起動
npm run dev

# 接続テスト
curl http://localhost:3000/api/analytics/test
```

### Step 3: 実装作業（主作業）
```markdown
# 実装優先順位
1. `PHASE_IMPLEMENTATION_GUIDE.md` のコード例をベースに実装
2. `TECHNICAL_SPECIFICATIONS.md` で仕様詳細確認
3. 既存コンポーネント（recharts等）を最大活用
4. エラーハンドリングは既存パターンに準拠

# 実装判断基準
- 実現可能性80%未満の機能は実装しない
- 新規パッケージ追加は極力避ける
- 既存システムパターンを必ず踏襲
```

### Step 4: 進捗コミット（15分毎）
```bash
# 作業単位でのコミット
git add .
git commit -m "フェーズ[X]: [具体的な実装内容] - [動作状況]

詳細:
- 実装: [何を実装したか]
- テスト: [動作確認内容] 
- 次回: [次に実装すべき内容]
- 課題: [発生した問題・懸念点]

進捗: [X]/[総計]完了"

# 例:
git commit -m "フェーズ2: GA4基本レポート取得API実装 - 動作確認済み

詳細:
- 実装: src/lib/services/ga4-reports-service.ts基本メトリクス取得
- テスト: /api/analytics/dashboard?days=7 で正常レスポンス確認
- 次回: Search Console API連携実装
- 課題: レート制限警告が出るため調整必要

進捗: 2/4フェーズ完了"
```

---

## ⚠️ コンテキスト40%警告時の引継ぎプロセス

### 引継ぎコミット作成
```bash
git commit -m "【引継ぎ】フェーズ[X]途中引継ぎ - [進捗率]%完了

## 現在の状況
- 完了: [完了した機能リスト]
- 実装中: [途中の作業内容]
- 未着手: [残りタスク]

## 動作確認方法
1. npm run dev
2. curl [テストコマンド]
3. [期待される結果]

## 次の作業者への指示
1. [最優先で実装すべき内容]
2. [参照すべきドキュメント箇所]
3. [注意すべきポイント]

## 発生中の課題
- [技術的課題]
- [懸念点]
- [要検討事項]

継続ドキュメント: /docs/current-issues/googleanalytics/README.md"
```

### 引継ぎドキュメント更新
```markdown
# /docs/current-issues/googleanalytics/HANDOVER_STATUS.md に追記

## [日付] フェーズ[X] 引継ぎ

### 実装済み機能
- [ ] 機能A (100%)
- [ ] 機能B (70% - [残り作業内容])
- [ ] 機能C (0%)

### 重要な技術情報
- API制限: [現在の使用状況]
- 設定: [特別な設定内容]
- 依存: [追加したパッケージ]

### 次の担当者へ
最優先: [具体的な次のステップ]
参照: PHASE_IMPLEMENTATION_GUIDE.md の [該当セクション]
```

---

## 🔄 フェーズ別クイックガイド

### フェーズ1: 基盤構築
```bash
# 作業内容: 認証・接続テスト
# 参照: PHASE_IMPLEMENTATION_GUIDE.md L1-200
# テスト: curl http://localhost:3000/api/analytics/test
# 期待: {"success": true, "services": {"ga4": true, "searchConsole": true}}
```

### フェーズ2: データ取得
```bash
# 作業内容: GA4・GSC APIサービス実装
# 参照: PHASE_IMPLEMENTATION_GUIDE.md L201-500
# テスト: curl "http://localhost:3000/api/analytics/dashboard?days=7"
# 期待: 基本メトリクス・SEOデータのJSONレスポンス
```

### フェーズ3: UI実装
```bash
# 作業内容: Rechartsダッシュボード・可視化
# 参照: COMPLETE_IMPLEMENTATION_PLAN.md UI章
# テスト: http://localhost:3000/analytics ページ表示
# 期待: チャート・テーブル表示
```

### フェーズ4: 高度分析
```bash
# 作業内容: 予測・アラート・ROI分析
# 参照: DIGITAL_MARKETING_FEATURES.md
# テスト: 各分析機能の動作確認
# 期待: 改善提案・インサイト表示
```

---

## 📞 緊急時サポート

### よくある問題
```bash
# 認証エラー → 環境変数確認
echo $GOOGLE_APPLICATION_CREDENTIALS

# API接続失敗 → プロパティID確認  
echo $GA4_PROPERTY_ID

# レート制限 → 1時間待機または制限値調整
```

### エスカレーション基準
- 2時間以上解決しない技術問題
- 仕様解釈に迷う場合
- パフォーマンス大幅劣化

---

## ✅ 作業完了チェックリスト

### 毎回の作業後
- [ ] テストコマンド実行・正常動作確認
- [ ] コミットメッセージに詳細記載
- [ ] 次回作業内容を明記
- [ ] エラーログ・警告を全て確認

### フェーズ完了時
- [ ] 該当フェーズの全機能動作確認
- [ ] パフォーマンステスト実行
- [ ] 次フェーズの準備状況確認
- [ ] ドキュメント差分があれば更新

このワークフローに従うことで、どのエンジニアでも安全かつ効率的に開発を継続できます。
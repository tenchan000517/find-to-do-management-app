# FIND to DO 実装ガイド (Phase 17-27)

## 🚀 エンジニア向け実装指示書

### 前提条件
- **完了済みフェーズ**: Phase 1-12
- **技術スタック**: Next.js 15, React 19, Prisma, PostgreSQL, TypeScript
- **開発環境**: Node.js 20+, Git, Docker (推奨)

---

## 📋 Phase別実装チェックリスト

### Phase 17: 学生教育システム基盤（3日間）

#### Day 1: データモデル・API基盤
- [ ] Prismaスキーマ更新
  ```prisma
  model StudentProfile {
    id                String   @id @default(cuid())
    userId            String   @unique
    user              User     @relation(fields: [userId], references: [id])
    educationLevel    String
    major             String?
    skills            Json
    portfolioUrl      String?
    careerGoals       Json?
    learningProgress  Json
    createdAt         DateTime @default(now())
    updatedAt         DateTime @updatedAt
  }
  
  model Mentorship {
    id          String   @id @default(cuid())
    mentorId    String
    menteeId    String
    status      String   // ACTIVE, COMPLETED, CANCELLED
    startDate   DateTime
    endDate     DateTime?
    sessions    MentoringSession[]
    createdAt   DateTime @default(now())
  }
  
  model LearningPath {
    id              String   @id @default(cuid())
    title           String
    description     String
    difficulty      String   // BEGINNER, INTERMEDIATE, ADVANCED
    estimatedHours  Int
    skills          Json
    prerequisites   Json?
    modules         Json
    createdAt       DateTime @default(now())
  }
  ```

- [ ] API エンドポイント作成
  - `POST /api/education/profiles` - 学生プロファイル作成
  - `GET /api/education/profiles/:userId` - プロファイル取得
  - `PUT /api/education/profiles/:userId` - プロファイル更新
  - `GET /api/education/learning-paths` - 学習パス一覧
  - `POST /api/education/mentorships` - メンターシップ作成

#### Day 2: UI コンポーネント実装
- [ ] 学生ダッシュボード (`/student-dashboard`)
  - スキルマップ表示
  - 学習進捗グラフ
  - 推奨学習パス
- [ ] メンタリング管理画面
  - セッションスケジューラー
  - フィードバックフォーム
- [ ] ポートフォリオビルダー

#### Day 3: AI統合・テスト
- [ ] Gemini API統合
  - スキルギャップ分析
  - 学習パス推奨アルゴリズム
- [ ] 統合テスト実装
- [ ] パフォーマンステスト

---

### Phase 18: 企業支援機能拡張（3日間）

#### Day 1: タレントプール機能
- [ ] 検索エンジン実装
  - Elasticsearchまたは高度なSQLクエリ
  - スキルベース検索
  - 可用性フィルター
- [ ] マッチングアルゴリズム
  - スキルスコアリング
  - 文化適合性評価

#### Day 2: 研修プログラム管理
- [ ] コース作成ツール
  - ドラッグ&ドロップエディタ
  - マルチメディアサポート
- [ ] 進捗トラッキング
  - リアルタイムダッシュボード
  - レポート生成

#### Day 3: 産学連携機能
- [ ] プロジェクト管理拡張
  - 学生割り当て機能
  - 企業メンター機能
- [ ] 評価システム
  - 360度フィードバック
  - 成果物レビュー

---

### Phase 19: イベント企画・管理（2日間）

#### Day 1: イベント基本機能
- [ ] イベント作成フロー
  - ウィザード形式UI
  - テンプレート機能
- [ ] 参加者管理
  - QRコード生成
  - チェックイン機能

#### Day 2: 分析・コミュニティ
- [ ] イベント分析ダッシュボード
- [ ] フォローアップ自動化
- [ ] コミュニティフォーラム基盤

---

## 🛠️ 実装のベストプラクティス

### 1. コード構成
```
src/
├── features/
│   ├── education/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   ├── enterprise/
│   └── events/
```

### 2. 状態管理
- Zustandまたは Context APIを使用
- サーバー状態は React Query/SWR で管理

### 3. テスト戦略
- 単体テスト: Jest + React Testing Library
- E2Eテスト: Playwright
- カバレッジ目標: 80%以上

### 4. パフォーマンス考慮事項
- 画像最適化: next/image 使用
- コード分割: dynamic imports
- データフェッチ: 並列処理とキャッシング

### 5. セキュリティ
- 入力検証: Zod スキーマ
- 認証: NextAuth セッション検証
- CORS設定: 適切なオリジン制限

---

## 📊 進捗管理

### 日次タスク
1. **朝会** (10分)
   - 前日の完了事項
   - 当日の予定
   - ブロッカー共有

2. **コードレビュー**
   - PR作成時に自動通知
   - 2名以上の承認必須

3. **進捗更新**
   - GitHubプロジェクトボード
   - 完了タスクにチェック

### 週次レビュー
- デモ実施
- メトリクス確認
- 次週計画調整

---

## 🚨 トラブルシューティング

### よくある問題

1. **Prisma マイグレーションエラー**
   ```bash
   npx prisma migrate reset
   npx prisma generate
   ```

2. **型定義の不整合**
   ```bash
   npm run type-check
   npm run lint --fix
   ```

3. **ビルドエラー**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

---

## 📞 サポート

- **技術的質問**: Slackの #dev-help チャンネル
- **仕様確認**: プロダクトオーナーへ直接連絡
- **緊急時**: エスカレーションフロー参照

---

## ✅ 完了定義

各フェーズの完了条件：
1. 全機能の実装完了
2. テストカバレッジ 80%以上
3. コードレビュー承認
4. ドキュメント更新
5. 本番環境へのデプロイ成功

---

*最終更新: 2025年6月28日*
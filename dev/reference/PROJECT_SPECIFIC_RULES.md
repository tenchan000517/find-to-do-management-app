# Find To Do Management App - プロジェクト固有開発ルール

**最終更新**: 2025年6月30日  
**責任者**: Project Lead  
**目的**: このプロジェクト特有の技術標準・ルール定義

---

## 🛠️ 技術スタック・環境

### **必須技術スタック**
```
Frontend: Next.js 15.3.3 + React 19 + TypeScript 5 + Tailwind CSS 4
Backend: Next.js API Routes + Prisma 6.9.0
Database: PostgreSQL + Prisma ORM
Auth: NextAuth.js 4.24.11
Integration: LINE Bot SDK, Google APIs, GA4
Testing: Jest 30.0.3 + ts-jest
Deployment: Vercel
```

### **利用可能なスクリプト**
```bash
npm run dev          # 開発サーバー（--turbopack）
npm run build        # プロダクションビルド
npm run lint         # ESLint実行
npm run test         # Jest実行
npm run test:watch   # Jest watch mode
npm run test:coverage # カバレッジ測定

# 注意: typecheckスクリプトは存在しない
# 代替: npx tsc --noEmit を使用
```

### **汎用ルールの具体的コマンド定義**
```bash
# DEV_RULES_GENERIC.md の [PLACEHOLDER] に対応
[TYPE_CHECK_COMMAND] = npx tsc --noEmit
[BUILD_COMMAND] = npm run build
[LINT_COMMAND] = npm run lint
[TEST_COMMAND] = npm run test
[SEARCH_COMMAND] = rg
[SOURCE_DIR] = src/
[API_DIR] = src/app/api/
[EXTENSION] = ts,tsx
```

---

## 📂 ディレクトリ構造ルール

### **必須ディレクトリ**
```
/src/                        # ソースコード（変更可能）
/manuals/                    # ユーザーマニュアル（更新義務あり）
/docs/user-flows/            # ユーザーフロー（更新義務あり）
/docs/specifications/        # 技術仕様（更新義務あり）
/phases/                     # フェーズ管理
/issues/                     # Issue管理
```

### **一時ディレクトリ**
```
/temp/                       # 作業用一時ファイル
/active/                     # 進行中作業ファイル
```

### **プロジェクト固有ディレクトリ**
```
/manuals/                    # ユーザーマニュアル（15-line-integration-complete.md等）
/docs/user-flows/            # ユーザーフロー（01_BASIC_USER_FLOWS.md等）
/docs/specifications/        # 技術仕様（00_SYSTEM_OVERVIEW.md等）
/archive/                    # 完了済みドキュメント
/credentials/                # 認証情報
/data/                       # SQLiteデータベースファイル
/public/                     # 静的ファイル
/scripts/                    # 運用スクリプト
```

---

## 📝 コード品質基準

### **命名規則**
```typescript
// ファイル名: kebab-case
user-profile-modal.tsx
sales-analytics.service.ts

// 関数名: camelCase
getUserProfile()
calculateSalesMetrics()

// コンポーネント: PascalCase
UserProfileModal
SalesAnalyticsComponent

// 定数: UPPER_SNAKE_CASE
const API_BASE_URL = "..."
const MAX_RETRY_COUNT = 3
```

### **ディレクトリ命名**
```
/src/components/             # React コンポーネント
/src/services/              # ビジネスロジック
/src/lib/                   # ユーティリティ
/src/app/api/               # API Routes
/src/hooks/                 # カスタムフック
```

### **コミットメッセージ形式**
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
refactor: リファクタリング
test: テスト追加・修正
style: コードスタイル修正
chore: その他の変更

例:
feat: ユーザープロフィール編集機能を追加
fix: タスク削除時のエラーハンドリングを修正
docs: API仕様書にエンドポイント追加

末尾に必ず追加:
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 📚 ドキュメント管理ルール

### **更新義務があるドキュメント**

#### 機能追加・変更時
```
manuals/                     # 該当機能のユーザーマニュアル
docs/user-flows/            # ユーザー操作フロー
docs/specifications/        # API仕様・技術仕様
```

#### 更新チェックリスト（実装と同時実行必須）
```
新機能追加時（実装完了 = ドキュメント更新完了）:
[ ] manuals/該当ファイル.md に機能説明追加
[ ] docs/user-flows/ にユーザー操作フロー追加  
[ ] docs/specifications/ にAPI仕様追加
[ ] 実装コードとドキュメントが100%一致確認

既存機能変更時（変更完了 = ドキュメント同期完了）:
[ ] 変更内容がmanuals/に反映済み
[ ] 変更されたフローがuser-flows/に反映済み
[ ] 変更されたAPIがspecifications/に反映済み
[ ] 古い情報が削除済み

機能廃止時（廃止完了 = ドキュメント削除完了）:
[ ] 該当ドキュメントを削除またはdeprecated マーク
[ ] 関連するuser-flowsから削除
[ ] APIドキュメントから削除
```

### **ドキュメント更新の強制確認**
```bash
# 実装完了時の必須確認プロンプト
echo "=== 実装完了前の必須ドキュメント更新確認 ==="
echo "1. manuals/ 更新完了？ (y/n)"
read manual_done
echo "2. user-flows/ 更新完了？ (y/n)"
read flow_done  
echo "3. specifications/ 更新完了？ (y/n)"
read spec_done

if [[ "$manual_done" != "y" ]] || [[ "$flow_done" != "y" ]] || [[ "$spec_done" != "y" ]]; then
  echo "❌ ドキュメント更新未完了 - 実装完了と見なしません"
  exit 1
fi
echo "✅ ドキュメント更新確認完了"
```

### **ドキュメント品質基準**
- **正確性**: 実装と100%一致（ずれ許容度0%）
- **完全性**: 操作手順に漏れなし
- **明確性**: 初回利用者でも理解可能
- **最新性**: 機能変更と**同時**更新（後回し禁止）
- **一貫性**: 既存ドキュメントとの命名・形式統一

---

## 🔍 プロジェクト固有の重複防止ルール

### **既存ステータス値（必須確認）**
```bash
# このプロジェクトで使用中のステータス値
rg "status.*=|Status.*=" src/ --type ts | grep -E "(=|:)"

# よくある重複ミス例
COMPLETE vs completed
PENDING vs pending
ACTIVE vs active
```

### **既存型定義パターン**
```typescript
// 既存のinterface命名パターン
interface User...
interface Task...
interface Project...
interface Analytics...

// 既存のenum命名パターン
enum TaskStatus
enum ProjectPhase
enum UserRole
```

### **プロジェクト固有API構造**
```
/src/app/api/
├── auth/                    # 認証関連
├── tasks/                   # タスク管理
├── projects/               # プロジェクト管理
├── appointments/           # 予定管理
├── calendar/               # カレンダー
├── knowledge/              # ナレッジ管理
├── analytics/              # 分析系
├── ai/                     # AI機能
├── webhook/                # Webhook
└── admin/                  # 管理機能
```

---

## 🎯 プロジェクト固有の開発ワークフロー

### **LINE Bot関連開発時**
```bash
1. LINE Webhook テスト: scripts/setup-local-line.sh 実行
2. ngrok でローカル公開: npm run line:ngrok
3. LINE公式アカウント設定更新
4. manuals/15-line-integration-complete.md 更新
```

### **Database変更時**
```bash
1. prisma/schema.prisma 更新
2. npx prisma generate
3. npx prisma db push (開発環境)
4. docs/specifications/01_DATABASE_SPECIFICATIONS.md 更新
```

### **Analytics機能開発時**
```bash
1. Google Analytics設定確認
2. サンプルデータで動作確認
3. manuals/08-*-analytics.md の該当ファイル更新
4. Real-time機能への影響確認
```

---

## 🚫 プロジェクト固有の禁止事項

### **技術的制約**
```
❌ Vercel環境での制約
- WebSocketサーバー実装禁止
- 永続的バックグラウンドプロセス禁止
- ファイルシステム書き込み制限

❌ 既存機能との衝突回避
- tasksテーブル構造の大幅変更禁止
- 既存APIエンドポイントのbreaking change禁止
- LINE Bot メッセージフォーマット変更時は下位互換性保持
```

### **ドキュメント管理**
```
❌ 禁止パターン
- manuals/ファイルの勝手な削除・移動
- 既存user-flowsの破壊的変更
- archive/ディレクトリの内容変更
```

---

## 🔧 プロジェクト固有トラブルシューティング

### **よくあるエラーとプロジェクト固有解決策**

#### TypeScript型チェックエラー
```bash
# ❌ 失敗パターン
npm run typecheck

# ✅ 正しいパターン（このプロジェクト固有）
npx tsc --noEmit
```

#### Prisma関連エラー
```bash
# 型定義エラー時
npx prisma generate

# データベース接続エラー時
cat .env.local  # DATABASE_URL確認
```

#### LINE Bot開発エラー
```bash
# Webhook受信しない場合
1. ngrok URL確認
2. LINE Developers Console設定確認
3. webhook.log ファイル確認
```

---

## 📈 プロジェクト固有の品質指標

### **パフォーマンス基準**
```
ページロード時間: < 3秒
API レスポンス時間: < 500ms
LINE Bot応答時間: < 3秒
Mobile First Index対応: 必須
```

### **ビジネス指標**
```
ユーザーマニュアル完成率: 100%
API仕様書カバレッジ: 100%
LINE Bot機能完全性: 100%
Real-time機能稼働率: 95%以上
```

---

**管理責任者**: Project Lead  
**適用対象**: Find To Do Management App 開発者・Claude Code  
**更新頻度**: プロジェクト仕様変更時  
**汎用ルール**: DEV_RULES_GENERIC.md と併用必須
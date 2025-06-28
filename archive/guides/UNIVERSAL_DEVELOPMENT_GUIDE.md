# 🚀 FIND to DO システム - 包括的開発ガイド

**対象**: すべての開発者（人間・AI問わず）  
**目的**: プロセスに依存しない、普遍的な開発ルールとベストプラクティスの確立

---

## 📖 **このガイドの位置づけ**

このドキュメントは **「どんな開発者でも、どんな状況でも」** 効率的に開発を進められる普遍的なガイドです。特定のPhaseや機能に依存せず、システム全体の品質と一貫性を保つための基盤となります。

### **参照必須ドキュメント**
- **技術リファレンス**: [`DEVELOPER_REFERENCE_INDEX.md`](./DEVELOPER_REFERENCE_INDEX.md)
- **要件定義書**: [`../documentation/archive/initial/要件定義書.md`](../documentation/archive/initial/要件定義書.md)
- **AI開発ナレッジ**: [`../CLAUDE.md`](../CLAUDE.md)

---

## 🎯 **開発哲学とプリンシプル**

### **1. 品質第一主義**
- **型安全性**: TypeScriptの恩恵を最大限活用
- **一貫性**: コーディング規約の厳格な遵守
- **可読性**: 自己説明的なコード記述

### **2. 効率性追求**
- **DRY原則**: 重複コード排除、再利用性重視
- **段階的実装**: 小さな単位での確実な実装
- **自動化推進**: 手作業削減、CI/CD活用

### **3. 拡張性確保**
- **モジュラー設計**: 疎結合な アーキテクチャ
- **API設計**: RESTful原則遵守
- **データ設計**: 正規化と性能のバランス

---

## 🏗️ **システムアーキテクチャ理解**

### **技術スタック（変更不可）**
```
Frontend:  Next.js 15 + TypeScript + Tailwind CSS
Backend:   Next.js API Routes + TypeScript  
Database:  PostgreSQL (Neon) + Prisma ORM
AI:        Google Gemini API
External:  LINE Bot, Google Apps Script, Discord Bot
```

### **ディレクトリ構造**
```
/
├── prisma/           # データベーススキーマ定義
├── src/
│   ├── app/          # Next.js App Router
│   │   ├── api/      # APIエンドポイント
│   │   └── */        # ページコンポーネント
│   ├── lib/          # 共通ライブラリ
│   │   ├── ai/       # AI関連サービス
│   │   ├── line/     # LINE Bot関連
│   │   └── services/ # ビジネスロジック
│   ├── hooks/        # React カスタムHooks
│   └── types/        # 型定義
├── docs/             # ドキュメント（整理済み）
└── scripts/          # 運用スクリプト
```

### **データフロー**
```
[External APIs] → [Webhooks] → [Next.js API] → [Business Logic] → [Prisma] → [PostgreSQL]
                                     ↓
[React Components] ← [Custom Hooks] ← [API Calls]
```

---

## 🛠️ **開発ワークフロー（3段階）**

## **Phase 1: 開発準備（必須）**

### **A. 環境確認**
```bash
# 1. Next.jsプロセス確認・クリーンアップ
ps aux | grep next | grep -v grep
pkill -f "next dev"

# 2. Git状況確認
git status
git pull origin main    # 最新状態に同期

# 3. 依存関係確認
npm install
```

### **B. 品質チェック**
```bash
# 型チェック（最重要）
npm run typecheck

# Lint確認
npm run lint

# ビルド確認
npm run build
```

### **C. データベース状態確認**
```bash
# Prisma状態確認
npx prisma generate
npx prisma db push --dry-run

# データ整合性確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.tasks.count(), p.projects.count(), p.connections.count()]).then(([tasks, projects, connections]) => console.log(\`Data: Tasks(\${tasks}), Projects(\${projects}), Connections(\${connections})\`)).finally(() => p.\$disconnect());"
```

## **Phase 2: 開発実行**

### **A. タスク特定・設計確認**
1. **要件確認**
   - 対象機能の要件定義書確認
   - 既存実装の重複チェック
   - 依存関係の把握

2. **設計確認**
   - 関連設計書の読み込み
   - API仕様の確認
   - データベーススキーマの確認

3. **実装範囲の明確化**
   - 最小実装単位の定義
   - テスト可能な状態の設定
   - 完了条件の明確化

### **B. 実装**

#### **データベース変更時**
```bash
# 1. スキーマ更新
# prisma/schema.prisma を編集

# 2. 型生成・DB反映
npx prisma generate
npx prisma db push

# 3. 型チェック
npm run typecheck
```

#### **API開発時**
```bash
# 1. APIルート作成
# src/app/api/[endpoint]/route.ts

# 2. 型定義追加/更新
# src/lib/types.ts または src/types/[specific].ts

# 3. テスト（手動確認）
curl -X GET http://localhost:3000/api/[endpoint]
```

#### **フロントエンド開発時**
```bash
# 1. コンポーネント作成
# src/app/[page]/components/[Component].tsx

# 2. Hook作成（必要に応じて）
# src/hooks/use[Feature].ts

# 3. 開発サーバーで確認
npm run dev
```

### **C. 継続的品質チェック**
```bash
# 30分毎に実行推奨
npm run typecheck
npm run lint

# 必要に応じて自動修正
npm run lint:fix
```

## **Phase 3: 完了処理（必須）**

### **A. 最終品質確認**
```bash
# 1. 完全な型チェック
npm run typecheck

# 2. Lint確認
npm run lint

# 3. ビルドテスト
npm run build

# 4. Next.jsプロセス停止
pkill -f "next dev"
```

### **B. データ整合性確認**
```bash
# 新機能に関連するデータ確認
# 例：新しいテーブル作成時
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.[新テーブル].count().then(count => console.log(\`新テーブル レコード数: \${count}\`)).finally(() => p.\$disconnect());"
```

### **C. ドキュメント更新**
1. **実装状況更新**: [`DEVELOPER_REFERENCE_INDEX.md`](./DEVELOPER_REFERENCE_INDEX.md)
2. **新機能追加**: 該当設計書に実装完了マーク
3. **トラブル事例**: 遭遇した問題と解決策を記録

### **D. コミット・引き継ぎ**
```bash
# 1. 変更内容確認
git status
git diff

# 2. コミット
git add .
git commit -m "[機能名] 実装完了: [具体的な変更内容]

- [変更点1]
- [変更点2]
- 型安全性確認済み
- ビルドテスト通過済み"

# 3. Push（明示的な指示がある場合のみ）
git push origin [branch-name]
```

---

## 📋 **開発ベストプラクティス**

### **コーディング規約**

#### **TypeScript**
```typescript
// ✅ Good: 明示的な型定義
interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// ❌ Bad: any型の使用
function processData(data: any) { ... }

// ✅ Good: ジェネリクス使用
function processData<T>(data: T): ProcessedData<T> { ... }
```

#### **API Routes**
```typescript
// ✅ Good: 適切なエラーハンドリング
export async function GET(request: Request) {
  try {
    const data = await prisma.users.findMany();
    return NextResponse.json(data);
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'ユーザー取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ❌ Bad: エラーハンドリング不備
export async function GET() {
  const data = await prisma.users.findMany(); // エラー時の対応なし
  return NextResponse.json(data);
}
```

#### **React Components**
```typescript
// ✅ Good: Props型定義
interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
  className?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, className }) => {
  // 実装
};

// ❌ Bad: Props型未定義
const TaskCard = ({ task, onUpdate, className }) => {
  // 実装
};
```

### **データベース操作**
```typescript
// ✅ Good: エラーハンドリング付きPrisma操作
async function createTask(data: CreateTaskData) {
  try {
    const task = await prisma.tasks.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
      include: {
        project: true,
        assignee: true,
      }
    });
    return { success: true, data: task };
  } catch (error) {
    console.error('Task creation error:', error);
    return { success: false, error: 'タスク作成に失敗しました' };
  }
}

// ❌ Bad: エラーハンドリングなし
async function createTask(data: CreateTaskData) {
  return await prisma.tasks.create({ data });
}
```

---

## 🚨 **よくある落とし穴と対策**

### **1. 型エラー関連**
| 問題 | 原因 | 対策 | 予防策 |
|------|------|------|--------|
| `Type 'undefined' is not assignable` | null/undefined チェック不備 | Optional chaining使用 | 常に`?.`演算子使用 |
| `Property does not exist on type` | 型定義と実装の乖離 | 型定義更新 | 定期的な型チェック |
| `Cannot find module` | import パス間違い | パス確認・修正 | 相対パス統一 |

### **2. パフォーマンス問題**
| 問題 | 原因 | 対策 | 予防策 |
|------|------|------|--------|
| 無限再レンダリング | 依存配列設定ミス | useCallback/useMemo使用 | 依存配列の慎重な設定 |
| API呼び出し過多 | 状態管理不備 | SWR/React Query導入検討 | キャッシュ戦略の計画 |
| DB クエリ遅延 | N+1問題 | `include`/`select`最適化 | クエリプランニング |

### **3. 外部連携エラー**
| 問題 | 原因 | 対策 | 予防策 |
|------|------|------|--------|
| API Rate Limit | 制限超過 | スロットリング実装 | 呼び出し頻度計画 |
| Webhook失敗 | 署名検証エラー | 署名検証ロジック確認 | テスト環境での検証 |
| 環境変数未設定 | .env設定漏れ | 環境変数確認・設定 | 設定項目チェックリスト |

---

## 🔧 **開発ツール活用**

### **必須開発コマンド（暗記推奨）**
```bash
# 型チェック（最重要）
npm run typecheck

# 自動修正
npm run lint:fix

# データベース
npx prisma studio
npx prisma generate

# 開発サーバー管理
pkill -f "next dev"
npm run dev
```

### **デバッグ用クエリ集**
```bash
# 基本データ確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.tasks.count(), p.projects.count(), p.users.count()]).then(([tasks, projects, users]) => console.log(\`Tasks: \${tasks}, Projects: \${projects}, Users: \${users}\`)).finally(() => p.\$disconnect());"

# 最新レコード確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.tasks.findMany({take: 5, orderBy: {createdAt: 'desc'}, select: {title: true, status: true, createdAt: true}}).then(r => console.table(r)).finally(() => p.\$disconnect());"

# エラーデータ確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.ai_content_analysis.findMany({where: {summary: {in: ['', '要約未生成', '要約を生成できませんでした']}}, select: {title: true, summary: true}}).then(r => console.log(\`エラーデータ: \${r.length}件\`)).finally(() => p.\$disconnect());"
```

### **VS Code 推奨設定**
```json
{
  "typescript.preferences.quoteStyle": "single",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true
  }
}
```

---

## 📚 **学習・参考リソース**

### **技術ドキュメント**
- **Next.js App Router**: https://nextjs.org/docs/app
- **Prisma Client**: https://www.prisma.io/docs/concepts/components/prisma-client
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs

### **このプロジェクト特有のリソース**
- **システム全体理解**: [`../documentation/archive/initial/要件定義書.md`](../documentation/archive/initial/要件定義書.md)
- **技術詳細**: [`DEVELOPER_REFERENCE_INDEX.md`](./DEVELOPER_REFERENCE_INDEX.md)
- **カレンダー機能**: [`CALENDAR_FEATURE_MASTER_DESIGN.md`](./CALENDAR_FEATURE_MASTER_DESIGN.md)
- **Google Docs統合**: [`GOOGLE_DOCS_INTEGRATION_SYSTEM_DESIGN.md`](./GOOGLE_DOCS_INTEGRATION_SYSTEM_DESIGN.md)

---

## 🎯 **成功の指標**

### **品質指標**
- ✅ TypeScript エラー: 0件
- ✅ ESLint エラー: 0件  
- ✅ ビルド成功率: 100%
- ✅ API レスポンス時間: <500ms

### **開発効率指標**
- ✅ 機能実装時間の予測精度向上
- ✅ バグ発生率の低下
- ✅ コードレビュー時間の短縮
- ✅ ドキュメント参照頻度の最適化

### **チーム協力指標**
- ✅ 引き継ぎ作業時間の短縮
- ✅ コーディング規約の一貫性
- ✅ ナレッジ共有の活発化
- ✅ 属人化の解消

---

## 🔄 **継続的改善**

### **このガイドの更新ルール**
1. **新しいベストプラクティス発見時**: 該当セクションに追加
2. **よくある問題発生時**: トラブルシューティングに記録
3. **技術スタック変更時**: アーキテクチャセクション更新
4. **効率化手法発見時**: ワークフローセクション更新

### **フィードバックサイクル**
- **毎回の開発後**: 遭遇した問題・学びの記録
- **週次**: 開発効率の振り返り
- **月次**: ガイド全体の見直し・更新

---

## 🌟 **開発者へのメッセージ**

このガイドは **「誰でも高品質な開発ができる」** ことを目指しています。

- 🔍 **迷ったら**: 技術リファレンスを確認
- 🚨 **問題が発生したら**: トラブルシューティングを参照
- 📚 **学習したいなら**: 参考リソースを活用
- 🤝 **引き継ぐ時**: 完了処理を必ず実行

**品質の高いコードは、未来の自分と他の開発者への最高のプレゼントです。**

---

## 🎨 **UI/UX開発ルール（2025-06-17追加）**

### **必須遵守事項**
1. **絵文字使用禁止**: Lucide Reactアイコンのみ使用
2. **共通コンポーネント使用必須**: Button, Modal, Card等
3. **デザイントークン遵守**: spacing, borderRadius等の統一
4. **レスポンシブ対応**: モバイルファースト設計

### **詳細ガイドライン**
- **UI/UXデザインガイドライン**: [`UI_UX_DESIGN_GUIDELINES.md`](./UI_UX_DESIGN_GUIDELINES.md)
- **実装計画**: [`../UI_COMPONENT_IMPLEMENTATION_PLAN.md`](../UI_COMPONENT_IMPLEMENTATION_PLAN.md)

### **新規ページ・コンポーネント作成時のチェックリスト**
- [ ] デザイントークンを使用した余白・サイズ
- [ ] Lucide Reactアイコンを使用（絵文字禁止）
- [ ] レスポンシブ対応（モバイルファースト）
- [ ] 統一されたローディング状態の実装
- [ ] 適切なタッチターゲットサイズ（44px以上）
- [ ] 共通コンポーネントの使用
- [ ] アクセシビリティ対応（aria-label等）

---

*最終更新: 2025-06-17*  
*次回更新: 新しいベストプラクティス発見時*
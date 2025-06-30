# プロジェクト固有ルール（要点版）

**責任者**: Project Lead  
**目的**: Find To Do Management App 必須ルール（簡潔版）

---

## 🛠️ 技術スタック

```
Frontend: Next.js 15.3.3 + React 19 + TypeScript + Tailwind
Backend: Next.js API Routes + Prisma
Database: PostgreSQL + Prisma ORM
```

---

## 🔧 コマンド定義

```bash
[TYPE_CHECK_COMMAND] = npx tsc --noEmit
[BUILD_COMMAND] = npm run build
[LINT_COMMAND] = npm run lint
[TEST_COMMAND] = npm run test
[SEARCH_COMMAND] = rg
[SOURCE_DIR] = src/
[API_DIR] = src/app/api/
```

---

## 📂 必須ディレクトリ

```
/src/                   # ソースコード
/manuals/              # ユーザーマニュアル（更新義務）
/docs/user-flows/      # ユーザーフロー（更新義務）
/docs/specifications/  # 技術仕様（更新義務）
/phases/               # フェーズ管理
/reference/            # 詳細ドキュメント
```

---

## 📝 ドキュメント更新義務

### **新機能実装時の必須更新**
```
実装完了 = コード + 以下3つのドキュメント更新
1. manuals/該当ファイル.md
2. docs/user-flows/該当ファイル.md  
3. docs/specifications/該当ファイル.md
```

---

## 🚫 重要な制約

### **開発サーバー**
```
❌ 自動起動禁止
理由: ユーザー側で既に実行中の可能性
```

### **型チェック**
```
❌ npm run typecheck（存在しない）
✅ npx tsc --noEmit（正しい）
```

---

## 📈 API構造

```
/src/app/api/
├── auth/         # 認証
├── tasks/        # タスク管理
├── analytics/    # 分析
├── ai/           # AI機能
└── webhook/      # Webhook
```

---

**詳細仕様**: reference/ 各ファイル参照  
**管理責任者**: Project Lead
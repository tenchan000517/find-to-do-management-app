# Claude 開発ガイド

## 開発サーバーについて

**重要: 開発サーバーは自動で立ち上げないでください**

ユーザーが明示的に指示するまで、以下のコマンドは実行しないでください：
- `npm run dev`
- `yarn dev`
- `next dev`

理由：ユーザー側で既にサーバーが実行されている可能性があり、競合を避けるためです。

## プロジェクト情報

このプロジェクトは以下の機能を持つタスク管理アプリケーションです：

### 主要機能
- タスク管理（カンバンボード）
- ナレッジ管理
- カレンダー・スケジュール管理
- LINE Bot連携
- GA4分析ダッシュボード
- Google Search Console連携

### 技術スタック
- Next.js 14
- TypeScript
- Tailwind CSS
- Prisma (PostgreSQL)
- LINE Messaging API
- Google Analytics 4
- Google Search Console API

### データベース
- PostgreSQL (Prisma使用)
- テーブル: tasks, users, knowledge_items, appointments, contacts など

### 開発時の注意事項
1. サーバーは手動起動のみ
2. 型チェック: `npm run typecheck`
3. リント: `npm run lint`
4. データベース管理: `npx prisma studio`
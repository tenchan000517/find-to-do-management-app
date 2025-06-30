# 🔧 開発者リファレンス - 技術情報INDEX

**対象**: すべての開発者  
**目的**: 開発時に頻繁に参照する技術的なファイル・定義の場所を一元管理

---

## 🏗️ **コア技術ファイル** (最重要)

### **データベース関連**
| ファイル | 目的 | 場所 | 重要度 |
|---------|------|------|--------|
| **Prismaスキーマ** | データベース定義・モデル | [`prisma/schema.prisma`](../prisma/schema.prisma) | ★★★ |
| **Prismaクライアント** | DB接続・操作 | [`src/lib/database/prisma.ts`](../src/lib/database/prisma.ts) | ★★★ |
| **Prismaサービス** | 高レベルDB操作 | [`src/lib/database/prisma-service.ts`](../src/lib/database/prisma-service.ts) | ★★☆ |

### **型定義**
| ファイル | 目的 | 場所 | 重要度 |
|---------|------|------|--------|
| **メイン型定義** | 全体的な型定義 | [`src/lib/types.ts`](../src/lib/types.ts) | ★★★ |
| **カレンダー型定義** | カレンダー機能の型 | [`src/types/calendar.ts`](../src/types/calendar.ts) | ★★☆ |
| **スケジュール型定義** | 個人スケジュール型 | [`src/types/personal-schedule.ts`](../src/types/personal-schedule.ts) | ★☆☆ |

---

## 🔗 **API Routes** (頻繁に参照)

### **基本CRUD API**
| 機能 | ルート | ファイル | 実装状況 |
|------|--------|----------|----------|
| **タスク管理** | `/api/tasks` | [`src/app/api/tasks/route.ts`](../src/app/api/tasks/route.ts) | ✅完成 |
| **プロジェクト管理** | `/api/projects` | [`src/app/api/projects/route.ts`](../src/app/api/projects/route.ts) | ✅完成 |
| **人脈管理** | `/api/connections` | [`src/app/api/connections/route.ts`](../src/app/api/connections/route.ts) | ✅完成 |
| **アポ管理** | `/api/appointments` | [`src/app/api/appointments/route.ts`](../src/app/api/appointments/route.ts) | ✅完成 |
| **ユーザー管理** | `/api/users` | [`src/app/api/users/route.ts`](../src/app/api/users/route.ts) | ✅完成 |

### **カレンダー API**
| 機能 | ルート | ファイル | 実装状況 |
|------|--------|----------|----------|
| **カレンダー基本** | `/api/calendar` | [`src/app/api/calendar/route.ts`](../src/app/api/calendar/route.ts) | 🔄部分実装 |
| **イベント管理** | `/api/calendar/events` | [`src/app/api/calendar/events/route.ts`](../src/app/api/calendar/events/route.ts) | 🔄部分実装 |
| **統合カレンダー** | `/api/calendar/unified` | [`src/app/api/calendar/unified/route.ts`](../src/app/api/calendar/unified/route.ts) | 🔄部分実装 |

### **AI統合 API**
| 機能 | ルート | ファイル | 実装状況 |
|------|--------|----------|----------|
| **AI評価** | `/api/ai/evaluate` | [`src/app/api/ai/evaluate/route.ts`](../src/app/api/ai/evaluate/route.ts) | ✅完成 |
| **バッチ評価** | `/api/ai/batch-evaluate` | [`src/app/api/ai/batch-evaluate/route.ts`](../src/app/api/ai/batch-evaluate/route.ts) | ✅完成 |
| **コンテンツ分析** | `/api/ai-content-analysis` | [`src/app/api/ai-content-analysis/route.ts`](../src/app/api/ai-content-analysis/route.ts) | ✅完成 |

### **外部連携 API**
| 機能 | ルート | ファイル | 実装状況 |
|------|--------|----------|----------|
| **LINE Webhook** | `/api/webhook/line` | [`src/app/api/webhook/line/route.ts`](../src/app/api/webhook/line/route.ts) | ✅完成 |
| **Google Docs統合** | `/api/webhook/google-docs-gas` | [`src/app/api/webhook/google-docs-gas/route.ts`](../src/app/api/webhook/google-docs-gas/route.ts) | ✅完成 |
| **Discord指標** | `/api/discord/metrics` | [`src/app/api/discord/metrics/route.ts`](../src/app/api/discord/metrics/route.ts) | ✅完成 |

---

## 🧠 **AI・機械学習モジュール**

### **AIコアサービス**
| モジュール | 目的 | ファイル | 実装状況 |
|-----------|------|----------|----------|
| **AI呼び出し管理** | API制限・レート制御 | [`src/lib/ai/call-manager.ts`](../src/lib/ai/call-manager.ts) | ✅完成 |
| **コンテンツ分析器** | テキスト解析・要約 | [`src/lib/ai/content-analyzer.ts`](../src/lib/ai/content-analyzer.ts) | ✅完成 |
| **高度コンテンツ分析** | 統合エンティティ抽出 | [`src/lib/ai/advanced-content-analyzer.ts`](../src/lib/ai/advanced-content-analyzer.ts) | ✅完成 |
| **評価エンジン** | プロジェクト・タスク評価 | [`src/lib/ai/evaluation-engine.ts`](../src/lib/ai/evaluation-engine.ts) | ✅完成 |

### **特化型AIサービス**
| モジュール | 目的 | ファイル | 実装状況 |
|-----------|------|----------|----------|
| **推薦エンジン** | プロジェクト推薦 | [`src/lib/ai/recommendation-engine.ts`](../src/lib/ai/recommendation-engine.ts) | ✅完成 |
| **アポ評価器** | アポイントメント分析 | [`src/lib/ai/appointment-evaluator.ts`](../src/lib/ai/appointment-evaluator.ts) | ✅完成 |
| **テキスト処理器** | 自然言語処理 | [`src/lib/ai/text-processor.ts`](../src/lib/ai/text-processor.ts) | ✅完成 |

### **AI制御・最適化**
| モジュール | 目的 | ファイル | 実装状況 |
|-----------|------|----------|----------|
| **スロットリング管理** | API制限対策 | [`src/lib/utils/ai-throttle-manager.ts`](../src/lib/utils/ai-throttle-manager.ts) | ✅完成 |
| **JSON解析器** | AI応答解析 | [`src/lib/utils/ai-json-parser.ts`](../src/lib/utils/ai-json-parser.ts) | ✅完成 |

---

## 📱 **LINE Bot関連**

### **LINEコアモジュール** 🚨 緊急改修必要
| モジュール | 目的 | ファイル | 実装状況 | 改修必要度 |
|-----------|------|----------|----------|-------------|
| **Webhookエンドポイント** | メイン処理 | [`src/app/api/webhook/line/route.ts`](../src/app/api/webhook/line/route.ts) | ⚠️脆弱性あり | 🔴P0 |
| **セッション管理** | 会話セッション管理 | [`src/lib/line/session-manager.ts`](../src/lib/line/session-manager.ts) | 🚨致命的脆弱性 | 🔴P0 |
| **メッセージハンドラー** | LINE応答処理 | [`src/lib/line/message-handler.ts`](../src/lib/line/message-handler.ts) | ✅完成 | 🟡拡張 |
| **コマンド検出器** | 高度コマンド処理 | [`src/lib/line/enhanced-command-detector.ts`](../src/lib/line/enhanced-command-detector.ts) | ✅完成 | 🟡拡張 |
| **通知システム** | LINE通知送信 | [`src/lib/line/notification.ts`](../src/lib/line/notification.ts) | ✅完成 | 🟡拡張 |

### **LINE補助機能**
| モジュール | 目的 | ファイル | 実装状況 |
|-----------|------|----------|----------|
| **テキスト抽出** | メッセージ解析 | [`src/lib/line/text-extraction.ts`](../src/lib/line/text-extraction.ts) | ✅完成 |
| **日時解析** | 自然言語日時変換 | [`src/lib/line/datetime-parser.ts`](../src/lib/line/datetime-parser.ts) | ✅完成 |
| **監視システム** | LINE Bot監視 | [`src/lib/line/monitoring.ts`](../src/lib/line/monitoring.ts) | ✅完成 |

---

## 🔧 **ユーティリティ・サービス**

### **システムサービス**
| モジュール | 目的 | ファイル | 実装状況 |
|-----------|------|----------|----------|
| **データサービス** | 統合データ操作 | [`src/lib/data-service.ts`](../src/lib/data-service.ts) | ✅完成 |
| **ストレージ** | ファイル管理 | [`src/lib/storage.ts`](../src/lib/storage.ts) | ✅完成 |
| **JST日時処理** | 日本時間処理 | [`src/lib/utils/datetime-jst.ts`](../src/lib/utils/datetime-jst.ts) | ✅完成 |

### **高度なサービス**
| モジュール | 目的 | ファイル | 実装状況 |
|-----------|------|----------|----------|
| **関係性サービス** | プロジェクト関係管理 | [`src/lib/services/relationship-service.ts`](../src/lib/services/relationship-service.ts) | ✅完成 |
| **通知サービス** | 統合通知システム | [`src/lib/services/notification-service.ts`](../src/lib/services/notification-service.ts) | ✅完成 |
| **アラートエンジン** | アラート処理 | [`src/lib/services/alert-engine.ts`](../src/lib/services/alert-engine.ts) | ✅完成 |
| **プロジェクト昇格エンジン** | 自動昇格判定 | [`src/lib/services/project-promotion-engine.ts`](../src/lib/services/project-promotion-engine.ts) | ✅完成 |

---

## 🎣 **React Hooks** (フロントエンド)

### **データ取得Hooks**
| Hook | 目的 | ファイル | 実装状況 |
|------|------|----------|----------|
| **useTasks** | タスクデータ管理 | [`src/hooks/useTasks.ts`](../src/hooks/useTasks.ts) | ✅完成 |
| **useProjects** | プロジェクトデータ管理 | [`src/hooks/useProjects.ts`](../src/hooks/useProjects.ts) | ✅完成 |
| **useConnections** | 人脈データ管理 | [`src/hooks/useConnections.ts`](../src/hooks/useConnections.ts) | ✅完成 |
| **useAppointments** | アポデータ管理 | [`src/hooks/useAppointments.ts`](../src/hooks/useAppointments.ts) | ✅完成 |
| **useCalendarEvents** | カレンダーデータ管理 | [`src/hooks/useCalendarEvents.ts`](../src/hooks/useCalendarEvents.ts) | 🔄部分実装 |

### **ユーザー関連Hooks**
| Hook | 目的 | ファイル | 実装状況 |
|------|------|----------|----------|
| **useUsers** | ユーザー管理 | [`src/hooks/useUsers.ts`](../src/hooks/useUsers.ts) | ✅完成 |
| **useUserProfile** | ユーザープロフィール | [`src/hooks/useUserProfile.ts`](../src/hooks/useUserProfile.ts) | ✅完成 |

### **その他Hooks**
| Hook | 目的 | ファイル | 実装状況 |
|------|------|----------|----------|
| **useKnowledge** | ナレッジ管理 | [`src/hooks/useKnowledge.ts`](../src/hooks/useKnowledge.ts) | 🔄部分実装 |

---

## 🛠️ **よく使う開発コマンド**

### **Prisma関連**
```bash
# スキーマ変更後の必須コマンド
npx prisma generate      # 型生成
npx prisma db push       # DB反映
npx prisma studio        # GUI管理画面

# データベース確認
npx prisma db pull       # 既存DBからスキーマ生成
```

### **型チェック・品質管理**
```bash
# 開発中の必須チェック
npm run typecheck        # TypeScript型チェック
npm run lint            # ESLint実行
npm run build           # ビルドチェック

# 修正
npm run lint:fix        # 自動修正
```

### **開発サーバー管理**
```bash
# プロセス管理
ps aux | grep next | grep -v grep  # Next.jsプロセス確認
pkill -f "next dev"                # 強制終了
npm run dev                        # 開発サーバー起動
```

---

## 🔍 **データベース確認クエリ集**

### **基本データ確認**
```bash
# テーブル数確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.tasks.count(), p.projects.count(), p.connections.count(), p.appointments.count()]).then(([tasks, projects, connections, appointments]) => console.log(\`Tasks: \${tasks}, Projects: \${projects}, Connections: \${connections}, Appointments: \${appointments}\`)).finally(() => p.\$disconnect());"

# AI要約生成状況確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.ai_content_analysis.aggregate({_count: {_all: true}, where: {summary: {not: {in: ['', '要約未生成', '要約を生成できませんでした']}}}}).then(r => console.log(\`要約生成済み: \${r._count._all}件\`)).finally(() => p.\$disconnect());"

# 最新データ確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.ai_content_analysis.findMany({take: 3, orderBy: {createdAt: 'desc'}, select: {title: true, summary: true}}).then(r => r.forEach((x,i) => console.log(\`\${i+1}. \${x.title}: \${x.summary.substring(0,50)}...\`))).finally(() => p.\$disconnect());"
```

### **開発用データ操作**
```bash
# ユーザー確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.users.findMany({select: {id: true, name: true, email: true}}).then(r => console.table(r)).finally(() => p.\$disconnect());"

# プロジェクト状況確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.projects.groupBy({by: ['status'], _count: {_all: true}}).then(r => console.table(r)).finally(() => p.\$disconnect());"
```

---

## 🚨 **よくあるトラブルと解決策**

### **🔥 緊急対応項目（P0）**
| エラー | 原因 | 解決方法 | 参照ファイル |
|--------|------|----------|-------------|
| **セッション消失** | インメモリ実装 | Redis移行必須 | `session-manager.ts` |
| **署名エラー** | 検証無効化 | 署名検証有効化 | `route.ts` |
| **ユーザー登録失敗** | 手動登録依存 | 自動登録実装 | 新規実装 |

### **型エラー関連**
| エラー | 原因 | 解決方法 | 参照ファイル |
|--------|------|----------|-------------|
| Prisma型エラー | 型生成未実行 | `npx prisma generate` | `prisma/schema.prisma` |
| Unknown型エラー | 型定義不足 | 型追加・import確認 | `src/lib/types.ts` |
| API型エラー | レスポンス型不一致 | API仕様確認・型修正 | 各API Route |

### **ビルドエラー関連**
| エラー | 原因 | 解決方法 | 参照ファイル |
|--------|------|----------|-------------|
| 未使用import | ESLint警告 | import削除または使用 | - |
| 環境変数エラー | .env未設定 | 環境変数確認・設定 | `.env.local` |
| Next.js無限ループ | プロセス重複 | `pkill -f "next dev"` | - |

### **データベースエラー関連**
| エラー | 原因 | 解決方法 | 参照ファイル |
|--------|------|----------|-------------|
| Connection timeout | DB接続設定 | 接続文字列確認 | `src/lib/database/prisma.ts` |
| Migration error | スキーマ不整合 | `npx prisma db push --force-reset` | `prisma/schema.prisma` |
| 型不一致エラー | DB/コード型乖離 | スキーマ確認・型再生成 | `prisma/schema.prisma` |

---

## 📚 **外部ドキュメント・参考資料**

### **技術ドキュメント**
- **Next.js 15**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

### **外部API**
- **LINE Messaging API**: https://developers.line.biz/ja/docs/messaging-api/
- **Google Gemini API**: https://ai.google.dev/docs
- **Discord API**: https://discord.com/developers/docs

---

## 🔄 **このINDEXの更新ルール**

### **追加ルール**
1. **新しいファイル作成時**: 該当セクションに追加
2. **新しいAPI作成時**: API Routesセクションに追加
3. **新しいHook作成時**: React Hooksセクションに追加

### **更新タイミング**
- 新機能実装完了時
- ファイル移動・リネーム時
- トラブルシューティング事例追加時

---

---

## 📋 **LINE改修関連リファレンス**

### **必読ドキュメント（LINE改修時）**
1. **[LINE改善計画書](../LINE_REGISTRATION_SYSTEM_COMPLETE_ANALYSIS_AND_IMPROVEMENT_PLAN.md)** - 緊急対応手順
2. **[マスタープロンプト](../essential/MASTER_DEVELOPMENT_PROMPT.md)** - 最新優先順位
3. **[Claudeナレッジベース](../essential/CLAUDE.md)** - 実装手順詳細

### **緊急実装コマンド**
```bash
# Redis環境準備
docker-compose up -d redis

# セッション管理移行
npm install ioredis @types/ioredis

# 署名検証有効化確認
echo $LINE_CHANNEL_SECRET
```

---

*最終更新: 2025-06-17 18:00*  
*重要更新: LINE緊急改修項目追加*  
*次回更新: LINE Phase A完了時*
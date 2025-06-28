# 【カレンダー機能実装プロンプト】次期エンジニア向けガイド

**作成日**: 2025-06-15
**対象**: カレンダー機能を実装するエンジニア

---

## 🚀 このプロンプトの使い方

新しいClaude Codeセッションを開始し、このプロンプトを読み込ませてください：

```
私はカレンダー機能のPhase Xを担当します。
以下のドキュメントを参照して実装を進めます：
- /mnt/c/find-to-do-management-app/docs/CALENDAR_FEATURE_MASTER_DESIGN.md
- /mnt/c/find-to-do-management-app/NEXT_ENGINEER_IMPLEMENTATION_PROMPT.md
```

---

## 📋 現在の状況

### ✅ 完了済み
- **要件定義**: ユーザー要件確定、追加機能選定
- **DB設計**: スキーマ設計完了（calendar_events拡張、recurring_rules新規）
- **設計書**: CALENDAR_FEATURE_MASTER_DESIGN.md作成済み

### 🎯 実装待ち
- **Phase 1**: 基盤構築（Prismaスキーマ更新、マイグレーション）
- **Phase 2**: UI基本実装（カレンダーコンポーネント）
- **Phase 3**: 色分けタブシステム
- **Phase 4**: 繰り返し予定機能
- **Phase 5**: データ統合（タスク・アポ同期）
- **Phase 6**: フィルタリング機能
- **Phase 7**: AI機能統合
- **Phase 8**: チーム機能
- **Phase 9**: LINE連携強化
- **Phase 10**: 最終統合・最適化

---

## ⚠️ 重要な注意事項

### 1. **設計書の遵守**
```
docs/CALENDAR_FEATURE_MASTER_DESIGN.md
```
このファイルが唯一の真実です。ここに書かれていない機能は実装しません。

### 2. **既存システムの保護**
- Phase 1-8の機能を一切壊さない
- 既存のcalendar_eventsデータを保持
- 後方互換性を維持

### 3. **型安全性の確保**
- 設計書の型定義を必ず使用
- anyタイプは使用禁止
- TypeScriptエラー0を維持

---

## 🔧 セッション開始手順

### 1. 環境確認
```bash
# 作業ディレクトリ確認
pwd  # /mnt/c/find-to-do-management-app

# Git状態確認
git status
git log --oneline -5

# ビルド確認
npm run build
npx tsc --noEmit
```

### 2. 設計書確認
```bash
# 必須ドキュメントを読む
cat docs/CALENDAR_FEATURE_MASTER_DESIGN.md
cat docs/CALENDAR_SCHEMA_DESIGN.md
```

### 3. 現在のデータ確認
```bash
# カレンダー関連データ統計
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.calendar_events.count(), p.tasks.count({where: {dueDate: {not: null}}}), p.appointments.count()]).then(r => console.log('カレンダー関連:', {events: r[0], tasksWithDue: r[1], appointments: r[2]})).finally(() => p.\$disconnect())"
```

### 4. 実装フェーズ選択
```
私は Phase X を担当します。
設計書の Phase X セクションに従って実装を開始します。
```

---

## 📝 各フェーズ実装ガイド

### Phase 1: 基盤構築
```bash
# 1. Prismaスキーマ更新
# prisma/schema.prismaを編集

# 2. マイグレーション作成
npx prisma migrate dev --name add_calendar_features

# 3. 型生成
npx prisma generate

# 4. 基本API実装
# src/app/api/calendar/events/route.ts
```

### Phase 2: UI基本実装
```typescript
// src/components/calendar/CalendarView.tsx
import { CalendarEvent, ViewMode } from '@/types/calendar';

export function CalendarView() {
  // 月/週/日表示の実装
}
```

### Phase 3-10: 各フェーズ詳細
設計書の該当セクションを参照してください。

---

## 🧪 テスト実行

### 単体テスト
```bash
npm test -- calendar
```

### 統合テスト
```bash
npm run test:integration
```

### 手動テスト
```bash
npm run dev
# http://localhost:3000/calendar でアクセス
```

---

## 📊 進捗報告

各フェーズ完了時は、設計書の進捗報告テンプレートを使用してください。

```markdown
## Phase X 進捗報告

### 完了項目
- [x] Prismaスキーマ更新
- [x] マイグレーション実行
- [x] 基本API実装

### 実装内容
- ファイル: `prisma/schema.prisma`
- 主な変更: calendar_eventsテーブル拡張

### 確認事項
- TypeScriptエラー: 0件
- テスト結果: 10/10成功

### 次フェーズへの申し送り
- recurring_rulesテーブルが追加されました
- userId外部キーが必須になりました
```

---

## 🆘 トラブルシューティング

### よくある問題

#### 1. Prismaエラー
```bash
# スキーマ同期
npx prisma db push

# 型再生成
npx prisma generate
```

#### 2. TypeScriptエラー
```bash
# 型チェック
npx tsc --noEmit

# 設計書の型定義を確認
cat docs/CALENDAR_FEATURE_MASTER_DESIGN.md | grep -A 50 "型定義"
```

#### 3. ビルドエラー
```bash
# クリーンビルド
rm -rf .next
npm run build
```

---

## 🎯 成功基準

### 各フェーズ共通
- [ ] TypeScriptエラー: 0件
- [ ] ESLintエラー: 0件
- [ ] 既存機能への影響: なし
- [ ] パフォーマンス: 2秒以内

### 最終確認
- [ ] すべてのユーザー要件を満たしている
- [ ] 設計書から逸脱していない
- [ ] テストがすべて成功している

---

**このプロンプトと設計書を使用することで、確実にカレンダー機能を実装できます。**

質問がある場合は、まず設計書を確認し、それでも不明な場合は要件定義に立ち返ってください。

頑張ってください！ 🚀
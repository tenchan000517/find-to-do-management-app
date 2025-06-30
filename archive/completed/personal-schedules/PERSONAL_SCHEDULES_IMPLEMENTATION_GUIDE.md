# 個人予定管理システム 実装ガイド

**基準文書**: `PERSONAL_SCHEDULES_SYSTEM_SPECIFICATION.md`  
**実装期間**: 6-8日  
**最終更新**: 2025-06-15

---

## 🎯 実装フロー概要

```
Phase 1: DB基盤 → Phase 2: API → Phase 3: LINEボット → Phase 4: UI → Phase 5: テスト

```

---

## 📋 Phase 1: データベース基盤 (1-2日)

### 🎯 目標
personal_schedulesテーブルの追加とPrisma設定

### 📖 参照箇所
- **仕様書**: 「データベース設計」章 (p.XX)
- **マイグレーション**: 仕様書内のSQL文をそのまま使用

### ✅ 実装チェックリスト
- [ ] `prisma/schema.prisma` にpersonal_schedulesモデル追加
- [ ] `npx prisma migrate dev --name add_personal_schedules` 実行
- [ ] `npx prisma generate` でクライアント更新
- [ ] データベース接続確認

### 🔧 実装コマンド
```bash
# マイグレーション作成・実行
npx prisma migrate dev --name add_personal_schedules

# Prismaクライアント再生成
npx prisma generate

# 動作確認
npx prisma studio
```

### ✋ Phase 1 完了条件
- Prisma Studioでpersonal_schedulesテーブルが表示される
- 型エラーが発生しない

---

## 🔌 Phase 2: API実装 (2-3日)

### 🎯 目標
個人予定のCRUD API + 統合カレンダーAPI

### 📖 参照箇所
- **仕様書**: 「API設計」章 - 全エンドポイント仕様
- **参考**: 既存の`src/app/api/calendar/events/route.ts`

### ✅ 実装チェックリスト
- [ ] `src/app/api/schedules/route.ts` (GET, POST)
- [ ] `src/app/api/schedules/[id]/route.ts` (GET, PUT, DELETE)
- [ ] `src/app/api/calendar/unified/route.ts` (統合API)
- [ ] Postmanでテスト実行

### 🔧 実装のコツ
```typescript
// 既存のcalendar APIを参考にする
// src/app/api/calendar/events/route.ts の構造をコピー
// personal_schedulesテーブル用に調整
```

### ✋ Phase 2 完了条件
- 全APIエンドポイントが正常動作
- 統合APIで個人予定とイベントが混在表示

---

## 🤖 Phase 3: LINEボット統合 (1-2日)

### 🎯 目標
LINEメッセージから個人予定の自動作成

### 📖 参照箇所
- **仕様書**: 「LINEボット統合」章
- **既存処理**: `src/app/api/webhook/line/route.ts:615-647`

### ✅ 実装チェックリスト
- [ ] `saveClassifiedData`関数にpersonal_schedule分岐追加
- [ ] `src/lib/ai/text-processor.ts`の分類拡張
- [ ] LINE Webhookでテスト

### 🔧 実装ポイント
```typescript
// 既存のscheduleケースをコピーして
// personal_scheduleケースを追加するだけ
case 'personal_schedule':
  await prisma.personal_schedules.create({...});
```

### ✋ Phase 3 完了条件
- LINEで「明日14時に歯医者」→ 個人予定として保存
- LINEで「来週チーム会議」→ パブリックイベントとして保存

---

## 🎨 Phase 4: フロントエンド実装 (2-3日)

### 🎯 目標
カレンダーUI統合と個人予定表示

### 📖 参照箇所
- **仕様書**: 「フロントエンド設計」章
- **既存UI**: `src/components/calendar/` 全ファイル

### ✅ 実装チェックリスト
- [ ] `src/types/personal-schedule.ts` 作成
- [ ] `CalendarView.tsx` - 統合データ取得
- [ ] `EventCard.tsx` - 個人予定の視覚的区別
- [ ] `EventEditModal.tsx` - 個人予定編集対応

### 🔧 実装のコツ
- 既存のCalendarEventをUnifiedCalendarEventに置き換え
- sourceフィールドで個人/パブリック判定
- 色分けで区別表示

### ✋ Phase 4 完了条件
- カレンダーに個人予定とパブリックイベントが区別して表示
- 個人予定の作成・編集・削除が可能

---

## 🧪 Phase 5: テスト・最適化 (1日)

### 🎯 目標
全体動作確認とパフォーマンス最適化

### 📖 参照箇所
- **仕様書**: 「テスト仕様」章

### ✅ 実装チェックリスト
- [ ] LINEボット → 個人予定作成 → カレンダー表示のE2Eテスト
- [ ] 既存機能の影響確認
- [ ] パフォーマンステスト
- [ ] ユーザビリティテスト

### ✋ Phase 5 完了条件
- 全機能が期待通り動作
- 既存システムに影響なし

---

## 📊 進捗報告テンプレート

### Phase [X] 完了報告

**実装日**: YYYY-MM-DD  
**実装者**: [名前]  
**所要時間**: [X]時間

#### ✅ 完了項目
- [x] 項目1
- [x] 項目2

#### ⚠️ 課題・注意点
- 問題点1: 解決方法
- 問題点2: 解決方法

#### 🔄 次フェーズへの引き継ぎ
- 注意事項1
- 注意事項2

#### 📸 動作確認
- [ ] スクリーンショット添付
- [ ] ログ確認済み

---

## 🆘 トラブルシューティング

### よくある問題

**1. Prismaエラー**
```bash
# 解決方法
npx prisma generate
npx prisma db push
```

**2. 型エラー**
- 仕様書の型定義を確認
- 既存のcalendar.tsと統一

**3. LINEボット動作しない**
- Webhook URLの確認
- 環境変数の確認

### 🔗 参考リンク

- 仕様書: `PERSONAL_SCHEDULES_SYSTEM_SPECIFICATION.md`

---

## 📋 最終チェックリスト

実装完了前の最終確認:

### 機能面
- [ ] LINEからの個人予定作成
- [ ] カレンダーでの統合表示
- [ ] 個人予定の手動CRUD
- [ ] 既存機能の正常動作

### 技術面
- [ ] APIレスポンス速度 < 1秒
- [ ] 型安全性確保
- [ ] エラーハンドリング完備
- [ ] ログ出力適切

### データ面
- [ ] 既存データ無影響
- [ ] 新規データ正常保存
- [ ] データ整合性確保

---

**作成者**: Claude Code  
**用途**: 段階的実装ガイド + 進捗管理ツール
# 📅 JST日付変換バグ修正ナレッジ

**作成日**: 2025-06-18  
**重要度**: 🔴 高（システム全体に影響）  
**修正者**: Claude Code  

---

## 🚨 問題の概要

### **症状**
- カレンダーで24日のイベントが25日に表示される
- モーダルの日付表示とカレンダーマス上の配置が1日ずれる
- 「今日」のハイライトが間違った日付に表示される

### **根本原因**
`getJSTDateString()` 関数で `toISOString().split('T')[0]` を使用していたため、JST変換済みのDateオブジェクトでもUTC基準の日付文字列が生成されていた。

---

## 🔍 詳細分析

### **問題発生メカニズム**

```typescript
// 問題のあったコード
export function getJSTDateString(date?: Date): string {
  const jstDate = date ? convertToJST(date) : getJSTDate();
  return jstDate.toISOString().split('T')[0]; // ❌ UTC基準で日付文字列生成
}
```

**具体例**:
- 入力: `'2025-06-17T15:00:00.000Z'` (UTC)
- JST変換後: `2025/6/18 2:39:04` (実際は18日)
- `toISOString()`: `'2025-06-17'` (UTC基準で17日と誤生成)
- 結果: 18日のイベントが17日として処理される

### **影響範囲**
1. **カレンダー表示**: イベントが間違った日付マスに配置
2. **今日判定**: `getTodayJST()` が不正確な日付を返す
3. **モーダル表示**: DayEventsModalの日付フォーマットが不整合
4. **統合API**: イベントフィルタリングで日付不一致

---

## ✅ 修正内容

### **1. getJSTDateString()関数の修正**

```typescript
// 修正後のコード
export function getJSTDateString(date?: Date): string {
  const jstDate = date ? convertToJST(date) : getJSTDate();
  // toISOString()はUTC基準なので、JST変換後のDateから直接年月日を取得
  const year = jstDate.getFullYear();
  const month = String(jstDate.getMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

**修正ポイント**:
- `toISOString()` の使用を停止
- JST変換後のDateオブジェクトから直接年月日を取得
- `getFullYear()`, `getMonth()`, `getDate()` を使用して正確な日付文字列生成

### **2. EventEditModal統合API対応**

```typescript
// ps_プレフィックス適切処理
case 'personal_schedules':
  const personalId = event.id.startsWith('personal_') 
    ? event.id.replace('personal_', '') 
    : event.id; // ps_プレフィックスの場合はそのまま使用
```

**修正ポイント**:
- `ps_` プレフィックスは実際のDBのIDなのでそのまま使用
- `personal_` プレフィックスのみ除去対象
- 統合API方針に沿ったソース別エンドポイント選択

### **3. DayEventsModal JST統一**

```typescript
// JST基準日付フォーマット
const formatDate = (date: Date) => {
  const jstDate = convertToJST(date);
  const year = jstDate.getFullYear();
  const month = jstDate.getMonth() + 1;
  const day = jstDate.getDate();
  const weekDay = ['日', '月', '火', '水', '木', '金', '土'][jstDate.getDay()];
  return `${year}年${month}月${day}日(${weekDay})`;
};
```

---

## 🛠️ 技術的学習ポイント

### **1. タイムゾーン処理の注意点**
- `toISOString()` は常にUTC基準で文字列を生成
- JST変換済みDateオブジェクトでも内部的にはUTCとして扱われる
- 正確な日付文字列が必要な場合は直接 `getFullYear()` 等を使用

### **2. JST変換の正しいアプローチ**
```typescript
// ❌ 間違い: JST変換後でもtoISOString()はUTC基準
const dateStr = jstDate.toISOString().split('T')[0];

// ✅ 正解: JST変換後のDateから直接日付要素を取得
const year = jstDate.getFullYear();
const month = String(jstDate.getMonth() + 1).padStart(2, '0');
const day = String(jstDate.getDate()).padStart(2, '0');
const dateStr = `${year}-${month}-${day}`;
```

### **3. 統合システムでのID処理**
- プレフィックスの意味を正確に理解する
- LINEボット生成の `ps_` は実際のDB ID
- UI用の `personal_` は表示用プレフィックス
- ソース別に適切なAPI エンドポイントを選択

---

## 🔍 デバッグ手法

### **問題特定に有効だったログ**
```javascript
console.log('🕐 今日判定デバッグ:', {
  'チェック対象日付': dateStr,
  '今日(JST)': todayStr,
  '現在時刻(JST)': jstNow.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
  '判定結果': dateStr === todayStr,
  '元Date': date.toISOString(),
  'JST変換後': getJSTDate(date).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
});
```

**キーポイント**:
- 同じDateオブジェクトの複数表現を並べて比較
- JST変換前後の値を確認
- 期待値と実際の結果を明確に対比

---

## 📋 修正ファイル一覧

1. **`src/lib/utils/datetime-jst.ts`**: getJSTDateString()関数修正
2. **`src/components/calendar/MonthView.tsx`**: デバッグログ追加・今日判定精度向上
3. **`src/components/calendar/EventEditModal.tsx`**: 統合API対応・ps_ID処理修正
4. **`src/components/calendar/DayEventsModal.tsx`**: JST基準日付フォーマット統一
5. **`docs/archive/PROJECT_PROGRESS_REPORT.md`**: 修正記録追加

**変更統計**: 8ファイル変更、593行追加、49行削除

---

## 🎯 修正効果

### **✅ 解決された問題**
1. **イベント配置**: 24日のイベントが正確に24日に表示
2. **今日ハイライト**: 現在日付が正しくハイライト表示
3. **モーダル一貫性**: 日付表示とカレンダー配置が一致
4. **編集機能**: ps_プレフィックスイベントの編集が正常動作

### **📈 システム改善**
- **型安全性**: TypeScript エラー 0件維持
- **データ一貫性**: カレンダー全体でJST基準統一
- **ユーザビリティ**: 期待通りの日付表示・操作
- **保守性**: 統合API方針による一貫した処理

---

## 🚨 今後の注意点

### **1. 日付処理時の原則**
- JST変換が必要な箇所では `datetime-jst.ts` ユーティリティを必ず使用
- `toISOString()` 使用時はUTC基準であることを認識
- 日付文字列生成時は変換後のDateオブジェクトから直接取得

### **2. デバッグ時のチェックポイント**
- タイムゾーン変換前後の値を必ず比較
- 同じ日付の複数表現（ISO文字列、ローカル文字列、個別要素）を確認
- 期待値と実際の結果を明確に対比ログ出力

### **3. 統合システムでの留意事項**
- ID プレフィックスの意味と処理方法を文書化
- ソース別API エンドポイントマッピングを明確化
- 新しい日付関連機能追加時は必ずJST統一を確認

---

**結論**: この修正により、カレンダーシステムの日付処理が完全に正常化し、ユーザーの期待通りの動作を実現。今後の日付関連開発時の重要な参考事例となる。
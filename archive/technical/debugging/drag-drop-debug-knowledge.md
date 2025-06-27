# ドラッグ&ドロップ機能デバッグ・問題解決ナレッジ

## 概要
カレンダーのドラッグ&ドロップ機能実装時に発生した問題と、その解決プロセスについてのナレッジベース。
タスクカンバンなど他のドラッグ&ドロップ実装時の参考資料として活用可能。

## 問題発生の経緯

### 初期症状
- カードのドラッグは可能だが、日付移動が反映されない
- API呼び出しは成功（200レスポンス）
- データベース更新も正常に実行
- しかしUI上でカードが元の位置に戻る

### 問題の複雑性
複数の要因が絡み合った複合問題：
1. **UTC/JST日付変換の不整合**
2. **API競合状態（Race Condition）**
3. **キャッシュによるデータ遅延**

## デバッグアプローチ・思考プロセス

### 1. 段階的ログ追加戦略

#### 1.1 フロントエンド側のログ配置
```typescript
// CalendarView.tsx - ドラッグイベントの流れを追跡
const handleDragStart = (event: DragStartEvent) => {
  console.log('🎬 Drag Start Event:', event);
  const draggedData = event.active.data.current;
  console.log('📍 Dragged Data:', draggedData);
  
  if (draggedData?.type === 'calendar-event') {
    console.log('✅ Setting dragged event:', draggedData.event);
    setDraggedEvent(draggedData.event);
  } else {
    console.log('❌ Invalid drag data type:', draggedData?.type);
  }
};

const handleDragEnd = (event: DragEndEvent) => {
  console.log('🎯 Drag End Event:', event);
  const { active, over } = event;
  
  console.log('📍 Active:', active);
  console.log('📍 Over:', over);
  console.log('📍 Dragged Event:', draggedEvent);
  
  // ... 詳細なドロップ処理ログ
};
```

**配置理由**: ドラッグ&ドロップの各段階での状態を詳細に把握するため

#### 1.2 API側のログ配置
```typescript
// /api/schedules/[id]/route.ts
console.log('Updating schedule:', id, 'with data:', updateData);
const updatedSchedule = await prisma.personal_schedules.update({...});
console.log('Updated schedule result:', { id: updatedSchedule.id, date: updatedSchedule.date });
```

**配置理由**: データベース更新が実際に正しく行われているかを確認

#### 1.3 統合API側のログ配置
```typescript
// /api/calendar/unified/route.ts
console.log('Personal schedules found:', personalSchedules.length);
personalSchedules.forEach((schedule: any) => {
  console.log('Processing schedule:', { id: schedule.id, date: schedule.date });
  // ...
});
```

**配置理由**: 更新後のデータ取得時に正しい値が返されているかを確認

### 2. 問題特定の思考プロセス

#### 2.1 第一段階: 基本動作確認
**仮説**: ドラッグ&ドロップ自体が動作していない
**検証**: ログで確認
**結果**: ドラッグ&ドロップは正常動作 → 次段階へ

#### 2.2 第二段階: API呼び出し確認
**仮説**: API呼び出しが失敗している
**検証**: サーバーログとレスポンス確認
**結果**: API呼び出しも成功（200） → 次段階へ

#### 2.3 第三段階: データベース更新確認
**仮説**: データベース更新が実際には行われていない
**検証**: 更新前後のデータをログ出力
**結果**: データベース更新も正常 → 次段階へ

#### 2.4 第四段階: データ取得確認
**仮説**: 更新後のデータ取得時に古いデータが返される
**検証**: 統合API側でのデータ取得内容を確認
**結果**: **ここで問題発見！古いデータが返されている**

### 3. 根本原因の特定

#### 3.1 UTC/JST変換問題
```typescript
// 問題のあったコード
const dateString = date.toISOString().split('T')[0]; // UTC基準

// 修正後のコード
const dateString = getJSTDateString(date); // JST基準
```

**発見過程**: 
- ドラッグ開始時のイベント日付: `2025-06-24`
- ドロップ先の日付: `2025-06-26`
- しかし内部的にはUTC/JSTの変換で1日ズレが発生

#### 3.2 競合状態問題
**症状**: 複数のAPI呼び出しが同時発生し、結果が競合
**原因**: 
- データベース更新API
- データ再取得API
- キャッシュされたレスポンス

**解決**: 
- キャッシュ一時無効化
- API呼び出し重複防止
- 適切な順序での処理

## 効果的だったデバッグ手法

### 1. 段階的ログ配置
- **開始**: 最小限のログから開始
- **拡張**: 問題箇所を特定後、該当箇所の詳細ログを追加
- **削除**: 問題解決後、不要なログを削除

### 2. エモジ付きログの効果
```typescript
console.log('🎯 Drag End Event:', event);  // 視覚的に識別しやすい
console.log('📍 Drop target:', overData?.type, overData?.date);
console.log('✅ Moving event');
console.log('❌ Same date, no move');
```

**メリット**: 
- ログの種類が一目で分かる
- デバッグ時の視認性向上
- 問題箇所の迅速な特定

### 3. データフロー追跡
各段階でのデータ状態を記録：
1. ドラッグ開始時のイベントデータ
2. API送信時のリクエストデータ
3. データベース更新後のレスポンス
4. 再取得時のデータ

## 解決策の実装

### 1. UTC/JST問題の修正
```typescript
// DraggableCalendarCell.tsx
import { getJSTDateString } from '@/lib/utils/datetime-jst';

const dateString = getJSTDateString(date); // UTC → JST
```

### 2. 競合状態の解決
```typescript
// CalendarView.tsx
const [isFetching, setIsFetching] = useState(false);

const fetchEvents = async () => {
  if (isFetching) {
    console.log('Already fetching, skipping...');
    return; // 重複防止
  }
  // ...
};
```

### 3. キャッシュ無効化
```typescript
// /api/calendar/unified/route.ts
// リアルタイム更新のためキャッシュを一時的に無効化
// const cached = await cache.get(cacheKey);
// if (cached) { ... }
```

## タスクカンバンへの応用指針

### 1. 同様の問題の予防策
- **日付処理**: 最初からJST統一で実装
- **状態管理**: Redux ToolkitやZustandでの一元管理検討
- **API設計**: 楽観的更新 + エラー時のロールバック

### 2. デバッグ準備
- **開発環境**: 詳細ログの標準実装
- **本番環境**: エラーログのみ残す
- **ログレベル**: 環境変数での制御

### 3. 推奨実装パターン
```typescript
// タスクカンバンでの推奨実装
const moveTask = async (taskId: string, newStatus: TaskStatus) => {
  console.log('🔄 Moving task:', { taskId, newStatus });
  
  try {
    // 楽観的更新
    updateTaskOptimistically(taskId, newStatus);
    
    // API呼び出し
    const result = await api.updateTaskStatus(taskId, newStatus);
    console.log('✅ Task moved successfully:', result);
    
  } catch (error) {
    console.error('❌ Task move failed:', error);
    // ロールバック
    revertTaskStatus(taskId);
  }
};
```

## 学んだ教訓

### 1. デバッグアプローチ
- **仮説検証**: 段階的に問題箇所を絞り込む
- **ログ戦略**: 最小限から開始し、必要に応じて拡張
- **データフロー**: 全体の流れを把握してから詳細調査

### 2. 技術的教訓
- **日付処理**: UTC/JST変換は一箇所に集約
- **競合状態**: 非同期処理での状態管理に注意
- **キャッシュ**: リアルタイム性が必要な場合の適切な無効化

### 3. 開発効率化
- **エモジログ**: 視覚的識別による効率向上
- **段階的実装**: 動作確認しながらの漸進的開発
- **問題の分離**: 複合問題を単一問題に分解

## 今後の改善方針

### 短期的改善
- [x] 遅延削除によるUI応答性回復
- [ ] デバッグログの整理・最適化

### 長期的改善
- [ ] データベース競合状態の根本調査
- [ ] キャッシュ戦略の見直し
- [ ] 楽観的更新の実装検討

---

このナレッジは、今後のドラッグ&ドロップ機能実装（タスクカンバン等）での問題解決の指針として活用してください。
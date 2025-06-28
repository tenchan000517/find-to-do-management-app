# @dnd-kit高度ドラッグ&ドロップアニメーション実装ガイド

## 概要
本プロジェクトで実装した@dnd-kitを使用した高度なドラッグ&ドロップアニメーション技術について。
タスクカンバンへの適用など、他のコンポーネントでの再利用を想定したナレッジベース。

## 実装例: EventCard コンポーネント

### 1. 基本セットアップ

```tsx
import { useDraggable } from '@dnd-kit/core';

// ドラッガブル要素での実装
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  isDragging
} = useDraggable({
  id: `event-${event.id}`,
  data: {
    type: 'calendar-event',
    event
  }
});
```

### 2. スタイル適用

```tsx
// Transform スタイルの計算
const dragStyle = transform ? {
  transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
} : undefined;

// JSX での適用
<div
  ref={setNodeRef}
  style={{
    backgroundColor: eventColor,
    color: '#FFFFFF',
    ...dragStyle  // ドラッグ中のアニメーション
  }}
  className={`
    group rounded-lg cursor-grab transition-all duration-200 hover:shadow-md font-medium
    ${isDragging ? 'opacity-50 z-50' : ''}  // ドラッグ中の視覚フィードバック
    active:cursor-grabbing
  `}
  {...listeners}  // ドラッグイベントリスナー
  {...attributes} // アクセシビリティ属性
>
```

### 3. ドロップ対応（DraggableCalendarCell）

```tsx
import { useDroppable } from '@dnd-kit/core';

const { setNodeRef, isOver } = useDroppable({
  id: `calendar-cell-${dateString}`,
  data: { 
    type: 'calendar-cell',
    date: dateString 
  }
});
```

### 4. 上位コンテナ（CalendarView）

```tsx
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';

// ドラッグ状態管理
const [draggedEvent, setDraggedEvent] = useState<UnifiedCalendarEvent | null>(null);

// ドラッグ開始処理
const handleDragStart = (event: DragStartEvent) => {
  const draggedData = event.active.data.current;
  if (draggedData?.type === 'calendar-event') {
    setDraggedEvent(draggedData.event);
  }
};

// ドラッグ終了処理
const handleDragEnd = (event: DragEndEvent) => {
  setDraggedEvent(null);
  
  const { active, over } = event;
  if (!over) return;

  const draggedData = active.data.current;
  const dropData = over.data.current;
  
  if (draggedData?.type === 'calendar-event' && dropData?.type === 'calendar-cell') {
    const eventId = draggedData.event.id;
    const newDate = dropData.date;
    handleEventMove(eventId, newDate);
  }
};

// JSX
<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
  {/* ドラッガブル要素 */}
  
  {/* ドラッグオーバーレイ */}
  <DragOverlay>
    {draggedEvent ? (
      <DraggableEvent event={draggedEvent} onEdit={() => {}} onMove={() => {}} />
    ) : null}
  </DragOverlay>
</DndContext>
```

## タスクカンバンへの適用方針

### 1. 必要な修正箇所

#### TaskCard コンポーネント
- `useDraggable` フック追加
- `transform` と `isDragging` による視覚フィードバック
- ドラッグ時のスタイル適用

#### ステータス列（カンバンコラム）
- `useDroppable` フック追加
- ドロップゾーンの視覚フィードバック

#### タスクボード全体
- `DndContext` でラップ
- `onDragStart` と `onDragEnd` ハンドラー
- `DragOverlay` での統一感あるドラッグプレビュー

### 2. 実装のメリット

#### 視覚的な改善
- **滑らかなアニメーション**: GPU加速による60FPSアニメーション
- **視覚フィードバック**: ドラッグ中の透明度変更、マウスカーソル変更
- **ドラッグプレビュー**: 統一されたオーバーレイ表示

#### ユーザビリティ向上
- **タッチデバイス対応**: モバイル・タブレットでの確実な動作
- **アクセシビリティ**: キーボードナビゲーション対応
- **直感的操作**: ドラッグ&ドロップの期待通りの動作

#### 技術的優位性
- **パフォーマンス**: CSS Transform による最適化
- **統合性**: React エコシステムとの完全統合
- **拡張性**: 複雑なドラッグ&ドロップロジックへの対応

### 3. 実装時の注意点

#### パフォーマンス
- `transform: translate3d()` を使用してGPU加速を活用
- `isDragging` 状態での不要な再レンダリング回避

#### 状態管理
- ドラッグ状態をコンポーネント間で適切に共有
- ドラッグ終了時の確実なクリーンアップ

#### レスポンシブ対応
- モバイルとデスクトップでの操作性の最適化
- タッチイベントとマウスイベントの適切な処理

## 実装済み成果

### EventCard統合完了
- ✅ @dnd-kit高度ドラッグ機能
- ✅ 滑らかなtransformアニメーション  
- ✅ isDragging視覚フィードバック
- ✅ アクセシビリティ・タッチデバイス対応
- ✅ 既存ColorModeシステム維持
- ✅ レスポンシブ表示制限最適化

### API統合修正
- ✅ PATCH → PUT メソッド統一
- ✅ イベント移動の完全動作確認

この技術をタスクカンバンに適用することで、同レベルの高品質なドラッグ&ドロップ体験を提供できます。
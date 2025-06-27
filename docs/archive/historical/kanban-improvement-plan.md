# カンバン機能総合改善計画

**作成日**: 2024年06月18日  
**対象**: カンバンドラッグ&ドロップ機能の改善  
**参考実装**: カレンダーコンポーネントの日付移動ロジック

## 📋 背景と現状

### 現在の動作状況
- ✅ 基本的なドラッグ&ドロップ動作
- ✅ API統合と移動処理（`/api/kanban/move`）
- ⚠️ タイムアウトエラー（API応答9秒 vs タイムアウト5秒）
- ⚠️ 重複操作の警告（`カンバン移動が既に進行中です`）

### 調査で判明した問題
1. **UIフィードバック不足**: 移動先が不明確
2. **ローディング状態不適切**: 競合状態が発生
3. **タブ別処理未統一**: ステータス/ユーザー/プロジェクト別で処理が異なる
4. **パフォーマンス問題**: タイムアウト設定が短すぎる

## 🎯 優先度付き改善計画

### **高優先度（Critical）**

#### 1. カレンダーの視覚的フィードバックをカンバンに適用
**目的**: 移動先確定の明確化とUX向上

**実装箇所**:
- `src/components/tasks/EnhancedTaskKanban.tsx` - メインコンポーネント
- CSS クラス追加

**実装内容**:
```tsx
// ドロップ可能領域のハイライト
const { setNodeRef, isOver } = useDroppable({
  id: column.id,
});

return (
  <div 
    ref={setNodeRef} 
    className={`
      flex-1 space-y-3 transition-all duration-200
      ${isOver ? 'bg-blue-100 ring-2 ring-blue-300 border-blue-400 border-2 border-dashed' : ''}
    `}
  >
    {/* カンバンカード */}
  </div>
);
```

**参考ファイル**: 
- `src/components/calendar/DraggableEvent.tsx`
- `src/components/calendar/DraggableCalendarCell.tsx`

#### 2. ローディング状態管理の改善
**目的**: 重複操作防止と明確なフィードバック

**実装箇所**:
- `src/lib/hooks/useKanbanMove.ts`

**実装内容**:
```typescript
export const useKanbanMove = (config: KanbanMoveConfig = {}) => {
  const [isMoving, setIsMoving] = useState(false);
  const [dragLoading, setDragLoading] = useState(false); // 追加
  const debounceRef = useRef<NodeJS.Timeout>(); // 追加

  const moveItem = useCallback(async (request: KanbanMoveRequest) => {
    // デバウンス処理
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 重複処理防止の強化
    if (isMoving || dragLoading) {
      return { success: false, error: '移動処理が既に進行中です' };
    }

    debounceRef.current = setTimeout(async () => {
      setDragLoading(true);
      try {
        // 既存の移動処理
      } finally {
        setDragLoading(false);
      }
    }, 300);
  }, [isMoving, dragLoading]);

  return {
    moveItem,
    isMoving: isMoving || dragLoading, // 統合ローディング状態
    // ...
  };
};
```

#### 3. タブ別処理の統一化
**目的**: ステータス/ユーザー/プロジェクト別の適切な処理分岐

**実装箇所**:
- `src/components/tasks/EnhancedTaskKanban.tsx`

**実装内容**:
```typescript
const handleStatusChange = async (task: Task, newValue: string) => {
  let moveRequest: KanbanMoveRequest;

  // タブの種類に応じて移動リクエストを作成
  switch (currentTab) {
    case 'status':
      // ステータス変更（現在の実装）
      moveRequest = createTaskMoveRequest(task.id, newValue, task.status);
      break;
      
    case 'user':
      // 担当者変更
      moveRequest = createTaskAssignmentRequest(
        task.id, 
        newValue, // 新しい担当者ID
        task.assignedTo // 現在の担当者ID
      );
      break;
      
    case 'project':
      // プロジェクト移動
      moveRequest = {
        itemType: 'task',
        itemId: task.id,
        sourceColumn: task.projectId || 'no_project',
        targetColumn: newValue || 'no_project',
        kanbanType: 'project'
      };
      break;
      
    default:
      console.error('未対応のタブタイプ:', currentTab);
      return;
  }

  await moveItem(moveRequest);
};
```

### **中優先度（Important）**

#### 4. タイムアウト設定の最適化
**実装箇所**:
- `src/lib/utils/kanban-utils.ts`

**現在の設定**:
```typescript
timeout: 5000,  // 5秒
retryCount: 3,  // 3回
```

**推奨設定**:
```typescript
timeout: 15000, // 15秒（API応答9秒に対応）
retryCount: 2,  // 2回（過度なリトライを防止）
debounceDelay: 300, // 300ms（連続操作防止）
```

#### 5. デバウンス機能の実装
**目的**: 連続ドラッグ操作の防止

**実装箇所**:
- `src/lib/hooks/useKanbanMove.ts`

### **低優先度（Enhancement）**

#### 6. 統一UI/UXシステムの構築
**目的**: カレンダーとカンバンの一貫したユーザー体験

**実装箇所**:
- `src/lib/hooks/useUnifiedMove.ts` (新規作成)

## 🚀 実装順序

1. **視覚的フィードバック改善** → 2. **ローディング状態管理** → 3. **タブ別処理統一**
2. 4. **タイムアウト最適化** → 5. **デバウンス機能** → 6. **統一システム構築**

## 📁 関連ファイル

### カレンダー参考ファイル
- `src/components/calendar/DraggableEvent.tsx` - アニメーション実装
- `src/components/calendar/CalendarView.tsx` - ローディング管理  
- `src/components/calendar/DraggableCalendarCell.tsx` - ドロップフィードバック

### カンバン対象ファイル
- `src/components/tasks/EnhancedTaskKanban.tsx` - メイン実装対象
- `src/lib/hooks/useKanbanMove.ts` - フック改善
- `src/lib/utils/kanban-utils.ts` - ユーティリティ改善

### 既存カンバンコンポーネント
- `src/components/KanbanBoard.tsx`
- `src/components/UserKanbanBoard.tsx`
- `src/components/ProjectKanbanBoard.tsx`
- `src/components/AppointmentKanbanBoard.tsx`
- `src/components/appointments/EnhancedAppointmentKanban.tsx`

## 📊 成功指標

### 改善前の問題
- タイムアウトエラー: 5秒制限でAPI応答9秒
- 重複操作警告: 連続ドラッグ時の競合
- UI不明確: ドロップ先が分からない

### 改善後の目標
- ✅ タイムアウトエラー解消
- ✅ 重複操作完全防止
- ✅ 明確な視覚的フィードバック
- ✅ 統一されたタブ別処理

## 🔧 技術詳細

### 現在の実装状況
- **API**: `/api/kanban/move` (統合エンドポイント作成済み)
- **フロントエンド**: `useKanbanMove`フック (基本実装済み)
- **バリデーション**: 移動可能性チェック (実装済み)
- **楽観的更新**: リアルタイムUI更新 (実装済み)

### カレンダーから学ぶべき成功要素
1. **視覚的フィードバックの豊富さ**: ドロップ領域の明確な表示
2. **専用ローディング状態**: 移動専用のローディング表示
3. **柔軟な処理分岐**: 異なるデータタイプへの対応

### カンバンの既存優位点
1. **楽観的更新**: リアルタイムなUI更新
2. **ロールバック機能**: エラー時の自動復旧
3. **統一API設計**: 一貫した移動処理
4. **バリデーション**: 移動可能性の事前検証

## 📝 実装時の注意点

1. **CSS競合回避**: 既存のTailwindクラスとの競合に注意
2. **パフォーマンス**: デバウンス処理でメモリリーク防止
3. **後方互換性**: 既存のコールバック関数を維持
4. **エラーハンドリング**: 適切なユーザーフィードバック
5. **テスト**: 各タブでの移動テストを実施

---

**この計画に従って実装することで、カレンダーと同等以上のUX品質を持つカンバン機能を実現できます。**
# FEATURE: アポイントメントカレンダードラッグ&ドロップ機能

**作成日**: 2025年6月30日  
**分類**: Feature Request - Essential  
**影響範囲**: カレンダー機能・アポイントメント管理  
**優先度**: High  

---

## 🎯 機能要件

アポイントメントのカレンダー表示機能を追加し、日付間でのドラッグ&ドロップによる日付変更機能を実装する。ドロップ時にはモーダルで追加情報の変更確認を行う。

### **要求される機能**

#### **1. カレンダー表示機能**
- アポイントメントのカレンダービュー実装
- 日付別アポイントメント表示
- 月/週/日ビューの切り替え
- 既存のカンバンビューとの切り替え機能

#### **2. ドラッグ&ドロップ機能**
- カレンダー上でのアポイントメント移動
- 直感的な日付変更操作
- ドラッグ中の視覚的フィードバック
- 有効/無効なドロップゾーンの表示

#### **3. 変更確認モーダル**
- 日付変更時の確認ダイアログ表示
- 追加で変更可能な項目の選択：
  - **フェーズ**: 営業段階の更新（LEAD/PROSPECT/PROPOSAL等）
  - **関係性**: 顧客関係の更新（FIRST_CONTACT/TRUST_ESTABLISHED等）
  - **処理ステータス**: 進行状況の更新（PENDING/IN_PROGRESS等）
  - **時刻**: 具体的な時間の調整
  - **場所**: 面談場所の変更

---

## 🔍 技術要件

### **カレンダーライブラリ**
```typescript
// 推奨ライブラリの検討
import { Calendar } from '@/components/ui/Calendar'; // 既存使用確認
// または
import FullCalendar from '@fullcalendar/react';
import { DndContext } from '@dnd-kit/core'; // 既存DnD活用
```

### **データ構造**
```typescript
interface CalendarAppointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  companyName: string;
  contactName: string;
  phase: AppointmentPhase;
  relationshipStatus: RelationshipStatus;
  processingStatus: ProcessingStatus;
  location?: string;
  notes?: string;
}

interface AppointmentMoveRequest {
  appointmentId: string;
  newDate: Date;
  newTime?: string;
  updateFields?: {
    phase?: AppointmentPhase;
    relationshipStatus?: RelationshipStatus;
    processingStatus?: ProcessingStatus;
    location?: string;
  };
}
```

### **API設計**
```typescript
// アポイントメント移動API
PUT /api/appointments/{id}/move
{
  "scheduledDate": "2025-07-01",
  "scheduledTime": "14:00",
  "phase": "PROPOSAL",
  "relationshipStatus": "TRUST_ESTABLISHED",
  "processingStatus": "IN_PROGRESS",
  "location": "会議室A"
}
```

---

## 🎯 実装計画

### **Phase 1: カレンダー基盤実装**
- [ ] カレンダーコンポーネント実装
- [ ] アポイントメントデータの取得・表示
- [ ] 月/週/日ビューの実装
- [ ] 既存カンバンビューとの切り替え機能

### **Phase 2: ドラッグ&ドロップ実装**
- [ ] DnD機能の実装（@dnd-kit活用）
- [ ] ドラッグ開始・終了ハンドラー
- [ ] 視覚的フィードバック（ドラッグ中の表示）
- [ ] ドロップゾーンの有効性判定

### **Phase 3: 変更確認モーダル実装**
- [ ] モーダルコンポーネント作成
- [ ] フェーズ選択UI
- [ ] 関係性ステータス選択UI
- [ ] 処理ステータス選択UI
- [ ] 時刻・場所入力フィールド

### **Phase 4: API連携**
- [ ] アポイントメント移動APIの実装
- [ ] 楽観的更新（Optimistic Updates）
- [ ] エラーハンドリング・ロールバック
- [ ] 成功・失敗フィードバック

### **Phase 5: UI/UX改善**
- [ ] アニメーション・トランジション
- [ ] レスポンシブ対応
- [ ] アクセシビリティ対応
- [ ] パフォーマンス最適化

---

## 🔍 技術的考慮事項

### **既存システムとの統合**
1. **カンバンとの連携**
   - カレンダーでの変更がカンバンビューに反映
   - 両ビューでの一貫したデータ同期

2. **ドラッグ&ドロップシステム**
   - 既存の@dnd-kitライブラリ活用
   - カンバンDnDとの一貫した実装

3. **モーダル管理**
   - 既存モーダルコンポーネントとの統一
   - ステート管理の一貫性

### **パフォーマンス要件**
- 大量アポイントメントでの表示性能
- ドラッグ中のスムーズな動作
- リアルタイム更新の最適化

---

## 💡 UI/UXデザイン要件

### **カレンダー表示**
```typescript
// 月ビュー: 日付セル内にアポイントメント表示
<CalendarCell date={date}>
  <AppointmentCard 
    appointment={appointment}
    draggable={true}
    compact={true}
  />
</CalendarCell>

// 週ビュー: 時間軸でのアポイントメント表示
<TimeSlot time="14:00">
  <AppointmentCard appointment={appointment} />
</TimeSlot>
```

### **変更確認モーダル**
```typescript
<AppointmentMoveModal
  isOpen={showMoveModal}
  appointment={targetAppointment}
  newDate={newDate}
  onConfirm={handleMoveConfirm}
  onCancel={handleMoveCancel}
>
  <DateTimeSection />
  <PhaseSelector />
  <RelationshipStatusSelector />
  <ProcessingStatusSelector />
  <LocationInput />
</AppointmentMoveModal>
```

---

**関連ファイル**: 
- `src/app/appointments/page.tsx` (メインページ)
- `src/components/appointments/CalendarView.tsx` (新規作成)
- `src/components/appointments/AppointmentMoveModal.tsx` (新規作成)
- `src/components/ui/Calendar.tsx` (既存/新規)
- `src/app/api/appointments/[id]/move/route.ts` (新規作成)

**ステータス**: 計画中  
**担当**: 未定  
**期限**: 未定

---

**依存関係**: 
- 既存のアポイントメントデータ構造
- @dnd-kitライブラリ（既存）
- カレンダーライブラリの選定・実装

**参考実装**: 
- タスクカンバンのドラッグ&ドロップ機能
- 既存のモーダルコンポーネント群
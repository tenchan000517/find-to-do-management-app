# 🔍 引継ぎ: タスク削除機能の404エラー調査・修正

**作成日**: 2025-06-18  
**優先度**: 🔴 HIGH  
**引継ぎ対象**: 次期エンジニア  

---

## 🚨 問題概要

### **現象**
- カレンダーのDayEventsModalでタスク期限の削除を実行すると404エラーが発生
- エラーログ: `PUT /api/tasks/task_1750170220588_1n7skmxkj 404`
- 個人予定・アポイントメント・カレンダーイベントの削除は正常動作

### **エラー詳細**
```
Failed to delete event: Error: HTTP error! status: 404
DELETE /api/tasks/task_1750170220588_1n7skmxkj 404 in 277ms
PUT /api/tasks/task_1750170220588_1n7skmxkj 404 in 206ms
```

---

## 🔍 調査すべき項目

### **1. タスクIDの実際の形式調査**
**調査場所**: 
- データベース `tasks` テーブル
- `/mnt/c/find-to-do-management-app/src/app/api/tasks/route.ts`

**確認事項**:
- 実際のタスクIDの形式（数字のみ？英数字？）
- 現在のタスクデータ例
- IDの生成ロジック

**調査コマンド例**:
```sql
SELECT id, title, dueDate FROM tasks LIMIT 5;
```

### **2. 統合APIのタスクID生成ロジック**
**調査場所**: 
- `/mnt/c/find-to-do-management-app/src/app/api/calendar/unified/route.ts:275`

**確認内容**:
```typescript
id: `task_${task.id}`,  // この task.id の実際の値
```

**現在の状況**: `task_1750170220588_1n7skmxkj` → 元ID: `1750170220588_1n7skmxkj`

### **3. APIエンドポイントの存在確認**
**調査場所**:
- `/mnt/c/find-to-do-management-app/src/app/api/tasks/[id]/route.ts`
- `/mnt/c/find-to-do-management-app/src/app/api/tasks/route.ts`

**確認事項**:
- PUT メソッドが実装されているか
- パラメータの受け取り方
- ID形式の制約

---

## 💡 推定される原因と解決案

### **原因候補 1: IDの形式不一致**
**推定**: 実際のタスクIDは `123` のような数値だが、統合APIで `task_123_abc` のような複合IDを生成している

**解決案**: 
- 統合APIでの正しいタスクID取得方法を確認
- ID変換ロジックの修正

### **原因候補 2: APIエンドポイントの未実装**
**推定**: `/api/tasks/[id]` の PUT メソッドが存在しない

**解決案**:
- API実装の確認・作成
- 代替的な期限削除方法の検討

### **原因候補 3: タスク削除の仕様問題**
**推定**: タスクの期限削除ではなく別のアプローチが必要

**解決案**:
- タスクの `dueDate` のみ null 更新
- カレンダー表示からの除外処理
- UIのみでの削除（データベース更新なし）

---

## 🛠️ 修正対象ファイル

### **主要ファイル**
1. `/mnt/c/find-to-do-management-app/src/components/calendar/CalendarView.tsx:208-228`
   - `handleEventDelete` 関数のタスク削除処理

2. `/mnt/c/find-to-do-management-app/src/app/api/tasks/[id]/route.ts`
   - PUT メソッドの実装確認・修正

3. `/mnt/c/find-to-do-management-app/src/app/api/calendar/unified/route.ts:275`
   - タスクID生成ロジックの確認

### **現在の実装状況**
```typescript
// CalendarView.tsx:208-228 (現在の問題箇所)
case 'tasks':
  const taskId = event.id.replace(/^task_/, ''); // → 1750170220588_1n7skmxkj
  const response = await fetch(`/api/tasks/${taskId}`, { // 404エラー発生
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dueDate: null }),
  });
```

---

## ✅ 成功している削除機能（参考）

### **個人予定削除**: 正常動作
- API: `/api/schedules/ps_1750159621643_sgdamrnj6`
- 200 OK で成功

### **実装パターン**:
```typescript
case 'personal_schedules':
  const personalId = event.id.startsWith('personal_') 
    ? event.id.replace('personal_', '') 
    : event.id; // ps_プレフィックスはそのまま使用
  apiUrl = `/api/schedules/${personalId}`;
```

---

## 🎯 調査手順の提案

### **Step 1: データ確認**
1. データベースでタスクIDの実際の形式を確認
2. 統合APIで取得されるタスクデータの構造を確認

### **Step 2: API確認**
1. `/api/tasks/[id]` エンドポイントの実装状況確認
2. PUT メソッドの動作テスト

### **Step 3: 修正実装**
1. 正しいタスクID取得ロジックの実装
2. 期限削除機能の適切な実装
3. エラーハンドリングの改善

### **Step 4: テスト**
1. 各種タスクでの削除動作確認
2. 他の削除機能への影響確認

---

## 📝 追加情報

### **関連する正常動作機能**
- ✅ 個人予定削除: `/api/schedules/[id]` DELETE
- ✅ カレンダーイベント削除: `/api/calendar/events/[id]` DELETE  
- ✅ アポイントメント削除: `/api/appointments/[id]` DELETE

### **デバッグ用ログ出力推奨**
```typescript
console.log('Original event ID:', event.id);
console.log('Extracted task ID:', taskId);
console.log('API URL:', apiUrl);
```

### **テスト用タスクID例**
- カレンダー表示ID: `task_1750170220588_1n7skmxkj`
- 抽出後ID: `1750170220588_1n7skmxkj`
- 期待されるAPI: `PUT /api/tasks/1750170220588_1n7skmxkj`

---

**💬 連絡事項**: この問題解決後、UI/UX改善は完全に完了し、システムが全面的に正常動作します。優先的な対応をお願いします。

**🤖 作成者**: Claude Code  
**📅 作成日時**: 2025-06-18 10:45
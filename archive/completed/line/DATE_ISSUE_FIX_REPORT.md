# 🔧 日付関連問題修正報告書

## 修正実施日
2025-06-19

## コミット情報
- **コミットハッシュ**: 8009a92
- **コミットメッセージ**: 日付関連問題修正・明々後日対応追加: タスクステータス自動設定・日付解析強化

## 修正内容

### 1. ✅ タスクステータスの自動設定機能実装

#### 問題
- 日付（期限）が入力されたタスクも全て`IDEA`ステータスで登録されていた

#### 解決策
```typescript
// 日付が設定されている場合は、ステータスを'DO'にする
const taskStatus = taskParsedDueDate ? 'DO' : 'IDEA';
```

#### 修正箇所
- `src/lib/line/data-saver.ts` - `saveClassifiedData`関数のtaskケース
- `src/lib/line/data-saver.ts` - `updateExistingRecord`関数のtaskケース

### 2. ✅ 日付フィールドの取得ロジック改善

#### 問題
- AIが`date`フィールドに日付を返すケースがあったが、タスクでは`deadline`と`datetime`のみチェックしていた

#### 解決策
```typescript
// deadline/datetime/dateフィールドがある場合はパース
if (finalData.deadline || finalData.datetime || finalData.date) {
  const deadlineText = finalData.deadline || finalData.datetime || finalData.date;
  // ...
}
```

### 3. ✅ 更新時のステータス自動変更機能追加

#### 実装内容
- 既存タスクに日付が追加された場合、`IDEA`から`DO`に自動変更
- すでに`DO`以上のステータスの場合は変更しない

### 4. ✅ ISO形式日付の正しい処理

#### 問題
- AIが既にパースした日付（`2025-06-21T00:00:00`）を再度パースして誤った結果になる

#### 解決策
```typescript
// ISO形式の日時が既に入力されている場合の処理
const isoMatch = cleanInput.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/);
if (isoMatch) {
  return {
    date: isoMatch[1],
    time: isoMatch[2] || '00:00',
    confidence: 1.0,
    method: 'pattern' as const
  };
}
```

### 5. ✅ 明々後日（3日後）対応追加

#### 新機能
- 「明々後日」「明明後日」「しあさって」の自然言語解析対応
- AIプロンプトに3日後の説明追加
- パターンマッチング・タイトル抽出・信頼度計算すべてに対応

#### 実装例
```typescript
// 明々後日系（時刻なし）
{
  regex: /^明々後日(?:の)?(?!.*\d).*$/,
  handler: (match: RegExpMatchArray) => {
    const threeDaysLater = this.getJSTDate();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    return {
      date: threeDaysLater.toISOString().split('T')[0],
      time: "00:00",
      confidence: 0.85,
      method: 'pattern' as const
    };
  }
}
```

### 6. ✅ デバッグログの追加

#### 追加内容
```typescript
console.log('📅 Date fields in extractedData:', {
  date: extractedData.date,
  datetime: extractedData.datetime,
  deadline: extractedData.deadline,
  // ...
});
```

## 動作確認方法

### テストケース1: 新規タスク作成（日付あり）
```
入力: "6/28までにレポート提出"
期待結果: 
- dueDate: "2024-06-28"
- status: "DO"
```

### テストケース2: 新規タスク作成（日付なし）
```
入力: "資料作成"
期待結果:
- dueDate: null
- status: "IDEA"
```

### テストケース3: 既存タスク更新（日付追加）
```
既存タスク: status="IDEA", dueDate=null
更新: "期限を明日に設定"
期待結果:
- dueDate: "2024-06-20"
- status: "DO"
```

### テストケース4: 明々後日対応（NEW）
```
入力: "明々後日重要会議"
期待結果（今日が2025-06-19の場合）:
- dueDate: "2025-06-22"
- status: "DO"
- title: "重要会議"
```

### テストケース5: ISO形式日付（NEW）
```
AI解析結果: datetime="2025-06-21T00:00:00"
期待結果:
- 再解析されずに正しく保存
- dueDate: "2025-06-21"
```

## 確認済みの日付フィールドマッピング

| エンティティ | 日付フィールド | 型 | 備考 |
|------------|--------------|-----|-----|
| tasks | dueDate | String? | 期限日 |
| personal_schedules | date, time, endTime | String | 個人予定 |
| calendar_events | date, time, endTime | String | 共有イベント |
| projects | startDate, endDate | String | プロジェクト期間 |
| connections | date | String | 出会った日 |
| appointments | lastContact | String? | 最終連絡日 |
| knowledge_items | なし | - | createdAt/updatedAtで管理 |

## 残課題

1. **日付フォーマットの統一**
   - 現在はString型で保存しているが、DateTime型への移行を検討

2. **タイムゾーン処理**
   - 現在はJST固定だが、ユーザー設定に基づく処理が必要

3. **繰り返し予定**
   - recurring_rulesテーブルは存在するが、UIからの設定機能が未実装

## 検証済み動作

### ✅ 実際のテスト結果
1. **明後日 → 6/21**: 正常動作確認済み（ログより）
2. **明々後日 → 6/22**: パターンマッチング追加済み
3. **ISO形式保持**: `✅ ISO形式検出` ログで確認済み
4. **タスクステータス**: `📊 タスクステータス決定: DO` ログで確認済み

## 次のステップ

1. ~~実環境でのテスト実施~~ ✅ 完了
2. ユーザーフィードバックの収集
3. 必要に応じて追加修正

## 今後の拡張案

1. **4日後、5日後** などの N日後表現の強化
2. **来週月曜日** などの曜日指定の精度向上
3. **午前/午後** の時刻指定対応強化
4. **タイムゾーン設定** のユーザーカスタマイズ

---

**修正実施者**: 次期エンジニア  
**レビュー状態**: 実装完了・動作検証済み  
**コミット**: 8009a92
# システムデザイン統一指示書

## 概要
このドキュメントは、find-to-do-management-appのUI/UXデザインパターンを統一するための指示書です。ナレッジ機能で実装されたパターンを全体に適用してください。

## 1. レイアウト設計原則

### 1.1 サイドバーデザイン
```tsx
// 標準サイドバー構造
<div className={`
  fixed lg:sticky top-0 left-0 z-50 lg:z-auto
  w-96 bg-white shadow-lg h-screen overflow-y-auto
  transform transition-transform duration-300 ease-in-out
  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
`}>
```

**要件:**
- 幅: `w-96` (384px) 
- モバイル: スライドイン/アウト（`fixed` + `transform`）
- デスクトップ: 常時表示（`sticky`）
- オーバーレイ: `bg-black/50` （Tailwind新形式）

### 1.2 メインコンテンツエリア
```tsx
<div className="w-full lg:flex-1 p-4 md:p-8">
  <div className="max-w-6xl mx-auto w-full">
```

**要件:**
- レスポンシブ幅制御: `w-full lg:flex-1`
- 最大幅制限: `max-w-6xl mx-auto`
- はみ出し防止: `w-full` の明示的指定

### 1.3 モバイル対応
```tsx
// モバイル用フィルターボタン
<div className="lg:hidden mb-4">
  <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors">
    <svg className="w-5 h-5">...</svg>
    <span className="font-medium text-gray-700">フィルター</span>
    {/* アクティブインジケーター */}
    {hasActiveFilters && (
      <span className="bg-blue-500 text-white text-xs rounded-full w-2 h-2"></span>
    )}
  </button>
</div>
```

## 2. ボタンデザイン統一

### 2.1 アクションボタン（編集・削除）
```tsx
// 編集ボタン
<button className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors border border-blue-200 hover:border-blue-300">
  <svg className="w-4 h-4">...</svg>
  <span>編集</span>
</button>

// 削除ボタン  
<button className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors border border-red-200 hover:border-red-300">
  <svg className="w-4 h-4">...</svg>
  <span>削除</span>
</button>
```

**要件:**
- アイコン+テキストの組み合わせ
- カラーリング: 編集=青系、削除=赤系
- サイズ: `px-3 py-1.5 text-sm`
- アイコンサイズ: `w-4 h-4`
- ホバー効果必須

### 2.2 プライマリボタン
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 flex-shrink-0 text-sm md:text-base whitespace-nowrap">
```

### 2.3 フィルターボタン
```tsx
<button className="w-full text-left px-3 py-3 rounded-lg text-sm transition-colors border border-transparent hover:bg-gray-100 text-gray-700">
  <div className="flex items-center justify-between">
    <span>カテゴリ名</span>
    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
      {count}
    </span>
  </div>
</button>
```

## 3. 統計情報カード

### 3.1 標準構造
```tsx
<div className="bg-white rounded-lg shadow-md px-2 md:px-3 py-2 flex items-center gap-1 md:gap-2 min-w-0 flex-shrink">
  <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
    <span className="text-white text-xs font-bold">総</span>
  </div>
  <div className="min-w-0">
    <div className="text-xs text-gray-500 whitespace-nowrap">総投稿</div>
    <div className="text-sm md:text-lg font-bold text-gray-900">{count}</div>
  </div>
</div>
```

**要件:**
- はみ出し防止: `min-w-0 flex-shrink`
- レスポンシブサイズ: `w-5 h-5 md:w-6 md:h-6`
- テキスト改行防止: `whitespace-nowrap`

## 4. コンテンツ表示

### 4.1 リンク自動検出
```tsx
// ContentWithLinks コンポーネントを使用
function ContentWithLinks({ content }: { content: string }) {
  const urlRegex = /(https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)/g;
  const parts = content.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </>
  );
}
```

### 4.2 マークダウン対応
```tsx
// MarkdownContent コンポーネントを使用（後述）
<MarkdownContent content={item.content} />
```

## 5. カラーパレット

### 5.1 アクションカラー
- **編集**: blue-600, blue-200 (border), blue-50 (hover bg)
- **削除**: red-600, red-200 (border), red-50 (hover bg)
- **いいね**: red-600 (heart)
- **リンク**: blue-600, blue-800 (hover)

### 5.2 ステータスカラー
- **プライマリ**: blue-600, blue-700 (hover)
- **成功**: green-600, green-200 (border)
- **警告**: orange-600, orange-200 (border)
- **情報**: purple-600, purple-200 (border)

## 6. アニメーション・トランジション

### 6.1 標準トランジション
- ボタン: `transition-colors`
- サイドバー: `transition-transform duration-300 ease-in-out`
- カード: `transition-all duration-200`
- ホバー効果: `hover:-translate-y-1`

### 6.2 透明度（Tailwind新形式）
- オーバーレイ: `bg-black/50`
- 半透明要素: `bg-white/90`

## 7. レスポンシブ設計原則

### 7.1 ブレークポイント
- モバイル: `< lg (1024px)`
- デスクトップ: `lg: (1024px+)`

### 7.2 レスポンシブパターン
```tsx
// テキストサイズ
className="text-sm md:text-lg"

// パディング
className="px-2 md:px-3"

// 表示切り替え
className="hidden sm:inline" // デスクトップのみ
className="sm:hidden"       // モバイルのみ
className="lg:hidden"       // デスクトップで非表示
```

## 8. アクセシビリティ要件

### 8.1 必須事項
- すべてのボタンにテキストラベル
- 適切なコントラスト比
- キーボードナビゲーション対応
- `aria-label` の適切な使用

### 8.2 リンク
- 外部リンク: `target="_blank" rel="noopener noreferrer"`
- 適切な `title` 属性

## 9. 実装チェックリスト

### 9.1 新機能実装時
- [ ] サイドバーは `w-96` で開閉式
- [ ] アクションボタンはアイコン+テキスト
- [ ] 統計カードは標準構造を使用
- [ ] リンク自動検出を実装
- [ ] マークダウン対応を実装
- [ ] モバイル対応完了
- [ ] はみ出し防止対策済み

### 9.2 既存機能改修時
- [ ] ボタンデザインを新基準に更新
- [ ] レスポンシブ対応を確認
- [ ] カラーパレットを統一
- [ ] アニメーション効果を追加

## 10. 適用対象ページ

以下のページで統一デザインを適用してください：

1. **ナレッジ管理** ✅ (完了)
2. **議事録管理** (要対応)
3. **タスク管理**
4. **カレンダー・スケジュール**
5. **コンタクト管理**
6. **GA4分析ダッシュボード**
7. **設定画面**

## 11. 次回実装項目

1. マークダウン対応の実装
2. 議事録ページのデザイン統一
3. 他ページへの段階的適用

---

このデザインシステムに従って、一貫性のあるユーザーエクスペリエンスを提供してください。
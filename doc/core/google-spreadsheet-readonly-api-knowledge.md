# Googleスプレッドシート読み取り専用APIシステム - ナレッジベース

## 概要

Googleフォームからスプレッドシートに保存されたデータを、読み取り専用APIとして提供するGoogle Apps Script (GAS) システムの実装ガイド。

**用途例**:
- 申請フォームデータの表示
- アンケート結果の集計
- 投票システムのデータソース
- 各種フォーム連携システム

---

## 🏗️ アーキテクチャ

```
[Googleフォーム] 
    ↓ 自動記録
[Googleスプレッドシート]
    ↓ 読み取り専用
[Google Apps Script (readonly-main.gs)]
    ↓ HTTPレスポンス
[クライアントアプリケーション]
```

---

## 📝 実装コード（readonly-main.gs）

### 1. 基本構造

```javascript
// WebApp エンドポイント - GET
function doGet(e) {
  try {
    console.log('[READONLY] doGet called with params:', e?.parameter);
    const params = e && e.parameter ? e.parameter : {};
    return handleReadOnlyRequest('GET', params);
  } catch (error) {
    console.error('[READONLY] doGet Error:', error);
    return createReadOnlyErrorResponse(error.toString());
  }
}

// WebApp エンドポイント - POST  
function doPost(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    let data = {};
    
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        data = {};
      }
    }
    
    return handleReadOnlyRequest('POST', params, data);
  } catch (error) {
    console.error('[READONLY] doPost Error:', error);
    return createReadOnlyErrorResponse(error.toString());
  }
}
```

### 2. メインハンドラー

```javascript
function handleReadOnlyRequest(method, params, data = null) {
  try {
    let result;
    const path = params.path || '';
    const endpoint = `${method}:${path}`;
    
    switch(endpoint) {
      case 'GET:health':
        result = testReadOnlyConnection();
        break;
        
      case 'GET:applicants':
        result = getApplicantsData(params.campaignId);
        break;
        
      case 'POST:form-fields':
        result = detectFormFields();
        break;
        
      case 'GET:sheet-info':
        result = getSheetInfo();
        break;
        
      default:
        throw new Error(`Invalid endpoint: ${endpoint}`);
    }
    
    return createReadOnlySuccessResponse(result);
    
  } catch (error) {
    return createReadOnlyErrorResponse(error.toString(), error.message);
  }
}
```

### 3. データ取得関数

```javascript
function getApplicantsData(campaignId) {
  try {
    const sheet = getReadOnlySheet();
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length <= 1) {
      return {
        applicants: [],
        totalCount: 0,
        message: '申請データが見つかりません'
      };
    }
    
    const headers = values[0];
    const applicants = [];
    
    // データ行を処理
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const applicant = {};
      
      // ヘッダーに基づいてデータをマッピング
      headers.forEach((header, index) => {
        const normalizedKey = normalizeFieldKey(header);
        const originalKey = header.toString().trim();
        
        // 両方のキーで保存（互換性のため）
        applicant[normalizedKey] = row[index] || '';
        applicant[originalKey] = row[index] || '';
      });
      
      // データ検証（空行をスキップ）
      const hasAnyValidData = Object.values(applicant).some(value => 
        value && value.toString().trim() !== ''
      );
      
      if (hasAnyValidData) {
        applicant.id = generateApplicantId(i);
        applicant.rowIndex = i;
        applicants.push(applicant);
      }
    }
    
    return {
      applicants: applicants,
      totalCount: applicants.length,
      headers: headers,
      lastUpdated: getCurrentTimestamp()
    };
    
  } catch (error) {
    throw new Error('申請者データの取得に失敗しました: ' + error.toString());
  }
}
```

### 4. ユーティリティ関数

```javascript
// フィールドキー正規化（緩い正規化）
function normalizeFieldKey(header) {
  return header.toString()
    .trim()
    .replace(/[（）\(\)「」【】]/g, '') // 括弧類のみ除去
    .replace(/\s+/g, '') // 空白除去
    .substring(0, 100); // 最大100文字
}

// 読み取り専用スプレッドシート取得
function getReadOnlySheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    
    if (sheets.length === 0) {
      throw new Error('スプレッドシートにシートがありません');
    }
    
    // 最初のシートを使用（通常はForm responsesシート）
    return sheets[0];
    
  } catch (error) {
    throw new Error('読み取り専用スプレッドシートの取得に失敗しました');
  }
}

// レスポンス作成
function createReadOnlySuccessResponse(data) {
  const response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  
  response.setContent(JSON.stringify({
    success: true,
    data: data,
    source: 'readonly-api-hub',
    timestamp: getCurrentTimestamp()
  }));
  
  return response;
}

function createReadOnlyErrorResponse(error, message = null) {
  const response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  
  response.setContent(JSON.stringify({
    success: false,
    error: error,
    message: message || 'An error occurred in readonly API',
    source: 'readonly-api-hub',
    timestamp: getCurrentTimestamp()
  }));
  
  return response;
}
```

---

## 🚀 デプロイ手順

### 1. Google Apps Script作成
1. Googleスプレッドシートを開く
2. 拡張機能 → Apps Script
3. コードを貼り付け
4. プロジェクト名を設定

### 2. ウェブアプリとして導入
1. デプロイ → 新しいデプロイ
2. 種類: ウェブアプリ
3. 実行ユーザー: 自分
4. アクセス権: 全員
5. デプロイ

### 3. URLの取得
```
https://script.google.com/macros/s/{SCRIPT_ID}/exec
```

---

## 📡 使用方法

### 基本的な使い方

```javascript
// ヘルスチェック
fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?path=health')
  .then(res => res.json())
  .then(data => console.log(data));

// データ取得
fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?path=applicants')
  .then(res => res.json())
  .then(data => {
    console.log(`取得件数: ${data.data.totalCount}`);
    data.data.applicants.forEach(applicant => {
      console.log(applicant);
    });
  });
```

### Next.js APIルート経由

```typescript
// /api/gas/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  
  const gasUrl = process.env.GAS_URL;
  const response = await fetch(`${gasUrl}?path=${path}`);
  const data = await response.json();
  
  return NextResponse.json(data);
}
```

---

## ⚠️ 注意事項

### 1. **リダイレクト処理**
GASは初回アクセス時にリダイレクトすることがある。
```javascript
// curlでテストする場合は -L オプションを使用
curl -L "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?path=health"
```

### 2. **日本語フィールド名**
- Googleフォームの質問は日本語が多い
- フィールド名の正規化に注意
- 元のフィールド名も保持することを推奨

### 3. **パフォーマンス**
- 大量データの場合はページング実装を検討
- キャッシュ機能の追加を推奨
- 不要なフィールドは除外

### 4. **セキュリティ**
- 読み取り専用に徹する
- 個人情報の取り扱いに注意
- 必要に応じてアクセス制限を実装

---

## 🎯 活用例

### 1. **申請フォームシステム**
```javascript
// 申請者一覧表示
const applicants = await getApplicants();
applicants.forEach(app => {
  displayApplicant(app);
});
```

### 2. **投票システムのデータソース**
```javascript
// 投票対象者の取得
const candidates = await getCandidates();
displayVotingOptions(candidates);
```

### 3. **アンケート結果表示**
```javascript
// 統計データ取得
const stats = await getSurveyStats();
renderCharts(stats);
```

---

## 🔧 トラブルシューティング

### 問題: データが取得できない
1. GASのデプロイ設定を確認
2. アクセス権限が「全員」になっているか確認
3. スプレッドシートのシート名を確認

### 問題: 日本語が文字化けする
1. レスポンスのContent-Typeを確認
2. UTF-8エンコーディングを使用

### 問題: 応答が遅い
1. データ量を確認
2. 不要なフィールドを除外
3. キャッシュの実装を検討

---

## 📚 参考リンク

- [Google Apps Script公式ドキュメント](https://developers.google.com/apps-script)
- [ContentService リファレンス](https://developers.google.com/apps-script/reference/content/content-service)
- [SpreadsheetApp リファレンス](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app)

---

## 🎉 まとめ

このシステムは**Googleフォーム → スプレッドシート → API**の流れを簡単に実現できる汎用的なソリューションです。

**メリット**:
- ✅ 実装が簡単
- ✅ 無料で利用可能
- ✅ スケーラブル
- ✅ メンテナンスが容易

**活用シーン**:
- 申請管理システム
- アンケートシステム
- 投票システム
- データ収集システム

このナレッジを活用して、効率的なデータ連携システムを構築してください！

---

*最終更新: 2025年6月20日*
*実装例: WEB3 MONEYプロジェクト*
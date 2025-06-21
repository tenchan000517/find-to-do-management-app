INSERT INTO knowledge_items (
    id,
    title,
    category,
    content,
    author,
    tags,
    likes,
    created_at,
    updated_at,
    auto_generated,
    assigned_to,
    created_by
) VALUES (
    'knowledge_ga4_vercel_deploy_' || extract(epoch from now()),
    'GA4・Search Console連携Vercelデプロイ環境変数設定手順',
    'TECHNICAL',
    '## 🚀 GA4・Search Console統合分析ダッシュボードのVercel本番デプロイ手順

### 📋 概要
Google Analytics 4 (GA4) と Google Search Console の API を使用した統合分析ダッシュボードを Vercel 本番環境にデプロイする際の環境変数設定手順です。

### ⚠️ 重要な注意点
- **認証方式**: サービスアカウント認証を使用
- **環境変数形式**: 個別設定（JSON ファイルではなく各項目を分割）
- **GOOGLE_PRIVATE_KEY**: 改行文字の正しい設定が必須

---

## 🔧 事前準備

### 1. Google Cloud Platform でのサービスアカウント作成
```bash
1. Google Cloud Console → IAM と管理 → サービスアカウント
2. 新しいサービスアカウントを作成
3. 必要な権限を付与:
   - Google Analytics Data API: アナリスト権限
   - Search Console API: 読み取り権限
4. JSON キーファイルをダウンロード
```

### 2. GA4 プロパティでのアクセス許可
```bash
1. GA4 管理画面 → プロパティ設定 → プロパティアクセス管理
2. サービスアカウントのメールアドレスを追加
3. 「アナリスト」権限を付与
```

### 3. Search Console でのアクセス許可
```bash
1. Search Console → 設定 → ユーザーと権限
2. サービスアカウントのメールアドレスを追加
3. 「制限付き」権限を付与
```

---

## 🌐 Vercel 環境変数設定

### 設定場所
```
Vercel Dashboard → プロジェクト → Settings → Environment Variables
```

### 必須環境変数一覧

#### GA4 設定
```env
# GA4 プロパティ ID（数字のみ）
GA4_PROPERTY_ID=463408278

# GA4 測定 ID（G-で始まる）
GA4_MEASUREMENT_ID=G-MBY772GM88
```

#### Search Console 設定
```env
# 監視対象サイト URL
SEARCH_CONSOLE_SITE_URL=https://your-domain.com/
```

#### Google 認証情報（サービスアカウント JSON から抽出）
```env
# プロジェクト ID
GOOGLE_PROJECT_ID=your-project-id

# サービスアカウント メール
GOOGLE_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com

# クライアント ID（数字）
GOOGLE_CLIENT_ID=123456789012345678901

# プライベートキー ID
GOOGLE_PRIVATE_KEY_ID=abc123def456...

# X509 証明書 URL
GOOGLE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40project-id.iam.gserviceaccount.com
```

#### 🔑 最重要: GOOGLE_PRIVATE_KEY の正しい設定
```env
# ❌ 間違った設定（改行が失われる）
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG...-----END PRIVATE KEY-----

# ✅ 正しい設定（改行を \n で表現）
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
```

**重要ポイント:**
- 必ず引用符で囲む
- 改行は `\n` で表現
- BEGIN と END の行も含める
- 実際のキー内容は改行なしの長い文字列

---

## 🛠️ 実装コード例

### 認証設定（lib/services/google-auth-service.ts）
```typescript
export function createGoogleAuth(scopes: string[]) {
  // Vercel 環境では環境変数から認証情報を構築
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    const credentials = {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // 🔑 改行処理
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL
    };

    return new GoogleAuth({
      credentials,
      scopes,
    });
  }

  // ローカル環境ではファイルパス方式
  return new GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes,
  });
}
```

---

## 🔍 トラブルシューティング

### よくあるエラーと解決法

#### 1. `16 UNAUTHENTICATED: Request had invalid authentication credentials`
**原因**: GOOGLE_PRIVATE_KEY の形式エラー
**解決策**:
- 改行文字 `\n` が正しく設定されているか確認
- 引用符で囲まれているか確認
- BEGIN/END 行が含まれているか確認

#### 2. `error:1E08010C:DECODER routines::unsupported`
**原因**: プライベートキーの改行処理問題
**解決策**:
- Vercel で GOOGLE_PRIVATE_KEY を削除して再設定
- 正しい形式（上記参照）で設定し直す

#### 3. `invalid_grant: Invalid grant: account not found`
**原因**: サービスアカウントの権限設定問題
**解決策**:
- GA4 プロパティでサービスアカウントにアクセス権限を付与
- Search Console でユーザー権限を確認

---

## ✅ 動作確認方法

### テスト API エンドポイント
```bash
# 認証テスト
curl https://your-app.vercel.app/api/analytics/test

# 期待される結果
{
  "success": true,
  "services": {
    "ga4": true,
    "searchConsole": true
  },
  "errors": []
}
```

### ダッシュボード API
```bash
# 7日間データ取得
curl "https://your-app.vercel.app/api/analytics/dashboard?days=7"

# 30日間データ取得
curl "https://your-app.vercel.app/api/analytics/dashboard?days=30"
```

---

## 📝 まとめ

1. **サービスアカウント**: Google Cloud で作成し、適切な権限を付与
2. **環境変数**: 個別設定方式を使用（JSON ファイルではない）
3. **GOOGLE_PRIVATE_KEY**: 改行文字の正しい設定が最重要
4. **テスト**: デプロイ後は必ず API テストで動作確認

正しく設定すれば、Vercel 本番環境で GA4 と Search Console の統合分析ダッシュボードが完全に動作します。

### 🔗 参考リンク
- https://find-to-do-management-app.vercel.app/api/analytics/test
- https://find-to-do-management-app.vercel.app/analytics',
    'Claude',
    '{"GA4", "Search Console", "Vercel", "環境変数", "デプロイ", "Google Analytics", "認証"}',
    0,
    now(),
    now(),
    false,
    null,
    null
);
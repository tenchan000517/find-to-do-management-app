# GA4 Data API + Search Console API 統合設定ガイド

GA4 Analytics と Search Console を統合したダッシュボード構築のための完全設定ガイドです。

## 📋 目次

1. [前提条件](#前提条件)
2. [GA4設定情報の取得](#ga4設定情報の取得)
3. [Google Cloud Console設定](#google-cloud-console設定)
4. [Search Console設定](#search-console設定)
5. [Next.js設定](#nextjs設定)
6. [権限設定](#権限設定)
7. [設定確認](#設定確認)
8. [トラブルシューティング](#トラブルシューティング)
9. [次のステップ](#次のステップ)

## 🔧 前提条件

- Google Analytics 4 プロパティが作成済み
- Google Search Console にサイトが登録済み
- Google アカウントの管理者権限
- Next.js 13+ App Router プロジェクト
- Git環境

## 🎯 GA4設定情報の取得

### 1. GA4_PROPERTY_ID の取得

```
📍 Google Analytics 4 画面での取得手順:

1. https://analytics.google.com/ にアクセス
2. 対象のGA4プロパティを選択
3. 左下の「管理」（歯車アイコン）をクリック
4. 「プロパティ」列の「プロパティの詳細」をクリック
5. 「プロパティID」欄の数字をコピー

💡 URLからも確認可能: 
   https://analytics.google.com/analytics/web/#/p123456789/...
   → 123456789 がプロパティID
```

### 2. GA4_MEASUREMENT_ID の取得

```
📍 測定IDの取得手順:

1. GA4管理画面で「管理」をクリック
2. 「プロパティ」列の「データストリーム」をクリック
3. 対象のウェブストリームをクリック
4. 「測定ID」をコピー（G-XXXXXXXXXX形式）
```

## ☁️ Google Cloud Console設定

### 1. プロジェクト作成

```
📍 新規プロジェクト作成手順:

1. https://console.cloud.google.com/ にアクセス
2. 上部の「プロジェクトを選択」をクリック
3. 「新しいプロジェクト」をクリック
4. プロジェクト名入力: "ga4-dashboard-project"
5. 「作成」をクリック
```

### 2. API有効化

```
📍 必要なAPIの有効化:

1. 左メニュー「APIとサービス」→「ライブラリ」

2. 以下のAPIを順番に検索して有効化:
   ✅ Google Analytics Data API
   ✅ Google Analytics Admin API  
   ✅ Google Search Console API

各APIで「有効にする」ボタンをクリック
```

### 3. サービスアカウント作成

```
📍 サービスアカウント作成手順:

1. 左メニュー「APIとサービス」→「認証情報」
2. 「+ 認証情報を作成」→「サービスアカウント」
3. 以下を入力:
   - 名前: ga4-dashboard-service
   - ID: ga4-dashboard-service（自動生成）
   - 説明: GA4 Dashboard API Access
4. 「作成して続行」→「完了」をクリック
```

### 4. サービスアカウントキー生成

```
📍 JSONキー生成手順:

1. 作成したサービスアカウントをクリック
2. 「キー」タブをクリック
3. 「鍵を追加」→「新しい鍵を作成」
4. 「JSON」を選択して「作成」
5. ダウンロードされたJSONファイルを保存

⚠️ 重要: このファイルは機密情報です。安全に管理してください
```

### 5. 認証ファイル配置

```bash
# プロジェクトルートに配置
your-project/
├── credentials/
│   └── google-service-account.json  # ←ここに配置
├── .env
└── ...
```

## 🔍 Search Console設定

### 1. プロパティ確認

```
📍 Search Console プロパティ確認:

1. https://search.google.com/search-console にアクセス
2. 対象サイトが登録されていることを確認
3. プロパティ形式を確認:
   - ドメインプロパティ: example.com
   - URLプレフィックス: https://example.com/
```

### 2. 所有権確認（HTMLメタタグ方式）

#### Next.js App Router での設定

```typescript
// src/app/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'サイトタイトル',
  description: 'サイト説明',
  
  // ✅ Google Site Verification追加
  verification: {
    google: 'ここに確認コードを入力'
  },
  
  // 既存のopenGraph, twitter設定...
};
```

#### Git安全更新手順

```bash
# 1. 現在の状況確認
git status
git branch

# 2. リモートから最新取得
git pull origin main

# 3. ファイル更新後、変更をコミット
git add src/app/layout.tsx
git commit -m "feat: Add Google Site Verification"

# 4. プッシュ
git push origin main
```

#### デプロイ確認

```bash
# デプロイ完了後、メタタグ確認
curl -s https://your-site.com | grep "google-site-verification"

# 期待される出力:
# <meta name="google-site-verification" content="確認コード" />
```

#### Search Console で確認実行

```
📍 所有権確認完了手順:

1. Search Console画面で「確認」ボタンをクリック
2. ✅ 「所有権を確認しました」メッセージを確認
3. プロパティが利用可能になる
```

## 🔐 権限設定

### 1. GA4プロパティへの権限付与

```
📍 GA4権限設定手順:

1. GA4管理画面で「管理」→「プロパティアクセス管理」
2. 「+」ボタンで「ユーザーを追加」
3. メールアドレス入力:
   your-service-account@project-id.iam.gserviceaccount.com
4. 権限: 「閲覧者」を選択
5. 「追加」をクリック
```

### 2. Search Console権限付与

```
📍 Search Console権限設定手順:

1. Search Console で対象プロパティを選択
2. 左メニュー「設定」→「ユーザーと権限」
3. 「ユーザーを追加」をクリック
4. サービスアカウントのメールアドレスを入力
5. 権限: 「制限付き」を選択
6. 「追加」をクリック
```

## ✅ 設定確認

### 1. 環境変数設定

```env
# .env
# GA4 Analytics Configuration
GA4_PROPERTY_ID=123456789
GA4_MEASUREMENT_ID=G-ABC123DEF4

# Search Console Configuration
SEARCH_CONSOLE_SITE_URL=https://your-site.com

# Google Analytics Data API v1 Configuration
GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-service-account.json

# 参考情報
GOOGLE_CLOUD_PROJECT_ID=your-project-id
SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
```

### 2. 接続テストスクリプト

```typescript
// test-connections.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config();

// GA4接続テスト
async function testGA4Connection() {
  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
    });

    console.log('✅ GA4接続成功');
    console.log('データ行数:', response.rowCount);
  } catch (error) {
    console.error('❌ GA4接続エラー:', error.message);
  }
}

// Search Console接続テスト
async function testSearchConsoleConnection() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const response = await searchconsole.sites.list();

    console.log('✅ Search Console接続成功');
    console.log('アクセス可能サイト:', response.data.siteEntry?.length);
  } catch (error) {
    console.error('❌ Search Console接続エラー:', error.message);
  }
}

// 両方のテストを実行
async function runAllTests() {
  console.log('🧪 API接続テスト開始...\n');
  await testGA4Connection();
  await testSearchConsoleConnection();
  console.log('\n🧪 テスト完了');
}

runAllTests();
```

### 3. テスト実行

```bash
# 依存関係インストール
npm install @google-analytics/data googleapis dotenv

# TypeScript実行環境（必要に応じて）
npm install -D typescript ts-node @types/node

# テスト実行
npx ts-node test-connections.ts
```

## 🚨 トラブルシューティング

### GA4関連エラー

| エラー | 原因 | 解決方法 |
|--------|------|----------|
| `User does not have sufficient permissions` | 権限不足 | GA4プロパティにサービスアカウントを「閲覧者」として追加 |
| `Google Analytics Data API has not been used` | API未有効化 | Google Cloud ConsoleでData APIを有効化 |
| `Property ID is invalid` | プロパティID間違い | 数字のみ確認（G-プレフィックス不要） |
| `Could not load the default credentials` | 認証ファイル問題 | JSONファイルのパスと内容を確認 |

### Search Console関連エラー

| エラー | 原因 | 解決方法 |
|--------|------|----------|
| `User not found` | メールアドレス間違い | サービスアカウントメールを正確に入力 |
| `Insufficient permissions` | 権限不足 | Search Consoleで「制限付き」権限を付与 |
| `Site not found` | サイト未登録 | Search Consoleにサイトを登録・確認 |

### Git関連エラー

| エラー | 原因 | 解決方法 |
|--------|------|----------|
| `failed to push some refs` | リモート更新あり | `git pull origin main` 後に `git push` |
| `pathspec did not match any files` | ファイルパス間違い | `git status` で正確なパスを確認 |
| `merge conflict` | コンフリクト発生 | 手動でコンフリクト解決後 `git add` & `git commit` |

## 🚀 次のステップ

設定が完了したら、以下のフェーズで実装を進めます：

### フェーズ1: 基本レポート取得（2-3日）
- runReport APIで基本データ取得
- リアルタイムレポート実装

### フェーズ2: ピボット・バッチレポート（3-4日）
- runPivotReport実装
- batchRunReports実装
- UIダッシュボード構築

### フェーズ3: Search Console統合（3-4日）
- Search Console APIデータ取得
- GA4とSearch Consoleデータ統合分析

### フェーズ4: 高度な分析機能（4-5日）
- カスタムディメンション・メトリクス
- ファネル分析
- 複数サイト対応

## 📚 参考リンク

- [Google Analytics Data API v1 ドキュメント](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Google Search Console API ドキュメント](https://developers.google.com/webmaster-tools/search-console-api-original)
- [Next.js App Router メタデータ](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Cloud Console](https://console.cloud.google.com/)
pkill -f "next" || true
---

**🎉 設定完了！**  
これで GA4 Data API と Search Console API を使用したダッシュボード開発の準備が整いました。
# Phase 11: データベース基盤・Google API認証 詳細実装手順書

**Phase**: 11 / 15  
**目標**: Google Docs連携のための基盤構築  
**期間**: 3-5日  
**前提条件**: Phase 1-8完了済み、既存ナレッジ管理システム稼働中

---

## 🎯 Phase 11 実装目標

### 達成目標
- ✅ Google Docs連携用データベーススキーマ追加
- ✅ OAuth 2.0認証システム構築
- ✅ Google Docs API基本接続機能
- ✅ 既存システム100%動作保持

### 検証基準
- [ ] 新規テーブル正常作成・動作確認
- [ ] OAuth認証フロー完全動作
- [ ] Google Docs API接続テスト成功
- [ ] 既存ナレッジ機能の完全動作継続

---

## 📋 実装手順詳細

### ステップ1: 環境準備・パッケージ追加

#### 1.1 必要パッケージのインストール
```bash
# Google API関連パッケージ追加
npm install googleapis@^144.0.0 google-auth-library@^9.14.1

# 追加ユーティリティ（必要に応じて）
npm install node-schedule@^2.1.1

# 開発依存関係更新確認
npm audit fix
```

#### 1.2 環境変数設定準備
```bash
# .env.local ファイルに追加項目を準備
# Google Cloud Console で取得する情報
echo "# Google Docs Integration" >> .env.local
echo "GOOGLE_CLIENT_ID=" >> .env.local
echo "GOOGLE_CLIENT_SECRET=" >> .env.local
echo "GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback" >> .env.local
echo "GOOGLE_PROJECT_ID=" >> .env.local
```

#### 1.3 Google Cloud Console設定
```markdown
## Google Cloud Console 設定手順

1. Google Cloud Console (https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクト作成 または 既存プロジェクト選択
3. APIs & Services > Library で以下を有効化:
   - Google Docs API
   - Google Drive API
4. APIs & Services > Credentials で OAuth 2.0 クライアント作成:
   - アプリケーションタイプ: ウェブアプリケーション
   - 承認済みリダイレクトURI: http://localhost:3000/api/auth/google/callback
5. クライアントID・シークレットを .env.local に設定
```

### ステップ2: データベーススキーマ追加

#### 2.1 Prismaスキーマ更新
```typescript
// prisma/schema.prisma に追加

// Google Docs ソース管理テーブル
model google_docs_sources {
  id              String   @id @default(cuid())
  document_id     String   @unique
  document_url    String
  title           String
  last_modified   DateTime?
  last_synced     DateTime @default(now())
  sync_status     String   @default("pending") // pending, syncing, completed, error
  page_count      Int      @default(0)
  error_message   String?
  user_id         String? // 接続したユーザー
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  // リレーション
  knowledge_items knowledge_items[]

  @@index([document_id], name: "idx_google_docs_document_id")
  @@index([sync_status], name: "idx_google_docs_sync_status")
  @@index([last_modified], name: "idx_google_docs_last_modified")
  @@map("google_docs_sources")
}

// 既存 knowledge_items テーブル拡張
model knowledge_items {
  id                  String             @id
  title               String
  category            knowledge_category @default(BUSINESS)
  content             String
  author              String
  tags                String[]           @default([])
  likes               Int                @default(0)
  createdAt           DateTime           @default(now())
  updatedAt           DateTime

  // Google Docs連携用フィールド追加
  source_type         String             @default("manual") // manual, google_docs
  source_document_id  String?
  source_page_number  Int?
  source_url          String?
  auto_generated      Boolean            @default(false)

  // リレーション
  google_docs_source  google_docs_sources? @relation(fields: [source_document_id], references: [document_id])

  @@index([category], name: "idx_knowledge_category")
  @@index([createdAt], name: "idx_knowledge_created")
  @@index([source_type], name: "idx_knowledge_source_type")
  @@index([source_document_id], name: "idx_knowledge_source_document")
  @@map("knowledge_items")
}
```

#### 2.2 マイグレーション実行
```bash
# Prismaスキーマ生成・適用
npx prisma generate

# マイグレーション作成
npx prisma migrate dev --name add_google_docs_integration

# データベース接続確認
npx prisma db push

# スタジオで確認（オプション）
npx prisma studio
```

#### 2.3 データベース整合性確認
```typescript
// scripts/verify-database-schema.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySchema() {
  try {
    // 新規テーブル存在確認
    const googleDocsCount = await prisma.google_docs_sources.count();
    console.log('✅ google_docs_sources テーブル作成確認:', googleDocsCount);

    // 既存テーブル拡張確認
    const knowledgeItems = await prisma.knowledge_items.findFirst({
      select: {
        source_type: true,
        source_document_id: true,
        auto_generated: true
      }
    });
    console.log('✅ knowledge_items 拡張確認:', knowledgeItems);

    // 既存データ保持確認
    const existingKnowledge = await prisma.knowledge_items.count();
    console.log('✅ 既存ナレッジ保持確認:', existingKnowledge, '件');

  } catch (error) {
    console.error('❌ データベース検証エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();
```

### ステップ3: OAuth認証システム構築

#### 3.1 Google Auth設定ファイル作成
```typescript
// src/lib/google/auth.ts
import { google } from 'googleapis';

// OAuth 2.0 クライアント設定
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// 必要なスコープ定義
export const SCOPES = [
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/userinfo.email'
];

// 認証URL生成
export function generateAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    include_granted_scopes: true
  });
}

// 認証コード処理
export async function exchangeCodeForTokens(code: string) {
  try {
    const { tokens } = await oauth2Client.getAccessToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('OAuth token exchange error:', error);
    throw new Error('認証に失敗しました');
  }
}

// トークン検証・更新
export async function refreshAccessToken(refreshToken: string) {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new Error('トークン更新に失敗しました');
  }
}
```

#### 3.2 OAuth認証API実装
```typescript
// src/app/api/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateAuthUrl } from '@/lib/google/auth';

export async function GET() {
  try {
    const authUrl = generateAuthUrl();
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Auth URL generation error:', error);
    return NextResponse.json(
      { error: '認証URL生成に失敗しました' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/google/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: '認証コードが見つかりません' },
        { status: 400 }
      );
    }

    // 認証トークン取得
    const tokens = await exchangeCodeForTokens(code);
    
    // TODO: ユーザー情報とトークンの保存処理
    // 現段階では基本的な成功レスポンス
    
    return NextResponse.redirect('http://localhost:3000/knowledge?auth=success');
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect('http://localhost:3000/knowledge?auth=error');
  }
}
```

#### 3.3 認証状態管理
```typescript
// src/lib/google/auth-manager.ts
interface GoogleAuthState {
  isAuthenticated: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: Date;
  userEmail?: string;
}

class GoogleAuthManager {
  private authState: GoogleAuthState = {
    isAuthenticated: false
  };

  async authenticate(): Promise<string> {
    return generateAuthUrl();
  }

  async handleCallback(code: string): Promise<void> {
    try {
      const tokens = await exchangeCodeForTokens(code);
      
      this.authState = {
        isAuthenticated: true,
        accessToken: tokens.access_token || undefined,
        refreshToken: tokens.refresh_token || undefined,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
      };
      
      // LocalStorage または サーバーサイドセッションに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('googleAuthState', JSON.stringify(this.authState));
      }
    } catch (error) {
      console.error('Authentication handling error:', error);
      throw error;
    }
  }

  isTokenExpired(): boolean {
    if (!this.authState.expiryDate) return true;
    return new Date() >= this.authState.expiryDate;
  }

  async refreshTokenIfNeeded(): Promise<void> {
    if (this.isTokenExpired() && this.authState.refreshToken) {
      try {
        const newTokens = await refreshAccessToken(this.authState.refreshToken);
        this.authState.accessToken = newTokens.access_token || undefined;
        this.authState.expiryDate = newTokens.expiry_date ? new Date(newTokens.expiry_date) : undefined;
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.authState.isAuthenticated = false;
      }
    }
  }

  getAuthState(): GoogleAuthState {
    return { ...this.authState };
  }

  logout(): void {
    this.authState = { isAuthenticated: false };
    if (typeof window !== 'undefined') {
      localStorage.removeItem('googleAuthState');
    }
  }
}

export const googleAuthManager = new GoogleAuthManager();
```

### ステップ4: Google Docs API基本接続機能

#### 4.1 Google Docs API クライアント
```typescript
// src/lib/google/docs-client.ts
import { google } from 'googleapis';
import { oauth2Client } from './auth';

export class GoogleDocsClient {
  private docs: any;
  private drive: any;

  constructor() {
    this.docs = google.docs({ version: 'v1', auth: oauth2Client });
    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  // ドキュメント基本情報取得
  async getDocumentInfo(documentId: string) {
    try {
      const response = await this.docs.documents.get({
        documentId: documentId
      });
      
      return {
        title: response.data.title,
        documentId: response.data.documentId,
        revisionId: response.data.revisionId,
        lastModified: new Date() // Drive APIから取得
      };
    } catch (error) {
      console.error('Document info fetch error:', error);
      throw new Error(`ドキュメント情報取得に失敗: ${error.message}`);
    }
  }

  // ドキュメント内容取得
  async getDocumentContent(documentId: string): Promise<string> {
    try {
      const response = await this.docs.documents.get({
        documentId: documentId
      });

      const content = this.extractTextFromDocument(response.data);
      return content;
    } catch (error) {
      console.error('Document content fetch error:', error);
      throw new Error(`ドキュメント内容取得に失敗: ${error.message}`);
    }
  }

  // ドキュメント最終更新日時取得（Drive API使用）
  async getDocumentLastModified(documentId: string): Promise<Date> {
    try {
      const response = await this.drive.files.get({
        fileId: documentId,
        fields: 'modifiedTime'
      });
      
      return new Date(response.data.modifiedTime);
    } catch (error) {
      console.error('Last modified fetch error:', error);
      throw new Error(`最終更新日時取得に失敗: ${error.message}`);
    }
  }

  // ドキュメントからテキスト抽出
  private extractTextFromDocument(document: any): string {
    let text = '';
    
    if (document.body && document.body.content) {
      for (const element of document.body.content) {
        if (element.paragraph) {
          for (const paragraphElement of element.paragraph.elements) {
            if (paragraphElement.textRun) {
              text += paragraphElement.textRun.content;
            }
          }
        }
      }
    }
    
    return text.trim();
  }

  // URLからドキュメントID抽出
  static extractDocumentId(url: string): string | null {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  // アクセス権限確認
  async verifyAccess(documentId: string): Promise<boolean> {
    try {
      await this.docs.documents.get({
        documentId: documentId,
        fields: 'documentId'
      });
      return true;
    } catch (error) {
      console.error('Access verification failed:', error);
      return false;
    }
  }
}

export const googleDocsClient = new GoogleDocsClient();
```

#### 4.2 基本API実装
```typescript
// src/app/api/google-docs/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { googleDocsClient } from '@/lib/google/docs-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ドキュメント情報取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentUrl = searchParams.get('url');
    
    if (!documentUrl) {
      return NextResponse.json(
        { error: 'ドキュメントURLが必要です' },
        { status: 400 }
      );
    }

    const documentId = GoogleDocsClient.extractDocumentId(documentUrl);
    if (!documentId) {
      return NextResponse.json(
        { error: '無効なドキュメントURLです' },
        { status: 400 }
      );
    }

    // アクセス権限確認
    const hasAccess = await googleDocsClient.verifyAccess(documentId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'ドキュメントにアクセスできません' },
        { status: 403 }
      );
    }

    // ドキュメント情報取得
    const docInfo = await googleDocsClient.getDocumentInfo(documentId);
    const lastModified = await googleDocsClient.getDocumentLastModified(documentId);

    return NextResponse.json({
      ...docInfo,
      lastModified: lastModified.toISOString(),
      url: documentUrl
    });

  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'ドキュメント取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ドキュメント登録
export async function POST(request: NextRequest) {
  try {
    const { documentUrl } = await request.json();
    
    if (!documentUrl) {
      return NextResponse.json(
        { error: 'ドキュメントURLが必要です' },
        { status: 400 }
      );
    }

    const documentId = GoogleDocsClient.extractDocumentId(documentUrl);
    if (!documentId) {
      return NextResponse.json(
        { error: '無効なドキュメントURLです' },
        { status: 400 }
      );
    }

    // 重複チェック
    const existing = await prisma.google_docs_sources.findUnique({
      where: { document_id: documentId }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'このドキュメントは既に登録されています' },
        { status: 409 }
      );
    }

    // ドキュメント情報取得・保存
    const docInfo = await googleDocsClient.getDocumentInfo(documentId);
    const lastModified = await googleDocsClient.getDocumentLastModified(documentId);

    const googleDocsSource = await prisma.google_docs_sources.create({
      data: {
        document_id: documentId,
        document_url: documentUrl,
        title: docInfo.title,
        last_modified: lastModified,
        sync_status: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      source: googleDocsSource
    });

  } catch (error) {
    console.error('Document registration error:', error);
    return NextResponse.json(
      { error: error.message || 'ドキュメント登録に失敗しました' },
      { status: 500 }
    );
  }
}
```

### ステップ5: 動作テスト・検証

#### 5.1 基本機能テストスクリプト
```typescript
// scripts/test-google-docs-integration.ts
import { googleDocsClient } from '../src/lib/google/docs-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testGoogleDocsIntegration() {
  console.log('🧪 Google Docs統合テスト開始\n');

  try {
    // 1. データベース接続テスト
    console.log('1️⃣ データベース接続テスト');
    const sourceCount = await prisma.google_docs_sources.count();
    console.log(`✅ google_docs_sources テーブル接続成功: ${sourceCount}件\n`);

    // 2. 既存ナレッジ機能テスト
    console.log('2️⃣ 既存ナレッジ機能テスト');
    const knowledgeCount = await prisma.knowledge_items.count();
    console.log(`✅ 既存ナレッジアイテム: ${knowledgeCount}件`);
    
    const sampleKnowledge = await prisma.knowledge_items.findFirst();
    console.log(`✅ サンプルアイテム取得成功: ${sampleKnowledge?.title}\n`);

    // 3. Google Docs API接続テスト（認証後に実行）
    console.log('3️⃣ Google Docs API接続テスト');
    console.log('⚠️  OAuth認証が必要です。ブラウザで /api/auth/google にアクセスしてください\n');

    // 4. URL解析テスト
    console.log('4️⃣ URL解析テスト');
    const testUrl = 'https://docs.google.com/document/d/1jlKCfrxUnOGb9DvhlnVCPyzds-d_DYzEDUBf23jnXOY/edit';
    const extractedId = GoogleDocsClient.extractDocumentId(testUrl);
    console.log(`✅ URL解析成功: ${extractedId}\n`);

    console.log('🎉 基本テスト完了！');

  } catch (error) {
    console.error('❌ テストエラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGoogleDocsIntegration();
```

#### 5.2 既存機能回帰テスト
```bash
# 既存機能の動作確認
npm run build
npx tsc --noEmit

# 開発サーバー起動
npm run dev

# 既存ナレッジ管理画面確認
# http://localhost:3000/knowledge
# - ナレッジ一覧表示
# - 新規作成機能  
# - いいね機能
# - 検索・フィルタ機能
```

#### 5.3 統合テスト手順
```markdown
## Phase 11 統合テスト チェックリスト

### データベース確認
- [ ] google_docs_sources テーブル作成確認
- [ ] knowledge_items テーブル拡張確認
- [ ] 既存データ保持確認
- [ ] インデックス作成確認

### API機能確認
- [ ] /api/auth/google - 認証URL生成
- [ ] /api/auth/google/callback - 認証処理
- [ ] /api/google-docs/documents - ドキュメント操作

### 既存機能回帰テスト
- [ ] ナレッジ管理画面表示
- [ ] ナレッジ作成・編集・削除
- [ ] 検索・フィルタ機能
- [ ] いいね機能

### Google API連携テスト
- [ ] OAuth認証フロー
- [ ] ドキュメント情報取得
- [ ] アクセス権限確認
- [ ] エラーハンドリング
```

---

## 🚨 トラブルシューティング

### よくある問題と解決策

#### 1. OAuth認証エラー
```bash
# エラー: "redirect_uri_mismatch"
# 解決: Google Cloud Console で正確なリダイレクトURI設定確認

# エラー: "invalid_grant"
# 解決: 時刻同期確認、新しい認証コード取得
```

#### 2. データベースマイグレーションエラー
```bash
# エラー: "relation already exists"
# 解決: 既存テーブル確認、マイグレーション履歴確認
npx prisma migrate status
npx prisma migrate resolve --applied <migration_name>

# エラー: "column does not exist"
# 解決: Prisma generate実行後にマイグレーション再実行
npx prisma generate && npx prisma migrate dev
```

#### 3. Google API制限エラー
```bash
# エラー: "quota exceeded"
# 解決: API使用量確認、制限時間後に再実行
# Google Cloud Console > APIs & Services > Quotas

# エラー: "insufficient permissions"
# 解決: OAuth スコープ確認、再認証実行
```

#### 4. 環境変数未設定エラー
```bash
# エラー: "GOOGLE_CLIENT_ID is not defined"
# 解決: .env.local ファイル確認、環境変数設定
cat .env.local | grep GOOGLE
```

---

## ✅ Phase 11 完了チェックリスト

### 必須完了項目
- [ ] パッケージインストール完了
- [ ] Google Cloud Console設定完了
- [ ] 環境変数設定完了
- [ ] データベーススキーマ追加完了
- [ ] OAuth認証システム構築完了
- [ ] Google Docs API基本機能実装完了
- [ ] 動作テスト・検証完了
- [ ] 既存機能の完全動作確認

### 次Phase準備確認
- [ ] ドキュメント登録機能動作確認
- [ ] API接続テスト成功
- [ ] エラーハンドリング実装確認
- [ ] Phase 12実装準備完了

---

## 📚 次のフェーズ

**Phase 11完了後の次のステップ:**
- **Phase 12**: ドキュメント同期・監視機能
  - 自動同期エンジン実装
  - 監視システム構築
  - UI統合開始

**Phase 11で作成されたファイル:**
- `src/lib/google/auth.ts`
- `src/lib/google/docs-client.ts`
- `src/lib/google/auth-manager.ts`
- `src/app/api/auth/google/route.ts`
- `src/app/api/auth/google/callback/route.ts`
- `src/app/api/google-docs/documents/route.ts`

---

**🚀 Phase 11完了により、Google Docs連携の基盤が完成します！**
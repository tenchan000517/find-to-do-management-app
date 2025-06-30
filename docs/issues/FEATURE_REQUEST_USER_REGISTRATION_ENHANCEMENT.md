# 🔐 機能要望: ユーザー登録システム拡張

**作成日**: 2025年6月29日  
**種別**: Feature Request（機能要望）  
**優先度**: Optional（オプショナル）  
**承認者**: プロジェクトオーナー  
**ステータス**: 承認待ち

---

## 📋 現状分析

### **現在の登録システム**
- ✅ **Google OAuth認証**: 完全実装済み
- ✅ **自動ユーザー作成**: 初回ログイン時に自動実行
- ✅ **詳細プロフィール管理**: 充実した拡張設定機能
- ✅ **役割ベース権限**: 6段階の権限システム

### **制限事項**
- ❌ **Google OAuth のみ**: 他の認証方法なし
- ❌ **従来型登録なし**: メール・パスワード登録不可
- ❌ **招待システムなし**: 管理者による招待機能なし
- ❌ **オンボーディングなし**: 新規ユーザーガイドなし

---

## 🚀 提案機能

### **Priority 1: 基本認証拡張**

#### 1.1 メール・パスワード認証
**実装内容:**
```typescript
// NextAuth Credentials Provider追加
providers: [
  GoogleProvider({ ... }), // 既存
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      // パスワードハッシュ化・認証ロジック
    }
  })
]
```

**追加ページ:**
- `/src/app/auth/signup/page.tsx` - 新規登録フォーム
- `/src/app/auth/forgot-password/page.tsx` - パスワードリセット

**Database Schema追加:**
```sql
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
```

#### 1.2 追加OAuth プロバイダー
**対象プロバイダー:**
- **GitHub**: 開発者向け
- **Microsoft**: エンタープライズユーザー向け
- **LinkedIn**: ビジネスプロフェッショナル向け

**設定ファイル:**
```javascript
// /src/lib/auth/config.ts に追加
GitHubProvider({
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
}),
MicrosoftProvider({
  clientId: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
})
```

### **Priority 2: ユーザー管理機能**

#### 2.1 管理者招待システム
**実装機能:**
- 管理者による招待リンク生成
- 役割指定での招待（MANAGER、STUDENT等）
- 招待メール自動送信
- 招待リンクの有効期限管理

**API エンドポイント:**
```
POST /api/admin/invite-user
GET  /api/auth/invite/[token]
POST /api/auth/complete-invitation
```

#### 2.2 メール認証システム
**実装機能:**
- 新規登録時の確認メール送信
- メールアドレス認証トークン
- 未認証ユーザーの機能制限
- 認証リマインダー

### **Priority 3: UX改善**

#### 3.1 オンボーディングフロー
**実装内容:**
- 初回ログイン時のウェルカム画面
- ステップバイステップのプロフィール設定
- 機能紹介ツアー
- LINE Bot連携の案内

**新規コンポーネント:**
```
/src/components/onboarding/WelcomeWizard.tsx
/src/components/onboarding/ProfileSetupSteps.tsx
/src/components/onboarding/FeatureTour.tsx
```

#### 3.2 利用規約・プライバシー同意
**実装機能:**
- 登録時の利用規約表示・同意チェック
- プライバシーポリシーの確認
- 同意履歴の記録
- 規約更新時の再同意プロセス

### **Priority 4: セキュリティ強化**

#### 4.1 二要素認証（2FA）
**実装機能:**
- TOTP（Time-based One-Time Password）
- QRコード生成（Google Authenticator等対応）
- バックアップコード生成
- 2FA強制化オプション（管理者設定）

#### 4.2 セッション管理強化
**実装機能:**
- セッションタイムアウト設定
- 複数デバイスでのセッション管理
- 不正ログイン検知・通知
- ログイン履歴の表示

---

## 📊 実装工数見積もり

### **Phase 1: 基本認証拡張（3-5日）**
- メール・パスワード認証: 2-3日
- 追加OAuth プロバイダー: 1-2日

### **Phase 2: ユーザー管理（2-3日）**
- 招待システム: 1-2日
- メール認証: 1日

### **Phase 3: UX改善（2-3日）**
- オンボーディング: 1-2日
- 利用規約システム: 1日

### **Phase 4: セキュリティ強化（3-4日）**
- 二要素認証: 2-3日
- セッション管理: 1日

**総工数見積もり: 10-15日**

---

## 🎯 実装優先度

### **High Priority（即座に価値のある機能）**
1. **メール・パスワード認証** - ユーザー選択肢の拡大
2. **管理者招待システム** - 組織導入での必須機能
3. **オンボーディングフロー** - 新規ユーザー体験向上

### **Medium Priority（中期的価値）**
1. **追加OAuth プロバイダー** - より多様なユーザー獲得
2. **メール認証システム** - セキュリティ・信頼性向上
3. **利用規約同意** - コンプライアンス対応

### **Low Priority（長期的価値）**
1. **二要素認証** - 高セキュリティ要求への対応
2. **セッション管理強化** - エンタープライズ対応

---

## 🔧 技術的考慮事項

### **既存システムへの影響**
- ✅ **非破壊的変更**: 既存Google OAuth機能は維持
- ✅ **段階的導入**: 機能ごとの個別実装可能
- ✅ **後方互換性**: 既存ユーザーへの影響なし

### **外部依存関係**
- **メール送信**: SendGrid、AWS SES等のサービス選定必要
- **2FA**: `@google-authenticator/totpx` 等のライブラリ活用
- **パスワード**: `bcryptjs` によるハッシュ化

### **Database Migration**
```sql
-- ユーザーテーブル拡張
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255);

-- 招待管理テーブル
CREATE TABLE user_invitations (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  invited_by VARCHAR(255) REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- セッション管理テーブル
CREATE TABLE user_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  device_info TEXT,
  ip_address VARCHAR(45),
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📞 承認・実行プロセス

### **承認要件**
- [x] 技術仕様書作成完了
- [ ] プロジェクトオーナーによる承認
- [ ] 実装優先度の決定
- [ ] 工数・スケジュール承認

### **実行判断基準**
**実装推奨条件:**
- ユーザーからの登録方法多様化要望
- 組織導入での招待機能ニーズ
- セキュリティ要件の高度化
- 競合他社との機能差別化ニーズ

**実装見送り条件:**
- 現在のGoogle OAuth で十分な利用状況
- 他の機能開発が高優先度
- リソース制約
- 技術的複雑性による ROI低下

---

## 📚 参考技術資料

### **NextAuth.js Documentation**
- [Credentials Provider](https://next-auth.js.org/providers/credentials)
- [Multiple Providers](https://next-auth.js.org/configuration/providers)
- [Database Adapters](https://next-auth.js.org/adapters/overview)

### **Security Best Practices**
- [OWASP Authentication Guidelines](https://owasp.org/www-project-authentication-cheat-sheet/)
- [2FA Implementation Guide](https://www.rfc-editor.org/rfc/rfc6238.html)

### **UI/UX References**
- [Auth0 Universal Login](https://auth0.com/docs/universal-login)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

**最終更新**: 2025年6月29日  
**作成者**: Claude Code Assistant  
**承認待ち項目**: 実装可否・優先度・スケジュール  
**ステータス**: 📋 承認待ち
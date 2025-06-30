# FEATURE: ユーザー登録システム実装

**作成日**: 2025年6月30日  
**分類**: Feature Request - Infrastructure  
**影響範囲**: システム全体（認証・ユーザー管理）  
**優先度**: Critical  

---

## 🎯 機能要件

現在システムにユーザー登録機能が存在せず、ログイン依存で管理者が登録する機能もない問題を解決する。

### **現在の問題**
- ユーザー登録機能の完全欠如
- 管理者による登録機能もない
- 新規ユーザーのシステム利用不可
- スケーラビリティの欠如

### **必要な機能**
1. **ユーザー自己登録**
   - アカウント作成機能
   - メール認証システム
   - 初期設定ガイド

2. **管理者による登録**
   - 管理者権限での一括登録
   - 招待システム
   - 権限設定機能

---

## 🔍 技術要件

### **認証システム拡張**
1. **登録フロー**
   ```typescript
   interface UserRegistrationFlow {
     step1: BasicInfo;      // 基本情報入力
     step2: EmailVerification; // メール認証
     step3: ProfileSetup;   // プロフィール設定
     step4: SystemOnboarding; // システム初期設定
   }
   ```

2. **管理者機能**
   ```typescript
   interface AdminUserManagement {
     userInvitation: InvitationSystem;
     bulkUserCreation: BulkCreationSystem;
     userRoleManagement: RoleManagementSystem;
     userStatusControl: StatusControlSystem;
   }
   ```

### **データベース設計**
```sql
-- ユーザー登録関連テーブル
CREATE TABLE UserRegistration (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  verificationToken VARCHAR(255),
  verifiedAt TIMESTAMP NULL,
  registeredAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE UserInvitation (
  id SERIAL PRIMARY KEY,
  invitedEmail VARCHAR(255) UNIQUE NOT NULL,
  invitedBy INTEGER REFERENCES User(id),
  invitationToken VARCHAR(255),
  acceptedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 実装計画

### **Phase 1: 基盤システム実装**
- [ ] 登録API endpointの作成
- [ ] メール認証システムの実装
- [ ] データベーススキーマの拡張

### **Phase 2: ユーザー登録UI**
- [ ] 登録フォームの作成
- [ ] 段階的登録フローの実装
- [ ] メール認証UIの実装

### **Phase 3: 管理者機能**
- [ ] 管理者ダッシュボードの拡張
- [ ] ユーザー一括登録機能
- [ ] 招待システムの実装

### **Phase 4: セキュリティ・バリデーション**
- [ ] セキュリティ対策の実装
- [ ] 入力バリデーションの強化
- [ ] スパム対策の実装

### **Phase 5: オンボーディング**
- [ ] 初回ログイン時のガイド
- [ ] システム説明・チュートリアル
- [ ] 初期設定サポート

---

## 📋 機能仕様詳細

### **1. 自己登録システム**
- **入力項目**
  - メールアドレス（必須）
  - パスワード（必須）
  - 氏名（必須）
  - 組織名（任意）
  - 利用目的（任意）

- **認証フロー**
  1. 基本情報入力
  2. メール認証リンク送信
  3. メール認証完了
  4. 初期設定・プロフィール作成
  5. システム利用開始

### **2. 管理者登録システム**
- **一括登録**
  - CSVファイルアップロード
  - 複数ユーザー同時作成
  - 初期パスワード自動生成

- **招待システム**
  - メール招待送信
  - 招待リンクによる登録
  - 権限事前設定

### **3. セキュリティ対策**
- **パスワード要件**
  - 最小8文字
  - 英数字混合
  - 特殊文字推奨

- **認証セキュリティ**
  - メール認証必須
  - トークン有効期限設定
  - ブルートフォース攻撃対策

---

**関連ファイル**: 
- `src/app/api/auth/register/route.ts` (新規作成)
- `src/app/api/auth/verify/route.ts` (新規作成)
- `src/app/register/page.tsx` (新規作成)
- `src/components/Auth/RegisterForm.tsx` (新規作成)
- `src/app/admin/users/page.tsx` (新規作成)
- `prisma/migrations/` (スキーマ拡張)

**ステータス**: 設計準備中  
**担当**: 未定  
**期限**: 未定  
**重要度**: ★★★★☆ (高優先度)
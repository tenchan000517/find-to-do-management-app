# 認証・権限管理システム マニュアル

## 概要

FIND to DO Management Appの認証・権限管理システムは、NextAuth.jsをベースとした堅牢なセキュリティシステムです。ユーザーの認証から権限管理、セキュリティ監視まで包括的な機能を提供します。

## 目次

1. [基本認証機能](#基本認証機能)
2. [ユーザーロール管理](#ユーザーロール管理)
3. [セキュリティ設定](#セキュリティ設定)
4. [ログイン履歴・監視](#ログイン履歴監視)
5. [API認証](#api認証)
6. [トラブルシューティング](#トラブルシューティング)

---

## 基本認証機能

### 1.1 ログイン方法

#### Google OAuth認証
```javascript
// Google認証を使用したログイン
import { signIn } from "next-auth/react"

const handleGoogleLogin = () => {
  signIn('google', { callbackUrl: '/dashboard' })
}
```

**手順:**
1. ログインページで「Googleでログイン」ボタンをクリック
2. Google認証画面で認証情報を入力
3. 権限許可を確認
4. ダッシュボードにリダイレクト

#### メールアドレス認証
```javascript
// メールアドレス認証を使用したログイン
const handleEmailLogin = async (email, password) => {
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false
  })
  
  if (result?.error) {
    console.error('Login failed:', result.error)
  }
}
```

**手順:**
1. ログインページでメールアドレスとパスワードを入力
2. 「ログイン」ボタンをクリック
3. 認証成功後、ダッシュボードにリダイレクト

### 1.2 ログアウト機能

```javascript
import { signOut } from "next-auth/react"

const handleLogout = () => {
  signOut({ callbackUrl: '/' })
}
```

**機能:**
- セッション完全削除
- セキュアなログアウト処理
- リダイレクト先指定可能

### 1.3 セッション管理

```javascript
import { useSession } from "next-auth/react"

const Component = () => {
  const { data: session, status } = useSession()
  
  if (status === "loading") return <p>Loading...</p>
  if (status === "unauthenticated") return <p>Access Denied</p>
  
  return <p>Signed in as {session.user.email}</p>
}
```

**セッション情報:**
- ユーザー基本情報
- 権限レベル
- セッション期限
- トークン情報

---

## ユーザーロール管理

### 2.1 ロール一覧

| ロール名 | 権限レベル | 主な機能 |
|---------|-----------|---------|
| **SUPER_ADMIN** | 最高権限 | 全システム管理、ユーザー管理 |
| **ADMIN** | 管理者権限 | 組織管理、設定変更 |
| **MANAGER** | マネージャー権限 | チーム管理、プロジェクト管理 |
| **MEMBER** | メンバー権限 | 基本機能利用、タスク管理 |
| **VIEWER** | 閲覧権限 | 読み取り専用 |
| **GUEST** | ゲスト権限 | 限定機能のみ |

### 2.2 権限チェック機能

```javascript
// コンポーネント内での権限チェック
import { useSession } from "next-auth/react"

const ProtectedComponent = () => {
  const { data: session } = useSession()
  
  const hasPermission = (requiredRole) => {
    const roleHierarchy = {
      'GUEST': 0,
      'VIEWER': 1,
      'MEMBER': 2,
      'MANAGER': 3,
      'ADMIN': 4,
      'SUPER_ADMIN': 5
    }
    
    const userRole = session?.user?.role || 'GUEST'
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
  }
  
  if (!hasPermission('MEMBER')) {
    return <div>アクセス権限がありません</div>
  }
  
  return <div>保護されたコンテンツ</div>
}
```

### 2.3 API レベル権限制御

```javascript
// API Routes での権限チェック
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const requiredRole = 'MANAGER'
  if (!hasPermission(session.user.role, requiredRole)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  
  // 権限チェックを通過した処理
  // ...
}
```

### 2.4 ロール変更機能

**管理者による権限変更:**
```javascript
const updateUserRole = async (userId, newRole) => {
  const response = await fetch('/api/users/update-role', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      newRole
    })
  })
  
  if (response.ok) {
    console.log('Role updated successfully')
  }
}
```

---

## セキュリティ設定

### 3.1 パスワードポリシー

**要件:**
- 最小8文字以上
- 大文字・小文字を含む
- 数字を含む
- 特殊文字を含む（推奨）

```javascript
const validatePassword = (password) => {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers
}
```

### 3.2 二段階認証（2FA）

```javascript
// 2FA有効化
const enable2FA = async () => {
  const response = await fetch('/api/auth/2fa/enable', {
    method: 'POST'
  })
  
  const { qrCode, secret } = await response.json()
  
  // QRコード表示とシークレット保存
  return { qrCode, secret }
}

// 2FA検証
const verify2FA = async (token) => {
  const response = await fetch('/api/auth/2fa/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token })
  })
  
  return response.ok
}
```

### 3.3 セッション設定

```javascript
// NextAuth設定（next-auth.config.js）
export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
    updateAge: 24 * 60 * 60,   // 24時間
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      session.user.permissions = token.permissions
      return session
    }
  }
}
```

---

## ログイン履歴・監視

### 4.1 ログイン履歴記録

```javascript
// ログイン成功時の履歴記録
const recordLoginHistory = async (userId, loginData) => {
  await fetch('/api/auth/login-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      timestamp: new Date(),
      ipAddress: loginData.ip,
      userAgent: loginData.userAgent,
      loginMethod: loginData.method, // 'google', 'email', etc.
      success: true
    })
  })
}
```

### 4.2 異常アクセス検知

```javascript
// 異常ログイン検知システム
const detectAnomalousLogin = (loginAttempt, userHistory) => {
  const alerts = []
  
  // 異なる地域からのアクセス
  if (isFromDifferentLocation(loginAttempt.ip, userHistory.recentIPs)) {
    alerts.push({
      type: 'LOCATION_ANOMALY',
      message: '異なる地域からのアクセスを検知しました'
    })
  }
  
  // 短時間での複数ログイン試行
  if (hasMultipleRecentAttempts(loginAttempt.userId, userHistory.recentAttempts)) {
    alerts.push({
      type: 'BRUTE_FORCE',
      message: '短時間での複数ログイン試行を検知しました'
    })
  }
  
  return alerts
}
```

### 4.3 セキュリティ通知

```javascript
// セキュリティアラート送信
const sendSecurityAlert = async (userId, alertType, details) => {
  const user = await getUserById(userId)
  
  const notification = {
    type: 'SECURITY_ALERT',
    userId,
    title: getAlertTitle(alertType),
    message: getAlertMessage(alertType, details),
    timestamp: new Date(),
    read: false
  }
  
  // データベースに保存
  await saveNotification(notification)
  
  // メール送信（重要なアラートの場合）
  if (isHighPriorityAlert(alertType)) {
    await sendEmail({
      to: user.email,
      subject: `[セキュリティアラート] ${notification.title}`,
      body: notification.message
    })
  }
}
```

---

## API認証

### 5.1 JWT トークン認証

```javascript
// API Routes でのJWT認証
import { verify } from 'jsonwebtoken'

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }
  
  verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' })
    }
    req.user = user
    next()
  })
}
```

### 5.2 API キー認証

```javascript
// API キー生成と管理
const generateAPIKey = async (userId) => {
  const apiKey = crypto.randomBytes(32).toString('hex')
  
  await saveAPIKey({
    userId,
    apiKey: hashAPIKey(apiKey),
    createdAt: new Date(),
    lastUsed: null,
    isActive: true
  })
  
  return apiKey
}

// API キー検証
const validateAPIKey = async (apiKey) => {
  const hashedKey = hashAPIKey(apiKey)
  const keyRecord = await getAPIKeyByHash(hashedKey)
  
  if (!keyRecord || !keyRecord.isActive) {
    return null
  }
  
  // 最後の使用時刻を更新
  await updateAPIKeyLastUsed(keyRecord.id)
  
  return keyRecord.userId
}
```

### 5.3 レート制限

```javascript
// レート制限実装
import rateLimit from 'express-rate-limit'

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// 異なるエンドポイントでの制限設定
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15分
  5,              // 5回まで
  'Too many authentication attempts'
)

export const apiRateLimit = createRateLimit(
  60 * 1000,      // 1分
  100,            // 100回まで
  'Too many API requests'
)
```

---

## トラブルシューティング

### 6.1 よくある問題と解決方法

#### ログインできない

**症状:** ログインボタンを押しても反応しない
**原因・解決方法:**
1. **ブラウザのJavaScriptが無効**
   - ブラウザ設定でJavaScriptを有効にする
2. **セッション期限切れ**
   - ページを再読み込みして再試行
3. **ネットワーク接続問題**
   - インターネット接続を確認

#### 権限エラー

**症状:** "アクセス権限がありません" エラー
**原因・解決方法:**
1. **ロール不足**
   - 管理者に権限昇格を依頼
2. **セッション無効**
   - 一度ログアウトして再ログイン
3. **権限キャッシュ問題**
   - ブラウザキャッシュをクリア

#### 2FA問題

**症状:** 二段階認証コードが通らない
**原因・解決方法:**
1. **時刻同期ずれ**
   - デバイスの時刻設定を確認
2. **アプリの問題**
   - 認証アプリを再起動
3. **バックアップコード使用**
   - 緊急時はバックアップコードを使用

### 6.2 エラーコード一覧

| エラーコード | 意味 | 対処法 |
|-------------|------|--------|
| **AUTH_001** | 認証情報が無効 | 正しい認証情報を入力 |
| **AUTH_002** | セッション期限切れ | 再ログイン |
| **AUTH_003** | 権限不足 | 管理者に権限昇格を依頼 |
| **AUTH_004** | アカウント無効 | 管理者に問い合わせ |
| **AUTH_005** | 2FA認証失敗 | 正しいコードを入力 |
| **AUTH_006** | レート制限超過 | 時間をおいて再試行 |

### 6.3 デバッグ情報取得

```javascript
// デバッグ情報収集
const getAuthDebugInfo = () => {
  return {
    sessionStatus: status,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    cookies: document.cookie,
    localStorage: {
      hasNextAuthSession: !!localStorage.getItem('next-auth.session-token'),
      hasNextAuthState: !!localStorage.getItem('next-auth.state')
    }
  }
}
```

---

## セキュリティベストプラクティス

### 7.1 推奨設定

1. **強力なパスワード使用**
2. **二段階認証有効化**
3. **定期的なパスワード変更**
4. **不審なログイン履歴の確認**
5. **セッション管理の適切な設定**

### 7.2 開発者向けセキュリティ

1. **環境変数の適切な管理**
2. **HTTPS通信の徹底**
3. **セキュリティヘッダーの設定**
4. **定期的なセキュリティ監査**
5. **ログの適切な管理**

---

**最終更新日**: 2025-06-29  
**対象バージョン**: Phase 4 完了版  
**関連ドキュメント**: システム機能カテゴリ一覧
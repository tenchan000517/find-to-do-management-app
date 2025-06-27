// 認証機能はオプション化 - ログインしなくても全機能利用可能
// 必要に応じて特定のページのみ認証を要求する場合は、
// 個別のページコンポーネントで useSession() を使用してください

export function middleware() {
  // 認証チェックなし - 全てのリクエストを通す
  return null
}

export const config = {
  // middlewareを実質的に無効化
  matcher: []
}
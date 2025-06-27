import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // 認証が必要な場合のミドルウェアロジック
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 認証が不要なパス
        const publicPaths = ['/auth/signin', '/auth/error', '/api/auth']
        const isPublicPath = publicPaths.some(path => 
          req.nextUrl.pathname.startsWith(path)
        )
        
        if (isPublicPath) {
          return true
        }
        
        // 認証が必要なパスではtokenが必要
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/auth/* (NextAuth routes)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico (favicon)
     * - /public/* (public files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ]
}
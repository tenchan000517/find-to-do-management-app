import GoogleProvider from 'next-auth/providers/google'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === 'google') {
        try {
          // ユーザーが既存かチェック
          const existingUser = await prisma.users.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // 新規ユーザーの場合、データベースに作成
            const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            await prisma.users.create({
              data: {
                id: newUserId,
                name: user.name!,
                email: user.email!,
                color: '#3B82F6', // デフォルトカラー
                isActive: true,
                role: 'MEMBER', // デフォルトロール
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })
          } else {
            // 既存ユーザーのログイン情報を更新
            await prisma.users.update({
              where: { id: existingUser.id },
              data: {
                lastLoginAt: new Date(),
                loginCount: existingUser.loginCount + 1
              }
            })
          }
          return true
        } catch (error) {
          console.error('Error during sign in:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }: any) {
      if (session.user?.email) {
        // データベースからユーザー情報を取得
        const dbUser = await prisma.users.findUnique({
          where: { email: session.user.email }
        })
        
        if (dbUser) {
          session.user.id = dbUser.id
          session.user.role = dbUser.role // ロール情報を追加
        }
      }
      return session
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
}
'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { LogIn, LogOut, User } from 'lucide-react'

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  if (session) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-gray-700">
          <User className="h-4 w-4" />
          <span className="text-sm font-medium">
            {session.user?.name || session.user?.email}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>ログアウト</span>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
      title="ログインすることで、個人設定やデータの同期が可能になります（任意）"
    >
      <LogIn className="h-4 w-4" />
      <span>ログイン（任意）</span>
    </button>
  )
}
'use client'

import { signIn, signOut } from 'next-auth/react'
import { LogIn, LogOut, User, Settings, Shield } from 'lucide-react'
import { useAuth, usePermissions } from '@/lib/auth/client'
import Link from 'next/link'

export default function AuthButton() {
  const { user, isLoading, isAuthenticated, role } = useAuth()
  const { isAdmin, isManager } = usePermissions()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  if (isAuthenticated && user) {
    const getRoleLabel = (userRole: string) => {
      switch (userRole) {
        case 'ADMIN': return '管理者'
        case 'MANAGER': return 'マネージャー'
        case 'MEMBER': return 'メンバー'
        case 'GUEST': return 'ゲスト'
        case 'STUDENT': return '学生'
        case 'ENTERPRISE': return '企業'
        default: return 'メンバー'
      }
    }

    const getRoleColor = (userRole: string) => {
      switch (userRole) {
        case 'ADMIN': return 'bg-red-100 text-red-800'
        case 'MANAGER': return 'bg-blue-100 text-blue-800'
        case 'MEMBER': return 'bg-green-100 text-green-800'
        case 'GUEST': return 'bg-gray-100 text-gray-800'
        case 'STUDENT': return 'bg-purple-100 text-purple-800'
        case 'ENTERPRISE': return 'bg-orange-100 text-orange-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }

    return (
      <div className="flex items-center space-x-3">
        {/* ユーザー情報表示 */}
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {user.name || user.email}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(role || 'MEMBER')}`}>
              {getRoleLabel(role || 'MEMBER')}
            </span>
          </div>
        </div>
        
        {/* 管理機能ボタン */}
        {(isAdmin() || isManager()) && (
          <Link
            href="/admin"
            className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            title="管理機能にアクセス"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">管理</span>
          </Link>
        )}
        
        {/* 管理者専用ボタン */}
        {isAdmin() && (
          <Link
            href="/admin/system"
            className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
            title="システム管理"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">システム</span>
          </Link>
        )}
        
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
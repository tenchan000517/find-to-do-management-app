'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function AuthError() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'サーバー設定にエラーがあります。管理者にお問い合わせください。'
      case 'AccessDenied':
        return 'アクセスが拒否されました。権限を確認してください。'
      case 'Verification':
        return 'メール認証に失敗しました。'
      default:
        return '認証エラーが発生しました。再度お試しください。'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            認証エラー
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>
        
        <div className="mt-8">
          <button
            onClick={() => router.push('/auth/signin')}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            ログインページに戻る
          </button>
        </div>
      </div>
    </div>
  )
}
'use client';

export default function FullPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="flex space-x-3">
            <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0ms' }}></div>
            <div className="w-5 h-5 bg-purple-600 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '150ms' }}></div>
            <div className="w-5 h-5 bg-green-600 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '300ms' }}></div>
            <div className="w-5 h-5 bg-orange-600 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '450ms' }}></div>
          </div>
        </div>
        <div className="text-gray-700 text-xl font-medium">データを読み込んでいます...</div>
        <div className="text-gray-500 text-sm mt-2">しばらくお待ちください</div>
      </div>
    </div>
  );
}
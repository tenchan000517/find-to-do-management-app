'use client';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-4 h-4 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="w-4 h-4 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
          </div>
        </div>
        <div className="text-gray-600 text-lg font-medium">データを読み込んでいます...</div>
      </div>
    </div>
  );
}
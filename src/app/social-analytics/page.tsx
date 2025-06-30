import { Suspense } from 'react';
import SocialAnalyticsDashboard from '@/components/social-analytics/SocialAnalyticsDashboard';

export default function SocialAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">
          SNSアナリティクス
        </h1>
        <p className="text-gray-600">
          Twitter・Instagramのインサイトデータを一元管理
        </p>
      </div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <SocialAnalyticsDashboard />
      </Suspense>
    </div>
  );
}
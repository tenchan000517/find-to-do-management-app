'use client';

import { useState, useEffect } from 'react';
import { 
  Twitter, 
  Instagram, 
  TrendingUp, 
  Users, 
  Eye,
  Calendar
} from 'lucide-react';

type Platform = 'twitter' | 'instagram' | 'all';
type TimeRange = '7d' | '30d' | '90d';

export default function SocialAnalyticsDashboard() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [isLoading, setIsLoading] = useState(false);

  // テスト用のモックデータ
  const mockData = {
    twitter: {
      followers: 1250,
      impressions: 45600,
      engagements: 2340,
      tweets: 28
    },
    instagram: {
      followers: 890,
      impressions: 23400,
      engagements: 1890,
      posts: 15
    }
  };

  const timeRangeOptions = [
    { value: '7d', label: '過去7日間' },
    { value: '30d', label: '過去30日間' },
    { value: '90d', label: '過去90日間' }
  ];

  const [realData, setRealData] = useState<any>(null);
  const [autoLoadCompleted, setAutoLoadCompleted] = useState(false);
  
  // コンポーネントマウント時に自動でデータを取得
  useEffect(() => {
    if (!autoLoadCompleted) {
      handleLoadRealData();
      setAutoLoadCompleted(true);
    }
  }, []);

  const handleTestConnection = async (platform: 'twitter' | 'instagram') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/social-analytics/test/${platform}`);
      const result = await response.json();
      
      if (result.success) {
        alert(`${platform === 'twitter' ? 'Twitter' : 'Instagram'} API接続テスト成功！`);
      } else {
        // Rate Limitエラーの場合は分かりやすく表示
        if (result.error.includes('429') || result.error.includes('Rate Limit')) {
          alert(`⏰ Twitter API Rate Limit到達\n\n${result.error}\n\n💡 解決方法:\n・15分待ってから再試行\n・頻繁なテストを避ける\n・本番では有料プランを検討`);
        } else {
          alert(`接続テスト失敗: ${result.error}`);
        }
      }
    } catch (error) {
      alert('接続テストでエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadRealData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/social-analytics/dashboard?platform=${selectedPlatform}&days=${timeRange.replace('d', '')}`);
      const result = await response.json();
      
      if (result.success) {
        setRealData(result.data);
        console.log('取得したリアルデータ:', result.data);
        // アラートを削除してUIに自然に反映
      } else {
        alert(`データ取得失敗: ${result.error}`);
      }
    } catch (error) {
      alert('データ取得でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFullData = async () => {
    const confirmed = confirm('⚠️ フルデータ取得について\n\nこの機能は以下の制限があります：\n• /users/{id}/tweets: 75回/15分\n• Rate Limitを大量消費\n• 制限到達の可能性\n\n本当に実行しますか？');
    
    if (!confirmed) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/social-analytics/twitter-full?userId=${process.env.TWITTER_TEST_USER_ID || '783214'}&days=${timeRange.replace('d', '')}`);
      const result = await response.json();
      
      if (result.success) {
        setRealData({ twitter: result.data });
        alert('フルデータの取得成功！');
      } else {
        alert(`フルデータ取得失敗: ${result.error}\n\n${result.suggestion || ''}`);
      }
    } catch (error) {
      alert('フルデータ取得でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateLimitCheck = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social-analytics/rate-limit-check');
      const result = await response.json();
      
      if (result.success) {
        const info = result.rateLimitInfo;
        alert(`✅ Rate Limit情報\n\n残り回数: ${info.remaining}/${info.limit}\nリセット時刻: ${info.resetTimeJST}\n残り時間: ${info.minutesUntilReset}分`);
      } else {
        const info = result.rateLimitInfo;
        alert(`⏰ Rate Limit到達\n\n残り回数: ${info?.remaining || 0}/${info?.limit || '不明'}\nリセット時刻: ${info?.resetTimeJST || '不明'}\n残り時間: ${info?.minutesUntilReset || '不明'}分`);
      }
    } catch (error) {
      alert('Rate Limit確認でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwitterLightTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social-analytics/test/twitter-light');
      const result = await response.json();
      
      if (result.success) {
        const info = result.rateLimitInfo;
        const summary = result.apiCallsSummary;
        alert(`✅ Twitter軽量テスト成功！\n\n${summary.rateLimitConsumed}\nRate Limit残り: ${info.remaining}/${info.limit}\nリセット時刻: ${info.resetTimeJST}\nユーザー: @${result.data.user.username}`);
      } else {
        const info = result.rateLimitInfo;
        alert(`❌ Twitter軽量テスト失敗\n\n${result.error}\nRate Limit残り: ${info?.remaining || 0}/${info?.limit || '不明'}\nリセット時刻: ${info?.resetTimeJST || '不明'}`);
      }
    } catch (error) {
      alert('Twitter軽量テストでエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstagramGraphTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social-analytics/test/instagram-graph');
      const result = await response.json();
      
      if (result.success) {
        let message = '✅ Instagram Graph API接続テスト\n\n';
        
        // Facebook Pages テスト結果
        if (result.tests.facebookPages?.success) {
          message += `📘 Facebookページ: ${result.tests.facebookPages.data?.length || 0}件取得\n`;
        } else {
          message += `❌ Facebookページ取得失敗\n`;
        }
        
        // Instagram Business Account テスト結果
        if (result.tests.instagramAccount?.success) {
          message += `📷 Instagramビジネスアカウント: 取得成功\n`;
        } else {
          message += `❌ Instagramビジネスアカウント取得失敗\n`;
        }
        
        // Account Details テスト結果
        if (result.tests.accountDetails?.success) {
          const details = result.tests.accountDetails.data;
          message += `👤 @${details.username}: ${details.followers_count}フォロワー\n`;
        }
        
        alert(message);
      } else {
        alert(`❌ Instagram Graph API設定が必要\n\n${result.error}\n\n次のステップ:\n${result.setupInstructions?.envVars?.join('\n')}`);
      }
    } catch (error) {
      alert('Instagram Graph APIテストでエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugHeaders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social-analytics/debug-headers');
      const result = await response.json();
      
      if (result.success) {
        let debugInfo = `🔍 詳細デバッグ情報\n\n`;
        debugInfo += `時刻: ${result.timestamp}\n`;
        debugInfo += `Bearer Token: ${result.bearer_token_prefix}\n\n`;
        
        Object.entries(result.endpoints).forEach(([key, data]: [string, any]) => {
          debugInfo += `【${data.description}】\n`;
          debugInfo += `状態: ${data.rateLimitInfo?.status} ${data.rateLimitInfo?.statusText}\n`;
          debugInfo += `制限: ${data.rateLimitInfo?.headers?.remaining}/${data.rateLimitInfo?.headers?.limit}\n`;
          debugInfo += `リセット: ${data.rateLimitInfo?.headers?.resetTimeJST}\n`;
          if (data.rateLimitInfo?.errorBody) {
            debugInfo += `エラー: ${data.rateLimitInfo.errorBody}\n`;
          }
          debugInfo += `\n`;
        });
        
        alert(debugInfo);
      } else {
        alert(`デバッグ情報取得失敗: ${result.error}`);
      }
    } catch (error) {
      alert('デバッグ情報取得でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetUserId = async () => {
    const username = prompt('TwitterユーザーName を入力してください（@マークなし）:', 'twitterapi');
    if (!username) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/social-analytics/get-user-id?username=${encodeURIComponent(username)}`);
      const result = await response.json();
      
      if (result.success) {
        let userInfo = `✅ ユーザーID取得成功！\n\n`;
        userInfo += `👤 名前: ${result.data.name}\n`;
        userInfo += `📧 ユーザー名: @${result.data.username}\n`;
        userInfo += `🆔 ユーザーID: ${result.data.userId}\n`;
        userInfo += `👥 フォロワー数: ${result.data.followers?.toLocaleString() || 'N/A'}\n`;
        userInfo += `✅ 認証済み: ${result.data.verified ? 'はい' : 'いいえ'}\n\n`;
        userInfo += `📝 ${result.envUpdate.message}\n${result.envUpdate.line}\n\n`;
        userInfo += `Rate Limit残り: ${result.rateLimitInfo.remaining}/${result.rateLimitInfo.limit}`;
        
        alert(userInfo);
      } else {
        alert(`❌ ユーザーID取得失敗\n\n${result.error}\n\n${result.suggestion || ''}`);
      }
    } catch (error) {
      alert('ユーザーID取得でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー: プラットフォーム選択と期間選択 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPlatform === 'all'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setSelectedPlatform('twitter')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              selectedPlatform === 'twitter'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Twitter className="w-4 h-4" />
            <span>Twitter</span>
          </button>
          <button
            onClick={() => setSelectedPlatform('instagram')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              selectedPlatform === 'instagram'
                ? 'bg-pink-100 text-pink-700 border border-pink-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Instagram className="w-4 h-4" />
            <span>Instagram</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* API接続テスト用ボタン */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-3">
          📋 開発・テスト用機能
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleTestConnection('twitter')}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Twitter className="w-4 h-4" />
            <span>Twitter API テスト</span>
          </button>
          <button
            onClick={handleTwitterLightTest}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Twitter className="w-4 h-4" />
            <span>Twitter 軽量テスト</span>
          </button>
          <button
            onClick={() => handleTestConnection('instagram')}
            disabled={isLoading}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Instagram className="w-4 h-4" />
            <span>Instagram Basic テスト</span>
          </button>
          <button
            onClick={handleInstagramGraphTest}
            disabled={isLoading}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Instagram className="w-4 h-4" />
            <span>Instagram Graph テスト</span>
          </button>
          <button
            onClick={handleLoadRealData}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>データ更新</span>
          </button>
          <button
            onClick={handleLoadFullData}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>⚠️ フルデータ取得</span>
          </button>
          <button
            onClick={handleRateLimitCheck}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Rate Limit確認</span>
          </button>
          <button
            onClick={handleDebugHeaders}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>🔍 詳細デバッグ</span>
          </button>
          <button
            onClick={handleGetUserId}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>👤 ユーザーID取得</span>
          </button>
        </div>
      </div>

      {/* メトリクス概要 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(selectedPlatform === 'all' || selectedPlatform === 'twitter') && (
          <>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Twitter フォロワー</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {realData?.twitter?.user?.public_metrics?.followers_count?.toLocaleString() || 
                     mockData.twitter.followers.toLocaleString()}
                  </p>
                  {realData?.twitter?.user && (
                    <p className="text-xs text-green-600">@{realData.twitter.user.username}</p>
                  )}
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ツイート数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {realData?.twitter?.user?.public_metrics?.tweet_count?.toLocaleString() || 
                     mockData.twitter.tweets.toLocaleString()}
                  </p>
                  {realData?.twitter?.user && (
                    <p className="text-xs text-gray-500">総ツイート数</p>
                  )}
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </>
        )}

        {(selectedPlatform === 'all' || selectedPlatform === 'instagram') && (
          <>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-pink-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Instagram フォロワー</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockData.instagram.followers.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">モックデータ</p>
                </div>
                <Users className="w-8 h-8 text-pink-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-pink-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Instagram リーチ</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockData.instagram.impressions.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">モックデータ</p>
                </div>
                <TrendingUp className="w-8 h-8 text-pink-500" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* リアルデータ表示エリア */}
      {realData?.twitter && !realData.twitter.error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-3">
            📊 Twitterアカウント詳細
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">アカウント名:</span>
              <p className="font-medium">@{realData.twitter.user.username}</p>
            </div>
            <div>
              <span className="text-gray-600">表示名:</span>
              <p className="font-medium">{realData.twitter.user.name}</p>
            </div>
            <div>
              <span className="text-gray-600">フォロー数:</span>
              <p className="font-medium">{realData.twitter.user.public_metrics?.following_count?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-600">いいね数:</span>
              <p className="font-medium">{realData.twitter.user.public_metrics?.like_count?.toLocaleString() || 'N/A'}</p>
            </div>
            {realData.twitter.user.description && (
              <div className="col-span-full">
                <span className="text-gray-600">プロフィール:</span>
                <p className="text-gray-800 mt-1">{realData.twitter.user.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* プレースホルダー: 今後のコンポーネント */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            エンゲージメント推移
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">チャートコンポーネント（開発予定）</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            プラットフォーム比較
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">比較チャート（開発予定）</p>
          </div>
        </div>
      </div>

      {/* 詳細データテーブル */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            投稿パフォーマンス
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
            <p className="text-gray-500">投稿データテーブル（開発予定）</p>
          </div>
        </div>
      </div>
    </div>
  );
}
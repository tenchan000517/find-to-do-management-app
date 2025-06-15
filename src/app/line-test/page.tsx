"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function LineTestPage() {
  const [testMessage, setTestMessage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testWebhook = async () => {
    if (!testMessage.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      // テスト用のLINE Webhookイベントを作成
      const testEvent = {
        events: [{
          type: 'message',
          message: {
            id: 'test-message-id',
            type: 'text',
            text: `@FIND to DO Bot ${testMessage}`,
            mention: {
              mentionees: [{
                index: 0,
                length: 16,
                userId: 'bot-user-id',
                type: 'user',
                isSelf: true
              }]
            }
          },
          source: {
            type: 'group',
            groupId: 'test-group-id',
            userId: 'test-user-id'
          },
          timestamp: Date.now(),
          replyToken: 'test-reply-token'
        }],
        destination: 'test-destination'
      };

      const response = await fetch('/api/webhook/line', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-line-signature': 'test-signature'
        },
        body: JSON.stringify(testEvent)
      });

      const data = await response.json();
      setResult({
        status: response.status,
        data
      });
    } catch (error) {
      setResult({
        status: 'error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    '予定 明日14時 田中さんと打ち合わせ 会議室A',
    'タスク 企画書作成 山田さん 来週金曜まで 重要',
    'プロジェクト 新サービス開発 ショウジキの機能改善',
    '人脈 鈴木太郎 XYZ株式会社 営業部長 展示会で出会った'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← ホーム
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">LINE Bot テスト</h1>
          </div>
          <p className="text-gray-600">
            LINE Botの機能をローカル環境でテストできます
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* テストフォーム */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">メッセージテスト</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  テストメッセージ
                </label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="例: 予定 明日14時 田中さんと打ち合わせ"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <button
                onClick={testWebhook}
                disabled={loading || !testMessage.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium"
              >
                {loading ? 'テスト中...' : 'テスト実行'}
              </button>
            </div>

            {/* サンプル例 */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">サンプル例:</h3>
              <div className="space-y-2">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setTestMessage(example)}
                    className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 結果表示 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">テスト結果</h2>
            
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">ステータス:</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.status === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">レスポンス:</span>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">テストを実行すると結果がここに表示されます</p>
            )}
          </div>
        </div>

        {/* セットアップガイド */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 実際のLINEグループでの使用方法</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900">1. LINE Official Account作成</h3>
              <p className="text-gray-600">
                <a href="https://www.linebiz.com/jp/entry/" target="_blank" className="text-blue-600 hover:underline">
                  LINE Business
                </a> でアカウントを作成
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">2. 環境変数設定</h3>
              <p className="text-gray-600">.env.localファイルにLINE_CHANNEL_SECRETとLINE_CHANNEL_ACCESS_TOKENを設定</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">3. Webhook URL設定</h3>
              <p className="text-gray-600">ngrokを使用してローカル環境をLINEに公開</p>
              <code className="block mt-1 p-2 bg-gray-100 rounded">npm run line:ngrok</code>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">4. ボットをグループに招待</h3>
              <p className="text-gray-600">LINEグループにボットを招待して、@メンションで使用</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-blue-800 text-sm">
              💡 詳細な手順は <code>LINE_SETUP_STEPS.md</code> ファイルを参照してください
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
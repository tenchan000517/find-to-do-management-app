"use client";

import { useState } from 'react';
import { useConnections } from '@/hooks/useConnections';
import { Connection } from '@/lib/types';
import FullPageLoading from '@/components/FullPageLoading';

export default function ConnectionsPage() {
  const { connections, loading, addConnection, updateConnection, deleteConnection } = useConnections();
  const [filter, setFilter] = useState<'all' | 'student' | 'company'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const filteredConnections = connections.filter(connection => {
    const matchesFilter = filter === 'all' || connection.type === filter;
    const matchesSearch = searchTerm === '' || 
      connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const connectionData = {
      date: new Date(formData.get('date') as string).toISOString(),
      location: formData.get('location') as string,
      company: formData.get('company') as string,
      name: formData.get('name') as string,
      position: formData.get('position') as string,
      type: formData.get('type') as Connection['type'],
      description: formData.get('description') as string,
      conversation: formData.get('conversation') as string,
      potential: formData.get('potential') as string,
      businessCard: formData.get('businessCard') as string || undefined,
      createdById: 'user1', // 仮のユーザーID（後でログイン機能実装時に修正）
    };

    try {
      if (editingConnection) {
        await updateConnection(editingConnection.id, connectionData);
      } else {
        await addConnection(connectionData);
      }

      setShowModal(false);
      setEditingConnection(null);
    } catch (error) {
      console.error('Failed to save connection:', error);
    }
  };

  if (loading) {
    return <FullPageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="mx-auto px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">つながり</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base"
            >
              {viewMode === 'table' ? 'カード表示' : 'テーブル表示'}
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base"
            >
              新規追加
            </button>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="名前、会社名、場所で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setFilter('company')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'company' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                企業
              </button>
              <button
                onClick={() => setFilter('student')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'student' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                学生
              </button>
            </div>
          </div>
        </div>

        {/* テーブル表示 */}
        {viewMode === 'table' ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日付
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      出会った場所
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      会社名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      名前・役職
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分類
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      どんな人か
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      どんな話をしたか
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FIND to DOとの関わり
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConnections.map((connection) => (
                    <tr key={connection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(connection.date).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {connection.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {connection.company}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{connection.name}</div>
                        <div className="text-sm text-gray-500">{connection.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          connection.type === 'company' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {connection.type === 'company' ? '企業' : '学生'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={connection.description}>
                          {connection.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={connection.conversation}>
                          {connection.conversation}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={connection.potential}>
                          {connection.potential}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingConnection(connection);
                            setShowModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-2 text-xs md:text-sm"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => deleteConnection(connection.id)}
                          className="text-red-600 hover:text-red-900 text-xs md:text-sm"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* カード表示 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConnections.map((connection) => (
              <div key={connection.id} className="bg-white rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">{connection.name}</h3>
                    <p className="text-xs md:text-sm text-gray-600">{connection.position}</p>
                    <p className="text-xs md:text-sm text-gray-600">{connection.company}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    connection.type === 'company' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {connection.type === 'company' ? '企業' : '学生'}
                  </span>
                </div>
                
                <div className="space-y-3 text-xs md:text-sm">
                  <div>
                    <span className="font-medium text-gray-700">日付:</span> {new Date(connection.date).toLocaleDateString('ja-JP')}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">場所:</span> {connection.location}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">人物:</span>
                    <p className="text-gray-600 mt-1">{connection.description}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">会話内容:</span>
                    <p className="text-gray-600 mt-1">{connection.conversation}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">今後の可能性:</span>
                    <p className="text-gray-600 mt-1">{connection.potential}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setEditingConnection(connection);
                      setShowModal(true);
                    }}
                    className="flex-1 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteConnection(connection.id)}
                    className="flex-1 text-xs md:text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredConnections.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">該当する人脈情報がありません</div>
          </div>
        )}

        {/* 統計情報 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">総</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-xs md:text-sm font-medium text-gray-500">総つながり数</div>
                <div className="text-xl md:text-2xl font-bold text-gray-900">{connections.length}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">企</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-xs md:text-sm font-medium text-gray-500">企業関係者</div>
                <div className="text-xl md:text-2xl font-bold text-gray-900">
                  {connections.filter(c => c.type === 'company').length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">学</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-xs md:text-sm font-medium text-gray-500">学生</div>
                <div className="text-xl md:text-2xl font-bold text-gray-900">
                  {connections.filter(c => c.type === 'student').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* モーダル */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg md:text-xl font-bold mb-4">
                {editingConnection ? 'つながり編集' : '新規つながり'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      日付
                    </label>
                    <input
                      type="date"
                      name="date"
                      defaultValue={editingConnection ? new Date(editingConnection.date).toISOString().split('T')[0] : ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      出会った場所
                    </label>
                    <input
                      type="text"
                      name="location"
                      defaultValue={editingConnection?.location || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名前
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingConnection?.name || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      役職
                    </label>
                    <input
                      type="text"
                      name="position"
                      defaultValue={editingConnection?.position || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      会社名・組織名
                    </label>
                    <input
                      type="text"
                      name="company"
                      defaultValue={editingConnection?.company || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      分類
                    </label>
                    <select
                      name="type"
                      defaultValue={editingConnection?.type || 'company'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="company">企業</option>
                      <option value="student">学生</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    どんな人か
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingConnection?.description || ''}
                    rows={2}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    どんな話をしたか
                  </label>
                  <textarea
                    name="conversation"
                    defaultValue={editingConnection?.conversation || ''}
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FIND to DOとどう関わっていけそうか
                  </label>
                  <textarea
                    name="potential"
                    defaultValue={editingConnection?.potential || ''}
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名刺URL（任意）
                  </label>
                  <input
                    type="text"
                    name="businessCard"
                    defaultValue={editingConnection?.businessCard || ''}
                    placeholder="名刺画像のURLなど"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium text-sm md:text-base"
                  >
                    {editingConnection ? '更新' : '作成'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingConnection(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium text-sm md:text-base"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
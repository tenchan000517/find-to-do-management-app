'use client';

import { useState, useEffect } from 'react';
import { ProjectAlert, UserAlert } from '@/lib/types';
import { AlertCircle, RefreshCw, CircleCheck, AlertTriangle, Info } from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AlertData {
  projectAlerts: ProjectAlert[];
  userAlerts: UserAlert[];
  summary: {
    totalAlerts: number;
    unreadAlerts: number;
    criticalAlerts: number;
  };
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'project' | 'user'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // アラート読み込み
  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'all',
        unreadOnly: showUnreadOnly.toString()
      });
      
      const response = await fetch(`/api/alerts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAlertData(data);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  // アラート操作
  const handleAlertAction = async (alertId: string, type: 'project' | 'user', action: 'mark_read' | 'resolve') => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, type })
      });

      if (response.ok) {
        await loadAlerts(); // リロード
      }
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  };

  // 手動アラートチェック
  const handleManualCheck = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_all' })
      });

      if (response.ok) {
        await loadAlerts();
      }
    } catch (error) {
      console.error('Failed to run manual check:', error);
    } finally {
      setLoading(false);
    }
  };

  // フィルタリング処理
  const getFilteredAlerts = () => {
    if (!alertData) return { projectAlerts: [], userAlerts: [] };

    let projectAlerts = alertData.projectAlerts;
    let userAlerts = alertData.userAlerts;

    // タブフィルタ
    if (activeTab === 'project') {
      userAlerts = [];
    } else if (activeTab === 'user') {
      projectAlerts = [];
    }

    // 重要度フィルタ
    if (filterSeverity !== 'all') {
      projectAlerts = projectAlerts.filter(a => a.severity === filterSeverity);
      userAlerts = userAlerts.filter(a => a.severity === filterSeverity);
    }

    // 未読フィルタ
    if (showUnreadOnly) {
      projectAlerts = projectAlerts.filter(a => !a.isRead);
      userAlerts = userAlerts.filter(a => !a.isRead);
    }

    return { projectAlerts, userAlerts };
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'border-red-500 bg-red-50',
      high: 'border-orange-500 bg-orange-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-green-500 bg-green-50'
    };
    return colors[severity as keyof typeof colors] || 'border-gray-300 bg-gray-50';
  };

  const getSeverityIcon = (severity: string) => {
    const icons = { 
      critical: <AlertCircle className="w-4 h-4 text-red-500" />, 
      high: <AlertTriangle className="w-4 h-4 text-orange-500" />, 
      medium: <Info className="w-4 h-4 text-yellow-500" />, 
      low: <CircleCheck className="w-4 h-4 text-green-500" /> 
    };
    return icons[severity as keyof typeof icons] || <Info className="w-4 h-4 text-gray-500" />;
  };

  if (!isOpen) return null;

  const filteredAlerts = getFilteredAlerts();
  const allAlerts = [...filteredAlerts.projectAlerts, ...filteredAlerts.userAlerts]
    .sort((a, b) => {
      const aIsProject = 'projectId' in a;
      const bIsProject = 'projectId' in b;
      const aDate = aIsProject ? (a as ProjectAlert).triggeredAt || a.createdAt : a.createdAt;
      const bDate = bIsProject ? (b as ProjectAlert).triggeredAt || b.createdAt : b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">🔔 通知センター</h2>
            {alertData && (
              <p className="text-gray-600 mt-1">
                全 {alertData.summary.totalAlerts} 件 
                （未読 {alertData.summary.unreadAlerts} 件、
                緊急 {alertData.summary.criticalAlerts} 件）
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleManualCheck}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              <RefreshCw className="w-4 h-4 mr-1" />
              チェック実行
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
              ✕
            </button>
          </div>
        </div>

        {/* フィルタ・タブ */}
        <div className="p-6 border-b space-y-4">
          {/* タブ */}
          <div className="flex space-x-1">
            {[
              { key: 'all', label: '全て', count: alertData?.summary.totalAlerts || 0 },
              { key: 'project', label: 'プロジェクト', count: alertData?.projectAlerts.length || 0 },
              { key: 'user', label: 'ユーザー', count: alertData?.userAlerts.length || 0 }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* フィルタ */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">重要度:</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value as any)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">全て</option>
                  <option value="critical">緊急</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="rounded"
                />
                <span>未読のみ</span>
              </label>
            </div>
            
            <div className="text-sm text-gray-500">
              表示: {allAlerts.length} 件
            </div>
          </div>
        </div>

        {/* アラートリスト */}
        <div className="overflow-y-auto max-h-[50vh] p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : allAlerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">🎉</div>
              <div className="text-gray-600">該当するアラートはありません</div>
            </div>
          ) : (
            <div className="space-y-3">
              {allAlerts.map(alert => {
                const isProjectAlert = 'projectId' in alert;
                return (
                  <div
                    key={alert.id}
                    className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(alert.severity)} ${
                      (isProjectAlert ? !(alert as ProjectAlert).isRead : !(alert as UserAlert).isRead)
                        ? 'shadow-md' 
                        : 'opacity-75'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getSeverityIcon(alert.severity)}
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {isProjectAlert ? 'プロジェクト' : 'ユーザー'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(isProjectAlert ? (alert as ProjectAlert).triggeredAt || alert.createdAt : alert.createdAt).toLocaleString('ja-JP')}
                          </span>
                          {(isProjectAlert ? !(alert as ProjectAlert).isRead : !(alert as UserAlert).isRead) && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">未読</span>
                          )}
                        </div>
                        
                        <div className="text-sm font-medium mb-1">
                          {alert.message}
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          アラートタイプ: {alert.alertType} | 重要度: {alert.severity}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {(isProjectAlert ? !(alert as ProjectAlert).isRead : !(alert as UserAlert).isRead) && (
                          <button
                            onClick={() => handleAlertAction(
                              alert.id, 
                              isProjectAlert ? 'project' : 'user', 
                              'mark_read'
                            )}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            既読
                          </button>
                        )}
                        
                        {isProjectAlert && !(alert as ProjectAlert).isResolved && (
                          <button
                            onClick={() => handleAlertAction(alert.id, 'project', 'resolve')}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            解決
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            最終更新: {new Date().toLocaleString('ja-JP')}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
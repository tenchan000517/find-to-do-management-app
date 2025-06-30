'use client';

import React, { useState } from 'react';
import { RiskAlert } from '@/hooks/useFinancialRisk';
import { AlertTriangle, DollarSign, Clock, User, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

interface RiskAlertPanelProps {
  alerts: RiskAlert[];
  onResolveAlert: (alertId: string) => void;
  loading?: boolean;
}

export default function RiskAlertPanel({ alerts, onResolveAlert, loading }: RiskAlertPanelProps) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    severity?: string;
    type?: string;
    resolved?: boolean;
  }>({});

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // フィルター適用
  const filteredAlerts = alerts.filter(alert => {
    if (filter.severity && alert.severity !== filter.severity) return false;
    if (filter.type && alert.type !== filter.type) return false;
    if (filter.resolved !== undefined && alert.resolved !== filter.resolved) return false;
    return true;
  });

  // 重要度別の色設定
  const severityConfig = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      badge: 'bg-red-100 text-red-800'
    },
    high: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      icon: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-800'
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
      badge: 'bg-yellow-100 text-yellow-800'
    },
    low: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800'
    }
  };

  // アラートタイプのラベル
  const typeLabels = {
    payment_delay: '支払い遅延',
    revenue_decline: '売上減少',
    customer_churn: '顧客離脱',
    cash_flow: 'キャッシュフロー',
    contract_expiry: '契約期限'
  };

  // アラートタイプのアイコン
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment_delay': return <Clock className="w-4 h-4" />;
      case 'revenue_decline': return <DollarSign className="w-4 h-4" />;
      case 'customer_churn': return <User className="w-4 h-4" />;
      case 'cash_flow': return <DollarSign className="w-4 h-4" />;
      case 'contract_expiry': return <Clock className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // 統計データ
  const stats = {
    total: filteredAlerts.length,
    unresolved: filteredAlerts.filter(a => !a.resolved).length,
    critical: filteredAlerts.filter(a => a.severity === 'critical' && !a.resolved).length,
    totalImpact: filteredAlerts.filter(a => !a.resolved).reduce((sum, a) => sum + a.impact, 0)
  };

  const toggleExpand = (alertId: string) => {
    setExpandedAlert(expandedAlert === alertId ? null : alertId);
  };

  return (
    <div className="space-y-6">
      {/* 統計サマリー */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
          リスクアラート概要
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総アラート数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">未解決</p>
                <p className="text-2xl font-bold text-orange-900">{stats.unresolved}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">緊急</p>
                <p className="text-2xl font-bold text-red-900">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">財務インパクト</p>
                <p className="text-2xl font-bold text-purple-900">
                  ¥{stats.totalImpact.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">フィルター</h4>
        <div className="flex flex-wrap gap-4">
          <select
            value={filter.severity || ''}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全ての重要度</option>
            <option value="critical">緊急</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>

          <select
            value={filter.type || ''}
            onChange={(e) => setFilter({ ...filter, type: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全てのタイプ</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={filter.resolved === undefined ? '' : filter.resolved.toString()}
            onChange={(e) => setFilter({ 
              ...filter, 
              resolved: e.target.value === '' ? undefined : e.target.value === 'true' 
            })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全てのステータス</option>
            <option value="false">未解決</option>
            <option value="true">解決済み</option>
          </select>

          <button
            onClick={() => setFilter({})}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            フィルターをクリア
          </button>
        </div>
      </div>

      {/* アラート一覧 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            アラート一覧 ({filteredAlerts.length}件)
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>表示するアラートがありません</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const config = severityConfig[alert.severity];
              const isExpanded = expandedAlert === alert.id;
              
              return (
                <div key={alert.id} className={`${config.bg} ${config.border} border-l-4`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`${config.icon} mt-1`}>
                          {getTypeIcon(alert.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{alert.title}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${config.badge}`}>
                              {alert.severity === 'critical' ? '緊急' 
                               : alert.severity === 'high' ? '高' 
                               : alert.severity === 'medium' ? '中' : '低'}
                            </span>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                              {typeLabels[alert.type as keyof typeof typeLabels]}
                            </span>
                            {alert.resolved && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                解決済み
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-700 mb-3">{alert.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>作成: {new Date(alert.createdAt).toLocaleDateString()}</span>
                              {alert.impact > 0 && (
                                <span className="flex items-center">
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  影響: ¥{alert.impact.toLocaleString()}
                                </span>
                              )}
                            </div>
                            
                            <button
                              onClick={() => toggleExpand(alert.id)}
                              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                            >
                              {isExpanded ? (
                                <>
                                  詳細を隠す <ChevronUp className="w-4 h-4 ml-1" />
                                </>
                              ) : (
                                <>
                                  詳細を表示 <ChevronDown className="w-4 h-4 ml-1" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {!alert.resolved && (
                        <button
                          onClick={() => onResolveAlert(alert.id)}
                          className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          解決
                        </button>
                      )}
                    </div>

                    {/* 展開された詳細情報 */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-semibold text-gray-900 mb-2">推奨アクション</h5>
                        <ul className="space-y-1">
                          {alert.suggestedActions.map((action, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5 mr-2">
                                {index + 1}
                              </span>
                              <span className="text-gray-700">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
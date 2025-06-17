"use client";

import { useState } from 'react';
import { Appointment } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AppointmentCompletionFormProps {
  appointment: Appointment;
  onSubmit: (completionData: AppointmentCompletionData) => Promise<void>;
  onCancel: () => void;
}

export interface AppointmentCompletionData {
  outcome: string;
  meetingNotes: string;
  nextSteps: string;
  nextAppointment?: {
    scheduledDate: string;
    scheduledTime: string;
    agenda: string;
    meetingLocation: string;
  };
  salesPhaseUpdate?: 'CONTACT' | 'MEETING' | 'PROPOSAL' | 'CONTRACT' | 'CLOSED';
  connectionData?: {
    createConnection: boolean;
    connectionDetails: {
      relationship: string;
      businessPotential: string;
      followUpSchedule: string;
    };
  };
  followUpActions: string[];
  rating: number; // 1-5 星評価
  successProbability: number; // 0-100%
}

export default function AppointmentCompletionForm({
  appointment,
  onSubmit,
  onCancel
}: AppointmentCompletionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AppointmentCompletionData>({
    outcome: '',
    meetingNotes: '',
    nextSteps: '',
    nextAppointment: {
      scheduledDate: '',
      scheduledTime: '',
      agenda: '',
      meetingLocation: ''
    },
    salesPhaseUpdate: 'MEETING',
    connectionData: {
      createConnection: false,
      connectionDetails: {
        relationship: '',
        businessPotential: '',
        followUpSchedule: 'monthly'
      }
    },
    followUpActions: [],
    rating: 3,
    successProbability: 50
  });

  const [scheduleNextAppointment, setScheduleNextAppointment] = useState(false);
  const [newFollowUpAction, setNewFollowUpAction] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        nextAppointment: scheduleNextAppointment ? formData.nextAppointment : undefined
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error('Failed to complete appointment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AppointmentCompletionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (
    parent: keyof AppointmentCompletionData,
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value
      }
    }));
  };

  const addFollowUpAction = () => {
    if (newFollowUpAction.trim()) {
      setFormData(prev => ({
        ...prev,
        followUpActions: [...prev.followUpActions, newFollowUpAction.trim()]
      }));
      setNewFollowUpAction('');
    }
  };

  const removeFollowUpAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      followUpActions: prev.followUpActions.filter((_, i) => i !== index)
    }));
  };

  const predefinedActions = [
    '提案書作成・送付',
    '見積書作成・送付',
    '詳細資料送付',
    '次回ミーティング設定',
    '関係者紹介',
    '事例紹介',
    'デモンストレーション',
    '試用版提供',
    'ROI試算書作成',
    '競合分析提供'
  ];

  const addPredefinedAction = (action: string) => {
    if (!formData.followUpActions.includes(action)) {
      setFormData(prev => ({
        ...prev,
        followUpActions: [...prev.followUpActions, action]
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">アポイントメント完了処理</h2>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900">{appointment.companyName}</h3>
          <p className="text-green-700">{appointment.contactName}</p>
          <p className="text-green-600 text-sm">{appointment.email}</p>
          {appointment.scheduledDate && (
            <p className="text-green-600 text-sm">
              📅 {new Date(appointment.scheduledDate).toLocaleDateString('ja-JP')} {appointment.scheduledTime}
            </p>
          )}
        </div>
      </div>

      {isSubmitting && (
        <LoadingSpinner size="md" message="完了処理中..." className="mb-6" />
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 打ち合わせ結果セクション */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">1</span>
            打ち合わせ結果
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                結果・成果 *
              </label>
              <textarea
                value={formData.outcome}
                onChange={(e) => handleInputChange('outcome', e.target.value)}
                rows={4}
                required
                placeholder="打ち合わせの結果、相手の反応、得られた成果など"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                詳細メモ
              </label>
              <textarea
                value={formData.meetingNotes}
                onChange={(e) => handleInputChange('meetingNotes', e.target.value)}
                rows={6}
                placeholder="話し合った内容、相手のニーズ、課題、要求事項など詳細なメモ"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  評価 (1-5 星)
                </label>
                <select
                  value={formData.rating}
                  onChange={(e) => handleInputChange('rating', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>⭐ - 低調</option>
                  <option value={2}>⭐⭐ - やや低調</option>
                  <option value={3}>⭐⭐⭐ - 普通</option>
                  <option value={4}>⭐⭐⭐⭐ - 良好</option>
                  <option value={5}>⭐⭐⭐⭐⭐ - 非常に良好</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  成約可能性 (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.successProbability}
                  onChange={(e) => handleInputChange('successProbability', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600">{formData.successProbability}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* 営業フェーズ更新セクション */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">2</span>
            営業フェーズ更新
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              次の営業フェーズ
            </label>
            <select
              value={formData.salesPhaseUpdate || ''}
              onChange={(e) => handleInputChange('salesPhaseUpdate', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="CONTACT">コンタクト - 初回接触</option>
              <option value="MEETING">ミーティング - ニーズヒアリング</option>
              <option value="PROPOSAL">提案 - 提案・見積段階</option>
              <option value="CONTRACT">契約 - 契約交渉</option>
              <option value="CLOSED">クローズ - 成約・完了</option>
            </select>
          </div>
        </div>

        {/* フォローアップアクションセクション */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-orange-100 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">3</span>
            フォローアップアクション
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                次のステップ
              </label>
              <textarea
                value={formData.nextSteps}
                onChange={(e) => handleInputChange('nextSteps', e.target.value)}
                rows={3}
                placeholder="今後のアクションプラン、進め方など"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                具体的なアクション項目
              </label>
              
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">よく使用されるアクション:</p>
                <div className="flex flex-wrap gap-2">
                  {predefinedActions.map((action, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addPredefinedAction(action)}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      + {action}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFollowUpAction}
                  onChange={(e) => setNewFollowUpAction(e.target.value)}
                  placeholder="新しいアクション項目を入力"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFollowUpAction())}
                />
                <button
                  type="button"
                  onClick={addFollowUpAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  追加
                </button>
              </div>
              
              <div className="mt-3 space-y-2">
                {formData.followUpActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-900">{action}</span>
                    <button
                      type="button"
                      onClick={() => removeFollowUpAction(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 次回アポイントメントセクション */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">4</span>
              次回アポイントメント
            </h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="scheduleNextAppointment"
                checked={scheduleNextAppointment}
                onChange={(e) => setScheduleNextAppointment(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="scheduleNextAppointment" className="ml-2 block text-sm text-gray-900">
                次回アポイントメントを設定
              </label>
            </div>
          </div>
          
          {scheduleNextAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    予定日 *
                  </label>
                  <input
                    type="date"
                    value={formData.nextAppointment?.scheduledDate || ''}
                    onChange={(e) => handleNestedInputChange('nextAppointment', 'scheduledDate', e.target.value)}
                    required={scheduleNextAppointment}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    時刻 *
                  </label>
                  <input
                    type="time"
                    value={formData.nextAppointment?.scheduledTime || ''}
                    onChange={(e) => handleNestedInputChange('nextAppointment', 'scheduledTime', e.target.value)}
                    required={scheduleNextAppointment}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  場所
                </label>
                <input
                  type="text"
                  value={formData.nextAppointment?.meetingLocation || ''}
                  onChange={(e) => handleNestedInputChange('nextAppointment', 'meetingLocation', e.target.value)}
                  placeholder="会議室、オンライン、先方オフィスなど"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  議題・目的
                </label>
                <textarea
                  value={formData.nextAppointment?.agenda || ''}
                  onChange={(e) => handleNestedInputChange('nextAppointment', 'agenda', e.target.value)}
                  rows={3}
                  placeholder="次回の打ち合わせの目的や議題"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* 人脈管理連携セクション */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">5</span>
              人脈管理連携
            </h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="createConnection"
                checked={formData.connectionData?.createConnection || false}
                onChange={(e) => handleNestedInputChange('connectionData', 'createConnection', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="createConnection" className="ml-2 block text-sm text-gray-900">
                人脈管理にコネクションを追加
              </label>
            </div>
          </div>
          
          {formData.connectionData?.createConnection && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  関係性
                </label>
                <select
                  value={formData.connectionData?.connectionDetails.relationship || ''}
                  onChange={(e) => handleNestedInputChange('connectionData', 'connectionDetails', {
                    ...formData.connectionData?.connectionDetails,
                    relationship: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  <option value="新規見込み客">新規見込み客</option>
                  <option value="既存顧客">既存顧客</option>
                  <option value="パートナー候補">パートナー候補</option>
                  <option value="紹介者">紹介者</option>
                  <option value="業界関係者">業界関係者</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ビジネス可能性
                </label>
                <textarea
                  value={formData.connectionData?.connectionDetails.businessPotential || ''}
                  onChange={(e) => handleNestedInputChange('connectionData', 'connectionDetails', {
                    ...formData.connectionData?.connectionDetails,
                    businessPotential: e.target.value
                  })}
                  rows={2}
                  placeholder="今後のビジネス展開の可能性や期待値"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-md font-medium text-lg"
          >
            {isSubmitting ? '処理中...' : 'アポイントメント完了'}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-700 py-3 px-6 rounded-md font-medium text-lg"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
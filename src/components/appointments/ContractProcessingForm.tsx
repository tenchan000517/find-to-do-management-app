"use client";

import { useState } from 'react';
import { Appointment } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ContractProcessingFormProps {
  appointment: Appointment;
  onSubmit: (contractData: ContractProcessingData) => Promise<void>;
  onCancel: () => void;
}

export interface ContractProcessingData {
  contractAmount: number;
  contractTerms: string;
  paymentTerms: string;
  deliveryTimeline: string;
  projectDetails: {
    name: string;
    description: string;
    startDate: string;
    estimatedDuration: string;
    priority: 'A' | 'B' | 'C' | 'D';
    teamMembers: string[];
  };
  backofficeConfig: {
    createInvoiceTasks: boolean;
    createDeliveryTasks: boolean;
    createFollowUpTasks: boolean;
    invoiceSchedule: string;
    deliverySchedule: string;
    followUpSchedule: string;
  };
  automaticTasks: string[];
}

export default function ContractProcessingForm({
  appointment,
  onSubmit,
  onCancel
}: ContractProcessingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContractProcessingData>({
    contractAmount: appointment.contractAmount || 0,
    contractTerms: '',
    paymentTerms: '一括前払い',
    deliveryTimeline: '',
    projectDetails: {
      name: `${appointment.companyName} 様案件`,
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      estimatedDuration: '3ヶ月',
      priority: 'A',
      teamMembers: []
    },
    backofficeConfig: {
      createInvoiceTasks: true,
      createDeliveryTasks: true,
      createFollowUpTasks: true,
      invoiceSchedule: '契約締結後1週間以内',
      deliverySchedule: '要件定義完了後',
      followUpSchedule: '月次'
    },
    automaticTasks: [
      '契約書作成・送付',
      '請求書発行準備',
      'プロジェクト開始準備',
      'チームアサイン',
      'キックオフミーティング設定'
    ]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to process contract:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContractProcessingData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (
    parent: keyof ContractProcessingData,
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

  const addAutomaticTask = () => {
    const newTask = prompt('新しいタスクを入力してください:');
    if (newTask?.trim()) {
      setFormData(prev => ({
        ...prev,
        automaticTasks: [...prev.automaticTasks, newTask.trim()]
      }));
    }
  };

  const removeAutomaticTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      automaticTasks: prev.automaticTasks.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">契約処理・プロジェクト作成</h2>
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900">{appointment.companyName}</h3>
          <p className="text-blue-700">{appointment.contactName}</p>
          <p className="text-blue-600 text-sm">{appointment.email}</p>
        </div>
      </div>

      {isSubmitting && (
        <LoadingSpinner size="md" message="契約処理中..." className="mb-6" />
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 契約情報セクション */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">1</span>
            契約詳細
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                契約金額 (万円) *
              </label>
              <input
                type="number"
                value={formData.contractAmount}
                onChange={(e) => handleInputChange('contractAmount', parseInt(e.target.value) || 0)}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                支払い条件 *
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="一括前払い">一括前払い</option>
                <option value="一括後払い">一括後払い</option>
                <option value="分割払い（2回）">分割払い（2回）</option>
                <option value="分割払い（3回）">分割払い（3回）</option>
                <option value="月額">月額</option>
                <option value="その他">その他</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              契約条件・特記事項
            </label>
            <textarea
              value={formData.contractTerms}
              onChange={(e) => handleInputChange('contractTerms', e.target.value)}
              rows={4}
              placeholder="契約の詳細条件、特記事項、注意点など"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              納期・スケジュール
            </label>
            <input
              type="text"
              value={formData.deliveryTimeline}
              onChange={(e) => handleInputChange('deliveryTimeline', e.target.value)}
              placeholder="例：3ヶ月、2024年12月末、要件定義完了後2ヶ月など"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* プロジェクト詳細セクション */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">2</span>
            プロジェクト作成
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プロジェクト名 *
              </label>
              <input
                type="text"
                value={formData.projectDetails.name}
                onChange={(e) => handleNestedInputChange('projectDetails', 'name', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プロジェクト概要
              </label>
              <textarea
                value={formData.projectDetails.description}
                onChange={(e) => handleNestedInputChange('projectDetails', 'description', e.target.value)}
                rows={3}
                placeholder="プロジェクトの目的、内容、期待される成果など"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始予定日
                </label>
                <input
                  type="date"
                  value={formData.projectDetails.startDate}
                  onChange={(e) => handleNestedInputChange('projectDetails', 'startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  予定期間
                </label>
                <select
                  value={formData.projectDetails.estimatedDuration}
                  onChange={(e) => handleNestedInputChange('projectDetails', 'estimatedDuration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1ヶ月">1ヶ月</option>
                  <option value="2ヶ月">2ヶ月</option>
                  <option value="3ヶ月">3ヶ月</option>
                  <option value="6ヶ月">6ヶ月</option>
                  <option value="1年">1年</option>
                  <option value="継続">継続</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  優先度
                </label>
                <select
                  value={formData.projectDetails.priority}
                  onChange={(e) => handleNestedInputChange('projectDetails', 'priority', e.target.value as 'A' | 'B' | 'C' | 'D')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="A">A - 最優先</option>
                  <option value="B">B - 重要</option>
                  <option value="C">C - 緊急</option>
                  <option value="D">D - 要検討</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* バックオフィス設定セクション */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-orange-100 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">3</span>
            バックオフィス自動化設定
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="createInvoiceTasks"
                  checked={formData.backofficeConfig.createInvoiceTasks}
                  onChange={(e) => handleNestedInputChange('backofficeConfig', 'createInvoiceTasks', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="createInvoiceTasks" className="ml-2 block text-sm text-gray-900">
                  請求業務タスク生成
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="createDeliveryTasks"
                  checked={formData.backofficeConfig.createDeliveryTasks}
                  onChange={(e) => handleNestedInputChange('backofficeConfig', 'createDeliveryTasks', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="createDeliveryTasks" className="ml-2 block text-sm text-gray-900">
                  納品業務タスク生成
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="createFollowUpTasks"
                  checked={formData.backofficeConfig.createFollowUpTasks}
                  onChange={(e) => handleNestedInputChange('backofficeConfig', 'createFollowUpTasks', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="createFollowUpTasks" className="ml-2 block text-sm text-gray-900">
                  フォローアップタスク生成
                </label>
              </div>
            </div>
            
            {(formData.backofficeConfig.createInvoiceTasks || 
              formData.backofficeConfig.createDeliveryTasks || 
              formData.backofficeConfig.createFollowUpTasks) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                {formData.backofficeConfig.createInvoiceTasks && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      請求タイミング
                    </label>
                    <input
                      type="text"
                      value={formData.backofficeConfig.invoiceSchedule}
                      onChange={(e) => handleNestedInputChange('backofficeConfig', 'invoiceSchedule', e.target.value)}
                      placeholder="例：契約締結後1週間以内"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                {formData.backofficeConfig.createDeliveryTasks && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      納品タイミング
                    </label>
                    <input
                      type="text"
                      value={formData.backofficeConfig.deliverySchedule}
                      onChange={(e) => handleNestedInputChange('backofficeConfig', 'deliverySchedule', e.target.value)}
                      placeholder="例：開発完了後"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                {formData.backofficeConfig.createFollowUpTasks && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      フォローアップ頻度
                    </label>
                    <select
                      value={formData.backofficeConfig.followUpSchedule}
                      onChange={(e) => handleNestedInputChange('backofficeConfig', 'followUpSchedule', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="週次">週次</option>
                      <option value="月次">月次</option>
                      <option value="四半期">四半期</option>
                      <option value="必要時">必要時</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 自動生成タスクセクション */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">4</span>
              自動生成タスク
            </h3>
            <button
              type="button"
              onClick={addAutomaticTask}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + タスク追加
            </button>
          </div>
          
          <div className="space-y-2">
            {formData.automaticTasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-900">{task}</span>
                <button
                  type="button"
                  onClick={() => removeAutomaticTask(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-md font-medium text-lg"
          >
            {isSubmitting ? '処理中...' : '契約処理・プロジェクト作成'}
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
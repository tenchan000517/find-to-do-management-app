"use client";

import { useState } from 'react';
import { Appointment } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AppointmentFlowModalProps {
  isOpen: boolean;
  type: 'schedule' | 'complete' | 'contract';
  appointment: Appointment | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function AppointmentFlowModal({
  isOpen,
  type,
  appointment,
  onClose,
  onSubmit
}: AppointmentFlowModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Schedule fields
    scheduledDate: '',
    scheduledTime: '',
    meetingLocation: '',
    agenda: '',
    participants: '',
    
    // Complete fields
    outcome: '',
    nextSteps: '',
    followUpDate: '',
    createConnection: false,
    connectionData: {},
    
    // Contract fields
    contractAmount: 0,
    contractTerms: '',
    paymentTerms: '',
    deliveryTimeline: '',
    createBackofficeTasks: true,
    createProject: true,
    projectDetails: {
      name: '',
      description: '',
      startDate: '',
      estimatedDuration: '',
      teamMembers: [] as string[]
    }
  });

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit appointment flow:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as any),
        [field]: value
      }
    }));
  };

  const getModalTitle = () => {
    switch (type) {
      case 'schedule': return 'アポイントメント日程設定';
      case 'complete': return 'アポイントメント完了処理';
      case 'contract': return '契約処理・プロジェクト作成';
      default: return 'アポイントメント処理';
    }
  };

  const renderScheduleForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            予定日 *
          </label>
          <input
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            時刻 *
          </label>
          <input
            type="time"
            value={formData.scheduledTime}
            onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
            required
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
          value={formData.meetingLocation}
          onChange={(e) => handleInputChange('meetingLocation', e.target.value)}
          placeholder="会議室、オンライン、先方オフィスなど"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          議題・目的
        </label>
        <textarea
          value={formData.agenda}
          onChange={(e) => handleInputChange('agenda', e.target.value)}
          rows={3}
          placeholder="打ち合わせの目的や議題を入力してください"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          参加者
        </label>
        <input
          type="text"
          value={formData.participants}
          onChange={(e) => handleInputChange('participants', e.target.value)}
          placeholder="参加者名（カンマ区切り）"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderCompleteForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          打ち合わせ結果 *
        </label>
        <textarea
          value={formData.outcome}
          onChange={(e) => handleInputChange('outcome', e.target.value)}
          rows={4}
          required
          placeholder="打ち合わせの結果や成果を入力してください"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          次のステップ
        </label>
        <textarea
          value={formData.nextSteps}
          onChange={(e) => handleInputChange('nextSteps', e.target.value)}
          rows={3}
          placeholder="今後のアクションアイテム"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          フォローアップ予定日
        </label>
        <input
          type="date"
          value={formData.followUpDate}
          onChange={(e) => handleInputChange('followUpDate', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="createConnection"
          checked={formData.createConnection}
          onChange={(e) => handleInputChange('createConnection', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="createConnection" className="ml-2 block text-sm text-gray-900">
          人脈管理にコネクションを作成
        </label>
      </div>
    </div>
  );

  const renderContractForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            契約金額 *
          </label>
          <input
            type="number"
            value={formData.contractAmount}
            onChange={(e) => handleInputChange('contractAmount', parseInt(e.target.value) || 0)}
            required
            min="0"
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            支払い条件
          </label>
          <select
            value={formData.paymentTerms}
            onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">選択してください</option>
            <option value="一括前払い">一括前払い</option>
            <option value="一括後払い">一括後払い</option>
            <option value="分割払い">分割払い</option>
            <option value="月額">月額</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          契約条件・内容
        </label>
        <textarea
          value={formData.contractTerms}
          onChange={(e) => handleInputChange('contractTerms', e.target.value)}
          rows={4}
          placeholder="契約の詳細条件や特記事項"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          納期・スケジュール
        </label>
        <input
          type="text"
          value={formData.deliveryTimeline}
          onChange={(e) => handleInputChange('deliveryTimeline', e.target.value)}
          placeholder="例：3ヶ月、2024年12月末など"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div className="border-t pt-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">自動処理設定</h4>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="createBackofficeTasks"
              checked={formData.createBackofficeTasks}
              onChange={(e) => handleInputChange('createBackofficeTasks', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="createBackofficeTasks" className="ml-2 block text-sm text-gray-900">
              バックオフィスタスクを自動生成
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="createProject"
              checked={formData.createProject}
              onChange={(e) => handleInputChange('createProject', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="createProject" className="ml-2 block text-sm text-gray-900">
              プロジェクトを自動作成
            </label>
          </div>
        </div>
      </div>
      
      {formData.createProject && (
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">プロジェクト詳細</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プロジェクト名 *
              </label>
              <input
                type="text"
                value={formData.projectDetails.name}
                onChange={(e) => handleNestedInputChange('projectDetails', 'name', e.target.value)}
                required={formData.createProject}
                placeholder={`${appointment.companyName} 様案件`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                概要
              </label>
              <textarea
                value={formData.projectDetails.description}
                onChange={(e) => handleNestedInputChange('projectDetails', 'description', e.target.value)}
                rows={3}
                placeholder="プロジェクトの概要や目的"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <input
                  type="text"
                  value={formData.projectDetails.estimatedDuration}
                  onChange={(e) => handleNestedInputChange('projectDetails', 'estimatedDuration', e.target.value)}
                  placeholder="例：3ヶ月、6ヶ月"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFormContent = () => {
    switch (type) {
      case 'schedule': return renderScheduleForm();
      case 'complete': return renderCompleteForm();
      case 'contract': return renderContractForm();
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold">
            {getModalTitle()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">{appointment.companyName}</h3>
          <p className="text-sm text-gray-600">{appointment.contactName}</p>
          <p className="text-sm text-gray-500">{appointment.email}</p>
        </div>
        
        {isSubmitting && (
          <LoadingSpinner size="sm" message="処理中..." className="mb-4" />
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderFormContent()}
          
          <div className="flex gap-2 pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium"
            >
              {isSubmitting ? '処理中...' : 
               type === 'schedule' ? '日程設定' :
               type === 'complete' ? '完了処理' :
               type === 'contract' ? '契約処理' : '実行'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-700 py-2 px-4 rounded-md font-medium"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
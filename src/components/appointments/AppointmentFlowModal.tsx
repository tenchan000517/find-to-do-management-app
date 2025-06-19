"use client";

import { useState, useEffect } from 'react';
import { Appointment } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, Edit, Calendar, Clock, MapPin, Users, Link, Star } from 'lucide-react';

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
  const [currentStep, setCurrentStep] = useState<'selection' | 'form'>('selection');
  const [calendarAction, setCalendarAction] = useState<'new' | 'overwrite' | null>(null);
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
    },
    
    // New option fields
    salesPhase: '',
    relationshipStatus: '',
    createNextAppointment: false,
    nextAppointmentDate: '',
    nextAppointmentPurpose: '',
    nextAppointmentRelationshipStatus: 'RAPPORT_BUILDING'
  });


  // モーダルが開かれたときにステップをリセット
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(type === 'schedule' ? 'selection' : 'form');
      setCalendarAction(null);
    }
  }, [isOpen, type]);

  // 選択肢に応じてフォームデータを初期化
  useEffect(() => {
    if (calendarAction === 'overwrite' && appointment?.calendar_events?.[0]) {
      const latestEvent = appointment.calendar_events[0];
      console.log('🔄 上書き編集: カレンダーイベントデータ', latestEvent);
      setFormData(prev => ({
        ...prev,
        scheduledDate: latestEvent.date || '',
        scheduledTime: latestEvent.time || '',
        meetingLocation: latestEvent.location || '',
        agenda: latestEvent.description || '',
        participants: Array.isArray(latestEvent.participants) 
          ? latestEvent.participants.join(', ') 
          : (latestEvent.participants || ''),
      }));
      console.log('✅ フォームデータ更新完了');
    } else if (calendarAction === 'new') {
      console.log('🆕 新規作成: フォームデータクリア');
      setFormData(prev => ({
        ...prev,
        scheduledDate: '',
        scheduledTime: '',
        meetingLocation: '',
        agenda: '',
        participants: '',
      }));
    }
  }, [calendarAction, appointment]);

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
    if (currentStep === 'selection' && type === 'schedule') {
      return 'カレンダーイベント作成方法';
    }
    switch (type) {
      case 'schedule': return 'アポイントメント日程設定';
      case 'complete': return 'アポイントメント完了処理';
      case 'contract': return '契約処理・プロジェクト作成';
      default: return 'アポイントメント処理';
    }
  };

  const handleSelectionSubmit = () => {
    if (!calendarAction) return;
    setCurrentStep('form');
  };

  const handleSelectionClose = () => {
    setCurrentStep('selection');
    setCalendarAction(null);
    onClose();
  };

  // カレンダーイベント作成の選択肢定義
  const calendarOptions = [
    {
      id: 'new' as const,
      title: '新規作成',
      description: '新しいカレンダーイベントを一から作成します',
      icon: Plus,
      color: 'border-blue-200 hover:bg-blue-50',
      selectedColor: 'border-blue-400 bg-blue-50',
      details: [
        '空のフォームで新しいイベントを作成',
        '日時、場所、議題、参加者を新規入力',
        'オンラインミーティングURLも新規設定可能'
      ]
    },
    {
      id: 'overwrite' as const,
      title: '上書き編集',
      description: '既存の最新カレンダーイベント情報を編集します',
      icon: Edit,
      color: 'border-green-200 hover:bg-green-50',
      selectedColor: 'border-green-400 bg-green-50',
      details: [
        '最新のカレンダーイベント情報を自動入力',
        '日時、場所、議題、参加者、オンラインURLが事前設定',
        '必要な部分のみ修正して更新可能'
      ]
    },
  ];

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

      {/* オプション設定アコーディオン */}
      <details className="border border-gray-200 rounded-lg">
        <summary className="cursor-pointer bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100">
          ⚙️ 追加オプション
        </summary>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              営業フェーズ変更
            </label>
            <select
              value={formData.salesPhase || ''}
              onChange={(e) => handleInputChange('salesPhase', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">変更しない</option>
              <option value="CONTACT">初回接触</option>
              <option value="MEETING">面談調整</option>
              <option value="PROPOSAL">提案</option>
              <option value="CONTRACT">契約</option>
              <option value="CLOSED">完了</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              関係性ステータス変更
            </label>
            <select
              value={formData.relationshipStatus || ''}
              onChange={(e) => handleInputChange('relationshipStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">変更しない</option>
              <option value="FIRST_CONTACT">初回接触</option>
              <option value="RAPPORT_BUILDING">関係性構築</option>
              <option value="FOLLOW_UP">フォローアップ</option>
              <option value="HOT_LEAD">有望案件</option>
              <option value="CLOSED">クローズ</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            💡 入力された日程情報でカレンダーイベントが自動作成されます
          </div>
        </div>
      </details>
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

      {/* オプション設定アコーディオン */}
      <details className="border border-gray-200 rounded-lg">
        <summary className="cursor-pointer bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100">
          ⚙️ 追加オプション
        </summary>
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="createNextAppointment"
              checked={formData.createNextAppointment || false}
              onChange={(e) => handleInputChange('createNextAppointment', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="createNextAppointment" className="text-sm text-gray-700">
              次回アポイントメントを設定
            </label>
          </div>

          {formData.createNextAppointment && (
            <div className="ml-6 space-y-3 border-l-2 border-blue-200 pl-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  次回アポ予定日
                </label>
                <input
                  type="date"
                  value={formData.nextAppointmentDate || ''}
                  onChange={(e) => handleInputChange('nextAppointmentDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  次回アポの目的
                </label>
                <input
                  type="text"
                  value={formData.nextAppointmentPurpose || ''}
                  onChange={(e) => handleInputChange('nextAppointmentPurpose', e.target.value)}
                  placeholder="提案説明、契約確認、等"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  関係性ステータス更新
                </label>
                <select
                  value={formData.nextAppointmentRelationshipStatus || 'RAPPORT_BUILDING'}
                  onChange={(e) => handleInputChange('nextAppointmentRelationshipStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="RAPPORT_BUILDING">関係性構築</option>
                  <option value="FOLLOW_UP">フォローアップ</option>
                  <option value="HOT_LEAD">有望案件</option>
                  <option value="CLOSED">クローズ</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </details>
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

  // 選択肢ステップのレンダー
  if (currentStep === 'selection' && type === 'schedule') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{getModalTitle()}</h2>
            <button
              onClick={handleSelectionClose}
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

          <div className="space-y-6">
            {/* 説明文 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Star className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    カレンダーイベントの作成方法を選択してください
                  </p>
                  <p className="text-xs text-blue-600">
                    新規作成または既存イベント情報の上書き編集を選択できます。
                  </p>
                </div>
              </div>
            </div>

            {/* 作成方法選択 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                作成方法を選択してください
              </label>
              
              <div className="space-y-4">
                {calendarOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = calendarAction === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setCalendarAction(option.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected ? option.selectedColor : option.color
                      }`}
                    >
                      <div className="space-y-3">
                        {/* ヘッダー */}
                        <div className="flex items-start space-x-3">
                          <IconComponent className={`w-6 h-6 mt-0.5 ${
                            option.id === 'new' ? 'text-blue-500' : 'text-green-500'
                          }`} />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {option.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {option.description}
                            </p>
                          </div>
                        </div>

                        {/* 詳細情報 */}
                        <div className="ml-9 space-y-1">
                          {option.details.map((detail, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <div className={`w-1.5 h-1.5 rounded-full mt-2 ${
                                option.id === 'new' ? 'bg-blue-400' : 'bg-green-400'
                              }`} />
                              <p className="text-xs text-gray-600">{detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 選択された処理の詳細説明 */}
            {calendarAction && (
              <div className={`rounded-lg p-4 border ${
                calendarAction === 'new' 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  calendarAction === 'new' ? 'text-blue-800' : 'text-green-800'
                }`}>
                  {calendarAction === 'new' ? '新規作成の効果' : '上書き編集の効果'}
                </h4>
                <p className={`text-sm ${
                  calendarAction === 'new' ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {calendarAction === 'new' 
                    ? '完全に新しいカレンダーイベントを作成します。日時、場所、議題、参加者、オンラインミーティングURLなどすべての情報を一から入力できます。'
                    : '既存の最新カレンダーイベント情報（日時、場所、議題、参加者、オンラインURL）を自動的にフォームに反映し、必要な部分のみ修正して更新できます。効率的な編集が可能です。'
                  }
                </p>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button" 
                onClick={handleSelectionClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
              >
                キャンセル
              </button>
              <button 
                onClick={handleSelectionSubmit}
                disabled={!calendarAction}
                className={`px-4 py-2 text-white rounded-md font-medium ${
                  calendarAction 
                    ? (calendarAction === 'new' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700')
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {calendarAction === 'new' && '新規作成へ進む'}
                {calendarAction === 'overwrite' && '上書き編集へ進む'}
                {!calendarAction && '選択してください'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // フォームステップのレンダー
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold">
              {getModalTitle()}
            </h2>
            {type === 'schedule' && calendarAction && (
              <p className="text-sm text-gray-600 mt-1">
                {calendarAction === 'new' ? '新規作成モード' : '上書き編集モード'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
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
            {type === 'schedule' && currentStep === 'form' && (
              <button
                type="button"
                onClick={() => setCurrentStep('selection')}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-md font-medium"
              >
                戻る
              </button>
            )}
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
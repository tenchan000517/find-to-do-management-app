"use client";

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Brain, Archive, Lightbulb, Star } from 'lucide-react';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskId: string, action: 'archive' | 'knowledge') => void;
  taskId: string;
}

export default function CompletionModal({ isOpen, onClose, onSubmit, taskId }: CompletionModalProps) {
  const [selectedAction, setSelectedAction] = useState<'archive' | 'knowledge' | null>(null);

  const handleSubmit = () => {
    if (!selectedAction) return;
    onSubmit(taskId, selectedAction);
    handleClose();
  };

  const handleClose = () => {
    setSelectedAction(null);
    onClose();
  };

  const completionOptions = [
    {
      id: 'archive' as const,
      title: '完了アーカイブ',
      description: 'タスクを完了済みとしてアーカイブします',
      icon: Archive,
      color: 'border-green-200 hover:bg-green-50',
      selectedColor: 'border-green-400 bg-green-50',
      details: [
        'タスクは完了状態として記録されます',
        '統計や分析データに反映されます',
        '一般的な完了処理です'
      ]
    },
    {
      id: 'knowledge' as const,
      title: 'ナレッジ昇華',
      description: '学びや知見をナレッジとして蓄積します',
      icon: Brain,
      color: 'border-purple-200 hover:bg-purple-50',
      selectedColor: 'border-purple-400 bg-purple-50',
      details: [
        '価値ある学びや知見を組織資産として保存',
        '他のメンバーが参考にできるナレッジベースに追加',
        '継続的な改善と学習促進に貢献'
      ]
    },
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="タスク完了処理"
      size="lg"
    >

        <div className="space-y-6">
          {/* 説明文 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Star className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm text-green-800 font-medium mb-1">
                  タスクが課題・改善段階から完了に移行します
                </p>
                <p className="text-xs text-green-600">
                  適切な完了処理を選択することで、組織の学習と成長に貢献できます。
                </p>
              </div>
            </div>
          </div>

          {/* 完了方法選択 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              完了処理の方法を選択してください
            </label>
            
            <div className="space-y-4">
              {completionOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = selectedAction === option.id;
                
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedAction(option.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected ? option.selectedColor : option.color
                    }`}
                  >
                    <div className="space-y-3">
                      {/* ヘッダー */}
                      <div className="flex items-start space-x-3">
                        <IconComponent className={`w-6 h-6 mt-0.5 ${
                          option.id === 'knowledge' ? 'text-purple-500' : 'text-green-500'
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
                              option.id === 'knowledge' ? 'bg-purple-400' : 'bg-green-400'
                            }`} />
                            <p className="text-xs text-gray-600">{detail}</p>
                          </div>
                        ))}
                      </div>

                      {/* 推奨バッジ */}
                      {option.id === 'knowledge' && (
                        <div className="ml-9">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Lightbulb className="w-3 h-3 mr-1" />
                            学習価値が高い場合に推奨
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 選択された処理の詳細説明 */}
          {selectedAction && (
            <div className={`rounded-lg p-4 border ${
              selectedAction === 'knowledge' 
                ? 'bg-purple-50 border-purple-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <h4 className={`font-medium mb-2 ${
                selectedAction === 'knowledge' ? 'text-purple-800' : 'text-green-800'
              }`}>
                {selectedAction === 'knowledge' ? 'ナレッジ昇華の効果' : '完了アーカイブの効果'}
              </h4>
              <p className={`text-sm ${
                selectedAction === 'knowledge' ? 'text-purple-600' : 'text-green-600'
              }`}>
                {selectedAction === 'knowledge' 
                  ? 'このタスクから得られた学びや知見は、組織のナレッジベースに蓄積され、他のメンバーの参考資料として活用されます。継続的な学習と改善文化の醸成に貢献します。'
                  : 'タスクは完了状態として記録され、進捗統計や生産性分析に反映されます。プロジェクトの成功指標として活用されます。'
                }
              </p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleClose}>
              キャンセル
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedAction}
              className={selectedAction === 'knowledge' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              {selectedAction === 'archive' && '完了アーカイブ'}
              {selectedAction === 'knowledge' && 'ナレッジ昇華'}
              {!selectedAction && '選択してください'}
            </Button>
          </div>
        </div>
    </Modal>
  );
}
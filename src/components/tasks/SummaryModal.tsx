"use client";

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FileEdit, ArrowRight, Lightbulb, Target } from 'lucide-react';
import { Task } from '@/lib/types';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskId: string, summary: string) => void;
  taskId: string;
  fromStatus?: Task['status'];
}

export default function SummaryModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  taskId, 
  fromStatus = 'CHECK' 
}: SummaryModalProps) {
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!summary.trim()) {
      setError('サマリーを入力してください');
      return;
    }

    if (summary.trim().length < 10) {
      setError('より詳細なサマリーを入力してください（10文字以上）');
      return;
    }

    setError('');
    onSubmit(taskId, summary.trim());
    handleClose();
  };

  const handleClose = () => {
    setSummary('');
    setError('');
    onClose();
  };

  const suggestionTemplates = [
    {
      label: '課題分析',
      template: '発生した課題：\n根本原因：\n対応策：\n'
    },
    {
      label: '改善点',
      template: '改善が必要な点：\n具体的な改善方法：\n期待される効果：\n'
    },
    {
      label: '学んだこと',
      template: '今回学んだこと：\n今後に活かす方法：\n注意すべき点：\n'
    }
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="改善サマリー作成"
      size="xl"
    >

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 説明文 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium mb-1">
                  課題・改善段階から実行段階に戻ります
                </p>
                <p className="text-xs text-blue-600">
                  発見した課題や改善点をサマリーとして記録することで、今後の参考になります。
                </p>
              </div>
            </div>
          </div>

          {/* 処理フロー表示 */}
          <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">課題・改善</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">実行中</span>
            </div>
          </div>

          {/* サマリー入力 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              <FileEdit className="w-4 h-4 inline mr-1" />
              改善サマリー <span className="text-red-500">*</span>
            </label>
            
            {/* テンプレート選択 */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500">テンプレートを使用：</p>
              <div className="flex flex-wrap gap-2">
                {suggestionTemplates.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSummary(template.template)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                  >
                    {template.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSummary('')}
                  className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded-full text-red-700 transition-colors"
                >
                  クリア
                </button>
              </div>
            </div>

            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="課題や改善点について詳しく記述してください...

例：
- 発生した問題や課題
- 根本的な原因分析
- 今後の改善策
- 学んだことや気づき
- 注意すべきポイント"
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
              required
            />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>最小10文字必要</span>
              <span>{summary.length} / 500</span>
            </div>
          </div>

          {/* サマリー作成のガイドライン */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">効果的なサマリーのポイント</h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• <strong>具体的</strong>：何が起きたか、なぜ起きたかを明確に</li>
              <li>• <strong>建設的</strong>：問題の指摘だけでなく、解決策も記載</li>
              <li>• <strong>学習志向</strong>：今回の経験から学べることを含める</li>
              <li>• <strong>実行可能</strong>：次回に活かせる具体的なアクションを示す</li>
            </ul>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleClose}>
              キャンセル
            </Button>
            <Button type="submit">
              サマリーを保存して実行に戻る
            </Button>
          </div>
        </form>
    </Modal>
  );
}
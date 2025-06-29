"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/card';
import { Plus, Sparkles, Users, Calendar, Target } from 'lucide-react';

interface QuickProjectCreatorProps {
  onProjectCreated?: (project: any) => void;
  className?: string;
  variant?: 'dashboard' | 'mobile' | 'standalone';
}

export default function QuickProjectCreator({ 
  onProjectCreated, 
  className = '',
  variant = 'dashboard' 
}: QuickProjectCreatorProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const parseProjectInput = (input: string) => {
    // 自然言語解析：「Webサイト制作、5名、3ヶ月」のような入力をパース
    const teamMatch = input.match(/(\d+)[名人]|(\d+)名/);
    const periodMatch = input.match(/(\d+)[ヶか月週日]/);
    const typeMatch = input.match(/(Web|アプリ|システム|AI|ML|イベント|セミナー|マーケティング)/i);
    
    return {
      description: input,
      teamSize: teamMatch ? parseInt(teamMatch[1] || teamMatch[2]) : 3,
      timeline: periodMatch ? parseInt(periodMatch[1]) : 4,
      projectType: typeMatch ? typeMatch[1] : 'カスタム',
      requirements: input.split(/[、，,]/).filter(req => req.trim() && !req.match(/\d+[名人月週日]/))
    };
  };

  const handleCreateProject = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const parsed = parseProjectInput(input);
      
      // ProjectTemplateGenerator API呼び出し
      const response = await fetch('/api/project-templates/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: parsed.description,
          teamSize: parsed.teamSize,
          timeline: parsed.timeline,
          projectType: parsed.projectType,
          requirements: parsed.requirements
        })
      });

      const project = await response.json();
      setResult(project);
      onProjectCreated?.(project);
      
      // 3秒後にリセット（モバイルでは手動リセット）
      if (variant !== 'mobile') {
        setTimeout(() => {
          setResult(null);
          setInput('');
        }, 3000);
      }
      
    } catch (error) {
      console.error('プロジェクト作成エラー:', error);
      // フォールバック：シンプルなプロジェクト作成
      const fallback = {
        name: input || '新しいプロジェクト',
        description: `${input}のプロジェクト`,
        teamSize: parseProjectInput(input).teamSize,
        timeline: `${parseProjectInput(input).timeline}週間`,
        status: 'created'
      };
      setResult(fallback);
      onProjectCreated?.(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleCreateProject();
    }
  };

  // 成功表示
  if (result) {
    return (
      <Card className={`p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200 ${className}`}>
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-green-800 mb-1">
              {result.projectName || result.name} ✨
            </h3>
            <div className="flex items-center space-x-4 text-sm text-green-700 mb-2">
              {result.teamSize && (
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{result.teamSize}名</span>
                </div>
              )}
              {result.timeline && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{result.timeline}</span>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.location.href = '/projects'}
              >
                開始
              </Button>
              {variant === 'mobile' && (
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setInput('');
                  }}
                >
                  新規作成
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // 入力フォーム
  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">
            {variant === 'mobile' ? '新プロジェクト' : 'プロジェクトを30秒で作成'}
          </h3>
        </div>
        
        <div className="space-y-2">
          <Input
            placeholder="例: Webサイト制作、5名、3ヶ月"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="text-sm"
          />
          
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              自然な言葉で入力してください
            </p>
            <Button
              onClick={handleCreateProject}
              disabled={!input.trim() || loading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  <span>作成中...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Plus className="w-3 h-3" />
                  <span>作成</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {variant !== 'mobile' && (
          <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
            💡 例: 「マーケティングキャンペーン、3名、2週間」「AIチャットボット開発、4名、6ヶ月」
          </div>
        )}
      </div>
    </Card>
  );
}
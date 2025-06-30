'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  BarChart3,
  ChevronRight,
  Lightbulb
} from 'lucide-react';

interface ProductivityInsight {
  id: string;
  type: 'efficiency' | 'peak_time' | 'completion_rate' | 'suggestion';
  title: string;
  description: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  actionable: boolean;
}

interface AIInsightsWidgetProps {
  className?: string;
  compact?: boolean;
}

export default function AIInsightsWidget({ 
  className = '', 
  compact = false 
}: AIInsightsWidgetProps) {
  const [insights, setInsights] = useState<ProductivityInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<ProductivityInsight | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      // モックデータ - 将来的に予測エンジンから取得
      const mockInsights: ProductivityInsight[] = [
        {
          id: '1',
          type: 'efficiency',
          title: '作業効率',
          description: '今週の平均タスク完了率',
          value: '85%',
          trend: 'up',
          confidence: 0.92,
          actionable: true
        },
        {
          id: '2',
          type: 'peak_time',
          title: '最適作業時間',
          description: 'あなたの生産性が最も高い時間帯',
          value: '9:00-11:00',
          trend: 'stable',
          confidence: 0.88,
          actionable: true
        },
        {
          id: '3',
          type: 'completion_rate',
          title: '予測完了率',
          description: '今日のタスクの完了見込み',
          value: '78%',
          trend: 'up',
          confidence: 0.75,
          actionable: false
        },
        {
          id: '4',
          type: 'suggestion',
          title: 'AI提案',
          description: '短時間で完了できるタスクが3件あります',
          value: '3件',
          trend: 'stable',
          confidence: 0.91,
          actionable: true
        }
      ];
      
      setInsights(mockInsights);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <BarChart3 className="h-4 w-4 text-blue-500" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'efficiency':
        return <Target className="h-5 w-5 text-blue-500" />;
      case 'peak_time':
        return <Clock className="h-5 w-5 text-purple-500" />;
      case 'completion_rate':
        return <BarChart3 className="h-5 w-5 text-green-500" />;
      case 'suggestion':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      default:
        return <BarChart3 className="h-5 w-5 text-gray-500" />;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return { label: '高精度', color: 'bg-green-100 text-green-800' };
    if (confidence >= 0.7) return { label: '中精度', color: 'bg-yellow-100 text-yellow-800' };
    return { label: '低精度', color: 'bg-red-100 text-red-800' };
  };

  if (loading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader className="pb-3">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={`${className} border-0 shadow-sm`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">AI洞察</h3>
            <Button variant="ghost" size="sm" className="h-6 px-2">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {insights.slice(0, 2).map((insight) => (
              <div key={insight.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getInsightIcon(insight.type)}
                  <span className="text-sm font-medium">{insight.value}</span>
                </div>
                {getTrendIcon(insight.trend)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <span>AI生産性洞察</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                selectedInsight?.id === insight.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedInsight(
                selectedInsight?.id === insight.id ? null : insight
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getConfidenceBadge(insight.confidence).color}`}
                      >
                        {getConfidenceBadge(insight.confidence).label}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg">{insight.value}</span>
                  {getTrendIcon(insight.trend)}
                </div>
              </div>

              {selectedInsight?.id === insight.id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      信頼度: {Math.round(insight.confidence * 100)}%
                    </div>
                    {insight.actionable && (
                      <Button size="sm" variant="outline" className="text-xs">
                        詳細を見る
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full text-xs"
            onClick={loadInsights}
          >
            洞察を更新
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Search, 
  Mic, 
  Filter,
  X,
  Clock,
  Tag,
  User,
  Calendar,
  Zap,
  TrendingUp
} from 'lucide-react';

interface SearchSuggestion {
  id: string;
  type: 'task' | 'project' | 'date' | 'status' | 'priority' | 'natural';
  query: string;
  description: string;
  count?: number;
  confidence: number;
}

interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'event';
  title: string;
  description: string;
  relevance: number;
  metadata: {
    status?: string;
    priority?: string;
    dueDate?: string;
    project?: string;
  };
}

interface IntelligentSearchBoxProps {
  className?: string;
  placeholder?: string;
  onResults?: (results: SearchResult[]) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
}

export default function IntelligentSearchBox({ 
  className = '', 
  placeholder = "何を探していますか？",
  onResults,
  onSuggestionSelect
}: IntelligentSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length > 0) {
      setShowSuggestions(true);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        generateSuggestions(query);
      }, 300);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const generateSuggestions = async (searchQuery: string) => {
    try {
      // 自然言語処理とセマンティック検索の模擬実装
      const mockSuggestions: SearchSuggestion[] = [];

      // 日付関連の検索提案
      if (searchQuery.includes('今日') || searchQuery.includes('today')) {
        mockSuggestions.push({
          id: 'today-tasks',
          type: 'date',
          query: '今日のタスク',
          description: '今日期限のタスクを表示',
          count: 5,
          confidence: 0.95
        });
      }

      if (searchQuery.includes('来週') || searchQuery.includes('next week')) {
        mockSuggestions.push({
          id: 'next-week',
          type: 'date',
          query: '来週のスケジュール',
          description: '来週のタスクとイベント',
          count: 12,
          confidence: 0.88
        });
      }

      // ステータス関連
      if (searchQuery.includes('未完了') || searchQuery.includes('incomplete')) {
        mockSuggestions.push({
          id: 'incomplete-tasks',
          type: 'status',
          query: '未完了タスク',
          description: '完了していないタスク一覧',
          count: 8,
          confidence: 0.92
        });
      }

      // 優先度関連
      if (searchQuery.includes('緊急') || searchQuery.includes('urgent')) {
        mockSuggestions.push({
          id: 'urgent-tasks',
          type: 'priority',
          query: '緊急タスク',
          description: '高優先度のタスク',
          count: 3,
          confidence: 0.97
        });
      }

      // プロジェクト関連
      if (searchQuery.includes('プロジェクト') || searchQuery.includes('project')) {
        mockSuggestions.push({
          id: 'project-tasks',
          type: 'project',
          query: 'プロジェクトA タスク',
          description: 'プロジェクトAに関連するタスク',
          count: 15,
          confidence: 0.85
        });
      }

      // 自然言語での複雑な検索
      if (searchQuery.length > 5) {
        mockSuggestions.push({
          id: 'natural-search',
          type: 'natural',
          query: searchQuery,
          description: '自然言語検索で関連項目を検索',
          confidence: 0.75
        });
      }

      // 一般的な検索候補
      const commonSuggestions: SearchSuggestion[] = [
        {
          id: 'all-tasks',
          type: 'task',
          query: 'すべてのタスク',
          description: '全タスクを表示',
          count: 42,
          confidence: 0.9
        },
        {
          id: 'recent-projects',
          type: 'project',
          query: '最近のプロジェクト',
          description: '最近アクセスしたプロジェクト',
          count: 6,
          confidence: 0.8
        }
      ];

      const finalSuggestions = mockSuggestions.length > 0 
        ? mockSuggestions 
        : commonSuggestions.slice(0, 3);

      setSuggestions(finalSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
  };

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      // AI検索の模擬実装
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'task',
          title: 'プレゼンテーション資料作成',
          description: '来週の会議用資料を準備する',
          relevance: 0.95,
          metadata: {
            status: '進行中',
            priority: '高',
            dueDate: '2025-07-05',
            project: 'プロジェクトA'
          }
        },
        {
          id: '2',
          type: 'task',
          title: 'データベース設計レビュー',
          description: 'システム要件に基づいてデータベース構造を確認',
          relevance: 0.87,
          metadata: {
            status: '未開始',
            priority: '中',
            dueDate: '2025-07-03'
          }
        },
        {
          id: '3',
          type: 'project',
          title: 'モバイルアプリ開発',
          description: 'React Nativeを使用したモバイルアプリの開発',
          relevance: 0.82,
          metadata: {
            status: '進行中'
          }
        }
      ];

      setResults(mockResults);
      setShowSuggestions(false);
      
      if (onResults) {
        onResults(mockResults);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.query);
    performSearch(suggestion.query);
    setShowSuggestions(false);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsListening(true);
      // 実際の音声認識実装はここに追加
      setTimeout(() => {
        setIsListening(false);
        setQuery('今日のタスクを表示');
      }, 2000);
    } else {
      alert('音声認識はサポートされていません');
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSuggestionClick(suggestions[selectedIndex]);
      } else {
        performSearch(query);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'date':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'status':
        return <Filter className="h-4 w-4 text-green-500" />;
      case 'priority':
        return <Zap className="h-4 w-4 text-red-500" />;
      case 'project':
        return <Tag className="h-4 w-4 text-purple-500" />;
      case 'natural':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-500" />;
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'project':
        return <Tag className="h-4 w-4 text-purple-500" />;
      case 'event':
        return <Calendar className="h-4 w-4 text-green-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case '高':
        return 'bg-red-100 text-red-800';
      case '中':
        return 'bg-yellow-100 text-yellow-800';
      case '低':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 検索入力フィールド */}
      <Card className="mb-2">
        <CardContent className="p-3">
          <div className="relative flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none outline-none text-sm"
            />
            
            {/* 音声検索ボタン */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceSearch}
              className={`h-8 w-8 p-0 ${isListening ? 'text-red-500' : 'text-gray-400'}`}
            >
              <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
            </Button>

            {/* クリアボタン */}
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-8 w-8 p-0 text-gray-400"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 検索提案 */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="mb-2 border shadow-lg">
          <CardContent className="p-2">
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    index === selectedIndex 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {getSuggestionIcon(suggestion.type)}
                    <div>
                      <div className="text-sm font-medium">{suggestion.query}</div>
                      <div className="text-xs text-gray-500">{suggestion.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {suggestion.count && (
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.count}件
                      </Badge>
                    )}
                    <div className="text-xs text-gray-400">
                      {Math.round(suggestion.confidence * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 検索結果 */}
      {results.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="mb-3 text-sm font-medium text-gray-700">
              検索結果 ({results.length}件)
            </div>
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {getResultIcon(result.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{result.title}</h4>
                        <div className="text-xs text-gray-400">
                          {Math.round(result.relevance * 100)}% 一致
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{result.description}</p>
                      
                      {/* メタデータ */}
                      <div className="flex items-center space-x-2">
                        {result.metadata.status && (
                          <Badge variant="outline" className="text-xs">
                            {result.metadata.status}
                          </Badge>
                        )}
                        {result.metadata.priority && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(result.metadata.priority)}`}
                          >
                            {result.metadata.priority}
                          </Badge>
                        )}
                        {result.metadata.dueDate && (
                          <div className="text-xs text-gray-500">
                            期限: {result.metadata.dueDate}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 検索中ローディング */}
      {isSearching && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">AI検索中...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 音声認識中の表示 */}
      {isListening && (
        <Card className="absolute top-full left-0 right-0 mt-2 border-blue-500 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-center space-x-2">
              <Mic className="h-4 w-4 text-red-500 animate-pulse" />
              <span className="text-sm text-blue-700">音声を聞いています...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
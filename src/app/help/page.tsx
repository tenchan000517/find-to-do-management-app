'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Search, ArrowLeft, ExternalLink, FileText, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingCenter } from '@/components/ui/Loading';
import MarkdownContent from '@/components/MarkdownContent';

interface DocFile {
  name: string;
  path: string;
  title: string;
  description: string;
}

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  files: DocFile[];
}

interface FileMetadata {
  file: string;
  title?: string;
  description?: string;
  success: boolean;
  error?: string;
}

// Dynamic loading - sections will be loaded from API

export default function HelpPage() {
  const [docSections, setDocSections] = useState<DocSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fileMetadata, setFileMetadata] = useState<{[key: string]: FileMetadata}>({});
  const [sectionsLoading, setSectionsLoading] = useState(true);

  // アイコンコンポーネントをマッピング
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'BookOpen': BookOpen,
      'Users': Users,
      'FileText': FileText,
      'Settings': Settings,
      'File': FileText // フォールバック
    };
    return iconMap[iconName] || FileText;
  };

  // 初期化時にドキュメントセクションを動的に読み込み
  useEffect(() => {
    const loadDocSections = async () => {
      try {
        setSectionsLoading(true);
        const response = await fetch('/api/help/docs');
        if (response.ok) {
          const data = await response.json();
          const mappedSections = data.sections.map((section: any) => ({
            ...section,
            icon: getIconComponent(section.icon)
          }));
          setDocSections(mappedSections);
        } else {
          console.error('Failed to load document sections');
        }
      } catch (error) {
        console.error('Error loading document sections:', error);
      } finally {
        setSectionsLoading(false);
      }
    };

    loadDocSections();
  }, []);

  // セクション選択時にファイルメタデータを取得
  useEffect(() => {
    if (!selectedSection) return;

    const section = docSections.find(s => s.id === selectedSection);
    if (!section) return;

    const loadMetadata = async () => {
      try {
        const fileNames = section.files.map(f => f.path);
        const response = await fetch('/api/help/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: fileNames })
        });

        if (response.ok) {
          const data = await response.json();
          const metadataMap: {[key: string]: FileMetadata} = {};
          data.results.forEach((result: FileMetadata) => {
            metadataMap[result.file] = result;
          });
          setFileMetadata(metadataMap);
        }
      } catch (error) {
        console.error('Failed to load metadata:', error);
      }
    };

    loadMetadata();
  }, [selectedSection]);

  useEffect(() => {
    if (!selectedFile) return;

    const loadContent = async () => {
      setLoading(true);
      setError(null);
      try {
        // ファイルパスをそのまま使用（API側で処理）
        const response = await fetch(`/api/help/content?file=${selectedFile}`);
        
        if (!response.ok) {
          throw new Error(`ファイルの読み込みに失敗しました: ${response.status}`);
        }
        
        const data = await response.json();
        setContent(data.content);
      } catch (error) {
        console.error('Error loading content:', error);
        setError('ドキュメントの読み込みに失敗しました。しばらく時間をおいて再度お試しください。');
        setContent('');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [selectedFile]);

  const filteredSections = docSections.filter(section =>
    searchQuery === '' ||
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBackToSections = () => {
    setSelectedSection(null);
    setSelectedFile(null);
    setContent('');
    setError(null);
  };

  const handleBackToFiles = () => {
    setSelectedFile(null);
    setContent('');
    setError(null);
  };

  const handleInternalLinkClick = (link: string) => {
    // リンクを解析してファイルパスを特定
    let targetFile = link;
    
    // 相対パスを絶対パスに変換
    if (link.startsWith('./') || link.startsWith('../')) {
      // 現在のファイルのディレクトリを基準に解決
      const currentDir = selectedFile?.substring(0, selectedFile.lastIndexOf('/')) || '';
      if (link.startsWith('./')) {
        targetFile = `${currentDir}/${link.slice(2)}`;
      } else if (link.startsWith('../')) {
        const parentDir = currentDir.substring(0, currentDir.lastIndexOf('/'));
        targetFile = `${parentDir}/${link.slice(3)}`;
      }
    }

    // .mdが含まれていない場合は追加
    if (!targetFile.endsWith('.md')) {
      targetFile += '.md';
    }

    // docs/ プレフィックスを調整
    if (!targetFile.startsWith('docs/')) {
      // 現在のファイルと同じディレクトリ構造を推測
      if (selectedFile?.startsWith('docs/')) {
        targetFile = `docs/${targetFile}`;
      }
    }

    // ファイルが存在するかチェックして、存在すれば選択
    setSelectedFile(targetFile);
  };

  if (selectedFile && content) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleBackToFiles}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>戻る</span>
                  </Button>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      {selectedFile.replace(/^docs\//, '').replace('.md', '')}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {docSections.find(s => s.id === selectedSection)?.title}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://github.com/your-repo/find-to-do-management-app/blob/main/${selectedFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>GitHubで開く</span>
                </a>
              </div>
            </div>
            
            <div className="px-6 py-6">
              <div className="prose prose-lg max-w-none">
                <MarkdownContent 
                  content={content} 
                  onInternalLinkClick={handleInternalLinkClick}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedSection) {
    const section = docSections.find(s => s.id === selectedSection);
    if (!section) return null;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              onClick={handleBackToSections}
              variant="outline"
              className="flex items-center space-x-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>ヘルプトップに戻る</span>
            </Button>
            
            <div className="flex items-center space-x-3 mb-2">
              <section.icon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">{section.title}</h1>
            </div>
            <p className="text-gray-600">{section.description}</p>
          </div>

          <div className="grid gap-4">
            {section.files.map((file, index) => {
              const metadata = fileMetadata[file.path];
              
              // タイトルと説明を取得（ファイル情報を優先、メタデータをフォールバック）
              const displayTitle = file.title || metadata?.title || file.name.replace('.md', '');
              const displayDescription = file.description || metadata?.description || 'ドキュメント';
              
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedFile(file.path)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{displayTitle}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {displayDescription}
                          </p>
                          {metadata && !metadata.success && (
                            <p className="text-xs text-red-500 mt-1">
                              読み込みエラー
                            </p>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">公式ドキュメント・ヘルプ</h1>
          </div>
          
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="ドキュメントを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {sectionsLoading ? (
          <LoadingCenter message="ドキュメントを読み込み中..." size="lg" />
        ) : (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {filteredSections.map((section) => (
              <div
                key={section.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedSection(section.id)}
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <section.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-500">{section.files.length}個のドキュメント</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{section.description}</p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <span>詳細を見る</span>
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <LoadingCenter message="読み込み中..." size="lg" />
        )}

        {error && (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">🚀 今すぐ始めましょう</h3>
          <p className="text-blue-700 mb-4">
            初めての方は「クイックスタート」から、既存ユーザーは「ユーザーフロー・活用ガイド」ご覧ください。
          </p>
          <div className="flex space-x-4">
            {!sectionsLoading && docSections.length > 0 && (
              <>
                <Button
                  onClick={() => setSelectedSection('quick-start')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  クイックスタート
                </Button>
                <Button
                  onClick={() => setSelectedSection('user-flows')}
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  活用ガイド
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
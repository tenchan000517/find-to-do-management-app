// Phase 2: Project Templates Page
// プロジェクトテンプレート選択・適用ページ

"use client";

import { useState } from 'react';
import { useProjectTemplates } from '@/hooks/useProjectTemplates';
import TemplateSelector from './components/TemplateSelector';
import TemplatePreview from './components/TemplatePreview';
import TemplateCustomization from './components/TemplateCustomization';
import ProjectGeneration from './components/ProjectGeneration';
import LoadingSpinner from '@/components/LoadingSpinner';

type Step = 'select' | 'preview' | 'customize' | 'generate';

export default function ProjectTemplatesPage() {
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [showCreateFromScratch, setShowCreateFromScratch] = useState(false);
  
  const {
    templates,
    filteredTemplates,
    selectedTemplate,
    customization,
    loading,
    error,
    setSelectedTemplate,
    setCustomization,
    filters,
    updateFilters,
    resetFilters,
    generateTemplate,
    applyTemplate
  } = useProjectTemplates();

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setCurrentStep('preview');
  };

  const handlePreviewNext = () => {
    setCurrentStep('customize');
  };

  const handleCustomizationNext = (customizationData: any) => {
    setCustomization(customizationData);
    setCurrentStep('generate');
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'preview':
        setCurrentStep('select');
        setSelectedTemplate(null);
        break;
      case 'customize':
        setCurrentStep('preview');
        break;
      case 'generate':
        setCurrentStep('customize');
        break;
    }
  };

  const handleReset = () => {
    setCurrentStep('select');
    setSelectedTemplate(null);
    setCustomization(null);
    setShowCreateFromScratch(false);
  };

  const getStepIndicator = () => {
    const steps = [
      { key: 'select', label: 'テンプレート選択', icon: '📋' },
      { key: 'preview', label: 'プレビュー', icon: '👀' },
      { key: 'customize', label: 'カスタマイズ', icon: '⚙️' },
      { key: 'generate', label: 'プロジェクト生成', icon: '🚀' }
    ];

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                currentStep === step.key 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'text-gray-500'
              }`}>
                <span className="text-lg">{step.icon}</span>
                <span className="text-sm">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`mx-2 w-8 h-0.5 ${
                  steps.findIndex(s => s.key === currentStep) > index 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="テンプレートを読み込み中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                🚀 プロジェクトテンプレート
              </h1>
              <p className="text-gray-600 mt-2">
                業界特化型テンプレートで効率的なプロジェクト立ち上げを実現
              </p>
            </div>
            
            {/* アクションボタン */}
            <div className="flex gap-3">
              {currentStep !== 'select' && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  戻る
                </button>
              )}
              
              {currentStep !== 'select' && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  最初から
                </button>
              )}

              <button
                onClick={() => setShowCreateFromScratch(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI でテンプレート生成
              </button>
            </div>
          </div>
        </div>

        {/* ステップインジケーター */}
        {getStepIndicator()}

        {/* メインコンテンツ */}
        {currentStep === 'select' && (
          <TemplateSelector
            templates={filteredTemplates}
            filters={filters}
            onFilterUpdate={updateFilters}
            onFilterReset={resetFilters}
            onTemplateSelect={handleTemplateSelect}
            showCreateFromScratch={showCreateFromScratch}
            onCreateFromScratch={setShowCreateFromScratch}
            onGenerateTemplate={generateTemplate}
          />
        )}

        {currentStep === 'preview' && selectedTemplate && (
          <TemplatePreview
            template={selectedTemplate}
            onNext={handlePreviewNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'customize' && selectedTemplate && (
          <TemplateCustomization
            template={selectedTemplate}
            onNext={handleCustomizationNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'generate' && selectedTemplate && customization && (
          <ProjectGeneration
            template={selectedTemplate}
            customization={customization}
            onApplyTemplate={applyTemplate}
            onBack={handleBack}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
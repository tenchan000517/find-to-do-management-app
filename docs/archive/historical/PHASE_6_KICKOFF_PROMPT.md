================================================================================
🚀 Phase 6実装開始プロンプト - 営業自動化・高度AI分析フェーズ
================================================================================

📅 実装期間: 1週間
🎯 担当責務: 営業自動化システム・高度AI分析・売上最適化システム実装

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 必須完了項目（100%実装必須）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ 営業自動化システム実装
  → 営業メール自動送信エンジン
  → 提案書自動生成システム
  → 契約書テンプレート自動作成

□ 高度AI分析エンジン実装
  → 競合分析AI
  → 市場トレンド予測AI
  → 顧客行動分析AI

□ 売上最適化システム実装
  → ROI最適化AI
  → 営業リソース配分最適化
  → 営業戦略自動提案

□ 営業プロセス完全自動化
  → フォローアップ自動化
  → 営業活動自動ログ
  → 顧客満足度追跡

□ 統合自動化ダッシュボード
  → 自動化状況モニタリング
  → AI分析結果表示
  → 最適化提案ビュー

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 実装ファイル構成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 新規作成必須ファイル
src/components/automation/SalesAutomationEngine.tsx
src/components/ai/CompetitorAnalysisAI.tsx
src/components/ai/MarketTrendPredictor.tsx
src/components/ai/CustomerBehaviorAnalyzer.tsx
src/components/optimization/ROIOptimizer.tsx
src/components/optimization/ResourceAllocationOptimizer.tsx
src/app/api/automation/email-sender/route.ts
src/app/api/ai/competitor-analysis/route.ts
src/app/api/ai/market-trends/route.ts
src/app/api/optimization/roi-analysis/route.ts
src/app/dashboard/sales-automation/page.tsx

📂 変更対象ファイル
src/lib/types.ts                             # 自動化・AI分析型定義追加
src/app/dashboard/page.tsx                   # 自動化ダッシュボード統合

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💻 重要実装パターン
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 営業自動化エンジンパターン
```typescript
interface SalesAutomationEngine {
  emailAutomation: {
    templates: EmailTemplate[];
    sendSchedule: AutoSendSchedule;
    personalization: PersonalizationRules;
  };
  proposalGeneration: {
    templates: ProposalTemplate[];
    autoContent: ContentGenerationRules;
    customization: CustomizationOptions;
  };
  contractAutomation: {
    templates: ContractTemplate[];
    termsCustomization: TermsCustomizationRules;
    approvalWorkflow: ApprovalWorkflow;
  };
}

const automateEmailSending = async (appointment: Appointment): Promise<AutomationResult> => {
  const template = selectOptimalTemplate(appointment);
  const personalizedContent = personalizeContent(template, appointment);
  const sendResult = await sendEmail(personalizedContent);
  return {
    success: sendResult.success,
    automationId: generateAutomationId(),
    nextActions: generateNextActions(appointment, sendResult)
  };
};
```

🎯 高度AI分析パターン
```typescript
interface CompetitorAnalysis {
  competitorId: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  pricingStrategy: PricingAnalysis;
  customerBase: CustomerBaseAnalysis;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  counterStrategies: CounterStrategy[];
}

const analyzeMarketTrends = async (): Promise<MarketTrendAnalysis> => {
  const industryData = await getIndustryData();
  const competitorData = await getCompetitorData();
  const customerData = await getCustomerBehaviorData();
  
  return {
    currentTrends: identifyCurrentTrends(industryData),
    futurePredictions: predictFutureTrends(industryData, competitorData),
    opportunities: identifyOpportunities(industryData, customerData),
    threats: identifyThreats(competitorData),
    recommendations: generateRecommendations()
  };
};
```

🎯 売上最適化パターン
```typescript
interface ROIOptimization {
  currentROI: number;
  targetROI: number;
  optimizationActions: OptimizationAction[];
  resourceReallocation: ResourceReallocation;
  expectedImprovement: number;
  implementationPlan: ImplementationPlan;
}

const optimizeROI = async (salesData: SalesData): Promise<ROIOptimization> => {
  const currentEfficiency = calculateCurrentEfficiency(salesData);
  const improvementOpportunities = identifyImprovementOpportunities(salesData);
  const optimalResourceAllocation = calculateOptimalAllocation(salesData);
  
  return {
    currentROI: currentEfficiency.roi,
    targetROI: calculateTargetROI(improvementOpportunities),
    optimizationActions: generateOptimizationActions(improvementOpportunities),
    resourceReallocation: optimalResourceAllocation,
    expectedImprovement: calculateExpectedImprovement(),
    implementationPlan: createImplementationPlan()
  };
};
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 絶対遵守事項
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ 破壊禁止
□ 既存Phase 1-5機能削除禁止
□ 既存API・データベース破壊禁止
□ AI営業支援システム変更禁止

✅ 品質必須基準
□ TypeScriptエラー: 0件維持必須
□ ESLintエラー: 0件維持必須
□ ビルド成功: 100%必須
□ 既存機能: 100%動作保証必須

🔧 必須開発フロー
npm run build    # 0エラー確認
npx tsc --noEmit # 0エラー確認
npm run lint     # 0エラー確認

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏗️ Phase 5完成済み活用可能機能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ AI営業支援システム（完全データソース）
→ Phase 6自動化の完璧な基盤データ

✅ 営業パフォーマンス分析システム
→ 最適化アルゴリズムのデータソース

✅ 顧客セグメント分析システム
→ ターゲティング自動化に活用可能

✅ 高度可視化システム
→ 自動化結果の可視化基盤

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 実装アプローチ（軽量・実用的）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 軽量自動化実装戦略
1. **ルールベース自動化**: 複雑なMLライブラリ不要
2. **テンプレートエンジン**: 柔軟なコンテンツ生成
3. **スケジューラ統合**: 既存システムとの連携
4. **段階的実装**: 手動→半自動→完全自動化

🎯 実用的自動化機能例
- メール自動送信 = テンプレート選択 + パーソナライゼーション + スケジューリング
- 提案書生成 = テンプレート + 顧客データ注入 + AI文章最適化
- ROI最適化 = 統計分析 + リソース配分アルゴリズム + 実装提案

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 自動化ダッシュボード設計指針
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 必須ダッシュボード要素
1. **自動化状況監視**: 実行中・完了・エラー状況
2. **AI分析結果表示**: 競合・市場・顧客分析結果
3. **最適化提案**: ROI・リソース配分改善案
4. **自動化設定**: ルール設定・スケジュール管理
5. **パフォーマンス監視**: 自動化効果測定

🔧 推奨ライブラリ
- **Email送信**: NodeMailer（軽量メール送信）
- **PDF生成**: Puppeteer（提案書・契約書生成）
- **スケジューリング**: Cron（自動化スケジュール）
- **データ処理**: 既存のPrismaService活用

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 実装成功基準
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ 営業自動化システム完全稼働
□ 高度AI分析システム実装
□ 売上最適化システム実装
□ 統合自動化ダッシュボード完成
□ 品質基準100%達成

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 必須参照ドキュメント
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. docs/core/UNIFIED_DEVELOPMENT_MASTER_PROMPT.md
2. docs/progress/PHASE_5_COMPLETION_REPORT.md
3. src/components/ai/SalesPredictionEngine.tsx（AI基盤参考）
4. src/app/api/analytics/sales-performance/route.ts（データ処理参考）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Phase 6で営業プロセスの完全自動化・AI最適化を実現してください！

================================================================================
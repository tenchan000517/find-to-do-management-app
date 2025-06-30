# 営業分析機能 マニュアル

## 概要

営業分析機能は、AI駆動の営業プロセス最適化システムです。成約確率予測、パイプライン分析、ROI予測、自動フォローアップ提案など、データサイエンスと機械学習を活用した包括的な営業支援を提供します。

### 主要特徴
- **AI成約確率予測エンジン**
- **リアルタイム営業パイプライン分析**
- **ROI予測・最適化システム**
- **自動フォローアップ提案**
- **営業活動パターン分析**

---

## 目次

1. [システムアーキテクチャ](#システムアーキテクチャ)
2. [成約確率予測エンジン](#成約確率予測エンジン)
3. [営業パイプライン分析](#営業パイプライン分析)
4. [ROI予測システム](#roi予測システム)
5. [フォローアップ自動化](#フォローアップ自動化)
6. [営業活動分析](#営業活動分析)
7. [パフォーマンス指標](#パフォーマンス指標)
8. [実装例](#実装例)
9. [AI最適化機能](#ai最適化機能)
10. [トラブルシューティング](#トラブルシューティング)

---

## システムアーキテクチャ

### 全体構成

```javascript
// 営業分析システムの構成
const SalesAnalyticsArchitecture = {
  // AI予測エンジン
  predictionEngines: {
    conversionPredictor: 'SalesConversionPredictor',
    anomalyDetection: 'AnomalyDetectionEngine',
    smartRecommendation: 'SmartRecommendationEngine'
  },
  
  // 営業支援サービス
  salesServices: {
    aiSalesAssistant: 'AISalesAssistant',
    stageAutomator: 'SalesStageAutomator',
    contractAutomation: 'ContractAutomationEngine'
  },
  
  // UI・ダッシュボード
  dashboardComponents: {
    salesAnalyticsPage: 'sales-analytics/page.tsx',
    predictionCard: 'SalesPredictionCard',
    pipelineChart: 'SalesPipelineChart',
    roiChart: 'ROIPredictionChart',
    followUpSuggestions: 'FollowUpSuggestions'
  }
};

// SalesAnalyticsPage のメイン構造
export default function SalesAnalyticsPage() {
  const {
    analyticsData,
    followUpSuggestions,
    loading,
    error,
    refreshData,
    recalculatePredictions,
    executeFollowUpAction
  } = useSalesAnalytics();

  return (
    <div className="min-h-screen bg-gray-50">
      <SalesAnalyticsHeader />
      <SalesSummaryCards data={analyticsData?.summary} />
      <SalesAnalyticsGrid 
        predictions={analyticsData?.predictions}
        suggestions={followUpSuggestions}
        roiProjections={analyticsData?.roiProjections}
      />
      <SalesPipelineChart data={analyticsData?.pipeline} />
      <HighProbabilityDeals predictions={analyticsData?.predictions} />
    </div>
  );
}
```

### データフロー

```javascript
// 営業データフロー管理
const SalesDataFlow = {
  // データ収集
  dataCollection: {
    opportunities: 'sales_opportunities テーブル',
    activities: 'sales_activities テーブル',
    customers: 'customers テーブル',
    interactions: 'customer_interactions'
  },
  
  // AI処理パイプライン
  aiProcessing: {
    conversionPrediction: 'SalesConversionPredictor.predictConversionProbability()',
    riskAnalysis: 'identifyRiskFactors()',
    successFactors: 'identifySuccessFactors()',
    optimization: 'optimizeConversionProbability()'
  },
  
  // 結果配信
  resultDelivery: {
    dashboard: 'リアルタイムダッシュボード更新',
    recommendations: 'フォローアップ提案生成',
    alerts: 'リスク・機会アラート',
    reports: '営業レポート自動生成'
  }
};
```

---

## 成約確率予測エンジン

### SalesConversionPredictor

```javascript
// 成約確率予測エンジンの核心クラス
export class SalesConversionPredictor {
  private anomalyEngine: AnomalyDetectionEngine;
  private recommendationEngine: SmartRecommendationEngine;
  private predictionModel: PredictionModel;

  constructor() {
    this.anomalyEngine = new AnomalyDetectionEngine({
      sensitivity: 0.8,
      windowSize: 30,
      threshold: 1.5
    });
    this.recommendationEngine = new SmartRecommendationEngine();
    this.initializePredictionModel();
  }

  // リアルタイム成約確率算出
  async predictConversionProbability(
    opportunity: SalesOpportunity,
    customerProfile?: CustomerProfile,
    activities?: SalesActivity[]
  ): Promise<ConversionPrediction> {
    
    // 1. 基本確率計算
    const baseProbability = this.calculateBaseProbability(opportunity);
    
    // 2. 活動パターン分析
    const activityAnalysis = await this.analyzeActivityPatterns(activities || opportunity.activities);
    
    // 3. 顧客エンゲージメント分析
    const engagementScore = await this.calculateEngagementScore(opportunity, customerProfile);
    
    // 4. 市場・競合要因分析
    const marketFactors = await this.analyzeMarketFactors(opportunity, customerProfile);
    
    // 5. 異常検知による調整
    const anomalyInsights = await this.getAnomalyInsights(opportunity);
    
    // 6. 最終確率算出（重み付き平均）
    const adjustedProbability = this.calculateAdjustedProbability(
      baseProbability,
      activityAnalysis.score,
      engagementScore,
      marketFactors.score,
      anomalyInsights.adjustment
    );

    // 7. 包括的分析結果の返却
    return {
      opportunityId: opportunity.id,
      currentProbability: adjustedProbability,
      probabilityTrend: this.calculateProbabilityTrend(opportunity),
      confidenceLevel: this.calculateConfidenceLevel(opportunity, activityAnalysis),
      expectedCloseDate: await this.predictCloseDate(opportunity, adjustedProbability),
      probabilityByStage: this.calculateStagesProbability(opportunity, adjustedProbability),
      riskFactors: await this.identifyRiskFactors(opportunity, customerProfile, activityAnalysis),
      successFactors: await this.identifySuccessFactors(opportunity, customerProfile, activityAnalysis),
      recommendedActions: await this.generateOptimizationActions(opportunity, riskFactors, successFactors),
      historicalComparison: await this.compareWithHistorical(opportunity),
      nextMilestones: await this.generateProbabilityMilestones(opportunity, adjustedProbability),
      lastUpdated: new Date().toISOString()
    };
  }
}
```

### 予測モデル設計

```javascript
// AI予測モデルの構成
const PredictionModelConfig = {
  // モデル特徴量
  features: [
    {
      name: 'deal_value',
      importance: 0.25,
      description: '案件金額',
      dataType: 'numeric'
    },
    {
      name: 'stage_progression_velocity',
      importance: 0.20,
      description: 'ステージ進行速度',
      dataType: 'numeric'
    },
    {
      name: 'customer_engagement_score',
      importance: 0.18,
      description: '顧客エンゲージメントスコア',
      dataType: 'numeric'
    },
    {
      name: 'competition_intensity',
      importance: 0.15,
      description: '競合状況',
      dataType: 'categorical'
    },
    {
      name: 'decision_maker_influence',
      importance: 0.12,
      description: '意思決定者の影響力',
      dataType: 'numeric'
    },
    {
      name: 'budget_alignment',
      importance: 0.10,
      description: '予算との適合性',
      dataType: 'boolean'
    }
  ],

  // 重み付き計算
  calculateAdjustedProbability: (base, activity, engagement, market, anomaly) => {
    const weights = {
      base: 0.4,
      activity: 0.25,
      engagement: 0.2,
      market: 0.1,
      anomaly: 0.05
    };

    const weighted = 
      base * weights.base +
      activity * weights.activity +
      engagement * weights.engagement +
      market * weights.market +
      Math.max(0, base + anomaly) * weights.anomaly;

    return Math.max(0.01, Math.min(0.99, weighted));
  }
};
```

### リスク・成功要因分析

```javascript
// リスク要因特定システム
const RiskFactorAnalysis = {
  // リスク要因の識別
  identifyRiskFactors: async (opportunity, customerProfile, activityAnalysis) => {
    const risks = [];

    // 活動不足リスク
    if (activityAnalysis && activityAnalysis.score < 0.5) {
      risks.push({
        factor: 'activity_insufficient',
        impact: -0.2,
        description: '営業活動が不足しています',
        severity: 'high',
        mitigation: '定期的なフォローアップと顧客接点の増加',
        isAddressable: true,
        timeToAddress: 7
      });
    }

    // 競合リスク
    if (customerProfile?.competitivePosition?.keyCompetitors?.length >= 3) {
      risks.push({
        factor: 'high_competition',
        impact: -0.15,
        description: '競合他社が多数存在',
        severity: 'medium',
        mitigation: '差別化要因の強化と価値提案の明確化',
        isAddressable: true,
        timeToAddress: 14
      });
    }

    // 予算リスク
    if (customerProfile?.budget.costSensitivity === 'high') {
      risks.push({
        factor: 'price_sensitivity',
        impact: -0.1,
        description: '価格感度が高い顧客',
        severity: 'medium',
        mitigation: 'ROI重視の提案とコスト最適化',
        isAddressable: true,
        timeToAddress: 10
      });
    }

    // 期限リスク
    const daysToClose = getDaysBetween(new Date(), opportunity.expectedCloseDate);
    if (daysToClose < 30 && opportunity.stage !== 'negotiation') {
      risks.push({
        factor: 'timeline_pressure',
        impact: -0.25,
        description: '期限が迫っているがステージが進んでいない',
        severity: 'critical',
        mitigation: 'プロセス加速と意思決定の促進',
        isAddressable: true,
        timeToAddress: 3
      });
    }

    return risks;
  },

  // 成功要因の特定
  identifySuccessFactors: async (opportunity, customerProfile, activityAnalysis) => {
    const factors = [];

    // 高優先度案件
    if (opportunity.priority === 'A') {
      factors.push({
        factor: 'high_priority',
        impact: 0.15,
        description: '高優先度案件として管理されています',
        strength: 'strong',
        enhancement: '継続的な重点管理',
        canAmplify: true,
        amplificationCost: 50000
      });
    }

    // 顧客エンゲージメント
    if (activityAnalysis && activityAnalysis.score > 0.7) {
      factors.push({
        factor: 'high_engagement',
        impact: 0.2,
        description: '顧客との良好な関係性',
        strength: 'very_strong',
        enhancement: '関係性の維持と深化',
        canAmplify: true,
        amplificationCost: 30000
      });
    }

    // 技術適合性
    if (customerProfile?.techMaturity === 'advanced') {
      factors.push({
        factor: 'tech_fit',
        impact: 0.12,
        description: '技術成熟度が高く導入リスクが低い',
        strength: 'strong',
        enhancement: '技術的価値の訴求強化',
        canAmplify: true,
        amplificationCost: 40000
      });
    }

    return factors;
  }
};
```

---

## 営業パイプライン分析

### パイプライン可視化

```javascript
// 営業パイプライン分析コンポーネント
const SalesPipelineChart = ({ pipelineData, isLoading }) => {
  const [viewMode, setViewMode] = useState('conversion');
  const [timeRange, setTimeRange] = useState('3months');

  if (isLoading || !pipelineData) {
    return <PipelineLoadingSkeleton />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          📊 営業パイプライン分析
        </h3>
        <div className="flex space-x-2">
          <PipelineViewSelector 
            value={viewMode} 
            onChange={setViewMode}
            options={['conversion', 'volume', 'velocity', 'value']}
          />
          <TimeRangeSelector 
            value={timeRange} 
            onChange={setTimeRange}
            options={['1month', '3months', '6months', '1year']}
          />
        </div>
      </div>

      {/* パイプライン概要 */}
      <PipelineOverview data={pipelineData.summary} />

      {/* ステージ別分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <StageConversionChart 
          data={pipelineData.stageConversion}
          viewMode={viewMode}
        />
        <SalesVelocityChart 
          data={pipelineData.velocity}
          timeRange={timeRange}
        />
      </div>

      {/* パフォーマンス指標 */}
      <PipelineMetrics data={pipelineData.metrics} />
    </div>
  );
};

// パイプライン概要表示
const PipelineOverview = ({ data }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <PipelineMetricCard
      title="総パイプライン価値"
      value={`¥${data.totalValue.toLocaleString()}`}
      change={data.valueChange}
      icon="💰"
      color="blue"
    />
    <PipelineMetricCard
      title="重み付きパイプライン"
      value={`¥${data.weightedValue.toLocaleString()}`}
      change={data.weightedChange}
      icon="⚖️"
      color="green"
    />
    <PipelineMetricCard
      title="平均成約確率"
      value={`${data.averageProbability}%`}
      change={data.probabilityChange}
      icon="🎯"
      color="purple"
    />
    <PipelineMetricCard
      title="予想成約数"
      value={data.expectedClosures}
      change={data.closureChange}
      icon="📈"
      color="orange"
    />
  </div>
);
```

### ステージ最適化分析

```javascript
// ステージ分析システム
const StageAnalysisSystem = {
  // ステージ別コンバージョン分析
  analyzeStageConversion: (opportunities) => {
    const stageData = opportunities.reduce((acc, opp) => {
      if (!acc[opp.stage]) {
        acc[opp.stage] = {
          total: 0,
          converted: 0,
          averageTime: 0,
          totalValue: 0,
          averageProbability: 0
        };
      }

      acc[opp.stage].total++;
      acc[opp.stage].totalValue += Number(opp.dealValue);
      
      if (opp.stage === 'closed_won') {
        acc[opp.stage].converted++;
      }

      return acc;
    }, {});

    // コンバージョン率の計算
    Object.keys(stageData).forEach(stage => {
      const data = stageData[stage];
      data.conversionRate = data.total > 0 ? data.converted / data.total : 0;
      data.averageValue = data.total > 0 ? data.totalValue / data.total : 0;
    });

    return stageData;
  },

  // ステージ進行速度分析
  analyzeSalesVelocity: (opportunities) => {
    const velocityData = {};
    const stages = ['prospect', 'qualified', 'proposal', 'negotiation', 'closed_won'];

    stages.forEach((stage, index) => {
      if (index === 0) return; // 最初のステージはスキップ

      const stageOpportunities = opportunities.filter(opp => 
        opp.stageHistory && opp.stageHistory.some(h => h.stage === stage)
      );

      const averageTime = stageOpportunities.reduce((total, opp) => {
        const currentStageEntry = opp.stageHistory.find(h => h.stage === stage);
        const previousStageEntry = opp.stageHistory.find(h => h.stage === stages[index - 1]);
        
        if (currentStageEntry && previousStageEntry) {
          const timeDiff = new Date(currentStageEntry.timestamp) - new Date(previousStageEntry.timestamp);
          return total + (timeDiff / (1000 * 60 * 60 * 24)); // 日数
        }
        return total;
      }, 0);

      velocityData[stage] = {
        averageDays: stageOpportunities.length > 0 ? averageTime / stageOpportunities.length : 0,
        opportunities: stageOpportunities.length,
        bottleneck: averageTime > 30 // 30日以上は要注意
      };
    });

    return velocityData;
  },

  // パイプライン価値計算
  calculatePipelineValue: async (opportunities) => {
    let totalValue = 0;
    let weightedValue = 0;

    for (const opp of opportunities) {
      if (!['closed_won', 'closed_lost'].includes(opp.stage)) {
        const dealValue = Number(opp.dealValue);
        totalValue += dealValue;

        // 成約確率による重み付き計算
        const prediction = await conversionPredictor.predictConversionProbability(opp);
        weightedValue += dealValue * prediction.currentProbability;
      }
    }

    return {
      totalValue,
      weightedValue,
      conversionMultiplier: totalValue > 0 ? weightedValue / totalValue : 0
    };
  }
};
```

---

## ROI予測システム

### ROI計算エンジン

```javascript
// ROI予測・計算システム
const ROIPredictionEngine = {
  // ROI予測計算
  calculateROIProjection: async (opportunity, investmentData) => {
    const prediction = await conversionPredictor.predictConversionProbability(opportunity);
    const dealValue = Number(opportunity.dealValue);
    
    // 投資コスト計算
    const totalInvestment = investmentData.salesEffort + 
                           investmentData.resourceAllocation + 
                           investmentData.marketingCost;

    // 基本ROI計算
    const expectedRevenue = dealValue * prediction.currentProbability;
    const baseROI = totalInvestment > 0 ? (expectedRevenue - totalInvestment) / totalInvestment : 0;

    // リスク調整ROI
    const riskAdjustment = this.calculateRiskAdjustment(prediction.riskFactors);
    const riskAdjustedROI = baseROI * (1 - riskAdjustment);

    // 時間価値調整
    const timeToClose = this.getDaysBetween(new Date(), opportunity.expectedCloseDate);
    const timeValueAdjustment = this.calculateTimeValueAdjustment(timeToClose);
    const adjustedROI = riskAdjustedROI * timeValueAdjustment;

    return {
      opportunityId: opportunity.id,
      projections: {
        baseROI,
        riskAdjustedROI,
        timeAdjustedROI: adjustedROI,
        expectedRevenue,
        totalInvestment,
        probability: prediction.currentProbability
      },
      riskFactors: prediction.riskFactors,
      optimization: await this.generateROIOptimization(opportunity, prediction, investmentData),
      sensitivity: this.calculateSensitivityAnalysis(opportunity, investmentData),
      timeline: this.projectRevenueTimeline(opportunity, prediction)
    };
  },

  // ROI最適化提案
  generateROIOptimization: async (opportunity, prediction, investmentData) => {
    const optimizations = [];

    // 投資効率の改善
    if (investmentData.salesEffort > 100000) {
      optimizations.push({
        type: 'cost_reduction',
        description: '営業工数の最適化',
        potentialSaving: investmentData.salesEffort * 0.2,
        impactOnProbability: -0.05,
        implementation: 'プロセス自動化とツール活用'
      });
    }

    // 成約確率の向上
    const highImpactActions = prediction.recommendedActions
      .filter(action => action.expectedImpact > 0.1)
      .slice(0, 3);

    for (const action of highImpactActions) {
      optimizations.push({
        type: 'probability_increase',
        description: action.description,
        additionalCost: action.cost,
        probabilityIncrease: action.expectedImpact,
        expectedROIImprovement: this.calculateROIImprovement(
          Number(opportunity.dealValue), 
          action.expectedImpact, 
          action.cost
        )
      });
    }

    return optimizations.sort((a, b) => 
      (b.expectedROIImprovement || 0) - (a.expectedROIImprovement || 0)
    );
  },

  // 感度分析
  calculateSensitivityAnalysis: (opportunity, investmentData) => {
    const dealValue = Number(opportunity.dealValue);
    const scenarios = {};

    // 楽観シナリオ（+20%確率、-10%コスト）
    scenarios.optimistic = {
      probabilityChange: 0.2,
      costChange: -0.1,
      roiImpact: this.calculateScenarioROI(dealValue, investmentData, 0.2, -0.1)
    };

    // 悲観シナリオ（-20%確率、+15%コスト）
    scenarios.pessimistic = {
      probabilityChange: -0.2,
      costChange: 0.15,
      roiImpact: this.calculateScenarioROI(dealValue, investmentData, -0.2, 0.15)
    };

    // 最悪シナリオ（失注）
    scenarios.worstCase = {
      probabilityChange: -1.0,
      costChange: 0,
      roiImpact: -1.0 // 全額損失
    };

    return scenarios;
  }
};

// ROI可視化コンポーネント
const ROIPredictionChart = ({ projections, isLoading }) => {
  const [selectedScenario, setSelectedScenario] = useState('base');

  if (isLoading || !projections) {
    return <ROIChartSkeleton />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">💰 ROI予測分析</h3>
        <ScenarioSelector 
          value={selectedScenario}
          onChange={setSelectedScenario}
          scenarios={['base', 'optimistic', 'pessimistic', 'worstCase']}
        />
      </div>

      {/* ROI指標表示 */}
      <ROIMetricsGrid projections={projections} scenario={selectedScenario} />

      {/* ROI推移チャート */}
      <div className="mt-6">
        <ROITimelineChart 
          data={projections.timeline}
          scenario={selectedScenario}
        />
      </div>

      {/* 最適化提案 */}
      <ROIOptimizationPanel 
        optimizations={projections.optimization}
        currentROI={projections.projections.timeAdjustedROI}
      />
    </div>
  );
};
```

---

## フォローアップ自動化

### AI提案システム

```javascript
// フォローアップ自動提案システム
const FollowUpSuggestionEngine = {
  // フォローアップ提案生成
  generateFollowUpSuggestions: async (opportunities, customerProfiles) => {
    const suggestions = [];

    for (const opportunity of opportunities) {
      const prediction = await conversionPredictor.predictConversionProbability(opportunity);
      const customerProfile = customerProfiles.find(p => p.customerId === opportunity.customerId);

      // 緊急フォローアップが必要な案件
      if (prediction.currentProbability > 0.6 && this.daysSinceLastActivity(opportunity) > 7) {
        suggestions.push({
          id: `urgent_${opportunity.id}`,
          type: 'urgent_follow_up',
          priority: 'critical',
          opportunityId: opportunity.id,
          title: '緊急フォローアップが必要',
          description: `${opportunity.title}の案件で1週間以上活動がありません`,
          suggestedActions: [
            '電話でのアポイントメント設定',
            '進捗確認メールの送信',
            '提案書の再送・説明'
          ],
          expectedImpact: 0.15,
          urgency: 'high',
          estimatedEffort: 2,
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        });
      }

      // 成約確率向上のための提案
      if (prediction.currentProbability > 0.4 && prediction.currentProbability < 0.8) {
        const improvements = this.generateImprovementSuggestions(prediction, customerProfile);
        suggestions.push(...improvements.map(improvement => ({
          id: `improve_${opportunity.id}_${improvement.type}`,
          type: 'probability_improvement',
          priority: 'high',
          opportunityId: opportunity.id,
          title: improvement.title,
          description: improvement.description,
          suggestedActions: improvement.actions,
          expectedImpact: improvement.impact,
          urgency: 'medium',
          estimatedEffort: improvement.effort,
          deadline: new Date(Date.now() + improvement.timeframe * 24 * 60 * 60 * 1000)
        })));
      }

      // リスク軽減提案
      const criticalRisks = prediction.riskFactors.filter(risk => risk.severity === 'critical');
      for (const risk of criticalRisks) {
        suggestions.push({
          id: `risk_${opportunity.id}_${risk.factor}`,
          type: 'risk_mitigation',
          priority: 'critical',
          opportunityId: opportunity.id,
          title: `リスク軽減: ${risk.factor}`,
          description: risk.description,
          suggestedActions: [risk.mitigation],
          expectedImpact: -risk.impact,
          urgency: 'high',
          estimatedEffort: Math.ceil(risk.timeToAddress / 3),
          deadline: new Date(Date.now() + risk.timeToAddress * 24 * 60 * 60 * 1000)
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  },

  // フォローアップ実行
  executeFollowUpAction: async (suggestionId, actionType) => {
    const suggestion = await this.findSuggestionById(suggestionId);
    let result;

    switch (actionType) {
      case 'send_email':
        result = await this.sendFollowUpEmail(suggestion);
        break;
      case 'schedule_call':
        result = await this.scheduleFollowUpCall(suggestion);
        break;
      case 'create_task':
        result = await this.createFollowUpTask(suggestion);
        break;
      case 'update_opportunity':
        result = await this.updateOpportunityStage(suggestion);
        break;
      default:
        throw new Error(`Unsupported action type: ${actionType}`);
    }

    // 実行結果をトラッキング
    await this.trackFollowUpExecution(suggestionId, actionType, result);

    return result;
  }
};

// フォローアップ提案表示コンポーネント
const FollowUpSuggestions = ({ suggestions, onExecute, isLoading }) => {
  const [filter, setFilter] = useState('all');
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (filter === 'all') return true;
    return suggestion.priority === filter;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🎯 フォローアップ提案
        </h3>
        <SuggestionFilter value={filter} onChange={setFilter} />
      </div>

      {isLoading ? (
        <SuggestionsLoadingSkeleton />
      ) : (
        <div className="space-y-3">
          {filteredSuggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onExecute={onExecute}
              isSelected={selectedSuggestions.includes(suggestion.id)}
              onSelect={(selected) => {
                if (selected) {
                  setSelectedSuggestions([...selectedSuggestions, suggestion.id]);
                } else {
                  setSelectedSuggestions(selectedSuggestions.filter(id => id !== suggestion.id));
                }
              }}
            />
          ))}
        </div>
      )}

      {/* バッチ実行ボタン */}
      {selectedSuggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <BatchExecuteButton
            selectedIds={selectedSuggestions}
            onBatchExecute={(actionType) => {
              selectedSuggestions.forEach(id => onExecute(id, actionType));
              setSelectedSuggestions([]);
            }}
          />
        </div>
      )}
    </div>
  );
};
```

---

## 営業活動分析

### 活動パターン分析

```javascript
// 営業活動パターン分析システム
const SalesActivityAnalyzer = {
  // 活動パターンの分析
  analyzeActivityPatterns: async (activities) => {
    if (activities.length === 0) {
      return { 
        score: 0.1, 
        insights: ['活動履歴が不足しています'],
        patterns: {},
        recommendations: []
      };
    }

    // 活動頻度分析
    const frequencyAnalysis = this.analyzeActivityFrequency(activities);
    
    // 活動の質分析
    const qualityAnalysis = this.analyzeActivityQuality(activities);
    
    // 進展性分析
    const progressAnalysis = this.analyzeActivityProgress(activities);
    
    // 時間パターン分析
    const timingAnalysis = this.analyzeActivityTiming(activities);

    // 総合スコア計算
    const overallScore = (
      frequencyAnalysis.score + 
      qualityAnalysis.score + 
      progressAnalysis.score + 
      timingAnalysis.score
    ) / 4;

    return {
      score: overallScore,
      insights: this.generateActivityInsights(frequencyAnalysis, qualityAnalysis, progressAnalysis, timingAnalysis),
      patterns: {
        frequency: frequencyAnalysis,
        quality: qualityAnalysis,
        progress: progressAnalysis,
        timing: timingAnalysis
      },
      recommendations: this.generateActivityRecommendations(overallScore, activities)
    };
  },

  // 活動頻度分析
  analyzeActivityFrequency: (activities) => {
    const now = new Date();
    const periods = {
      last7Days: activities.filter(a => this.getDaysBetween(a.createdAt, now) <= 7),
      last30Days: activities.filter(a => this.getDaysBetween(a.createdAt, now) <= 30),
      last90Days: activities.filter(a => this.getDaysBetween(a.createdAt, now) <= 90)
    };

    // 理想的な頻度と比較
    const idealFrequency = {
      last7Days: 2,   // 週2回
      last30Days: 8,  // 月8回
      last90Days: 24  // 四半期24回
    };

    const frequencyScores = Object.keys(periods).map(period => {
      const actual = periods[period].length;
      const ideal = idealFrequency[period];
      return Math.min(actual / ideal, 1);
    });

    const averageScore = frequencyScores.reduce((sum, score) => sum + score, 0) / frequencyScores.length;

    return {
      score: averageScore,
      periods,
      analysis: {
        isConsistent: this.checkActivityConsistency(activities),
        hasGaps: this.detectActivityGaps(activities),
        trend: this.calculateActivityTrend(activities)
      }
    };
  },

  // 活動の質分析
  analyzeActivityQuality: (activities) => {
    const qualityWeights = {
      initial_contact: 1,
      meeting: 4,
      proposal_sent: 5,
      follow_up: 2,
      negotiation: 6,
      contract_review: 7,
      demo: 4,
      technical_discussion: 5
    };

    const totalQualityPoints = activities.reduce((sum, activity) => {
      return sum + (qualityWeights[activity.type] || 1);
    }, 0);

    const maxPossiblePoints = activities.length * 6; // 最高品質活動を基準
    const qualityScore = maxPossiblePoints > 0 ? totalQualityPoints / maxPossiblePoints : 0;

    return {
      score: qualityScore,
      highValueActivities: activities.filter(a => (qualityWeights[a.type] || 1) >= 4),
      distribution: this.getActivityTypeDistribution(activities),
      recommendations: this.getQualityImprovementRecommendations(activities, qualityWeights)
    };
  },

  // 進展性分析
  analyzeActivityProgress: (activities) => {
    const sortedActivities = activities.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    if (sortedActivities.length < 2) {
      return { score: 0.3, progression: [], insights: ['活動数が不足'] };
    }

    const progressionStages = [
      'initial_contact', 'meeting', 'proposal_sent', 
      'negotiation', 'contract_review', 'contract_signed'
    ];

    let progressScore = 0;
    let currentStageIndex = 0;

    for (const activity of sortedActivities) {
      const activityStageIndex = progressionStages.indexOf(activity.type);
      if (activityStageIndex >= currentStageIndex) {
        progressScore += 0.2;
        currentStageIndex = activityStageIndex;
      }
    }

    return {
      score: Math.min(progressScore, 1),
      progression: this.mapActivityProgression(sortedActivities, progressionStages),
      currentStage: progressionStages[currentStageIndex],
      nextRecommendedStage: progressionStages[currentStageIndex + 1] || 'maintain'
    };
  },

  // 営業活動推奨事項生成
  generateActivityRecommendations: (overallScore, activities) => {
    const recommendations = [];

    if (overallScore < 0.4) {
      recommendations.push({
        type: 'increase_frequency',
        priority: 'high',
        action: '活動頻度を週2-3回に増加',
        rationale: '顧客エンゲージメントの維持',
        expectedImpact: 0.2
      });
    }

    if (overallScore < 0.6) {
      recommendations.push({
        type: 'improve_quality',
        priority: 'medium',
        action: 'より高価値な活動（会議、提案）の実施',
        rationale: '活動の質的向上',
        expectedImpact: 0.15
      });
    }

    const lastActivity = activities.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    if (lastActivity && this.getDaysBetween(lastActivity.createdAt, new Date()) > 7) {
      recommendations.push({
        type: 'immediate_follow_up',
        priority: 'critical',
        action: '即座にフォローアップを実行',
        rationale: '長期間の空白を回避',
        expectedImpact: 0.25
      });
    }

    return recommendations;
  }
};
```

---

## パフォーマンス指標

### 営業KPI管理

```javascript
// 営業パフォーマンス指標システム
const SalesPerformanceMetrics = {
  // 包括的メトリクス計算
  calculateComprehensiveMetrics: async (opportunities, timeframe = '3months') => {
    const filteredOpportunities = this.filterByTimeframe(opportunities, timeframe);
    
    return {
      conversionMetrics: await this.calculateConversionMetrics(filteredOpportunities),
      pipelineMetrics: await this.calculatePipelineMetrics(filteredOpportunities),
      efficiencyMetrics: await this.calculateEfficiencyMetrics(filteredOpportunities),
      predictiveMetrics: await this.calculatePredictiveMetrics(filteredOpportunities),
      teamMetrics: await this.calculateTeamMetrics(filteredOpportunities),
      trendAnalysis: await this.calculateTrendAnalysis(filteredOpportunities)
    };
  },

  // コンバージョン指標
  calculateConversionMetrics: async (opportunities) => {
    const closedOpportunities = opportunities.filter(opp => 
      ['closed_won', 'closed_lost'].includes(opp.stage)
    );
    const wonOpportunities = opportunities.filter(opp => opp.stage === 'closed_won');

    const conversionRate = closedOpportunities.length > 0 
      ? wonOpportunities.length / closedOpportunities.length 
      : 0;

    // ステージ別コンバージョン率
    const stageConversion = await this.calculateStageConversionRates(opportunities);
    
    // ソース別コンバージョン率
    const sourceConversion = await this.calculateSourceConversionRates(opportunities);

    return {
      overallConversionRate: conversionRate,
      totalOpportunities: opportunities.length,
      wonDeals: wonOpportunities.length,
      lostDeals: closedOpportunities.length - wonOpportunities.length,
      stageConversion,
      sourceConversion,
      averageDealSize: wonOpportunities.length > 0 
        ? wonOpportunities.reduce((sum, opp) => sum + Number(opp.dealValue), 0) / wonOpportunities.length 
        : 0,
      totalRevenue: wonOpportunities.reduce((sum, opp) => sum + Number(opp.dealValue), 0)
    };
  },

  // パイプライン指標
  calculatePipelineMetrics: async (opportunities) => {
    const activeOpportunities = opportunities.filter(opp => 
      !['closed_won', 'closed_lost'].includes(opp.stage)
    );

    const pipelineValue = activeOpportunities.reduce((sum, opp) => 
      sum + Number(opp.dealValue), 0
    );

    // AI予測による重み付きパイプライン価値
    let weightedValue = 0;
    for (const opp of activeOpportunities) {
      const prediction = await conversionPredictor.predictConversionProbability(opp);
      weightedValue += Number(opp.dealValue) * prediction.currentProbability;
    }

    return {
      totalPipelineValue: pipelineValue,
      weightedPipelineValue: weightedValue,
      averageProbability: activeOpportunities.length > 0 ? weightedValue / pipelineValue : 0,
      activeDeals: activeOpportunities.length,
      stageDistribution: this.calculateStageDistribution(activeOpportunities),
      velocityMetrics: await this.calculateSalesVelocity(opportunities)
    };
  },

  // 効率性指標
  calculateEfficiencyMetrics: async (opportunities) => {
    const avgTimeToClose = this.calculateAverageTimeToClose(
      opportunities.filter(opp => opp.stage === 'closed_won')
    );

    const activityEfficiency = await this.calculateActivityEfficiency(opportunities);
    const resourceUtilization = await this.calculateResourceUtilization(opportunities);

    return {
      averageTimeToClose: avgTimeToClose,
      salesCycleEfficiency: this.calculateSalesCycleEfficiency(opportunities),
      activityEfficiency,
      resourceUtilization,
      costPerAcquisition: this.calculateCostPerAcquisition(opportunities),
      revenuePerSalesperson: this.calculateRevenuePerSalesperson(opportunities)
    };
  },

  // 予測指標
  calculatePredictiveMetrics: async (opportunities) => {
    const activeOpportunities = opportunities.filter(opp => 
      !['closed_won', 'closed_lost'].includes(opp.stage)
    );

    const predictions = await Promise.all(
      activeOpportunities.map(opp => 
        conversionPredictor.predictConversionProbability(opp)
      )
    );

    const highProbabilityDeals = predictions.filter(p => p.currentProbability >= 0.8);
    const mediumProbabilityDeals = predictions.filter(p => 
      p.currentProbability >= 0.5 && p.currentProbability < 0.8
    );
    const lowProbabilityDeals = predictions.filter(p => p.currentProbability < 0.5);

    return {
      predictedClosures: {
        thisMonth: this.calculatePredictedClosures(predictions, 30),
        thisQuarter: this.calculatePredictedClosures(predictions, 90),
        nextQuarter: this.calculatePredictedClosures(predictions, 180)
      },
      probabilityDistribution: {
        high: highProbabilityDeals.length,
        medium: mediumProbabilityDeals.length,
        low: lowProbabilityDeals.length
      },
      riskFactors: this.aggregateRiskFactors(predictions),
      opportunities: this.aggregateOpportunityFactors(predictions)
    };
  }
};

// パフォーマンスダッシュボード表示
const SalesPerformanceDashboard = ({ metrics, timeframe, onTimeframeChange }) => (
  <div className="space-y-6">
    {/* 概要指標 */}
    <MetricsOverview metrics={metrics.conversionMetrics} />

    {/* チャートグリッド */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ConversionTrendChart data={metrics.trendAnalysis} />
      <PipelineVelocityChart data={metrics.pipelineMetrics.velocityMetrics} />
    </div>

    {/* 詳細メトリクス */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <EfficiencyMetricsCard metrics={metrics.efficiencyMetrics} />
      <PredictiveMetricsCard metrics={metrics.predictiveMetrics} />
      <TeamMetricsCard metrics={metrics.teamMetrics} />
    </div>
  </div>
);
```

---

## 実装例

### 完全な営業分析システム

```javascript
// 完全な営業分析システムの実装例
class CompleteSalesAnalyticsSystem {
  constructor() {
    this.conversionPredictor = new SalesConversionPredictor();
    this.followUpEngine = new FollowUpSuggestionEngine();
    this.activityAnalyzer = new SalesActivityAnalyzer();
    this.performanceMetrics = new SalesPerformanceMetrics();
    this.roiEngine = new ROIPredictionEngine();
  }

  // 包括的営業分析の実行
  async performComprehensiveAnalysis(salesData) {
    const { opportunities, activities, customers } = salesData;

    // 並列処理で効率化
    const [
      conversionPredictions,
      followUpSuggestions,
      activityAnalysis,
      performanceMetrics,
      roiProjections
    ] = await Promise.all([
      this.generateConversionPredictions(opportunities),
      this.followUpEngine.generateFollowUpSuggestions(opportunities, customers),
      this.analyzeAllActivities(activities),
      this.performanceMetrics.calculateComprehensiveMetrics(opportunities),
      this.generateROIProjections(opportunities)
    ]);

    return {
      summary: this.generateSummary(conversionPredictions, performanceMetrics),
      predictions: conversionPredictions,
      followUpSuggestions,
      activityAnalysis,
      performanceMetrics,
      roiProjections,
      pipeline: this.generatePipelineAnalysis(opportunities, conversionPredictions),
      insights: this.generateActionableInsights(conversionPredictions, performanceMetrics),
      lastUpdated: new Date().toISOString()
    };
  }

  // サマリー生成
  generateSummary(predictions, metrics) {
    const highProbability = predictions.filter(p => p.currentProbability >= 0.8).length;
    const mediumProbability = predictions.filter(p => 
      p.currentProbability >= 0.6 && p.currentProbability < 0.8
    ).length;

    return {
      totalAppointments: predictions.length,
      highProbability,
      mediumProbability,
      averageProbability: Math.round(
        predictions.reduce((sum, p) => sum + p.currentProbability, 0) / predictions.length * 100
      ),
      conversionRate: Math.round(metrics.conversionMetrics.overallConversionRate * 100),
      pipelineValue: metrics.pipelineMetrics.totalPipelineValue,
      weightedPipelineValue: metrics.pipelineMetrics.weightedPipelineValue
    };
  }

  // アクションアブルインサイト生成
  generateActionableInsights(predictions, metrics) {
    const insights = [];

    // 高確率案件のアラート
    const urgentHighProbability = predictions.filter(p => 
      p.currentProbability >= 0.8 && 
      this.getDaysSinceLastActivity(p) > 5
    );

    if (urgentHighProbability.length > 0) {
      insights.push({
        type: 'urgent_action',
        priority: 'critical',
        title: '高確率案件の緊急フォローアップ',
        description: `${urgentHighProbability.length}件の高確率案件でフォローアップが必要`,
        action: '即座に連絡を取り、次のステップを確認',
        impact: 'high'
      });
    }

    // パイプライン健康度の警告
    if (metrics.pipelineMetrics.averageProbability < 0.4) {
      insights.push({
        type: 'pipeline_health',
        priority: 'high',
        title: 'パイプライン品質の改善が必要',
        description: '平均成約確率が40%を下回っています',
        action: '質の高いリードの獲得と既存案件の最適化',
        impact: 'medium'
      });
    }

    // 営業効率の最適化提案
    if (metrics.efficiencyMetrics.salesCycleEfficiency < 0.6) {
      insights.push({
        type: 'efficiency_improvement',
        priority: 'medium',
        title: '営業サイクルの最適化',
        description: '営業サイクルが平均より長くなっています',
        action: 'プロセスの見直しと自動化の導入',
        impact: 'medium'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}

// React Hook for Sales Analytics
const useSalesAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [followUpSuggestions, setFollowUpSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const salesAnalyticsSystem = useMemo(() => new CompleteSalesAnalyticsSystem(), []);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 営業データの取得
      const salesData = await fetchSalesData();
      
      // 包括的分析の実行
      const analysis = await salesAnalyticsSystem.performComprehensiveAnalysis(salesData);
      
      setAnalyticsData(analysis);
      setFollowUpSuggestions(analysis.followUpSuggestions);
      setLastRefresh(new Date());

    } catch (err) {
      setError(err.message);
      console.error('Sales analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [salesAnalyticsSystem]);

  const recalculatePredictions = useCallback(async () => {
    if (!analyticsData) return;

    try {
      const salesData = await fetchSalesData();
      const newPredictions = await salesAnalyticsSystem.generateConversionPredictions(
        salesData.opportunities
      );
      
      setAnalyticsData(prev => ({
        ...prev,
        predictions: newPredictions,
        summary: salesAnalyticsSystem.generateSummary(newPredictions, prev.performanceMetrics)
      }));

    } catch (err) {
      console.error('Prediction recalculation error:', err);
    }
  }, [analyticsData, salesAnalyticsSystem]);

  const executeFollowUpAction = useCallback(async (suggestionId, actionType) => {
    try {
      const result = await salesAnalyticsSystem.followUpEngine.executeFollowUpAction(
        suggestionId, 
        actionType
      );
      
      // 提案リストを更新
      setFollowUpSuggestions(prev => 
        prev.filter(suggestion => suggestion.id !== suggestionId)
      );

      return result;
    } catch (err) {
      console.error('Follow-up execution error:', err);
      throw err;
    }
  }, [salesAnalyticsSystem]);

  // 初期データ読み込み
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    analyticsData,
    followUpSuggestions,
    loading,
    error,
    lastRefresh,
    refreshData,
    recalculatePredictions,
    executeFollowUpAction
  };
};
```

---

## AI最適化機能

### 成約確率最適化

```javascript
// AI最適化システム
const SalesOptimizationAI = {
  // 包括的最適化分析
  optimizeSalesProcess: async (opportunities, constraints = {}) => {
    const optimizations = [];

    for (const opportunity of opportunities) {
      const currentPrediction = await conversionPredictor.predictConversionProbability(opportunity);
      
      if (currentPrediction.currentProbability < (constraints.targetProbability || 0.8)) {
        const optimization = await this.optimizeSingleOpportunity(opportunity, constraints);
        optimizations.push(optimization);
      }
    }

    return {
      totalOptimizations: optimizations.length,
      potentialRevenue: this.calculatePotentialRevenue(optimizations),
      implementationCost: this.calculateTotalImplementationCost(optimizations),
      expectedROI: this.calculateOptimizationROI(optimizations),
      recommendations: this.prioritizeOptimizations(optimizations),
      timeline: this.generateOptimizationTimeline(optimizations)
    };
  },

  // 個別案件最適化
  optimizeSingleOpportunity: async (opportunity, constraints) => {
    const conversionOptimization = await conversionPredictor.optimizeConversionProbability(
      opportunity,
      undefined,
      constraints.targetProbability || 0.8
    );

    const roiOptimization = await roiEngine.calculateROIProjection(
      opportunity,
      constraints.investmentData || this.getDefaultInvestmentData()
    );

    return {
      opportunityId: opportunity.id,
      currentState: {
        probability: conversionOptimization.currentScore,
        expectedRevenue: Number(opportunity.dealValue) * conversionOptimization.currentScore,
        currentROI: roiOptimization.projections.baseROI
      },
      optimizedState: {
        probability: conversionOptimization.optimizedScore,
        expectedRevenue: Number(opportunity.dealValue) * conversionOptimization.optimizedScore,
        projectedROI: roiOptimization.projections.timeAdjustedROI
      },
      improvement: {
        probabilityIncrease: conversionOptimization.improvementPotential,
        revenueIncrease: Number(opportunity.dealValue) * conversionOptimization.improvementPotential,
        roiImprovement: roiOptimization.projections.timeAdjustedROI - roiOptimization.projections.baseROI
      },
      optimizationPlan: conversionOptimization.optimizationPlan,
      implementationCost: conversionOptimization.implementationCost,
      timeframe: conversionOptimization.timeframe,
      priority: this.calculateOptimizationPriority(conversionOptimization, roiOptimization)
    };
  },

  // 最適化優先度計算
  calculateOptimizationPriority: (conversionOpt, roiOpt) => {
    const factors = {
      impactScore: conversionOpt.improvementPotential * 100,
      roiScore: roiOpt.projections.timeAdjustedROI * 100,
      urgencyScore: this.calculateUrgencyScore(conversionOpt),
      feasibilityScore: this.calculateFeasibilityScore(conversionOpt.optimizationPlan)
    };

    const weightedScore = 
      factors.impactScore * 0.3 +
      factors.roiScore * 0.25 +
      factors.urgencyScore * 0.25 +
      factors.feasibilityScore * 0.2;

    if (weightedScore >= 80) return 'critical';
    if (weightedScore >= 60) return 'high';
    if (weightedScore >= 40) return 'medium';
    return 'low';
  }
};
```

---

## トラブルシューティング

### よくある問題と解決策

#### 1. 予測精度の問題

```javascript
// 予測精度改善システム
const PredictionAccuracyImprover = {
  // 精度診断
  diagnosePredictionAccuracy: async (historicalData) => {
    const predictions = historicalData.predictions;
    const actualOutcomes = historicalData.actualOutcomes;

    const accuracyMetrics = {
      overallAccuracy: this.calculateOverallAccuracy(predictions, actualOutcomes),
      precisionRecall: this.calculatePrecisionRecall(predictions, actualOutcomes),
      calibration: this.calculateCalibration(predictions, actualOutcomes),
      featureImportance: this.analyzeFeatureImportance(historicalData)
    };

    return {
      currentAccuracy: accuracyMetrics.overallAccuracy,
      issues: this.identifyAccuracyIssues(accuracyMetrics),
      recommendations: this.generateAccuracyImprovements(accuracyMetrics),
      modelRetraining: this.assessRetrainingNeed(accuracyMetrics)
    };
  },

  // モデル再訓練
  retrainPredictionModel: async (trainingData) => {
    const newModel = await this.trainImprovedModel(trainingData);
    const validationResults = await this.validateModel(newModel, trainingData.testSet);
    
    if (validationResults.accuracy > 0.8) {
      await this.deployModel(newModel);
      return {
        success: true,
        newAccuracy: validationResults.accuracy,
        improvements: validationResults.improvements
      };
    } else {
      return {
        success: false,
        issues: validationResults.issues,
        recommendations: 'データ品質の改善が必要'
      };
    }
  }
};
```

#### 2. パフォーマンス問題

```javascript
// パフォーマンス最適化
const PerformanceOptimizer = {
  // 分析パフォーマンス監視
  monitorAnalysisPerformance: () => {
    const metrics = {
      predictionTime: 0,
      dataLoadTime: 0,
      renderTime: 0,
      memoryUsage: 0
    };

    const startTime = performance.now();
    
    return {
      startTimer: (operation) => {
        metrics[`${operation}StartTime`] = performance.now();
      },
      
      endTimer: (operation) => {
        const endTime = performance.now();
        const startTime = metrics[`${operation}StartTime`];
        metrics[`${operation}Time`] = endTime - startTime;
      },

      getMetrics: () => ({
        ...metrics,
        totalTime: performance.now() - startTime,
        memoryUsage: performance.memory ? 
          Math.round(performance.memory.usedJSHeapSize / 1048576) : null
      })
    };
  },

  // バッチ処理最適化
  optimizeBatchProcessing: async (opportunities, batchSize = 10) => {
    const results = [];
    
    for (let i = 0; i < opportunities.length; i += batchSize) {
      const batch = opportunities.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(opp => conversionPredictor.predictConversionProbability(opp))
      );
      results.push(...batchResults);
      
      // CPUに負荷をかけすぎないよう小休止
      if (i + batchSize < opportunities.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
};
```

#### 3. データ品質問題

```javascript
// データ品質管理
const DataQualityManager = {
  // データ品質チェック
  validateSalesData: (salesData) => {
    const issues = [];
    const { opportunities, activities, customers } = salesData;

    // 必須フィールドのチェック
    opportunities.forEach(opp => {
      if (!opp.dealValue || isNaN(Number(opp.dealValue))) {
        issues.push({
          type: 'missing_deal_value',
          opportunityId: opp.id,
          severity: 'high'
        });
      }
      
      if (!opp.expectedCloseDate) {
        issues.push({
          type: 'missing_close_date',
          opportunityId: opp.id,
          severity: 'medium'
        });
      }
    });

    // データ整合性チェック
    const orphanedActivities = activities.filter(activity => 
      !opportunities.some(opp => opp.id === activity.opportunityId)
    );

    if (orphanedActivities.length > 0) {
      issues.push({
        type: 'orphaned_activities',
        count: orphanedActivities.length,
        severity: 'medium'
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations: this.generateDataQualityRecommendations(issues),
      fixableIssues: issues.filter(issue => this.isAutoFixable(issue))
    };
  },

  // 自動データ修正
  autoFixDataIssues: async (salesData, issues) => {
    const fixedData = { ...salesData };
    
    for (const issue of issues.filter(i => this.isAutoFixable(i))) {
      switch (issue.type) {
        case 'missing_close_date':
          const opportunity = fixedData.opportunities.find(opp => opp.id === issue.opportunityId);
          if (opportunity) {
            // 30日後をデフォルトに設定
            opportunity.expectedCloseDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          }
          break;
          
        case 'invalid_stage':
          // ステージ名の正規化
          // 実装詳細は省略
          break;
      }
    }
    
    return fixedData;
  }
};
```

---

このマニュアルは、営業分析機能の包括的な実装・運用ガイドです。AI駆動の成約確率予測から高度な営業最適化まで、全ての重要な機能を効率的に管理・活用するためのベストプラクティスを提供します。
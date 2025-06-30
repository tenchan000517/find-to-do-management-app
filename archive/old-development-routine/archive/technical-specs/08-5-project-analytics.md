# プロジェクト分析機能 マニュアル

## 概要

プロジェクト分析機能は、AI駆動のプロジェクト成功予測・リスク管理システムです。プロジェクト成功率予測、リスク評価、KGI追跡、リソース最適化、進捗パターン分析など、データサイエンスと機械学習を活用した包括的なプロジェクト管理支援を提供します。

### 主要特徴
- **AI プロジェクト成功率予測エンジン**
- **リアルタイムリスク評価・アラートシステム**
- **KGI（重要目標達成指標）自動追跡**
- **リソース配分最適化提案**
- **プロジェクト健全性スコア算出**

---

## 目次

1. [システムアーキテクチャ](#システムアーキテクチャ)
2. [成功率予測エンジン](#成功率予測エンジン)
3. [リスク評価システム](#リスク評価システム)
4. [KGI追跡機能](#kgi追跡機能)
5. [リソース最適化](#リソース最適化)
6. [進捗パターン分析](#進捗パターン分析)
7. [プロジェクト健全性評価](#プロジェクト健全性評価)
8. [実装例](#実装例)
9. [AI最適化機能](#ai最適化機能)
10. [トラブルシューティング](#トラブルシューティング)

---

## システムアーキテクチャ

### 全体構成

```javascript
// プロジェクト分析システムの構成
const ProjectAnalyticsArchitecture = {
  // AI予測エンジン
  predictionEngines: {
    successPredictor: 'ProjectSuccessPredictor',
    riskAnalyzer: 'ProjectRiskAnalyzer',
    resourceOptimizer: 'ResourceOptimizationEngine'
  },
  
  // 分析サービス
  analyticsServices: {
    kgiTracker: 'KGITrackingService',
    progressAnalyzer: 'ProgressPatternAnalyzer',
    healthScoreCalculator: 'ProjectHealthCalculator'
  },
  
  // UI・ダッシュボード
  dashboardComponents: {
    projectAnalyticsPage: 'projects/[id]/analytics/page.tsx',
    successPredictionCard: 'ProjectSuccessPredictionCard',
    riskAssessmentPanel: 'RiskAssessmentPanel',
    kgiDashboard: 'KGIDashboard',
    resourceChart: 'ResourceAllocationChart',
    healthScoreIndicator: 'ProjectHealthIndicator'
  }
};

// ProjectAnalyticsPage のメイン構造
export default function ProjectAnalyticsPage({ params }: { params: { id: string } }) {
  const {
    projectData,
    analyticsData,
    predictions,
    risks,
    kgiMetrics,
    loading,
    error,
    refreshAnalytics,
    recalculatePredictions,
    updateKGI
  } = useProjectAnalytics(params.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectAnalyticsHeader projectId={params.id} />
      <ProjectSummaryCards 
        project={projectData}
        analytics={analyticsData}
      />
      <ProjectAnalyticsGrid 
        predictions={predictions}
        risks={risks}
        kgiMetrics={kgiMetrics}
        projectId={params.id}
      />
      <ProjectHealthDashboard 
        healthScore={analyticsData?.healthScore}
        trends={analyticsData?.trends}
      />
      <RiskManagementPanel risks={risks} />
    </div>
  );
}
```

### データフロー

```javascript
// プロジェクト分析データフロー管理
const ProjectDataFlow = {
  // データ収集
  dataCollection: {
    projects: 'projects テーブル',
    tasks: 'tasks テーブル',
    milestones: 'project_milestones テーブル',
    resources: 'project_resources',
    kgiMetrics: 'project_kgi_metrics',
    riskEvents: 'project_risk_events'
  },
  
  // 分析処理
  analysisProcessing: {
    successPrediction: 'calculateSuccessProbability()',
    riskAssessment: 'evaluateProjectRisks()',
    kgiTracking: 'trackKGIProgress()',
    resourceAnalysis: 'analyzeResourceEfficiency()',
    healthScoring: 'calculateHealthScore()'
  },
  
  // 結果配信
  resultDelivery: {
    dashboardUpdates: 'リアルタイムダッシュボード更新',
    alerts: 'リスクアラート・通知',
    reports: '定期レポート生成',
    recommendations: 'AI改善提案'
  }
};
```

---

## 成功率予測エンジン

### AI予測アルゴリズム

```javascript
// プロジェクト成功率予測エンジン
class ProjectSuccessPredictor {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
    this.predictionFactors = [
      'scope_clarity',        // 要件明確度
      'team_experience',      // チーム経験値
      'resource_adequacy',    // リソース充足度
      'stakeholder_engagement', // ステークホルダー関与度
      'technical_complexity', // 技術複雑度
      'timeline_realism',     // スケジュール現実性
      'risk_mitigation',      // リスク対策度
      'communication_quality' // コミュニケーション品質
    ];
  }

  async predictSuccessRate(projectId) {
    try {
      // プロジェクトデータ取得
      const projectData = await this.getProjectAnalyticsData(projectId);
      
      // 予測計算
      const prediction = await this.calculateSuccessProbability(projectData);
      
      // 要因分析
      const factorAnalysis = await this.analyzeSuccessFactors(projectData);
      
      return {
        successRate: prediction.probability,
        confidence: prediction.confidence,
        factors: factorAnalysis,
        recommendations: prediction.recommendations,
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('成功率予測エラー:', error);
      throw new Error('プロジェクト成功率の予測に失敗しました');
    }
  }

  async calculateSuccessProbability(projectData) {
    const prompt = `
    以下のプロジェクトデータを分析し、成功確率を予測してください：

    プロジェクト情報:
    - 名前: ${projectData.name}
    - 期間: ${projectData.duration}日
    - 予算: ${projectData.budget}円
    - チームサイズ: ${projectData.teamSize}人
    - 進捗率: ${projectData.progress}%

    タスク分析:
    - 総タスク数: ${projectData.totalTasks}
    - 完了タスク: ${projectData.completedTasks}
    - 遅延タスク: ${projectData.delayedTasks}
    - 高優先度タスク: ${projectData.highPriorityTasks}

    リソース状況:
    - 人的リソース使用率: ${projectData.resourceUtilization}%
    - 予算消化率: ${projectData.budgetUtilization}%
    - 技術的難易度: ${projectData.technicalComplexity}

    以下の形式でJSON回答してください：
    {
      "probability": 成功確率（0-100）,
      "confidence": 信頼度（0-100）,
      "keyFactors": ["主要成功要因"],
      "riskFactors": ["主要リスク要因"],
      "recommendations": ["改善提案"]
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }

  async analyzeSuccessFactors(projectData) {
    const factorScores = {};
    
    // 各要因のスコア計算
    for (const factor of this.predictionFactors) {
      factorScores[factor] = await this.calculateFactorScore(projectData, factor);
    }
    
    return {
      scores: factorScores,
      strengths: this.identifyStrengths(factorScores),
      weaknesses: this.identifyWeaknesses(factorScores),
      overallScore: this.calculateOverallScore(factorScores)
    };
  }

  calculateFactorScore(projectData, factor) {
    // 各要因固有のスコア計算ロジック
    switch (factor) {
      case 'scope_clarity':
        return this.calculateScopeClarity(projectData);
      case 'team_experience':
        return this.calculateTeamExperience(projectData);
      case 'resource_adequacy':
        return this.calculateResourceAdequacy(projectData);
      case 'timeline_realism':
        return this.calculateTimelineRealism(projectData);
      default:
        return 50; // デフォルトスコア
    }
  }
}
```

### 成功率表示コンポーネント

```javascript
// プロジェクト成功率表示
export function ProjectSuccessPredictionCard({ projectId }) {
  const [prediction, setPrediction] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadSuccessPrediction();
  }, [projectId]);

  const loadSuccessPrediction = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/success-prediction`);
      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error('成功率予測取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          成功率予測
        </h3>
        <Badge variant={getSuccessRateBadgeVariant(prediction.successRate)}>
          {prediction.successRate}%
        </Badge>
      </div>

      {/* 成功率メーター */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">成功確率</span>
          <span className="text-sm font-medium">
            信頼度: {prediction.confidence}%
          </span>
        </div>
        <Progress 
          value={prediction.successRate} 
          className="h-3"
          indicatorClassName={getProgressColor(prediction.successRate)}
        />
      </div>

      {/* 主要要因 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm font-medium text-green-700 mb-2">
            成功要因
          </h4>
          <ul className="text-xs text-green-600 space-y-1">
            {prediction.factors.keyFactors.map((factor, index) => (
              <li key={index} className="flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                {factor}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-medium text-red-700 mb-2">
            リスク要因
          </h4>
          <ul className="text-xs text-red-600 space-y-1">
            {prediction.factors.riskFactors.map((risk, index) => (
              <li key={index} className="flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 改善提案 */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <h4 className="text-sm font-medium text-blue-700 mb-2">
          AI改善提案
        </h4>
        <ul className="text-xs text-blue-600 space-y-1">
          {prediction.recommendations.map((rec, index) => (
            <li key={index} className="flex items-start">
              <Lightbulb className="w-3 h-3 mr-1 mt-0.5" />
              {rec}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t">
        <span className="text-xs text-gray-500">
          最終更新: {formatDistanceToNow(new Date(prediction.updatedAt))}前
        </span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={loadSuccessPrediction}
        >
          再計算
        </Button>
      </div>
    </Card>
  );
}
```

---

## リスク評価システム

### AI リスク分析エンジン

```javascript
// プロジェクトリスク分析エンジン
class ProjectRiskAnalyzer {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
    this.riskCategories = [
      'technical',      // 技術的リスク
      'schedule',       // スケジュールリスク
      'resource',       // リソースリスク
      'scope',          // スコープリスク
      'stakeholder',    // ステークホルダーリスク
      'external',       // 外部環境リスク
      'quality',        // 品質リスク
      'communication'   // コミュニケーションリスク
    ];
  }

  async analyzeProjectRisks(projectId) {
    try {
      // プロジェクトデータ取得
      const projectData = await this.getProjectData(projectId);
      
      // リスク評価実行
      const riskAssessment = await this.performRiskAssessment(projectData);
      
      // 対策提案生成
      const mitigationStrategies = await this.generateMitigationStrategies(riskAssessment);
      
      return {
        risks: riskAssessment.risks,
        overallRiskLevel: riskAssessment.overallLevel,
        highestRisks: riskAssessment.highestRisks,
        mitigationStrategies,
        alertsRequired: riskAssessment.alertsRequired,
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('リスク分析エラー:', error);
      throw new Error('プロジェクトリスクの分析に失敗しました');
    }
  }

  async performRiskAssessment(projectData) {
    const prompt = `
    以下のプロジェクトデータを分析し、リスク評価を実行してください：

    プロジェクト基本情報:
    - 名前: ${projectData.name}
    - ステータス: ${projectData.status}
    - 開始日: ${projectData.startDate}
    - 予定終了日: ${projectData.endDate}
    - 進捗率: ${projectData.progress}%

    パフォーマンス指標:
    - スケジュール遵守率: ${projectData.scheduleAdherence}%
    - 予算執行率: ${projectData.budgetExecution}%
    - 品質指標: ${projectData.qualityScore}/100
    - チーム生産性: ${projectData.teamProductivity}

    現在の問題:
    - 遅延タスク数: ${projectData.delayedTasks}
    - ブロッカー数: ${projectData.blockers}
    - 未解決課題: ${projectData.openIssues}

    以下の形式でJSON回答してください：
    {
      "overallLevel": "リスクレベル（低/中/高/危険）",
      "risks": [
        {
          "category": "リスクカテゴリ",
          "title": "リスク名",
          "description": "詳細説明",
          "probability": "発生確率（0-100）",
          "impact": "影響度（0-100）",
          "severity": "重要度（低/中/高）",
          "indicators": ["リスク指標"]
        }
      ],
      "highestRisks": ["最重要リスク3つ"],
      "alertsRequired": ["即座に対応が必要なアラート"]
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }

  async generateMitigationStrategies(riskAssessment) {
    const strategies = {};
    
    for (const risk of riskAssessment.risks) {
      if (risk.severity === '高' || risk.severity === '危険') {
        strategies[risk.title] = await this.generateSpecificStrategy(risk);
      }
    }
    
    return strategies;
  }

  async generateSpecificStrategy(risk) {
    const prompt = `
    以下のプロジェクトリスクに対する具体的な対策戦略を提案してください：

    リスク情報:
    - カテゴリ: ${risk.category}
    - 名前: ${risk.title}
    - 説明: ${risk.description}
    - 発生確率: ${risk.probability}%
    - 影響度: ${risk.impact}%

    以下を含む対策を提案してください：
    1. 予防策（リスク発生を防ぐ方法）
    2. 軽減策（影響を最小化する方法）
    3. 対応策（発生時の対処方法）
    4. 監視指標（早期発見のための指標）

    実践的で具体的な提案をしてください。
    `;

    const result = await this.ai.generateContent(prompt);
    return {
      prevention: this.extractStrategies(result.response.text(), '予防策'),
      mitigation: this.extractStrategies(result.response.text(), '軽減策'),
      response: this.extractStrategies(result.response.text(), '対応策'),
      monitoring: this.extractStrategies(result.response.text(), '監視指標')
    };
  }
}
```

### リスク管理パネル

```javascript
// リスク管理パネルコンポーネント
export function RiskManagementPanel({ projectId }) {
  const [risks, setRisks] = React.useState([]);
  const [selectedRisk, setSelectedRisk] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadRiskAnalysis();
  }, [projectId]);

  const loadRiskAnalysis = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/risk-analysis`);
      const data = await response.json();
      setRisks(data.risks);
    } catch (error) {
      console.error('リスク分析取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">リスク管理</h3>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-red-50 text-red-700">
            高リスク: {risks.filter(r => r.severity === '高').length}
          </Badge>
          <Button size="sm" onClick={loadRiskAnalysis}>
            再分析
          </Button>
        </div>
      </div>

      {/* リスクサマリー */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {['低', '中', '高', '危険'].map((level) => (
          <div key={level} className="text-center">
            <div className={`text-2xl font-bold ${getRiskLevelColor(level)}`}>
              {risks.filter(r => r.severity === level).length}
            </div>
            <div className="text-sm text-gray-600">{level}リスク</div>
          </div>
        ))}
      </div>

      {/* リスク一覧 */}
      <div className="space-y-3">
        {risks
          .sort((a, b) => getRiskScore(b) - getRiskScore(a))
          .map((risk, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedRisk === risk ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedRisk(selectedRisk === risk ? null : risk)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant={getRiskSeverityVariant(risk.severity)}>
                    {risk.severity}
                  </Badge>
                  <span className="font-medium">{risk.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    確率: {risk.probability}%
                  </span>
                  <span className="text-sm text-gray-500">
                    影響: {risk.impact}%
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${
                      selectedRisk === risk ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {selectedRisk === risk && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <p className="text-sm text-gray-700">{risk.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">リスク指標</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {risk.indicators.map((indicator, i) => (
                          <li key={i} className="flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {indicator}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">推奨対策</h4>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openMitigationDialog(risk)}
                      >
                        対策を表示
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </Card>
  );
}
```

---

## KGI追跡機能

### KGI定義・追跡システム

```javascript
// KGI追跡サービス
class KGITrackingService {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
  }

  async trackProjectKGI(projectId) {
    try {
      // プロジェクトKGI設定取得
      const kgiConfig = await this.getKGIConfiguration(projectId);
      
      // 現在の実績値取得
      const currentMetrics = await this.getCurrentMetrics(projectId);
      
      // KGI達成度計算
      const achievementAnalysis = await this.calculateKGIAchievement(kgiConfig, currentMetrics);
      
      // 予測・推奨事項生成
      const predictions = await this.generateKGIPredictions(achievementAnalysis);
      
      return {
        kgiMetrics: achievementAnalysis.metrics,
        overallAchievement: achievementAnalysis.overall,
        predictions,
        recommendations: predictions.recommendations,
        alerts: achievementAnalysis.alerts,
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('KGI追跡エラー:', error);
      throw new Error('KGI追跡処理に失敗しました');
    }
  }

  async calculateKGIAchievement(kgiConfig, currentMetrics) {
    const achievements = {};
    const alerts = [];
    
    for (const kgi of kgiConfig.kgis) {
      const current = currentMetrics[kgi.key] || 0;
      const target = kgi.target;
      const achievementRate = (current / target) * 100;
      
      achievements[kgi.key] = {
        name: kgi.name,
        current,
        target,
        achievementRate,
        status: this.getKGIStatus(achievementRate, kgi.thresholds),
        trend: await this.calculateTrend(kgi.key, currentMetrics),
        prediction: await this.predictKGIAchievement(kgi, current)
      };
      
      // アラート判定
      if (achievementRate < kgi.thresholds.warning) {
        alerts.push({
          type: 'warning',
          kgi: kgi.name,
          message: `${kgi.name}の達成率が警告レベル（${achievementRate.toFixed(1)}%）です`
        });
      }
    }
    
    return {
      metrics: achievements,
      overall: this.calculateOverallAchievement(achievements),
      alerts
    };
  }
}
```

### KGI ダッシュボード

```javascript
// KGI ダッシュボードコンポーネント
export function KGIDashboard({ projectId }) {
  const [kgiData, setKgiData] = React.useState(null);
  const [selectedPeriod, setSelectedPeriod] = React.useState('month');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadKGIData();
  }, [projectId, selectedPeriod]);

  const loadKGIData = async () => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/kgi-tracking?period=${selectedPeriod}`
      );
      const data = await response.json();
      setKgiData(data);
    } catch (error) {
      console.error('KGIデータ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">KGI 追跡ダッシュボード</h3>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">週間</SelectItem>
              <SelectItem value="month">月間</SelectItem>
              <SelectItem value="quarter">四半期</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={loadKGIData}>
            更新
          </Button>
        </div>
      </div>

      {/* 全体達成率サマリー */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold">全体達成率</span>
          <Badge variant={getAchievementBadgeVariant(kgiData.overallAchievement.rate)}>
            {kgiData.overallAchievement.rate.toFixed(1)}%
          </Badge>
        </div>
        <Progress 
          value={kgiData.overallAchievement.rate} 
          className="h-3 mb-2"
        />
        <div className="flex justify-between text-sm text-gray-600">
          <span>目標達成予定: {kgiData.overallAchievement.expectedDate}</span>
          <span>
            トレンド: {kgiData.overallAchievement.trend > 0 ? '↗' : '↘'} 
            {Math.abs(kgiData.overallAchievement.trend).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 個別KGI指標 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(kgiData.kgiMetrics).map(([key, metric]) => (
          <div key={key} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{metric.name}</h4>
              <Badge variant={getKGIStatusVariant(metric.status)}>
                {metric.status}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>現在値</span>
                <span className="font-medium">{formatMetricValue(metric.current, key)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>目標値</span>
                <span>{formatMetricValue(metric.target, key)}</span>
              </div>
              <Progress 
                value={metric.achievementRate} 
                className="h-2"
                indicatorClassName={getProgressColor(metric.achievementRate)}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{metric.achievementRate.toFixed(1)}% 達成</span>
                <span>
                  予測: {formatMetricValue(metric.prediction.estimated, key)}
                </span>
              </div>
            </div>

            {/* トレンドチャート */}
            <div className="mt-3 h-20">
              <TrendChart 
                data={metric.trend.data}
                color={getTrendColor(metric.trend.direction)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* アラート・推奨事項 */}
      {(kgiData.alerts.length > 0 || kgiData.recommendations.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kgiData.alerts.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                アラート
              </h4>
              <ul className="space-y-1">
                {kgiData.alerts.map((alert, index) => (
                  <li key={index} className="text-sm text-red-700">
                    {alert.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {kgiData.recommendations.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <Lightbulb className="w-4 h-4 mr-1" />
                AI推奨事項
              </h4>
              <ul className="space-y-1">
                {kgiData.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-blue-700">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
```

---

## リソース最適化

### リソース配分最適化エンジン

```javascript
// リソース最適化エンジン
class ResourceOptimizationEngine {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
  }

  async optimizeResourceAllocation(projectId) {
    try {
      // 現在のリソース状況取得
      const resourceData = await this.getCurrentResourceData(projectId);
      
      // 最適化分析実行
      const optimization = await this.performOptimizationAnalysis(resourceData);
      
      // 配分提案生成
      const allocationProposal = await this.generateAllocationProposal(optimization);
      
      return {
        currentAllocation: resourceData,
        optimization: optimization,
        proposal: allocationProposal,
        expectedImpact: optimization.expectedImpact,
        implementationPlan: allocationProposal.implementationPlan,
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('リソース最適化エラー:', error);
      throw new Error('リソース最適化処理に失敗しました');
    }
  }

  async performOptimizationAnalysis(resourceData) {
    const prompt = `
    以下のプロジェクトリソースデータを分析し、最適化提案を行ってください：

    人的リソース:
    - 総メンバー数: ${resourceData.teamSize}
    - スキル分布: ${JSON.stringify(resourceData.skillDistribution)}
    - 稼働率: ${resourceData.utilization}%
    - 経験レベル: ${JSON.stringify(resourceData.experienceLevels)}

    タスク負荷:
    - 高優先度タスク: ${resourceData.highPriorityTasks}
    - 技術的難易度の高いタスク: ${resourceData.complexTasks}
    - 遅延リスクのあるタスク: ${resourceData.riskyTasks}

    現在の課題:
    - ボトルネック: ${resourceData.bottlenecks.join(', ')}
    - スキルギャップ: ${resourceData.skillGaps.join(', ')}
    - 負荷の偏り: ${resourceData.workloadImbalance}

    以下の観点から最適化を提案してください：
    1. 人員配置の最適化
    2. スキルマッチングの改善
    3. 負荷分散の最適化
    4. 効率向上施策

    JSON形式で回答してください：
    {
      "issues": ["現在の主要課題"],
      "opportunities": ["改善機会"],
      "recommendations": ["具体的な改善提案"],
      "expectedImpact": {
        "productivity": "生産性向上率（%）",
        "efficiency": "効率改善率（%）",
        "riskReduction": "リスク軽減率（%）"
      }
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
```

### リソース配分チャート

```javascript
// リソース配分可視化コンポーネント
export function ResourceAllocationChart({ projectId }) {
  const [resourceData, setResourceData] = React.useState(null);
  const [chartType, setChartType] = React.useState('current');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadResourceData();
  }, [projectId]);

  const loadResourceData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/resource-optimization`);
      const data = await response.json();
      setResourceData(data);
    } catch (error) {
      console.error('リソースデータ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">リソース配分分析</h3>
        <div className="flex items-center space-x-2">
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">現在の配分</SelectItem>
              <SelectItem value="optimized">最適化案</SelectItem>
              <SelectItem value="comparison">比較表示</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={loadResourceData}>
            更新
          </Button>
        </div>
      </div>

      {/* リソース効率サマリー */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">
            {resourceData.currentAllocation.utilization}%
          </div>
          <div className="text-sm text-blue-600">現在の稼働率</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">
            +{resourceData.optimization.expectedImpact.productivity}%
          </div>
          <div className="text-sm text-green-600">予想生産性向上</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-700">
            {resourceData.optimization.expectedImpact.efficiency}%
          </div>
          <div className="text-sm text-purple-600">効率改善予想</div>
        </div>
      </div>

      {/* チャート表示 */}
      <div className="mb-6">
        {chartType === 'current' && (
          <CurrentAllocationChart data={resourceData.currentAllocation} />
        )}
        {chartType === 'optimized' && (
          <OptimizedAllocationChart data={resourceData.proposal} />
        )}
        {chartType === 'comparison' && (
          <ComparisonChart 
            current={resourceData.currentAllocation}
            optimized={resourceData.proposal}
          />
        )}
      </div>

      {/* 最適化提案 */}
      <div className="space-y-4">
        <h4 className="font-semibold">AI最適化提案</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h5 className="font-medium mb-2 text-red-700">解決すべき課題</h5>
            <ul className="space-y-1">
              {resourceData.optimization.issues.map((issue, index) => (
                <li key={index} className="text-sm text-red-600 flex items-start">
                  <AlertCircle className="w-3 h-3 mr-1 mt-0.5" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h5 className="font-medium mb-2 text-green-700">改善機会</h5>
            <ul className="space-y-1">
              {resourceData.optimization.opportunities.map((opportunity, index) => (
                <li key={index} className="text-sm text-green-600 flex items-start">
                  <TrendingUp className="w-3 h-3 mr-1 mt-0.5" />
                  {opportunity}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium mb-2 text-blue-800">具体的改善提案</h5>
          <ul className="space-y-2">
            {resourceData.optimization.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-start">
                <Lightbulb className="w-3 h-3 mr-1 mt-0.5" />
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* 実装計画 */}
        <div className="p-4 border rounded-lg">
          <h5 className="font-medium mb-3">実装計画</h5>
          <div className="space-y-3">
            {resourceData.proposal.implementationPlan.phases.map((phase, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{phase.title}</div>
                  <div className="text-sm text-gray-600">{phase.description}</div>
                  <div className="text-xs text-gray-500">期間: {phase.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

## 進捗パターン分析

### 進捗パターン分析エンジン

```javascript
// 進捗パターン分析エンジン
class ProgressPatternAnalyzer {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
  }

  async analyzeProgressPatterns(projectId) {
    try {
      // 履歴データ取得
      const historicalData = await this.getProjectHistoricalData(projectId);
      
      // パターン分析実行
      const patterns = await this.identifyProgressPatterns(historicalData);
      
      // 予測分析
      const predictions = await this.generateProgressPredictions(patterns);
      
      // 改善提案生成
      const improvements = await this.generateImprovementSuggestions(patterns);
      
      return {
        patterns,
        predictions,
        improvements,
        insights: patterns.insights,
        recommendations: improvements.recommendations,
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('進捗パターン分析エラー:', error);
      throw new Error('進捗パターンの分析に失敗しました');
    }
  }

  async identifyProgressPatterns(historicalData) {
    const prompt = `
    以下のプロジェクト履歴データから進捗パターンを分析してください：

    進捗履歴:
    ${JSON.stringify(historicalData.progressHistory, null, 2)}

    タスク完了パターン:
    ${JSON.stringify(historicalData.taskCompletionPatterns, null, 2)}

    生産性データ:
    ${JSON.stringify(historicalData.productivityMetrics, null, 2)}

    以下の観点から分析してください：
    1. 進捗の季節性・周期性
    2. 生産性のピークとボトルネック
    3. タスク完了パターンの特徴
    4. チーム効率の変動要因
    5. 遅延発生の傾向

    JSON形式で詳細に回答してください：
    {
      "seasonality": "季節性・周期性の分析",
      "productivityPeaks": ["生産性ピーク時期・要因"],
      "bottlenecks": ["ボトルネック発生パターン"],
      "completionPatterns": ["タスク完了の特徴的パターン"],
      "delayTrends": ["遅延発生の傾向分析"],
      "insights": ["重要な洞察・発見"]
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
```

---

## プロジェクト健全性評価

### 健全性スコア算出システム

```javascript
// プロジェクト健全性計算エンジン
class ProjectHealthCalculator {
  constructor() {
    this.healthFactors = {
      schedule: { weight: 0.25, name: 'スケジュール遵守' },
      budget: { weight: 0.20, name: '予算管理' },
      quality: { weight: 0.20, name: '品質管理' },
      team: { weight: 0.15, name: 'チーム生産性' },
      risk: { weight: 0.10, name: 'リスク管理' },
      stakeholder: { weight: 0.10, name: 'ステークホルダー満足度' }
    };
  }

  async calculateProjectHealth(projectId) {
    try {
      // 各要素のスコア計算
      const factorScores = await this.calculateFactorScores(projectId);
      
      // 総合健全性スコア算出
      const overallScore = this.calculateOverallScore(factorScores);
      
      // 健全性レベル判定
      const healthLevel = this.determineHealthLevel(overallScore);
      
      // トレンド分析
      const trend = await this.analyzeTrend(projectId);
      
      return {
        overallScore,
        healthLevel,
        factorScores,
        trend,
        recommendations: await this.generateHealthRecommendations(factorScores),
        alerts: this.generateHealthAlerts(factorScores),
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('健全性計算エラー:', error);
      throw new Error('プロジェクト健全性の計算に失敗しました');
    }
  }

  calculateOverallScore(factorScores) {
    let totalScore = 0;
    
    for (const [factor, data] of Object.entries(this.healthFactors)) {
      const score = factorScores[factor] || 0;
      totalScore += score * data.weight;
    }
    
    return Math.round(totalScore);
  }

  determineHealthLevel(score) {
    if (score >= 80) return { level: '優良', color: 'green', description: 'プロジェクトは順調に進行しています' };
    if (score >= 60) return { level: '良好', color: 'blue', description: '概ね順調ですが改善の余地があります' };
    if (score >= 40) return { level: '注意', color: 'yellow', description: '複数の課題があり注意が必要です' };
    return { level: '危険', color: 'red', description: '重大な問題があり緊急対応が必要です' };
  }
}
```

### プロジェクト健全性ダッシュボード

```javascript
// プロジェクト健全性表示コンポーネント
export function ProjectHealthDashboard({ projectId }) {
  const [healthData, setHealthData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadHealthData();
  }, [projectId]);

  const loadHealthData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/health`);
      const data = await response.json();
      setHealthData(data);
    } catch (error) {
      console.error('健全性データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">プロジェクト健全性</h3>
        <Button size="sm" onClick={loadHealthData}>
          更新
        </Button>
      </div>

      {/* 総合健全性スコア */}
      <div className="text-center mb-6 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
        <div className="mb-2">
          <span className="text-4xl font-bold" style={{ color: healthData.healthLevel.color }}>
            {healthData.overallScore}
          </span>
          <span className="text-xl text-gray-500">/100</span>
        </div>
        <Badge 
          variant="outline" 
          className={`bg-${healthData.healthLevel.color}-50 text-${healthData.healthLevel.color}-700 mb-2`}
        >
          {healthData.healthLevel.level}
        </Badge>
        <p className="text-sm text-gray-600">{healthData.healthLevel.description}</p>
        
        {healthData.trend && (
          <div className="mt-2 flex items-center justify-center">
            <TrendingUp className={`w-4 h-4 mr-1 ${healthData.trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-sm">
              {healthData.trend.direction === 'up' ? '改善傾向' : '悪化傾向'} 
              ({healthData.trend.rate}%)
            </span>
          </div>
        )}
      </div>

      {/* 要素別スコア */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {Object.entries(healthData.factorScores).map(([factor, score]) => (
          <div key={factor} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{getFactorName(factor)}</span>
              <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                {score}
              </span>
            </div>
            <Progress 
              value={score} 
              className="h-2"
              indicatorClassName={getProgressColor(score)}
            />
          </div>
        ))}
      </div>

      {/* アラート */}
      {healthData.alerts.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            健全性アラート
          </h4>
          <ul className="space-y-1">
            {healthData.alerts.map((alert, index) => (
              <li key={index} className="text-sm text-red-700">
                • {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 改善推奨事項 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <Lightbulb className="w-4 h-4 mr-1" />
          改善推奨事項
        </h4>
        <ul className="space-y-1">
          {healthData.recommendations.map((rec, index) => (
            <li key={index} className="text-sm text-blue-700">
              • {rec}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
```

---

## 実装例

### API エンドポイント実装

```javascript
// /api/projects/[id]/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProjectSuccessPredictor } from '@/services/ProjectSuccessPredictor';
import { ProjectRiskAnalyzer } from '@/services/ProjectRiskAnalyzer';
import { KGITrackingService } from '@/services/KGITrackingService';
import { ProjectHealthCalculator } from '@/services/ProjectHealthCalculator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    
    // 各分析サービスを並列実行
    const [
      successPrediction,
      riskAnalysis,
      kgiTracking,
      healthScore
    ] = await Promise.all([
      new ProjectSuccessPredictor(googleAI).predictSuccessRate(projectId),
      new ProjectRiskAnalyzer(googleAI).analyzeProjectRisks(projectId),
      new KGITrackingService(googleAI).trackProjectKGI(projectId),
      new ProjectHealthCalculator().calculateProjectHealth(projectId)
    ]);

    return NextResponse.json({
      projectId,
      analytics: {
        successPrediction,
        riskAnalysis,
        kgiTracking,
        healthScore
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('プロジェクト分析API エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクト分析の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const { action, data } = await request.json();

    switch (action) {
      case 'recalculate_success_rate':
        const prediction = await new ProjectSuccessPredictor(googleAI)
          .predictSuccessRate(projectId);
        return NextResponse.json({ success: true, data: prediction });

      case 'update_kgi':
        const kgiResult = await new KGITrackingService(googleAI)
          .updateKGIMetrics(projectId, data);
        return NextResponse.json({ success: true, data: kgiResult });

      case 'recalculate_health':
        const healthResult = await new ProjectHealthCalculator()
          .calculateProjectHealth(projectId);
        return NextResponse.json({ success: true, data: healthResult });

      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('プロジェクト分析API POST エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクト分析の更新に失敗しました' },
      { status: 500 }
    );
  }
}
```

### カスタムフック実装

```javascript
// hooks/useProjectAnalytics.ts
import { useState, useEffect, useCallback } from 'react';

export function useProjectAnalytics(projectId: string) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/analytics`);
      
      if (!response.ok) {
        throw new Error('分析データの取得に失敗しました');
      }
      
      const data = await response.json();
      setAnalyticsData(data.analytics);
      setError(null);
      
    } catch (err) {
      setError(err.message);
      console.error('分析データ取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const recalculateSuccessRate = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recalculate_success_rate' })
      });
      
      if (!response.ok) throw new Error('再計算に失敗しました');
      
      const result = await response.json();
      setAnalyticsData(prev => ({
        ...prev,
        successPrediction: result.data
      }));
      
      return result.data;
      
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [projectId]);

  const updateKGI = useCallback(async (kgiData) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_kgi', data: kgiData })
      });
      
      if (!response.ok) throw new Error('KGI更新に失敗しました');
      
      const result = await response.json();
      setAnalyticsData(prev => ({
        ...prev,
        kgiTracking: result.data
      }));
      
      return result.data;
      
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadAnalytics();
    }
  }, [projectId, loadAnalytics]);

  return {
    analyticsData,
    loading,
    error,
    refreshAnalytics: loadAnalytics,
    recalculateSuccessRate,
    updateKGI
  };
}
```

---

## AI最適化機能

### 機械学習統合

```javascript
// AI分析統合システム
class AIProjectAnalyticsIntegration {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
  }

  async performComprehensiveAnalysis(projectId) {
    try {
      // 全データ取得
      const projectData = await this.getAllProjectData(projectId);
      
      // AI総合分析実行
      const comprehensiveInsights = await this.generateComprehensiveInsights(projectData);
      
      // 優先度付きアクションプラン生成
      const actionPlan = await this.generatePrioritizedActionPlan(comprehensiveInsights);
      
      return {
        insights: comprehensiveInsights,
        actionPlan,
        prioritizedRecommendations: actionPlan.recommendations,
        riskMitigationPlan: actionPlan.riskMitigation,
        optimizationOpportunities: comprehensiveInsights.opportunities,
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('AI総合分析エラー:', error);
      throw new Error('AI総合分析に失敗しました');
    }
  }

  async generateComprehensiveInsights(projectData) {
    const prompt = `
    以下の包括的なプロジェクトデータを分析し、統合的な洞察を提供してください：

    プロジェクト基本情報:
    ${JSON.stringify(projectData.basic, null, 2)}

    成功率予測データ:
    ${JSON.stringify(projectData.successPrediction, null, 2)}

    リスク分析データ:
    ${JSON.stringify(projectData.riskAnalysis, null, 2)}

    KGI追跡データ:
    ${JSON.stringify(projectData.kgiTracking, null, 2)}

    リソース分析データ:
    ${JSON.stringify(projectData.resourceAnalysis, null, 2)}

    健全性データ:
    ${JSON.stringify(projectData.healthScore, null, 2)}

    以下の統合分析を実行してください：
    1. 全体的なプロジェクト状況評価
    2. 相互関連する課題・リスクの特定
    3. 最も重要な改善機会の特定
    4. 成功確率向上のための統合戦略
    5. 長期的な持続可能性評価

    JSON形式で詳細に回答してください：
    {
      "overallAssessment": "全体評価",
      "keyInsights": ["重要な洞察"],
      "interconnectedIssues": ["相互関連する課題"],
      "opportunities": ["改善機会"],
      "strategicRecommendations": ["戦略的推奨事項"],
      "sustainabilityFactor": "持続可能性評価"
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
```

---

## トラブルシューティング

### よくある問題と解決策

```javascript
// プロジェクト分析トラブルシューティング
const ProjectAnalyticsTroubleshooting = {
  // 成功率予測の問題
  successPredictionIssues: {
    'low_confidence': {
      description: '予測信頼度が低い',
      causes: [
        'プロジェクトデータ不足',
        '類似プロジェクトの参考データ不足',
        '不確定要素が多い'
      ],
      solutions: [
        'より詳細なプロジェクト情報を入力',
        '過去のプロジェクトデータを参照',
        '段階的予測に切り替え'
      ]
    },
    'unrealistic_prediction': {
      description: '予測結果が現実的でない',
      causes: [
        'AI分析パラメータの調整不足',
        '入力データの品質問題',
        'モデルの学習データ偏り'
      ],
      solutions: [
        'データの正確性を確認',
        'パラメータ調整を実行',
        '人間の判断と組み合わせ'
      ]
    }
  },

  // リスク分析の問題
  riskAnalysisIssues: {
    'false_positives': {
      description: '誤検知リスクが多い',
      solutions: [
        'リスク閾値の調整',
        '業界特有のリスクパターン学習',
        'ユーザーフィードバックの反映'
      ]
    },
    'missing_risks': {
      description: '重要なリスクが検出されない',
      solutions: [
        'リスクカテゴリの拡張',
        '外部要因の考慮強化',
        '定期的なリスク評価見直し'
      ]
    }
  },

  // KGI追跡の問題
  kgiTrackingIssues: {
    'data_inconsistency': {
      description: 'KGIデータの不整合',
      solutions: [
        'データソースの統一',
        '自動データ検証の実装',
        '手動データ入力の検証強化'
      ]
    },
    'tracking_delays': {
      description: 'KGI更新の遅延',
      solutions: [
        'リアルタイム更新機能の実装',
        'バックグラウンド処理の最適化',
        'エラーハンドリングの改善'
      ]
    }
  }
};

// エラーハンドリング関数
export function handleProjectAnalyticsError(error, context) {
  console.error(`プロジェクト分析エラー [${context}]:`, error);
  
  // エラータイプ別の対応
  switch (error.type) {
    case 'API_ERROR':
      return {
        message: 'API接続エラーが発生しました。しばらく待ってから再試行してください。',
        action: 'retry',
        retryAfter: 30000
      };
      
    case 'DATA_ERROR':
      return {
        message: 'データの取得または処理でエラーが発生しました。データを確認してください。',
        action: 'validate_data'
      };
      
    case 'AI_ERROR':
      return {
        message: 'AI分析でエラーが発生しました。入力データを確認してください。',
        action: 'check_input'
      };
      
    default:
      return {
        message: '予期しないエラーが発生しました。システム管理者に連絡してください。',
        action: 'contact_admin'
      };
  }
}
```

---

## まとめ

このプロジェクト分析機能マニュアルでは、AI駆動のプロジェクト管理支援システムの包括的な実装方法を説明しました。

### 主要機能
1. **成功率予測エンジン** - プロジェクトの成功確率をAIで予測
2. **リスク評価システム** - 多角的なリスク分析と対策提案
3. **KGI追跡機能** - 重要目標達成指標の自動追跡
4. **リソース最適化** - AI による人員・リソース配分最適化
5. **進捗パターン分析** - 履歴データからのパターン抽出
6. **健全性評価** - プロジェクト健全性の総合スコア算出

### 技術的特徴
- Google Generative AI との統合
- リアルタイムデータ分析
- 機械学習ベースの予測
- 包括的なダッシュボード
- 自動アラート・通知システム

このシステムにより、プロジェクト管理の効率化と成功率向上が期待できます。
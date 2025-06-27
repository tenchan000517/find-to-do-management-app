# Phase 2: タスク管理システム高度化 実装計画書

**フェーズ期間**: 4日間  
**実装日**: 2025年7月1日 〜 2025年7月4日  
**担当エンジニア**: タスク管理システム担当  
**前提条件**: Phase 1完了、既存タスク管理システムの理解

---

## 🎯 **Phase 2 実装目標**

### **2.1 主要機能実装**
- **高度財務管理・LTV分析システム**: プロジェクト収益予測・顧客LTV算出
- **プロジェクトテンプレート自動生成**: イベント・開発プロジェクトの自動テンプレート
- **タスク完了時ナレッジ自動化**: 完了タスクから自動ナレッジ生成
- **AI支援プロジェクト分析**: 成功確率・リスク評価の自動化

### **2.2 技術要件**
- 既存プロジェクト・タスクデータの完全活用
- AI評価エンジンの拡張・強化
- 財務データの安全な管理・暗号化

---

## 📋 **Phase 2 実装チェックリスト**

### **2.1 高度財務管理システム (1.5日)**
- [ ] 財務データモデル拡張
- [ ] LTV計算エンジン実装
- [ ] 収益予測システム実装
- [ ] 財務レポート生成機能

### **2.2 プロジェクトテンプレート自動生成 (1日)**
- [ ] テンプレートエンジン実装
- [ ] イベントテンプレート生成
- [ ] 開発プロジェクトテンプレート
- [ ] AIベーステンプレート最適化

### **2.3 ナレッジ自動化システム (1日)**
- [ ] タスク完了時フック実装
- [ ] ナレッジ判定エンジン
- [ ] 自動ナレッジ生成機能
- [ ] ナレッジ品質評価

### **2.4 AI支援プロジェクト分析 (0.5日)**
- [ ] プロジェクト成功率予測
- [ ] リスク評価エンジン
- [ ] パフォーマンス分析
- [ ] 改善提案システム

---

## 🔧 **詳細実装ガイド**

### **2.1 高度財務管理システム実装**

#### **2.1.1 データベース拡張**
```sql
-- プロジェクト財務詳細テーブル
CREATE TABLE project_financial_details (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  
  -- 基本契約情報
  base_contract_value DECIMAL(12,2) DEFAULT 0,
  contract_type VARCHAR(50) DEFAULT 'FIXED',
  payment_schedule JSONB DEFAULT '{}',
  
  -- 売上予測
  additional_work_probability FLOAT DEFAULT 0.3,
  additional_work_expected_value DECIMAL(12,2) DEFAULT 0,
  maintenance_contract_probability FLOAT DEFAULT 0.5,
  maintenance_annual_value DECIMAL(12,2) DEFAULT 0,
  referral_probability FLOAT DEFAULT 0.2,
  referral_expected_value DECIMAL(12,2) DEFAULT 0,
  
  -- コスト詳細
  direct_labor_cost DECIMAL(12,2) DEFAULT 0,
  indirect_labor_cost DECIMAL(12,2) DEFAULT 0,
  external_contractor_cost DECIMAL(12,2) DEFAULT 0,
  tool_license_cost DECIMAL(12,2) DEFAULT 0,
  infrastructure_cost DECIMAL(12,2) DEFAULT 0,
  
  -- リスク・品質管理
  risk_buffer_percentage FLOAT DEFAULT 0.15,
  quality_assurance_cost DECIMAL(12,2) DEFAULT 0,
  contingency_reserve DECIMAL(12,2) DEFAULT 0,
  
  -- 予測精度・メタデータ
  confidence_level FLOAT DEFAULT 0.8,
  prediction_model_version VARCHAR(20) DEFAULT 'v1.0',
  last_updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 顧客LTV分析テーブル
CREATE TABLE customer_ltv_analysis (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id VARCHAR(255) NOT NULL,
  
  -- LTV構成要素
  initial_project_value DECIMAL(12,2) DEFAULT 0,
  continuation_probability FLOAT DEFAULT 0.7,
  average_projects_per_year FLOAT DEFAULT 1.5,
  price_growth_rate FLOAT DEFAULT 0.1,
  relationship_duration_years INTEGER DEFAULT 5,
  
  -- 紹介価値
  referral_probability FLOAT DEFAULT 0.3,
  referral_average_value DECIMAL(12,2) DEFAULT 0,
  referral_multiplier FLOAT DEFAULT 1.0,
  
  -- 計算結果
  total_ltv DECIMAL(12,2) DEFAULT 0,
  discounted_ltv DECIMAL(12,2) DEFAULT 0,
  discount_rate FLOAT DEFAULT 0.1,
  
  -- 分析結果
  risk_factors JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  recommended_actions JSONB DEFAULT '[]',
  confidence_score FLOAT DEFAULT 0.8,
  
  -- メタデータ
  analysis_date TIMESTAMP DEFAULT NOW(),
  prediction_model_version VARCHAR(20) DEFAULT 'v1.0',
  created_by VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX idx_project_financial_project_id ON project_financial_details(project_id);
CREATE INDEX idx_project_financial_contract_value ON project_financial_details(base_contract_value);
CREATE INDEX idx_customer_ltv_connection_id ON customer_ltv_analysis(connection_id);
CREATE INDEX idx_customer_ltv_total ON customer_ltv_analysis(total_ltv);
```

#### **2.1.2 LTV分析エンジン実装**
```typescript
// src/services/CustomerLTVAnalyzer.ts
import { AI_SERVICE } from './ai-service';

export interface CustomerLTVData {
  connectionId: string;
  customrName: string;
  firstProjectDate: Date;
  projectHistory: ProjectHistoryItem[];
  satisfactionMetrics: SatisfactionMetrics;
  industryProfile: IndustryProfile;
  companyProfile: CompanyProfile;
}

export interface LTVAnalysisResult {
  ltvCalculation: {
    initialProjectValue: number;
    continuationProbability: number;
    averageProjectsPerYear: number;
    priceGrowthRate: number;
    relationshipDuration: number;
    referralProbability: number;
    referralAverageValue: number;
    totalLTV: number;
    discountedLTV: number;
    discountRate: number;
  };
  riskFactors: string[];
  opportunities: string[];
  recommendedActions: string[];
  confidenceLevel: number;
  comparisons: {
    industryAverage: number;
    companyPerformance: 'ABOVE' | 'AVERAGE' | 'BELOW';
  };
}

export class CustomerLTVAnalyzer {
  constructor(
    private aiService: typeof AI_SERVICE,
    private connectionService: any,
    private projectService: any
  ) {}

  /**
   * 包括的LTV分析実行
   */
  async calculateComprehensiveLTV(
    connectionId: string
  ): Promise<LTVAnalysisResult> {
    
    // 既存データ収集
    const customerData = await this.gatherCustomerData(connectionId);
    const industryBenchmarks = await this.getIndustryBenchmarks(customerData.industryProfile);
    const historicalPerformance = await this.analyzeHistoricalPerformance(customerData);
    
    // AI による総合LTV分析
    const ltvAnalysis = await this.aiService.evaluateWithGemini(`
    顧客LTV包括分析:
    
    顧客情報:
    - 企業名: ${customerData.customrName}
    - 業界: ${customerData.industryProfile.industry}
    - 企業規模: ${customerData.companyProfile.employeeCount}名
    - 初回契約日: ${customerData.firstProjectDate.toISOString()}
    - 初回案件価値: ${customerData.projectHistory[0]?.value || 0}円
    
    プロジェクト履歴 (${customerData.projectHistory.length}件):
    ${customerData.projectHistory.map((project, index) => `
    ${index + 1}. ${project.title} (${project.value}円)
       - 満足度: ${project.satisfactionScore}/10
       - 完了日: ${project.completedAt?.toISOString()}
       - 追加案件: ${project.additionalWork ? 'あり' : 'なし'}
    `).join('\n')}
    
    満足度指標:
    - 平均満足度: ${customerData.satisfactionMetrics.averageScore}/10
    - 推薦意向: ${customerData.satisfactionMetrics.npsScore}
    - リピート率: ${customerData.satisfactionMetrics.repeatRate}%
    
    業界ベンチマーク:
    - 業界平均LTV: ${industryBenchmarks.averageLTV}円
    - 継続率: ${industryBenchmarks.continuationRate}%
    - 単価成長率: ${industryBenchmarks.priceGrowthRate}%/年
    
    過去パフォーマンス分析:
    ${historicalPerformance.trends.map(trend => `- ${trend}`).join('\n')}
    
    以下の要素を総合的に考慮してLTV分析を実行:
    
    1. 基本LTV算出:
       - 初回案件価値とプロジェクト間隔から基本パターン予測
       - 満足度と継続確率の相関分析
       - 企業成長と発注増加の可能性
    
    2. 単価成長予測:
       - 関係性深化による価格向上見込み
       - 業界デジタル化トレンドによる需要増
       - 企業規模拡大に伴う案件規模向上
    
    3. 紹介価値算出:
       - 業界での影響力・ネットワーク規模
       - 満足度からの紹介確率算出
       - 紹介案件の平均価値予測
    
    4. リスク要因分析:
       - 業界トレンド変化リスク
       - 競合他社参入リスク
       - 企業内部変化リスク（担当者変更等）
       - 経済環境変化への感度
    
    5. 機会要因分析:
       - 新サービス・技術への需要
       - 業界内での口コミ・評判効果
       - 長期パートナーシップの可能性
    
    回答形式:
    {
      "ltvCalculation": {
        "initialProjectValue": 1000000,
        "continuationProbability": 0.8,
        "averageProjectsPerYear": 2.0,
        "priceGrowthRate": 0.12,
        "relationshipDuration": 6,
        "referralProbability": 0.35,
        "referralAverageValue": 800000,
        "totalLTV": 5200000,
        "discountedLTV": 3800000,
        "discountRate": 0.1
      },
      "riskFactors": [
        "業界のデジタル化進展による競合激化",
        "担当者変更による関係性リセットリスク"
      ],
      "opportunities": [
        "AI・DX需要拡大による案件増加機会",
        "業界内での推薦による新規開拓"
      ],
      "recommendedActions": [
        "四半期定期レビューによる関係性維持",
        "新技術トレンド情報の積極的共有"
      ],
      "confidenceLevel": 0.85,
      "comparisons": {
        "industryAverage": 3200000,
        "companyPerformance": "ABOVE"
      }
    }
    `);

    const result = this.parseLTVAnalysis(ltvAnalysis);
    
    // 分析結果をデータベースに保存
    await this.saveLTVAnalysis(connectionId, result);
    
    return result;
  }

  /**
   * プロジェクト収益予測
   */
  async predictProjectRevenue(
    projectId: string,
    baseContract: number,
    projectDetails: any
  ): Promise<{
    predictedRevenue: number;
    revenueBreakdown: any;
    confidenceInterval: { min: number; max: number };
    keyFactors: string[];
  }> {
    
    const project = await this.projectService.getProject(projectId);
    const historicalData = await this.getHistoricalProjectData(project);
    
    const revenueAnalysis = await this.aiService.evaluateWithGemini(`
    プロジェクト収益予測分析:
    
    プロジェクト基本情報:
    - プロジェクト名: ${project.title}
    - 基本契約額: ${baseContract}円
    - プロジェクト期間: ${project.duration}ヶ月
    - 複雑度: ${project.complexity}/10
    - チーム規模: ${project.teamSize}名
    
    類似プロジェクト実績:
    ${historicalData.similarProjects.map(p => `
    - ${p.title}: 契約額${p.contractValue}円 → 最終売上${p.totalRevenue}円
      追加作業: ${p.additionalWorkValue}円, 保守契約: ${p.maintenanceValue}円
    `).join('\n')}
    
    以下の要素を考慮して収益予測:
    
    1. 追加作業発生確率・金額
       - プロジェクト複雑度からの追加作業リスク
       - 顧客の要求変更傾向
       - 技術的不確実性による追加工数
    
    2. 保守・運用契約への転換
       - 完成システムの運用サポート需要
       - 継続的改善・機能追加の可能性
       - 長期パートナーシップの構築
    
    3. 関連案件・紹介の創出
       - プロジェクト成功による追加案件
       - 業界内での評判・紹介効果
       - 技術ノウハウの他案件への活用
    
    回答形式:
    {
      "predictedRevenue": 1800000,
      "revenueBreakdown": {
        "baseContract": 1000000,
        "additionalWork": 300000,
        "maintenanceContract": 400000,
        "referralValue": 100000
      },
      "confidenceInterval": {
        "min": 1400000,
        "max": 2200000
      },
      "keyFactors": [
        "プロジェクト複雑度が高く追加作業の可能性",
        "顧客の継続利用意向が強い"
      ]
    }
    `);

    return this.parseRevenueAnalysis(revenueAnalysis);
  }

  /**
   * 財務リスク評価
   */
  async assessFinancialRisk(
    projectId: string
  ): Promise<{
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    riskFactors: Array<{
      factor: string;
      impact: number;
      probability: number;
      mitigation: string;
    }>;
    recommendedActions: string[];
    bufferRecommendation: number;
  }> {
    
    const project = await this.projectService.getProject(projectId);
    const financialDetails = await this.getProjectFinancialDetails(projectId);
    const teamAnalysis = await this.analyzeProjectTeam(projectId);
    
    const riskAnalysis = await this.aiService.evaluateWithGemini(`
    プロジェクト財務リスク評価:
    
    プロジェクト概要:
    - 契約額: ${financialDetails.baseContractValue}円
    - 期間: ${project.duration}ヶ月
    - チーム構成: ${teamAnalysis.teamComposition}
    - 技術難易度: ${project.complexity}/10
    
    コスト構造:
    - 直接人件費: ${financialDetails.directLaborCost}円
    - 間接人件費: ${financialDetails.indirectLaborCost}円
    - 外部委託費: ${financialDetails.externalContractorCost}円
    - ツール・インフラ費: ${financialDetails.toolInfrastructureCost}円
    
    チーム分析:
    - 経験レベル: ${teamAnalysis.experienceLevel}
    - 技術適合度: ${teamAnalysis.technicalFit}/10
    - 可用性: ${teamAnalysis.availability}%
    
    以下のリスク要因を評価:
    
    1. スケジュールリスク
       - 技術難易度による遅延可能性
       - チームの経験・スキルレベル
       - 外部依存関係の複雑さ
    
    2. 品質リスク
       - 要件の不明確さ
       - テスト・品質保証の充実度
       - 顧客の関与・フィードバック頻度
    
    3. スコープリスク
       - 要求変更の可能性
       - ステークホルダーの合意度
       - 技術的制約の理解度
    
    4. リソースリスク
       - チームメンバーのアサイン確実性
       - 外部リソースの調達リスク
       - 競合プロジェクトとのリソース競合
    
    5. 技術リスク
       - 新技術・未経験技術の採用
       - 既存システムとの統合複雑さ
       - パフォーマンス・スケーラビリティ要件
    
    回答形式:
    {
      "riskLevel": "MEDIUM",
      "riskFactors": [
        {
          "factor": "新技術スタックの採用",
          "impact": 7,
          "probability": 0.4,
          "mitigation": "技術調査フェーズの設置と専門家コンサル"
        }
      ],
      "recommendedActions": [
        "技術的不確実性の早期解決",
        "顧客との定期的な進捗共有強化"
      ],
      "bufferRecommendation": 0.2
    }
    `);

    return this.parseRiskAnalysis(riskAnalysis);
  }

  // ヘルパーメソッド
  private async gatherCustomerData(connectionId: string): Promise<CustomerLTVData> {
    const connection = await this.connectionService.getConnection(connectionId);
    const projects = await this.getConnectionProjects(connectionId);
    const satisfaction = await this.getSatisfactionMetrics(connectionId);
    
    return {
      connectionId,
      customrName: connection.companyName,
      firstProjectDate: projects[0]?.createdAt || new Date(),
      projectHistory: projects.map(p => ({
        title: p.title,
        value: p.contractValue || 0,
        satisfactionScore: p.satisfactionScore || 8,
        completedAt: p.completedAt,
        additionalWork: p.additionalWorkValue > 0
      })),
      satisfactionMetrics: satisfaction,
      industryProfile: {
        industry: connection.industry || 'General',
        segment: connection.segment || 'SME'
      },
      companyProfile: {
        employeeCount: connection.employeeCount || 50,
        revenue: connection.annualRevenue || 0
      }
    };
  }

  private async getIndustryBenchmarks(industryProfile: any) {
    // 業界ベンチマークデータ（実際の実装では外部データソースから取得）
    const benchmarks = {
      'IT': { averageLTV: 3500000, continuationRate: 75, priceGrowthRate: 8 },
      'Manufacturing': { averageLTV: 2800000, continuationRate: 80, priceGrowthRate: 5 },
      'Healthcare': { averageLTV: 4200000, continuationRate: 85, priceGrowthRate: 12 },
      'General': { averageLTV: 3000000, continuationRate: 70, priceGrowthRate: 6 }
    };
    
    return benchmarks[industryProfile.industry] || benchmarks['General'];
  }

  private parseLTVAnalysis(aiResponse: string): LTVAnalysisResult {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('LTV analysis parsing error:', error);
      return {
        ltvCalculation: {
          initialProjectValue: 0,
          continuationProbability: 0.5,
          averageProjectsPerYear: 1,
          priceGrowthRate: 0.05,
          relationshipDuration: 3,
          referralProbability: 0.1,
          referralAverageValue: 0,
          totalLTV: 0,
          discountedLTV: 0,
          discountRate: 0.1
        },
        riskFactors: ['AI応答の解析に失敗しました'],
        opportunities: ['手動でLTV分析を実施してください'],
        recommendedActions: ['データを確認して再分析してください'],
        confidenceLevel: 0.1,
        comparisons: {
          industryAverage: 0,
          companyPerformance: 'AVERAGE'
        }
      };
    }
  }

  private async saveLTVAnalysis(connectionId: string, analysis: LTVAnalysisResult) {
    const query = `
      INSERT INTO customer_ltv_analysis (
        connection_id, initial_project_value, continuation_probability,
        average_projects_per_year, price_growth_rate, relationship_duration_years,
        referral_probability, referral_average_value, total_ltv, discounted_ltv,
        risk_factors, opportunities, recommended_actions, confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (connection_id) DO UPDATE SET
        initial_project_value = EXCLUDED.initial_project_value,
        continuation_probability = EXCLUDED.continuation_probability,
        total_ltv = EXCLUDED.total_ltv,
        updated_at = NOW()
    `;
    
    await this.db.query(query, [
      connectionId,
      analysis.ltvCalculation.initialProjectValue,
      analysis.ltvCalculation.continuationProbability,
      analysis.ltvCalculation.averageProjectsPerYear,
      analysis.ltvCalculation.priceGrowthRate,
      analysis.ltvCalculation.relationshipDuration,
      analysis.ltvCalculation.referralProbability,
      analysis.ltvCalculation.referralAverageValue,
      analysis.ltvCalculation.totalLTV,
      analysis.ltvCalculation.discountedLTV,
      JSON.stringify(analysis.riskFactors),
      JSON.stringify(analysis.opportunities),
      JSON.stringify(analysis.recommendedActions),
      analysis.confidenceLevel
    ]);
  }
}
```

### **2.2 プロジェクトテンプレート自動生成システム**

#### **2.2.1 テンプレートエンジン実装**
```typescript
// src/services/ProjectTemplateGenerator.ts
import { AI_SERVICE } from './ai-service';

export interface EventTemplateRequest {
  eventType: 'CONFERENCE' | 'WORKSHOP' | 'SEMINAR' | 'NETWORKING' | 'COMPETITION';
  targetScale: number;
  budget: number;
  duration: number; // 日数
  location: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  audience: string;
  objectives: string[];
}

export interface DevelopmentTemplateRequest {
  projectType: 'WEB_APP' | 'MOBILE_APP' | 'API' | 'SYSTEM_INTEGRATION' | 'AI_ML';
  complexity: number; // 1-10
  timeline: number; // 週数
  teamSize: number;
  technologies: string[];
  requirements: string[];
}

export interface GeneratedTemplate {
  projectName: string;
  description: string;
  phases: Array<{
    name: string;
    duration: string;
    tasks: Array<{
      title: string;
      description: string;
      estimatedHours: number;
      priority: 'A' | 'B' | 'C';
      dependencies: string[];
      skillRequirements: string[];
      deliverables: string[];
    }>;
  }>;
  budgetBreakdown: Record<string, number>;
  riskFactors: string[];
  successMetrics: string[];
  resources: {
    humanResources: string[];
    technicalResources: string[];
    externalServices: string[];
  };
}

export class ProjectTemplateGenerator {
  constructor(
    private aiService: typeof AI_SERVICE,
    private knowledgeService: any,
    private projectService: any
  ) {}

  /**
   * イベントプロジェクトテンプレート生成
   */
  async generateEventTemplate(
    request: EventTemplateRequest
  ): Promise<GeneratedTemplate> {
    
    // 関連知識・過去事例の収集
    const relevantKnowledge = await this.knowledgeService.searchKnowledge({
      category: 'EVENT',
      tags: [request.eventType, `scale_${this.getScaleCategory(request.targetScale)}`],
      limit: 10
    });

    const historicalEvents = await this.getHistoricalEventData(request.eventType);
    
    const templateData = await this.aiService.evaluateWithGemini(`
    イベントプロジェクトテンプレート生成:
    
    イベント要件:
    - タイプ: ${request.eventType}
    - 目標規模: ${request.targetScale}名
    - 予算: ${request.budget.toLocaleString()}円
    - 期間: ${request.duration}日間
    - 開催形式: ${request.location}
    - 対象オーディエンス: ${request.audience}
    - 目的: ${request.objectives.join(', ')}
    
    過去の知見・事例:
    ${relevantKnowledge.map(k => `
    - ${k.title}: ${k.content.substring(0, 200)}...
    `).join('\n')}
    
    類似イベント実績:
    ${historicalEvents.map(event => `
    - ${event.name} (${event.scale}名規模): 予算${event.budget}円, 成功度${event.successScore}/10
    `).join('\n')}
    
    以下の要素を含む包括的なプロジェクトテンプレートを生成:
    
    1. プロジェクトフェーズ設計
       - 企画・準備フェーズ（2-4週間前から）
       - 広報・集客フェーズ（3-6週間前から）
       - 準備・制作フェーズ（1-2週間前）
       - 実施フェーズ（当日）
       - フォローアップフェーズ（1週間後まで）
    
    2. 各フェーズのタスク詳細
       - 具体的な作業内容
       - 必要スキル・担当者
       - 工数見積もり（過去実績ベース）
       - 成果物・チェックポイント
       - 依存関係・クリティカルパス
    
    3. 予算配分
       - 会場費・設備費
       - 講師・ゲスト費
       - 広報・マーケティング費
       - 運営人件費
       - 雑費・予備費
    
    4. リスク管理
       - 集客不足リスク
       - 技術トラブルリスク
       - スケジュール遅延リスク
       - 予算超過リスク
    
    5. 成功指標・KPI
       - 参加者数・満足度
       - エンゲージメント指標
       - ROI・費用対効果
       - フォローアップ成果
    
    回答形式:
    {
      "projectName": "${request.eventType}イベント企画・運営",
      "description": "詳細な説明",
      "phases": [
        {
          "name": "企画フェーズ",
          "duration": "2週間",
          "tasks": [
            {
              "title": "イベント企画書作成",
              "description": "イベントの目的・内容・進行を詳細設計",
              "estimatedHours": 16,
              "priority": "A",
              "dependencies": [],
              "skillRequirements": ["企画", "プレゼンテーション"],
              "deliverables": ["企画書", "進行台本"]
            }
          ]
        }
      ],
      "budgetBreakdown": {
        "venue": 100000,
        "marketing": 80000,
        "speakers": 60000,
        "materials": 40000,
        "contingency": 20000
      },
      "riskFactors": ["集客不足", "技術トラブル"],
      "successMetrics": ["参加者数100名以上", "満足度4.0以上"],
      "resources": {
        "humanResources": ["プロジェクトマネージャー", "マーケター"],
        "technicalResources": ["配信システム", "受付システム"],
        "externalServices": ["会場", "ケータリング"]
      }
    }
    `);

    return this.parseTemplate(templateData);
  }

  /**
   * 開発プロジェクトテンプレート生成
   */
  async generateDevelopmentTemplate(
    request: DevelopmentTemplateRequest
  ): Promise<GeneratedTemplate> {
    
    const technicalKnowledge = await this.getTechnicalKnowledge(request.technologies);
    const similarProjects = await this.getSimilarDevelopmentProjects(request);
    
    const templateData = await this.aiService.evaluateWithGemini(`
    開発プロジェクトテンプレート生成:
    
    プロジェクト要件:
    - タイプ: ${request.projectType}
    - 複雑度: ${request.complexity}/10
    - 期間: ${request.timeline}週間
    - チームサイズ: ${request.teamSize}名
    - 技術スタック: ${request.technologies.join(', ')}
    - 要件: ${request.requirements.join(', ')}
    
    技術知識・ベストプラクティス:
    ${technicalKnowledge.map(k => `
    - ${k.title}: ${k.content.substring(0, 150)}...
    `).join('\n')}
    
    類似プロジェクト実績:
    ${similarProjects.map(p => `
    - ${p.title}: ${p.duration}週間, 成功度${p.successScore}/10
    `).join('\n')}
    
    以下の要素を含む開発プロジェクトテンプレートを生成:
    
    1. 開発フェーズ設計
       - 要件定義・設計フェーズ
       - 開発・実装フェーズ
       - テスト・品質保証フェーズ
       - デプロイ・リリースフェーズ
       - 運用・保守移行フェーズ
    
    2. 技術的タスク詳細
       - アーキテクチャ設計
       - データベース設計
       - API設計・実装
       - フロントエンド開発
       - バックエンド開発
       - テスト自動化
       - セキュリティ対策
       - パフォーマンス最適化
    
    3. 品質管理プロセス
       - コードレビュープロセス
       - テスト戦略・テストケース
       - 継続的インテグレーション
       - 品質指標・閾値
    
    4. プロジェクト管理要素
       - マイルストーン設定
       - リスク管理計画
       - 変更管理プロセス
       - ステークホルダー管理
    
    回答形式:
    {
      "projectName": "${request.projectType}開発プロジェクト",
      "description": "詳細な開発プロジェクト計画",
      "phases": [
        {
          "name": "要件定義・設計",
          "duration": "2週間",
          "tasks": [
            {
              "title": "要件定義書作成",
              "description": "機能・非機能要件の詳細定義",
              "estimatedHours": 40,
              "priority": "A",
              "dependencies": [],
              "skillRequirements": ["要件定義", "システム分析"],
              "deliverables": ["要件定義書", "システム仕様書"]
            }
          ]
        }
      ],
      "budgetBreakdown": {
        "development": 1000000,
        "infrastructure": 200000,
        "thirdPartyServices": 150000,
        "testing": 100000,
        "contingency": 150000
      },
      "riskFactors": ["技術的複雑さ", "要件変更"],
      "successMetrics": ["納期遵守", "品質基準達成"],
      "resources": {
        "humanResources": ["テックリード", "フロントエンドエンジニア"],
        "technicalResources": ["開発環境", "テストツール"],
        "externalServices": ["クラウドサービス", "SaaSツール"]
      }
    }
    `);

    return this.parseTemplate(templateData);
  }

  /**
   * カスタムプロジェクトテンプレート生成
   */
  async generateCustomTemplate(
    projectDescription: string,
    requirements: string[],
    constraints: string[]
  ): Promise<GeneratedTemplate> {
    
    const relatedKnowledge = await this.findRelatedKnowledge(projectDescription);
    
    const templateData = await this.aiService.evaluateWithGemini(`
    カスタムプロジェクトテンプレート生成:
    
    プロジェクト概要:
    ${projectDescription}
    
    要件:
    ${requirements.map(req => `- ${req}`).join('\n')}
    
    制約条件:
    ${constraints.map(constraint => `- ${constraint}`).join('\n')}
    
    関連知識・経験:
    ${relatedKnowledge.map(k => `
    - ${k.title}: ${k.content.substring(0, 100)}...
    `).join('\n')}
    
    プロジェクトの性質を分析し、最適なフェーズ構成とタスク分解を行う:
    
    1. プロジェクト特性分析
       - 創造性 vs 分析性
       - 単発 vs 継続性
       - 内部 vs 外部関係者
       - 技術 vs ビジネス重点
    
    2. 適切なフェーズ設計
       - プロジェクト特性に応じたフェーズ分割
       - 各フェーズの目的・成果物
       - フェーズ間の依存関係
    
    3. リスク・制約への対策
       - 制約条件を考慮したタスク設計
       - リスク軽減策の組み込み
       - 代替案・コンティンジェンシー
    
    4. 成功要因の特定
       - プロジェクト成功のクリティカルファクター
       - 測定可能な成功指標
       - ステークホルダー満足度指標
    
    回答形式: 上記のEventTemplate、DevelopmentTemplateと同じ形式
    `);

    return this.parseTemplate(templateData);
  }

  // ヘルパーメソッド
  private getScaleCategory(scale: number): string {
    if (scale < 50) return 'small';
    if (scale < 200) return 'medium';
    if (scale < 500) return 'large';
    return 'enterprise';
  }

  private async getHistoricalEventData(eventType: string) {
    const query = `
      SELECT title as name, participant_count as scale, 
             budget, success_score 
      FROM projects 
      WHERE project_type = 'EVENT' 
        AND tags::text LIKE '%${eventType}%'
        AND status = 'COMPLETED'
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    const result = await this.db.query(query);
    return result.rows;
  }

  private async getTechnicalKnowledge(technologies: string[]) {
    const searchTerms = technologies.join(' OR ');
    return await this.knowledgeService.searchKnowledge({
      category: 'TECHNICAL',
      searchQuery: searchTerms,
      limit: 8
    });
  }

  private async getSimilarDevelopmentProjects(request: DevelopmentTemplateRequest) {
    const query = `
      SELECT title, duration, success_score
      FROM projects 
      WHERE project_type = $1 
        AND complexity_level BETWEEN $2 AND $3
        AND status = 'COMPLETED'
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    const result = await this.db.query(query, [
      request.projectType,
      request.complexity - 1,
      request.complexity + 1
    ]);
    return result.rows;
  }

  private parseTemplate(aiResponse: string): GeneratedTemplate {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('Template parsing error:', error);
      return {
        projectName: 'テンプレート生成エラー',
        description: 'AI応答の解析に失敗しました',
        phases: [{
          name: '手動計画フェーズ',
          duration: '要検討',
          tasks: [{
            title: '手動でプロジェクト計画を作成',
            description: 'テンプレート生成に失敗したため、手動で計画を立ててください',
            estimatedHours: 8,
            priority: 'A',
            dependencies: [],
            skillRequirements: ['プロジェクト管理'],
            deliverables: ['プロジェクト計画書']
          }]
        }],
        budgetBreakdown: { total: 0 },
        riskFactors: ['テンプレート生成失敗'],
        successMetrics: ['手動計画の完成'],
        resources: {
          humanResources: ['プロジェクトマネージャー'],
          technicalResources: [],
          externalServices: []
        }
      };
    }
  }
}
```

### **2.3 タスク完了時ナレッジ自動化システム**

#### **2.3.1 ナレッジ自動生成エンジン実装**
```typescript
// src/services/TaskKnowledgeAutomator.ts
import { AI_SERVICE } from './ai-service';

export interface TaskCompletionData {
  taskId: string;
  completionData: {
    deliverables?: string;
    issues?: string;
    solutions?: string;
    lessonsLearned?: string;
    timeSpent: number;
    difficultyActual: number;
  };
}

export interface KnowledgeGenerationDecision {
  shouldGenerate: boolean;
  knowledgeTypes: ('TECHNICAL' | 'PROCESS' | 'BUSINESS' | 'PROBLEM_SOLVING')[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedTitle: string;
  keyPoints: string[];
  applicableScenarios: string[];
  estimatedValue: number; // 1-10
}

export interface GeneratedKnowledge {
  title: string;
  category: string;
  content: string;
  tags: string[];
  applicableProjects: string[];
  relatedTasks: string[];
  valueScore: number;
  confidence: number;
}

export class TaskKnowledgeAutomator {
  constructor(
    private aiService: typeof AI_SERVICE,
    private knowledgeService: any,
    private taskService: any
  ) {}

  /**
   * タスク完了時のナレッジ生成判定・実行
   */
  async processTaskCompletion(
    completionData: TaskCompletionData
  ): Promise<{
    decision: KnowledgeGenerationDecision;
    generatedKnowledge?: GeneratedKnowledge;
    processingTime: number;
  }> {
    
    const startTime = Date.now();
    
    // タスク詳細情報を取得
    const task = await this.getTaskWithFullContext(completionData.taskId);
    
    // ナレッジ生成判定
    const decision = await this.evaluateKnowledgeGeneration(task, completionData.completionData);
    
    let generatedKnowledge: GeneratedKnowledge | undefined;
    
    if (decision.shouldGenerate) {
      generatedKnowledge = await this.generateKnowledge(task, completionData.completionData, decision);
      await this.saveGeneratedKnowledge(generatedKnowledge, task.id);
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      decision,
      generatedKnowledge,
      processingTime
    };
  }

  /**
   * ナレッジ生成判定
   */
  private async evaluateKnowledgeGeneration(
    task: any,
    completionData: any
  ): Promise<KnowledgeGenerationDecision> {
    
    const evaluation = await this.aiService.evaluateWithGemini(`
    タスク完了ナレッジ化判定:
    
    完了タスク詳細:
    - タイトル: ${task.title}
    - 説明: ${task.description || '説明なし'}
    - カテゴリ: ${task.category || '未分類'}
    - 予定工数: ${task.estimatedHours}時間
    - 実績工数: ${completionData.timeSpent}時間
    - 工数乖離: ${((completionData.timeSpent - task.estimatedHours) / task.estimatedHours * 100).toFixed(1)}%
    - 予定難易度: ${task.difficultyScore}/10
    - 実際難易度: ${completionData.difficultyActual}/10
    - AI課題レベル: ${task.aiIssueLevel || 'N/A'}
    
    完了時データ:
    - 成果物: ${completionData.deliverables || '記録なし'}
    - 遭遇した問題: ${completionData.issues || 'なし'}
    - 解決方法: ${completionData.solutions || '標準手法'}
    - 学んだこと: ${completionData.lessonsLearned || '記録なし'}
    
    プロジェクト文脈:
    - プロジェクト: ${task.project?.title || '未分類'}
    - チーム: ${task.assignedTo || '未割当'}
    
    以下の基準でナレッジ化価値を評価:
    
    1. 再利用価値 (高価値指標)
       - 類似タスクでの活用可能性
       - 手法・アプローチの汎用性
       - 作成した成果物の再利用性
       - 解決した問題の一般性
    
    2. 学習価値 (知識蓄積指標) 
       - 新しい技術・手法の習得
       - 既存手法の改善・最適化
       - 失敗・トラブルからの学び
       - ベストプラクティスの発見
    
    3. 効率化価値 (業務改善指標)
       - 作業時間短縮につながる知見
       - 品質向上に寄与する手法
       - エラー・リスク回避方法
       - プロセス改善のヒント
    
    4. 問題解決価値 (課題対応指標)
       - 特殊・複雑な問題の解決法
       - 創造的・革新的アプローチ
       - 制約条件下での工夫
       - 代替案・回避策の発見
    
    判定基準:
    - HIGH価値: 3つ以上の指標で高評価 OR 1つの指標で極めて高い価値
    - MEDIUM価値: 2つ以上の指標で中程度以上の評価
    - LOW価値: 1つの指標で中程度の評価
    - 対象外: すべての指標で低評価
    
    回答形式:
    {
      "shouldGenerate": true,
      "knowledgeTypes": ["TECHNICAL", "PROBLEM_SOLVING"],
      "priority": "HIGH",
      "suggestedTitle": "React Hook最適化による描画パフォーマンス改善手法",
      "keyPoints": [
        "useMemo/useCallbackの効果的活用",
        "不要な再レンダリング特定方法",
        "メモリリークの回避策"
      ],
      "applicableScenarios": [
        "大規模Reactアプリケーション開発",
        "パフォーマンス要件の厳しいUI実装"
      ],
      "estimatedValue": 8
    }
    `);

    return this.parseKnowledgeDecision(evaluation);
  }

  /**
   * ナレッジ生成実行
   */
  private async generateKnowledge(
    task: any,
    completionData: any,
    decision: KnowledgeGenerationDecision
  ): Promise<GeneratedKnowledge> {
    
    const relatedKnowledge = await this.findRelatedKnowledge(task.title, task.description);
    const similarTasks = await this.findSimilarTasks(task);
    
    const generatedContent = await this.aiService.evaluateWithGemini(`
    タスク完了ナレッジ生成:
    
    基本情報:
    - 推奨タイトル: ${decision.suggestedTitle}
    - ナレッジタイプ: ${decision.knowledgeTypes.join(', ')}
    - 価値レベル: ${decision.priority}
    
    タスク詳細:
    - タイトル: ${task.title}
    - 実績工数: ${completionData.timeSpent}時間
    - 実際難易度: ${completionData.difficultyActual}/10
    - 成果物: ${completionData.deliverables}
    - 問題・解決法: ${completionData.issues} → ${completionData.solutions}
    - 学習ポイント: ${completionData.lessonsLearned}
    
    重要ポイント:
    ${decision.keyPoints.map(point => `- ${point}`).join('\n')}
    
    適用場面:
    ${decision.applicableScenarios.map(scenario => `- ${scenario}`).join('\n')}
    
    関連既存ナレッジ:
    ${relatedKnowledge.map(k => `- ${k.title}`).join('\n')}
    
    類似タスク事例:
    ${similarTasks.map(t => `- ${t.title} (${t.actualHours}h)`).join('\n')}
    
    以下の構成で実用的なナレッジ記事を生成:
    
    1. 概要・背景
       - 何を解決/達成したか
       - なぜこの手法が必要だったか
       - 従来手法との違い・改善点
    
    2. 具体的な手法・アプローチ
       - ステップバイステップの実行方法
       - 使用したツール・技術・リソース
       - 重要な判断ポイント・コツ
    
    3. 遭遇した問題と解決策
       - 発生した課題・障害
       - 試行錯誤のプロセス
       - 最終的な解決方法・回避策
    
    4. 成果・効果
       - 達成した結果・品質
       - 時間・コスト・品質への影響
       - 副次的な効果・学び
    
    5. 適用指針・注意点
       - どういう場面で使えるか
       - 適用時の前提条件・制約
       - 注意すべきポイント・落とし穴
    
    6. 今後の発展・改善可能性
       - さらなる最適化の余地
       - 他の手法との組み合わせ
       - 技術発展に伴う進化可能性
    
    回答形式:
    {
      "title": "生成されたナレッジタイトル",
      "category": "TECHNICAL",
      "content": "# 概要\\n\\n詳細な内容...",
      "tags": ["React", "パフォーマンス", "最適化"],
      "applicableProjects": ["Webアプリ開発", "UI改善"],
      "relatedTasks": ["task123", "task456"],
      "valueScore": 8,
      "confidence": 0.9
    }
    `);

    return this.parseGeneratedKnowledge(generatedContent);
  }

  /**
   * 関連タスク自動更新
   */
  async updateRelatedTasksWithKnowledge(
    knowledgeId: string,
    knowledge: GeneratedKnowledge
  ): Promise<void> {
    
    // 関連タスクを特定
    const relatedTasks = await this.findTasksForKnowledgeApplication(knowledge);
    
    for (const task of relatedTasks) {
      // タスクにナレッジリンクを追加
      await this.linkKnowledgeToTask(task.id, knowledgeId);
      
      // 工数・難易度の再評価を提案
      const updatedEstimate = await this.suggestTaskUpdates(task, knowledge);
      if (updatedEstimate.shouldUpdate) {
        await this.proposeTaskUpdates(task.id, updatedEstimate);
      }
    }
  }

  /**
   * ナレッジ品質評価・改善
   */
  async evaluateKnowledgeQuality(
    knowledgeId: string
  ): Promise<{
    qualityScore: number;
    improvementSuggestions: string[];
    usageTracking: {
      viewCount: number;
      applicationCount: number;
      feedback: any[];
    };
  }> {
    
    const knowledge = await this.knowledgeService.getKnowledge(knowledgeId);
    const usageData = await this.getKnowledgeUsageData(knowledgeId);
    const feedback = await this.getKnowledgeFeedback(knowledgeId);
    
    const qualityEvaluation = await this.aiService.evaluateWithGemini(`
    ナレッジ品質評価:
    
    ナレッジ内容:
    - タイトル: ${knowledge.title}
    - カテゴリ: ${knowledge.category}
    - 作成日: ${knowledge.createdAt}
    - 内容長: ${knowledge.content.length}文字
    
    利用状況:
    - 閲覧回数: ${usageData.viewCount}回
    - 実際活用回数: ${usageData.applicationCount}回
    - 活用率: ${(usageData.applicationCount / Math.max(usageData.viewCount, 1) * 100).toFixed(1)}%
    
    フィードバック:
    ${feedback.map(f => `- ${f.rating}/5: ${f.comment}`).join('\n')}
    
    以下の基準で品質評価:
    
    1. 実用性・有用性 (40%)
       - 実際に問題解決に役立つか
       - 手法・アプローチの具体性
       - 適用場面の明確さ
    
    2. 理解しやすさ・再現性 (30%)
       - 説明の分かりやすさ
       - 手順の再現可能性
       - 必要な前提知識の適切性
    
    3. 完全性・網羅性 (20%)
       - 情報の包括性
       - 注意点・制約の記述
       - 関連情報との連携
    
    4. 最新性・正確性 (10%)
       - 情報の新しさ・妥当性
       - 技術・手法の現状適合性
       - エラー・誤情報の有無
    
    総合スコア算出と改善提案:
    
    回答形式:
    {
      "qualityScore": 7.5,
      "improvementSuggestions": [
        "具体的なコード例の追加",
        "適用条件をより明確に記述"
      ]
    }
    `);

    const evaluation = this.parseQualityEvaluation(qualityEvaluation);
    
    return {
      ...evaluation,
      usageTracking: {
        viewCount: usageData.viewCount,
        applicationCount: usageData.applicationCount,
        feedback: feedback
      }
    };
  }

  // ヘルパーメソッド
  private async getTaskWithFullContext(taskId: string) {
    const query = `
      SELECT t.*, p.title as project_title, u.name as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1
    `;
    const result = await this.db.query(query, [taskId]);
    return result.rows[0];
  }

  private parseKnowledgeDecision(aiResponse: string): KnowledgeGenerationDecision {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      return {
        shouldGenerate: false,
        knowledgeTypes: [],
        priority: 'LOW',
        suggestedTitle: 'AI応答解析エラー',
        keyPoints: ['手動でナレッジ化を検討してください'],
        applicableScenarios: [],
        estimatedValue: 1
      };
    }
  }

  private parseGeneratedKnowledge(aiResponse: string): GeneratedKnowledge {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      return {
        title: 'ナレッジ生成エラー',
        category: 'GENERAL',
        content: 'AI応答の解析に失敗しました。手動でナレッジを作成してください。',
        tags: ['error'],
        applicableProjects: [],
        relatedTasks: [],
        valueScore: 1,
        confidence: 0.1
      };
    }
  }

  private async saveGeneratedKnowledge(knowledge: GeneratedKnowledge, sourceTaskId: string) {
    const query = `
      INSERT INTO knowledge_items (
        title, category, content, tags, 
        auto_generated, source_type, source_document_id,
        value_score, confidence_score, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id
    `;
    
    const result = await this.db.query(query, [
      knowledge.title,
      knowledge.category,
      knowledge.content,
      JSON.stringify(knowledge.tags),
      true,
      'TASK_COMPLETION',
      sourceTaskId,
      knowledge.valueScore,
      knowledge.confidence
    ]);
    
    return result.rows[0].id;
  }
}
```

---

## 🧪 **Phase 2 テスト計画**

### **2.1 単体テスト**
```typescript
// __tests__/CustomerLTVAnalyzer.test.ts
describe('CustomerLTVAnalyzer', () => {
  test('calculateComprehensiveLTV should return valid analysis', async () => {
    const analyzer = new CustomerLTVAnalyzer();
    const connectionId = 'test-connection-1';
    
    const result = await analyzer.calculateComprehensiveLTV(connectionId);
    
    expect(result.ltvCalculation.totalLTV).toBeGreaterThan(0);
    expect(result.confidenceLevel).toBeGreaterThan(0);
    expect(result.riskFactors).toBeInstanceOf(Array);
  });
});

// __tests__/ProjectTemplateGenerator.test.ts
describe('ProjectTemplateGenerator', () => {
  test('generateEventTemplate should create valid template', async () => {
    const generator = new ProjectTemplateGenerator();
    const request = {
      eventType: 'CONFERENCE',
      targetScale: 100,
      budget: 500000,
      duration: 1,
      location: 'OFFLINE',
      audience: 'IT professionals',
      objectives: ['networking', 'knowledge sharing']
    };
    
    const template = await generator.generateEventTemplate(request);
    
    expect(template.phases.length).toBeGreaterThan(0);
    expect(template.budgetBreakdown).toBeTruthy();
  });
});
```

---

## 📊 **Phase 2 成功指標**

### **2.1 定量指標**
- [ ] **LTV予測精度**: 実績との乖離 ±20%以内
- [ ] **テンプレート生成時間**: < 30秒
- [ ] **ナレッジ自動生成率**: 完了タスクの 30%以上
- [ ] **API レスポンス時間**: < 1秒

### **2.2 機能指標**
- [ ] **財務分析精度**: 過去データとの整合性 90%
- [ ] **テンプレート実用性**: 生成テンプレートの利用率 70%
- [ ] **ナレッジ品質**: 自動生成ナレッジの評価 7/10以上

---

## ⚠️ **Phase 2 注意事項**

### **2.1 データセキュリティ**
- 財務データの暗号化必須
- 顧客情報の適切な匿名化
- アクセス権限の厳格な管理

### **2.2 パフォーマンス**
- AI処理の非同期化
- 大量データ処理の最適化
- キャッシュ戦略の実装

---

**Phase 2 完了基準**: 全機能のテスト通過、品質指標達成、セキュリティチェック完了
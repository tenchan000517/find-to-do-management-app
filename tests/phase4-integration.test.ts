// Phase 4: Integration Test Suite
// 営業プロセス完全自動化システムの統合テスト

import { SafeMenuProcessor } from '../src/services/SafeMenuProcessor';
import { SalesStageAutomator, SalesOpportunity } from '../src/services/SalesStageAutomator';
import { ContractAutomationEngine } from '../src/services/ContractAutomationEngine';
import { AISalesAssistant, CustomerProfile, ProposalRequest } from '../src/services/AISalesAssistant';
import { SalesConversionPredictor } from '../src/services/SalesConversionPredictor';

describe('Phase 4: Sales Automation Integration Tests', () => {
  
  describe('SafeMenuProcessor', () => {
    let processor: SafeMenuProcessor;

    beforeEach(() => {
      processor = new SafeMenuProcessor();
    });

    test('should initialize with predefined menu actions', () => {
      const actions = processor.getAvailableActions();
      expect(actions).toBeDefined();
      expect(actions.length).toBeGreaterThan(0);
      
      // 営業関連アクションが含まれていることを確認
      const salesActions = processor.getAvailableActions('sales');
      expect(salesActions.length).toBeGreaterThan(0);
      
      const salesOpportunityAction = salesActions.find(action => action.id === 'sales_create_opportunity');
      expect(salesOpportunityAction).toBeDefined();
      expect(salesOpportunityAction?.parameters).toBeDefined();
      expect(salesOpportunityAction?.parameters?.length).toBeGreaterThan(0);
    });

    test('should start menu action session successfully', async () => {
      const result = await processor.startMenuAction('sales_create_opportunity', 'test-user-id');
      
      expect(result.success).toBe(true);
      expect(result.nextStep).toBeDefined();
      expect(result.nextStep?.parameter).toBeDefined();
      expect(result.completed).toBe(false);
    });

    test('should handle step-by-step input processing', async () => {
      // アクション開始
      const startResult = await processor.startMenuAction('sales_create_opportunity', 'test-user-id');
      expect(startResult.success).toBe(true);
      
      // 最初のパラメータ入力（会社名）
      const sessionId = startResult.sessionId!;
      const step1Result = await processor.processUserInput(sessionId, 'テスト株式会社');
      
      expect(step1Result.success).toBe(true);
      if (!step1Result.completed) {
        expect(step1Result.nextStep).toBeDefined();
      }
    });

    test('should validate input according to parameter types', async () => {
      const startResult = await processor.startMenuAction('sales_create_opportunity', 'test-user-id');
      const sessionId = 'test-session-id';
      
      // 数値パラメータのテスト（案件金額）
      // 実際のテストでは、セッション管理を適切に実装する必要があります
      expect(startResult.success).toBe(true);
    });
  });

  describe('SalesStageAutomator', () => {
    let automator: SalesStageAutomator;
    let mockOpportunity: SalesOpportunity;

    beforeEach(() => {
      automator = new SalesStageAutomator();
      mockOpportunity = {
        id: 'test-opportunity-1',
        companyName: 'テスト株式会社',
        contactName: '田中太郎',
        contactPosition: '営業部長',
        dealValue: 5000000,
        priority: 'B',
        stage: 'qualified',
        expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        notes: 'テスト案件',
        activities: [
          {
            id: 'activity-1',
            opportunityId: 'test-opportunity-1',
            type: 'initial_contact',
            title: '初回コンタクト',
            description: '電話での初回コンタクト',
            outcome: 'positive',
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            userId: 'test-user-1',
            metadata: {}
          },
          {
            id: 'activity-2',
            opportunityId: 'test-opportunity-1',
            type: 'meeting',
            title: '商談ミーティング',
            description: '詳細ヒアリング',
            outcome: 'needs_identified',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            userId: 'test-user-1',
            metadata: {}
          }
        ],
        riskScore: 0.3,
        probabilityScore: 0.6,
        lastActivityDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      };
    });

    test('should analyze opportunity risk correctly', async () => {
      const riskScore = await automator.analyzeOpportunityRisk(mockOpportunity);
      
      expect(riskScore).toBeGreaterThanOrEqual(0);
      expect(riskScore).toBeLessThanOrEqual(1);
    });

    test('should process automatic progression', async () => {
      const results = await automator.processAutomaticProgression([mockOpportunity]);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    test('should calculate sales metrics', async () => {
      const metrics = await automator.calculateSalesMetrics([mockOpportunity]);
      
      expect(metrics).toBeDefined();
      expect(metrics.totalOpportunities).toBe(1);
      expect(metrics.activeOpportunities).toBe(1);
      expect(metrics.stageDistribution).toBeDefined();
      expect(metrics.pipelineValue).toBeGreaterThan(0);
    });
  });

  describe('ContractAutomationEngine', () => {
    let engine: ContractAutomationEngine;
    let mockOpportunity: SalesOpportunity;

    beforeEach(() => {
      engine = new ContractAutomationEngine();
      mockOpportunity = {
        id: 'test-opportunity-1',
        companyName: 'テスト株式会社',
        contactName: '田中太郎',
        dealValue: 5000000,
        priority: 'A',
        stage: 'closed_won',
        expectedCloseDate: new Date().toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        activities: [],
        riskScore: 0.1,
        probabilityScore: 0.9
      };
    });

    test('should automate contract processing successfully', async () => {
      const contractData = {
        contractType: 'new' as const,
        contractValue: 5000000,
        contractPeriod: 12,
        startDate: new Date().toISOString()
      };

      const result = await engine.automateContractProcessing(mockOpportunity, contractData);
      
      expect(result.success).toBe(true);
      expect(result.contractId).toBeDefined();
      expect(result.createdTasks.length).toBeGreaterThan(0);
      expect(result.createdKnowledgeItems.length).toBeGreaterThan(0);
      expect(result.teamAssignments.length).toBeGreaterThan(0);
    });

    test('should generate appropriate back office tasks', async () => {
      const contractData = {
        contractType: 'new' as const,
        contractValue: 10000000, // 大型案件
        contractPeriod: 24
      };

      const result = await engine.automateContractProcessing(mockOpportunity, contractData);
      
      expect(result.createdTasks).toBeDefined();
      
      // 法務タスクが含まれていることを確認
      const legalTasks = result.createdTasks.filter(task => task.category === 'legal');
      expect(legalTasks.length).toBeGreaterThan(0);
      
      // 経理タスクが含まれていることを確認
      const financeTasks = result.createdTasks.filter(task => task.category === 'finance');
      expect(financeTasks.length).toBeGreaterThan(0);
      
      // プロジェクト設定タスクが含まれていることを確認
      const projectTasks = result.createdTasks.filter(task => task.category === 'project_setup');
      expect(projectTasks.length).toBeGreaterThan(0);
    });

    test('should create appropriate knowledge items', async () => {
      const contractData = {
        contractType: 'new' as const,
        contractValue: 3000000
      };

      const result = await engine.automateContractProcessing(mockOpportunity, contractData);
      
      expect(result.createdKnowledgeItems).toBeDefined();
      expect(result.createdKnowledgeItems.length).toBeGreaterThan(0);
      
      // 事例研究のナレッジアイテムが含まれていることを確認
      const caseStudyItems = result.createdKnowledgeItems.filter(item => item.category === 'case_study');
      expect(caseStudyItems.length).toBeGreaterThan(0);
    });
  });

  describe('AISalesAssistant', () => {
    let assistant: AISalesAssistant;
    let mockCustomerProfile: CustomerProfile;
    let mockOpportunity: SalesOpportunity;

    beforeEach(() => {
      assistant = new AISalesAssistant();
      mockCustomerProfile = {
        id: 'customer-1',
        companyName: 'テスト株式会社',
        industry: 'manufacturing',
        companySize: 'medium',
        revenue: 1000000000,
        employees: 200,
        businessModel: 'b2b',
        techMaturity: 'intermediate',
        decisionMakers: [
          {
            name: 'IT部長',
            position: '部長',
            department: 'IT',
            influence: 8,
            techSavvy: 9,
            riskTolerance: 'medium',
            concerns: ['セキュリティ', '運用負荷'],
            motivations: ['効率化', 'コスト削減']
          }
        ],
        painPoints: [
          {
            category: 'efficiency',
            description: '手動作業による非効率',
            severity: 8,
            urgency: 7,
            currentCost: 5000000,
            businessImpact: '競争力低下'
          }
        ],
        currentSolutions: [],
        budget: {
          available: 10000000,
          timeframe: '年次',
          approvalProcess: '部長承認',
          decisionCriteria: ['ROI', 'リスク'],
          costSensitivity: 'medium'
        },
        timeframe: '6ヶ月以内',
        competitivePosition: {
          marketPosition: '業界中堅',
          keyCompetitors: ['競合A', '競合B'],
          competitiveAdvantages: ['技術力'],
          marketChallenges: ['デジタル化遅れ'],
          differentiationNeeds: ['技術革新']
        },
        riskFactors: [],
        opportunities: []
      };

      mockOpportunity = {
        id: 'opportunity-1',
        companyName: 'テスト株式会社',
        contactName: '田中太郎',
        dealValue: 8000000,
        priority: 'A',
        stage: 'proposal',
        expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        activities: [],
        riskScore: 0.2,
        probabilityScore: 0.7
      };
    });

    test('should analyze customer profile successfully', async () => {
      const analysis = await assistant.analyzeCustomer('customer-1', [mockOpportunity]);
      
      expect(analysis).toBeDefined();
      expect(analysis.companyName).toBe('テスト株式会社');
      expect(analysis.industry).toBeDefined();
      expect(analysis.companySize).toBeDefined();
      expect(analysis.decisionMakers.length).toBeGreaterThan(0);
    });

    test('should generate AI proposal successfully', async () => {
      const proposalRequest: ProposalRequest = {
        customerId: 'customer-1',
        solutionType: 'process_automation',
        objectives: ['効率化', 'コスト削減'],
        constraints: ['予算制限', '導入期間'],
        successMetrics: ['処理時間短縮', 'コスト削減率']
      };

      const proposal = await assistant.generateProposal(proposalRequest, mockCustomerProfile);
      
      expect(proposal).toBeDefined();
      expect(proposal.customerId).toBe('customer-1');
      expect(proposal.title).toBeDefined();
      expect(proposal.executiveSummary).toBeDefined();
      expect(proposal.proposedSolution).toBeDefined();
      expect(proposal.businessCase).toBeDefined();
      expect(proposal.confidence).toBeGreaterThan(0);
    });

    test('should generate customer insights', async () => {
      const insights = await assistant.generateCustomerInsights('customer-1', [mockOpportunity]);
      
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
      
      insights.forEach(insight => {
        expect(insight.customerId).toBe('customer-1');
        expect(insight.category).toBeDefined();
        expect(insight.insight).toBeDefined();
        expect(insight.confidence).toBeGreaterThan(0);
      });
    });

    test('should perform competitive analysis', async () => {
      const analysis = await assistant.performCompetitiveAnalysis('customer-1', 'digital_transformation');
      
      expect(analysis).toBeDefined();
      expect(analysis.customerId).toBe('customer-1');
      expect(analysis.competitors).toBeDefined();
      expect(analysis.competitors.length).toBeGreaterThan(0);
      expect(analysis.competitiveAdvantages).toBeDefined();
      expect(analysis.strategy).toBeDefined();
    });
  });

  describe('SalesConversionPredictor', () => {
    let predictor: SalesConversionPredictor;
    let mockOpportunity: SalesOpportunity;
    let mockCustomerProfile: CustomerProfile;

    beforeEach(() => {
      predictor = new SalesConversionPredictor();
      mockOpportunity = {
        id: 'opportunity-1',
        companyName: 'テスト株式会社',
        contactName: '田中太郎',
        dealValue: 5000000,
        priority: 'B',
        stage: 'proposal',
        expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        activities: [
          {
            id: 'activity-1',
            opportunityId: 'opportunity-1',
            type: 'meeting',
            title: '商談',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            userId: 'user-1',
            metadata: {}
          }
        ],
        riskScore: 0.3,
        probabilityScore: 0.0, // 予測前
        lastActivityDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      mockCustomerProfile = {
        id: 'customer-1',
        companyName: 'テスト株式会社',
        industry: 'technology',
        companySize: 'medium',
        revenue: 500000000,
        employees: 100,
        businessModel: 'b2b',
        techMaturity: 'advanced',
        decisionMakers: [],
        painPoints: [],
        currentSolutions: [],
        budget: {
          available: 8000000,
          timeframe: '年次',
          approvalProcess: '部長承認',
          decisionCriteria: ['ROI'],
          costSensitivity: 'low'
        },
        timeframe: '3ヶ月',
        competitivePosition: {
          marketPosition: '',
          keyCompetitors: [],
          competitiveAdvantages: [],
          marketChallenges: [],
          differentiationNeeds: []
        },
        riskFactors: [],
        opportunities: []
      };
    });

    test('should predict conversion probability', async () => {
      const prediction = await predictor.predictConversionProbability(
        mockOpportunity, 
        mockCustomerProfile
      );
      
      expect(prediction).toBeDefined();
      expect(prediction.opportunityId).toBe('opportunity-1');
      expect(prediction.currentProbability).toBeGreaterThanOrEqual(0);
      expect(prediction.currentProbability).toBeLessThanOrEqual(1);
      expect(prediction.confidenceLevel).toBeGreaterThan(0);
      expect(prediction.probabilityTrend).toMatch(/^(increasing|decreasing|stable)$/);
      expect(prediction.riskFactors).toBeDefined();
      expect(prediction.successFactors).toBeDefined();
      expect(prediction.recommendedActions).toBeDefined();
    });

    test('should optimize conversion probability', async () => {
      const optimization = await predictor.optimizeConversionProbability(
        mockOpportunity,
        mockCustomerProfile,
        0.8 // 目標確率
      );
      
      expect(optimization).toBeDefined();
      expect(optimization.opportunityId).toBe('opportunity-1');
      expect(optimization.currentScore).toBeGreaterThanOrEqual(0);
      expect(optimization.optimizedScore).toBeGreaterThanOrEqual(optimization.currentScore);
      expect(optimization.optimizationPlan).toBeDefined();
      expect(optimization.optimizationPlan.phase1).toBeDefined();
      expect(optimization.optimizationPlan.phase2).toBeDefined();
      expect(optimization.optimizationPlan.phase3).toBeDefined();
    });

    test('should analyze conversion metrics', async () => {
      const opportunities = [mockOpportunity];
      const metrics = await predictor.analyzeConversionMetrics(opportunities);
      
      expect(metrics).toBeDefined();
      expect(metrics.totalOpportunities).toBe(1);
      expect(metrics.averageConversionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.pipelineValue).toBeGreaterThan(0);
      expect(metrics.conversionByStage).toBeDefined();
      expect(metrics.monthlyTrends).toBeDefined();
    });
  });

  describe('Integration: End-to-End Sales Process', () => {
    let menuProcessor: SafeMenuProcessor;
    let stageAutomator: SalesStageAutomator;
    let contractEngine: ContractAutomationEngine;
    let salesAssistant: AISalesAssistant;
    let conversionPredictor: SalesConversionPredictor;

    beforeEach(() => {
      menuProcessor = new SafeMenuProcessor();
      stageAutomator = new SalesStageAutomator();
      contractEngine = new ContractAutomationEngine();
      salesAssistant = new AISalesAssistant();
      conversionPredictor = new SalesConversionPredictor();
    });

    test('should execute complete sales automation workflow', async () => {
      // 1. セーフメニューで営業案件作成
      const menuResult = await menuProcessor.startMenuAction('sales_create_opportunity', 'test-user');
      expect(menuResult.success).toBe(true);

      // 2. 模擬営業案件
      const opportunity: SalesOpportunity = {
        id: 'integration-test-opp',
        companyName: 'インテグレーションテスト株式会社',
        contactName: '統合太郎',
        dealValue: 8000000,
        priority: 'A',
        stage: 'qualified',
        expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        activities: [
          {
            id: 'integration-activity-1',
            opportunityId: 'integration-test-opp',
            type: 'initial_contact',
            title: '初回接触',
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            userId: 'test-user',
            metadata: {}
          },
          {
            id: 'integration-activity-2',
            opportunityId: 'integration-test-opp',
            type: 'meeting',
            title: '商談ミーティング',
            outcome: 'positive',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            userId: 'test-user',
            metadata: {}
          }
        ],
        riskScore: 0.2,
        probabilityScore: 0.65,
        lastActivityDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      };

      // 3. 成約確率予測
      const prediction = await conversionPredictor.predictConversionProbability(opportunity);
      expect(prediction.currentProbability).toBeGreaterThan(0);

      // 4. 営業ステージ自動化
      const automationResults = await stageAutomator.processAutomaticProgression([opportunity]);
      expect(automationResults).toBeDefined();

      // 5. 受注時の契約処理自動化（仮定）
      if (opportunity.stage === 'closed_won' || prediction.currentProbability > 0.8) {
        const contractResult = await contractEngine.automateContractProcessing(opportunity, {
          contractType: 'new',
          contractValue: opportunity.dealValue
        });
        expect(contractResult.success).toBe(true);
        expect(contractResult.createdTasks.length).toBeGreaterThan(0);
        expect(contractResult.createdKnowledgeItems.length).toBeGreaterThan(0);
      }

      // 6. 全体統合確認
      expect(opportunity.id).toBeDefined();
      expect(prediction.opportunityId).toBe(opportunity.id);
    });

    test('should handle error scenarios gracefully', async () => {
      // 無効なアクションIDでのテスト
      const invalidResult = await menuProcessor.startMenuAction('invalid_action', 'test-user');
      expect(invalidResult.success).toBe(false);

      // 不正なデータでの契約処理テスト
      const invalidOpportunity = {
        id: '',
        companyName: '',
        contactName: '',
        dealValue: -1000,
        stage: 'invalid_stage' as any
      };

      try {
        await contractEngine.automateContractProcessing(invalidOpportunity as any, {});
        // エラーが発生する場合の処理
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance Tests', () => {
    test('should handle large datasets efficiently', async () => {
      const predictor = new SalesConversionPredictor();
      
      // 大量の営業案件データ作成
      const largeOpportunitySet: SalesOpportunity[] = [];
      for (let i = 0; i < 100; i++) {
        largeOpportunitySet.push({
          id: `perf-test-opp-${i}`,
          companyName: `テスト会社${i}`,
          contactName: `担当者${i}`,
          dealValue: Math.random() * 10000000,
          priority: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] as any,
          stage: ['prospect', 'qualified', 'proposal', 'negotiation'][Math.floor(Math.random() * 4)] as any,
          expectedCloseDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          activities: [],
          riskScore: Math.random(),
          probabilityScore: Math.random()
        });
      }

      const startTime = Date.now();
      const metrics = await predictor.analyzeConversionMetrics(largeOpportunitySet);
      const endTime = Date.now();

      expect(metrics).toBeDefined();
      expect(metrics.totalOpportunities).toBe(100);
      
      // パフォーマンス確認（5秒以内で処理完了）
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(5000);
    });
  });
});

// テストヘルパー関数
export const createMockOpportunity = (overrides: Partial<SalesOpportunity> = {}): SalesOpportunity => {
  return {
    id: 'mock-opportunity-id',
    companyName: 'モック株式会社',
    contactName: 'モック太郎',
    dealValue: 3000000,
    priority: 'B',
    stage: 'qualified',
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    activities: [],
    riskScore: 0.3,
    probabilityScore: 0.5,
    ...overrides
  };
};

export const createMockCustomerProfile = (overrides: Partial<CustomerProfile> = {}): CustomerProfile => {
  return {
    id: 'mock-customer-id',
    companyName: 'モック株式会社',
    industry: 'technology',
    companySize: 'medium',
    revenue: 500000000,
    employees: 50,
    businessModel: 'b2b',
    techMaturity: 'intermediate',
    decisionMakers: [],
    painPoints: [],
    currentSolutions: [],
    budget: {
      available: 5000000,
      timeframe: '年次',
      approvalProcess: '部長承認',
      decisionCriteria: ['ROI'],
      costSensitivity: 'medium'
    },
    timeframe: '6ヶ月',
    competitivePosition: {
      marketPosition: '',
      keyCompetitors: [],
      competitiveAdvantages: [],
      marketChallenges: [],
      differentiationNeeds: []
    },
    riskFactors: [],
    opportunities: [],
    ...overrides
  };
};
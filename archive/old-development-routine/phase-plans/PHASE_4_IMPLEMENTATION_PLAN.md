# Phase 4: 営業・アポイント管理システム 実装計画書

**フェーズ期間**: 5日間  
**実装日**: 2025年7月9日 〜 2025年7月13日  
**担当エンジニア**: 営業システム担当  
**前提条件**: Phase 1-3完了、既存営業・アポイント管理機能の理解

---

## 🎯 **Phase 4 実装目標**

### **4.1 主要機能実装**
- **LINE/Discord UI/UX強化**: 自然言語処理による操作自動化（80%目標）
- **営業プロセス完全自動化**: アポイント→契約→バックオフィス連携の全自動化
- **AI営業アシスタント**: 顧客分析・提案生成・交渉支援システム
- **成約確率エンジン**: リアルタイム成約確率算出・最適アクション提案

### **4.2 技術要件**
- 既存営業管理システムの高度化
- 自然言語処理の精度向上
- LINE/Discord API統合強化
- AI支援営業プロセスの完全実装

---

## 📋 **Phase 4 実装チェックリスト**

### **4.1 LINE/Discord自然言語処理強化 (2日)**
- [ ] 高度自然言語処理エンジン実装
- [ ] 意図認識・アクション実行システム
- [ ] コンテキスト理解・継続対話機能
- [ ] 音声・画像認識統合

### **4.2 営業プロセス自動化システム (2日)**
- [ ] アポイント自動スケジューリング
- [ ] 契約処理自動化エンジン
- [ ] バックオフィスタスク自動生成
- [ ] ナレッジ自動蓄積システム

### **4.3 AI営業アシスタント (0.5日)**
- [ ] 顧客分析・インサイト生成
- [ ] 提案書自動生成機能
- [ ] 交渉戦略提案システム
- [ ] 成約最適化エンジン

### **4.4 成約確率エンジン (0.5日)**
- [ ] リアルタイム成約確率算出
- [ ] 成約要因分析システム
- [ ] 最適アクションレコメンド
- [ ] 営業パフォーマンス予測

---

## 🔧 **詳細実装ガイド**

### **4.1 LINE/Discord自然言語処理強化**

#### **4.1.1 高度自然言語処理エンジン実装**
```typescript
// src/services/EnhancedNLPProcessor.ts
import { AI_SERVICE } from './ai-service';

export interface ConversationContext {
  userId: string;
  platform: 'LINE' | 'DISCORD';
  conversationHistory: Array<{
    timestamp: Date;
    message: string;
    intent: string;
    entities: Record<string, any>;
    action: string;
    result: string;
  }>;
  userProfile: {
    role: string;
    preferences: Record<string, any>;
    currentProjects: string[];
    recentActivity: string[];
  };
  currentSession: {
    activeTask: string | null;
    multiStepProcess: string | null;
    awaitingInput: string | null;
  };
}

export interface NLPResult {
  intent: {
    primary: string;
    confidence: number;
    secondary?: string;
  };
  entities: {
    dates?: Date[];
    people?: string[];
    projects?: string[];
    tasks?: string[];
    amounts?: number[];
    locations?: string[];
  };
  sentiment: {
    polarity: number; // -1 to 1
    confidence: number;
  };
  actionPlan: {
    immediateAction: string;
    followUpActions: string[];
    confirmationRequired: boolean;
    additionalInputNeeded: string[];
  };
  response: {
    text: string;
    quickReplies?: string[];
    attachments?: any[];
  };
}

export class EnhancedNLPProcessor {
  private conversationContexts: Map<string, ConversationContext> = new Map();

  constructor(
    private aiService: typeof AI_SERVICE,
    private taskService: any,
    private appointmentService: any,
    private projectService: any
  ) {}

  /**
   * 包括的メッセージ処理
   */
  async processMessage(
    message: string,
    userId: string,
    platform: 'LINE' | 'DISCORD',
    attachments?: any[]
  ): Promise<NLPResult> {
    
    const context = await this.getOrCreateContext(userId, platform);
    const userProfile = await this.getUserProfile(userId);
    
    // 画像・音声処理（添付ファイルがある場合）
    let enhancedMessage = message;
    if (attachments && attachments.length > 0) {
      const mediaAnalysis = await this.processAttachments(attachments);
      enhancedMessage += `\n[添付ファイル分析: ${mediaAnalysis}]`;
    }
    
    // AI による高度自然言語理解
    const nlpAnalysis = await this.aiService.evaluateWithGemini(`
    高度自然言語処理・意図理解:
    
    ユーザー基本情報:
    - ユーザーID: ${userId}
    - 役割: ${userProfile.role}
    - プラットフォーム: ${platform}
    
    現在のコンテキスト:
    - 進行中タスク: ${context.currentSession.activeTask || 'なし'}
    - マルチステップ処理: ${context.currentSession.multiStepProcess || 'なし'}
    - 待機中入力: ${context.currentSession.awaitingInput || 'なし'}
    
    最近の会話履歴 (直近5件):
    ${context.conversationHistory.slice(-5).map(conv => 
      `- ${conv.timestamp.toISOString()}: ${conv.message} → ${conv.intent} (${conv.action})`
    ).join('\n')}
    
    現在進行中プロジェクト:
    ${userProfile.currentProjects.map(p => `- ${p}`).join('\n')}
    
    入力メッセージ: "${enhancedMessage}"
    
    以下の観点で包括的な自然言語理解を実行:
    
    1. 意図理解・分類:
       - 主要意図: タスク操作/アポイント管理/情報取得/報告・更新/承認依頼/その他
       - 信頼度スコア (0-1)
       - 副次的意図（複合的な要求の場合）
    
    2. エンティティ抽出:
       - 日時表現: 「明日の午後」「来週の金曜日」など自然な表現を正確な日時に変換
       - 人物・組織名: メンション・名前・役職の識別
       - プロジェクト・タスク名: 既存データとの照合・類似性判定
       - 数値・金額: 数字表現の正規化
       - 場所・位置情報: 住所・施設名・オンライン会議室等
    
    3. 感情・トーン分析:
       - 感情極性: ポジティブ/ニュートラル/ネガティブ
       - 緊急度: 急ぎ/通常/余裕あり
       - 重要度: 高/中/低
    
    4. アクション決定:
       - 即座実行可能なアクション
       - 追加情報が必要なアクション
       - 確認が必要なアクション
       - 複数ステップが必要なプロセス
    
    5. コンテキスト継続性:
       - 前回の会話との関連性
       - 未完了タスクとの関係
       - セッション継続の必要性
    
    6. 応答生成:
       - 自然で親しみやすい応答文
       - 必要に応じたクイックリプライ選択肢
       - 追加情報・確認事項の明示
    
    特に以下のユースケースに対応:
    
    タスク関連:
    - "明日までにReactの作業終わらせる" → タスク作成・期限設定
    - "今やってるタスクの進捗どう？" → 進捗確認・報告
    - "A案件のタスクをBさんに移す" → 担当者変更
    
    アポイント関連:
    - "来週C社と打ち合わせ入れて" → アポイント作成・調整
    - "金曜日の会議の資料準備完了" → ステータス更新
    - "D社との契約成立したよ" → 契約処理開始
    
    情報取得:
    - "今月の売上実績教えて" → データ検索・集計
    - "E社の過去案件の情報は？" → 履歴検索・表示
    - "来週のスケジュール確認" → カレンダー情報取得
    
    回答形式:
    {
      "intent": {
        "primary": "TASK_CREATION",
        "confidence": 0.95,
        "secondary": "DEADLINE_SETTING"
      },
      "entities": {
        "dates": ["2025-07-15T23:59:59Z"],
        "people": ["田中さん"],
        "projects": ["React開発プロジェクト"],
        "tasks": ["UI実装"],
        "amounts": [100000]
      },
      "sentiment": {
        "polarity": 0.2,
        "confidence": 0.8
      },
      "actionPlan": {
        "immediateAction": "CREATE_TASK",
        "followUpActions": ["SEND_NOTIFICATION", "UPDATE_PROJECT_STATUS"],
        "confirmationRequired": true,
        "additionalInputNeeded": ["priority", "estimatedHours"]
      },
      "response": {
        "text": "React作業のタスクを明日期限で作成しますね！優先度と予想工数を教えてください。",
        "quickReplies": ["優先度: 高", "優先度: 中", "優先度: 低"],
        "attachments": []
      }
    }
    `);

    const result = this.parseNLPResult(nlpAnalysis);
    
    // コンテキスト更新
    await this.updateContext(userId, message, result);
    
    // アクション実行
    await this.executeAction(result, userId, context);
    
    return result;
  }

  /**
   * マルチステッププロセス管理
   */
  async handleMultiStepProcess(
    userId: string,
    processType: string,
    currentStep: number,
    userInput: string
  ): Promise<{
    nextStep: number;
    completed: boolean;
    response: string;
    data: Record<string, any>;
  }> {
    
    const context = this.conversationContexts.get(userId);
    const processDefinition = await this.getProcessDefinition(processType);
    
    const stepAnalysis = await this.aiService.evaluateWithGemini(`
    マルチステッププロセス管理:
    
    プロセス: ${processType}
    現在ステップ: ${currentStep}/${processDefinition.totalSteps}
    ユーザー入力: "${userInput}"
    
    プロセス定義:
    ${processDefinition.steps.map((step, index) => 
      `${index + 1}. ${step.name}: ${step.description}`
    ).join('\n')}
    
    現在の収集データ:
    ${Object.entries(context?.currentSession || {}).map(([key, value]) => 
      `- ${key}: ${value}`
    ).join('\n')}
    
    次のステップ判定と応答生成:
    
    回答形式: JSON
    `);

    return this.parseStepResult(stepAnalysis);
  }

  /**
   * 音声・画像認識処理
   */
  private async processAttachments(attachments: any[]): Promise<string> {
    const analyses = [];
    
    for (const attachment of attachments) {
      if (attachment.type === 'image') {
        const imageAnalysis = await this.analyzeImage(attachment.url);
        analyses.push(`画像: ${imageAnalysis}`);
      } else if (attachment.type === 'audio') {
        const audioTranscription = await this.transcribeAudio(attachment.url);
        analyses.push(`音声: ${audioTranscription}`);
      } else if (attachment.type === 'document') {
        const documentAnalysis = await this.analyzeDocument(attachment.url);
        analyses.push(`文書: ${documentAnalysis}`);
      }
    }
    
    return analyses.join(', ');
  }

  /**
   * 画像解析（スクリーンショット、図表、写真等）
   */
  private async analyzeImage(imageUrl: string): Promise<string> {
    const analysis = await this.aiService.analyzeImage(imageUrl, `
    この画像を分析して以下の情報を抽出:
    
    1. 画像タイプ: スクリーンショット/図表/写真/その他
    2. 含まれるテキスト: OCRによるテキスト抽出
    3. ビジュアル要素: グラフ/表/UI要素/その他
    4. ビジネス関連情報: データ/メトリクス/進捗/課題等
    5. アクション可能な情報: 作成すべきタスク/記録すべき情報等
    
    簡潔に要約して返答。
    `);
    
    return analysis || '画像解析に失敗しました';
  }

  /**
   * 音声文字起こし・解析
   */
  private async transcribeAudio(audioUrl: string): Promise<string> {
    // 音声文字起こしサービス連携
    const transcription = await this.audioTranscriptionService.transcribe(audioUrl);
    
    const analysis = await this.aiService.evaluateWithGemini(`
    音声文字起こし結果の分析:
    
    文字起こしテキスト: "${transcription}"
    
    以下の観点で分析:
    1. 主要な内容・メッセージ
    2. アクション項目・TODO
    3. 重要な数値・日付・名前
    4. 感情・トーン・緊急度
    
    簡潔に要約して返答。
    `);
    
    return analysis || transcription || '音声解析に失敗しました';
  }

  /**
   * アクション実行エンジン
   */
  private async executeAction(
    nlpResult: NLPResult,
    userId: string,
    context: ConversationContext
  ): Promise<void> {
    
    const action = nlpResult.actionPlan.immediateAction;
    
    try {
      switch (action) {
        case 'CREATE_TASK':
          await this.createTaskFromNLP(nlpResult, userId);
          break;
          
        case 'UPDATE_TASK':
          await this.updateTaskFromNLP(nlpResult, userId);
          break;
          
        case 'CREATE_APPOINTMENT':
          await this.createAppointmentFromNLP(nlpResult, userId);
          break;
          
        case 'UPDATE_APPOINTMENT':
          await this.updateAppointmentFromNLP(nlpResult, userId);
          break;
          
        case 'SEARCH_INFORMATION':
          await this.searchInformationFromNLP(nlpResult, userId);
          break;
          
        case 'GENERATE_REPORT':
          await this.generateReportFromNLP(nlpResult, userId);
          break;
          
        case 'APPROVE_REQUEST':
          await this.processApprovalFromNLP(nlpResult, userId);
          break;
          
        default:
          console.log(`Unknown action: ${action}`);
      }
      
      // フォローアップアクション実行
      for (const followUpAction of nlpResult.actionPlan.followUpActions) {
        await this.executeFollowUpAction(followUpAction, nlpResult, userId);
      }
      
    } catch (error) {
      console.error('Action execution error:', error);
      // エラー処理・ユーザー通知
      await this.notifyActionError(userId, action, error);
    }
  }

  /**
   * タスク作成（自然言語から）
   */
  private async createTaskFromNLP(nlpResult: NLPResult, userId: string): Promise<void> {
    const entities = nlpResult.entities;
    
    const taskData = {
      title: this.extractTaskTitle(nlpResult),
      description: this.extractTaskDescription(nlpResult),
      dueDate: entities.dates?.[0] || null,
      assignedTo: entities.people?.[0] ? await this.resolvePersonToUserId(entities.people[0]) : userId,
      projectId: entities.projects?.[0] ? await this.resolveProjectId(entities.projects[0]) : null,
      priority: this.extractPriority(nlpResult),
      estimatedHours: this.extractEstimatedHours(nlpResult),
      createdBy: userId
    };
    
    const task = await this.taskService.create(taskData);
    
    // 成功通知
    await this.sendPlatformMessage(userId, `タスク「${task.title}」を作成しました！`);
  }

  // ヘルパーメソッド
  private async getOrCreateContext(userId: string, platform: 'LINE' | 'DISCORD'): Promise<ConversationContext> {
    if (!this.conversationContexts.has(userId)) {
      const userProfile = await this.getUserProfile(userId);
      const context: ConversationContext = {
        userId,
        platform,
        conversationHistory: [],
        userProfile,
        currentSession: {
          activeTask: null,
          multiStepProcess: null,
          awaitingInput: null
        }
      };
      this.conversationContexts.set(userId, context);
    }
    
    return this.conversationContexts.get(userId)!;
  }

  private parseNLPResult(aiResponse: string): NLPResult {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('NLP result parsing error:', error);
      return {
        intent: { primary: 'UNKNOWN', confidence: 0.1 },
        entities: {},
        sentiment: { polarity: 0, confidence: 0.5 },
        actionPlan: {
          immediateAction: 'MANUAL_HANDLING',
          followUpActions: [],
          confirmationRequired: true,
          additionalInputNeeded: []
        },
        response: {
          text: '申し訳ございません。メッセージを理解できませんでした。もう少し具体的に教えてください。',
          quickReplies: ['タスク作成', 'アポイント確認', 'プロジェクト状況']
        }
      };
    }
  }
}
```

### **4.2 営業プロセス自動化システム**

#### **4.2.1 包括的営業自動化エンジン**
```typescript
// src/services/SalesProcessAutomator.ts
import { AI_SERVICE } from './ai-service';

export interface SalesProcessState {
  appointmentId: string;
  currentPhase: 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSING' | 'CONTRACT';
  processingStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  relationshipStatus: 'FIRST_CONTACT' | 'RAPPORT_BUILDING' | 'TRUST_ESTABLISHED' | 'PARTNER';
  automatedActions: Array<{
    action: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    scheduledAt: Date;
    completedAt?: Date;
    result?: string;
  }>;
  nextRecommendedAction: {
    action: string;
    timing: Date;
    reasoning: string;
    probability: number;
  };
}

export interface ContractProcessingResult {
  contractId: string;
  backOfficeTasksCreated: Array<{
    taskId: string;
    title: string;
    assignee: string;
    dueDate: Date;
  }>;
  knowledgeItemsGenerated: Array<{
    knowledgeId: string;
    title: string;
    category: string;
  }>;
  followUpAppointments: Array<{
    appointmentId: string;
    purpose: string;
    scheduledDate: Date;
  }>;
  automatedNotifications: string[];
}

export class SalesProcessAutomator {
  constructor(
    private aiService: typeof AI_SERVICE,
    private appointmentService: any,
    private taskService: any,
    private knowledgeService: any,
    private connectionService: any
  ) {}

  /**
   * 営業プロセス状態監視・自動進行
   */
  async monitorAndAdvanceSalesProcess(appointmentId: string): Promise<SalesProcessState> {
    
    const appointment = await this.appointmentService.getAppointment(appointmentId);
    const connectionAnalysis = await this.getConnectionAnalysis(appointment.connectionId);
    const interactionHistory = await this.getInteractionHistory(appointment.connectionId);
    const currentState = await this.getCurrentProcessState(appointmentId);
    
    const processAnalysis = await this.aiService.evaluateWithGemini(`
    営業プロセス状態分析・自動進行判定:
    
    アポイント情報:
    - ID: ${appointmentId}
    - 企業: ${appointment.companyName}
    - 目的: ${appointment.purpose}
    - 現在フェーズ: ${currentState.currentPhase}
    - 処理状況: ${currentState.processingStatus}
    - 関係性: ${currentState.relationshipStatus}
    
    コネクション分析:
    - 関係性スコア: ${connectionAnalysis.relationshipScore}/100
    - 成功確率: ${connectionAnalysis.successProbability}
    - 予測LTV: ${connectionAnalysis.predictedLTV}円
    
    最近のインタラクション:
    ${interactionHistory.slice(-5).map(interaction => 
      `- ${interaction.date}: ${interaction.type} - ${interaction.summary}`
    ).join('\n')}
    
    現在の自動化アクション状況:
    ${currentState.automatedActions.map(action => 
      `- ${action.action}: ${action.status}`
    ).join('\n')}
    
    以下の観点で営業プロセス分析・進行判定:
    
    1. フェーズ進行判定:
       - 現在フェーズの完了条件達成度
       - 次フェーズへの移行可能性
       - 必要な追加アクション・情報
    
    2. 関係性発展評価:
       - 信頼関係の構築度
       - 意思決定プロセスの理解度
       - キーパーソンとの接触状況
    
    3. 成約可能性分析:
       - 現在の成約確率
       - 主要な成約阻害要因
       - 成約確率向上のための施策
    
    4. 自動化アクション判定:
       - 実行すべき自動アクション
       - タイミング・順序の最適化
       - 手動介入が必要な領域
    
    5. 次ステップ推奨:
       - 最も効果的な次のアクション
       - 実行タイミングの最適化
       - 期待される結果・影響
    
    営業プロセス別の自動化判定:
    
    LEAD → QUALIFIED:
    - 基本情報収集完了度
    - 予算・権限・ニーズ・タイムラインの確認
    - 初回提案資料の準備状況
    
    QUALIFIED → PROPOSAL:
    - 詳細要件の把握度
    - 提案書・見積もりの準備完了
    - プレゼンテーション日程の調整
    
    PROPOSAL → NEGOTIATION:
    - 提案に対する反応・フィードバック
    - 価格・条件交渉の開始
    - 競合他社との比較状況
    
    NEGOTIATION → CLOSING:
    - 主要条件の合意状況
    - 意思決定者の承認プロセス
    - 契約締結の準備状況
    
    CLOSING → CONTRACT:
    - 契約書作成・確認完了
    - 署名・捺印の手続き状況
    - バックオフィス連携の必要性
    
    回答形式:
    {
      "appointmentId": "${appointmentId}",
      "currentPhase": "PROPOSAL",
      "processingStatus": "IN_PROGRESS",
      "relationshipStatus": "TRUST_ESTABLISHED",
      "automatedActions": [
        {
          "action": "提案書作成・送付",
          "status": "PENDING",
          "scheduledAt": "2025-07-15T10:00:00Z",
          "result": null
        }
      ],
      "nextRecommendedAction": {
        "action": "フォローアップ電話",
        "timing": "2025-07-16T14:00:00Z",
        "reasoning": "提案書送付後24時間以内の反応確認",
        "probability": 0.8
      }
    }
    `);

    const newState = this.parseProcessState(processAnalysis);
    
    // 自動アクション実行
    await this.executeAutomatedActions(newState);
    
    // 状態更新・保存
    await this.saveProcessState(appointmentId, newState);
    
    return newState;
  }

  /**
   * 契約処理完全自動化
   */
  async processContractCompletion(
    appointmentId: string,
    contractDetails: {
      contractValue: number;
      contractType: string;
      duration: number;
      startDate: Date;
      specialTerms?: string[];
    }
  ): Promise<ContractProcessingResult> {
    
    const appointment = await this.appointmentService.getAppointment(appointmentId);
    const connection = await this.connectionService.getConnection(appointment.connectionId);
    
    // AI による包括的契約処理計画
    const processingPlan = await this.aiService.evaluateWithGemini(`
    契約処理完全自動化計画:
    
    契約基本情報:
    - 契約金額: ${contractDetails.contractValue}円
    - 契約タイプ: ${contractDetails.contractType}
    - 期間: ${contractDetails.duration}ヶ月
    - 開始日: ${contractDetails.startDate}
    - 特記事項: ${contractDetails.specialTerms?.join(', ') || 'なし'}
    
    顧客情報:
    - 企業名: ${connection.companyName}
    - 業界: ${connection.industry}
    - 規模: ${connection.employeeCount}名
    - 過去取引: ${connection.projectHistory?.length || 0}件
    
    以下の要素を包括的に自動化:
    
    1. バックオフィスタスク自動生成:
       - 契約書作成・確認・締結
       - 請求書発行・入金確認
       - プロジェクト立ち上げ・チーム編成
       - キックオフ会議・初回打ち合わせ
       - 進捗管理・報告体制構築
    
    2. ナレッジ自動蓄積:
       - 営業プロセス・成功要因の記録
       - 顧客特性・ニーズの分析
       - 提案内容・差別化ポイント
       - 競合比較・勝因分析
    
    3. フォローアップ自動化:
       - 契約後の関係維持施策
       - 追加案件の機会創出
       - 顧客満足度向上施策
       - 長期的パートナーシップ構築
    
    4. チーム・リソース調整:
       - プロジェクトチーム編成
       - 必要リソースの確保・調整
       - スケジュール・マイルストーン設定
       - 責任者・窓口の明確化
    
    回答形式:
    {
      "backOfficeTasks": [
        {
          "title": "契約書作成・リーガルチェック",
          "assignee": "legal_team",
          "dueDate": "2025-07-20T17:00:00Z",
          "priority": "A",
          "description": "契約条件に基づく契約書作成と法務確認"
        }
      ],
      "knowledgeItems": [
        {
          "title": "営業成功事例: ${connection.companyName}",
          "category": "SALES_SUCCESS",
          "content": "詳細な営業プロセス・成功要因分析..."
        }
      ],
      "followUpAppointments": [
        {
          "purpose": "キックオフ会議",
          "scheduledDate": "2025-07-25T10:00:00Z",
          "duration": 120,
          "participants": ["customer_pm", "our_pm"]
        }
      ],
      "notifications": [
        "営業チームへの成約報告",
        "プロジェクトチームへの開始通知",
        "経営陣への売上報告"
      ]
    }
    `);

    const plan = this.parseProcessingPlan(processingPlan);
    
    // 1. バックオフィスタスク作成
    const createdTasks = await this.createBackOfficeTasks(plan.backOfficeTasks, appointmentId);
    
    // 2. ナレッジ自動生成・保存
    const generatedKnowledge = await this.generateContractKnowledge(plan.knowledgeItems, appointment, contractDetails);
    
    // 3. フォローアップアポイント作成
    const followUpAppointments = await this.createFollowUpAppointments(plan.followUpAppointments, appointment.connectionId);
    
    // 4. 自動通知送信
    await this.sendAutomatedNotifications(plan.notifications, appointmentId, contractDetails);
    
    // 5. 契約情報更新
    await this.updateContractInformation(appointmentId, contractDetails);
    
    return {
      contractId: `contract_${appointmentId}_${Date.now()}`,
      backOfficeTasksCreated: createdTasks,
      knowledgeItemsGenerated: generatedKnowledge,
      followUpAppointments: followUpAppointments,
      automatedNotifications: plan.notifications
    };
  }

  /**
   * 営業パフォーマンス予測・最適化
   */
  async optimizeSalesPerformance(
    salesPersonId: string,
    timeframe: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
  ): Promise<{
    currentPerformance: {
      conversionRate: number;
      averageDealSize: number;
      salesCycleLength: number;
      pipelineHealth: number;
    };
    predictedPerformance: {
      expectedRevenue: number;
      probabilityRange: { min: number; max: number };
      keyRiskFactors: string[];
    };
    optimizationRecommendations: Array<{
      area: string;
      currentValue: number;
      targetValue: number;
      actions: string[];
      expectedImpact: number;
    }>;
  }> {
    
    const salesData = await this.getSalesPersonData(salesPersonId, timeframe);
    const pipelineAnalysis = await this.analyzePipeline(salesPersonId);
    const marketContext = await this.getMarketContext();
    
    const optimization = await this.aiService.evaluateWithGemini(`
    営業パフォーマンス最適化分析:
    
    営業担当者: ${salesPersonId}
    分析期間: ${timeframe}
    
    現在のパフォーマンス:
    ${Object.entries(salesData.performance).map(([key, value]) => 
      `- ${key}: ${value}`
    ).join('\n')}
    
    パイプライン状況:
    ${pipelineAnalysis.stages.map(stage => 
      `- ${stage.name}: ${stage.deals}件 (${stage.totalValue}円)`
    ).join('\n')}
    
    市場コンテキスト:
    - 業界平均成約率: ${marketContext.industryConversionRate}%
    - 平均営業サイクル: ${marketContext.averageSalesCycle}日
    - 市場成長率: ${marketContext.marketGrowthRate}%
    
    パフォーマンス最適化分析・推奨事項:
    
    回答形式: JSON
    `);

    return this.parseOptimizationAnalysis(optimization);
  }

  // ヘルパーメソッド
  private async executeAutomatedActions(state: SalesProcessState): Promise<void> {
    for (const action of state.automatedActions) {
      if (action.status === 'PENDING' && new Date() >= action.scheduledAt) {
        try {
          await this.executeSpecificAction(action.action, state.appointmentId);
          action.status = 'COMPLETED';
          action.completedAt = new Date();
        } catch (error) {
          action.status = 'FAILED';
          action.result = error.message;
        }
      }
    }
  }

  private async createBackOfficeTasks(
    taskPlans: any[],
    appointmentId: string
  ): Promise<Array<{
    taskId: string;
    title: string;
    assignee: string;
    dueDate: Date;
  }>> {
    
    const createdTasks = [];
    
    for (const plan of taskPlans) {
      const task = await this.taskService.create({
        title: plan.title,
        description: plan.description,
        assignedTo: plan.assignee,
        dueDate: plan.dueDate,
        priority: plan.priority,
        relatedAppointmentId: appointmentId,
        isBackOfficeTask: true,
        tags: ['contract_processing', 'automated']
      });
      
      createdTasks.push({
        taskId: task.id,
        title: task.title,
        assignee: task.assignedTo,
        dueDate: task.dueDate
      });
    }
    
    return createdTasks;
  }

  private async generateContractKnowledge(
    knowledgePlans: any[],
    appointment: any,
    contractDetails: any
  ): Promise<Array<{
    knowledgeId: string;
    title: string;
    category: string;
  }>> {
    
    const generatedKnowledge = [];
    
    for (const plan of knowledgePlans) {
      const knowledge = await this.knowledgeService.create({
        title: plan.title,
        category: plan.category,
        content: plan.content,
        tags: ['sales_success', 'contract', appointment.companyName],
        autoGenerated: true,
        sourceType: 'CONTRACT_COMPLETION',
        sourceDocumentId: appointment.id,
        relatedAppointmentId: appointment.id,
        contractValue: contractDetails.contractValue
      });
      
      generatedKnowledge.push({
        knowledgeId: knowledge.id,
        title: knowledge.title,
        category: knowledge.category
      });
    }
    
    return generatedKnowledge;
  }

  private parseProcessState(aiResponse: string): SalesProcessState {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('Process state parsing error:', error);
      return this.getDefaultProcessState();
    }
  }

  private getDefaultProcessState(): SalesProcessState {
    return {
      appointmentId: '',
      currentPhase: 'LEAD',
      processingStatus: 'PENDING',
      relationshipStatus: 'FIRST_CONTACT',
      automatedActions: [],
      nextRecommendedAction: {
        action: '手動で営業プロセスを確認してください',
        timing: new Date(),
        reasoning: 'AI分析に失敗しました',
        probability: 0.5
      }
    };
  }
}
```

---

## 🧪 **Phase 4 テスト計画**

### **4.1 自然言語処理テスト**
```typescript
// __tests__/EnhancedNLPProcessor.test.ts
describe('Enhanced NLP Processor', () => {
  test('Task creation from natural language', async () => {
    const processor = new EnhancedNLPProcessor();
    const result = await processor.processMessage(
      '明日までにReactの画面作成を田中さんにお願いします',
      'user123',
      'LINE'
    );
    
    expect(result.intent.primary).toBe('TASK_CREATION');
    expect(result.entities.dates).toHaveLength(1);
    expect(result.entities.people).toContain('田中さん');
    expect(result.actionPlan.immediateAction).toBe('CREATE_TASK');
  });

  test('Appointment scheduling from natural language', async () => {
    const processor = new EnhancedNLPProcessor();
    const result = await processor.processMessage(
      '来週の金曜日にA社と打ち合わせをセットしてください',
      'user123',
      'DISCORD'
    );
    
    expect(result.intent.primary).toBe('CREATE_APPOINTMENT');
    expect(result.entities.dates).toHaveLength(1);
    expect(result.actionPlan.immediateAction).toBe('CREATE_APPOINTMENT');
  });
});
```

### **4.2 営業自動化テスト**
```typescript
// __tests__/SalesProcessAutomator.test.ts
describe('Sales Process Automator', () => {
  test('Contract processing automation', async () => {
    const automator = new SalesProcessAutomator();
    const result = await automator.processContractCompletion(
      'appointment123',
      {
        contractValue: 1000000,
        contractType: 'DEVELOPMENT',
        duration: 6,
        startDate: new Date('2025-08-01')
      }
    );
    
    expect(result.backOfficeTasksCreated.length).toBeGreaterThan(0);
    expect(result.knowledgeItemsGenerated.length).toBeGreaterThan(0);
    expect(result.contractId).toBeTruthy();
  });
});
```

---

## 📊 **Phase 4 成功指標**

### **4.1 自然言語処理精度**
- [ ] **意図認識精度**: 90%以上
- [ ] **エンティティ抽出精度**: 85%以上
- [ ] **アクション実行成功率**: 95%以上

### **4.2 営業自動化効率**
- [ ] **契約処理自動化率**: 80%以上
- [ ] **バックオフィス連携**: 100%自動化
- [ ] **ナレッジ生成率**: 契約の90%以上

### **4.3 システムパフォーマンス**
- [ ] **NLP応答時間**: < 3秒
- [ ] **営業プロセス分析**: < 5秒
- [ ] **契約処理完了**: < 30秒

---

## ⚠️ **Phase 4 注意事項**

### **4.1 データプライバシー**
- 顧客情報の適切な暗号化
- 音声・画像データの安全な処理
- GDPR・個人情報保護法の遵守

### **4.2 自動化の制限**
- 重要な意思決定は人間による確認
- 契約条件の最終確認は手動
- 顧客とのコミュニケーションは自然な表現

---

**Phase 4 完了基準**: 自然言語処理精度目標達成、営業自動化システム完全動作、統合テスト合格
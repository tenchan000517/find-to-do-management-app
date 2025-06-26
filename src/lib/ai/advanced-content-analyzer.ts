// 高精度AI分析エンジン - 品質重視・高閾値設計
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { AIJsonParser } from '../utils/ai-json-parser';

const prisma = new PrismaClient();

// Gemini AI初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// 高精度分析用の型定義
export interface AdvancedAnalysisResult {
  sections: ContentSection[];
  clusters: SectionCluster[];
  highConfidenceEntities: HighConfidenceEntities;
  projectCandidates: ProjectCandidate[];
  overallInsights: OverallInsights;
  agenda?: string; // 議題フィールドを追加
}

export interface ContentSection {
  id: string;
  title?: string;
  content: string;
  startIndex: number;
  endIndex: number;
  topics: string[];
  entityMentions: EntityMention[];
  density: number; // エンティティ密度
}

export interface SectionCluster {
  id: string;
  sections: string[]; // section IDs
  commonTopics: string[];
  totalEntityCount: number;
  monetizationPotential: number; // 0-1
  executabilityScore: number; // 0-1
  densityScore: number; // 0-1
}

export interface HighConfidenceEntities {
  tasks: HighConfidenceTask[];
  appointments: HighConfidenceAppointment[];
  connections: HighConfidenceConnection[];
  events: HighConfidenceEvent[];
  personalSchedules: HighConfidencePersonalSchedule[];
}

export interface HighConfidenceTask {
  title: string;
  description: string;
  priority: 'A' | 'B' | 'C' | 'D';
  dueDate?: string;
  estimatedHours?: number;
  assignee?: string;
  confidence: number; // >= 0.7
  sourceSection: string;
  context: string; // 前後の文脈
  actionability: number; // 実行可能性
}

export interface HighConfidenceAppointment {
  companyName: string;
  contactName: string;
  purpose: string; // 商談目的
  expectedValue?: number; // 予想売上
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // >= 0.8
  sourceSection: string;
  businessContext: string;
  monetizationIndicators: string[]; // マネタイズ指標
}

export interface HighConfidenceConnection {
  name: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  type: 'COMPANY' | 'STUDENT';
  confidence: number; // >= 0.6
  sourceSection: string;
  existsInSystem: boolean; // 既存照合結果
  businessRelevance: number; // ビジネス関連度
}

export interface HighConfidenceEvent {
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  participants: string[];
  type: 'MEETING' | 'EVENT';
  confidence: number; // >= 0.7
  sourceSection: string;
  businessImpact: number; // ビジネスインパクト
}

export interface HighConfidencePersonalSchedule {
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  confidence: number; // >= 0.6
  sourceSection: string;
  isPersonal: boolean; // 個人予定判定
}

export interface ProjectCandidate {
  name: string;
  description: string;
  phase: string;
  priority: 'A' | 'B' | 'C' | 'D';
  clusterIds: string[]; // 関連クラスター
  densityScore: number; // >= 0.8
  monetizationScore: number; // >= 0.7
  executabilityScore: number; // >= 0.8
  relatedTasks: number;
  relatedAppointments: number;
  estimatedValue?: number;
  keyStakeholders: string[];
  confidence: number; // 総合信頼度
}

export interface OverallInsights {
  documentType: 'meeting_notes' | 'planning_document' | 'project_review' | 'mixed_discussions';
  businessValue: number;
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  keyTopics: string[];
  actionItemsCount: number;
  projectPotentialCount: number;
  confidence: number;
  title: string;
  summary: string;
  agenda?: string; // 議題フィールドを追加
}

export interface EntityMention {
  type: 'person' | 'company' | 'task' | 'date' | 'amount';
  text: string;
  confidence: number;
  context: string;
}

// 高精度分析エンジンクラス
export class AdvancedContentAnalyzer {
  private static instance: AdvancedContentAnalyzer;

  // 高精度分析の閾値設定
  private static readonly THRESHOLDS = {
    TASK_CONFIDENCE: 0.6,
    APPOINTMENT_CONFIDENCE: 0.8,
    CONNECTION_CONFIDENCE: 0.6,
    EVENT_CONFIDENCE: 0.6,
    PERSONAL_SCHEDULE_CONFIDENCE: 0.6,
    PROJECT_DENSITY: 0.8,
    PROJECT_MONETIZATION: 0.7,
    PROJECT_EXECUTABILITY: 0.8,
    MIN_CLUSTER_ENTITIES: 4,
    MIN_CONTENT_LENGTH: 200, // 短すぎるコンテンツは分析しない（原文保存を促進）
  };

  static getInstance(): AdvancedContentAnalyzer {
    if (!this.instance) {
      this.instance = new AdvancedContentAnalyzer();
    }
    return this.instance;
  }

  // メイン分析エントリーポイント
  async analyzeContent(content: string, documentTitle: string = ''): Promise<AdvancedAnalysisResult> {
    console.log(`🧠 高精度分析開始: ${documentTitle} (${content.length}文字)`);
    const startTime = Date.now();

    // 最小長チェック
    if (content.length < AdvancedContentAnalyzer.THRESHOLDS.MIN_CONTENT_LENGTH) {
      console.log(`⏭️ コンテンツが短すぎるため分析をスキップ - 原文保存 (${content.length}文字)`);
      return this.createEmptyResultWithOriginalContent(content.trim(), documentTitle);
    }

    try {
      // Step 1: セクション分割
      console.log(`📄 Step 1: セクション分割開始`);
      const sections = await this.extractSections(content);
      console.log(`📄 セクション分割完了: ${sections.length}セクション (${Date.now() - startTime}ms)`);

      // Step 2: セクションクラスタリング
      console.log(`🔗 Step 2: クラスタリング開始`);
      const clusters = await this.clusterSections(sections);
      console.log(`🔗 クラスタリング完了: ${clusters.length}クラスター (${Date.now() - startTime}ms)`);

      // Step 3: 高精度エンティティ抽出
      console.log(`🎯 Step 3: エンティティ抽出開始`);
      const entities = await this.extractHighConfidenceEntities(sections);
      console.log(`🎯 高精度エンティティ抽出完了: タスク${entities.tasks.length}件、アポ${entities.appointments.length}件 (${Date.now() - startTime}ms)`);

      // Step 4: プロジェクト候補分析
      console.log(`🚀 Step 4: プロジェクト候補分析開始`);
      const projectCandidates = await this.analyzeProjectCandidates(clusters, entities);
      console.log(`🚀 プロジェクト候補分析完了: ${projectCandidates.length}件 (${Date.now() - startTime}ms)`);

      // Step 5: 議題抽出
      console.log(`🎯 Step 5: 議題抽出開始`);
      const agenda = await this.extractAgenda(content);
      console.log(`🎯 議題抽出結果: "${agenda}" (${Date.now() - startTime}ms)`);

      // Step 6: 全体洞察
      console.log(`💡 Step 6: 全体洞察生成開始`);
      const insights = await this.generateOverallInsights(content, documentTitle, entities, projectCandidates, agenda);
      console.log(`💡 全体洞察生成完了 (${Date.now() - startTime}ms)`);

      const totalTime = Date.now() - startTime;
      console.log(`✅ 高精度分析完了: 総時間${totalTime}ms`);

      return {
        sections,
        clusters,
        highConfidenceEntities: entities,
        projectCandidates,
        overallInsights: insights,
        agenda // 議題を結果に追加
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ 高精度分析エラー (${totalTime}ms):`, error);
      console.error(`❌ エラー詳細:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        contentLength: content.length,
        documentTitle
      });
      return this.createEmptyResult();
    }
  }

  // セクション分割
  private async extractSections(content: string): Promise<ContentSection[]> {
    const prompt = `
以下の日本語ドキュメントを話題別のセクションに分割してください。
各セクションは独立した議論・話題・会議内容を表します。

**ドキュメント:**
${content}

**回答形式 (JSON):**
{
  "sections": [
    {
      "title": "セクションタイトル", // 無い場合は null
      "content": "セクションの本文",
      "topics": ["トピック1", "トピック2"], // 主要トピック
      "startIndex": 0, // 元テキストでの開始位置（概算）
      "endIndex": 100 // 元テキストでの終了位置（概算）
    }
  ]
}

**重要な指示:**
- 明確に異なる話題は分割する
- 同じ話題の続きは統合する
- 短すぎるセクション（100文字未満）は前後と統合
- topics は最大3個まで
`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = this.parseJSONResponse(responseText);

      return parsed.sections.map((section: any, index: number) => ({
        id: `section_${index}`,
        title: section.title,
        content: section.content,
        startIndex: section.startIndex || 0,
        endIndex: section.endIndex || section.content.length,
        topics: section.topics || [],
        entityMentions: [], // 後で埋める
        density: 0 // 後で計算
      }));

    } catch (error) {
      console.warn('セクション分割失敗、フォールバック使用:', error);
      return this.fallbackSectionSplit(content);
    }
  }

  // セクションクラスタリング
  private async clusterSections(sections: ContentSection[]): Promise<SectionCluster[]> {
    if (sections.length <= 1) return [];

    const prompt = `
以下のセクションを、関連性の高い話題でグループ化してください。
プロジェクト化の可能性、マネタイズ可能性、実行可能性を重視してください。

**セクション一覧:**
${sections.map((s, i) => `
セクション${i}: ${s.title || '無題'}
トピック: ${s.topics.join(', ')}
内容サマリー: ${s.content.substring(0, 200)}...
`).join('\n')}

**回答形式 (JSON):**
{
  "clusters": [
    {
      "sections": [0, 1], // セクションインデックス
      "commonTopics": ["共通トピック1", "共通トピック2"],
      "monetizationPotential": 0.8, // 0-1, マネタイズ可能性
      "executabilityScore": 0.7, // 0-1, 実行可能性
      "description": "クラスターの説明"
    }
  ]
}

**クラスタリング基準:**
- 同じプロジェクト・案件に関連するセクション
- 同じ顧客・会社に関連するセクション
- 同じ技術・機能に関連するセクション
- マネタイズ可能性が高い組み合わせ
`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = this.parseJSONResponse(responseText);

      return parsed.clusters.map((cluster: any, index: number) => ({
        id: `cluster_${index}`,
        sections: cluster.sections.map((idx: number) => sections[idx]?.id).filter(Boolean),
        commonTopics: cluster.commonTopics || [],
        totalEntityCount: 0, // 後で計算
        monetizationPotential: cluster.monetizationPotential || 0,
        executabilityScore: cluster.executabilityScore || 0,
        densityScore: 0 // 後で計算
      }));

    } catch (error) {
      console.warn('クラスタリング失敗:', error);
      return [];
    }
  }

  // 高精度エンティティ抽出（統合処理版）
  private async extractHighConfidenceEntities(sections: ContentSection[]): Promise<HighConfidenceEntities> {
    if (sections.length === 0) {
      return {
        tasks: [],
        appointments: [],
        connections: [],
        events: [],
        personalSchedules: []
      };
    }

    console.log(`📊 統合エンティティ抽出開始: ${sections.length}セクション統合処理`);

    // 全セクションを統合して1回のAPI呼び出しで処理
    const allSectionsContent = sections.map((section, index) => {
      return `=== セクション${index + 1}: ${section.title || '無題'} ===\n${section.content}`;
    }).join('\n\n');

    // API呼び出し前に遅延（Rate Limit対策）
    await new Promise(resolve => setTimeout(resolve, 2000));

    const entities = await this.extractEntitiesFromAllSections(allSectionsContent, sections);

    // 既存データとの照合
    await this.crossReferenceExistingData(entities);

    console.log(`✅ 統合エンティティ抽出完了: タスク${entities.tasks.length}件, アポ${entities.appointments.length}件, 連絡先${entities.connections.length}件`);

    return entities;
  }

  // 統合エンティティ抽出（全セクション一括処理）
  private async extractEntitiesFromAllSections(allContent: string, sections: ContentSection[]): Promise<HighConfidenceEntities> {
    const prompt = `
以下の複数セクションから、高精度でエンティティを抽出してください。
**品質重視**: 不確実なものは含めず、確実性の高いもののみ抽出してください。

**ドキュメント内容:**
${allContent.substring(0, 5000)}${allContent.length > 5000 ? '\n...(内容が長いため省略)' : ''}

**回答形式 (JSON):**
{
  "tasks": [
    {
      "title": "具体的なタスク名",
      "description": "詳細な説明",
      "priority": "A|B|C|D",
      "dueDate": "YYYY-MM-DD", // 明確な期限がある場合のみ
      "estimatedHours": 数値, // 推定工数
      "assignee": "担当者名", // 明確に指定されている場合のみ
      "confidence": 0.8, // 0.7以上のもののみ
      "context": "前後の文脈",
      "actionability": 0.9 // 実行可能性 0-1
    }
  ],
  "appointments": [
    {
      "companyName": "会社名",
      "contactName": "担当者名",
      "purpose": "商談・打ち合わせ目的",
      "expectedValue": 1000000, // 予想売上（明記がある場合のみ）
      "urgency": "HIGH|MEDIUM|LOW",
      "confidence": 0.8, // 0.8以上のもののみ
      "businessContext": "ビジネス文脈",
      "monetizationIndicators": ["売上", "契約", "投資"] // マネタイズ指標
    }
  ],
  "connections": [
    {
      "name": "人物名",
      "company": "会社名",
      "position": "役職",
      "email": "メールアドレス", // 明記されている場合のみ
      "phone": "電話番号", // 明記されている場合のみ
      "type": "COMPANY|STUDENT",
      "confidence": 0.7, // 0.6以上のもののみ
      "businessRelevance": 0.8 // ビジネス関連度
    }
  ],
  "events": [
    {
      "title": "イベント・会議名",
      "date": "YYYY-MM-DD",
      "time": "HH:MM", // 明記されている場合のみ
      "endTime": "HH:MM", // 明記されている場合のみ
      "location": "場所",
      "participants": ["参加者1", "参加者2"],
      "type": "MEETING|EVENT", // DEADLINEは除外（タスクのdueDateで処理）
      "confidence": 0.8,
      "businessImpact": 0.7 // ビジネスインパクト
    }
  ],
  "personalSchedules": [
    {
      "title": "個人予定名",
      "date": "YYYY-MM-DD", 
      "time": "HH:MM",
      "endTime": "HH:MM",
      "location": "場所",
      "confidence": 0.7,
      "isPersonal": true // 個人予定判定
    }
  ]
}

**抽出基準（厳格）:**
1. **タスク**: 
   - 明確な動詞（作成、実装、検討、準備など）
   - 具体的な成果物への言及
   - 実行可能な内容（actionability >= 0.7）
   
2. **アポイントメント**:
   - 具体的な商談・ビジネス内容
   - マネタイズ可能性の言及（売上、契約、投資など）
   - 会社名・担当者名の明記
   
3. **連絡先**:
   - フルネームの明記
   - 会社・役職の情報
   - ビジネス関連性が高い人物
   
4. **イベント**:
   - 具体的な日時・場所
   - ビジネス関連の会議・イベント
   - 複数の参加者
   
5. **個人予定**:
   - 明らかに個人的な内容
   - プライベートな予定

**重要**: 不確実・推測的な情報は含めないでください。
`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = this.parseJSONResponse(responseText);

      // 高精度フィルタリング適用
      const entities: HighConfidenceEntities = {
        tasks: (parsed.tasks || []).filter((task: any) =>
          task.confidence >= AdvancedContentAnalyzer.THRESHOLDS.TASK_CONFIDENCE
        ).map((task: any) => ({
          ...task,
          sourceSection: 'unified_extraction',
          confidence: Math.min(1.0, task.confidence || 0)
        })),
        appointments: (parsed.appointments || []).filter((appt: any) =>
          appt.confidence >= AdvancedContentAnalyzer.THRESHOLDS.APPOINTMENT_CONFIDENCE
        ).map((appt: any) => ({
          ...appt,
          sourceSection: 'unified_extraction',
          confidence: Math.min(1.0, appt.confidence || 0)
        })),
        connections: (parsed.connections || []).filter((conn: any) =>
          conn.confidence >= AdvancedContentAnalyzer.THRESHOLDS.CONNECTION_CONFIDENCE
        ).map((conn: any) => ({
          ...conn,
          sourceSection: 'unified_extraction',
          existsInSystem: false, // 後で照合
          confidence: Math.min(1.0, conn.confidence || 0)
        })),
        events: (parsed.events || []).filter((event: any) =>
          event.confidence >= AdvancedContentAnalyzer.THRESHOLDS.EVENT_CONFIDENCE
        ).map((event: any) => ({
          ...event,
          sourceSection: 'unified_extraction',
          confidence: Math.min(1.0, event.confidence || 0)
        })),
        personalSchedules: (parsed.personalSchedules || []).filter((schedule: any) =>
          schedule.confidence >= AdvancedContentAnalyzer.THRESHOLDS.PERSONAL_SCHEDULE_CONFIDENCE
        ).map((schedule: any) => ({
          ...schedule,
          sourceSection: 'unified_extraction',
          confidence: Math.min(1.0, schedule.confidence || 0)
        }))
      };

      return entities;

    } catch (error) {
      console.error(`❌ 統合エンティティ抽出失敗:`, error);
      return {
        tasks: [],
        appointments: [],
        connections: [],
        events: [],
        personalSchedules: []
      };
    }
  }

  // 既存データとの照合
  private async crossReferenceExistingData(entities: HighConfidenceEntities): Promise<void> {
    // 連絡先の重複チェック
    for (const connection of entities.connections) {
      const existing = await prisma.connections.findFirst({
        where: {
          OR: [
            { name: { contains: connection.name } },
            connection.email ? { description: { contains: connection.email } } : null
          ].filter(Boolean) as any
        }
      });

      connection.existsInSystem = !!existing;
      if (existing) {
        connection.confidence *= 0.8; // 既存の場合は信頼度を下げる
      }
    }
  }

  // プロジェクト候補分析
  private async analyzeProjectCandidates(
    clusters: SectionCluster[],
    entities: HighConfidenceEntities
  ): Promise<ProjectCandidate[]> {
    const candidates: ProjectCandidate[] = [];

    for (const cluster of clusters) {
      // クラスター内のエンティティ数計算
      const relatedTasks = entities.tasks.filter(t =>
        cluster.sections.includes(t.sourceSection)
      ).length;

      const relatedAppointments = entities.appointments.filter(a =>
        cluster.sections.includes(a.sourceSection)
      ).length;

      const totalEntities = relatedTasks + relatedAppointments +
        entities.events.filter(e => cluster.sections.includes(e.sourceSection)).length +
        entities.connections.filter(c => cluster.sections.includes(c.sourceSection)).length;

      cluster.totalEntityCount = totalEntities;
      cluster.densityScore = Math.min(1.0, totalEntities / AdvancedContentAnalyzer.THRESHOLDS.MIN_CLUSTER_ENTITIES);

      // 高閾値チェック
      if (cluster.densityScore >= AdvancedContentAnalyzer.THRESHOLDS.PROJECT_DENSITY &&
        cluster.monetizationPotential >= AdvancedContentAnalyzer.THRESHOLDS.PROJECT_MONETIZATION &&
        cluster.executabilityScore >= AdvancedContentAnalyzer.THRESHOLDS.PROJECT_EXECUTABILITY &&
        totalEntities >= AdvancedContentAnalyzer.THRESHOLDS.MIN_CLUSTER_ENTITIES) {

        candidates.push({
          name: `プロジェクト候補: ${cluster.commonTopics[0] || 'unnamed'}`,
          description: `${cluster.commonTopics.join('、')}に関連する高密度プロジェクト候補`,
          phase: 'concept',
          priority: cluster.monetizationPotential > 0.8 ? 'A' : 'B',
          clusterIds: [cluster.id],
          densityScore: cluster.densityScore,
          monetizationScore: cluster.monetizationPotential,
          executabilityScore: cluster.executabilityScore,
          relatedTasks,
          relatedAppointments,
          keyStakeholders: entities.connections
            .filter(c => cluster.sections.includes(c.sourceSection))
            .map(c => c.name),
          confidence: (cluster.densityScore + cluster.monetizationPotential + cluster.executabilityScore) / 3
        });
      }
    }

    console.log(`🎯 プロジェクト候補（高閾値通過）: ${candidates.length}件`);
    return candidates;
  }

  // 全体洞察生成
  private async generateOverallInsights(
    content: string,
    documentTitle: string,
    entities: HighConfidenceEntities,
    projectCandidates: ProjectCandidate[],
    agenda: string = ''
  ): Promise<OverallInsights> {
    const totalActionItems = entities.tasks.length + entities.appointments.length + entities.events.length;

    // 要約のみを生成（タイトルはGoogle Docsから使用）
    const summary = await this.generateSummary(content, entities);

    return {
      documentType: this.detectDocumentType(content),
      businessValue: this.calculateBusinessValue(entities, projectCandidates),
      urgencyLevel: this.detectUrgencyLevel(entities),
      keyTopics: this.extractKeyTopics(content),
      actionItemsCount: totalActionItems,
      projectPotentialCount: projectCandidates.length,
      confidence: totalActionItems > 0 ? 0.8 : 0.3,
      title: documentTitle, // Google Docsのタイトルをそのまま使用
      summary,
      agenda // 議題を追加
    };
  }

  // 議題抽出ロジック（新規追加）
  async extractAgenda(content: string): Promise<string> {
    console.log(`🎯 議題抽出開始: ${content.length}文字`);
    const startTime = Date.now();

    // 短いコンテンツの場合はスキップ
    if (content.length < 200) {
      console.log(`📄 コンテンツが短すぎるため議題抽出をスキップ (${content.length}文字 < 200文字)`);
      return '';
    }

    const contentPreview = content.substring(0, 100).replace(/\n/g, ' ');
    console.log(`📄 議題抽出対象コンテンツ: "${contentPreview}..."`);

    const prompt = `
以下のドキュメントから「議題・アジェンダ」に該当する部分のみを抽出してください。
会議の目的、討議項目、検討事項、話し合いの項目など、事前に決められた議論のテーマを特定してください。

**ドキュメント内容:**
${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

**回答形式 (JSON):**
{
  "agenda": "抽出された議題（200文字以内）",
  "hasAgenda": true/false
}

**抽出基準:**
- 明確な議題・アジェンダが記載されている場合のみ抽出
- 会議の目的、討議項目、検討事項、話し合いの主題
- 「議題」「アジェンダ」「目的」「検討事項」などの明示がある内容
- 単なる日程や参加者情報は除外
- 要約や結論は除外（議題のみ）

**重要:** 
- 明確な議題がない場合は hasAgenda: false を返してください
- 議題とサマリーが混同されないよう、事前に決められた話し合いの項目のみを抽出してください
`;

    try {
      console.log(`⏳ Gemini API呼び出し前の遅延開始 (Rate Limit対策)`);
      // API呼び出し前に遅延（Rate Limit対策）
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`🚀 Gemini API呼び出し実行 (${Date.now() - startTime}ms)`);

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      console.log(`📨 Gemini API レスポンス受信 (${Date.now() - startTime}ms)`);
      console.log(`🔍 議題抽出レスポンス長: ${responseText.length}文字`);
      console.log(`🔍 議題抽出レスポンス内容: ${responseText.substring(0, 200)}...`);
      
      const parsed = this.parseJSONResponse(responseText);
      console.log(`🔍 パース結果:`, parsed);
      
      if (!parsed.hasAgenda || !parsed.agenda) {
        console.log(`📄 明確な議題が見つからませんでした (hasAgenda: ${parsed.hasAgenda}, agenda: "${parsed.agenda}")`);
        return '';
      }

      const agenda = parsed.agenda.substring(0, 200); // 200文字制限
      console.log(`✅ 議題抽出完了 (${Date.now() - startTime}ms): "${agenda}"`);
      return agenda;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ 議題抽出エラー (${totalTime}ms):`, error);
      console.error(`❌ 議題抽出エラー詳細:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        contentLength: content.length,
        contentPreview
      });
      return '';
    }
  }

  // ユーティリティ関数群
  private parseJSONResponse(responseText: string): any {
    const defaultValue = {
      sections: [],
      clusters: [],
      tasks: [],
      appointments: [],
      connections: [],
      events: [],
      personalSchedules: []
    };

    return AIJsonParser.parseFromAIResponse(responseText, defaultValue);
  }

  private fallbackSectionSplit(content: string): ContentSection[] {
    // 段落ベースの簡易分割
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 100);

    return paragraphs.map((para, index) => ({
      id: `section_${index}`,
      title: undefined,
      content: para.trim(),
      startIndex: index * 200, // 概算
      endIndex: (index + 1) * 200,
      topics: [],
      entityMentions: [],
      density: 0
    }));
  }

  private detectDocumentType(content: string): 'meeting_notes' | 'planning_document' | 'project_review' | 'mixed_discussions' {
    if (/議事録|会議|ミーティング|打ち合わせ/.test(content)) return 'meeting_notes';
    if (/計画|企画|構想|戦略/.test(content)) return 'planning_document';
    if (/進捗|レビュー|振り返り|報告/.test(content)) return 'project_review';
    return 'mixed_discussions';
  }

  private calculateBusinessValue(entities: HighConfidenceEntities, projectCandidates: ProjectCandidate[]): number {
    let score = 0;
    score += entities.appointments.length * 0.3; // アポイントメントは高価値
    score += projectCandidates.length * 0.4; // プロジェクト候補は最高価値
    score += entities.tasks.filter(t => t.priority === 'A').length * 0.2;
    return Math.min(1.0, score);
  }

  private detectUrgencyLevel(entities: HighConfidenceEntities): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const urgentTasks = entities.tasks.filter(t => t.priority === 'A').length;
    const urgentAppts = entities.appointments.filter(a => a.urgency === 'HIGH').length;

    if (urgentTasks >= 3 || urgentAppts >= 2) return 'CRITICAL';
    if (urgentTasks >= 2 || urgentAppts >= 1) return 'HIGH';
    if (urgentTasks >= 1 || entities.tasks.length >= 3) return 'MEDIUM';
    return 'LOW';
  }

  private extractKeyTopics(content: string): string[] {
    // 簡易キーワード抽出
    const words = content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{3,8}/g) || [];
    const frequency = new Map<string, number>();

    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  // 要約のみを生成（タイトルはGoogle Docsから取得）
  private async generateSummary(content: string, entities: HighConfidenceEntities): Promise<string> {
    const totalEntities = entities.tasks.length + entities.events.length +
      entities.appointments.length + entities.connections.length;

    // コンテンツが短い場合（400文字以下）は原文をそのまま返す
    if (content.trim().length <= 400) {
      console.log(`📄 短いコンテンツ(${content.trim().length}文字) - 原文保存`);
      return content.trim();
    }

    // エンティティが抽出されていない場合は原文から直接要約を生成
    if (totalEntities === 0) {
      console.log('🔄 エンティティ未検出 - 原文から直接要約生成');
      return await this.generateSummaryFromRawContent(content);
    }

    // エンティティが抽出されている場合は従来の方法で要約生成
    return await this.generateSummaryFromEntities(content, entities);
  }

  // 原文から直接要約を生成（エンティティが検出されなかった場合）
  private async generateSummaryFromRawContent(content: string): Promise<string> {
    const prompt = `
以下のドキュメント内容から、適切な要約を生成してください。
具体的なタスクやイベントが検出されなかった場合でも、ドキュメントの主要な内容を要約してください。

**ドキュメント内容:**
${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}

**回答形式 (JSON):**
{
  "summary": "ドキュメントの主要な内容・議論・決定事項・次のアクションを含む要約（400文字程度）"
}

**重要:**
- 明確なタスクやイベントが見つからない場合でも、議論内容や方向性を要約してください
- 連絡先情報のみの場合は「○○に関する連絡先情報が記録されている」旨を記載
- 要約は文章形式で記述してください
`;

    try {
      console.log('🔍 Raw Content Summary - Prompt:', prompt.substring(0, 200) + '...');

      // API呼び出し前に遅延（Rate Limit対策）
      await new Promise(resolve => setTimeout(resolve, 3000));

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      console.log('🔍 Gemini Raw Response:', responseText);
      console.log('🔍 Response Length:', responseText.length);

      const parsed = this.parseJSONResponse(responseText);
      console.log('🔍 Parsed Result:', parsed);

      if (!parsed.summary) {
        console.warn('⚠️ No summary field in parsed response:', parsed);
      }

      return parsed.summary || '要約を生成できませんでした';
    } catch (error) {
      console.error('❌ Raw content summary error:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        contentLength: content.length
      });
      return '要約を生成できませんでした';
    }
  }

  // エンティティベースの要約生成（従来の方法）
  private async generateSummaryFromEntities(content: string, entities: HighConfidenceEntities): Promise<string> {
    const prompt = `
以下の議事録・ドキュメントから、適切な要約を生成してください。

**ドキュメント内容（抜粋）:**
${content.substring(0, 2000)}...

**抽出されたエンティティ情報:**
- タスク: ${entities.tasks.length}件
- イベント: ${entities.events.length}件
- アポイントメント: ${entities.appointments.length}件
- 主な話題: ${entities.tasks.slice(0, 3).map(t => t.title).join(', ')}

**回答形式 (JSON):**
{
  "summary": "主要な議論内容・決定事項・次のアクションを含む要約（500文字程度）"
}

**重要:**
- 要約は箇条書きではなく、文章形式で記述してください
- 議論の要点、決定事項、次のアクションを含めてください
`;

    try {
      console.log('🔍 Entity Summary - Entities:', {
        tasks: entities.tasks.length,
        events: entities.events.length,
        appointments: entities.appointments.length
      });

      // API呼び出し前に遅延（Rate Limit対策）
      await new Promise(resolve => setTimeout(resolve, 3000));

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      console.log('🔍 Gemini Entity Response:', responseText);
      console.log('🔍 Response Length:', responseText.length);

      const parsed = this.parseJSONResponse(responseText);
      console.log('🔍 Entity Parsed Result:', parsed);

      if (!parsed.summary) {
        console.warn('⚠️ No summary field in entity response:', parsed);
      }

      return parsed.summary || '要約を生成できませんでした';
    } catch (error) {
      console.error('❌ Entity summary error:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        entityCount: entities.tasks.length + entities.events.length + entities.appointments.length
      });
      return '要約を生成できませんでした';
    }
  }

  private createEmptyResult(): AdvancedAnalysisResult {
    return {
      sections: [],
      clusters: [],
      highConfidenceEntities: {
        tasks: [],
        appointments: [],
        connections: [],
        events: [],
        personalSchedules: []
      },
      projectCandidates: [],
      overallInsights: {
        documentType: 'mixed_discussions',
        businessValue: 0,
        urgencyLevel: 'LOW',
        keyTopics: [],
        actionItemsCount: 0,
        projectPotentialCount: 0,
        confidence: 0,
        title: 'ドキュメントタイトル未設定',
        summary: '要約を生成できませんでした',
        agenda: ''
      },
      agenda: '' // 議題フィールドを追加
    };
  }

  // 短いコンテンツ用：原文を保存する空の結果
  private createEmptyResultWithOriginalContent(originalContent: string, title: string): AdvancedAnalysisResult {
    return {
      sections: [],
      clusters: [],
      highConfidenceEntities: {
        tasks: [],
        appointments: [],
        connections: [],
        events: [],
        personalSchedules: []
      },
      projectCandidates: [],
      overallInsights: {
        documentType: 'mixed_discussions',
        businessValue: 0,
        urgencyLevel: 'LOW',
        keyTopics: [],
        actionItemsCount: 0,
        projectPotentialCount: 0,
        confidence: 0.3, // 短いコンテンツでも最低限の信頼度
        title: title || 'ドキュメントタイトル未設定',
        summary: originalContent, // 原文をそのまま保存
        agenda: ''
      },
      agenda: '' // 議題フィールドを追加
    };
  }
}

// ファクトリー関数
export const createAdvancedContentAnalyzer = () => AdvancedContentAnalyzer.getInstance();
// Phase 2: Task Knowledge Automator Service
// タスク完了時ナレッジ自動化システム

import { AIEvaluationEngine } from '../lib/ai/evaluation-engine';

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
  private aiService: AIEvaluationEngine;
  private knowledgeService: any;
  private taskService: any;

  constructor() {
    this.aiService = new AIEvaluationEngine();
  }

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
    
    try {
      // タスク詳細情報を取得
      const task = await this.getTaskWithFullContext(completionData.taskId);
      
      // ナレッジ生成判定
      const decision = await this.evaluateKnowledgeGeneration(task, completionData.completionData);
      
      let generatedKnowledge: GeneratedKnowledge | undefined;
      
      if (decision.shouldGenerate) {
        generatedKnowledge = await this.generateKnowledge(task, completionData.completionData, decision);
        await this.saveGeneratedKnowledge(generatedKnowledge, task.id);
      }
      
      // 処理履歴を保存
      await this.saveAutomationHistory(completionData, decision, generatedKnowledge);
      
      const processingTime = Date.now() - startTime;
      
      return {
        decision,
        generatedKnowledge,
        processingTime
      };
    } catch (error) {
      console.error('ナレッジ自動化処理エラー:', error);
      throw new Error(`ナレッジ自動化処理に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * ナレッジ生成判定
   */
  private async evaluateKnowledgeGeneration(
    task: any,
    completionData: any
  ): Promise<KnowledgeGenerationDecision> {
    try {
      const evaluation = await this.evaluateWithMockAI(`
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
      
      回答形式はJSONで:
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
    } catch (error) {
      console.error('ナレッジ生成判定エラー:', error);
      return {
        shouldGenerate: false,
        knowledgeTypes: [],
        priority: 'LOW',
        suggestedTitle: 'AI判定エラー',
        keyPoints: ['手動でナレッジ化を検討してください'],
        applicableScenarios: [],
        estimatedValue: 1
      };
    }
  }

  /**
   * ナレッジ生成実行
   */
  private async generateKnowledge(
    task: any,
    completionData: any,
    decision: KnowledgeGenerationDecision
  ): Promise<GeneratedKnowledge> {
    try {
      const relatedKnowledge = await this.findRelatedKnowledge(task.title, task.description);
      const similarTasks = await this.findSimilarTasks(task);
      
      const generatedContent = await this.evaluateWithMockAI(`
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
      
      回答形式はJSONで:
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
    } catch (error) {
      console.error('ナレッジ生成エラー:', error);
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
    try {
      const knowledge = await this.getKnowledgeData(knowledgeId);
      const usageData = await this.getKnowledgeUsageData(knowledgeId);
      const feedback = await this.getKnowledgeFeedback(knowledgeId);
      
      const qualityEvaluation = await this.evaluateWithMockAI(`
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
    } catch (error) {
      console.error('ナレッジ品質評価エラー:', error);
      return {
        qualityScore: 5.0,
        improvementSuggestions: ['品質評価エラーが発生しました'],
        usageTracking: {
          viewCount: 0,
          applicationCount: 0,
          feedback: []
        }
      };
    }
  }

  // ヘルパーメソッド
  private async getTaskWithFullContext(taskId: string) {
    // 実際の実装では、データベースからタスク詳細を取得
    return {
      id: taskId,
      title: 'サンプルタスク',
      description: 'タスクの詳細説明',
      estimatedHours: 8,
      difficultyScore: 5,
      project: { title: 'サンプルプロジェクト' },
      assignedTo: 'user123'
    };
  }

  private async findRelatedKnowledge(title: string, description: string) {
    // 実際の実装では、関連ナレッジを検索
    return [
      { title: '関連ナレッジ1' },
      { title: '関連ナレッジ2' }
    ];
  }

  private async findSimilarTasks(task: any) {
    // 実際の実装では、類似タスクを検索
    return [
      { title: '類似タスク1', actualHours: 6 },
      { title: '類似タスク2', actualHours: 10 }
    ];
  }

  private async getKnowledgeData(knowledgeId: string) {
    // 実際の実装では、ナレッジデータを取得
    return {
      title: 'サンプルナレッジ',
      category: 'TECHNICAL',
      content: 'ナレッジコンテンツ...',
      createdAt: new Date()
    };
  }

  private async getKnowledgeUsageData(knowledgeId: string) {
    // 実際の実装では、使用データを取得
    return {
      viewCount: 10,
      applicationCount: 3
    };
  }

  private async getKnowledgeFeedback(knowledgeId: string) {
    // 実際の実装では、フィードバックを取得
    return [
      { rating: 4, comment: '役に立ちました' },
      { rating: 5, comment: '詳しい説明でわかりやすい' }
    ];
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

  private parseQualityEvaluation(aiResponse: string) {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      return {
        qualityScore: 5.0,
        improvementSuggestions: ['品質評価の解析に失敗しました']
      };
    }
  }

  private async saveGeneratedKnowledge(knowledge: GeneratedKnowledge, sourceTaskId: string): Promise<void> {
    // 実際の実装では、データベースにナレッジを保存
    console.log(`ナレッジ保存: ${sourceTaskId}`, knowledge);
  }

  private async saveAutomationHistory(
    completionData: TaskCompletionData,
    decision: KnowledgeGenerationDecision,
    generatedKnowledge?: GeneratedKnowledge
  ): Promise<void> {
    // 実際の実装では、自動化履歴をデータベースに保存
    console.log('自動化履歴保存:', { completionData, decision, generatedKnowledge });
  }

  // 一時的なモックAI実装
  private async evaluateWithMockAI(prompt: string): Promise<string> {
    if (prompt.includes('タスク完了ナレッジ化判定')) {
      return JSON.stringify({
        shouldGenerate: true,
        knowledgeTypes: ["TECHNICAL", "PROBLEM_SOLVING"],
        priority: "HIGH",
        suggestedTitle: "React Hook最適化による描画パフォーマンス改善手法",
        keyPoints: [
          "useMemo/useCallbackの効果的活用",
          "不要な再レンダリング特定方法",
          "メモリリークの回避策"
        ],
        applicableScenarios: [
          "大規模Reactアプリケーション開発",
          "パフォーマンス要件の厳しいUI実装"
        ],
        estimatedValue: 8
      });
    }
    
    if (prompt.includes('タスク完了ナレッジ生成')) {
      return JSON.stringify({
        title: "効率的なタスク完了手法",
        category: "TECHNICAL",
        content: "# 概要\n\nタスクを効率的に完了するための手法について説明します。\n\n## 手法\n\n1. 計画的なアプローチ\n2. 適切なツールの選択\n3. 継続的な改善",
        tags: ["効率化", "プロセス改善", "ベストプラクティス"],
        applicableProjects: ["Webアプリ開発", "システム改善"],
        relatedTasks: ["task123", "task456"],
        valueScore: 8,
        confidence: 0.9
      });
    }
    
    if (prompt.includes('ナレッジ品質評価')) {
      return JSON.stringify({
        qualityScore: 7.5,
        improvementSuggestions: [
          "具体的なコード例の追加",
          "適用条件をより明確に記述"
        ]
      });
    }
    
    return '{"error": "未対応のプロンプトです"}';
  }
}

export default TaskKnowledgeAutomator;
import { AICallManager } from './call-manager';

interface AppointmentData {
  id: string;
  companyName: string;
  contactName: string;
  notes: string;
  priority: string;
  details?: {
    budgetInfo?: string;
    timeline?: string;
    decisionMakers?: string[];
    painPoints?: string[];
    competitors?: string[];
    contractValue?: number | null;
    proposalStatus?: string;
  };
}

interface AppointmentEvaluation {
  importance: number;
  businessValue: number;
  closingProbability: number;
  reasoning: string;
  nextActions: string[];
}

export class AppointmentEvaluator {
  private aiCallManager: AICallManager;

  constructor() {
    this.aiCallManager = new AICallManager();
  }

  async evaluateAppointment(appointment: AppointmentData): Promise<AppointmentEvaluation> {
    const prompt = this.buildEvaluationPrompt(appointment);
    
    try {
      const response = await this.aiCallManager.callGemini(
        prompt,
        'appointment_evaluation',
        {
          cacheKey: `appointment_eval_${appointment.id}_${this.getContentHash(appointment)}`,
          userId: 'system'
        }
      );

      return this.parseEvaluationResponse(response.content || '');
    } catch (error) {
      console.error('Failed to evaluate appointment:', error);
      return this.getFallbackEvaluation();
    }
  }

  async batchEvaluateAppointments(appointments: AppointmentData[]): Promise<Map<string, AppointmentEvaluation>> {
    const results = new Map<string, AppointmentEvaluation>();
    
    // Process in batches of 5 to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < appointments.length; i += batchSize) {
      const batch = appointments.slice(i, i + batchSize);
      const batchPromises = batch.map(appointment => 
        this.evaluateAppointment(appointment).then(result => ({
          id: appointment.id,
          evaluation: result
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ id, evaluation }) => {
        results.set(id, evaluation);
      });

      // Add delay between batches
      if (i + batchSize < appointments.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  private buildEvaluationPrompt(appointment: AppointmentData): string {
    return `
アポイントメントの重要度と営業価値を評価してください。

会社: ${appointment.companyName}
担当者: ${appointment.contactName}
現在の優先度: ${appointment.priority}
メモ: ${appointment.notes}

詳細情報:
- 予算情報: ${appointment.details?.budgetInfo || '不明'}
- タイムライン: ${appointment.details?.timeline || '不明'}
- 決裁者: ${appointment.details?.decisionMakers?.join(', ') || '不明'}
- 課題・ペイン: ${appointment.details?.painPoints?.join(', ') || '不明'}
- 競合他社: ${appointment.details?.competitors?.join(', ') || '不明'}
- 契約想定金額: ${appointment.details?.contractValue ? `${appointment.details.contractValue}万円` : '不明'}
- 提案状況: ${appointment.details?.proposalStatus || '不明'}

以下の項目を1-10のスケールで評価し、JSON形式で回答してください:

{
  "importance": 営業戦略上の重要度 (1-10),
  "businessValue": ビジネス価値・売上インパクト (1-10),
  "closingProbability": 成約確率 (1-10, 10=90-100%),
  "reasoning": "評価理由（200文字以内）",
  "nextActions": ["推奨される次のアクション1", "推奨される次のアクション2"]
}

評価基準:
- importance: 戦略的重要性、リード獲得の困難さ、影響力
- businessValue: 予想売上、継続性、アップセル可能性  
- closingProbability: 決裁権限、予算確保状況、競合状況
`;
  }

  private parseEvaluationResponse(response: string): AppointmentEvaluation {
    try {
      // Clean up response and parse JSON
      const cleanResponse = response.replace(/```json\n?|```\n?/g, '').trim();
      const parsed = JSON.parse(cleanResponse);

      return {
        importance: Math.max(1, Math.min(10, parsed.importance || 5)),
        businessValue: Math.max(1, Math.min(10, parsed.businessValue || 5)),
        closingProbability: Math.max(1, Math.min(10, parsed.closingProbability || 5)),
        reasoning: parsed.reasoning || '自動評価により算出',
        nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions : []
      };
    } catch (error) {
      console.error('Failed to parse appointment evaluation:', error);
      return this.getFallbackEvaluation();
    }
  }

  private getFallbackEvaluation(): AppointmentEvaluation {
    return {
      importance: 5,
      businessValue: 5,
      closingProbability: 5,
      reasoning: 'システムによる自動評価（AI評価に失敗）',
      nextActions: ['詳細情報の収集', 'フォローアップの実施']
    };
  }

  private getContentHash(appointment: AppointmentData): string {
    const content = JSON.stringify({
      company: appointment.companyName,
      contact: appointment.contactName,
      notes: appointment.notes,
      details: appointment.details
    });
    
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}
// LINEボット用日時解析システム（ハイブリッド戦略）

interface ParsedDateTime {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  confidence: number; // 0.0-1.0
  method: 'pattern' | 'ai' | 'fallback';
}

export class DateTimeParser {
  private patterns = [
    // 明日系（時刻なし）
    { 
      regex: /^明日(?:の)?(?!.*\d).*$/,
      handler: (match: RegExpMatchArray) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return {
          date: tomorrow.toISOString().split('T')[0],
          time: "00:00",
          confidence: 0.85,
          method: 'pattern' as const
        };
      }
    },
    
    // 明日系（時刻あり）
    { 
      regex: /明日(?:の)?(\d{1,2})(?:時|:(\d{2}))?/,
      handler: (match: RegExpMatchArray) => {
        const hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return {
          date: tomorrow.toISOString().split('T')[0],
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          confidence: 0.9,
          method: 'pattern' as const
        };
      }
    },
    
    // 今日系（時刻なし）
    {
      regex: /^今日(?:の)?(?!.*\d).*$/,
      handler: (match: RegExpMatchArray) => {
        const today = new Date();
        
        return {
          date: today.toISOString().split('T')[0],
          time: "00:00",
          confidence: 0.85,
          method: 'pattern' as const
        };
      }
    },
    
    // 今日系（時刻あり）
    {
      regex: /今日(?:の)?(\d{1,2})(?:時|:(\d{2}))?/,
      handler: (match: RegExpMatchArray) => {
        const hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const today = new Date();
        
        return {
          date: today.toISOString().split('T')[0],
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          confidence: 0.9,
          method: 'pattern' as const
        };
      }
    },
    
    // 来週系
    {
      regex: /来週(月|火|水|木|金|土|日)(?:曜日)?(?:の)?(\d{1,2})(?:時|:(\d{2}))?/,
      handler: (match: RegExpMatchArray) => {
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const targetDay = dayNames.indexOf(match[1]);
        const hour = parseInt(match[2]);
        const minute = match[3] ? parseInt(match[3]) : 0;
        
        const today = new Date();
        const currentDay = today.getDay();
        const daysUntil = (targetDay - currentDay + 7) % 7 || 7; // 来週なので最低7日後
        
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysUntil + 7);
        
        return {
          date: targetDate.toISOString().split('T')[0],
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          confidence: 0.8,
          method: 'pattern' as const
        };
      }
    },
    
    // 数値日付系
    {
      regex: /(\d{1,2})月(\d{1,2})日(?:の)?(\d{1,2})(?:時|:(\d{2}))?/,
      handler: (match: RegExpMatchArray) => {
        const month = parseInt(match[1]);
        const day = parseInt(match[2]);
        const hour = parseInt(match[3]);
        const minute = match[4] ? parseInt(match[4]) : 0;
        
        const today = new Date();
        const targetDate = new Date(today.getFullYear(), month - 1, day);
        
        // 過去の日付の場合は来年にする
        if (targetDate < today) {
          targetDate.setFullYear(today.getFullYear() + 1);
        }
        
        return {
          date: targetDate.toISOString().split('T')[0],
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          confidence: 0.85,
          method: 'pattern' as const
        };
      }
    },
    
    // 時間のみ
    {
      regex: /^(\d{1,2})(?:時|:(\d{2}))$/,
      handler: (match: RegExpMatchArray) => {
        const hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const today = new Date();
        
        return {
          date: today.toISOString().split('T')[0],
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          confidence: 0.7,
          method: 'pattern' as const
        };
      }
    }
  ];

  // パターンマッチング解析
  parseWithPatterns(input: string): ParsedDateTime | null {
    const cleanInput = input.trim();
    
    for (const pattern of this.patterns) {
      const match = cleanInput.match(pattern.regex);
      if (match) {
        try {
          const result = pattern.handler(match);
          console.log(`✅ パターンマッチ成功: "${input}" → ${result.date} ${result.time}`);
          return result;
        } catch (error) {
          console.warn(`⚠️ パターン処理エラー:`, error);
          continue;
        }
      }
    }
    
    return null;
  }

  // AI解析（フォールバック）
  async parseWithAI(input: string): Promise<ParsedDateTime | null> {
    try {
      console.log(`🤖 AI解析開始: "${input}"`);
      
      // AI解析の実装（既存のAI処理を活用）
      const prompt = `
以下の日時表現を解析して、日付と時間を抽出してください。
今日は${new Date().toISOString().split('T')[0]}です。

入力: "${input}"

以下のJSON形式で回答してください：
{
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "confidence": 0.0-1.0
}

解析できない場合は null を返してください。
`;

      // TODO: AI API呼び出し実装
      // 現在は簡易実装
      return {
        date: new Date().toISOString().split('T')[0],
        time: "00:00",
        confidence: 0.5,
        method: 'ai'
      };
      
    } catch (error) {
      console.error('❌ AI解析エラー:', error);
      return null;
    }
  }

  // メイン解析メソッド
  async parse(input: string): Promise<ParsedDateTime> {
    // 1. パターンマッチング優先
    const patternResult = this.parseWithPatterns(input);
    if (patternResult && patternResult.confidence >= 0.7) {
      return patternResult;
    }

    // 2. AI解析フォールバック
    const aiResult = await this.parseWithAI(input);
    if (aiResult && aiResult.confidence >= 0.6) {
      return aiResult;
    }

    // 3. フォールバック（今日・デフォルト時間）
    console.log(`⚠️ 解析失敗、フォールバック: "${input}"`);
    return {
      date: new Date().toISOString().split('T')[0],
      time: "00:00",
      confidence: 0.1,
      method: 'fallback'
    };
  }
}

export const dateTimeParser = new DateTimeParser();
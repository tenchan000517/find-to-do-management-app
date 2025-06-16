// LINEボット用日時解析システム（ハイブリッド戦略）

interface ParsedDateTime {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  confidence: number; // 0.0-1.0
  method: 'pattern' | 'ai' | 'fallback';
}

export class DateTimeParser {
  // JST基準の日付取得
  private getJSTDate(): Date {
    const now = new Date();
    const jstOffset = 9 * 60; // JST = UTC+9
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (jstOffset * 60000));
  }

  // 入力正規化（全角→半角、自然言語→構造化）
  private normalizeInput(input: string): string {
    const normalized = input
      // 全角コロン→半角コロン
      .replace(/：/g, ':')
      // 全角数字→半角数字（完全版）
      .replace(/０/g, '0').replace(/１/g, '1').replace(/２/g, '2').replace(/３/g, '3').replace(/４/g, '4')
      .replace(/５/g, '5').replace(/６/g, '6').replace(/７/g, '7').replace(/８/g, '8').replace(/９/g, '9')
      // 全角英数字→半角英数字
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
      })
      // 自然言語正規化
      .replace(/あした|アシタ/g, '明日')
      .replace(/きょう|キョウ/g, '今日')
      .replace(/らいしゅう|ライシュウ/g, '来週')
      .trim();
    
    console.log(`🔄 正規化: "${input}" → "${normalized}"`);
    return normalized;
  }
  private patterns = [
    // 明日系（時刻なし）
    { 
      regex: /^明日(?:の)?(?!.*\d).*$/,
      handler: (match: RegExpMatchArray) => {
        const tomorrow = this.getJSTDate();
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
        const tomorrow = this.getJSTDate();
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
        const today = this.getJSTDate();
        
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
    const cleanInput = this.normalizeInput(input);
    
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

  // AI解析（正規化特化）
  async parseWithAI(input: string): Promise<ParsedDateTime | null> {
    try {
      const normalizedInput = this.normalizeInput(input);
      console.log(`🤖 AI解析開始: "${input}" → "${normalizedInput}"`);
      
      const today = this.getJSTDate();
      const todayStr = today.toISOString().split('T')[0];
      
      const prompt = `
以下の日時表現を正規化して、日付と時間を抽出してください。
今日は${todayStr}（${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日）です。

重要なルール：
1. 今年の過去日付は来年に自動変換
2. 相対表現（明日、来週等）はJST基準で計算
3. 全角文字は半角に正規化済み

入力: "${input}"

以下のJSON形式で回答してください：
{
  "date": "YYYY-MM-DD",
  "time": "HH:mm", 
  "confidence": 0.0-1.0
}

特に以下のパターンを重視：
- 時間のみ（14:00等）→今日の該当時間
- 月日表現（6/5、6月5日等）→今年または来年
- 自然言語（来週火曜等）→具体日付変換
`;

      // 実際のAI呼び出し（Gemini API使用想定）
      // 現在は時間のみの簡易処理
      const timeMatch = normalizedInput.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const minute = parseInt(timeMatch[2]);
        
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          return {
            date: todayStr,
            time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
            confidence: 0.8,
            method: 'ai'
          };
        }
      }
      
      return null;
      
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
    const fallbackDate = this.getJSTDate();
    return {
      date: fallbackDate.toISOString().split('T')[0],
      time: "00:00",
      confidence: 0.1,
      method: 'fallback'
    };
  }
}

export const dateTimeParser = new DateTimeParser();
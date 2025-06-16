// AI分析専用JSON解析ユーティリティ
export class AIJsonParser {
  /**
   * AI生成レスポンスからJSONを堅牢に抽出・解析
   * @param response AIからのレスポンステキスト
   * @param defaultValue パース失敗時のデフォルト値
   * @returns パースされたJSONオブジェクト
   */
  static parseFromAIResponse<T>(response: string, defaultValue: T): T {
    try {
      console.log(`🔍 JSON解析開始: ${response.length}文字`);
      
      // Step 1: マークダウンからJSONを抽出
      const cleanedJson = this.stripMarkdown(response);
      console.log(`📝 マークダウン除去完了: ${cleanedJson.length}文字`);
      
      // Step 2: 通常のJSONパース
      const parsed = JSON.parse(cleanedJson);
      console.log('✅ JSON解析成功');
      return parsed as T;
      
    } catch (error) {
      console.warn('❌ 通常JSON解析失敗、修復を試行:', (error as Error).message);
      
      // Step 3: JSON修復試行
      const repairedJson = this.repairJSON(response);
      if (repairedJson) {
        try {
          const parsed = JSON.parse(repairedJson);
          console.log('✅ JSON修復成功');
          return parsed as T;
        } catch (repairError) {
          console.warn('❌ 修復後も解析失敗:', (repairError as Error).message);
        }
      }
      
      // Step 4: 部分抽出試行
      const partialData = this.extractPartialJSON(response);
      if (partialData && Object.keys(partialData).length > 0) {
        console.log('⚡ 部分JSON抽出成功');
        return { ...defaultValue, ...partialData } as T;
      }
      
      console.error('❌ 全てのJSON解析手法が失敗、デフォルト値を返却');
      return defaultValue;
    }
  }

  /**
   * マークダウンコードブロックからJSONテキストを抽出
   */
  private static stripMarkdown(response: string): string {
    // Step 1: 典型的なJSONコードブロック
    const jsonBlockPattern = /```(?:json)?\s*\n([\s\S]*?)```/;
    const jsonBlockMatch = response.match(jsonBlockPattern);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      return jsonBlockMatch[1].trim();
    }

    // Step 2: 行頭コードブロック記法削除
    let cleaned = response;
    const startPattern = /^```(?:json)?\s*\n/m;
    const endPattern = /\n```\s*$/m;
    
    if (startPattern.test(cleaned)) {
      cleaned = cleaned.replace(startPattern, '');
    }
    if (endPattern.test(cleaned)) {
      cleaned = cleaned.replace(endPattern, '');
    }

    // Step 3: バリデーション
    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch (e) {
      // 次のステップへ
    }

    // Step 4: 最外側の中括弧ペア抽出
    const jsonObjectPattern = /{[\s\S]*?}/;
    const objectMatch = response.match(jsonObjectPattern);
    if (objectMatch) {
      try {
        JSON.parse(objectMatch[0]);
        return objectMatch[0];
      } catch (e) {
        // 次へ
      }
    }

    // Step 5: JSON配列抽出
    const jsonArrayPattern = /\[[\s\S]*?\]/;
    const arrayMatch = response.match(jsonArrayPattern);
    if (arrayMatch) {
      try {
        JSON.parse(arrayMatch[0]);
        return arrayMatch[0];
      } catch (e) {
        // 最終手段へ
      }
    }

    return response;
  }

  /**
   * 壊れたJSONの修復試行
   */
  private static repairJSON(text: string): string | null {
    try {
      let cleaned = this.stripMarkdown(text);
      
      // 1. 末尾の不完全要素除去
      if (!cleaned.endsWith('}') && !cleaned.endsWith(']')) {
        // 最後の完全な要素を見つける
        const lastValidComma = Math.max(
          cleaned.lastIndexOf('},'),
          cleaned.lastIndexOf('],'),
          cleaned.lastIndexOf('",')
        );
        
        if (lastValidComma > 0) {
          cleaned = cleaned.substring(0, lastValidComma + 1);
        }
      }

      // 2. 不正なカンマの修正
      cleaned = cleaned
        // 末尾カンマ除去
        .replace(/,(\s*[}\]])/g, '$1')
        // 重複カンマ除去
        .replace(/,,+/g, ',')
        // オブジェクト/配列開始直後のカンマ除去
        .replace(/([{\[]),/g, '$1');

      // 3. 未閉じの括弧を閉じる
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      let escapeNext = false;

      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') openBraces++;
          else if (char === '}') openBraces--;
          else if (char === '[') openBrackets++;
          else if (char === ']') openBrackets--;
        }
      }

      // 未閉じを閉じる
      while (openBrackets > 0) {
        cleaned += ']';
        openBrackets--;
      }
      while (openBraces > 0) {
        cleaned += '}';
        openBraces--;
      }

      // 4. バリデーション
      JSON.parse(cleaned);
      return cleaned;

    } catch (error) {
      console.warn('JSON修復失敗:', (error as Error).message);
      return null;
    }
  }

  /**
   * 部分的なJSONデータ抽出（フォールバック）
   */
  private static extractPartialJSON(text: string): any {
    const result: any = {};
    
    try {
      // セクション抽出試行
      const sectionsMatch = text.match(/"sections"\s*:\s*\[([\s\S]*?)\]/);
      if (sectionsMatch) {
        try {
          result.sections = JSON.parse(`[${sectionsMatch[1]}]`);
        } catch (e) {
          result.sections = [];
        }
      }

      // タスク抽出試行
      const tasksMatch = text.match(/"tasks"\s*:\s*\[([\s\S]*?)\]/);
      if (tasksMatch) {
        try {
          result.tasks = JSON.parse(`[${tasksMatch[1]}]`);
        } catch (e) {
          result.tasks = [];
        }
      }

      // イベント抽出試行
      const eventsMatch = text.match(/"events"\s*:\s*\[([\s\S]*?)\]/);
      if (eventsMatch) {
        try {
          result.events = JSON.parse(`[${eventsMatch[1]}]`);
        } catch (e) {
          result.events = [];
        }
      }

      // クラスター抽出試行
      const clustersMatch = text.match(/"clusters"\s*:\s*\[([\s\S]*?)\]/);
      if (clustersMatch) {
        try {
          result.clusters = JSON.parse(`[${clustersMatch[1]}]`);
        } catch (e) {
          result.clusters = [];
        }
      }

    } catch (error) {
      console.warn('部分JSON抽出失敗:', (error as Error).message);
    }

    return result;
  }
}
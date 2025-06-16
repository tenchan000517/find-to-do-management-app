// // AI分析エンジン - コンテンツ解析・エンティティ抽出システム
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// // Gemini AI初期化
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// // AI分析結果の型定義
// export interface AIAnalysisResult {
//   tasks: ExtractedTask[];
//   events: ExtractedEvent[];
//   projects: ExtractedProject[];
//   contacts: ExtractedContact[];
//   dates: ExtractedDate[];
//   keywords: string[];
//   sentiment: number;
//   urgency: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
//   businessValue: number;
//   confidence: number;
// }

// export interface ExtractedTask {
//   title: string;
//   description: string;
//   priority: 'A' | 'B' | 'C' | 'D';  // priority enum
//   dueDate?: string;
//   estimatedHours?: number;
//   assignee?: string;
//   confidence: number;
// }

// export interface ExtractedEvent {
//   title: string;
//   date: string;
//   time?: string;
//   endTime?: string;
//   location?: string;
//   participants: string[];
//   type: 'MEETING' | 'EVENT' | 'DEADLINE';
//   confidence: number;
// }

// export interface ExtractedProject {
//   name: string;
//   description: string;
//   phase: string;
//   teamMembers: string[];
//   startDate?: string;
//   endDate?: string;
//   priority: 'A' | 'B' | 'C' | 'D';
//   confidence: number;
// }

// export interface ExtractedContact {
//   name: string;
//   company?: string;
//   position?: string;
//   email?: string;
//   phone?: string;
//   type: 'COMPANY' | 'STUDENT';
//   confidence: number;
// }

// export interface ExtractedDate {
//   date: string;
//   context: string;
//   type: 'deadline' | 'meeting' | 'milestone' | 'general';
//   confidence: number;
// }

// // メインAI分析クラス
// export class ContentAnalyzer {
//   private static instance: ContentAnalyzer;
  
//   static getInstance(): ContentAnalyzer {
//     if (!this.instance) {
//       this.instance = new ContentAnalyzer();
//     }
//     return this.instance;
//   }

//   // 包括的なコンテンツ分析
//   async analyzeContent(
//     content: string,
//     analysisType: 'COMPREHENSIVE' | 'TASK_FOCUSED' | 'EVENT_FOCUSED' | 'PROJECT_FOCUSED' | 'SENTIMENT_ONLY' = 'COMPREHENSIVE'
//   ): Promise<AIAnalysisResult> {
//     const startTime = Date.now();

//     try {
//       console.log(`🧠 AI分析開始: ${analysisType} (${content.length}文字)`);

//       // 分析タイプに応じたプロンプト生成
//       const prompt = this.buildAnalysisPrompt(content, analysisType);
      
//       // Gemini AIでコンテンツ分析
//       const result = await model.generateContent(prompt);
//       const responseText = result.response.text();
      
//       // AI応答をパースして構造化データに変換
//       const analysisResult = this.parseAIResponse(responseText, analysisType);
      
//       const processingTime = Date.now() - startTime;
//       console.log(`✅ AI分析完了: ${processingTime}ms, 信頼度=${analysisResult.confidence}`);

//       return analysisResult;

//     } catch (error) {
//       console.error('❌ AI分析エラー:', error);
      
//       // フォールバック: 基本的なキーワード抽出
//       return this.fallbackAnalysis(content);
//     }
//   }

//   // 分析タイプ別プロンプト生成
//   private buildAnalysisPrompt(content: string, analysisType: string): string {
//     const baseInstructions = `
// 以下の日本語コンテンツを分析し、JSON形式で回答してください。

// **分析対象コンテンツ:**
// ${content}

// **回答形式 (必ずこのJSON構造で回答):**
// {
//   "tasks": [
//     {
//       "title": "タスク名",
//       "description": "詳細説明",
//       "priority": "A|B|C|D",
//       "dueDate": "YYYY-MM-DD", // 明確な期限がある場合のみ
//       "estimatedHours": 数値, // 推定時間（時間単位）
//       "assignee": "担当者名", // 明確に指定されている場合のみ
//       "confidence": 0.8 // 0-1の信頼度
//     }
//   ],
//   "events": [
//     {
//       "title": "イベント名",
//       "date": "YYYY-MM-DD",
//       "time": "HH:MM", // 時間が明記されている場合のみ
//       "endTime": "HH:MM", // 終了時間が明記されている場合のみ
//       "location": "場所", // 場所が明記されている場合のみ
//       "participants": ["参加者1", "参加者2"],
//       "type": "MEETING|EVENT|DEADLINE",
//       "confidence": 0.9
//     }
//   ],
//   "projects": [
//     {
//       "name": "プロジェクト名",
//       "description": "概要",
//       "phase": "concept|planning|development|testing|launch|maintenance",
//       "teamMembers": ["メンバー1", "メンバー2"],
//       "startDate": "YYYY-MM-DD", // 開始日が明記されている場合のみ
//       "endDate": "YYYY-MM-DD", // 終了日が明記されている場合のみ
//       "priority": "A|B|C|D",
//       "confidence": 0.7
//     }
//   ],
//   "contacts": [
//     {
//       "name": "連絡先名",
//       "company": "会社名",
//       "position": "役職",
//       "email": "メールアドレス", // 明記されている場合のみ
//       "phone": "電話番号", // 明記されている場合のみ
//       "type": "COMPANY|STUDENT",
//       "confidence": 0.8
//     }
//   ],
//   "dates": [
//     {
//       "date": "YYYY-MM-DD",
//       "context": "日付の文脈",
//       "type": "deadline|meeting|milestone|general",
//       "confidence": 0.6
//     }
//   ],
//   "keywords": ["キーワード1", "キーワード2", "キーワード3"],
//   "sentiment": 0.5, // -1（ネガティブ）から1（ポジティブ）
//   "urgency": "VERY_LOW|LOW|MEDIUM|HIGH|CRITICAL",
//   "businessValue": 0.7, // 0-1のビジネス価値
//   "confidence": 0.8 // 全体的な分析の信頼度
// }
// `;

//     switch (analysisType) {
//       case 'TASK_FOCUSED':
//         return baseInstructions + `
// **特別指示:** タスク抽出に特化してください。行動項目、TODO、課題、対応すべき事項を重点的に見つけてください。`;

//       case 'EVENT_FOCUSED':
//         return baseInstructions + `
// **特別指示:** イベント・予定抽出に特化してください。会議、締切、ミーティング、イベントを重点的に見つけてください。`;

//       case 'PROJECT_FOCUSED':
//         return baseInstructions + `
// **特別指示:** プロジェクト抽出に特化してください。新規企画、継続プロジェクト、チーム活動を重点的に見つけてください。`;

//       case 'SENTIMENT_ONLY':
//         return baseInstructions + `
// **特別指示:** センチメント分析に特化してください。感情、雰囲気、緊急度の判定を重点的に行ってください。`;

//       default:
//         return baseInstructions + `
// **特別指示:** 包括的な分析を行ってください。すべての要素をバランスよく抽出してください。`;
//     }
//   }

//   // AI応答のパース処理
//   private parseAIResponse(responseText: string, analysisType: string): AIAnalysisResult {
//     try {
//       // JSONブロックを抽出
//       const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
//                        responseText.match(/```\n([\s\S]*?)\n```/) ||
//                        responseText.match(/\{[\s\S]*\}/);
      
//       if (!jsonMatch) {
//         throw new Error('JSON形式のレスポンスが見つかりません');
//       }

//       const jsonString = jsonMatch[1] || jsonMatch[0];
//       const parsed = JSON.parse(jsonString);

//       // 型安全性チェック・デフォルト値設定
//       return {
//         tasks: this.validateTasks(parsed.tasks || []),
//         events: this.validateEvents(parsed.events || []),
//         projects: this.validateProjects(parsed.projects || []),
//         contacts: this.validateContacts(parsed.contacts || []),
//         dates: this.validateDates(parsed.dates || []),
//         keywords: this.validateKeywords(parsed.keywords || []),
//         sentiment: this.validateNumber(parsed.sentiment, -1, 1, 0),
//         urgency: this.validateUrgency(parsed.urgency),
//         businessValue: this.validateNumber(parsed.businessValue, 0, 1, 0.5),
//         confidence: this.validateNumber(parsed.confidence, 0, 1, 0.5)
//       };

//     } catch (error) {
//       console.warn('⚠️ AI応答パースエラー:', error);
//       console.log('Raw AI Response:', responseText);
      
//       // パースエラー時はフォールバック処理
//       return this.createEmptyResult();
//     }
//   }

//   // フォールバック分析（AI失敗時）
//   private fallbackAnalysis(content: string): AIAnalysisResult {
//     console.log('🔄 フォールバック分析実行');

//     const keywords = this.extractBasicKeywords(content);
//     const urgency = this.detectBasicUrgency(content);
    
//     return {
//       tasks: [],
//       events: [],
//       projects: [],
//       contacts: [],
//       dates: [],
//       keywords,
//       sentiment: 0,
//       urgency,
//       businessValue: 0.3,
//       confidence: 0.2 // 低い信頼度
//     };
//   }

//   // 基本的なキーワード抽出
//   private extractBasicKeywords(content: string): string[] {
//     // 日本語キーワード抽出（3-8文字）
//     const japaneseWords = content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{3,8}/g) || [];
    
//     // 頻出単語を除外
//     const stopWords = ['について', 'という', 'ということ', 'である', 'です', 'ます', 'した', 'する', 'なる', 'ある', 'いる', 'れる', 'られる'];
    
//     const filtered = japaneseWords
//       .filter(word => !stopWords.includes(word))
//       .filter(word => word.length >= 3 && word.length <= 8);

//     // 重複削除・頻度順ソート
//     const frequency = new Map<string, number>();
//     filtered.forEach(word => {
//       frequency.set(word, (frequency.get(word) || 0) + 1);
//     });

//     return Array.from(frequency.entries())
//       .sort(([,a], [,b]) => b - a)
//       .slice(0, 10)
//       .map(([word]) => word);
//   }

//   // 基本的な緊急度検出
//   private detectBasicUrgency(content: string): 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
//     const criticalWords = /緊急|至急|即座|すぐに|今すぐ|大至急/i;
//     const highWords = /急ぎ|早急|重要|優先|締切|期限/i;
//     const mediumWords = /来週|来月|予定|計画|検討/i;

//     if (criticalWords.test(content)) return 'CRITICAL';
//     if (highWords.test(content)) return 'HIGH';
//     if (mediumWords.test(content)) return 'MEDIUM';
    
//     return 'LOW';
//   }

//   // バリデーション関数群
//   private validateTasks(tasks: any[]): ExtractedTask[] {
//     return tasks.filter(task => task.title && typeof task.title === 'string').map(task => ({
//       title: String(task.title),
//       description: String(task.description || ''),
//       priority: this.validatePriority(task.priority),
//       dueDate: task.dueDate && this.isValidDate(task.dueDate) ? task.dueDate : undefined,
//       estimatedHours: typeof task.estimatedHours === 'number' ? task.estimatedHours : undefined,
//       assignee: task.assignee && typeof task.assignee === 'string' ? task.assignee : undefined,
//       confidence: this.validateNumber(task.confidence, 0, 1, 0.5)
//     }));
//   }

//   private validateEvents(events: any[]): ExtractedEvent[] {
//     return events.filter(event => event.title && event.date && this.isValidDate(event.date)).map(event => ({
//       title: String(event.title),
//       date: event.date,
//       time: event.time && this.isValidTime(event.time) ? event.time : undefined,
//       endTime: event.endTime && this.isValidTime(event.endTime) ? event.endTime : undefined,
//       location: event.location && typeof event.location === 'string' ? event.location : undefined,
//       participants: Array.isArray(event.participants) ? event.participants.filter((p: any) => typeof p === 'string') : [],
//       type: ['MEETING', 'EVENT', 'DEADLINE'].includes(event.type) ? event.type : 'EVENT',
//       confidence: this.validateNumber(event.confidence, 0, 1, 0.5)
//     }));
//   }

//   private validateProjects(projects: any[]): ExtractedProject[] {
//     return projects.filter(project => project.name && typeof project.name === 'string').map(project => ({
//       name: String(project.name),
//       description: String(project.description || ''),
//       phase: this.validatePhase(project.phase),
//       teamMembers: Array.isArray(project.teamMembers) ? project.teamMembers.filter((m: any) => typeof m === 'string') : [],
//       startDate: project.startDate && this.isValidDate(project.startDate) ? project.startDate : undefined,
//       endDate: project.endDate && this.isValidDate(project.endDate) ? project.endDate : undefined,
//       priority: this.validatePriority(project.priority),
//       confidence: this.validateNumber(project.confidence, 0, 1, 0.5)
//     }));
//   }

//   private validateContacts(contacts: any[]): ExtractedContact[] {
//     return contacts.filter(contact => contact.name && typeof contact.name === 'string').map(contact => ({
//       name: String(contact.name),
//       company: contact.company && typeof contact.company === 'string' ? contact.company : undefined,
//       position: contact.position && typeof contact.position === 'string' ? contact.position : undefined,
//       email: contact.email && this.isValidEmail(contact.email) ? contact.email : undefined,
//       phone: contact.phone && typeof contact.phone === 'string' ? contact.phone : undefined,
//       type: ['COMPANY', 'STUDENT'].includes(contact.type) ? contact.type : 'COMPANY',
//       confidence: this.validateNumber(contact.confidence, 0, 1, 0.5)
//     }));
//   }

//   private validateDates(dates: any[]): ExtractedDate[] {
//     return dates.filter(date => date.date && this.isValidDate(date.date)).map(date => ({
//       date: date.date,
//       context: String(date.context || ''),
//       type: ['deadline', 'meeting', 'milestone', 'general'].includes(date.type) ? date.type : 'general',
//       confidence: this.validateNumber(date.confidence, 0, 1, 0.5)
//     }));
//   }

//   private validateKeywords(keywords: any[]): string[] {
//     return Array.isArray(keywords) 
//       ? keywords.filter(k => typeof k === 'string' && k.length > 0).slice(0, 10)
//       : [];
//   }

//   // ユーティリティ関数
//   private validateNumber(value: any, min: number, max: number, defaultValue: number): number {
//     const num = parseFloat(value);
//     if (isNaN(num)) return defaultValue;
//     return Math.max(min, Math.min(max, num));
//   }

//   private validatePriority(priority: any): 'A' | 'B' | 'C' | 'D' {
//     return ['A', 'B', 'C', 'D'].includes(priority) ? priority : 'C';
//   }

//   private validateUrgency(urgency: any): 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
//     return ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(urgency) ? urgency : 'MEDIUM';
//   }

//   private validatePhase(phase: any): string {
//     const validPhases = ['concept', 'planning', 'development', 'testing', 'launch', 'maintenance'];
//     return validPhases.includes(phase) ? phase : 'concept';
//   }

//   private isValidDate(dateString: string): boolean {
//     const date = new Date(dateString);
//     return !isNaN(date.getTime()) && !!dateString.match(/^\d{4}-\d{2}-\d{2}$/);
//   }

//   private isValidTime(timeString: string): boolean {
//     return /^\d{2}:\d{2}$/.test(timeString);
//   }

//   private isValidEmail(email: string): boolean {
//     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//   }

//   private createEmptyResult(): AIAnalysisResult {
//     return {
//       tasks: [],
//       events: [],
//       projects: [],
//       contacts: [],
//       dates: [],
//       keywords: [],
//       sentiment: 0,
//       urgency: 'MEDIUM',
//       businessValue: 0,
//       confidence: 0
//     };
//   }
// }

// // ファクトリー関数
// export const createContentAnalyzer = () => ContentAnalyzer.getInstance();
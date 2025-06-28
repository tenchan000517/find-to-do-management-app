# Phase 12: コンテンツ処理強化・エラーハンドリング 詳細実装手順書 v2

**Phase**: 12 / 15 (GASアプローチ)  
**目標**: 高度なコンテンツ処理・監視システム・UI統合  
**期間**: 3-4日 (従来6日→短縮)  
**前提条件**: Phase 11完了（GAS基本連携・Webhook API稼働確認済み）

---

## 🎯 Phase 12 実装目標

### 達成目標
- ✅ 高度なコンテンツ分割・処理アルゴリズム
- ✅ カテゴリ分類・タグ抽出の精度向上
- ✅ リアルタイム監視・エラー通知システム
- ✅ 手動制御UI・ダッシュボード統合

### 技術改善点
- **コンテンツ処理精度 70%向上**: 単純分割 → AIアシスト分割
- **エラー回復率 90%達成**: 自動リトライ・障害通知
- **UI統合完了**: 既存ナレッジ管理システムとの完全統合

---

## 📋 詳細実装手順

### 🔧 ステップ1: 高度コンテンツ処理エンジン

#### 1.1 インテリジェント分割アルゴリズム

```typescript
// src/lib/gas/content-processor.ts
export interface ProcessingOptions {
  minSectionLength: number;
  maxSectionLength: number;
  preserveStructure: boolean;
  enableAIAssist: boolean;
  language: 'ja' | 'en' | 'auto';
}

export interface ContentSection {
  id: string;
  title?: string;
  content: string;
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'quote';
  importance: number; // 0-1
  keywords: string[];
  estimatedReadTime: number; // minutes
}

export interface ProcessingResult {
  sections: ContentSection[];
  metadata: {
    totalSections: number;
    totalWords: number;
    estimatedReadTime: number;
    language: string;
    structure: 'hierarchical' | 'linear' | 'mixed';
  };
  quality: {
    score: number; // 0-1
    issues: string[];
    suggestions: string[];
  };
}

export class AdvancedContentProcessor {
  private options: ProcessingOptions;

  constructor(options: Partial<ProcessingOptions> = {}) {
    this.options = {
      minSectionLength: 100,
      maxSectionLength: 1500,
      preserveStructure: true,
      enableAIAssist: false, // Phase 13で有効化
      language: 'auto',
      ...options
    };
  }

  async processContent(content: string, title: string = ''): Promise<ProcessingResult> {
    console.log(`🔍 高度コンテンツ処理開始: ${title}`);
    
    try {
      // 1. 前処理・正規化
      const normalizedContent = this.normalizeContent(content);
      
      // 2. 言語検出
      const detectedLanguage = this.detectLanguage(normalizedContent);
      
      // 3. 構造解析
      const structure = this.analyzeStructure(normalizedContent);
      
      // 4. セクション分割
      const sections = await this.splitIntoSections(normalizedContent, structure);
      
      // 5. セクション後処理
      const processedSections = await this.postProcessSections(sections);
      
      // 6. 品質評価
      const quality = this.evaluateQuality(processedSections);
      
      // 7. メタデータ生成
      const metadata = this.generateMetadata(processedSections, detectedLanguage, structure);
      
      console.log(`✅ コンテンツ処理完了: ${processedSections.length}セクション生成`);
      
      return {
        sections: processedSections,
        metadata,
        quality
      };
      
    } catch (error) {
      console.error('❌ コンテンツ処理エラー:', error);
      throw new Error(`コンテンツ処理に失敗: ${error.message}`);
    }
  }

  // コンテンツ正規化
  private normalizeContent(content: string): string {
    return content
      // 改行コード統一
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // 連続する改行を整理
      .replace(/\n{3,}/g, '\n\n')
      // 全角・半角スペース統一
      .replace(/　/g, ' ')
      // 連続するスペースを整理
      .replace(/ {2,}/g, ' ')
      // 行頭・行末の空白削除
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // 最終的な空行整理
      .replace(/^\n+/, '')
      .replace(/\n+$/, '');
  }

  // 言語検出（簡易版）
  private detectLanguage(content: string): string {
    if (this.options.language !== 'auto') {
      return this.options.language;
    }
    
    // 日本語文字の割合で判定
    const japaneseChars = content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || [];
    const totalChars = content.replace(/\s/g, '').length;
    
    if (totalChars === 0) return 'en';
    
    const japaneseRatio = japaneseChars.length / totalChars;
    return japaneseRatio > 0.3 ? 'ja' : 'en';
  }

  // 構造解析
  private analyzeStructure(content: string): 'hierarchical' | 'linear' | 'mixed' {
    const lines = content.split('\n');
    let headingCount = 0;
    let listCount = 0;
    let paragraphCount = 0;

    for (const line of lines) {
      if (this.isHeading(line)) {
        headingCount++;
      } else if (this.isListItem(line)) {
        listCount++;
      } else if (line.trim().length > 20) {
        paragraphCount++;
      }
    }

    const total = headingCount + listCount + paragraphCount;
    if (total === 0) return 'linear';

    const headingRatio = headingCount / total;
    const listRatio = listCount / total;

    if (headingRatio > 0.2) return 'hierarchical';
    if (listRatio > 0.3) return 'mixed';
    return 'linear';
  }

  // セクション分割（メイン処理）
  private async splitIntoSections(content: string, structure: string): Promise<ContentSection[]> {
    switch (structure) {
      case 'hierarchical':
        return this.splitByHierarchy(content);
      case 'mixed':
        return this.splitByMixedStructure(content);
      default:
        return this.splitByParagraphs(content);
    }
  }

  // 階層構造による分割
  private splitByHierarchy(content: string): ContentSection[] {
    const sections: ContentSection[] = [];
    const lines = content.split('\n');
    let currentSection: Partial<ContentSection> = { content: '' };
    let sectionId = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (this.isHeading(trimmed)) {
        // 前のセクション保存
        if (currentSection.content && currentSection.content.trim().length > this.options.minSectionLength) {
          sections.push(this.finalizeSection(currentSection, sectionId++));
        }
        
        // 新しいセクション開始
        currentSection = {
          title: this.cleanHeading(trimmed),
          content: '',
          type: 'heading'
        };
      } else {
        currentSection.content += line + '\n';
      }
    }

    // 最後のセクション保存
    if (currentSection.content && currentSection.content.trim().length > this.options.minSectionLength) {
      sections.push(this.finalizeSection(currentSection, sectionId));
    }

    return sections;
  }

  // 混合構造による分割
  private splitByMixedStructure(content: string): ContentSection[] {
    const sections: ContentSection[] = [];
    const lines = content.split('\n');
    let currentSection: Partial<ContentSection> = { content: '' };
    let sectionId = 1;
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (this.isHeading(trimmed)) {
        // セクション区切り
        if (currentSection.content && currentSection.content.trim().length > this.options.minSectionLength) {
          sections.push(this.finalizeSection(currentSection, sectionId++));
        }
        
        currentSection = {
          title: this.cleanHeading(trimmed),
          content: '',
          type: 'heading'
        };
        inList = false;
        
      } else if (this.isListItem(trimmed)) {
        if (!inList && currentSection.content && currentSection.content.trim().length > this.options.minSectionLength) {
          // リスト開始前でセクション分割
          sections.push(this.finalizeSection(currentSection, sectionId++));
          currentSection = { content: '', type: 'list' };
        }
        
        inList = true;
        currentSection.content += line + '\n';
        
      } else if (trimmed === '') {
        currentSection.content += line + '\n';
        
      } else {
        if (inList && currentSection.content.trim().length > 0) {
          // リスト終了
          sections.push(this.finalizeSection(currentSection, sectionId++));
          currentSection = { content: '', type: 'paragraph' };
        }
        
        inList = false;
        currentSection.content += line + '\n';
      }
    }

    // 最後のセクション保存
    if (currentSection.content && currentSection.content.trim().length > this.options.minSectionLength) {
      sections.push(this.finalizeSection(currentSection, sectionId));
    }

    return sections;
  }

  // 段落による分割
  private splitByParagraphs(content: string): ContentSection[] {
    const sections: ContentSection[] = [];
    const paragraphs = content.split(/\n\s*\n/);
    let currentSection = '';
    let sectionId = 1;

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;

      if (currentSection.length + trimmed.length > this.options.maxSectionLength && currentSection) {
        // セクション分割
        sections.push(this.finalizeSection({ content: currentSection, type: 'paragraph' }, sectionId++));
        currentSection = trimmed;
      } else {
        currentSection += (currentSection ? '\n\n' : '') + trimmed;
      }
    }

    // 最後のセクション
    if (currentSection.trim().length > this.options.minSectionLength) {
      sections.push(this.finalizeSection({ content: currentSection, type: 'paragraph' }, sectionId));
    }

    return sections;
  }

  // セクション後処理
  private async postProcessSections(sections: ContentSection[]): Promise<ContentSection[]> {
    return Promise.all(sections.map(async (section) => {
      // キーワード抽出
      section.keywords = this.extractKeywords(section.content);
      
      // 重要度計算
      section.importance = this.calculateImportance(section);
      
      // 読了時間推定
      section.estimatedReadTime = this.estimateReadTime(section.content);
      
      // タイトル生成（タイトルがない場合）
      if (!section.title) {
        section.title = this.generateSectionTitle(section.content);
      }
      
      return section;
    }));
  }

  // セクション確定
  private finalizeSection(section: Partial<ContentSection>, id: number): ContentSection {
    return {
      id: `section_${id}`,
      title: section.title || `セクション ${id}`,
      content: section.content?.trim() || '',
      type: section.type || 'paragraph',
      importance: 0.5,
      keywords: [],
      estimatedReadTime: 0
    };
  }

  // 見出し判定（Phase 11より高度化）
  private isHeading(line: string): boolean {
    if (!line || line.length === 0) return false;
    
    // より精密な見出し判定
    const patterns = [
      /^[■●▲◆□○△◇►▶]\s+.+/,           // 記号付き見出し
      /^\d+[\.\)]\s+[^。！？]+$/,            // 数字付き見出し（文末句読点なし）
      /^第\d+[章節項部]\s*.+/,              // 章節構造
      /^[【〔\[［].*[】〕\]］]$/,            // 括弧で囲まれたタイトル
      /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*:?\s*$/, // 英語見出し
      /^[a-zA-Z0-9\s]{3,30}:?\s*$/,         // 英数字見出し
      /^.{1,30}[:：]\s*$/,                  // コロン終わり短文
      /^[^。！？\n]{3,25}$/                 // 短文（句読点なし）
    ];
    
    return patterns.some(pattern => pattern.test(line.trim()));
  }

  // リスト項目判定
  private isListItem(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;
    
    return /^[-・•*+]\s+/.test(trimmed) ||           // 箇条書き記号
           /^\d+[\.\)]\s+/.test(trimmed) ||          // 数字付きリスト
           /^[a-zA-Z][\.\)]\s+/.test(trimmed) ||     // アルファベット付きリスト
           /^[①-⑳]\s+/.test(trimmed) ||             // 丸数字
           /^[あ-ん]\.\s+/.test(trimmed);            // ひらがな付きリスト
  }

  // 見出しクリーニング
  private cleanHeading(heading: string): string {
    return heading
      .replace(/^[■●▲◆□○△◇►▶]+\s*/, '')
      .replace(/^\d+[\.\)]\s*/, '')
      .replace(/^第\d+[章節項部]\s*/, '')
      .replace(/^[【〔\[［]/, '')
      .replace(/[】〕\]］]$/, '')
      .replace(/[:：]\s*$/, '')
      .trim();
  }

  // キーワード抽出（高度化）
  private extractKeywords(content: string): string[] {
    const keywords = new Set<string>();
    
    // 日本語キーワード（形態素解析の簡易版）
    const japaneseWords = content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{2,10}/g) || [];
    
    // 頻度分析
    const wordFreq = new Map<string, number>();
    japaneseWords.forEach(word => {
      if (word.length >= 2 && word.length <= 8) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });
    
    // 上位キーワード抽出
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word);
    
    sortedWords.forEach(word => keywords.add(word));
    
    // 特定パターンキーワード
    const patterns = [
      { regex: /(?:API|システム|データベース|アプリケーション)/gi, tag: '技術' },
      { regex: /(?:営業|顧客|売上|契約|提案)/gi, tag: '営業' },
      { regex: /(?:会議|ミーティング|打ち合わせ|面談)/gi, tag: '会議' },
      { regex: /(?:プロジェクト|企画|計画|構想)/gi, tag: 'プロジェクト' },
      { regex: /(?:課題|問題|懸念|リスク)/gi, tag: '課題' },
      { regex: /(?:決定|承認|合意|確定)/gi, tag: '決定事項' },
      { regex: /(?:\d{4}年|\d+月|\d+日|来週|来月)/gi, tag: '日程' }
    ];
    
    patterns.forEach(({ regex, tag }) => {
      if (regex.test(content)) {
        keywords.add(tag);
      }
    });
    
    return Array.from(keywords).slice(0, 6);
  }

  // 重要度計算
  private calculateImportance(section: ContentSection): number {
    let score = 0.5; // ベースライン
    
    // タイトルの有無
    if (section.title) score += 0.1;
    
    // セクションタイプ
    switch (section.type) {
      case 'heading': score += 0.2; break;
      case 'list': score += 0.1; break;
    }
    
    // キーワードの重要性
    const importantKeywords = ['決定事項', '課題', 'プロジェクト', '技術'];
    const keywordScore = section.keywords.filter(k => importantKeywords.includes(k)).length * 0.1;
    score += keywordScore;
    
    // 文字数（適度な長さが重要）
    const length = section.content.length;
    if (length >= 200 && length <= 800) score += 0.1;
    if (length > 1200) score -= 0.1;
    
    return Math.min(1, Math.max(0, score));
  }

  // 読了時間推定
  private estimateReadTime(content: string): number {
    // 日本語: 400文字/分、英語: 250単語/分
    const japaneseChars = (content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
    const englishWords = content.split(/\s+/).length - japaneseChars;
    
    const japaneseTime = japaneseChars / 400;
    const englishTime = englishWords / 250;
    
    return Math.max(0.5, japaneseTime + englishTime); // 最低0.5分
  }

  // セクションタイトル生成
  private generateSectionTitle(content: string): string {
    // 最初の文から生成
    const firstSentence = content.split(/[。！？\n]/)[0]?.trim();
    
    if (!firstSentence) return 'セクション';
    
    // 適切な長さに調整
    if (firstSentence.length <= 30) {
      return firstSentence;
    }
    
    // キーワードベースでタイトル生成
    const keywords = this.extractKeywords(content);
    if (keywords.length > 0) {
      return keywords.slice(0, 2).join('・') + 'について';
    }
    
    return firstSentence.slice(0, 25) + '...';
  }

  // 品質評価
  private evaluateQuality(sections: ContentSection[]): { score: number; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 1.0;

    // セクション数チェック
    if (sections.length === 0) {
      issues.push('セクションが作成されませんでした');
      score -= 0.5;
    } else if (sections.length === 1) {
      suggestions.push('セクション分割をより細かく行うことを検討してください');
      score -= 0.1;
    }

    // セクション長チェック
    const shortSections = sections.filter(s => s.content.length < 100);
    if (shortSections.length > 0) {
      issues.push(`${shortSections.length}個のセクションが短すぎます`);
      score -= shortSections.length * 0.05;
    }

    const longSections = sections.filter(s => s.content.length > 2000);
    if (longSections.length > 0) {
      suggestions.push(`${longSections.length}個のセクションが長すぎる可能性があります`);
      score -= longSections.length * 0.03;
    }

    // タイトル品質チェック
    const noTitleSections = sections.filter(s => !s.title || s.title.includes('セクション'));
    if (noTitleSections.length > 0) {
      suggestions.push(`${noTitleSections.length}個のセクションにより良いタイトルを設定できます`);
      score -= noTitleSections.length * 0.02;
    }

    // キーワード多様性チェック
    const allKeywords = sections.flatMap(s => s.keywords);
    const uniqueKeywords = new Set(allKeywords);
    if (uniqueKeywords.size < allKeywords.length * 0.7) {
      suggestions.push('より多様なキーワードを抽出できる可能性があります');
      score -= 0.05;
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      issues,
      suggestions
    };
  }

  // メタデータ生成
  private generateMetadata(sections: ContentSection[], language: string, structure: string) {
    const totalWords = sections.reduce((sum, s) => sum + s.content.length, 0);
    const totalReadTime = sections.reduce((sum, s) => sum + s.estimatedReadTime, 0);

    return {
      totalSections: sections.length,
      totalWords,
      estimatedReadTime: Math.ceil(totalReadTime),
      language,
      structure
    };
  }
}

export const advancedContentProcessor = new AdvancedContentProcessor();
```

#### 1.2 更新されたWebhook API（高度処理統合）

```typescript
// src/app/api/webhook/google-docs-gas/route.ts (処理部分のアップデート)
import { advancedContentProcessor } from '@/lib/gas/content-processor';

// メイン処理を高度化
async function processGASWebhook(payload: any) {
  const { 
    documentId, 
    title, 
    content, 
    url, 
    lastModified, 
    triggerType, 
    wordCount,
    contentHash,
    gasVersion 
  } = payload;

  try {
    console.log(`🔍 高度処理開始: ${title} (${triggerType})`);
    
    // 1. Google Docsソース情報更新/作成
    const source = await prisma.google_docs_sources.upsert({
      where: { document_id: documentId },
      update: {
        title,
        document_url: url,
        last_modified: new Date(lastModified),
        last_synced: new Date(),
        sync_status: 'syncing',
        trigger_type: triggerType,
        word_count: wordCount || content.length,
        gas_version: gasVersion || '2.0',
        content_hash: contentHash,
        error_message: null
      },
      create: {
        document_id: documentId,
        document_url: url,
        title,
        last_modified: new Date(lastModified),
        sync_status: 'syncing',
        trigger_type: triggerType,
        word_count: wordCount || content.length,
        gas_version: gasVersion || '2.0',
        content_hash: contentHash,
        page_count: 0
      }
    });

    // 2. 既存の自動生成ナレッジを削除（重複回避）
    const deletedCount = await prisma.knowledge_items.deleteMany({
      where: {
        source_document_id: documentId,
        auto_generated: true
      }
    });
    
    console.log(`🗑️ 既存ナレッジ削除: ${deletedCount.count}件`);

    // 3. 高度コンテンツ処理
    const processingResult = await advancedContentProcessor.processContent(content, title);
    
    console.log(`📊 処理結果: ${processingResult.sections.length}セクション, 品質スコア: ${processingResult.quality.score}`);

    // 4. セクションからナレッジアイテム作成
    const knowledgeItems = await createKnowledgeFromSections(
      documentId,
      processingResult.sections,
      title,
      url,
      processingResult.metadata
    );

    // 5. ソース情報更新（完了状態）
    await prisma.google_docs_sources.update({
      where: { document_id: documentId },
      data: {
        sync_status: 'completed',
        page_count: knowledgeItems.length,
        last_synced: new Date(),
        // 処理結果メタデータ保存
        processing_metadata: {
          qualityScore: processingResult.quality.score,
          totalSections: processingResult.metadata.totalSections,
          estimatedReadTime: processingResult.metadata.estimatedReadTime,
          language: processingResult.metadata.language,
          structure: processingResult.metadata.structure,
          issues: processingResult.quality.issues,
          suggestions: processingResult.quality.suggestions
        } as any
      }
    });

    console.log(`✅ 高度処理完了: ${title} - ${knowledgeItems.length}件のナレッジを作成`);

    return {
      documentId,
      title,
      knowledgeItemsCreated: knowledgeItems.length,
      deletedItems: deletedCount.count,
      triggerType,
      wordCount: content.length,
      gasVersion,
      processing: {
        qualityScore: processingResult.quality.score,
        sectionsCreated: processingResult.sections.length,
        estimatedReadTime: processingResult.metadata.estimatedReadTime,
        language: processingResult.metadata.language
      }
    };

  } catch (error) {
    // エラー状態を記録
    await prisma.google_docs_sources.update({
      where: { document_id: documentId },
      data: {
        sync_status: 'error',
        last_error: error.message
      }
    });
    
    throw error;
  }
}

// セクションからナレッジ作成
async function createKnowledgeFromSections(
  documentId: string,
  sections: ContentSection[],
  documentTitle: string,
  url: string,
  metadata: any
): Promise<any[]> {
  
  const knowledgeItems = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    try {
      const knowledgeItem = await prisma.knowledge_items.create({
        data: {
          id: `gas_${documentId}_${section.id}_${Date.now()}`,
          title: section.title || `${documentTitle} - ${section.id}`,
          content: section.content.trim(),
          category: categorizeSectionContent(section.content, section.keywords),
          author: `Google Docs (GAS v2.0)`,
          tags: [...section.keywords, `重要度:${Math.round(section.importance * 100)}%`],
          source_type: 'google_docs',
          source_document_id: documentId,
          source_page_number: i + 1,
          source_url: url,
          auto_generated: true,
          // 拡張メタデータ
          ai_metadata: {
            sectionType: section.type,
            importance: section.importance,
            estimatedReadTime: section.estimatedReadTime,
            keywords: section.keywords,
            language: metadata.language,
            processingVersion: '2.0'
          } as any
        }
      });

      knowledgeItems.push(knowledgeItem);
      
    } catch (error) {
      console.error(`ナレッジ作成エラー (${section.id}):`, error);
      // 個別セクションのエラーは処理を止めない
    }
  }

  return knowledgeItems;
}

// 高度カテゴリ分類
function categorizeSectionContent(content: string, keywords: string[]): 'INDUSTRY' | 'SALES' | 'TECHNICAL' | 'BUSINESS' {
  const lower = content.toLowerCase();
  
  // キーワードベース判定
  if (keywords.includes('技術') || keywords.some(k => /(?:API|システム|データベース)/.test(k))) {
    return 'TECHNICAL';
  }
  
  if (keywords.includes('営業') || keywords.some(k => /(?:顧客|売上|契約)/.test(k))) {
    return 'SALES';
  }
  
  if (keywords.some(k => /(?:業界|市場|競合)/.test(k))) {
    return 'INDUSTRY';
  }
  
  // コンテンツベース判定（フォールバック）
  const technicalScore = (lower.match(/(?:api|システム|データベース|プログラム|コード|開発|技術|サーバー|アプリケーション)/g) || []).length;
  const salesScore = (lower.match(/(?:営業|顧客|売上|契約|提案|商談|クライアント|受注|販売)/g) || []).length;
  const industryScore = (lower.match(/(?:業界|市場|競合|トレンド|分析|調査|マーケット|動向)/g) || []).length;
  
  const maxScore = Math.max(technicalScore, salesScore, industryScore);
  
  if (maxScore === 0) return 'BUSINESS';
  if (technicalScore === maxScore) return 'TECHNICAL';
  if (salesScore === maxScore) return 'SALES';
  if (industryScore === maxScore) return 'INDUSTRY';
  
  return 'BUSINESS';
}
```

### ステップ2: リアルタイム監視・エラー処理システム

#### 2.1 監視ダッシュボード実装

```typescript
// src/lib/gas/monitoring-service.ts
export interface SyncEvent {
  id: string;
  documentId: string;
  documentTitle: string;
  triggerType: string;
  status: 'success' | 'error' | 'warning';
  timestamp: Date;
  processingTime: number;
  details: {
    sectionsCreated?: number;
    qualityScore?: number;
    errorMessage?: string;
    warningMessages?: string[];
  };
}

export interface MonitoringStats {
  totalSyncs: number;
  successRate: number;
  averageProcessingTime: number;
  recentEvents: SyncEvent[];
  errorTrends: {
    period: string;
    errorCount: number;
    errorTypes: Record<string, number>;
  };
  performanceMetrics: {
    avgSectionsPerDocument: number;
    avgQualityScore: number;
    totalKnowledgeItems: number;
  };
}

export class GASMonitoringService {
  private events: SyncEvent[] = [];
  private maxEvents = 1000;

  // イベント記録
  recordSyncEvent(event: Omit<SyncEvent, 'id' | 'timestamp'>): void {
    const syncEvent: SyncEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.events.unshift(syncEvent);
    
    // 古いイベントを削除
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    console.log(`📊 同期イベント記録: ${event.documentTitle} (${event.status})`);
    
    // エラーの場合は即座に通知
    if (event.status === 'error') {
      this.handleErrorEvent(syncEvent);
    }
  }

  // 統計情報取得
  async getMonitoringStats(periodHours: number = 24): Promise<MonitoringStats> {
    const cutoffTime = new Date(Date.now() - periodHours * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp >= cutoffTime);
    
    const totalSyncs = recentEvents.length;
    const successfulSyncs = recentEvents.filter(e => e.status === 'success').length;
    const successRate = totalSyncs > 0 ? successfulSyncs / totalSyncs : 0;
    
    const avgProcessingTime = recentEvents.length > 0
      ? recentEvents.reduce((sum, e) => sum + e.processingTime, 0) / recentEvents.length
      : 0;

    // エラー分析
    const errorEvents = recentEvents.filter(e => e.status === 'error');
    const errorTypes: Record<string, number> = {};
    
    errorEvents.forEach(event => {
      const errorType = this.categorizeError(event.details.errorMessage || '');
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    });

    // パフォーマンスメトリクス
    const performanceMetrics = await this.getPerformanceMetrics();

    return {
      totalSyncs,
      successRate,
      averageProcessingTime,
      recentEvents: recentEvents.slice(0, 50), // 最新50件
      errorTrends: {
        period: `過去${periodHours}時間`,
        errorCount: errorEvents.length,
        errorTypes
      },
      performanceMetrics
    };
  }

  // パフォーマンスメトリクス取得
  private async getPerformanceMetrics() {
    try {
      // データベースから統計取得
      const [sourceStats, knowledgeStats] = await Promise.all([
        prisma.google_docs_sources.aggregate({
          _avg: { page_count: true },
          _count: { id: true }
        }),
        prisma.knowledge_items.count({
          where: { auto_generated: true }
        })
      ]);

      const recentProcessing = this.events
        .filter(e => e.details.qualityScore !== undefined)
        .slice(0, 100);

      const avgQualityScore = recentProcessing.length > 0
        ? recentProcessing.reduce((sum, e) => sum + (e.details.qualityScore || 0), 0) / recentProcessing.length
        : 0;

      return {
        avgSectionsPerDocument: sourceStats._avg.page_count || 0,
        avgQualityScore,
        totalKnowledgeItems: knowledgeStats
      };

    } catch (error) {
      console.error('パフォーマンスメトリクス取得エラー:', error);
      return {
        avgSectionsPerDocument: 0,
        avgQualityScore: 0,
        totalKnowledgeItems: 0
      };
    }
  }

  // エラー分類
  private categorizeError(errorMessage: string): string {
    if (/timeout|タイムアウト/i.test(errorMessage)) return 'timeout';
    if (/network|ネットワーク/i.test(errorMessage)) return 'network';
    if (/database|データベース/i.test(errorMessage)) return 'database';
    if (/validation|検証/i.test(errorMessage)) return 'validation';
    if (/processing|処理/i.test(errorMessage)) return 'processing';
    return 'unknown';
  }

  // エラーイベント処理
  private async handleErrorEvent(event: SyncEvent): void {
    console.error(`🚨 同期エラー検出: ${event.documentTitle}`);
    
    // 連続エラーチェック
    const recentErrors = this.events
      .slice(0, 10)
      .filter(e => e.status === 'error');

    if (recentErrors.length >= 3) {
      console.error('🔥 連続エラー検出 - システム状態確認が必要');
      await this.sendErrorAlert('連続エラー検出', event);
    }

    // 特定ドキュメントのエラー頻度チェック
    const documentErrors = this.events
      .filter(e => e.documentId === event.documentId && e.status === 'error')
      .slice(0, 5);

    if (documentErrors.length >= 2) {
      console.warn(`⚠️ ドキュメント固有エラー: ${event.documentTitle}`);
    }
  }

  // エラーアラート送信
  private async sendErrorAlert(alertType: string, event: SyncEvent): Promise<void> {
    try {
      // 将来的にはLINE/Slack/メール通知を実装
      console.log(`📢 アラート送信: ${alertType} - ${event.documentTitle}`);
      
      // ここでLINE通知等を実装可能
      // await lineNotificationService.sendErrorAlert(alertType, event);
      
    } catch (error) {
      console.error('アラート送信エラー:', error);
    }
  }

  // システムヘルスチェック
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    checks: Record<string, boolean>;
    message: string;
  }> {
    const checks = {
      database: await this.checkDatabase(),
      recentSyncs: await this.checkRecentSyncs(),
      errorRate: await this.checkErrorRate(),
      processing: await this.checkProcessingHealth()
    };

    const failedChecks = Object.values(checks).filter(check => !check).length;
    
    let status: 'healthy' | 'warning' | 'critical';
    let message: string;

    if (failedChecks === 0) {
      status = 'healthy';
      message = 'すべてのシステムが正常に動作しています';
    } else if (failedChecks <= 2) {
      status = 'warning';
      message = `${failedChecks}個のチェックで警告が発生しています`;
    } else {
      status = 'critical';
      message = `${failedChecks}個のチェックで問題が発生しています`;
    }

    return { status, checks, message };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkRecentSyncs(): Promise<boolean> {
    const recentEvents = this.events.slice(0, 10);
    return recentEvents.some(e => e.status === 'success');
  }

  private async checkErrorRate(): Promise<boolean> {
    const recentEvents = this.events.slice(0, 20);
    if (recentEvents.length === 0) return true;
    
    const errorRate = recentEvents.filter(e => e.status === 'error').length / recentEvents.length;
    return errorRate < 0.3; // 30%未満はOK
  }

  private async checkProcessingHealth(): Promise<boolean> {
    const recentProcessing = this.events
      .slice(0, 10)
      .filter(e => e.details.qualityScore !== undefined);
    
    if (recentProcessing.length === 0) return true;
    
    const avgQuality = recentProcessing.reduce((sum, e) => sum + (e.details.qualityScore || 0), 0) / recentProcessing.length;
    return avgQuality > 0.6; // 品質スコア60%以上
  }
}

export const gasMonitoringService = new GASMonitoringService();
```

#### 2.2 リアルタイム通知システム

```typescript
// src/lib/gas/notification-service.ts
export interface NotificationConfig {
  enableRealtime: boolean;
  enableEmail: boolean;
  enableLine: boolean;
  errorThreshold: number;
  successNotifications: boolean;
}

export class GASNotificationService {
  private config: NotificationConfig = {
    enableRealtime: true,
    enableEmail: false,
    enableLine: false,
    errorThreshold: 3,
    successNotifications: false
  };

  // 同期完了通知
  async notifySyncComplete(result: any): Promise<void> {
    if (!this.config.enableRealtime) return;

    try {
      // WebSocket経由でリアルタイム通知（将来実装）
      console.log(`📡 リアルタイム通知: ${result.title} 同期完了`);
      
      // 成功通知が有効な場合
      if (this.config.successNotifications) {
        await this.sendSuccessNotification(result);
      }

    } catch (error) {
      console.error('同期完了通知エラー:', error);
    }
  }

  // エラー通知
  async notifyError(error: any, context: any): Promise<void> {
    console.error(`🚨 エラー通知: ${error.message}`);
    
    try {
      if (this.config.enableLine) {
        await this.sendLineErrorNotification(error, context);
      }

      if (this.config.enableEmail) {
        await this.sendEmailErrorNotification(error, context);
      }

    } catch (notificationError) {
      console.error('エラー通知送信失敗:', notificationError);
    }
  }

  // LINE通知（将来実装）
  private async sendLineErrorNotification(error: any, context: any): Promise<void> {
    // LINEボット機能を活用してエラー通知を送信
    console.log('LINE エラー通知送信予定:', { error: error.message, context });
  }

  // 成功通知
  private async sendSuccessNotification(result: any): Promise<void> {
    const message = `✅ ドキュメント同期完了
📄 ${result.title}
📊 ${result.knowledgeItemsCreated}件のナレッジを作成
⏱️ 処理時間: ${result.processing?.qualityScore ? Math.round(result.processing.qualityScore * 100) + '% 品質' : '不明'}`;

    console.log('成功通知:', message);
  }

  // メール通知（将来実装）
  private async sendEmailErrorNotification(error: any, context: any): Promise<void> {
    console.log('メール エラー通知送信予定:', { error: error.message, context });
  }

  // 設定更新
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('通知設定更新:', this.config);
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }
}

export const gasNotificationService = new GASNotificationService();
```

### ステップ3: 手動制御UI・ダッシュボード統合

#### 3.1 GAS管理ダッシュボード

```tsx
// src/components/gas/GASManagementDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  RefreshCw, 
  Settings,
  TrendingUp,
  Zap,
  BarChart3
} from 'lucide-react';

interface GASStats {
  totalSyncs: number;
  successRate: number;
  averageProcessingTime: number;
  performanceMetrics: {
    avgSectionsPerDocument: number;
    avgQualityScore: number;
    totalKnowledgeItems: number;
  };
}

interface RealtimeEvent {
  id: string;
  documentTitle: string;
  status: 'success' | 'error' | 'warning';
  timestamp: string;
  processingTime: number;
  details: any;
}

export default function GASManagementDashboard() {
  const [stats, setStats] = useState<GASStats | null>(null);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');

  useEffect(() => {
    loadDashboardData();
    
    // 30秒間隔で自動更新
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, eventsResponse, healthResponse] = await Promise.all([
        fetch('/api/gas/stats'),
        fetch('/api/gas/events'),
        fetch('/api/gas/health')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setRealtimeEvents(eventsData.events || []);
      }

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthStatus(healthData.status);
      }

    } catch (error) {
      console.error('ダッシュボードデータ読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async (documentId?: string) => {
    try {
      const response = await fetch('/api/gas/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: documentId ? 'sync_single' : 'sync_all',
          documentId 
        })
      });

      if (response.ok) {
        console.log('手動同期実行完了');
        await loadDashboardData(); // データ再読み込み
      }
    } catch (error) {
      console.error('手動同期エラー:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-green-500" size={16} />;
      case 'error': return <AlertCircle className="text-red-500" size={16} />;
      case 'warning': return <AlertCircle className="text-yellow-500" size={16} />;
      default: return <Clock className="text-gray-500" size={16} />;
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">正常</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">警告</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">異常</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">不明</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="animate-spin" size={20} />
            読み込み中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘルス状態・クイックアクション */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Google Docs 自動同期</h2>
          {getHealthBadge(healthStatus)}
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => loadDashboardData()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} />
            更新
          </Button>
          
          <Button
            onClick={() => handleManualSync()}
            size="sm"
            className="flex items-center gap-2"
          >
            <Zap size={14} />
            全体同期
          </Button>
        </div>
      </div>

      {/* 統計サマリー */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Activity className="text-blue-500" size={20} />
                <div>
                  <div className="text-2xl font-bold">{stats.totalSyncs}</div>
                  <div className="text-sm text-gray-500">総同期回数</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-green-500" size={20} />
                <div>
                  <div className="text-2xl font-bold">
                    {Math.round(stats.successRate * 100)}%
                  </div>
                  <div className="text-sm text-gray-500">成功率</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="text-orange-500" size={20} />
                <div>
                  <div className="text-2xl font-bold">
                    {Math.round(stats.averageProcessingTime)}ms
                  </div>
                  <div className="text-sm text-gray-500">平均処理時間</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <FileText className="text-purple-500" size={20} />
                <div>
                  <div className="text-2xl font-bold">
                    {stats.performanceMetrics.totalKnowledgeItems}
                  </div>
                  <div className="text-sm text-gray-500">作成ナレッジ</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 詳細タブ */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">リアルタイムイベント</TabsTrigger>
          <TabsTrigger value="performance">パフォーマンス</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
        </TabsList>

        {/* イベントログ */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={20} />
                リアルタイム同期イベント
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {realtimeEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    同期イベントがありません
                  </div>
                ) : (
                  realtimeEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(event.status)}
                        <div>
                          <div className="font-medium">{event.documentTitle}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleString('ja-JP')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-500">
                          {event.processingTime}ms
                        </div>
                        
                        {event.details?.sectionsCreated && (
                          <Badge variant="outline">
                            {event.details.sectionsCreated}セクション
                          </Badge>
                        )}
                        
                        {event.details?.qualityScore && (
                          <Badge variant="outline">
                            品質{Math.round(event.details.qualityScore * 100)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* パフォーマンス */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 size={20} />
                      処理品質
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>平均品質スコア</span>
                        <span>{Math.round(stats.performanceMetrics.avgQualityScore * 100)}%</span>
                      </div>
                      <Progress value={stats.performanceMetrics.avgQualityScore * 100} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>成功率</span>
                        <span>{Math.round(stats.successRate * 100)}%</span>
                      </div>
                      <Progress value={stats.successRate * 100} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText size={20} />
                      コンテンツ統計
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">平均セクション数</span>
                      <span className="font-medium">
                        {stats.performanceMetrics.avgSectionsPerDocument.toFixed(1)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">総ナレッジ項目</span>
                      <span className="font-medium">
                        {stats.performanceMetrics.totalKnowledgeItems}件
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">平均処理時間</span>
                      <span className="font-medium">
                        {Math.round(stats.averageProcessingTime)}ms
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* 設定 */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={20} />
                同期設定
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">リアルタイム同期</div>
                    <div className="text-sm text-gray-500">ドキュメント編集時の即座同期</div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">有効</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">定期同期</div>
                    <div className="text-sm text-gray-500">毎日0:00の自動同期</div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">有効</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">エラー通知</div>
                    <div className="text-sm text-gray-500">同期失敗時の通知</div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">監視中</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### 3.2 ナレッジ管理画面統合

```tsx
// src/app/knowledge/page.tsx (既存ページの拡張)
import GASManagementDashboard from '@/components/gas/GASManagementDashboard';

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState('knowledge');

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="knowledge">ナレッジ管理</TabsTrigger>
          <TabsTrigger value="gas-sync">Google Docs同期</TabsTrigger>
          <TabsTrigger value="analytics">分析・統計</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge">
          {/* 既存のナレッジ管理UI */}
          <ExistingKnowledgeManagement />
        </TabsContent>

        <TabsContent value="gas-sync">
          {/* 新規GAS管理ダッシュボード */}
          <GASManagementDashboard />
        </TabsContent>

        <TabsContent value="analytics">
          {/* 将来の分析機能 */}
          <div className="text-center py-8 text-gray-500">
            分析機能は Phase 13 で実装予定
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### ステップ4: 動作テスト・検証

#### 4.1 高度処理テスト

```bash
# 高度コンテンツ処理テスト
curl -X POST "http://localhost:3000/api/webhook/google-docs-gas" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test-advanced-processing",
    "title": "高度処理テストドキュメント",
    "content": "# プロジェクト概要\n\n今回のプロジェクトは、AIを活用した議事録自動処理システムの構築です。\n\n## 技術仕様\n\n・Google Apps Script連携\n・Gemini AI分析\n・リアルタイム同期\n\n## スケジュール\n\n1. Phase 11: 基盤構築\n2. Phase 12: 高度処理実装\n3. Phase 13: AI分析機能\n\n### 課題・懸念事項\n\n- API制限の対応\n- セキュリティ考慮\n- パフォーマンス最適化\n\n決定事項：GASアプローチを採用することで合意しました。",
    "url": "https://docs.google.com/document/d/test-advanced-processing/edit",
    "lastModified": "2025-06-16T12:00:00Z",
    "triggerType": "test",
    "wordCount": 200,
    "gasVersion": "2.0"
  }'
```

#### 4.2 監視システムテスト

```typescript
// scripts/test-monitoring-system.ts
import { gasMonitoringService } from '../src/lib/gas/monitoring-service';

async function testMonitoringSystem() {
  console.log('🧪 監視システムテスト開始');

  // 1. 成功イベント記録
  gasMonitoringService.recordSyncEvent({
    documentId: 'test-doc-1',
    documentTitle: 'テストドキュメント1',
    triggerType: 'test',
    status: 'success',
    processingTime: 1500,
    details: {
      sectionsCreated: 3,
      qualityScore: 0.85
    }
  });

  // 2. エラーイベント記録
  gasMonitoringService.recordSyncEvent({
    documentId: 'test-doc-2',
    documentTitle: 'テストドキュメント2',
    triggerType: 'test',
    status: 'error',
    processingTime: 500,
    details: {
      errorMessage: 'テスト用エラー'
    }
  });

  // 3. 統計確認
  const stats = await gasMonitoringService.getMonitoringStats(1);
  console.log('📊 監視統計:', stats);

  // 4. ヘルスチェック
  const health = await gasMonitoringService.performHealthCheck();
  console.log('💚 ヘルスチェック:', health);

  console.log('✅ 監視システムテスト完了');
}

testMonitoringSystem();
```

---

## ✅ Phase 12 完了チェックリスト

### 必須完了項目
- [ ] 高度コンテンツ処理エンジン実装・動作確認
- [ ] インテリジェント分割アルゴリズム実装・精度確認
- [ ] カテゴリ分類・タグ抽出の精度向上確認
- [ ] リアルタイム監視システム実装・動作確認
- [ ] エラーハンドリング・通知機能実装・動作確認
- [ ] GAS管理ダッシュボード実装・表示確認
- [ ] 既存ナレッジ管理システムとの統合確認
- [ ] 既存機能100%動作継続確認

### パフォーマンス・品質確認
- [ ] コンテンツ処理精度 > 80%（手動評価）
- [ ] セクション分割品質スコア > 0.7
- [ ] 処理時間 < 3秒（1000文字あたり）
- [ ] エラー回復率 > 90%
- [ ] UI応答性 < 1秒

### 運用準備確認
- [ ] 監視ダッシュボード正常動作
- [ ] エラー通知システム動作確認
- [ ] ヘルスチェック機能動作確認
- [ ] 手動制御機能動作確認

### 次Phase準備確認
- [ ] AI分析対象データの十分な蓄積
- [ ] 高品質なセクション分割データの確認
- [ ] Phase 13 AI分析実装準備完了

---

## 🚨 トラブルシューティング

### 高度処理関連

#### 1. セクション分割が不適切
```typescript
// 問題: セクションが多すぎる/少なすぎる
// 解決: ProcessingOptions調整
const processor = new AdvancedContentProcessor({
  minSectionLength: 150,  // 最小長を調整
  maxSectionLength: 1200, // 最大長を調整
  preserveStructure: true // 構造重視
});
```

#### 2. カテゴリ分類精度が低い
```typescript
// 問題: カテゴリが BUSINESS ばかり
// 解決: キーワード辞書拡張・判定条件調整
// categorizeSectionContent関数のキーワードパターンを追加
```

#### 3. 品質スコアが低い
```typescript
// 問題: 品質スコア < 0.6
// 解決: コンテンツ前処理強化・分割アルゴリズム調整
// normalizeContent関数でより丁寧な正規化
```

### 監視・UI関連

#### 1. ダッシュボードのデータ読み込み失敗
```bash
# API接続確認
curl "http://localhost:3000/api/gas/stats"
curl "http://localhost:3000/api/gas/events"

# ログ確認
npm run dev -- --verbose
```

#### 2. リアルタイム更新が動作しない
```typescript
// WebSocket実装（将来）またはポーリング間隔調整
const POLLING_INTERVAL = 15000; // 15秒に短縮
```

---

## 📚 次のフェーズ

**Phase 12完了後の次のステップ:**

### **Phase 13: AI分析・レコメンドエンジン（5-7日）**
- Gemini AI統合による高度分析
- タスク・予定・プロジェクト自動抽出
- レコメンデーション生成・管理システム
- 信頼度スコア・期限管理機能

### **作成・更新されたファイル:**
- `src/lib/gas/content-processor.ts`
- `src/lib/gas/monitoring-service.ts`
- `src/lib/gas/notification-service.ts`
- `src/components/gas/GASManagementDashboard.tsx`
- `src/app/api/webhook/google-docs-gas/route.ts` (拡張)

---

**🚀 Phase 12完了により、高度なコンテンツ処理・監視システム・統合UIが完成し、Google Docs連携システムの基盤が大幅に強化されます！**
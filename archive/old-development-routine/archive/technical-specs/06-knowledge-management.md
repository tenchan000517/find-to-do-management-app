# ナレッジ管理システム マニュアル

## 概要

FIND to DO Management Appのナレッジ管理システムは、Markdownベースのナレッジベース、AI自動分類・生成機能、Google Docs連携、高度な検索・タグ管理機能を提供する包括的な知識管理ソリューションです。

## 目次

1. [Markdownベースナレッジベース](#markdownベースナレッジベース)
2. [AI自動分類・生成](#ai自動分類生成)
3. [Google Docs連携](#google-docs連携)
4. [タグ管理・検索](#タグ管理検索)
5. [バージョン管理](#バージョン管理)
6. [コラボレーション機能](#コラボレーション機能)
7. [トラブルシューティング](#トラブルシューティング)

---

## Markdownベースナレッジベース

### 1.1 Markdown エディタ機能

```javascript
// 高機能Markdownエディタの実装
const KnowledgeEditor = {
  // リアルタイムプレビュー付きエディタ
  createEditor: (containerId, options = {}) => {
    const editor = new MarkdownEditor({
      element: document.getElementById(containerId),
      
      // 基本設定
      initialValue: options.initialContent || '',
      height: options.height || '500px',
      
      // プレビュー設定
      previewStyle: 'vertical', // 'vertical' or 'tab'
      previewHighlight: true,
      
      // 拡張機能
      extensions: [
        'table',           // テーブル
        'strikethrough',   // 取り消し線
        'taskList',        // タスクリスト
        'codeHighlight',   // コードハイライト
        'math',           // 数式
        'mermaid',        // 図表
        'emoji'           // 絵文字
      ],
      
      // イベントハンドラ
      events: {
        change: (content) => {
          this.autoSave(content)
          this.updateWordCount(content)
        },
        
        beforeConvertWysiwygToMarkdown: (content) => {
          return this.preprocessContent(content)
        },
        
        afterConvertMarkdownToHtml: (html) => {
          return this.postprocessHTML(html)
        }
      },
      
      // カスタムツールバー
      toolbarItems: [
        'heading', 'bold', 'italic', 'strike',
        'divider',
        'ul', 'ol', 'task', 'indent', 'outdent',
        'divider',
        'table', 'image', 'link', 'code', 'codeblock',
        'divider',
        'scrollSync'
      ]
    })
    
    return editor
  },
  
  // 自動保存機能
  autoSave: debounce(async (content) => {
    const documentId = getCurrentDocumentId()
    if (documentId) {
      await saveKnowledgeItem(documentId, {
        content,
        lastModified: new Date(),
        version: await incrementVersion(documentId)
      })
    }
  }, 2000),
  
  // コンテンツの前処理
  preprocessContent: (content) => {
    // カスタムマクロの展開
    content = expandCustomMacros(content)
    
    // 相対リンクの絶対リンク化
    content = resolveRelativeLinks(content)
    
    // 画像の最適化
    content = optimizeImages(content)
    
    return content
  },
  
  // HTMLの後処理
  postprocessHTML: (html) => {
    // セキュリティ対策
    html = sanitizeHTML(html)
    
    // 外部リンクの設定
    html = configureExternalLinks(html)
    
    // コードブロックのハイライト
    html = highlightCodeBlocks(html)
    
    return html
  }
}
```

### 1.2 テンプレートシステム

```javascript
// ナレッジテンプレート管理
const KnowledgeTemplates = {
  // 標準テンプレート
  templates: {
    // 会議議事録テンプレート
    meetingMinutes: {
      name: '会議議事録',
      category: 'MEETING',
      content: `# 会議議事録

## 基本情報
- **日時**: {{date}}
- **場所**: {{location}}
- **参加者**: {{participants}}
- **司会**: {{facilitator}}

## アジェンダ
{{agenda}}

## 議論内容
### {{topic1}}
{{discussion1}}

### {{topic2}}
{{discussion2}}

## 決定事項
{{decisions}}

## アクションアイテム
- [ ] {{action1}} (担当: {{assignee1}}, 期限: {{deadline1}})
- [ ] {{action2}} (担当: {{assignee2}}, 期限: {{deadline2}})

## 次回会議
- **日時**: {{nextMeetingDate}}
- **アジェンダ**: {{nextAgenda}}
`,
      variables: [
        'date', 'location', 'participants', 'facilitator',
        'agenda', 'topic1', 'discussion1', 'topic2', 'discussion2',
        'decisions', 'action1', 'assignee1', 'deadline1',
        'action2', 'assignee2', 'deadline2',
        'nextMeetingDate', 'nextAgenda'
      ]
    },
    
    // プロジェクト仕様書テンプレート
    projectSpec: {
      name: 'プロジェクト仕様書',
      category: 'PROJECT',
      content: `# {{projectName}} 仕様書

## プロジェクト概要
{{overview}}

## 目的・目標
{{objectives}}

## スコープ
### 含まれるもの
{{inScope}}

### 含まれないもの
{{outOfScope}}

## 要件定義
### 機能要件
{{functionalRequirements}}

### 非機能要件
{{nonFunctionalRequirements}}

## 技術仕様
{{technicalSpecs}}

## スケジュール
{{timeline}}

## リスク・課題
{{risksAndIssues}}

## 承認
{{approvals}}
`,
      variables: [
        'projectName', 'overview', 'objectives',
        'inScope', 'outOfScope', 'functionalRequirements',
        'nonFunctionalRequirements', 'technicalSpecs',
        'timeline', 'risksAndIssues', 'approvals'
      ]
    }
  },
  
  // テンプレートからドキュメント作成
  createFromTemplate: async (templateId, variables = {}) => {
    const template = this.templates[templateId]
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }
    
    let content = template.content
    
    // 変数の置換
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value || `[${key}]`)
    }
    
    // AI による内容補完
    if (variables.autoComplete) {
      content = await enhanceContentWithAI(content, template.category)
    }
    
    const document = await createKnowledgeItem({
      title: variables.title || template.name,
      content,
      category: template.category,
      template: templateId,
      status: 'DRAFT',
      createdFrom: 'TEMPLATE'
    })
    
    return document
  },
  
  // カスタムテンプレート作成
  createCustomTemplate: async (templateData) => {
    const template = {
      id: generateTemplateId(),
      name: templateData.name,
      category: templateData.category,
      content: templateData.content,
      variables: extractVariables(templateData.content),
      isCustom: true,
      createdBy: templateData.userId,
      createdAt: new Date()
    }
    
    await saveTemplate(template)
    return template
  }
}
```

### 1.3 構造化コンテンツ管理

```javascript
// 構造化されたナレッジ管理
const StructuredKnowledge = {
  // ドキュメント構造の解析
  analyzeStructure: (markdownContent) => {
    const tokens = marked.lexer(markdownContent)
    const structure = {
      headings: [],
      sections: [],
      codeBlocks: [],
      tables: [],
      links: [],
      images: []
    }
    
    let currentSection = null
    
    for (const token of tokens) {
      switch (token.type) {
        case 'heading':
          const heading = {
            level: token.depth,
            text: token.text,
            id: generateHeadingId(token.text),
            line: token.line
          }
          structure.headings.push(heading)
          
          if (token.depth === 1 || token.depth === 2) {
            currentSection = {
              title: token.text,
              level: token.depth,
              content: [],
              startLine: token.line
            }
            structure.sections.push(currentSection)
          }
          break
          
        case 'code':
          structure.codeBlocks.push({
            language: token.lang,
            code: token.text,
            line: token.line
          })
          break
          
        case 'table':
          structure.tables.push({
            headers: token.header,
            rows: token.cells,
            line: token.line
          })
          break
          
        case 'link':
          structure.links.push({
            href: token.href,
            text: token.text,
            title: token.title
          })
          break
          
        case 'image':
          structure.images.push({
            src: token.href,
            alt: token.text,
            title: token.title
          })
          break
      }
      
      if (currentSection) {
        currentSection.content.push(token)
      }
    }
    
    return structure
  },
  
  // 目次の自動生成
  generateTOC: (structure, maxDepth = 3) => {
    const toc = structure.headings
      .filter(heading => heading.level <= maxDepth)
      .map(heading => {
        const indent = '  '.repeat(heading.level - 1)
        return `${indent}- [${heading.text}](#${heading.id})`
      })
      .join('\n')
    
    return `## 目次\n\n${toc}\n\n`
  },
  
  // セクション別の操作
  extractSection: (content, sectionTitle) => {
    const structure = this.analyzeStructure(content)
    const section = structure.sections.find(s => s.title === sectionTitle)
    
    if (!section) return null
    
    return {
      title: section.title,
      content: section.content
        .map(token => marked.parser([token]))
        .join(''),
      metadata: {
        level: section.level,
        wordCount: countWords(section.content),
        lastModified: new Date()
      }
    }
  }
}
```

---

## AI自動分類・生成

### 2.1 コンテンツ自動分類

```javascript
// AI による自動コンテンツ分類
const ContentClassifier = {
  // ドキュメントの自動分類
  classifyDocument: async (content, metadata = {}) => {
    const features = extractContentFeatures(content, metadata)
    
    const classification = await callAI({
      model: 'content-classifier',
      input: {
        content: content.substring(0, 5000), // 最初の5000文字
        title: metadata.title,
        features,
        context: metadata.context
      }
    })
    
    return {
      category: classification.primaryCategory,
      subcategories: classification.subcategories,
      tags: classification.suggestedTags,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      
      // 詳細分類
      contentType: classification.contentType, // HOWTO, FAQ, SPEC, etc.
      audience: classification.targetAudience,  // DEVELOPER, MANAGER, etc.
      complexity: classification.complexityLevel, // BASIC, INTERMEDIATE, ADVANCED
      priority: classification.priority
    }
  },
  
  // コンテンツ特徴の抽出
  extractContentFeatures: (content, metadata) => {
    const words = content.toLowerCase().split(/\s+/)
    const sentences = content.split(/[.!?]+/)
    
    return {
      // 基本統計
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: words.length / sentences.length,
      
      // 構造的特徴
      hasCodeBlocks: /```/.test(content),
      hasTables: /\|.*\|/.test(content),
      hasLists: /^[-*+]\s/.test(content),
      hasHeadings: /^#{1,6}\s/.test(content),
      
      // 内容的特徴
      technicalTermDensity: calculateTechnicalTermDensity(words),
      questionDensity: calculateQuestionDensity(sentences),
      actionVerbDensity: calculateActionVerbDensity(words),
      
      // 言語的特徴
      formalityScore: calculateFormalityScore(content),
      readabilityScore: calculateReadabilityScore(content),
      
      // メタデータ特徴
      createdBy: metadata.createdBy,
      source: metadata.source,
      lastModified: metadata.lastModified
    }
  },
  
  // 動的再分類
  reclassifyIfNeeded: async (documentId) => {
    const document = await getKnowledgeItem(documentId)
    const currentClassification = document.classification
    
    // 大幅な変更があった場合のみ再分類
    if (hasSignificantChanges(document)) {
      const newClassification = await this.classifyDocument(
        document.content, 
        document.metadata
      )
      
      if (classificationDiffers(currentClassification, newClassification)) {
        await updateDocumentClassification(documentId, newClassification)
        
        // 分類変更の通知
        await notifyClassificationChange(documentId, {
          old: currentClassification,
          new: newClassification
        })
      }
    }
  }
}
```

### 2.2 AI コンテンツ生成

```javascript
// AI による知識コンテンツの生成・拡張
const ContentGenerator = {
  // FAQ の自動生成
  generateFAQ: async (sourceDocuments, topic) => {
    const analysis = await callAI({
      model: 'faq-generator',
      input: {
        documents: sourceDocuments,
        topic,
        existingFAQs: await getExistingFAQs(topic)
      }
    })
    
    const faqItems = analysis.questions.map(item => ({
      question: item.question,
      answer: item.answer,
      confidence: item.confidence,
      sources: item.sourceDocuments,
      category: item.category
    }))
    
    return {
      title: `${topic} - よくある質問`,
      content: formatFAQMarkdown(faqItems),
      category: 'FAQ',
      generatedBy: 'AI',
      sources: sourceDocuments.map(d => d.id)
    }
  },
  
  // ハウツー記事の生成
  generateHowTo: async (task, existingKnowledge) => {
    const howToContent = await callAI({
      model: 'howto-generator',
      input: {
        taskDescription: task.description,
        requirements: task.requirements,
        constraints: task.constraints,
        existingProcedures: existingKnowledge,
        targetAudience: task.audience
      }
    })
    
    return {
      title: `How to: ${task.title}`,
      content: howToContent.markdown,
      category: 'HOWTO',
      difficulty: howToContent.difficulty,
      estimatedTime: howToContent.estimatedTime,
      prerequisites: howToContent.prerequisites,
      steps: howToContent.steps
    }
  },
  
  // 既存コンテンツの拡張
  enhanceContent: async (documentId, enhancementType) => {
    const document = await getKnowledgeItem(documentId)
    
    const enhancement = await callAI({
      model: 'content-enhancer',
      input: {
        originalContent: document.content,
        enhancementType, // 'EXAMPLES', 'DETAILS', 'REFERENCES', 'SUMMARY'
        context: document.metadata,
        relatedDocuments: await findRelatedDocuments(documentId)
      }
    })
    
    switch (enhancementType) {
      case 'EXAMPLES':
        return await addExamples(document, enhancement.examples)
      case 'DETAILS':
        return await addDetails(document, enhancement.details)
      case 'REFERENCES':
        return await addReferences(document, enhancement.references)
      case 'SUMMARY':
        return await addSummary(document, enhancement.summary)
    }
  },
  
  // 要約の自動生成
  generateSummary: async (documentId, summaryType = 'EXECUTIVE') => {
    const document = await getKnowledgeItem(documentId)
    
    const summary = await callAI({
      model: 'summarizer',
      input: {
        content: document.content,
        summaryType, // 'EXECUTIVE', 'TECHNICAL', 'BULLET_POINTS'
        maxLength: getSummaryLength(summaryType),
        preserveKeyTerms: true
      }
    })
    
    return {
      summary: summary.text,
      keyPoints: summary.keyPoints,
      originalLength: document.content.length,
      summaryLength: summary.text.length,
      compressionRatio: summary.text.length / document.content.length
    }
  }
}
```

### 2.3 知識の自動抽出・構造化

```javascript
// 非構造化コンテンツからの知識抽出
const KnowledgeExtractor = {
  // エンティティ抽出
  extractEntities: async (content) => {
    const entities = await callAI({
      model: 'entity-extractor',
      input: { content }
    })
    
    return {
      people: entities.people,
      organizations: entities.organizations,
      technologies: entities.technologies,
      concepts: entities.concepts,
      procedures: entities.procedures,
      dates: entities.dates,
      locations: entities.locations
    }
  },
  
  // 関係性の抽出
  extractRelationships: async (content, entities) => {
    const relationships = await callAI({
      model: 'relationship-extractor',
      input: { content, entities }
    })
    
    return relationships.map(rel => ({
      subject: rel.subject,
      predicate: rel.predicate,
      object: rel.object,
      confidence: rel.confidence,
      context: rel.context
    }))
  },
  
  // 知識グラフの構築
  buildKnowledgeGraph: async (documents) => {
    const graph = {
      nodes: new Map(),
      edges: []
    }
    
    for (const doc of documents) {
      const entities = await this.extractEntities(doc.content)
      const relationships = await this.extractRelationships(doc.content, entities)
      
      // ノードの追加
      for (const entityType of Object.keys(entities)) {
        for (const entity of entities[entityType]) {
          if (!graph.nodes.has(entity.name)) {
            graph.nodes.set(entity.name, {
              id: entity.name,
              type: entityType,
              properties: entity.properties,
              documents: []
            })
          }
          graph.nodes.get(entity.name).documents.push(doc.id)
        }
      }
      
      // エッジの追加
      for (const rel of relationships) {
        graph.edges.push({
          source: rel.subject,
          target: rel.object,
          relationship: rel.predicate,
          weight: rel.confidence,
          document: doc.id
        })
      }
    }
    
    return {
      nodes: Array.from(graph.nodes.values()),
      edges: graph.edges
    }
  }
}
```

---

## Google Docs連携

### 3.1 Google Docs API 統合

```javascript
// Google Docs との双方向同期
const GoogleDocsIntegration = {
  // 認証とセットアップ
  initialize: async (userId) => {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive'
      ]
    })
    
    const docs = google.docs({ version: 'v1', auth })
    const drive = google.drive({ version: 'v3', auth })
    
    return { docs, drive, auth }
  },
  
  // Google Docs からのインポート
  importFromGoogleDocs: async (documentId, userId) => {
    const { docs } = await this.initialize(userId)
    
    // ドキュメントの取得
    const response = await docs.documents.get({
      documentId,
      includeTabsContent: true
    })
    
    const document = response.data
    
    // コンテンツの変換
    const markdownContent = await convertGoogleDocsToMarkdown(document)
    
    // メタデータの抽出
    const metadata = {
      title: document.title,
      createdTime: document.createdTime,
      modifiedTime: document.modifiedTime,
      authors: await getDocumentAuthors(documentId),
      googleDocId: documentId
    }
    
    // ナレッジアイテムとして保存
    const knowledgeItem = await createKnowledgeItem({
      title: metadata.title,
      content: markdownContent,
      metadata,
      source: 'GOOGLE_DOCS',
      syncEnabled: true
    })
    
    return knowledgeItem
  },
  
  // Google Docs へのエクスポート
  exportToGoogleDocs: async (knowledgeItemId, userId) => {
    const { docs, drive } = await this.initialize(userId)
    const knowledgeItem = await getKnowledgeItem(knowledgeItemId)
    
    // Markdown から Google Docs フォーマットへの変換
    const googleDocsContent = await convertMarkdownToGoogleDocs(knowledgeItem.content)
    
    // 新しいドキュメントの作成
    const createResponse = await docs.documents.create({
      requestBody: {
        title: knowledgeItem.title
      }
    })
    
    const documentId = createResponse.data.documentId
    
    // コンテンツの挿入
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: googleDocsContent.requests
      }
    })
    
    // 同期設定の保存
    await updateKnowledgeItem(knowledgeItemId, {
      googleDocId: documentId,
      syncEnabled: true,
      lastSyncTime: new Date()
    })
    
    return {
      documentId,
      url: `https://docs.google.com/document/d/${documentId}/edit`
    }
  },
  
  // リアルタイム同期
  setupRealtimeSync: async (knowledgeItemId) => {
    const knowledgeItem = await getKnowledgeItem(knowledgeItemId)
    
    if (!knowledgeItem.googleDocId) {
      throw new Error('Google Docs ID not found')
    }
    
    // Google Drive API のプッシュ通知設定
    const { drive } = await this.initialize(knowledgeItem.userId)
    
    const watchResponse = await drive.files.watch({
      fileId: knowledgeItem.googleDocId,
      requestBody: {
        id: generateWatchId(),
        type: 'web_hook',
        address: `${process.env.BASE_URL}/api/webhooks/google-docs`,
        payload: true
      }
    })
    
    // 監視情報の保存
    await saveSyncWatch(knowledgeItemId, watchResponse.data)
    
    return watchResponse.data
  }
}
```

### 3.2 フォーマット変換エンジン

```javascript
// Markdown ↔ Google Docs の相互変換
const FormatConverter = {
  // Google Docs → Markdown 変換
  googleDocsToMarkdown: (googleDocsDocument) => {
    const content = googleDocsDocument.body.content
    let markdown = ''
    
    for (const element of content) {
      if (element.paragraph) {
        markdown += this.convertParagraph(element.paragraph)
      } else if (element.table) {
        markdown += this.convertTable(element.table)
      } else if (element.sectionBreak) {
        markdown += '\n---\n\n'
      }
    }
    
    return markdown
  },
  
  convertParagraph: (paragraph) => {
    let text = ''
    const style = paragraph.paragraphStyle
    
    // 見出しレベルの判定
    const headingLevel = this.getHeadingLevel(style)
    if (headingLevel > 0) {
      text += '#'.repeat(headingLevel) + ' '
    }
    
    // テキスト要素の処理
    if (paragraph.elements) {
      for (const element of paragraph.elements) {
        if (element.textRun) {
          text += this.convertTextRun(element.textRun)
        }
      }
    }
    
    // リストの処理
    if (paragraph.bullet) {
      const listPrefix = paragraph.bullet.listId ? 
        this.getListPrefix(paragraph.bullet) : '- '
      text = listPrefix + text
    }
    
    return text + '\n\n'
  },
  
  convertTextRun: (textRun) => {
    let text = textRun.content
    const style = textRun.textStyle
    
    if (!style) return text
    
    // スタイルの適用
    if (style.bold) text = `**${text}**`
    if (style.italic) text = `*${text}*`
    if (style.underline) text = `<u>${text}</u>`
    if (style.strikethrough) text = `~~${text}~~`
    
    // リンクの処理
    if (style.link) {
      text = `[${text}](${style.link.url})`
    }
    
    // コードスタイルの処理
    if (style.fontSize && style.fontSize.magnitude < 10) {
      text = `\`${text}\``
    }
    
    return text
  },
  
  // Markdown → Google Docs 変換
  markdownToGoogleDocs: (markdown) => {
    const tokens = marked.lexer(markdown)
    const requests = []
    let currentIndex = 1
    
    for (const token of tokens) {
      const request = this.convertTokenToGoogleDocs(token, currentIndex)
      if (request) {
        requests.push(request)
        currentIndex += this.calculateTokenLength(token)
      }
    }
    
    return { requests }
  },
  
  convertTokenToGoogleDocs: (token, index) => {
    switch (token.type) {
      case 'heading':
        return {
          insertText: {
            location: { index },
            text: token.text + '\n'
          }
        }
        
      case 'paragraph':
        return {
          insertText: {
            location: { index },
            text: token.text + '\n\n'
          }
        }
        
      case 'code':
        return {
          insertText: {
            location: { index },
            text: token.text + '\n'
          }
        }
        
      case 'table':
        return this.convertTableToGoogleDocs(token, index)
        
      default:
        return null
    }
  }
}
```

### 3.3 競合解決メカニズム

```javascript
// 同期時の競合解決
const ConflictResolver = {
  // 変更の検出と解決
  resolveConflicts: async (knowledgeItemId) => {
    const knowledgeItem = await getKnowledgeItem(knowledgeItemId)
    const googleDocsContent = await fetchGoogleDocsContent(knowledgeItem.googleDocId)
    
    // 変更の検出
    const conflicts = await detectConflicts(
      knowledgeItem.content,
      googleDocsContent,
      knowledgeItem.lastSyncTime
    )
    
    if (conflicts.length === 0) {
      // 競合なし - 単純同期
      return await simplSync(knowledgeItemId, googleDocsContent)
    }
    
    // 競合解決戦略の選択
    const resolutionStrategy = await selectResolutionStrategy(conflicts)
    
    switch (resolutionStrategy.method) {
      case 'AUTO_MERGE':
        return await autoMergeChanges(conflicts)
      case 'MANUAL_REVIEW':
        return await createMergeRequest(knowledgeItemId, conflicts)
      case 'TIMESTAMP_PRIORITY':
        return await resolveByTimestamp(conflicts)
      case 'SOURCE_PRIORITY':
        return await resolveBySource(conflicts, resolutionStrategy.preferredSource)
    }
  },
  
  // 自動マージ
  autoMergeChanges: async (conflicts) => {
    const mergedContent = []
    
    for (const conflict of conflicts) {
      if (conflict.type === 'NON_OVERLAPPING') {
        // 重複しない変更は両方採用
        mergedContent.push(conflict.localChange)
        mergedContent.push(conflict.remoteChange)
      } else if (conflict.type === 'ADDITIVE') {
        // 追加系の変更は統合
        mergedContent.push(this.mergeAdditiveChanges(conflict))
      } else {
        // その他は手動解決が必要
        return await createMergeRequest(conflict.documentId, [conflict])
      }
    }
    
    return {
      resolved: true,
      mergedContent: mergedContent.join('\n'),
      conflicts: []
    }
  },
  
  // マージリクエストの作成
  createMergeRequest: async (knowledgeItemId, conflicts) => {
    const mergeRequest = {
      id: generateMergeRequestId(),
      knowledgeItemId,
      conflicts,
      status: 'PENDING',
      createdAt: new Date(),
      requiredActions: conflicts.map(c => ({
        conflictId: c.id,
        description: c.description,
        options: c.resolutionOptions
      }))
    }
    
    await saveMergeRequest(mergeRequest)
    
    // 担当者への通知
    await notifyMergeRequired(knowledgeItemId, mergeRequest)
    
    return mergeRequest
  }
}
```

---

## タグ管理・検索

### 4.1 高度なタグシステム

```javascript
// 包括的なタグ管理システム
const TagManager = {
  // タグの階層構造
  createTagHierarchy: async (tags) => {
    const hierarchy = new Map()
    
    for (const tag of tags) {
      const parts = tag.name.split(':') // "technology:javascript:framework"
      let currentLevel = hierarchy
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        
        if (!currentLevel.has(part)) {
          currentLevel.set(part, {
            name: part,
            fullPath: parts.slice(0, i + 1).join(':'),
            level: i,
            children: new Map(),
            documents: new Set(),
            metadata: {
              createdAt: new Date(),
              usage: 0,
              aliases: []
            }
          })
        }
        
        currentLevel = currentLevel.get(part).children
      }
    }
    
    return hierarchy
  },
  
  // AI による自動タグ生成
  generateAutoTags: async (content, existingTags = []) => {
    const autoTags = await callAI({
      model: 'tag-generator',
      input: {
        content: content.substring(0, 3000),
        existingTags,
        tagHierarchy: await this.getTagHierarchy(),
        context: await getTaggingContext()
      }
    })
    
    return {
      suggestedTags: autoTags.tags.map(tag => ({
        name: tag.name,
        confidence: tag.confidence,
        reasoning: tag.reasoning,
        category: tag.category
      })),
      hierarchicalTags: this.organizeTagsHierarchically(autoTags.tags),
      relatedTags: autoTags.relatedTags
    }
  },
  
  // タグの類似度計算
  calculateTagSimilarity: async (tag1, tag2) => {
    // 語彙的類似度
    const lexicalSimilarity = calculateLexicalSimilarity(tag1.name, tag2.name)
    
    // セマンティック類似度（AI使用）
    const semanticSimilarity = await callAI({
      model: 'semantic-similarity',
      input: { text1: tag1.name, text2: tag2.name }
    })
    
    // 使用パターンの類似度
    const usageSimilarity = calculateUsageSimilarity(
      tag1.associatedDocuments,
      tag2.associatedDocuments
    )
    
    return {
      overall: (lexicalSimilarity + semanticSimilarity.score + usageSimilarity) / 3,
      breakdown: {
        lexical: lexicalSimilarity,
        semantic: semanticSimilarity.score,
        usage: usageSimilarity
      }
    }
  },
  
  // タグの統合・整理
  consolidateTags: async () => {
    const allTags = await getAllTags()
    const consolidationPlan = []
    
    // 類似タグの特定
    for (let i = 0; i < allTags.length; i++) {
      for (let j = i + 1; j < allTags.length; j++) {
        const similarity = await this.calculateTagSimilarity(allTags[i], allTags[j])
        
        if (similarity.overall > 0.8) {
          consolidationPlan.push({
            action: 'MERGE',
            primaryTag: allTags[i],
            secondaryTag: allTags[j],
            similarity: similarity.overall,
            suggestion: `Merge "${allTags[j].name}" into "${allTags[i].name}"`
          })
        }
      }
    }
    
    // 未使用タグの特定
    const unusedTags = allTags.filter(tag => tag.usage === 0)
    unusedTags.forEach(tag => {
      consolidationPlan.push({
        action: 'DELETE',
        tag,
        suggestion: `Delete unused tag "${tag.name}"`
      })
    })
    
    return consolidationPlan
  }
}
```

### 4.2 インテリジェント検索エンジン

```javascript
// 高度な検索機能
const SearchEngine = {
  // マルチモーダル検索
  search: async (query, options = {}) => {
    const searchResults = {
      textMatches: [],
      semanticMatches: [],
      structuralMatches: [],
      relatedContent: []
    }
    
    // 1. テキスト検索（全文検索）
    const textResults = await performFullTextSearch(query, options)
    searchResults.textMatches = textResults
    
    // 2. セマンティック検索（意味的類似性）
    const semanticResults = await performSemanticSearch(query, options)
    searchResults.semanticMatches = semanticResults
    
    // 3. 構造的検索（メタデータ・タグ）
    const structuralResults = await performStructuralSearch(query, options)
    searchResults.structuralMatches = structuralResults
    
    // 4. 関連コンテンツの取得
    const relatedResults = await findRelatedContent(query, searchResults)
    searchResults.relatedContent = relatedResults
    
    // 結果のスコアリングと統合
    const rankedResults = await rankAndCombineResults(searchResults, query)
    
    return {
      query,
      totalResults: rankedResults.length,
      results: rankedResults,
      facets: await generateSearchFacets(rankedResults),
      suggestions: await generateSearchSuggestions(query, rankedResults)
    }
  },
  
  // セマンティック検索の実装
  performSemanticSearch: async (query, options) => {
    // クエリの埋め込みベクトル生成
    const queryEmbedding = await generateEmbedding(query)
    
    // ドキュメント埋め込みとの類似度計算
    const allDocuments = await getAllKnowledgeItems()
    const similarities = []
    
    for (const doc of allDocuments) {
      if (!doc.embedding) {
        // 埋め込みが未生成の場合は生成
        doc.embedding = await generateEmbedding(doc.content)
        await updateDocumentEmbedding(doc.id, doc.embedding)
      }
      
      const similarity = calculateCosineSimilarity(queryEmbedding, doc.embedding)
      
      if (similarity > (options.semanticThreshold || 0.7)) {
        similarities.push({
          document: doc,
          similarity,
          relevanceScore: similarity
        })
      }
    }
    
    return similarities.sort((a, b) => b.similarity - a.similarity)
  },
  
  // ファセット検索
  performFacetedSearch: async (query, facets) => {
    let results = await this.search(query)
    
    // ファセットフィルターの適用
    for (const [facetName, facetValues] of Object.entries(facets)) {
      results = results.filter(result => {
        switch (facetName) {
          case 'category':
            return facetValues.includes(result.document.category)
          case 'tags':
            return result.document.tags.some(tag => facetValues.includes(tag))
          case 'author':
            return facetValues.includes(result.document.createdBy)
          case 'dateRange':
            return isWithinDateRange(result.document.createdAt, facetValues)
          default:
            return true
        }
      })
    }
    
    return results
  },
  
  // 検索提案機能
  generateSearchSuggestions: async (query, results) => {
    const suggestions = []
    
    // タイポ修正提案
    const spellingSuggestions = await getSpellingSuggestions(query)
    suggestions.push(...spellingSuggestions.map(s => ({
      type: 'SPELLING',
      original: query,
      suggestion: s,
      reason: 'Possible spelling correction'
    })))
    
    // 関連キーワード提案
    const relatedKeywords = await findRelatedKeywords(query, results)
    suggestions.push(...relatedKeywords.map(k => ({
      type: 'RELATED',
      suggestion: k,
      reason: 'Related keyword'
    })))
    
    // 絞り込み提案
    if (results.length > 50) {
      const refinements = await suggestRefinements(query, results)
      suggestions.push(...refinements.map(r => ({
        type: 'REFINEMENT',
        suggestion: r.query,
        reason: `Narrow down to ${r.category}`
      })))
    }
    
    return suggestions
  }
}
```

### 4.3 検索分析・最適化

```javascript
// 検索パフォーマンスの分析・最適化
const SearchAnalytics = {
  // 検索パターンの分析
  analyzeSearchPatterns: async (period = '30days') => {
    const searches = await getSearchLog(period)
    
    const analysis = {
      totalSearches: searches.length,
      uniqueQueries: new Set(searches.map(s => s.query)).size,
      avgResultsPerQuery: searches.reduce((sum, s) => sum + s.resultCount, 0) / searches.length,
      
      // 人気クエリ
      popularQueries: this.getPopularQueries(searches),
      
      // ゼロ結果クエリ
      zeroResultQueries: searches.filter(s => s.resultCount === 0),
      
      // クリックスルー率
      clickThroughRates: this.calculateClickThroughRates(searches),
      
      // 検索パフォーマンス
      performanceMetrics: this.calculatePerformanceMetrics(searches)
    }
    
    return analysis
  },
  
  // 検索品質の改善提案
  generateImprovementSuggestions: async (analytics) => {
    const suggestions = []
    
    // ゼロ結果クエリの改善
    if (analytics.zeroResultQueries.length > 0) {
      for (const query of analytics.zeroResultQueries.slice(0, 10)) {
        const suggestion = await analyzeZeroResultQuery(query.query)
        suggestions.push({
          type: 'ZERO_RESULTS',
          query: query.query,
          suggestion: suggestion.recommendation,
          priority: suggestion.priority
        })
      }
    }
    
    // 低クリックスルー率の改善
    const lowCTRQueries = analytics.clickThroughRates
      .filter(ctr => ctr.rate < 0.1)
      .slice(0, 5)
    
    for (const ctr of lowCTRQueries) {
      suggestions.push({
        type: 'LOW_CTR',
        query: ctr.query,
        suggestion: 'Improve result ranking or add more relevant content',
        currentCTR: ctr.rate
      })
    }
    
    // コンテンツギャップの特定
    const contentGaps = await identifyContentGaps(analytics.popularQueries)
    suggestions.push(...contentGaps.map(gap => ({
      type: 'CONTENT_GAP',
      topic: gap.topic,
      suggestion: `Create content about: ${gap.description}`,
      searchVolume: gap.volume
    })))
    
    return suggestions
  },
  
  // 検索インデックスの最適化
  optimizeSearchIndex: async () => {
    const optimizations = []
    
    // 1. 未使用インデックスの削除
    const unusedIndexes = await findUnusedIndexes()
    if (unusedIndexes.length > 0) {
      await removeUnusedIndexes(unusedIndexes)
      optimizations.push({
        type: 'INDEX_CLEANUP',
        action: `Removed ${unusedIndexes.length} unused indexes`
      })
    }
    
    // 2. 新しいインデックスの追加
    const indexSuggestions = await analyzeQueryPatterns()
    for (const suggestion of indexSuggestions) {
      if (suggestion.impact > 0.5) {
        await createIndex(suggestion.fields)
        optimizations.push({
          type: 'INDEX_CREATION',
          action: `Created index on ${suggestion.fields.join(', ')}`,
          expectedImprovement: suggestion.impact
        })
      }
    }
    
    // 3. 既存インデックスの最適化
    const indexOptimizations = await optimizeExistingIndexes()
    optimizations.push(...indexOptimizations)
    
    return optimizations
  }
}
```

---

## バージョン管理

### 5.1 ドキュメントバージョニング

```javascript
// 包括的なバージョン管理システム
const VersionManager = {
  // バージョンの作成
  createVersion: async (documentId, changes, versionType = 'MINOR') => {
    const document = await getKnowledgeItem(documentId)
    const currentVersion = document.version || '1.0.0'
    const newVersion = this.incrementVersion(currentVersion, versionType)
    
    // バージョンデータの作成
    const versionData = {
      id: generateVersionId(),
      documentId,
      version: newVersion,
      content: document.content,
      metadata: {
        ...document.metadata,
        versionType,
        changes: changes.summary,
        changedBy: changes.userId,
        changedAt: new Date(),
        previousVersion: currentVersion
      },
      diff: await generateDiff(document.previousContent, document.content),
      checksum: calculateChecksum(document.content)
    }
    
    // バージョンの保存
    await saveVersion(versionData)
    
    // ドキュメントの更新
    await updateKnowledgeItem(documentId, {
      version: newVersion,
      lastModified: new Date(),
      previousContent: document.content
    })
    
    return versionData
  },
  
  // バージョン番号の増加
  incrementVersion: (currentVersion, type) => {
    const [major, minor, patch] = currentVersion.split('.').map(Number)
    
    switch (type) {
      case 'MAJOR':
        return `${major + 1}.0.0`
      case 'MINOR':
        return `${major}.${minor + 1}.0`
      case 'PATCH':
        return `${major}.${minor}.${patch + 1}`
      default:
        return `${major}.${minor}.${patch + 1}`
    }
  },
  
  // 差分の生成
  generateDiff: (oldContent, newContent) => {
    const dmp = new DiffMatchPatch()
    const diffs = dmp.diff_main(oldContent, newContent)
    dmp.diff_cleanupSemantic(diffs)
    
    return {
      htmlDiff: dmp.diff_prettyHtml(diffs),
      unifiedDiff: this.generateUnifiedDiff(diffs),
      statistics: this.calculateDiffStats(diffs),
      changes: this.categorizeChanges(diffs)
    }
  },
  
  // バージョンの比較
  compareVersions: async (documentId, version1, version2) => {
    const v1Data = await getVersion(documentId, version1)
    const v2Data = await getVersion(documentId, version2)
    
    const comparison = {
      version1: v1Data,
      version2: v2Data,
      diff: await this.generateDiff(v1Data.content, v2Data.content),
      timeline: await getVersionTimeline(documentId, version1, version2),
      contributors: await getVersionContributors(documentId, version1, version2)
    }
    
    return comparison
  },
  
  // バージョンの復元
  revertToVersion: async (documentId, targetVersion, userId) => {
    const targetVersionData = await getVersion(documentId, targetVersion)
    const currentDocument = await getKnowledgeItem(documentId)
    
    // 復元前のバックアップ作成
    await this.createVersion(documentId, {
      summary: `Backup before revert to ${targetVersion}`,
      userId
    }, 'PATCH')
    
    // 復元の実行
    await updateKnowledgeItem(documentId, {
      content: targetVersionData.content,
      lastModified: new Date(),
      revertedFrom: currentDocument.version,
      revertedTo: targetVersion,
      revertedBy: userId
    })
    
    // 新バージョンの作成
    const newVersion = await this.createVersion(documentId, {
      summary: `Reverted to version ${targetVersion}`,
      userId
    }, 'MINOR')
    
    return newVersion
  }
}
```

### 5.2 ブランチ・マージ機能

```javascript
// Git風のブランチ・マージ機能
const BranchManager = {
  // ブランチの作成
  createBranch: async (documentId, branchName, fromVersion = 'latest') => {
    const sourceDocument = await getKnowledgeItem(documentId)
    const sourceVersion = fromVersion === 'latest' ? 
      sourceDocument.version : 
      await getVersion(documentId, fromVersion)
    
    const branch = {
      id: generateBranchId(),
      documentId,
      name: branchName,
      createdFrom: fromVersion,
      createdAt: new Date(),
      createdBy: getCurrentUserId(),
      isActive: true,
      commits: []
    }
    
    // ブランチコンテンツの初期化
    const branchDocument = {
      ...sourceDocument,
      id: generateBranchDocumentId(),
      parentDocumentId: documentId,
      branchId: branch.id,
      branchName,
      content: sourceVersion.content,
      version: '0.1.0' // ブランチ独自のバージョニング
    }
    
    await saveBranch(branch)
    await saveBranchDocument(branchDocument)
    
    return branch
  },
  
  // ブランチでの作業
  commitToBranch: async (branchId, changes) => {
    const branch = await getBranch(branchId)
    const branchDocument = await getBranchDocument(branchId)
    
    const commit = {
      id: generateCommitId(),
      branchId,
      message: changes.message,
      author: changes.userId,
      timestamp: new Date(),
      changes: changes.changes,
      previousCommit: branch.commits[branch.commits.length - 1]?.id || null
    }
    
    // ブランチドキュメントの更新
    await updateBranchDocument(branchId, {
      content: changes.newContent,
      lastModified: new Date(),
      version: VersionManager.incrementVersion(branchDocument.version, 'PATCH')
    })
    
    // コミットの記録
    await saveCommit(commit)
    await addCommitToBranch(branchId, commit.id)
    
    return commit
  },
  
  // ブランチのマージ
  mergeBranch: async (sourceBranchId, targetDocumentId, mergeStrategy = 'THREE_WAY') => {
    const sourceBranch = await getBranch(sourceBranchId)
    const sourceBranchDocument = await getBranchDocument(sourceBranchId)
    const targetDocument = await getKnowledgeItem(targetDocumentId)
    
    // 共通祖先の特定
    const commonAncestor = await findCommonAncestor(sourceBranch, targetDocument)
    
    // マージ戦略に応じた処理
    let mergeResult
    switch (mergeStrategy) {
      case 'THREE_WAY':
        mergeResult = await performThreeWayMerge(
          commonAncestor.content,
          sourceBranchDocument.content,
          targetDocument.content
        )
        break
      case 'FAST_FORWARD':
        mergeResult = await performFastForwardMerge(sourceBranchDocument, targetDocument)
        break
      case 'RECURSIVE':
        mergeResult = await performRecursiveMerge(sourceBranch, targetDocument)
        break
    }
    
    if (mergeResult.conflicts.length > 0) {
      // 競合がある場合はマージリクエストを作成
      return await createMergeRequest(sourceBranchId, targetDocumentId, mergeResult)
    }
    
    // 競合がない場合は自動マージ
    await updateKnowledgeItem(targetDocumentId, {
      content: mergeResult.mergedContent,
      lastModified: new Date(),
      mergedFrom: sourceBranchId
    })
    
    // ブランチのクローズ
    await closeBranch(sourceBranchId)
    
    return {
      success: true,
      mergedContent: mergeResult.mergedContent,
      conflicts: []
    }
  }
}
```

---

## コラボレーション機能

### 6.1 リアルタイム共同編集

```javascript
// WebSocket ベースのリアルタイム編集
const CollaborativeEditor = {
  // 共同編集セッションの開始
  startSession: async (documentId, userId) => {
    const session = {
      id: generateSessionId(),
      documentId,
      participants: [userId],
      startTime: new Date(),
      isActive: true,
      operations: []
    }
    
    await saveEditingSession(session)
    
    // WebSocket接続の確立
    const ws = await establishWebSocketConnection(userId, session.id)
    
    // 初期ドキュメント状態の送信
    const document = await getKnowledgeItem(documentId)
    ws.send(JSON.stringify({
      type: 'INITIAL_STATE',
      content: document.content,
      participants: session.participants,
      version: document.version
    }))
    
    return session
  },
  
  // 操作の同期（Operational Transform）
  applyOperation: async (sessionId, operation) => {
    const session = await getEditingSession(sessionId)
    
    // 操作の変換（他の参加者の操作との競合解決）
    const transformedOperation = await transformOperation(
      operation,
      session.operations
    )
    
    // 操作の適用
    const updatedContent = applyOperationToContent(
      session.currentContent,
      transformedOperation
    )
    
    // セッションの更新
    await updateEditingSession(sessionId, {
      currentContent: updatedContent,
      operations: [...session.operations, transformedOperation],
      lastModified: new Date()
    })
    
    // 他の参加者への同期
    await broadcastToParticipants(sessionId, {
      type: 'OPERATION',
      operation: transformedOperation,
      author: operation.author
    }, operation.author)
    
    return transformedOperation
  },
  
  // カーソル位置の同期
  syncCursorPosition: async (sessionId, userId, cursorData) => {
    await broadcastToParticipants(sessionId, {
      type: 'CURSOR_UPDATE',
      userId,
      position: cursorData.position,
      selection: cursorData.selection,
      username: await getUserName(userId)
    }, userId)
  },
  
  // 参加者の管理
  handleParticipantChange: async (sessionId, userId, action) => {
    const session = await getEditingSession(sessionId)
    
    switch (action) {
      case 'JOIN':
        if (!session.participants.includes(userId)) {
          session.participants.push(userId)
          await broadcastToParticipants(sessionId, {
            type: 'PARTICIPANT_JOINED',
            userId,
            username: await getUserName(userId),
            participants: session.participants
          })
        }
        break
        
      case 'LEAVE':
        session.participants = session.participants.filter(p => p !== userId)
        await broadcastToParticipants(sessionId, {
          type: 'PARTICIPANT_LEFT',
          userId,
          participants: session.participants
        })
        
        // セッションが空になったら終了
        if (session.participants.length === 0) {
          await endEditingSession(sessionId)
        }
        break
    }
    
    await updateEditingSession(sessionId, { participants: session.participants })
  }
}
```

### 6.2 レビュー・承認ワークフロー

```javascript
// 文書レビュー・承認システム
const ReviewWorkflow = {
  // レビュープロセスの開始
  initiateReview: async (documentId, reviewConfig) => {
    const document = await getKnowledgeItem(documentId)
    
    const reviewProcess = {
      id: generateReviewId(),
      documentId,
      documentVersion: document.version,
      requestedBy: reviewConfig.requestedBy,
      reviewers: reviewConfig.reviewers,
      approvers: reviewConfig.approvers,
      deadline: reviewConfig.deadline,
      reviewType: reviewConfig.reviewType, // 'PEER', 'EXPERT', 'FORMAL'
      status: 'PENDING',
      stages: this.createReviewStages(reviewConfig),
      currentStage: 0,
      createdAt: new Date()
    }
    
    await saveReviewProcess(reviewProcess)
    
    // 最初のレビュワーへの通知
    await notifyReviewers(reviewProcess.stages[0].reviewers, reviewProcess)
    
    return reviewProcess
  },
  
  // レビューの提出
  submitReview: async (reviewProcessId, reviewerId, reviewData) => {
    const reviewProcess = await getReviewProcess(reviewProcessId)
    const currentStage = reviewProcess.stages[reviewProcess.currentStage]
    
    const review = {
      id: generateReviewCommentId(),
      reviewProcessId,
      reviewerId,
      stage: reviewProcess.currentStage,
      decision: reviewData.decision, // 'APPROVE', 'REJECT', 'REQUEST_CHANGES'
      comments: reviewData.comments,
      suggestions: reviewData.suggestions,
      attachments: reviewData.attachments,
      submittedAt: new Date()
    }
    
    await saveReview(review)
    
    // レビュー完了の確認
    const stageComplete = await checkStageCompletion(
      reviewProcessId,
      reviewProcess.currentStage
    )
    
    if (stageComplete) {
      await this.progressToNextStage(reviewProcessId)
    }
    
    return review
  },
  
  // 承認ワークフローの管理
  progressToNextStage: async (reviewProcessId) => {
    const reviewProcess = await getReviewProcess(reviewProcessId)
    const nextStage = reviewProcess.currentStage + 1
    
    if (nextStage >= reviewProcess.stages.length) {
      // すべてのステージ完了
      await this.finalizeReview(reviewProcessId)
      return
    }
    
    // 次のステージへ進行
    await updateReviewProcess(reviewProcessId, {
      currentStage: nextStage,
      stageStartTime: new Date()
    })
    
    // 次のステージのレビュワーへ通知
    const nextStageConfig = reviewProcess.stages[nextStage]
    await notifyReviewers(nextStageConfig.reviewers, reviewProcess)
  },
  
  // レビュープロセスの完了
  finalizeReview: async (reviewProcessId) => {
    const reviewProcess = await getReviewProcess(reviewProcessId)
    const allReviews = await getReviewsForProcess(reviewProcessId)
    
    // 最終決定の計算
    const finalDecision = this.calculateFinalDecision(allReviews)
    
    await updateReviewProcess(reviewProcessId, {
      status: 'COMPLETED',
      finalDecision,
      completedAt: new Date()
    })
    
    // 結果に基づくアクション
    switch (finalDecision.decision) {
      case 'APPROVED':
        await approveDocument(reviewProcess.documentId)
        break
      case 'REJECTED':
        await rejectDocument(reviewProcess.documentId, finalDecision.reasons)
        break
      case 'NEEDS_REVISION':
        await requestRevision(reviewProcess.documentId, finalDecision.changes)
        break
    }
    
    // 関係者への通知
    await notifyReviewCompletion(reviewProcess, finalDecision)
  }
}
```

### 6.3 コメント・ディスカッション機能

```javascript
// ドキュメントディスカッションシステム
const DiscussionManager = {
  // コメントの追加
  addComment: async (documentId, commentData) => {
    const comment = {
      id: generateCommentId(),
      documentId,
      authorId: commentData.authorId,
      content: commentData.content,
      type: commentData.type, // 'GENERAL', 'SUGGESTION', 'QUESTION', 'ISSUE'
      position: commentData.position, // 文書内の位置
      parentCommentId: commentData.parentCommentId, // 返信の場合
      status: 'ACTIVE',
      createdAt: new Date(),
      mentions: extractMentions(commentData.content),
      attachments: commentData.attachments || []
    }
    
    await saveComment(comment)
    
    // メンション通知
    if (comment.mentions.length > 0) {
      await sendMentionNotifications(comment.mentions, comment)
    }
    
    // スレッド参加者への通知
    if (comment.parentCommentId) {
      await notifyThreadParticipants(comment.parentCommentId, comment)
    }
    
    return comment
  },
  
  // ディスカッションスレッドの管理
  createDiscussionThread: async (documentId, threadData) => {
    const thread = {
      id: generateThreadId(),
      documentId,
      title: threadData.title,
      description: threadData.description,
      createdBy: threadData.userId,
      participants: [threadData.userId],
      status: 'OPEN',
      priority: threadData.priority || 'MEDIUM',
      tags: threadData.tags || [],
      createdAt: new Date(),
      lastActivity: new Date()
    }
    
    await saveDiscussionThread(thread)
    
    // 初期コメントの追加
    if (threadData.initialComment) {
      await this.addComment(documentId, {
        ...threadData.initialComment,
        threadId: thread.id
      })
    }
    
    return thread
  },
  
  // 解決済みマーク
  resolveDiscussion: async (threadId, resolverId, resolution) => {
    const thread = await getDiscussionThread(threadId)
    
    await updateDiscussionThread(threadId, {
      status: 'RESOLVED',
      resolvedBy: resolverId,
      resolvedAt: new Date(),
      resolution: resolution.summary,
      resolutionDetails: resolution.details
    })
    
    // 参加者への通知
    await notifyThreadResolution(thread, resolution)
  },
  
  // AI による議論の要約
  summarizeDiscussion: async (threadId) => {
    const thread = await getDiscussionThread(threadId)
    const comments = await getThreadComments(threadId)
    
    const summary = await callAI({
      model: 'discussion-summarizer',
      input: {
        threadTitle: thread.title,
        comments: comments.map(c => ({
          author: c.authorName,
          content: c.content,
          timestamp: c.createdAt
        }))
      }
    })
    
    return {
      summary: summary.mainPoints,
      keyDecisions: summary.decisions,
      actionItems: summary.actionItems,
      unresolved: summary.unresolved,
      participants: summary.activeParticipants
    }
  }
}
```

---

## トラブルシューティング

### 7.1 よくある問題と解決策

```javascript
// ナレッジ管理の問題診断・解決
const KnowledgeTroubleshooter = {
  // 検索パフォーマンス問題
  diagnoseSearchPerformance: async () => {
    const issues = []
    
    // インデックス状態のチェック
    const indexHealth = await checkSearchIndexHealth()
    if (!indexHealth.optimal) {
      issues.push({
        type: 'INDEX_PERFORMANCE',
        severity: 'MEDIUM',
        message: 'Search index needs optimization',
        solution: 'Run index optimization or rebuild'
      })
    }
    
    // 大容量ドキュメントのチェック
    const largeDocuments = await findLargeDocuments(1000000) // 1MB以上
    if (largeDocuments.length > 0) {
      issues.push({
        type: 'LARGE_DOCUMENTS',
        severity: 'LOW',
        message: `${largeDocuments.length} documents exceed size limit`,
        solution: 'Consider breaking down large documents'
      })
    }
    
    return issues
  },
  
  // 同期問題の解決
  resolveSyncIssues: async (documentId) => {
    const document = await getKnowledgeItem(documentId)
    const repairs = []
    
    // Google Docs同期の問題
    if (document.syncEnabled && document.googleDocId) {
      try {
        await testGoogleDocsConnection(document.googleDocId)
      } catch (error) {
        repairs.push(await repairGoogleDocsSync(documentId, error))
      }
    }
    
    // バージョン整合性の問題
    const versionIntegrity = await checkVersionIntegrity(documentId)
    if (!versionIntegrity.valid) {
      repairs.push(await repairVersionHistory(documentId))
    }
    
    return repairs
  },
  
  // データ破損の修復
  repairCorruptedData: async (documentId) => {
    const document = await getKnowledgeItem(documentId)
    const backups = await getDocumentBackups(documentId)
    
    if (backups.length === 0) {
      return { success: false, message: 'No backups available' }
    }
    
    // 最新の有効なバックアップを特定
    const validBackup = backups.find(backup => 
      backup.checksum && validateChecksum(backup.content, backup.checksum)
    )
    
    if (validBackup) {
      await restoreFromBackup(documentId, validBackup)
      return { 
        success: true, 
        message: `Restored from backup: ${validBackup.timestamp}` 
      }
    }
    
    return { success: false, message: 'No valid backups found' }
  }
}
```

---

**最終更新日**: 2025-06-29  
**対象バージョン**: Phase 4 完了版  
**関連ドキュメント**: システム機能カテゴリ一覧、AI・機械学習機能マニュアル
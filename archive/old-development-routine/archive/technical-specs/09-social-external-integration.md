# ソーシャル・外部連携システム マニュアル

## 概要

FIND to DO Management Appのソーシャル・外部連携システムは、多様な外部プラットフォームとの統合による包括的な情報管理・分析システムです。Twitter、Instagram、Discord、LINE Bot等の主要プラットフォームとの連携により、統合的なソーシャルメディア分析とコミュニケーション自動化を実現します。

### 主要特徴
- Twitter API v2による詳細なソーシャル分析
- Instagram Basic Display & Graph API連携
- Discord サーバーメトリクス収集・分析
- LINE Bot 完全版によるタスク管理連携
- 外部Webhook統合システム
- Google Apps Script連携
- リアルタイムレート制限管理
- 包括的なエラーハンドリングとログ監視

---

## 目次

1. [システムアーキテクチャ](#システムアーキテクチャ)
2. [Twitter連携システム](#twitter連携システム)
3. [Instagram連携機能](#instagram連携機能)
4. [Discord統合分析](#discord統合分析)
5. [LINE Bot完全版システム](#line-bot完全版システム)
6. [ソーシャルアナリティクス](#ソーシャルアナリティクス)
7. [Webhook統合管理](#webhook統合管理)
8. [外部API統合](#外部api統合)
9. [リアルタイム通知システム](#リアルタイム通知システム)
10. [トラブルシューティング](#トラブルシューティング)

---

## システムアーキテクチャ

### 外部連携システム全体構成

```typescript
// 外部連携システムの核となるアーキテクチャ
interface ExternalIntegrationSystem {
  socialPlatforms: {
    twitter: TwitterAPIService
    instagram: InstagramAPIService
    discord: DiscordMetricsService
  }
  messagingPlatforms: {
    line: LINEBotSystem
    webhooks: WebhookManager
  }
  analytics: {
    socialAnalytics: SocialAnalyticsDashboard
    realTimeMetrics: RealTimeMetricsCollector
  }
  utilities: {
    rateLimitManager: RateLimitManager
    cacheService: CacheService
    errorHandler: ErrorHandler
  }
}
```

### プラットフォーム連携フロー

```typescript
// 統合連携処理フロー
class IntegrationOrchestrator {
  async processSocialData(): Promise<SocialDataSummary> {
    const twitterData = await this.twitterService.fetchUserAnalytics()
    const instagramData = await this.instagramService.fetchMediaInsights()
    const discordMetrics = await this.discordService.getServerMetrics()
    
    return this.aggregateAndAnalyze({
      twitter: twitterData,
      instagram: instagramData,
      discord: discordMetrics,
      timestamp: new Date()
    })
  }
  
  async sendCrossplatformNotification(event: SystemEvent): Promise<void> {
    // Discord → LINE 通知ブリッジ
    if (event.source === 'discord') {
      await this.lineService.sendDiscordNotification(event)
    }
    
    // ソーシャルメディア更新 → タスク作成
    if (event.type === 'social_mention') {
      await this.taskService.createFromSocialMention(event)
    }
  }
}
```

---

## Twitter連携システム

### Twitter API v2統合

```typescript
// Twitter API v2 サービス実装
class TwitterAPIService {
  private bearerToken: string
  private baseURL = 'https://api.twitter.com/2'
  private rateLimit: RateLimitManager
  
  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN!
    this.rateLimit = new RateLimitManager('twitter')
  }
  
  // ユーザー分析データ取得
  async getUserAnalytics(username: string): Promise<TwitterUserAnalytics> {
    await this.rateLimit.checkLimit('users/by/username')
    
    const user = await this.getUser(username)
    const tweets = await this.getUserTweets(user.id)
    const metrics = await this.calculateEngagementMetrics(tweets)
    
    return {
      user,
      tweets,
      metrics: {
        totalTweets: tweets.length,
        avgEngagement: metrics.avgEngagement,
        topPerformingTweet: metrics.topTweet,
        engagementTrend: metrics.trend,
        followerGrowth: await this.getFollowerGrowth(user.id)
      }
    }
  }
  
  // ツイート詳細分析
  async getTweetAnalytics(tweetId: string): Promise<TweetAnalytics> {
    const response = await fetch(`${this.baseURL}/tweets/${tweetId}?tweet.fields=public_metrics,author_id,created_at,context_annotations`, {
      headers: { 'Authorization': `Bearer ${this.bearerToken}` }
    })
    
    const data = await response.json()
    
    return {
      id: data.data.id,
      text: data.data.text,
      author: data.data.author_id,
      createdAt: new Date(data.data.created_at),
      metrics: {
        retweets: data.data.public_metrics.retweet_count,
        likes: data.data.public_metrics.like_count,
        replies: data.data.public_metrics.reply_count,
        quotes: data.data.public_metrics.quote_count,
        impressions: data.data.public_metrics.impression_count
      },
      contextAnnotations: data.data.context_annotations || []
    }
  }
  
  // エンゲージメント分析
  private async calculateEngagementMetrics(tweets: Tweet[]): Promise<EngagementMetrics> {
    const totalEngagement = tweets.reduce((sum, tweet) => 
      sum + tweet.public_metrics.like_count + tweet.public_metrics.retweet_count + tweet.public_metrics.reply_count, 0
    )
    
    const avgEngagement = totalEngagement / tweets.length
    const topTweet = tweets.reduce((prev, current) => 
      (prev.public_metrics.like_count > current.public_metrics.like_count) ? prev : current
    )
    
    return {
      avgEngagement,
      topTweet,
      trend: this.calculateTrend(tweets),
      peakHours: this.identifyPeakHours(tweets)
    }
  }
}
```

### Twitter キャッシュ管理システム

```typescript
// レート制限対応キャッシュシステム
class TwitterCacheService {
  private cache = new Map<string, CacheEntry>()
  private readonly CACHE_TTL = 15 * 60 * 1000 // 15分
  
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }
  
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL,
      createdAt: Date.now()
    })
    
    // メモリ使用量監視
    this.monitorMemoryUsage()
  }
  
  // レート制限情報キャッシュ
  async cacheRateLimitInfo(endpoint: string, headers: Headers): Promise<void> {
    const rateLimitInfo = {
      limit: parseInt(headers.get('x-rate-limit-limit') || '0'),
      remaining: parseInt(headers.get('x-rate-limit-remaining') || '0'),
      reset: parseInt(headers.get('x-rate-limit-reset') || '0'),
      timestamp: Date.now()
    }
    
    this.set(`rate-limit:${endpoint}`, rateLimitInfo)
  }
  
  private monitorMemoryUsage(): void {
    if (this.cache.size > 1000) {
      // 最も古いエントリから削除
      const oldestKey = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.createdAt - b.createdAt)[0][0]
      this.cache.delete(oldestKey)
    }
  }
}
```

---

## Instagram連携機能

### Instagram Basic Display API

```typescript
// Instagram Basic Display API サービス
class InstagramBasicDisplayService {
  private accessToken: string
  private baseURL = 'https://graph.instagram.com'
  
  constructor(accessToken: string) {
    this.accessToken = accessToken
  }
  
  // ユーザーメディア取得
  async getUserMedia(userId: string): Promise<InstagramMedia[]> {
    const response = await fetch(
      `${this.baseURL}/${userId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${this.accessToken}`
    )
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Instagram API Error: ${data.error.message}`)
    }
    
    return data.data.map((item: any) => ({
      id: item.id,
      caption: item.caption || '',
      mediaType: item.media_type,
      mediaUrl: item.media_url,
      permalink: item.permalink,
      thumbnailUrl: item.thumbnail_url,
      timestamp: new Date(item.timestamp)
    }))
  }
  
  // メディア詳細情報取得
  async getMediaDetails(mediaId: string): Promise<InstagramMediaDetails> {
    const response = await fetch(
      `${this.baseURL}/${mediaId}?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${this.accessToken}`
    )
    
    const data = await response.json()
    
    return {
      id: data.id,
      caption: data.caption,
      mediaType: data.media_type,
      mediaUrl: data.media_url,
      permalink: data.permalink,
      timestamp: new Date(data.timestamp),
      metrics: {
        likes: data.like_count || 0,
        comments: data.comments_count || 0
      }
    }
  }
  
  // ユーザープロフィール取得
  async getUserProfile(userId: string): Promise<InstagramProfile> {
    const response = await fetch(
      `${this.baseURL}/${userId}?fields=id,username,account_type,media_count&access_token=${this.accessToken}`
    )
    
    const data = await response.json()
    
    return {
      id: data.id,
      username: data.username,
      accountType: data.account_type,
      mediaCount: data.media_count
    }
  }
}
```

### Instagram Graph API（ビジネスアカウント）

```typescript
// Instagram Graph API サービス（ビジネス向け）
class InstagramGraphAPIService {
  private accessToken: string
  private baseURL = 'https://graph.facebook.com/v18.0'
  
  // ビジネスアカウント分析
  async getBusinessInsights(accountId: string, metrics: string[], period: string): Promise<InstagramInsights> {
    const metricsParam = metrics.join(',')
    const response = await fetch(
      `${this.baseURL}/${accountId}/insights?metric=${metricsParam}&period=${period}&access_token=${this.accessToken}`
    )
    
    const data = await response.json()
    
    return {
      accountId,
      period,
      insights: data.data.map((insight: any) => ({
        name: insight.name,
        title: insight.title,
        description: insight.description,
        id: insight.id,
        values: insight.values
      }))
    }
  }
  
  // メディアインサイト取得
  async getMediaInsights(mediaId: string): Promise<MediaInsights> {
    const metrics = ['impressions', 'reach', 'engagement', 'saves', 'video_views']
    const response = await fetch(
      `${this.baseURL}/${mediaId}/insights?metric=${metrics.join(',')}&access_token=${this.accessToken}`
    )
    
    const data = await response.json()
    
    const insights: Record<string, number> = {}
    data.data.forEach((metric: any) => {
      insights[metric.name] = metric.values[0]?.value || 0
    })
    
    return {
      mediaId,
      impressions: insights.impressions || 0,
      reach: insights.reach || 0,
      engagement: insights.engagement || 0,
      saves: insights.saves || 0,
      videoViews: insights.video_views || 0,
      engagementRate: insights.reach > 0 ? (insights.engagement / insights.reach) * 100 : 0
    }
  }
  
  // ハッシュタグ分析
  async getHashtagInsights(hashtag: string): Promise<HashtagInsights> {
    const response = await fetch(
      `${this.baseURL}/ig_hashtag_search?user_id=${this.userId}&q=${hashtag}&access_token=${this.accessToken}`
    )
    
    const data = await response.json()
    
    if (data.data.length === 0) {
      throw new Error(`Hashtag "${hashtag}" not found`)
    }
    
    const hashtagId = data.data[0].id
    
    // ハッシュタグの上位メディア取得
    const topMediaResponse = await fetch(
      `${this.baseURL}/${hashtagId}/top_media?user_id=${this.userId}&fields=id,media_type,media_url,permalink,timestamp&access_token=${this.accessToken}`
    )
    
    const topMediaData = await topMediaResponse.json()
    
    return {
      hashtag,
      id: hashtagId,
      topMedia: topMediaData.data || []
    }
  }
}
```

---

## Discord統合分析

### Discord メトリクス収集システム

```typescript
// Discord サーバーメトリクス管理
class DiscordMetricsService {
  private client: DiscordClient
  private database: PrismaClient
  
  constructor() {
    this.client = new DiscordClient()
    this.database = new PrismaClient()
  }
  
  // サーバーメトリクス収集
  async collectServerMetrics(serverId: string): Promise<DiscordServerMetrics> {
    const guild = await this.client.guilds.fetch(serverId)
    
    if (!guild) {
      throw new Error(`Discord server ${serverId} not found`)
    }
    
    const members = await guild.members.fetch()
    const channels = await guild.channels.fetch()
    const roles = await guild.roles.fetch()
    
    const metrics: DiscordServerMetrics = {
      serverId: guild.id,
      serverName: guild.name,
      memberCount: guild.memberCount,
      onlineMembers: members.filter(member => member.presence?.status === 'online').size,
      textChannels: channels.filter(channel => channel?.type === ChannelType.GuildText).size,
      voiceChannels: channels.filter(channel => channel?.type === ChannelType.GuildVoice).size,
      roleCount: roles.size,
      boostLevel: guild.premiumTier,
      boostCount: guild.premiumSubscriptionCount || 0,
      timestamp: new Date()
    }
    
    // データベースに保存
    await this.saveMetrics(metrics)
    
    return metrics
  }
  
  // メッセージ活動分析
  async analyzeMessageActivity(serverId: string, period: number = 7): Promise<MessageActivity> {
    const guild = await this.client.guilds.fetch(serverId)
    const channels = await guild.channels.fetch()
    
    const textChannels = channels.filter(channel => 
      channel?.type === ChannelType.GuildText
    ) as Collection<string, TextChannel>
    
    let totalMessages = 0
    const channelActivity: ChannelActivity[] = []
    const userActivity: Map<string, number> = new Map()
    
    for (const [channelId, channel] of textChannels) {
      try {
        const messages = await channel.messages.fetch({ 
          limit: 100,
          after: this.getTimestampDaysAgo(period)
        })
        
        const channelMessageCount = messages.size
        totalMessages += channelMessageCount
        
        channelActivity.push({
          channelId,
          channelName: channel.name,
          messageCount: channelMessageCount,
          uniqueUsers: new Set(messages.map(msg => msg.author.id)).size
        })
        
        // ユーザー別活動集計
        messages.forEach(message => {
          const userId = message.author.id
          userActivity.set(userId, (userActivity.get(userId) || 0) + 1)
        })
        
      } catch (error) {
        console.error(`Error analyzing channel ${channel.name}:`, error)
      }
    }
    
    return {
      serverId,
      period,
      totalMessages,
      dailyAverage: totalMessages / period,
      channelActivity: channelActivity.sort((a, b) => b.messageCount - a.messageCount),
      topUsers: Array.from(userActivity.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, messageCount: count }))
    }
  }
  
  // エンゲージメントスコア計算
  async calculateEngagementScore(serverId: string): Promise<EngagementScore> {
    const metrics = await this.collectServerMetrics(serverId)
    const activity = await this.analyzeMessageActivity(serverId)
    
    // エンゲージメントスコア算出アルゴリズム
    const messagePerMemberRatio = activity.totalMessages / metrics.memberCount
    const activeUserRatio = activity.topUsers.length / metrics.memberCount
    const channelUtilization = activity.channelActivity.filter(ch => ch.messageCount > 0).length / metrics.textChannels
    
    const engagementScore = Math.min(100, Math.round(
      (messagePerMemberRatio * 30) +
      (activeUserRatio * 100 * 40) +
      (channelUtilization * 30)
    ))
    
    return {
      serverId,
      score: engagementScore,
      factors: {
        messageActivity: messagePerMemberRatio,
        userParticipation: activeUserRatio,
        channelUtilization: channelUtilization
      },
      calculatedAt: new Date()
    }
  }
  
  private async saveMetrics(metrics: DiscordServerMetrics): Promise<void> {
    await this.database.discordMetrics.create({
      data: {
        serverId: metrics.serverId,
        serverName: metrics.serverName,
        memberCount: metrics.memberCount,
        onlineMembers: metrics.onlineMembers,
        textChannels: metrics.textChannels,
        voiceChannels: metrics.voiceChannels,
        roleCount: metrics.roleCount,
        boostLevel: metrics.boostLevel,
        boostCount: metrics.boostCount,
        timestamp: metrics.timestamp
      }
    })
  }
  
  private getTimestampDaysAgo(days: number): string {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString()
  }
}
```

### Discord to LINE 通知ブリッジ

```typescript
// Discord → LINE 通知システム
class DiscordToLINEBridge {
  private lineClient: LineClient
  private discordClient: DiscordClient
  
  constructor() {
    this.lineClient = new LineClient()
    this.discordClient = new DiscordClient()
  }
  
  // 新メンバー参加通知
  async handleNewMemberNotification(member: DiscordMember): Promise<void> {
    const guild = member.guild
    
    const notification: LineNotification = {
      type: 'discord_new_member',
      title: '新メンバー参加通知',
      message: `${guild.name}に新しいメンバーが参加しました`,
      details: {
        serverName: guild.name,
        memberName: member.user.displayName,
        memberCount: guild.memberCount,
        joinedAt: new Date()
      }
    }
    
    await this.lineClient.sendNotificationToAdmins(notification)
  }
  
  // スタッフ不在アラート
  async handleStaffAbsenceAlert(staffMember: DiscordMember, duration: number): Promise<void> {
    const alert: LineNotification = {
      type: 'staff_absence_alert',
      title: 'スタッフ不在アラート',
      message: `${staffMember.user.displayName}が${duration}時間以上オフラインです`,
      urgency: 'high',
      details: {
        staffName: staffMember.user.displayName,
        lastSeen: staffMember.presence?.activities[0]?.timestamps?.start || new Date(),
        duration,
        roles: staffMember.roles.cache.map(role => role.name)
      }
    }
    
    await this.lineClient.sendUrgentNotification(alert)
  }
  
  // サーバーイベント通知
  async handleServerEvent(event: DiscordServerEvent): Promise<void> {
    let notification: LineNotification
    
    switch (event.type) {
      case 'member_boost':
        notification = {
          type: 'discord_boost',
          title: 'サーバーブースト通知',
          message: `${event.member.displayName}がサーバーをブーストしました！`,
          details: {
            memberName: event.member.displayName,
            boostLevel: event.guild.premiumTier,
            totalBoosts: event.guild.premiumSubscriptionCount
          }
        }
        break
        
      case 'role_update':
        notification = {
          type: 'role_update',
          title: 'ロール変更通知',
          message: `${event.member.displayName}のロールが変更されました`,
          details: {
            memberName: event.member.displayName,
            oldRoles: event.oldRoles,
            newRoles: event.newRoles
          }
        }
        break
        
      default:
        return // 未対応イベント
    }
    
    await this.lineClient.sendNotification(notification)
  }
}
```

---

## LINE Bot完全版システム

### LINE Webhook処理システム

```typescript
// LINE Webhook メインハンドラー
class LINEWebhookHandler {
  private messageProcessor: MessageProcessor
  private postbackHandler: PostbackHandler
  private userManager: LINEUserManager
  private validator: WebhookValidator
  
  constructor() {
    this.messageProcessor = new MessageProcessor()
    this.postbackHandler = new PostbackHandler()
    this.userManager = new LINEUserManager()
    this.validator = new WebhookValidator()
  }
  
  // Webhook イベント処理
  async handleWebhook(request: Request): Promise<Response> {
    try {
      // 署名検証
      const isValid = await this.validator.validateSignature(request)
      if (!isValid) {
        return new Response('Unauthorized', { status: 401 })
      }
      
      const body = await request.json()
      const events = body.events || []
      
      // 並列イベント処理
      await Promise.all(events.map(event => this.processEvent(event)))
      
      return new Response('OK', { status: 200 })
      
    } catch (error) {
      console.error('Webhook processing error:', error)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
  
  // 個別イベント処理
  private async processEvent(event: LineEvent): Promise<void> {
    const { type, source, timestamp } = event
    
    // ユーザー情報確保
    await this.ensureUser(source)
    
    switch (type) {
      case 'message':
        await this.handleMessageEvent(event as MessageEvent)
        break
      case 'postback':
        await this.handlePostbackEvent(event as PostbackEvent)
        break
      case 'follow':
        await this.handleFollowEvent(event as FollowEvent)
        break
      case 'unfollow':
        await this.handleUnfollowEvent(event as UnfollowEvent)
        break
      case 'join':
        await this.handleJoinEvent(event as JoinEvent)
        break
      case 'leave':
        await this.handleLeaveEvent(event as LeaveEvent)
        break
      default:
        console.log(`Unhandled event type: ${type}`)
    }
  }
  
  // メッセージイベント処理
  private async handleMessageEvent(event: MessageEvent): Promise<void> {
    const { message, source, replyToken } = event
    
    if (message.type === 'text') {
      const response = await this.messageProcessor.processTextMessage({
        text: message.text,
        userId: this.getUserId(source),
        groupId: source.type === 'group' ? source.groupId : undefined,
        replyToken
      })
      
      if (response) {
        await this.sendReply(replyToken, response)
      }
    }
  }
  
  // ポストバックイベント処理
  private async handlePostbackEvent(event: PostbackEvent): Promise<void> {
    const { postback, source, replyToken } = event
    
    const response = await this.postbackHandler.handlePostback({
      data: postback.data,
      params: postback.params,
      userId: this.getUserId(source),
      replyToken
    })
    
    if (response) {
      await this.sendReply(replyToken, response)
    }
  }
  
  private async ensureUser(source: EventSource): Promise<void> {
    const userId = this.getUserId(source)
    if (userId) {
      await this.userManager.ensureUserExists(userId, source)
    }
  }
  
  private getUserId(source: EventSource): string | undefined {
    return source.type === 'user' ? source.userId :
           source.type === 'group' ? source.userId :
           source.type === 'room' ? source.userId : undefined
  }
  
  private async sendReply(replyToken: string, messages: LineMessage[]): Promise<void> {
    const client = new LineClient()
    await client.replyMessage(replyToken, messages)
  }
}
```

### LINE AI メッセージプロセッサー

```typescript
// LINE AI自動処理システム
class LINEAIMessageProcessor {
  private nlpEngine: NLPEngine
  private dataExtractor: DataExtractor
  private taskCreator: TaskCreator
  private sessionManager: SessionManager
  
  // 自然言語メッセージ処理
  async processNaturalLanguageMessage(input: MessageInput): Promise<ProcessedMessage> {
    const { text, userId, groupId } = input
    
    // セッション状態確認
    const session = await this.sessionManager.getSession(userId)
    
    // AI分類処理
    const classification = await this.classifyMessage(text)
    
    switch (classification.type) {
      case 'task_creation':
        return await this.handleTaskCreation(text, userId, classification)
        
      case 'appointment_scheduling':
        return await this.handleAppointmentScheduling(text, userId, classification)
        
      case 'project_management':
        return await this.handleProjectManagement(text, userId, classification)
        
      case 'sales_activity':
        return await this.handleSalesActivity(text, userId, classification)
        
      case 'knowledge_entry':
        return await this.handleKnowledgeEntry(text, userId, classification)
        
      case 'general_query':
        return await this.handleGeneralQuery(text, userId)
        
      default:
        return await this.handleUnknownMessage(text, userId)
    }
  }
  
  // メッセージ分類AI
  private async classifyMessage(text: string): Promise<MessageClassification> {
    const prompt = `
以下のメッセージを7つのカテゴリーに分類してください：
1. task_creation - タスク作成・管理
2. appointment_scheduling - アポイントメント・予定
3. project_management - プロジェクト管理
4. sales_activity - 営業活動
5. knowledge_entry - ナレッジ・メモ
6. general_query - 一般的な質問
7. unknown - その他

メッセージ: "${text}"

返答形式:
{
  "type": "分類タイプ",
  "confidence": 0.0-1.0,
  "entities": ["抽出されたエンティティ"],
  "intent": "具体的な意図"
}
`
    
    const response = await this.nlpEngine.generate(prompt)
    return JSON.parse(response)
  }
  
  // タスク作成処理
  private async handleTaskCreation(text: string, userId: string, classification: MessageClassification): Promise<ProcessedMessage> {
    const extractedData = await this.dataExtractor.extractTaskData(text)
    
    const task = await this.taskCreator.createTask({
      title: extractedData.title,
      description: extractedData.description,
      priority: extractedData.priority || 'B',
      assigneeId: extractedData.assigneeId || userId,
      dueDate: extractedData.dueDate,
      tags: extractedData.tags,
      category: extractedData.category || 'TASK',
      createdBy: userId,
      source: 'line'
    })
    
    // 詳細確認UI生成
    const confirmationUI = this.generateTaskConfirmationUI(task)
    
    return {
      type: 'task_created',
      message: `タスクを作成しました: ${task.title}`,
      data: task,
      ui: confirmationUI,
      nextAction: 'task_confirmation'
    }
  }
  
  // 営業活動処理
  private async handleSalesActivity(text: string, userId: string, classification: MessageClassification): Promise<ProcessedMessage> {
    const salesData = await this.extractSalesData(text)
    
    // 営業キーワード自動検知
    const salesKeywords = this.detectSalesKeywords(text)
    
    if (salesKeywords.length > 0) {
      // 営業機会として記録
      const opportunity = await this.createSalesOpportunity({
        description: text,
        keywords: salesKeywords,
        confidence: classification.confidence,
        stage: this.determineSalesStage(salesKeywords),
        value: salesData.estimatedValue,
        contactInfo: salesData.contactInfo,
        followUpDate: salesData.followUpDate,
        createdBy: userId
      })
      
      return {
        type: 'sales_opportunity',
        message: '営業機会を記録しました',
        data: opportunity,
        ui: this.generateSalesOpportunityUI(opportunity),
        nextAction: 'sales_follow_up'
      }
    }
    
    return await this.handleGeneralQuery(text, userId)
  }
  
  // データ抽出処理
  private async extractSalesData(text: string): Promise<SalesData> {
    const prompt = `
以下の営業メッセージから構造化データを抽出してください：

メッセージ: "${text}"

抽出項目：
- 会社名・顧客名
- 案件規模・予算
- 提案内容
- 次回アクション・フォローアップ日
- 成約確率
- 担当者情報

JSON形式で返答してください。
`
    
    const response = await this.nlpEngine.generate(prompt)
    return JSON.parse(response)
  }
  
  // 営業キーワード検出
  private detectSalesKeywords(text: string): string[] {
    const salesKeywords = [
      '商談', '提案', '見積', '契約', '成約', '案件',
      '顧客', 'クライアント', '予算', '決裁', '導入',
      'アポ', '打ち合わせ', 'ミーティング', '商品説明',
      '要望', 'ニーズ', '課題', '解決', '効果',
      'ROI', 'コスト削減', '売上向上', '競合'
    ]
    
    return salesKeywords.filter(keyword => text.includes(keyword))
  }
  
  // 営業ステージ判定
  private determineSalesStage(keywords: string[]): string {
    if (keywords.some(k => ['契約', '成約', '導入'].includes(k))) return 'closing'
    if (keywords.some(k => ['提案', '見積', '商品説明'].includes(k))) return 'proposal'
    if (keywords.some(k => ['商談', 'ミーティング', '打ち合わせ'].includes(k))) return 'negotiation'
    if (keywords.some(k => ['アポ', '初回', '紹介'].includes(k))) return 'initial_contact'
    return 'qualification'
  }
  
  // UI生成メソッド
  private generateTaskConfirmationUI(task: any): FlexMessage {
    return {
      type: 'flex',
      altText: 'タスク確認',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'タスク作成確認',
              weight: 'bold',
              size: 'lg'
            }
          ]
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `タイトル: ${task.title}`,
              wrap: true
            },
            {
              type: 'text',
              text: `優先度: ${task.priority}`,
              margin: 'sm'
            },
            {
              type: 'text',
              text: `期限: ${task.dueDate || '未設定'}`,
              margin: 'sm'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '確定',
                data: JSON.stringify({
                  action: 'confirm_task',
                  taskId: task.id
                })
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '編集',
                data: JSON.stringify({
                  action: 'edit_task',
                  taskId: task.id
                })
              }
            }
          ]
        }
      }
    }
  }
}
```

### LINE セッション管理システム

```typescript
// LINE Bot セッション管理
class LINESessionManager {
  private sessions = new Map<string, UserSession>()
  private database: PrismaClient
  
  constructor() {
    this.database = new PrismaClient()
  }
  
  // セッション取得・作成
  async getSession(userId: string): Promise<UserSession> {
    let session = this.sessions.get(userId)
    
    if (!session) {
      // データベースから復元
      const dbSession = await this.database.lineUserSession.findUnique({
        where: { userId }
      })
      
      if (dbSession) {
        session = {
          userId,
          state: dbSession.state as SessionState,
          context: JSON.parse(dbSession.context || '{}'),
          currentFlow: dbSession.currentFlow,
          createdAt: dbSession.createdAt,
          updatedAt: dbSession.updatedAt,
          expiresAt: dbSession.expiresAt
        }
      } else {
        session = this.createNewSession(userId)
      }
      
      this.sessions.set(userId, session)
    }
    
    return session
  }
  
  // セッション状態更新
  async updateSession(userId: string, updates: Partial<UserSession>): Promise<UserSession> {
    const session = await this.getSession(userId)
    
    Object.assign(session, updates, { updatedAt: new Date() })
    
    // データベース同期
    await this.database.lineUserSession.upsert({
      where: { userId },
      create: {
        userId,
        state: session.state,
        context: JSON.stringify(session.context),
        currentFlow: session.currentFlow,
        expiresAt: session.expiresAt
      },
      update: {
        state: session.state,
        context: JSON.stringify(session.context),
        currentFlow: session.currentFlow,
        updatedAt: session.updatedAt,
        expiresAt: session.expiresAt
      }
    })
    
    this.sessions.set(userId, session)
    return session
  }
  
  // フロー開始
  async startFlow(userId: string, flowType: FlowType, initialData?: any): Promise<UserSession> {
    return await this.updateSession(userId, {
      state: 'in_flow',
      currentFlow: flowType,
      context: {
        flowType,
        step: 1,
        data: initialData || {},
        startedAt: new Date()
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30分後
    })
  }
  
  // フロー進行
  async advanceFlow(userId: string, stepData: any): Promise<UserSession> {
    const session = await this.getSession(userId)
    
    if (session.state !== 'in_flow' || !session.context) {
      throw new Error('No active flow to advance')
    }
    
    const nextStep = session.context.step + 1
    const updatedData = { ...session.context.data, ...stepData }
    
    return await this.updateSession(userId, {
      context: {
        ...session.context,
        step: nextStep,
        data: updatedData,
        lastStepAt: new Date()
      }
    })
  }
  
  // フロー完了
  async completeFlow(userId: string, finalData?: any): Promise<UserSession> {
    const session = await this.getSession(userId)
    
    // フロー結果を保存
    if (session.context && finalData) {
      await this.saveFlowResult(userId, session.currentFlow!, {
        ...session.context.data,
        ...finalData
      })
    }
    
    return await this.updateSession(userId, {
      state: 'idle',
      currentFlow: null,
      context: {},
      expiresAt: null
    })
  }
  
  // セッション期限切れチェック
  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date()
    
    for (const [userId, session] of this.sessions.entries()) {
      if (session.expiresAt && session.expiresAt < now) {
        await this.updateSession(userId, {
          state: 'idle',
          currentFlow: null,
          context: {},
          expiresAt: null
        })
        
        // 期限切れ通知
        await this.sendSessionExpiredNotification(userId)
      }
    }
  }
  
  private createNewSession(userId: string): UserSession {
    return {
      userId,
      state: 'idle',
      context: {},
      currentFlow: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: null
    }
  }
  
  private async saveFlowResult(userId: string, flowType: string, data: any): Promise<void> {
    await this.database.lineFlowResult.create({
      data: {
        userId,
        flowType,
        resultData: JSON.stringify(data),
        completedAt: new Date()
      }
    })
  }
  
  private async sendSessionExpiredNotification(userId: string): Promise<void> {
    const client = new LineClient()
    await client.pushMessage(userId, {
      type: 'text',
      text: 'セッションが期限切れになりました。新しい操作を開始してください。'
    })
  }
}
```

---

## ソーシャルアナリティクス

### 統合ソーシャルダッシュボード

```typescript
// ソーシャルアナリティクス ダッシュボード
class SocialAnalyticsDashboard {
  private twitterService: TwitterAPIService
  private instagramService: InstagramService
  private discordService: DiscordMetricsService
  private lineService: LINEAnalyticsService
  
  // 統合ダッシュボードデータ取得
  async getDashboardData(period: AnalyticsPeriod = '7d'): Promise<SocialDashboardData> {
    const [twitterData, instagramData, discordData, lineData] = await Promise.all([
      this.getTwitterAnalytics(period),
      this.getInstagramAnalytics(period),
      this.getDiscordAnalytics(period),
      this.getLINEAnalytics(period)
    ])
    
    return {
      period,
      generatedAt: new Date(),
      platforms: {
        twitter: twitterData,
        instagram: instagramData,
        discord: discordData,
        line: lineData
      },
      summary: this.calculateSummaryMetrics({
        twitter: twitterData,
        instagram: instagramData,
        discord: discordData,
        line: lineData
      }),
      insights: await this.generateInsights({
        twitter: twitterData,
        instagram: instagramData,
        discord: discordData,
        line: lineData
      })
    }
  }
  
  // Twitter分析データ
  private async getTwitterAnalytics(period: string): Promise<TwitterAnalytics> {
    const user = await this.twitterService.getUserAnalytics('your_username')
    
    return {
      profile: {
        username: user.user.username,
        displayName: user.user.name,
        followersCount: user.user.public_metrics.followers_count,
        followingCount: user.user.public_metrics.following_count,
        tweetCount: user.user.public_metrics.tweet_count,
        verificationStatus: user.user.verified
      },
      engagement: {
        totalTweets: user.tweets.length,
        totalLikes: user.tweets.reduce((sum, tweet) => sum + tweet.public_metrics.like_count, 0),
        totalRetweets: user.tweets.reduce((sum, tweet) => sum + tweet.public_metrics.retweet_count, 0),
        totalReplies: user.tweets.reduce((sum, tweet) => sum + tweet.public_metrics.reply_count, 0),
        avgEngagementRate: user.metrics.avgEngagement
      },
      topPerformingContent: {
        tweet: user.metrics.topPerformingTweet,
        engagementScore: this.calculateEngagementScore(user.metrics.topPerformingTweet)
      },
      growth: {
        followerGrowth: user.metrics.followerGrowth,
        engagementTrend: user.metrics.engagementTrend
      }
    }
  }
  
  // Instagram分析データ
  private async getInstagramAnalytics(period: string): Promise<InstagramAnalytics> {
    const profile = await this.instagramService.getUserProfile('user_id')
    const media = await this.instagramService.getUserMedia('user_id')
    
    const totalLikes = media.reduce((sum, item) => sum + (item.metrics?.likes || 0), 0)
    const totalComments = media.reduce((sum, item) => sum + (item.metrics?.comments || 0), 0)
    
    return {
      profile: {
        username: profile.username,
        mediaCount: profile.mediaCount,
        accountType: profile.accountType
      },
      content: {
        totalPosts: media.length,
        avgLikesPerPost: media.length > 0 ? totalLikes / media.length : 0,
        avgCommentsPerPost: media.length > 0 ? totalComments / media.length : 0,
        topPerformingPost: media.reduce((prev, current) => 
          (prev.metrics?.likes || 0) > (current.metrics?.likes || 0) ? prev : current
        )
      },
      engagement: {
        totalEngagement: totalLikes + totalComments,
        engagementRate: this.calculateInstagramEngagementRate(media),
        contentTypes: this.analyzeContentTypes(media)
      }
    }
  }
  
  // Discord分析データ
  private async getDiscordAnalytics(period: string): Promise<DiscordAnalytics> {
    const serverId = 'your_server_id'
    const metrics = await this.discordService.collectServerMetrics(serverId)
    const activity = await this.discordService.analyzeMessageActivity(serverId, 7)
    const engagement = await this.discordService.calculateEngagementScore(serverId)
    
    return {
      server: {
        name: metrics.serverName,
        memberCount: metrics.memberCount,
        onlineMembers: metrics.onlineMembers,
        boostLevel: metrics.boostLevel
      },
      activity: {
        totalMessages: activity.totalMessages,
        dailyAverage: activity.dailyAverage,
        activeUsers: activity.topUsers.length,
        channelUtilization: activity.channelActivity.length
      },
      engagement: {
        score: engagement.score,
        factors: engagement.factors
      },
      growth: {
        memberGrowth: await this.calculateMemberGrowth(serverId, period),
        activityTrend: await this.calculateActivityTrend(serverId, period)
      }
    }
  }
  
  // LINE分析データ
  private async getLINEAnalytics(period: string): Promise<LINEAnalytics> {
    const stats = await this.lineService.getBotStatistics(period)
    
    return {
      users: {
        totalUsers: stats.totalUsers,
        activeUsers: stats.activeUsers,
        newUsers: stats.newUsers
      },
      messages: {
        totalMessages: stats.totalMessages,
        botMessages: stats.botMessages,
        userMessages: stats.userMessages,
        avgResponseTime: stats.avgResponseTime
      },
      features: {
        taskCreations: stats.taskCreations,
        appointmentBookings: stats.appointmentBookings,
        aiInteractions: stats.aiInteractions
      },
      engagement: {
        dailyActiveUsers: stats.dailyActiveUsers,
        retention: stats.userRetention,
        satisfaction: stats.userSatisfaction
      }
    }
  }
  
  // サマリーメトリクス計算
  private calculateSummaryMetrics(platformData: any): SummaryMetrics {
    const totalFollowers = (platformData.twitter?.profile?.followersCount || 0) +
                          (platformData.discord?.server?.memberCount || 0) +
                          (platformData.line?.users?.totalUsers || 0)
    
    const totalEngagement = (platformData.twitter?.engagement?.totalLikes || 0) +
                           (platformData.instagram?.content?.totalPosts || 0) +
                           (platformData.discord?.activity?.totalMessages || 0) +
                           (platformData.line?.messages?.totalMessages || 0)
    
    return {
      totalReach: totalFollowers,
      totalEngagement,
      avgEngagementRate: this.calculateOverallEngagementRate(platformData),
      topPerformingPlatform: this.identifyTopPlatform(platformData),
      growthRate: this.calculateOverallGrowthRate(platformData)
    }
  }
  
  // インサイト生成
  private async generateInsights(platformData: any): Promise<SocialInsight[]> {
    const insights: SocialInsight[] = []
    
    // Twitter インサイト
    if (platformData.twitter) {
      const twitterInsight = this.generateTwitterInsights(platformData.twitter)
      insights.push(...twitterInsight)
    }
    
    // Instagram インサイト
    if (platformData.instagram) {
      const instagramInsight = this.generateInstagramInsights(platformData.instagram)
      insights.push(...instagramInsight)
    }
    
    // Discord インサイト
    if (platformData.discord) {
      const discordInsight = this.generateDiscordInsights(platformData.discord)
      insights.push(...discordInsight)
    }
    
    // LINE インサイト
    if (platformData.line) {
      const lineInsight = this.generateLINEInsights(platformData.line)
      insights.push(...lineInsight)
    }
    
    // クロスプラットフォーム インサイト
    const crossPlatformInsights = this.generateCrossPlatformInsights(platformData)
    insights.push(...crossPlatformInsights)
    
    return insights.sort((a, b) => b.priority - a.priority)
  }
  
  private generateTwitterInsights(data: TwitterAnalytics): SocialInsight[] {
    const insights: SocialInsight[] = []
    
    if (data.engagement.avgEngagementRate > 0.05) {
      insights.push({
        type: 'positive',
        platform: 'twitter',
        title: '高いエンゲージメント率',
        description: `Twitterのエンゲージメント率が${(data.engagement.avgEngagementRate * 100).toFixed(1)}%と業界平均を上回っています`,
        priority: 8,
        actionable: true,
        recommendation: 'この調子で質の高いコンテンツを継続してください'
      })
    }
    
    if (data.growth.followerGrowth < 0) {
      insights.push({
        type: 'warning',
        platform: 'twitter',
        title: 'フォロワー数減少',
        description: `フォロワー数が${Math.abs(data.growth.followerGrowth)}人減少しています`,
        priority: 9,
        actionable: true,
        recommendation: 'コンテンツ戦略の見直しとエンゲージメント向上施策を検討してください'
      })
    }
    
    return insights
  }
  
  private generateDiscordInsights(data: DiscordAnalytics): SocialInsight[] {
    const insights: SocialInsight[] = []
    
    if (data.engagement.score > 70) {
      insights.push({
        type: 'positive',
        platform: 'discord',
        title: '活発なコミュニティ',
        description: `Discordサーバーのエンゲージメントスコアが${data.engagement.score}点と高水準です`,
        priority: 7,
        actionable: false,
        recommendation: 'コミュニティの活性度を維持するため、定期的なイベントを企画してください'
      })
    }
    
    const onlineRatio = data.server.onlineMembers / data.server.memberCount
    if (onlineRatio < 0.1) {
      insights.push({
        type: 'warning',
        platform: 'discord',
        title: 'オンライン率低下',
        description: `オンラインメンバー比率が${(onlineRatio * 100).toFixed(1)}%と低くなっています`,
        priority: 6,
        actionable: true,
        recommendation: 'メンバーの参加を促すコンテンツやイベントを企画してください'
      })
    }
    
    return insights
  }
}
```

---

## Webhook統合管理

### 統合Webhook管理システム

```typescript
// Webhook統合管理システム
class WebhookIntegrationManager {
  private validators: Map<string, WebhookValidator>
  private processors: Map<string, WebhookProcessor>
  private monitor: WebhookMonitor
  
  constructor() {
    this.validators = new Map()
    this.processors = new Map()
    this.monitor = new WebhookMonitor()
    
    this.initializeWebhooks()
  }
  
  // Webhook初期化
  private initializeWebhooks(): void {
    // LINE Webhook
    this.validators.set('line', new LINEWebhookValidator())
    this.processors.set('line', new LINEWebhookProcessor())
    
    // Discord Webhook
    this.validators.set('discord', new DiscordWebhookValidator())
    this.processors.set('discord', new DiscordWebhookProcessor())
    
    // Google Apps Script Webhook
    this.validators.set('gas', new GASWebhookValidator())
    this.processors.set('gas', new GASWebhookProcessor())
    
    // Generic Webhook
    this.validators.set('generic', new GenericWebhookValidator())
    this.processors.set('generic', new GenericWebhookProcessor())
  }
  
  // 統合Webhook処理
  async processWebhook(request: Request, source: string): Promise<Response> {
    const startTime = Date.now()
    
    try {
      // 監視開始
      await this.monitor.recordWebhookStart(source, request)
      
      // バリデーション
      const validator = this.validators.get(source)
      if (!validator) {
        throw new Error(`Unknown webhook source: ${source}`)
      }
      
      const isValid = await validator.validate(request)
      if (!isValid) {
        await this.monitor.recordWebhookError(source, 'validation_failed')
        return new Response('Unauthorized', { status: 401 })
      }
      
      // 処理実行
      const processor = this.processors.get(source)
      if (!processor) {
        throw new Error(`No processor for source: ${source}`)
      }
      
      const result = await processor.process(request)
      
      // 監視記録
      await this.monitor.recordWebhookSuccess(source, Date.now() - startTime)
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
      
    } catch (error) {
      await this.monitor.recordWebhookError(source, error.message)
      console.error(`Webhook processing error for ${source}:`, error)
      
      return new Response('Internal Server Error', { status: 500 })
    }
  }
  
  // Webhook統計取得
  async getWebhookStatistics(period: string = '24h'): Promise<WebhookStatistics> {
    return await this.monitor.getStatistics(period)
  }
  
  // Webhook健全性チェック
  async performHealthCheck(): Promise<WebhookHealthStatus> {
    const sources = Array.from(this.validators.keys())
    const healthChecks = await Promise.all(
      sources.map(async (source) => ({
        source,
        status: await this.checkSourceHealth(source)
      }))
    )
    
    return {
      overall: healthChecks.every(check => check.status.healthy) ? 'healthy' : 'degraded',
      sources: healthChecks,
      checkedAt: new Date()
    }
  }
  
  private async checkSourceHealth(source: string): Promise<SourceHealthStatus> {
    const recent = await this.monitor.getRecentActivity(source, '1h')
    
    return {
      healthy: recent.errorRate < 0.05, // エラー率5%未満
      errorRate: recent.errorRate,
      avgResponseTime: recent.avgResponseTime,
      requestCount: recent.requestCount,
      lastRequest: recent.lastRequest
    }
  }
}
```

### Webhook監視システム

```typescript
// Webhook監視・分析システム
class WebhookMonitor {
  private database: PrismaClient
  private metrics: Map<string, WebhookMetrics>
  
  constructor() {
    this.database = new PrismaClient()
    this.metrics = new Map()
  }
  
  // Webhook開始記録
  async recordWebhookStart(source: string, request: Request): Promise<void> {
    const metrics = this.getOrCreateMetrics(source)
    metrics.totalRequests++
    metrics.lastRequest = new Date()
    
    // データベース記録
    await this.database.webhookLog.create({
      data: {
        source,
        method: request.method,
        url: request.url,
        headers: JSON.stringify(Object.fromEntries(request.headers.entries())),
        startTime: new Date(),
        status: 'processing'
      }
    })
  }
  
  // Webhook成功記録
  async recordWebhookSuccess(source: string, processingTime: number): Promise<void> {
    const metrics = this.getOrCreateMetrics(source)
    metrics.successCount++
    metrics.totalProcessingTime += processingTime
    metrics.avgProcessingTime = metrics.totalProcessingTime / metrics.successCount
    
    // パフォーマンス追跡
    if (processingTime > metrics.maxProcessingTime) {
      metrics.maxProcessingTime = processingTime
    }
    
    // データベース更新
    await this.database.webhookLog.updateMany({
      where: {
        source,
        status: 'processing',
        startTime: {
          gte: new Date(Date.now() - 5000) // 5秒以内の処理中レコード
        }
      },
      data: {
        status: 'success',
        endTime: new Date(),
        processingTime
      }
    })
  }
  
  // Webhook エラー記録
  async recordWebhookError(source: string, error: string): Promise<void> {
    const metrics = this.getOrCreateMetrics(source)
    metrics.errorCount++
    metrics.lastError = new Date()
    
    // エラー率計算
    metrics.errorRate = metrics.errorCount / metrics.totalRequests
    
    // データベース記録
    await this.database.webhookLog.updateMany({
      where: {
        source,
        status: 'processing'
      },
      data: {
        status: 'error',
        endTime: new Date(),
        error
      }
    })
    
    // 高エラー率アラート
    if (metrics.errorRate > 0.1) { // 10%以上
      await this.sendHighErrorRateAlert(source, metrics.errorRate)
    }
  }
  
  // 統計情報取得
  async getStatistics(period: string): Promise<WebhookStatistics> {
    const periodDate = this.parsePeriod(period)
    
    const logs = await this.database.webhookLog.findMany({
      where: {
        startTime: {
          gte: periodDate
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    })
    
    const bySource = logs.reduce((acc, log) => {
      if (!acc[log.source]) {
        acc[log.source] = {
          source: log.source,
          totalRequests: 0,
          successCount: 0,
          errorCount: 0,
          avgProcessingTime: 0,
          totalProcessingTime: 0
        }
      }
      
      const sourceStats = acc[log.source]
      sourceStats.totalRequests++
      
      if (log.status === 'success') {
        sourceStats.successCount++
        sourceStats.totalProcessingTime += log.processingTime || 0
      } else if (log.status === 'error') {
        sourceStats.errorCount++
      }
      
      return acc
    }, {} as Record<string, any>)
    
    // 平均処理時間計算
    Object.values(bySource).forEach((stats: any) => {
      if (stats.successCount > 0) {
        stats.avgProcessingTime = stats.totalProcessingTime / stats.successCount
      }
      stats.errorRate = stats.errorCount / stats.totalRequests
      stats.successRate = stats.successCount / stats.totalRequests
    })
    
    return {
      period,
      totalRequests: logs.length,
      totalSuccess: logs.filter(log => log.status === 'success').length,
      totalErrors: logs.filter(log => log.status === 'error').length,
      overallErrorRate: logs.filter(log => log.status === 'error').length / logs.length,
      bySource: Object.values(bySource),
      generatedAt: new Date()
    }
  }
  
  // リアルタイムアクティビティ取得
  async getRecentActivity(source: string, period: string = '1h'): Promise<RecentActivity> {
    const periodDate = this.parsePeriod(period)
    
    const recentLogs = await this.database.webhookLog.findMany({
      where: {
        source,
        startTime: {
          gte: periodDate
        }
      }
    })
    
    const successCount = recentLogs.filter(log => log.status === 'success').length
    const errorCount = recentLogs.filter(log => log.status === 'error').length
    const totalProcessingTime = recentLogs
      .filter(log => log.processingTime)
      .reduce((sum, log) => sum + (log.processingTime || 0), 0)
    
    return {
      source,
      period,
      requestCount: recentLogs.length,
      successCount,
      errorCount,
      errorRate: recentLogs.length > 0 ? errorCount / recentLogs.length : 0,
      avgResponseTime: successCount > 0 ? totalProcessingTime / successCount : 0,
      lastRequest: recentLogs.length > 0 ? recentLogs[0].startTime : null
    }
  }
  
  // 異常検知
  async detectAnomalies(): Promise<WebhookAnomaly[]> {
    const anomalies: WebhookAnomaly[] = []
    
    for (const [source, metrics] of this.metrics.entries()) {
      // 高エラー率検知
      if (metrics.errorRate > 0.05) {
        anomalies.push({
          source,
          type: 'high_error_rate',
          severity: metrics.errorRate > 0.2 ? 'critical' : 'warning',
          description: `${source}のエラー率が${(metrics.errorRate * 100).toFixed(1)}%です`,
          detectedAt: new Date(),
          value: metrics.errorRate
        })
      }
      
      // 応答時間悪化検知
      if (metrics.avgProcessingTime > 5000) { // 5秒以上
        anomalies.push({
          source,
          type: 'slow_response',
          severity: metrics.avgProcessingTime > 10000 ? 'critical' : 'warning',
          description: `${source}の平均応答時間が${metrics.avgProcessingTime}msです`,
          detectedAt: new Date(),
          value: metrics.avgProcessingTime
        })
      }
    }
    
    return anomalies
  }
  
  private getOrCreateMetrics(source: string): WebhookMetrics {
    if (!this.metrics.has(source)) {
      this.metrics.set(source, {
        source,
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        errorRate: 0,
        totalProcessingTime: 0,
        avgProcessingTime: 0,
        maxProcessingTime: 0,
        lastRequest: null,
        lastError: null
      })
    }
    return this.metrics.get(source)!
  }
  
  private parsePeriod(period: string): Date {
    const now = new Date()
    const match = period.match(/^(\d+)([hmd])$/)
    
    if (!match) {
      throw new Error(`Invalid period format: ${period}`)
    }
    
    const value = parseInt(match[1])
    const unit = match[2]
    
    switch (unit) {
      case 'h':
        return new Date(now.getTime() - value * 60 * 60 * 1000)
      case 'd':
        return new Date(now.getTime() - value * 24 * 60 * 60 * 1000)
      case 'm':
        return new Date(now.getTime() - value * 60 * 1000)
      default:
        throw new Error(`Unsupported time unit: ${unit}`)
    }
  }
  
  private async sendHighErrorRateAlert(source: string, errorRate: number): Promise<void> {
    // LINE通知
    const lineClient = new LineClient()
    await lineClient.sendAdminNotification({
      type: 'webhook_alert',
      title: 'Webhook高エラー率アラート',
      message: `${source}のエラー率が${(errorRate * 100).toFixed(1)}%に達しました`,
      urgency: 'high'
    })
    
    // Discord通知
    const discordClient = new DiscordClient()
    await discordClient.sendAdminAlert({
      title: 'Webhook Error Alert',
      description: `High error rate detected for ${source}: ${(errorRate * 100).toFixed(1)}%`,
      color: 'red'
    })
  }
}
```

---

## 外部API統合

### API統合基盤システム

```typescript
// 外部API統合管理システム
class ExternalAPIIntegration {
  private clients: Map<string, APIClient>
  private rateLimiters: Map<string, RateLimiter>
  private cache: APICache
  private monitor: APIMonitor
  
  constructor() {
    this.clients = new Map()
    this.rateLimiters = new Map()
    this.cache = new APICache()
    this.monitor = new APIMonitor()
    
    this.initializeAPIs()
  }
  
  // API初期化
  private initializeAPIs(): void {
    // Twitter API
    this.clients.set('twitter', new TwitterAPIClient({
      bearerToken: process.env.TWITTER_BEARER_TOKEN!,
      baseURL: 'https://api.twitter.com/2'
    }))
    this.rateLimiters.set('twitter', new TwitterRateLimiter())
    
    // Instagram API
    this.clients.set('instagram', new InstagramAPIClient({
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN!,
      baseURL: 'https://graph.instagram.com'
    }))
    this.rateLimiters.set('instagram', new InstagramRateLimiter())
    
    // Google APIs
    this.clients.set('google', new GoogleAPIClient({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS!),
      scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    }))
    this.rateLimiters.set('google', new GoogleRateLimiter())
    
    // Discord API
    this.clients.set('discord', new DiscordAPIClient({
      token: process.env.DISCORD_BOT_TOKEN!,
      baseURL: 'https://discord.com/api/v10'
    }))
    this.rateLimiters.set('discord', new DiscordRateLimiter())
  }
  
  // 統合API呼び出し
  async callAPI<T>(
    service: string, 
    endpoint: string, 
    options: APICallOptions = {}
  ): Promise<APIResponse<T>> {
    const startTime = Date.now()
    
    try {
      // レート制限チェック
      const rateLimiter = this.rateLimiters.get(service)
      if (rateLimiter) {
        await rateLimiter.checkLimit(endpoint)
      }
      
      // キャッシュチェック
      const cacheKey = this.generateCacheKey(service, endpoint, options)
      const cachedResponse = await this.cache.get<T>(cacheKey)
      if (cachedResponse && !options.bypassCache) {
        await this.monitor.recordCacheHit(service, endpoint)
        return cachedResponse
      }
      
      // API呼び出し
      const client = this.clients.get(service)
      if (!client) {
        throw new Error(`Unknown API service: ${service}`)
      }
      
      const response = await client.call<T>(endpoint, options)
      
      // レスポンス処理
      const processedResponse: APIResponse<T> = {
        data: response.data,
        status: response.status,
        headers: response.headers,
        metadata: {
          service,
          endpoint,
          calledAt: new Date(),
          responseTime: Date.now() - startTime,
          cached: false
        }
      }
      
      // キャッシュ保存
      if (response.status === 200 && options.cacheTTL) {
        await this.cache.set(cacheKey, processedResponse, options.cacheTTL)
      }
      
      // 監視記録
      await this.monitor.recordAPICall(service, endpoint, Date.now() - startTime, response.status)
      
      return processedResponse
      
    } catch (error) {
      await this.monitor.recordAPIError(service, endpoint, error.message)
      throw new APIError(`API call failed for ${service}/${endpoint}: ${error.message}`, error)
    }
  }
  
  // バッチAPI呼び出し
  async batchAPICall<T>(
    calls: BatchAPICall[]
  ): Promise<BatchAPIResponse<T>[]> {
    const results = await Promise.allSettled(
      calls.map(call => 
        this.callAPI<T>(call.service, call.endpoint, call.options)
      )
    )
    
    return results.map((result, index) => ({
      call: calls[index],
      success: result.status === 'fulfilled',
      response: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }))
  }
  
  // API健全性チェック
  async performHealthCheck(): Promise<APIHealthStatus> {
    const services = Array.from(this.clients.keys())
    const healthChecks = await Promise.all(
      services.map(async (service) => ({
        service,
        status: await this.checkServiceHealth(service)
      }))
    )
    
    return {
      overall: healthChecks.every(check => check.status.healthy) ? 'healthy' : 'degraded',
      services: healthChecks,
      checkedAt: new Date()
    }
  }
  
  // サービス固有健全性チェック
  private async checkServiceHealth(service: string): Promise<ServiceHealthStatus> {
    try {
      const healthEndpoint = this.getHealthEndpoint(service)
      const response = await this.callAPI(service, healthEndpoint, { 
        timeout: 5000,
        bypassCache: true 
      })
      
      const recentStats = await this.monitor.getRecentStats(service, '1h')
      
      return {
        healthy: response.status === 200 && recentStats.errorRate < 0.05,
        status: response.status,
        errorRate: recentStats.errorRate,
        avgResponseTime: recentStats.avgResponseTime,
        lastCheck: new Date()
      }
      
    } catch (error) {
      return {
        healthy: false,
        status: 0,
        errorRate: 1.0,
        avgResponseTime: 0,
        lastCheck: new Date(),
        error: error.message
      }
    }
  }
  
  // キャッシュキー生成
  private generateCacheKey(service: string, endpoint: string, options: APICallOptions): string {
    const keyData = {
      service,
      endpoint,
      params: options.params || {},
      headers: options.headers || {}
    }
    
    return `api:${service}:${btoa(JSON.stringify(keyData))}`
  }
  
  // ヘルスチェックエンドポイント取得
  private getHealthEndpoint(service: string): string {
    const healthEndpoints: Record<string, string> = {
      twitter: '/2/tweets/search/recent?query=test&max_results=10',
      instagram: '/me?fields=id,username',
      google: '/analytics/v3/management/accounts',
      discord: '/applications/@me'
    }
    
    return healthEndpoints[service] || '/health'
  }
  
  // API使用量統計
  async getUsageStatistics(period: string = '24h'): Promise<APIUsageStatistics> {
    return await this.monitor.getUsageStatistics(period)
  }
  
  // レート制限情報取得
  async getRateLimitInfo(): Promise<RateLimitInfo[]> {
    const services = Array.from(this.rateLimiters.keys())
    
    return await Promise.all(
      services.map(async (service) => {
        const limiter = this.rateLimiters.get(service)!
        return {
          service,
          limits: await limiter.getCurrentLimits(),
          resetTime: await limiter.getResetTime()
        }
      })
    )
  }
}
```

### Google Apps Script連携

```typescript
// Google Apps Script 統合システム
class GoogleAppsScriptIntegration {
  private scriptId: string
  private authClient: GoogleAuth
  
  constructor() {
    this.scriptId = process.env.GOOGLE_SCRIPT_ID!
    this.authClient = new GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!,
      scopes: ['https://www.googleapis.com/auth/script.projects']
    })
  }
  
  // GAS関数実行
  async executeFunction(
    functionName: string, 
    parameters: any[] = []
  ): Promise<GASExecutionResult> {
    try {
      const scriptService = google.script({ version: 'v1', auth: this.authClient })
      
      const request = {
        scriptId: this.scriptId,
        resource: {
          function: functionName,
          parameters,
          devMode: process.env.NODE_ENV === 'development'
        }
      }
      
      const response = await scriptService.scripts.run(request)
      
      if (response.data.error) {
        throw new Error(`GAS execution error: ${response.data.error.details}`)
      }
      
      return {
        success: true,
        result: response.data.response?.result,
        executionTime: Date.now(), // 実際の実行時間は取得できないため現在時刻
        logs: response.data.response?.logs || []
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now()
      }
    }
  }
  
  // Googleドキュメント同期
  async syncGoogleDocs(): Promise<DocumentSyncResult> {
    const result = await this.executeFunction('syncDocuments', [])
    
    if (!result.success) {
      throw new Error(`Document sync failed: ${result.error}`)
    }
    
    return {
      syncedCount: result.result.syncedCount,
      updatedCount: result.result.updatedCount,
      errorCount: result.result.errorCount,
      lastSync: new Date()
    }
  }
  
  // スプレッドシート データ取得
  async getSpreadsheetData(
    spreadsheetId: string, 
    range: string
  ): Promise<SpreadsheetData> {
    const result = await this.executeFunction('getSpreadsheetData', [
      spreadsheetId,
      range
    ])
    
    if (!result.success) {
      throw new Error(`Spreadsheet data fetch failed: ${result.error}`)
    }
    
    return {
      values: result.result.values,
      range: result.result.range,
      majorDimension: result.result.majorDimension || 'ROWS',
      retrievedAt: new Date()
    }
  }
  
  // データエクスポート
  async exportToGoogleSheets(
    data: ExportData,
    sheetConfig: SheetConfig
  ): Promise<ExportResult> {
    const result = await this.executeFunction('exportData', [
      data,
      sheetConfig
    ])
    
    if (!result.success) {
      throw new Error(`Data export failed: ${result.error}`)
    }
    
    return {
      spreadsheetId: result.result.spreadsheetId,
      sheetId: result.result.sheetId,
      exportedRows: result.result.exportedRows,
      exportUrl: result.result.exportUrl,
      exportedAt: new Date()
    }
  }
  
  // 定期実行タスク設定
  async setupScheduledTask(
    functionName: string,
    schedule: ScheduleConfig
  ): Promise<ScheduleResult> {
    const result = await this.executeFunction('setupSchedule', [
      functionName,
      schedule
    ])
    
    if (!result.success) {
      throw new Error(`Schedule setup failed: ${result.error}`)
    }
    
    return {
      triggerId: result.result.triggerId,
      nextExecution: new Date(result.result.nextExecution),
      schedule: schedule,
      setupAt: new Date()
    }
  }
}
```

---

## リアルタイム通知システム

### 統合通知配信システム

```typescript
// リアルタイム通知統合システム
class RealTimeNotificationSystem {
  private channels: Map<string, NotificationChannel>
  private queue: NotificationQueue
  private router: NotificationRouter
  private monitor: NotificationMonitor
  
  constructor() {
    this.channels = new Map()
    this.queue = new NotificationQueue()
    this.router = new NotificationRouter()
    this.monitor = new NotificationMonitor()
    
    this.initializeChannels()
  }
  
  // 通知チャンネル初期化
  private initializeChannels(): void {
    // LINE通知チャンネル
    this.channels.set('line', new LINENotificationChannel({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!
    }))
    
    // Discord通知チャンネル
    this.channels.set('discord', new DiscordNotificationChannel({
      webhookUrl: process.env.DISCORD_WEBHOOK_URL!
    }))
    
    // メール通知チャンネル
    this.channels.set('email', new EmailNotificationChannel({
      smtpConfig: {
        host: process.env.SMTP_HOST!,
        port: parseInt(process.env.SMTP_PORT!),
        secure: true,
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!
        }
      }
    }))
    
    // ブラウザプッシュ通知
    this.channels.set('push', new PushNotificationChannel({
      vapidKeys: {
        publicKey: process.env.VAPID_PUBLIC_KEY!,
        privateKey: process.env.VAPID_PRIVATE_KEY!
      }
    }))
  }
  
  // 通知送信（マルチチャンネル）
  async sendNotification(notification: UnifiedNotification): Promise<NotificationResult> {
    const startTime = Date.now()
    
    try {
      // 通知ルーティング
      const routing = await this.router.determineRouting(notification)
      
      // 優先度別処理
      if (notification.priority === 'urgent') {
        return await this.sendUrgentNotification(notification, routing)
      } else {
        return await this.sendStandardNotification(notification, routing)
      }
      
    } catch (error) {
      await this.monitor.recordNotificationError(notification.id, error.message)
      throw error
    } finally {
      await this.monitor.recordNotificationAttempt(
        notification.id, 
        Date.now() - startTime
      )
    }
  }
  
  // 緊急通知送信
  private async sendUrgentNotification(
    notification: UnifiedNotification,
    routing: NotificationRouting
  ): Promise<NotificationResult> {
    // 全チャンネル並列送信
    const promises = routing.channels.map(async (channelConfig) => {
      const channel = this.channels.get(channelConfig.type)
      if (!channel) {
        throw new Error(`Unknown channel type: ${channelConfig.type}`)
      }
      
      return await channel.sendUrgent(notification, channelConfig.config)
    })
    
    const results = await Promise.allSettled(promises)
    
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    return {
      notificationId: notification.id,
      totalChannels: routing.channels.length,
      successful,
      failed,
      results: results.map((result, index) => ({
        channel: routing.channels[index].type,
        success: result.status === 'fulfilled',
        error: result.status === 'rejected' ? result.reason.message : null
      })),
      sentAt: new Date()
    }
  }
  
  // 標準通知送信
  private async sendStandardNotification(
    notification: UnifiedNotification,
    routing: NotificationRouting
  ): Promise<NotificationResult> {
    // キューに追加して順次処理
    const queuedNotification: QueuedNotification = {
      ...notification,
      routing,
      queuedAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    }
    
    await this.queue.enqueue(queuedNotification)
    
    return {
      notificationId: notification.id,
      status: 'queued',
      queuedAt: new Date()
    }
  }
  
  // イベントベース通知トリガー
  async handleSystemEvent(event: SystemEvent): Promise<void> {
    const notifications = await this.generateNotificationsFromEvent(event)
    
    await Promise.all(
      notifications.map(notification => this.sendNotification(notification))
    )
  }
  
  // イベント→通知変換
  private async generateNotificationsFromEvent(event: SystemEvent): Promise<UnifiedNotification[]> {
    const notifications: UnifiedNotification[] = []
    
    switch (event.type) {
      case 'task_overdue':
        notifications.push({
          id: generateNotificationId(),
          type: 'task_alert',
          title: 'タスク期限超過',
          message: `タスク「${event.data.taskTitle}」の期限が過ぎています`,
          priority: 'high',
          recipients: [event.data.assigneeId],
          data: event.data,
          createdAt: new Date()
        })
        break
        
      case 'new_appointment':
        notifications.push({
          id: generateNotificationId(),
          type: 'appointment_reminder',
          title: '新しいアポイントメント',
          message: `${event.data.clientName}とのアポイントメントが設定されました`,
          priority: 'medium',
          recipients: [event.data.assigneeId],
          data: event.data,
          createdAt: new Date()
        })
        break
        
      case 'system_error':
        notifications.push({
          id: generateNotificationId(),
          type: 'system_alert',
          title: 'システムエラー',
          message: `システムでエラーが発生しました: ${event.data.error}`,
          priority: 'urgent',
          recipients: ['admin'],
          data: event.data,
          createdAt: new Date()
        })
        break
        
      case 'discord_new_member':
        notifications.push({
          id: generateNotificationId(),
          type: 'community_update',
          title: 'Discord新メンバー',
          message: `${event.data.serverName}に新しいメンバーが参加しました`,
          priority: 'low',
          recipients: ['moderators'],
          data: event.data,
          createdAt: new Date()
        })
        break
    }
    
    return notifications
  }
  
  // リアルタイム配信状況監視
  async getDeliveryStatus(): Promise<DeliveryStatus> {
    const queueStatus = await this.queue.getStatus()
    const channelStatus = await this.getChannelStatus()
    
    return {
      queue: {
        pending: queueStatus.pending,
        processing: queueStatus.processing,
        failed: queueStatus.failed
      },
      channels: channelStatus,
      lastUpdate: new Date()
    }
  }
  
  // チャンネル別配信状況
  private async getChannelStatus(): Promise<ChannelStatus[]> {
    const statuses = await Promise.all(
      Array.from(this.channels.entries()).map(async ([type, channel]) => {
        const health = await channel.checkHealth()
        const recent = await this.monitor.getRecentDeliveryStats(type, '1h')
        
        return {
          type,
          healthy: health.healthy,
          deliveryRate: recent.successRate,
          avgDeliveryTime: recent.avgDeliveryTime,
          errorCount: recent.errorCount,
          lastDelivery: recent.lastDelivery
        }
      })
    )
    
    return statuses
  }
  
  // 配信失敗通知の再試行
  async retryFailedNotifications(): Promise<RetryResult> {
    const failedNotifications = await this.queue.getFailedNotifications()
    let retryCount = 0
    let successCount = 0
    
    for (const notification of failedNotifications) {
      if (notification.attempts < notification.maxAttempts) {
        try {
          await this.sendNotification(notification)
          successCount++
        } catch (error) {
          notification.attempts++
          await this.queue.updateNotification(notification)
        }
        retryCount++
      }
    }
    
    return {
      totalFailed: failedNotifications.length,
      retryAttempts: retryCount,
      successful: successCount,
      retriedAt: new Date()
    }
  }
}
```

### 通知配信キューシステム

```typescript
// 通知配信キューシステム
class NotificationQueue {
  private queue: PriorityQueue<QueuedNotification>
  private processing: Set<string>
  private database: PrismaClient
  private worker: NotificationWorker
  
  constructor() {
    this.queue = new PriorityQueue<QueuedNotification>((a, b) => {
      // 優先度による並び替え
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    
    this.processing = new Set()
    this.database = new PrismaClient()
    this.worker = new NotificationWorker()
    
    this.startWorker()
  }
  
  // 通知をキューに追加
  async enqueue(notification: QueuedNotification): Promise<void> {
    // データベースに永続化
    await this.database.notificationQueue.create({
      data: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        recipients: JSON.stringify(notification.recipients),
        data: JSON.stringify(notification.data),
        routing: JSON.stringify(notification.routing),
        queuedAt: notification.queuedAt,
        attempts: notification.attempts,
        maxAttempts: notification.maxAttempts,
        status: 'queued'
      }
    })
    
    // メモリキューに追加
    this.queue.enqueue(notification)
    
    console.log(`Notification ${notification.id} queued with priority ${notification.priority}`)
  }
  
  // 次の通知を取得
  async dequeue(): Promise<QueuedNotification | null> {
    const notification = this.queue.dequeue()
    
    if (notification) {
      this.processing.add(notification.id)
      
      // ステータス更新
      await this.database.notificationQueue.update({
        where: { id: notification.id },
        data: { status: 'processing', processedAt: new Date() }
      })
    }
    
    return notification
  }
  
  // 処理完了
  async markCompleted(notificationId: string, success: boolean, error?: string): Promise<void> {
    this.processing.delete(notificationId)
    
    await this.database.notificationQueue.update({
      where: { id: notificationId },
      data: {
        status: success ? 'completed' : 'failed',
        completedAt: success ? new Date() : null,
        error: error || null
      }
    })
  }
  
  // 失敗通知の再キュー
  async requeueFailed(notificationId: string): Promise<void> {
    const dbNotification = await this.database.notificationQueue.findUnique({
      where: { id: notificationId }
    })
    
    if (!dbNotification || dbNotification.attempts >= dbNotification.maxAttempts) {
      return
    }
    
    const notification: QueuedNotification = {
      id: dbNotification.id,
      type: dbNotification.type,
      title: dbNotification.title,
      message: dbNotification.message,
      priority: dbNotification.priority as NotificationPriority,
      recipients: JSON.parse(dbNotification.recipients),
      data: JSON.parse(dbNotification.data || '{}'),
      routing: JSON.parse(dbNotification.routing),
      queuedAt: new Date(),
      attempts: dbNotification.attempts + 1,
      maxAttempts: dbNotification.maxAttempts
    }
    
    await this.enqueue(notification)
  }
  
  // キュー状況取得
  async getStatus(): Promise<QueueStatus> {
    const [pending, processing, failed] = await Promise.all([
      this.database.notificationQueue.count({ where: { status: 'queued' } }),
      this.database.notificationQueue.count({ where: { status: 'processing' } }),
      this.database.notificationQueue.count({ where: { status: 'failed' } })
    ])
    
    return {
      pending,
      processing,
      failed,
      memoryQueueSize: this.queue.size,
      activeProcessing: this.processing.size
    }
  }
  
  // 失敗通知取得
  async getFailedNotifications(): Promise<QueuedNotification[]> {
    const failedRecords = await this.database.notificationQueue.findMany({
      where: { 
        status: 'failed',
        attempts: { lt: this.database.notificationQueue.fields.maxAttempts }
      },
      orderBy: { queuedAt: 'asc' }
    })
    
    return failedRecords.map(record => ({
      id: record.id,
      type: record.type,
      title: record.title,
      message: record.message,
      priority: record.priority as NotificationPriority,
      recipients: JSON.parse(record.recipients),
      data: JSON.parse(record.data || '{}'),
      routing: JSON.parse(record.routing),
      queuedAt: record.queuedAt,
      attempts: record.attempts,
      maxAttempts: record.maxAttempts
    }))
  }
  
  // ワーカー開始
  private startWorker(): void {
    setInterval(async () => {
      try {
        const notification = await this.dequeue()
        if (notification) {
          await this.worker.processNotification(notification)
        }
      } catch (error) {
        console.error('Notification worker error:', error)
      }
    }, 1000) // 1秒間隔で処理
  }
  
  // 通知更新
  async updateNotification(notification: QueuedNotification): Promise<void> {
    await this.database.notificationQueue.update({
      where: { id: notification.id },
      data: {
        attempts: notification.attempts,
        status: notification.attempts >= notification.maxAttempts ? 'failed' : 'queued'
      }
    })
  }
}
```

---

## トラブルシューティング

### 一般的な問題と解決策

#### Twitter API関連

**問題**: レート制限エラー
```typescript
// 解決策: レート制限チェックと待機
const rateLimitManager = new TwitterRateLimitManager()

try {
  await rateLimitManager.checkLimit('users/by/username')
  const user = await twitterAPI.getUser(username)
} catch (error) {
  if (error.code === 429) {
    const waitTime = await rateLimitManager.getWaitTime('users/by/username')
    await new Promise(resolve => setTimeout(resolve, waitTime))
    // 再試行
  }
}
```

**問題**: 認証エラー
```typescript
// 解決策: Bearer Token検証
const validateTwitterToken = async () => {
  try {
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: { 'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}` }
    })
    
    if (response.status === 401) {
      throw new Error('Invalid Twitter Bearer Token')
    }
    
    return true
  } catch (error) {
    console.error('Twitter authentication failed:', error)
    return false
  }
}
```

#### LINE Bot関連

**問題**: Webhook署名検証失敗
```typescript
// 解決策: 正しい署名検証実装
const validateLineSignature = (body: string, signature: string): boolean => {
  const channelSecret = process.env.LINE_CHANNEL_SECRET!
  const expectedSignature = crypto
    .createHmac('sha256', channelSecret)
    .update(body, 'utf8')
    .digest('base64')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  )
}
```

**問題**: メッセージ送信失敗
```typescript
// 解決策: エラーハンドリングと再試行
const sendLineMessage = async (replyToken: string, messages: any[]) => {
  const maxRetries = 3
  let attempt = 0
  
  while (attempt < maxRetries) {
    try {
      const response = await lineClient.replyMessage(replyToken, messages)
      return response
    } catch (error) {
      attempt++
      console.error(`LINE message send attempt ${attempt} failed:`, error)
      
      if (attempt >= maxRetries) {
        throw error
      }
      
      // 指数バックオフで待機
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
}
```

#### Discord連携関連

**問題**: Discord API接続エラー
```typescript
// 解決策: 接続状態監視と再接続
class DiscordConnectionManager {
  private client: DiscordClient
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  async connect(): Promise<void> {
    try {
      await this.client.login(process.env.DISCORD_BOT_TOKEN)
      this.reconnectAttempts = 0
    } catch (error) {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        const delay = Math.pow(2, this.reconnectAttempts) * 1000
        setTimeout(() => this.connect(), delay)
      } else {
        throw new Error('Discord connection failed after maximum attempts')
      }
    }
  }
}
```

#### Instagram API関連

**問題**: アクセストークン期限切れ
```typescript
// 解決策: トークン自動更新
class InstagramTokenManager {
  async refreshLongLivedToken(token: string): Promise<string> {
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
    )
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Token refresh failed: ${data.error.message}`)
    }
    
    // 新しいトークンを保存
    await this.saveToken(data.access_token, data.expires_in)
    
    return data.access_token
  }
}
```

### パフォーマンス最適化

#### キャッシュ戦略
```typescript
// マルチレベルキャッシュシステム
class MultiLevelCache {
  private memoryCache = new Map<string, CacheEntry>()
  private redisClient: RedisClient
  
  async get<T>(key: string): Promise<T | null> {
    // L1: メモリキャッシュ
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data as T
    }
    
    // L2: Redis キャッシュ
    const redisData = await this.redisClient.get(key)
    if (redisData) {
      const parsed = JSON.parse(redisData)
      // メモリキャッシュにも保存
      this.memoryCache.set(key, {
        data: parsed,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5分
      })
      return parsed as T
    }
    
    return null
  }
}
```

#### バッチ処理最適化
```typescript
// 効率的なバッチAPI処理
class BatchProcessor {
  async processSocialMediaBatch(
    accounts: SocialAccount[]
  ): Promise<BatchResult[]> {
    const batchSize = 5
    const results: BatchResult[] = []
    
    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (account) => {
        try {
          const data = await this.fetchAccountData(account)
          return { account: account.id, success: true, data }
        } catch (error) {
          return { account: account.id, success: false, error: error.message }
        }
      })
      
      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults.map(r => 
        r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }
      ))
      
      // レート制限回避のための待機
      if (i + batchSize < accounts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }
}
```

### 監視とアラート

#### システム監視設定
```typescript
// 包括的システム監視
class IntegrationMonitor {
  async checkSystemHealth(): Promise<HealthReport> {
    const checks = await Promise.all([
      this.checkTwitterAPI(),
      this.checkInstagramAPI(),
      this.checkDiscordConnection(),
      this.checkLINEBot(),
      this.checkDatabaseConnection(),
      this.checkCachePerformance()
    ])
    
    const failedChecks = checks.filter(check => !check.healthy)
    
    if (failedChecks.length > 0) {
      await this.sendHealthAlert(failedChecks)
    }
    
    return {
      overall: failedChecks.length === 0 ? 'healthy' : 'degraded',
      checks,
      checkedAt: new Date()
    }
  }
  
  private async sendHealthAlert(failedChecks: HealthCheck[]): Promise<void> {
    const alertMessage = `システムヘルスチェックで問題を検出:\n${
      failedChecks.map(check => `- ${check.service}: ${check.error}`).join('\n')
    }`
    
    // 複数チャンネルに緊急アラート送信
    await Promise.all([
      this.lineNotifier.sendAdminAlert(alertMessage),
      this.discordNotifier.sendSystemAlert(alertMessage),
      this.emailNotifier.sendCriticalAlert(alertMessage)
    ])
  }
}
```

---

## まとめ

このソーシャル・外部連携システムマニュアルでは、FIND to DO Management Appの包括的な外部プラットフォーム統合機能について詳細に説明しました。

### 主要実装機能
- **Twitter API v2完全統合**: ユーザー分析、エンゲージメント追跡、レート制限管理
- **Instagram連携**: Basic Display & Graph API対応、ビジネスアカウント分析
- **Discord統合分析**: サーバーメトリクス、エンゲージメントスコア、通知ブリッジ
- **LINE Bot完全版**: AI自動処理、セッション管理、営業特化機能
- **統合ダッシュボード**: クロスプラットフォーム分析、リアルタイム監視
- **高度なWebhook管理**: 統合処理、監視、エラーハンドリング

### 技術的特徴
- レート制限対応キャッシュシステム
- マルチレベル通知配信
- リアルタイム監視とアラート
- バッチ処理最適化
- 包括的エラーハンドリング

このシステムにより、複数のソーシャルプラットフォームからの情報を統合し、効率的なタスク管理とコミュニケーション自動化を実現しています。各API の制限事項を考慮した設計により、安定した長期運用を可能にしています。
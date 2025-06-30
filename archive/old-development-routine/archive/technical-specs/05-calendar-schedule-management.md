# カレンダー・スケジュール管理システム マニュアル

## 概要

FIND to DO Management Appのカレンダー・スケジュール管理システムは、統合カレンダー機能、高度なドラッグ&ドロップ操作、繰り返しルール設定、外部連携機能を提供する包括的なスケジュール管理ソリューションです。

## 目次

1. [統合カレンダー機能](#統合カレンダー機能)
2. [ドラッグ&ドロップ機能](#ドラッグドロップ機能)
3. [繰り返しルール設定](#繰り返しルール設定)
4. [外部カレンダー連携](#外部カレンダー連携)
5. [スケジュール最適化](#スケジュール最適化)
6. [通知・リマインダー](#通知リマインダー)
7. [トラブルシューティング](#トラブルシューティング)

---

## 統合カレンダー機能

### 1.1 カレンダービュー

システムは3つの主要ビューを提供します：

| ビュー | 説明 | 用途 | 特徴 |
|--------|------|------|------|
| **月表示** | 月単位の概要表示 | 全体の予定把握 | 密度の高い情報表示 |
| **週表示** | 週単位の詳細表示 | 日常的なスケジュール管理 | 時間軸での詳細管理 |
| **日表示** | 日単位の詳細表示 | 当日の詳細スケジュール | 分単位の精密管理 |

```javascript
// カレンダービューコンポーネント
const CalendarView = {
  // 月表示の実装
  MonthView: ({ events, currentDate, onEventClick, onDateClick }) => {
    const monthData = generateMonthData(currentDate)
    const eventsByDate = groupEventsByDate(events)
    
    return (
      <div className="calendar-month-view">
        {monthData.weeks.map(week => (
          <div key={week.id} className="calendar-week">
            {week.days.map(day => (
              <CalendarDay
                key={day.date}
                date={day.date}
                events={eventsByDate[day.date] || []}
                isToday={isToday(day.date)}
                isCurrentMonth={day.isCurrentMonth}
                onClick={() => onDateClick(day.date)}
                onEventClick={onEventClick}
              />
            ))}
          </div>
        ))}
      </div>
    )
  },
  
  // 週表示の実装
  WeekView: ({ events, currentWeek, timeSlots, onTimeSlotClick }) => {
    const weekDays = generateWeekDays(currentWeek)
    const eventsByDay = groupEventsByDay(events, weekDays)
    
    return (
      <div className="calendar-week-view">
        <div className="time-slots">
          {timeSlots.map(slot => (
            <div key={slot.time} className="time-slot">
              <span className="time-label">{slot.time}</span>
              {weekDays.map(day => (
                <TimeSlot
                  key={`${day}-${slot.time}`}
                  date={day}
                  time={slot.time}
                  events={getEventsForTimeSlot(eventsByDay[day], slot)}
                  onClick={() => onTimeSlotClick(day, slot.time)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }
}
```

### 1.2 イベント統合管理

```javascript
// 異なるソースからのイベント統合
const EventIntegrator = {
  // 複数ソースからのイベント統合
  integrateEvents: async (userId, sources = ['internal', 'google', 'outlook']) => {
    const allEvents = []
    
    for (const source of sources) {
      try {
        const events = await fetchEventsFromSource(source, userId)
        const normalizedEvents = events.map(event => normalizeEvent(event, source))
        allEvents.push(...normalizedEvents)
      } catch (error) {
        console.warn(`Failed to fetch events from ${source}:`, error)
      }
    }
    
    // 重複イベントの検出と統合
    const deduplicatedEvents = removeDuplicateEvents(allEvents)
    
    // 競合検出
    const conflicts = detectEventConflicts(deduplicatedEvents)
    
    return {
      events: deduplicatedEvents,
      conflicts,
      sources: sources.map(source => ({
        name: source,
        status: getSourceStatus(source),
        lastSync: getLastSyncTime(source)
      }))
    }
  },
  
  // イベント正規化
  normalizeEvent: (rawEvent, source) => {
    const baseEvent = {
      id: generateEventId(rawEvent.id, source),
      title: rawEvent.title || rawEvent.summary,
      description: rawEvent.description || rawEvent.body,
      startTime: new Date(rawEvent.start || rawEvent.startTime),
      endTime: new Date(rawEvent.end || rawEvent.endTime),
      source,
      originalId: rawEvent.id,
      lastModified: new Date(rawEvent.lastModified || rawEvent.updated)
    }
    
    // ソース固有の拡張プロパティ
    switch (source) {
      case 'google':
        return {
          ...baseEvent,
          location: rawEvent.location,
          attendees: rawEvent.attendees || [],
          hangoutLink: rawEvent.hangoutLink
        }
      case 'outlook':
        return {
          ...baseEvent,
          location: rawEvent.location?.displayName,
          attendees: rawEvent.attendees?.map(a => a.emailAddress) || [],
          onlineMeeting: rawEvent.onlineMeeting
        }
      default:
        return baseEvent
    }
  }
}
```

### 1.3 イベント分類システム

```javascript
// AI による自動イベント分類
const EventClassifier = {
  // イベントの自動分類
  classifyEvent: async (event) => {
    const classification = await callAI({
      model: 'event-classifier',
      input: {
        title: event.title,
        description: event.description,
        attendees: event.attendees,
        location: event.location,
        duration: event.endTime - event.startTime,
        timeOfDay: event.startTime.getHours()
      }
    })
    
    return {
      category: classification.category, // MEETING, TASK, PERSONAL, etc.
      priority: classification.priority, // HIGH, MEDIUM, LOW
      type: classification.type, // WORK, PERSONAL, HEALTH, etc.
      tags: classification.suggestedTags,
      color: getCategoryColor(classification.category),
      icon: getCategoryIcon(classification.category)
    }
  },
  
  // カテゴリ別の表示設定
  categorySettings: {
    MEETING: {
      color: '#3B82F6', // Blue
      icon: '👥',
      defaultDuration: 60, // minutes
      bufferTime: 5 // minutes before/after
    },
    TASK: {
      color: '#10B981', // Green
      icon: '✅',
      defaultDuration: 120,
      bufferTime: 0
    },
    PERSONAL: {
      color: '#8B5CF6', // Purple
      icon: '🏠',
      defaultDuration: 60,
      bufferTime: 10
    },
    HEALTH: {
      color: '#F59E0B', // Yellow
      icon: '🏥',
      defaultDuration: 30,
      bufferTime: 15
    }
  }
}
```

---

## ドラッグ&ドロップ機能

### 2.1 高度なドラッグ&ドロップ実装

```javascript
// 包括的なドラッグ&ドロップシステム
const DragDropSystem = {
  // ドラッグ&ドロップ初期化
  initializeDragDrop: () => {
    const dragDropConfig = {
      // イベントの移動
      moveEvent: {
        onDragStart: (event, dragData) => {
          // ドラッグ開始時の処理
          showDragPreview(event)
          highlightDropZones(event.category)
          storeOriginalPosition(event.id, dragData.originalPosition)
        },
        
        onDragOver: (dropZone, dragData) => {
          // ドロップ可能性の検証
          const canDrop = validateDropZone(dragData.event, dropZone)
          if (canDrop.valid) {
            showDropIndicator(dropZone, dragData.event)
            showConflictWarnings(canDrop.conflicts)
          }
          return canDrop.valid
        },
        
        onDrop: async (dropZone, dragData) => {
          const newDateTime = calculateNewDateTime(dropZone, dragData)
          const conflicts = await checkTimeConflicts(dragData.event.id, newDateTime)
          
          if (conflicts.length > 0) {
            const resolution = await promptConflictResolution(conflicts)
            if (resolution.cancelled) {
              revertToOriginalPosition(dragData.event.id)
              return
            }
            await resolveConflicts(conflicts, resolution.strategy)
          }
          
          await updateEventDateTime(dragData.event.id, newDateTime)
          logEventMove(dragData.event.id, dragData.originalPosition, newDateTime)
        }
      },
      
      // イベントのサイズ変更
      resizeEvent: {
        onResizeStart: (event, handle) => {
          showResizeGuides(event)
          storeOriginalDuration(event.id)
        },
        
        onResize: (event, newDuration) => {
          const conflicts = checkDurationConflicts(event, newDuration)
          if (conflicts.length > 0) {
            showResizeWarnings(conflicts)
          }
          updateEventPreview(event.id, newDuration)
        },
        
        onResizeEnd: async (event, finalDuration) => {
          await updateEventDuration(event.id, finalDuration)
          hideResizeGuides()
          logEventResize(event.id, finalDuration)
        }
      }
    }
    
    return dragDropConfig
  },
  
  // 複数イベントの一括移動
  bulkMoveEvents: async (eventIds, targetDate, targetTime) => {
    const events = await getEventsByIds(eventIds)
    const moveOperations = []
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      const newStartTime = new Date(targetDate)
      newStartTime.setHours(targetTime.hours + (i * event.duration / 60))
      
      moveOperations.push({
        eventId: event.id,
        originalTime: event.startTime,
        newStartTime,
        newEndTime: new Date(newStartTime.getTime() + event.duration * 60000)
      })
    }
    
    // 競合チェック
    const allConflicts = await checkBulkMoveConflicts(moveOperations)
    
    if (allConflicts.length > 0) {
      const resolution = await promptBulkConflictResolution(allConflicts)
      if (resolution.cancelled) return false
      
      await resolveBulkConflicts(allConflicts, resolution)
    }
    
    // 一括移動実行
    await executeBulkMove(moveOperations)
    return true
  }
}
```

### 2.2 スマート配置システム

```javascript
// AI による最適な時間配置
const SmartScheduling = {
  // 最適な時間枠の提案
  suggestOptimalTime: async (eventRequest) => {
    const constraints = {
      duration: eventRequest.duration,
      preferences: eventRequest.preferences || {},
      attendees: eventRequest.attendees || [],
      category: eventRequest.category,
      priority: eventRequest.priority
    }
    
    const availableSlots = await findAvailableTimeSlots(constraints)
    const scoredSlots = await scoreTimeSlots(availableSlots, constraints)
    
    return {
      recommendedSlots: scoredSlots.slice(0, 3),
      reasoning: generateSchedulingReasoning(scoredSlots[0]),
      alternatives: scoredSlots.slice(3, 6),
      conflicts: await identifyPotentialConflicts(scoredSlots[0])
    }
  },
  
  // 時間枠のスコアリング
  scoreTimeSlots: async (slots, constraints) => {
    const scoredSlots = []
    
    for (const slot of slots) {
      const score = await calculateSlotScore(slot, constraints)
      scoredSlots.push({
        ...slot,
        score: score.totalScore,
        factors: score.factors
      })
    }
    
    return scoredSlots.sort((a, b) => b.score - a.score)
  },
  
  // スコア計算アルゴリズム
  calculateSlotScore: async (slot, constraints) => {
    const factors = {
      // 時間帯の適性（朝型・夜型など）
      timePreference: calculateTimePreferenceScore(slot.startTime, constraints.preferences),
      
      // 他のイベントとの間隔
      bufferTime: calculateBufferScore(slot, constraints.duration),
      
      // 参加者の都合
      attendeeAvailability: await calculateAttendeeScore(slot, constraints.attendees),
      
      // カテゴリ別の最適性
      categoryFit: calculateCategoryScore(slot, constraints.category),
      
      // 優先度の考慮
      priorityWeight: calculatePriorityWeight(constraints.priority),
      
      // エネルギーレベル
      energyLevel: calculateEnergyScore(slot.startTime, constraints.category)
    }
    
    const weights = {
      timePreference: 0.25,
      bufferTime: 0.20,
      attendeeAvailability: 0.25,
      categoryFit: 0.15,
      priorityWeight: 0.10,
      energyLevel: 0.05
    }
    
    const totalScore = Object.entries(factors)
      .reduce((sum, [factor, score]) => sum + (score * weights[factor]), 0)
    
    return { totalScore, factors }
  }
}
```

---

## 繰り返しルール設定

### 3.1 高度な繰り返しパターン

```javascript
// 包括的な繰り返しルール管理
const RecurrenceManager = {
  // 繰り返しパターンの定義
  patterns: {
    DAILY: {
      name: '毎日',
      generate: (startDate, interval = 1, count = null, until = null) => {
        const dates = []
        let currentDate = new Date(startDate)
        let iteration = 0
        
        while (
          (count === null || iteration < count) &&
          (until === null || currentDate <= until)
        ) {
          dates.push(new Date(currentDate))
          currentDate.setDate(currentDate.getDate() + interval)
          iteration++
        }
        
        return dates
      }
    },
    
    WEEKLY: {
      name: '毎週',
      generate: (startDate, interval = 1, daysOfWeek = null, count = null, until = null) => {
        const dates = []
        let currentDate = new Date(startDate)
        let iteration = 0
        
        while (
          (count === null || iteration < count) &&
          (until === null || currentDate <= until)
        ) {
          if (daysOfWeek === null || daysOfWeek.includes(currentDate.getDay())) {
            dates.push(new Date(currentDate))
            iteration++
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }
        
        return dates
      }
    },
    
    MONTHLY: {
      name: '毎月',
      generate: (startDate, interval = 1, dayOfMonth = null, weekOfMonth = null, dayOfWeek = null) => {
        // 複雑な月次繰り返しロジック
        const dates = []
        let currentDate = new Date(startDate)
        
        // 月の特定日（例：毎月15日）
        if (dayOfMonth !== null) {
          return generateMonthlyByDay(startDate, interval, dayOfMonth)
        }
        
        // 月の特定週の特定曜日（例：第2火曜日）
        if (weekOfMonth !== null && dayOfWeek !== null) {
          return generateMonthlyByWeekDay(startDate, interval, weekOfMonth, dayOfWeek)
        }
        
        return dates
      }
    },
    
    CUSTOM: {
      name: 'カスタム',
      generate: (startDate, customRule) => {
        // カスタムルールの解析と実行
        return parseAndExecuteCustomRule(startDate, customRule)
      }
    }
  },
  
  // 繰り返しイベントの作成
  createRecurringEvent: async (eventData, recurrenceRule) => {
    const baseEvent = await createEvent(eventData)
    const occurrenceDates = RecurrenceManager.patterns[recurrenceRule.pattern]
      .generate(eventData.startTime, ...recurrenceRule.parameters)
    
    const occurrences = []
    
    for (const date of occurrenceDates) {
      const occurrence = {
        ...eventData,
        id: generateOccurrenceId(baseEvent.id, date),
        parentEventId: baseEvent.id,
        startTime: date,
        endTime: new Date(date.getTime() + (eventData.endTime - eventData.startTime)),
        isRecurring: true,
        recurrenceRule
      }
      
      occurrences.push(occurrence)
    }
    
    await saveEventOccurrences(occurrences)
    
    return {
      baseEvent,
      occurrences,
      totalCount: occurrences.length
    }
  }
}
```

### 3.2 例外処理システム

```javascript
// 繰り返しイベントの例外管理
const RecurrenceExceptionManager = {
  // 単発の変更
  modifyOccurrence: async (occurrenceId, changes) => {
    const occurrence = await getEventOccurrence(occurrenceId)
    
    if (changes.timeChange) {
      // 時間変更の例外
      await createTimeException(occurrence, changes.newTime)
    }
    
    if (changes.dataChange) {
      // データ変更の例外
      await createDataException(occurrence, changes.newData)
    }
    
    if (changes.cancellation) {
      // キャンセル例外
      await createCancellationException(occurrence)
    }
    
    // 例外の記録
    await recordRecurrenceException({
      parentEventId: occurrence.parentEventId,
      occurrenceDate: occurrence.startTime,
      exceptionType: determineExceptionType(changes),
      changes,
      timestamp: new Date()
    })
  },
  
  // 以降すべての変更
  modifyFutureOccurrences: async (fromOccurrenceId, changes) => {
    const fromOccurrence = await getEventOccurrence(fromOccurrenceId)
    const futureOccurrences = await getFutureOccurrences(fromOccurrence)
    
    // バッチ更新
    await batchUpdateOccurrences(futureOccurrences, changes)
    
    // 新しい繰り返しルールの作成
    if (changes.recurrenceChange) {
      await splitRecurrenceSeries(fromOccurrence, changes.newRecurrenceRule)
    }
  },
  
  // 繰り返し系列の分割
  splitRecurrenceSeries: async (splitPoint, newRule) => {
    const originalSeries = await getRecurrenceSeries(splitPoint.parentEventId)
    
    // 元の系列の終了
    await endRecurrenceSeries(originalSeries.id, splitPoint.startTime)
    
    // 新しい系列の開始
    const newSeries = await createRecurrenceSeries({
      ...originalSeries,
      startDate: splitPoint.startTime,
      recurrenceRule: newRule
    })
    
    return newSeries
  }
}
```

---

## 外部カレンダー連携

### 4.1 Google Calendar連携

```javascript
// Google Calendar との同期
const GoogleCalendarSync = {
  // 認証設定
  authenticate: async (userId) => {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar']
    })
    
    return authUrl
  },
  
  // イベント同期
  syncEvents: async (userId, direction = 'bidirectional') => {
    const credentials = await getUserGoogleCredentials(userId)
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials(credentials)
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    
    if (direction === 'import' || direction === 'bidirectional') {
      await importFromGoogle(calendar, userId)
    }
    
    if (direction === 'export' || direction === 'bidirectional') {
      await exportToGoogle(calendar, userId)
    }
    
    await updateLastSyncTime(userId, 'google', new Date())
  },
  
  // Googleからのインポート
  importFromGoogle: async (calendar, userId) => {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime'
    })
    
    const googleEvents = response.data.items
    
    for (const googleEvent of googleEvents) {
      const existingEvent = await findEventByGoogleId(googleEvent.id)
      
      if (existingEvent) {
        // 更新チェック
        if (new Date(googleEvent.updated) > existingEvent.lastModified) {
          await updateEventFromGoogle(existingEvent.id, googleEvent)
        }
      } else {
        // 新規作成
        await createEventFromGoogle(googleEvent, userId)
      }
    }
  },
  
  // Googleへのエクスポート
  exportToGoogle: async (calendar, userId) => {
    const localEvents = await getModifiedLocalEvents(userId)
    
    for (const localEvent of localEvents) {
      if (localEvent.googleId) {
        // 既存イベントの更新
        await calendar.events.update({
          calendarId: 'primary',
          eventId: localEvent.googleId,
          resource: convertToGoogleEvent(localEvent)
        })
      } else {
        // 新規イベントの作成
        const response = await calendar.events.insert({
          calendarId: 'primary',
          resource: convertToGoogleEvent(localEvent)
        })
        
        // Google IDの保存
        await updateLocalEvent(localEvent.id, {
          googleId: response.data.id
        })
      }
    }
  }
}
```

### 4.2 Outlook Calendar連携

```javascript
// Microsoft Outlook との同期
const OutlookCalendarSync = {
  // Microsoft Graph API認証
  authenticate: async (userId) => {
    const clientApp = msal.ConfidentialClientApplication({
      auth: {
        clientId: process.env.OUTLOOK_CLIENT_ID,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
        authority: process.env.OUTLOOK_AUTHORITY
      }
    })
    
    const authCodeUrlParameters = {
      scopes: ['https://graph.microsoft.com/calendars.readwrite'],
      redirectUri: process.env.OUTLOOK_REDIRECT_URI
    }
    
    return await clientApp.getAuthCodeUrl(authCodeUrlParameters)
  },
  
  // Graph API を使用したイベント同期
  syncEvents: async (userId, accessToken) => {
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken)
      }
    })
    
    // Outlookからのイベント取得
    const events = await graphClient
      .api('/me/events')
      .select('id,subject,body,start,end,location,attendees,isRecurring,recurrence')
      .top(1000)
      .get()
    
    for (const outlookEvent of events.value) {
      await processOutlookEvent(outlookEvent, userId)
    }
    
    // ローカルイベントのOutlookへの同期
    await syncLocalEventsToOutlook(graphClient, userId)
  },
  
  // Webhookによるリアルタイム同期
  setupWebhook: async (userId, accessToken) => {
    const subscription = {
      changeType: 'created,updated,deleted',
      notificationUrl: `${process.env.BASE_URL}/api/webhooks/outlook`,
      resource: '/me/events',
      expirationDateTime: new Date(Date.now() + 4230 * 60 * 1000) // 約3日
    }
    
    const graphClient = Client.init({
      authProvider: (done) => done(null, accessToken)
    })
    
    const response = await graphClient
      .api('/subscriptions')
      .post(subscription)
    
    // サブスクリプション情報の保存
    await saveWebhookSubscription(userId, 'outlook', response)
    
    return response
  }
}
```

### 4.3 CalDAV/CardDAV連携

```javascript
// 標準的なCalDAV連携
const CalDAVSync = {
  // CalDAVサーバーとの接続
  connect: async (serverConfig) => {
    const dav = new DAVClient({
      serverUrl: serverConfig.url,
      credentials: {
        username: serverConfig.username,
        password: serverConfig.password
      }
    })
    
    await dav.login()
    return dav
  },
  
  // カレンダー一覧の取得
  getCalendars: async (davClient) => {
    const calendars = await davClient.fetchCalendars()
    
    return calendars.map(cal => ({
      id: cal.url,
      name: cal.displayName,
      description: cal.description,
      color: cal.calendarColor,
      timezone: cal.timezone
    }))
  },
  
  // イベントの同期
  syncCalDAVEvents: async (davClient, calendarUrl) => {
    const events = await davClient.fetchCalendarObjects({
      calendar: { url: calendarUrl }
    })
    
    for (const event of events) {
      const icalData = event.calendarData
      const parsedEvent = parseICalEvent(icalData)
      
      await upsertCalDAVEvent(parsedEvent, event.url)
    }
  },
  
  // iCalデータの解析
  parseICalEvent: (icalData) => {
    const parsed = ICAL.parse(icalData)
    const comp = new ICAL.Component(parsed)
    const vevent = comp.getFirstSubcomponent('vevent')
    
    return {
      uid: vevent.getFirstPropertyValue('uid'),
      summary: vevent.getFirstPropertyValue('summary'),
      description: vevent.getFirstPropertyValue('description'),
      dtstart: vevent.getFirstPropertyValue('dtstart').toJSDate(),
      dtend: vevent.getFirstPropertyValue('dtend').toJSDate(),
      location: vevent.getFirstPropertyValue('location'),
      rrule: vevent.getFirstPropertyValue('rrule')
    }
  }
}
```

---

## スケジュール最適化

### 5.1 AI駆動の時間最適化

```javascript
// AI による包括的なスケジュール最適化
const ScheduleOptimizer = {
  // 日次スケジュール最適化
  optimizeDailySchedule: async (userId, date) => {
    const userProfile = await getUserScheduleProfile(userId)
    const events = await getDayEvents(userId, date)
    const preferences = userProfile.preferences
    
    const optimization = await callAI({
      model: 'schedule-optimizer',
      input: {
        events,
        preferences,
        constraints: userProfile.constraints,
        energyPattern: userProfile.energyPattern,
        productivityPeaks: userProfile.productivityPeaks
      }
    })
    
    return {
      optimizedSchedule: optimization.rearrangedEvents,
      improvements: optimization.identifiedImprovements,
      efficiencyGain: optimization.projectedEfficiencyGain,
      recommendations: optimization.schedulingRecommendations
    }
  },
  
  // 週間スケジュール最適化
  optimizeWeeklySchedule: async (userId, weekStart) => {
    const weekEvents = await getWeekEvents(userId, weekStart)
    const workloadAnalysis = await analyzeWorkload(weekEvents)
    
    if (workloadAnalysis.isOverloaded) {
      return await redistributeWorkload(weekEvents, workloadAnalysis)
    }
    
    const optimization = await callAI({
      model: 'weekly-scheduler',
      input: {
        weekEvents,
        workloadMetrics: workloadAnalysis,
        recurringObligations: await getRecurringObligations(userId),
        deadlines: await getUpcomingDeadlines(userId),
        goals: await getUserGoals(userId)
      }
    })
    
    return optimization
  },
  
  // 自動時間ブロッキング
  autoTimeBlocking: async (userId, tasks, duration = 'week') => {
    const availableSlots = await findAvailableTimeSlots(userId, duration)
    const taskPriorities = await calculateTaskPriorities(tasks)
    const userPreferences = await getUserPreferences(userId)
    
    const blocking = await callAI({
      model: 'time-blocker',
      input: {
        tasks: taskPriorities,
        availableSlots,
        preferences: userPreferences,
        constraints: await getSchedulingConstraints(userId)
      }
    })
    
    const timeBlocks = blocking.suggestedBlocks.map(block => ({
      taskId: block.taskId,
      startTime: block.startTime,
      endTime: block.endTime,
      bufferTime: block.recommendedBuffer,
      flexibility: block.flexibilityScore
    }))
    
    return {
      timeBlocks,
      unscheduledTasks: blocking.unschedulableTasks,
      efficiencyScore: blocking.overallEfficiency,
      conflicts: blocking.potentialConflicts
    }
  }
}
```

### 5.2 負荷分散アルゴリズム

```javascript
// 作業負荷の均等分散
const WorkloadBalancer = {
  // 負荷分析
  analyzeWorkload: (events, period = 'week') => {
    const workloadByDay = {}
    const workloadByHour = {}
    
    for (const event of events) {
      const dayKey = event.startTime.toDateString()
      const hourKey = event.startTime.getHours()
      
      // 日次負荷
      if (!workloadByDay[dayKey]) {
        workloadByDay[dayKey] = 0
      }
      workloadByDay[dayKey] += event.duration || 60
      
      // 時間別負荷
      if (!workloadByHour[hourKey]) {
        workloadByHour[hourKey] = 0
      }
      workloadByHour[hourKey] += event.duration || 60
    }
    
    return {
      totalWorkload: Object.values(workloadByDay).reduce((sum, load) => sum + load, 0),
      dailyDistribution: workloadByDay,
      hourlyDistribution: workloadByHour,
      peakDay: findPeakDay(workloadByDay),
      peakHour: findPeakHour(workloadByHour),
      balanceScore: calculateBalanceScore(workloadByDay)
    }
  },
  
  // 負荷再分散の提案
  rebalanceWorkload: async (events, maxDailyLoad = 480) => { // 8時間
    const analysis = WorkloadBalancer.analyzeWorkload(events)
    const overloadedDays = Object.entries(analysis.dailyDistribution)
      .filter(([day, load]) => load > maxDailyLoad)
    
    if (overloadedDays.length === 0) {
      return { balanced: true, events }
    }
    
    const rebalancingPlan = []
    
    for (const [overloadedDay, load] of overloadedDays) {
      const excessLoad = load - maxDailyLoad
      const flexibleEvents = events.filter(e => 
        e.startTime.toDateString() === overloadedDay && 
        e.flexible === true
      )
      
      let redistributedLoad = 0
      for (const event of flexibleEvents) {
        if (redistributedLoad >= excessLoad) break
        
        const alternativeDays = await findAlternativeDays(event, analysis)
        if (alternativeDays.length > 0) {
          rebalancingPlan.push({
            eventId: event.id,
            currentDay: overloadedDay,
            suggestedDay: alternativeDays[0],
            reason: 'Load balancing'
          })
          redistributedLoad += event.duration
        }
      }
    }
    
    return {
      balanced: false,
      rebalancingPlan,
      projectedBalance: calculateProjectedBalance(events, rebalancingPlan)
    }
  }
}
```

---

## 通知・リマインダー

### 6.1 インテリジェント通知システム

```javascript
// AI 駆動の通知システム
const NotificationSystem = {
  // 通知タイミングの最適化
  optimizeNotificationTiming: async (event, userId) => {
    const userProfile = await getUserNotificationProfile(userId)
    const eventImportance = await calculateEventImportance(event)
    
    const timing = await callAI({
      model: 'notification-optimizer',
      input: {
        event,
        userProfile,
        importance: eventImportance,
        currentContext: await getCurrentUserContext(userId),
        historicalResponse: await getNotificationResponseHistory(userId)
      }
    })
    
    return {
      optimalTiming: timing.recommendedTimes,
      channels: timing.preferredChannels,
      urgency: timing.urgencyLevel,
      customMessage: timing.personalizedMessage
    }
  },
  
  // 多段階リマインダー
  setupTieredReminders: async (event, userId) => {
    const importance = await calculateEventImportance(event)
    const userPrefs = await getUserReminderPreferences(userId)
    
    const reminderTiers = []
    
    // 重要度に基づく段階設定
    switch (importance.level) {
      case 'CRITICAL':
        reminderTiers.push(
          { timing: '1week', channel: 'email', message: 'advance_notice' },
          { timing: '1day', channel: 'push', message: 'final_reminder' },
          { timing: '1hour', channel: 'push', message: 'urgent_reminder' },
          { timing: '15min', channel: 'push', message: 'immediate_reminder' }
        )
        break
      case 'HIGH':
        reminderTiers.push(
          { timing: '1day', channel: 'push', message: 'day_before' },
          { timing: '1hour', channel: 'push', message: 'hour_before' },
          { timing: '15min', channel: 'push', message: 'final_reminder' }
        )
        break
      case 'MEDIUM':
        reminderTiers.push(
          { timing: '1day', channel: 'push', message: 'day_before' },
          { timing: '30min', channel: 'push', message: 'final_reminder' }
        )
        break
      default:
        reminderTiers.push(
          { timing: '1hour', channel: 'push', message: 'hour_before' }
        )
    }
    
    // ユーザー設定による調整
    const customizedReminders = reminderTiers.map(tier => ({
      ...tier,
      channel: userPrefs.preferredChannels.includes(tier.channel) ? 
        tier.channel : userPrefs.preferredChannels[0],
      message: personalizeMessage(tier.message, event, userId)
    }))
    
    return await scheduleReminders(event.id, customizedReminders)
  },
  
  // コンテキスト認識通知
  sendContextAwareNotification: async (notification, userId) => {
    const currentContext = await getCurrentUserContext(userId)
    
    // 現在の状況を考慮した通知の調整
    if (currentContext.inMeeting) {
      // 会議中は緊急度の高いもののみ
      if (notification.urgency < 4) {
        await postponeNotification(notification, '30min')
        return
      }
    }
    
    if (currentContext.doNotDisturb) {
      // 邪魔しないモード
      await queueNotificationForLater(notification)
      return
    }
    
    if (currentContext.lowBattery && notification.channel === 'push') {
      // バッテリー低下時はSMSに切り替え
      notification.channel = 'sms'
    }
    
    await deliverNotification(notification, userId)
  }
}
```

### 6.2 マルチチャネル通知

```javascript
// 複数チャネルでの通知配信
const MultiChannelNotifier = {
  // 利用可能チャネル
  channels: {
    PUSH: {
      handler: async (message, userId) => {
        const devices = await getUserDevices(userId)
        for (const device of devices) {
          await sendPushNotification(device.token, message)
        }
      },
      reliability: 0.85,
      latency: 'immediate'
    },
    
    EMAIL: {
      handler: async (message, userId) => {
        const user = await getUser(userId)
        await sendEmail({
          to: user.email,
          subject: message.subject,
          body: message.body,
          template: message.template
        })
      },
      reliability: 0.95,
      latency: 'delayed'
    },
    
    SMS: {
      handler: async (message, userId) => {
        const user = await getUser(userId)
        if (user.phoneNumber) {
          await sendSMS(user.phoneNumber, message.text)
        }
      },
      reliability: 0.98,
      latency: 'immediate'
    },
    
    WEBHOOK: {
      handler: async (message, userId) => {
        const webhooks = await getUserWebhooks(userId)
        for (const webhook of webhooks) {
          await callWebhook(webhook.url, message)
        }
      },
      reliability: 0.75,
      latency: 'immediate'
    }
  },
  
  // 最適チャネル選択
  selectOptimalChannel: async (notification, userId) => {
    const userPrefs = await getUserNotificationPreferences(userId)
    const channelStatus = await getChannelStatus(userId)
    
    const availableChannels = Object.keys(this.channels)
      .filter(channel => 
        userPrefs.enabledChannels.includes(channel) &&
        channelStatus[channel].available
      )
    
    // 緊急度とチャネル特性のマッチング
    if (notification.urgency >= 4) {
      // 緊急時は即時性を重視
      return availableChannels
        .filter(ch => this.channels[ch].latency === 'immediate')
        .sort((a, b) => this.channels[b].reliability - this.channels[a].reliability)[0]
    }
    
    // 通常時は設定に従う
    return userPrefs.preferredChannel
  },
  
  // フォールバック配信
  sendWithFallback: async (notification, userId) => {
    const primaryChannel = await this.selectOptimalChannel(notification, userId)
    
    try {
      await this.channels[primaryChannel].handler(notification, userId)
      await logNotificationDelivery(notification.id, primaryChannel, 'success')
    } catch (error) {
      console.warn(`Primary channel ${primaryChannel} failed:`, error)
      
      // フォールバックチャネルの試行
      const fallbackChannels = await getFallbackChannels(userId, primaryChannel)
      
      for (const channel of fallbackChannels) {
        try {
          await this.channels[channel].handler(notification, userId)
          await logNotificationDelivery(notification.id, channel, 'fallback_success')
          break
        } catch (fallbackError) {
          console.warn(`Fallback channel ${channel} failed:`, fallbackError)
        }
      }
    }
  }
}
```

---

## トラブルシューティング

### 7.1 同期問題の解決

```javascript
// カレンダー同期の問題診断・修復
const SyncTroubleshooter = {
  // 同期問題の診断
  diagnoseSyncIssues: async (userId) => {
    const issues = []
    
    // 認証状態のチェック
    const authStatus = await checkAuthenticationStatus(userId)
    if (!authStatus.valid) {
      issues.push({
        type: 'AUTHENTICATION',
        severity: 'HIGH',
        message: '外部カレンダーの認証が無効です',
        solution: 'アカウント設定で再認証を行ってください'
      })
    }
    
    // 同期間隔のチェック
    const lastSync = await getLastSyncTime(userId)
    const syncInterval = await getSyncInterval(userId)
    const expectedNextSync = new Date(lastSync.getTime() + syncInterval)
    
    if (new Date() > expectedNextSync) {
      issues.push({
        type: 'SYNC_DELAY',
        severity: 'MEDIUM',
        message: '同期が遅延しています',
        solution: '手動同期を試すか、同期設定を確認してください'
      })
    }
    
    // データ整合性のチェック
    const integrityCheck = await checkDataIntegrity(userId)
    if (!integrityCheck.valid) {
      issues.push({
        type: 'DATA_CORRUPTION',
        severity: 'HIGH',
        message: 'データに不整合があります',
        solution: '完全再同期を実行してください'
      })
    }
    
    return issues
  },
  
  // 自動修復機能
  attemptAutoRepair: async (userId, issues) => {
    const repairResults = []
    
    for (const issue of issues) {
      try {
        switch (issue.type) {
          case 'AUTHENTICATION':
            await refreshAuthentication(userId)
            repairResults.push({ issue: issue.type, status: 'REPAIRED' })
            break
            
          case 'SYNC_DELAY':
            await forceSyncNow(userId)
            repairResults.push({ issue: issue.type, status: 'REPAIRED' })
            break
            
          case 'DATA_CORRUPTION':
            await performFullResync(userId)
            repairResults.push({ issue: issue.type, status: 'REPAIRED' })
            break
            
          default:
            repairResults.push({ issue: issue.type, status: 'MANUAL_REQUIRED' })
        }
      } catch (error) {
        repairResults.push({ 
          issue: issue.type, 
          status: 'REPAIR_FAILED', 
          error: error.message 
        })
      }
    }
    
    return repairResults
  }
}
```

### 7.2 パフォーマンス最適化

```javascript
// カレンダーパフォーマンスの最適化
const CalendarPerformanceOptimizer = {
  // クエリ最適化
  optimizeQueries: async () => {
    // 頻繁に使用されるクエリの特定
    const queryStats = await analyzeQueryPerformance()
    const slowQueries = queryStats.filter(q => q.avgTime > 1000) // 1秒以上
    
    for (const query of slowQueries) {
      // インデックスの最適化
      if (query.table === 'calendar_events') {
        await optimizeEventQueries(query)
      }
      
      // クエリの書き換え
      const optimizedQuery = await rewriteQuery(query)
      await updateQueryPlan(query.id, optimizedQuery)
    }
  },
  
  // キャッシュ戦略
  implementCaching: async () => {
    const cacheConfig = {
      // 静的データ（長期キャッシュ）
      static: {
        ttl: 3600, // 1時間
        keys: ['user_preferences', 'calendar_settings', 'timezone_data']
      },
      
      // 動的データ（短期キャッシュ）
      dynamic: {
        ttl: 300, // 5分
        keys: ['daily_events', 'week_view', 'month_summary']
      },
      
      // リアルタイムデータ（極短期キャッシュ）
      realtime: {
        ttl: 60, // 1分
        keys: ['current_conflicts', 'availability_status']
      }
    }
    
    await setupRedisCache(cacheConfig)
  },
  
  // 遅延読み込み
  implementLazyLoading: () => {
    return {
      // 視界外のイベントは遅延読み込み
      events: (viewport, allEvents) => {
        const visibleEvents = allEvents.filter(event => 
          isEventInViewport(event, viewport)
        )
        
        const lazyLoadTriggers = setupIntersectionObserver()
        return { visibleEvents, lazyLoadTriggers }
      },
      
      // 詳細情報の遅延読み込み
      eventDetails: (eventId) => {
        return new Promise((resolve) => {
          setTimeout(async () => {
            const details = await fetchEventDetails(eventId)
            resolve(details)
          }, 100)
        })
      }
    }
  }
}
```

---

**最終更新日**: 2025-06-29  
**対象バージョン**: Phase 4 完了版  
**関連ドキュメント**: システム機能カテゴリ一覧、アポイントメント管理マニュアル
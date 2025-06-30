// AI Prediction Engine for Mobile Mode
// Learns user behavior patterns and provides smart suggestions

export interface UserAction {
  id: string;
  type: 'task_interaction' | 'page_navigation' | 'gesture_use' | 'voice_command' | 'time_spent';
  data: Record<string, any>;
  timestamp: Date;
  context: {
    timeOfDay: string;
    dayOfWeek: string;
    deviceType: string;
    currentPage: string;
    previousActions: string[];
  };
}

export interface Prediction {
  id: string;
  type: 'next_action' | 'task_suggestion' | 'time_estimate' | 'priority_adjustment';
  confidence: number;
  data: Record<string, any>;
  reasoning: string;
  expires: Date;
}

export interface BehaviorPattern {
  id: string;
  pattern: string;
  frequency: number;
  timePattern: string[];
  conditions: Record<string, any>;
  actions: string[];
  confidence: number;
  lastUpdated: Date;
}

export interface TaskSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedDuration: number;
  tags: string[];
  confidence: number;
  reason: string;
  basedOnActions: string[];
}

class PredictiveEngine {
  private actions: UserAction[] = [];
  private patterns: BehaviorPattern[] = [];
  private predictions: Prediction[] = [];
  private isLearning: boolean = true;
  private minActionsForPrediction: number = 10;
  private maxStoredActions: number = 1000;

  constructor() {
    this.loadFromStorage();
    this.startPatternAnalysis();
  }

  // User Action Recording
  recordAction(type: string, data: Record<string, any>): void {
    const action: UserAction = {
      id: this.generateId(),
      type: type as any,
      data,
      timestamp: new Date(),
      context: this.getCurrentContext()
    };

    this.actions.push(action);
    
    // Keep only recent actions
    if (this.actions.length > this.maxStoredActions) {
      this.actions = this.actions.slice(-this.maxStoredActions);
    }

    this.saveToStorage();
    
    // Trigger pattern analysis if enough data
    if (this.actions.length >= this.minActionsForPrediction) {
      this.analyzePatterns();
    }
  }

  private getCurrentContext(): UserAction['context'] {
    const now = new Date();
    return {
      timeOfDay: this.getTimeOfDay(now),
      dayOfWeek: now.toLocaleDateString('ja-JP', { weekday: 'long' }),
      deviceType: this.getDeviceType(),
      currentPage: window.location.pathname,
      previousActions: this.actions.slice(-5).map(a => a.type)
    };
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Pattern Analysis
  private analyzePatterns(): void {
    const newPatterns = [
      ...this.analyzeTimePatterns(),
      ...this.analyzeSequencePatterns(),
      ...this.analyzeContextPatterns(),
      ...this.analyzeTaskPatterns()
    ];

    // Update existing patterns or add new ones
    for (const newPattern of newPatterns) {
      const existing = this.patterns.find(p => p.pattern === newPattern.pattern);
      if (existing) {
        existing.frequency++;
        existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
        existing.lastUpdated = new Date();
      } else {
        this.patterns.push(newPattern);
      }
    }

    // Remove weak patterns
    this.patterns = this.patterns.filter(p => p.confidence > 0.3);
    
    this.saveToStorage();
  }

  private analyzeTimePatterns(): BehaviorPattern[] {
    const timeGroups = this.groupActionsByTime();
    const patterns: BehaviorPattern[] = [];

    for (const [timeKey, actions] of Object.entries(timeGroups)) {
      if (actions.length < 3) continue;

      const actionTypes = actions.map(a => a.type);
      const uniqueTypes = [...new Set(actionTypes)];
      
      if (uniqueTypes.length > 1) {
        patterns.push({
          id: this.generateId(),
          pattern: `time_${timeKey}_${uniqueTypes.join('_')}`,
          frequency: actions.length,
          timePattern: [timeKey],
          conditions: { timeOfDay: timeKey },
          actions: uniqueTypes,
          confidence: Math.min(actions.length / 10, 1.0),
          lastUpdated: new Date()
        });
      }
    }

    return patterns;
  }

  private analyzeSequencePatterns(): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    const sequences = this.extractActionSequences(3); // 3-action sequences

    for (const sequence of sequences) {
      const pattern = `sequence_${sequence.join('_')}`;
      const frequency = this.countSequenceOccurrences(sequence);
      
      if (frequency >= 2) {
        patterns.push({
          id: this.generateId(),
          pattern,
          frequency,
          timePattern: [],
          conditions: { sequenceLength: 3 },
          actions: sequence,
          confidence: Math.min(frequency / 5, 1.0),
          lastUpdated: new Date()
        });
      }
    }

    return patterns;
  }

  private analyzeContextPatterns(): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    const contextGroups = this.groupActionsByContext();

    for (const [contextKey, actions] of Object.entries(contextGroups)) {
      if (actions.length < 3) continue;

      const actionTypes = [...new Set(actions.map(a => a.type))];
      
      patterns.push({
        id: this.generateId(),
        pattern: `context_${contextKey}_${actionTypes.join('_')}`,
        frequency: actions.length,
        timePattern: [],
        conditions: { context: contextKey },
        actions: actionTypes,
        confidence: Math.min(actions.length / 8, 1.0),
        lastUpdated: new Date()
      });
    }

    return patterns;
  }

  private analyzeTaskPatterns(): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    const taskActions = this.actions.filter(a => a.type === 'task_interaction');
    
    if (taskActions.length < 5) return patterns;

    // Analyze task completion patterns
    const completionPattern = this.analyzeTaskCompletionPattern(taskActions);
    if (completionPattern) {
      patterns.push(completionPattern);
    }

    // Analyze task creation patterns
    const creationPattern = this.analyzeTaskCreationPattern(taskActions);
    if (creationPattern) {
      patterns.push(creationPattern);
    }

    return patterns;
  }

  // Prediction Generation
  async generatePredictions(): Promise<Prediction[]> {
    if (this.actions.length < this.minActionsForPrediction) {
      return [];
    }

    const currentContext = this.getCurrentContext();
    const predictions: Prediction[] = [];

    // Generate different types of predictions
    predictions.push(...await this.predictNextActions(currentContext));
    predictions.push(...await this.predictTaskSuggestions(currentContext));
    predictions.push(...await this.predictTimeEstimates(currentContext));
    predictions.push(...await this.predictPriorityAdjustments(currentContext));

    // Filter by confidence and relevance
    const filteredPredictions = predictions
      .filter(p => p.confidence > 0.6)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Top 10 predictions

    this.predictions = filteredPredictions;
    return filteredPredictions;
  }

  private async predictNextActions(context: UserAction['context']): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const recentActions = this.actions.slice(-5).map(a => a.type);
    
    // Find patterns that match current context
    const matchingPatterns = this.patterns.filter(p => 
      this.doesPatternMatchContext(p, context, recentActions)
    );

    for (const pattern of matchingPatterns) {
      const nextAction = this.predictNextActionFromPattern(pattern, recentActions);
      if (nextAction) {
        predictions.push({
          id: this.generateId(),
          type: 'next_action',
          confidence: pattern.confidence * 0.8,
          data: { action: nextAction, pattern: pattern.pattern },
          reasoning: `過去のパターン「${pattern.pattern}」に基づく予測`,
          expires: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        });
      }
    }

    return predictions;
  }

  private async predictTaskSuggestions(context: UserAction['context']): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const taskActions = this.actions.filter(a => a.type === 'task_interaction');
    
    if (taskActions.length < 5) return predictions;

    // Analyze user's task patterns
    const taskPatterns = this.analyzeUserTaskPatterns(taskActions);
    
    for (const suggestion of this.generateTaskSuggestions(taskPatterns, context)) {
      predictions.push({
        id: this.generateId(),
        type: 'task_suggestion',
        confidence: suggestion.confidence,
        data: {
          title: suggestion.title,
          description: suggestion.description,
          priority: suggestion.priority,
          estimatedDuration: suggestion.estimatedDuration,
          tags: suggestion.tags
        },
        reasoning: suggestion.reason,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
    }

    return predictions;
  }

  private async predictTimeEstimates(context: UserAction['context']): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const timeSpentActions = this.actions.filter(a => a.type === 'time_spent');
    
    if (timeSpentActions.length < 3) return predictions;

    // Analyze time spent patterns
    const averageTime = this.calculateAverageTimeSpent(timeSpentActions);
    const timeByContext = this.analyzeTimeByContext(timeSpentActions);
    
    const currentContextTime = timeByContext[context.timeOfDay] || averageTime;
    
    predictions.push({
      id: this.generateId(),
      type: 'time_estimate',
      confidence: 0.7,
      data: {
        estimatedDuration: currentContextTime,
        factorsConsidered: ['time_of_day', 'historical_data', 'context']
      },
      reasoning: `${context.timeOfDay}の平均作業時間: ${currentContextTime}分`,
      expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    return predictions;
  }

  private async predictPriorityAdjustments(context: UserAction['context']): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const taskActions = this.actions.filter(a => 
      a.type === 'task_interaction' && a.data.action === 'priority_change'
    );
    
    if (taskActions.length < 3) return predictions;

    // Analyze priority change patterns
    const priorityPatterns = this.analyzePriorityChangePatterns(taskActions);
    
    for (const pattern of priorityPatterns) {
      if (pattern.confidence > 0.6) {
        predictions.push({
          id: this.generateId(),
          type: 'priority_adjustment',
          confidence: pattern.confidence,
          data: {
            suggestedChanges: pattern.suggestions,
            criteria: pattern.criteria
          },
          reasoning: `過去の優先度変更パターンに基づく提案`,
          expires: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
        });
      }
    }

    return predictions;
  }

  // Smart Task Suggestions
  async generateSmartTaskSuggestions(): Promise<TaskSuggestion[]> {
    const context = this.getCurrentContext();
    const taskActions = this.actions.filter(a => a.type === 'task_interaction');
    
    if (taskActions.length < 5) {
      return this.getDefaultTaskSuggestions();
    }

    const patterns = this.analyzeUserTaskPatterns(taskActions);
    return this.generateTaskSuggestions(patterns, context);
  }

  private generateTaskSuggestions(patterns: any[], context: UserAction['context']): TaskSuggestion[] {
    const suggestions: TaskSuggestion[] = [];
    
    // Context-based suggestions
    if (context.timeOfDay === 'morning') {
      suggestions.push({
        id: this.generateId(),
        title: '今日の目標設定',
        description: '今日達成したいことを3つ決めましょう',
        priority: 'HIGH',
        estimatedDuration: 10,
        tags: ['planning', 'daily'],
        confidence: 0.8,
        reason: '朝の時間帯は計画立てに最適です',
        basedOnActions: ['time_pattern', 'morning_routine']
      });
    }

    if (context.timeOfDay === 'evening') {
      suggestions.push({
        id: this.generateId(),
        title: '今日の振り返り',
        description: '完了したタスクを確認し、明日の準備をしましょう',
        priority: 'MEDIUM',
        estimatedDuration: 15,
        tags: ['review', 'reflection'],
        confidence: 0.7,
        reason: '夕方は一日の振り返りに適した時間です',
        basedOnActions: ['time_pattern', 'evening_routine']
      });
    }

    // Pattern-based suggestions
    const frequentTasks = this.extractFrequentTaskTypes(patterns);
    for (const taskType of frequentTasks) {
      suggestions.push({
        id: this.generateId(),
        title: this.generateTaskTitle(taskType),
        description: this.generateTaskDescription(taskType),
        priority: this.suggestPriority(taskType, context),
        estimatedDuration: this.estimateTaskDuration(taskType),
        tags: this.generateTaskTags(taskType),
        confidence: 0.6,
        reason: `よく作成する「${taskType}」タイプのタスクです`,
        basedOnActions: ['task_pattern', 'frequency_analysis']
      });
    }

    return suggestions.slice(0, 5); // Top 5 suggestions
  }

  // Helper Methods
  private groupActionsByTime(): Record<string, UserAction[]> {
    const groups: Record<string, UserAction[]> = {};
    
    for (const action of this.actions) {
      const timeKey = this.getTimeOfDay(action.timestamp);
      if (!groups[timeKey]) groups[timeKey] = [];
      groups[timeKey].push(action);
    }

    return groups;
  }

  private groupActionsByContext(): Record<string, UserAction[]> {
    const groups: Record<string, UserAction[]> = {};
    
    for (const action of this.actions) {
      const contextKey = `${action.context.dayOfWeek}_${action.context.timeOfDay}`;
      if (!groups[contextKey]) groups[contextKey] = [];
      groups[contextKey].push(action);
    }

    return groups;
  }

  private extractActionSequences(length: number): string[][] {
    const sequences: string[][] = [];
    
    for (let i = 0; i <= this.actions.length - length; i++) {
      const sequence = this.actions.slice(i, i + length).map(a => a.type);
      sequences.push(sequence);
    }

    return sequences;
  }

  private countSequenceOccurrences(sequence: string[]): number {
    let count = 0;
    const allSequences = this.extractActionSequences(sequence.length);
    
    for (const seq of allSequences) {
      if (JSON.stringify(seq) === JSON.stringify(sequence)) {
        count++;
      }
    }

    return count;
  }

  private doesPatternMatchContext(
    pattern: BehaviorPattern, 
    context: UserAction['context'], 
    recentActions: string[]
  ): boolean {
    // Check time pattern
    if (pattern.timePattern.length > 0 && 
        !pattern.timePattern.includes(context.timeOfDay)) {
      return false;
    }

    // Check sequence pattern
    if (pattern.conditions.sequenceLength) {
      const requiredSequence = pattern.actions;
      const currentSequence = recentActions.slice(-requiredSequence.length);
      return JSON.stringify(currentSequence) === JSON.stringify(requiredSequence.slice(0, -1));
    }

    return true;
  }

  private predictNextActionFromPattern(pattern: BehaviorPattern, recentActions: string[]): string | null {
    if (pattern.conditions.sequenceLength) {
      const patternActions = pattern.actions;
      const currentSequence = recentActions.slice(-patternActions.length + 1);
      
      if (JSON.stringify(currentSequence) === JSON.stringify(patternActions.slice(0, -1))) {
        return patternActions[patternActions.length - 1];
      }
    }

    return pattern.actions[0]; // Default to first action in pattern
  }

  private analyzeTaskCompletionPattern(taskActions: UserAction[]): BehaviorPattern | null {
    const completions = taskActions.filter(a => a.data.action === 'complete');
    if (completions.length < 3) return null;

    const completionTimes = completions.map(a => this.getTimeOfDay(a.timestamp));
    const mostCommonTime = this.getMostCommon(completionTimes);

    return {
      id: this.generateId(),
      pattern: `task_completion_${mostCommonTime}`,
      frequency: completions.length,
      timePattern: [mostCommonTime],
      conditions: { action: 'complete' },
      actions: ['task_complete'],
      confidence: Math.min(completions.length / 10, 1.0),
      lastUpdated: new Date()
    };
  }

  private analyzeTaskCreationPattern(taskActions: UserAction[]): BehaviorPattern | null {
    const creations = taskActions.filter(a => a.data.action === 'create');
    if (creations.length < 3) return null;

    const creationTimes = creations.map(a => this.getTimeOfDay(a.timestamp));
    const mostCommonTime = this.getMostCommon(creationTimes);

    return {
      id: this.generateId(),
      pattern: `task_creation_${mostCommonTime}`,
      frequency: creations.length,
      timePattern: [mostCommonTime],
      conditions: { action: 'create' },
      actions: ['task_create'],
      confidence: Math.min(creations.length / 8, 1.0),
      lastUpdated: new Date()
    };
  }

  private analyzeUserTaskPatterns(taskActions: UserAction[]): any[] {
    // Analyze task titles, tags, priorities, etc.
    const patterns = [];
    
    // Extract common keywords from task titles
    const titles = taskActions
      .filter(a => a.data.title)
      .map(a => a.data.title);
    
    const keywords = this.extractKeywords(titles);
    patterns.push({ type: 'keywords', data: keywords });

    // Analyze priority preferences
    const priorities = taskActions
      .filter(a => a.data.priority)
      .map(a => a.data.priority);
    
    const priorityPreference = this.getMostCommon(priorities);
    patterns.push({ type: 'priority_preference', data: priorityPreference });

    return patterns;
  }

  private extractKeywords(titles: string[]): string[] {
    const words = titles.join(' ').toLowerCase().split(/\s+/);
    const wordCount: Record<string, number> = {};
    
    for (const word of words) {
      if (word.length > 2) { // Ignore short words
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    }

    return Object.entries(wordCount)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private getMostCommon<T>(items: T[]): T {
    const counts: Record<string, number> = {};
    
    for (const item of items) {
      const key = String(item);
      counts[key] = (counts[key] || 0) + 1;
    }

    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    return sorted[0] ? (sorted[0][0] as any) : items[0];
  }

  private calculateAverageTimeSpent(timeActions: UserAction[]): number {
    const durations = timeActions.map(a => a.data.duration || 0);
    return durations.reduce((sum, dur) => sum + dur, 0) / durations.length;
  }

  private analyzeTimeByContext(timeActions: UserAction[]): Record<string, number> {
    const contexts: Record<string, number[]> = {};
    
    for (const action of timeActions) {
      const timeOfDay = this.getTimeOfDay(action.timestamp);
      if (!contexts[timeOfDay]) contexts[timeOfDay] = [];
      contexts[timeOfDay].push(action.data.duration || 0);
    }

    const averages: Record<string, number> = {};
    for (const [context, durations] of Object.entries(contexts)) {
      averages[context] = durations.reduce((sum, dur) => sum + dur, 0) / durations.length;
    }

    return averages;
  }

  private analyzePriorityChangePatterns(actions: UserAction[]): any[] {
    // Analyze when and why users change task priorities
    const patterns = [];
    
    const changes = actions.map(a => ({
      from: a.data.fromPriority,
      to: a.data.toPriority,
      time: this.getTimeOfDay(a.timestamp),
      reason: a.data.reason
    }));

    // Group by change type
    const changeTypes = this.groupBy(changes, c => `${c.from}_to_${c.to}`);
    
    for (const [changeType, changesList] of Object.entries(changeTypes)) {
      if (changesList.length >= 2) {
        patterns.push({
          type: changeType,
          frequency: changesList.length,
          confidence: Math.min(changesList.length / 5, 1.0),
          suggestions: this.generatePriorityChangeRules(changesList),
          criteria: this.extractPriorityChangeCriteria(changesList)
        });
      }
    }

    return patterns;
  }

  private groupBy<T, K extends string | number>(items: T[], keyFn: (item: T) => K): Record<K, T[]> {
    const result = {} as Record<K, T[]>;
    
    for (const item of items) {
      const key = keyFn(item);
      if (!result[key]) result[key] = [];
      result[key].push(item);
    }

    return result;
  }

  private extractFrequentTaskTypes(patterns: any[]): string[] {
    const keywordPattern = patterns.find(p => p.type === 'keywords');
    return keywordPattern ? keywordPattern.data.slice(0, 3) : ['会議', 'レビュー', '資料作成'];
  }

  private generateTaskTitle(taskType: string): string {
    const templates = {
      '会議': ['チーム会議の準備', '会議資料の確認', '会議のフォローアップ'],
      'レビュー': ['コードレビューの実施', 'ドキュメントレビュー', '進捗レビュー'],
      '資料作成': ['プレゼン資料作成', '報告書作成', '提案書作成']
    };

    const options = templates[taskType as keyof typeof templates] || [`${taskType}関連のタスク`];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateTaskDescription(taskType: string): string {
    return `${taskType}に関するタスクです。過去のパターンから自動生成されました。`;
  }

  private suggestPriority(taskType: string, context: UserAction['context']): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (context.timeOfDay === 'morning') return 'HIGH';
    if (context.timeOfDay === 'evening') return 'LOW';
    return 'MEDIUM';
  }

  private estimateTaskDuration(taskType: string): number {
    const durations: Record<string, number> = {
      '会議': 60,
      'レビュー': 30,
      '資料作成': 120,
      'default': 45
    };

    return durations[taskType] || durations.default;
  }

  private generateTaskTags(taskType: string): string[] {
    const tagMap: Record<string, string[]> = {
      '会議': ['meeting', 'team', 'collaboration'],
      'レビュー': ['review', 'quality', 'feedback'],
      '資料作成': ['documentation', 'writing', 'preparation']
    };

    return tagMap[taskType] || ['work', 'task'];
  }

  private getDefaultTaskSuggestions(): TaskSuggestion[] {
    return [
      {
        id: this.generateId(),
        title: '今日のタスクを整理する',
        description: 'まずは今日やることを整理しましょう',
        priority: 'HIGH',
        estimatedDuration: 15,
        tags: ['planning', 'organization'],
        confidence: 0.9,
        reason: 'タスク管理の基本です',
        basedOnActions: ['default']
      }
    ];
  }

  private generatePriorityChangeRules(changes: any[]): any[] {
    // Generate rules based on priority change patterns
    return changes.map(change => ({
      condition: `when time is ${change.time}`,
      action: `suggest changing ${change.from} to ${change.to}`,
      confidence: 0.7
    }));
  }

  private extractPriorityChangeCriteria(changes: any[]): string[] {
    return [...new Set(changes.map(c => c.reason).filter(Boolean))];
  }

  // Storage Management
  private saveToStorage(): void {
    try {
      localStorage.setItem('predictiveEngine_actions', JSON.stringify(this.actions.slice(-500))); // Keep last 500
      localStorage.setItem('predictiveEngine_patterns', JSON.stringify(this.patterns));
    } catch (error) {
      console.warn('Failed to save predictive engine data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const actionsData = localStorage.getItem('predictiveEngine_actions');
      if (actionsData) {
        this.actions = JSON.parse(actionsData).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
      }

      const patternsData = localStorage.getItem('predictiveEngine_patterns');
      if (patternsData) {
        this.patterns = JSON.parse(patternsData).map((p: any) => ({
          ...p,
          lastUpdated: new Date(p.lastUpdated)
        }));
      }
    } catch (error) {
      console.warn('Failed to load predictive engine data:', error);
    }
  }

  private startPatternAnalysis(): void {
    // Analyze patterns every 5 minutes
    setInterval(() => {
      if (this.isLearning && this.actions.length >= this.minActionsForPrediction) {
        this.analyzePatterns();
      }
    }, 5 * 60 * 1000);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Public API
  getCurrentPredictions(): Prediction[] {
    return this.predictions.filter(p => p.expires > new Date());
  }

  getBehaviorPatterns(): BehaviorPattern[] {
    return this.patterns;
  }

  getActionHistory(): UserAction[] {
    return this.actions;
  }

  clearLearningData(): void {
    this.actions = [];
    this.patterns = [];
    this.predictions = [];
    localStorage.removeItem('predictiveEngine_actions');
    localStorage.removeItem('predictiveEngine_patterns');
  }

  setLearningEnabled(enabled: boolean): void {
    this.isLearning = enabled;
  }

  getInsights(): any {
    return {
      totalActions: this.actions.length,
      patternsIdentified: this.patterns.length,
      activePredictions: this.getCurrentPredictions().length,
      mostActiveTimeOfDay: this.getMostActiveTimeOfDay(),
      mostUsedFeatures: this.getMostUsedFeatures(),
      learningProgress: Math.min(this.actions.length / 100, 1.0) * 100
    };
  }

  private getMostActiveTimeOfDay(): string {
    const timeGroups = this.groupActionsByTime();
    const times = Object.entries(timeGroups).sort(([, a], [, b]) => b.length - a.length);
    return times[0] ? times[0][0] : 'morning';
  }

  private getMostUsedFeatures(): string[] {
    const features = this.actions.map(a => a.type);
    const featureCounts = this.groupBy(features, f => f);
    return Object.entries(featureCounts)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 5)
      .map(([feature]) => feature);
  }
}

// Singleton instance
let predictiveEngineInstance: PredictiveEngine | null = null;

export function getPredictiveEngine(): PredictiveEngine {
  if (!predictiveEngineInstance) {
    predictiveEngineInstance = new PredictiveEngine();
  }
  return predictiveEngineInstance;
}

export default PredictiveEngine;
# タスク管理システム マニュアル

## 概要

FIND to DO Management Appのタスク管理システムは、7段階カンバンボードを中心とした高度なタスク管理機能を提供します。MECE（Mutually Exclusive, Collectively Exhaustive）原則に基づく関係性管理と、AI機能を活用したインテリジェントなタスク処理が特徴です。

## 目次

1. [7段階カンバンボード](#7段階カンバンボード)
2. [MECE関係性管理](#mece関係性管理)
3. [優先度管理システム](#優先度管理システム)
4. [協力者・担当者管理](#協力者担当者管理)
5. [AI機能連携](#ai機能連携)
6. [詳細操作ガイド](#詳細操作ガイド)
7. [トラブルシューティング](#トラブルシューティング)

---

## 7段階カンバンボード

### 1.1 ボードステージ構成

| ステージ | 英語名 | 説明 | 主な操作 |
|---------|--------|------|---------|
| **アイデア** | IDEA | タスクの発想・構想段階 | アイデア登録、概要作成 |
| **計画** | PLAN | 具体的な計画立案段階 | 詳細化、スケジュール設定 |
| **実行** | DO | タスクの実際の実行段階 | 進捗更新、作業記録 |
| **確認** | CHECK | 完了内容の確認・検証段階 | 品質チェック、レビュー |
| **完了** | COMPLETE | タスクの正式完了段階 | 完了確定、成果物確認 |
| **ナレッジ** | KNOWLEDGE | 知識として蓄積する段階 | ナレッジ化、共有設定 |
| **削除** | DELETE | 削除・アーカイブ段階 | 削除理由記録、履歴保持 |

### 1.2 ステージ遷移ルール

```javascript
// タスクステージ遷移の制御
const allowedTransitions = {
  'IDEA': ['PLAN', 'DELETE'],
  'PLAN': ['IDEA', 'DO', 'DELETE'],
  'DO': ['PLAN', 'CHECK', 'DELETE'],
  'CHECK': ['DO', 'COMPLETE', 'DELETE'],
  'COMPLETE': ['CHECK', 'KNOWLEDGE', 'DELETE'],
  'KNOWLEDGE': ['DELETE'],
  'DELETE': [] // 削除後は遷移不可
}

const canTransition = (currentStage, targetStage) => {
  return allowedTransitions[currentStage]?.includes(targetStage) || false
}
```

### 1.3 カンバンボード操作

#### ドラッグ&ドロップ機能
```javascript
// ドラッグ&ドロップによる移動
const handleDragEnd = (result) => {
  const { destination, source, draggableId } = result
  
  if (!destination) return
  
  const sourceStage = source.droppableId
  const destStage = destination.droppableId
  
  // 遷移ルールチェック
  if (!canTransition(sourceStage, destStage)) {
    showError('この移動は許可されていません')
    return
  }
  
  // タスク移動実行
  moveTask(draggableId, destStage, destination.index)
}
```

#### 一括操作機能
```javascript
// 複数タスクの一括操作
const bulkMoveTask = async (taskIds, targetStage) => {
  const validTasks = taskIds.filter(id => {
    const task = getTaskById(id)
    return canTransition(task.stage, targetStage)
  })
  
  if (validTasks.length === 0) {
    showError('移動可能なタスクがありません')
    return
  }
  
  await Promise.all(
    validTasks.map(id => updateTaskStage(id, targetStage))
  )
  
  showSuccess(`${validTasks.length}件のタスクを移動しました`)
}
```

---

## MECE関係性管理

### 2.1 MECE原則の適用

MECE原則に基づいてタスク間の関係性を管理します：

- **Mutually Exclusive（相互排他的）**: タスクの重複を排除
- **Collectively Exhaustive（全体網羅的）**: 必要なタスクを漏れなく管理

### 2.2 タスク関係性の種類

```javascript
// タスク関係性の定義
const TaskRelationTypes = {
  DEPENDS_ON: 'depends_on',       // 依存関係（前提条件）
  BLOCKS: 'blocks',               // ブロック関係（実行阻害）
  PARENT_CHILD: 'parent_child',   // 親子関係（階層構造）
  SIMILAR: 'similar',             // 類似関係（重複検知）
  SEQUENCE: 'sequence',           // 順序関係（実行順序）
  RESOURCE: 'resource'            // リソース関係（共有リソース）
}
```

### 2.3 関係性管理機能

#### 依存関係の設定
```javascript
// タスク依存関係の設定
const setTaskDependency = async (taskId, dependsOnTaskId) => {
  // 循環依存チェック
  if (await hasCyclicDependency(taskId, dependsOnTaskId)) {
    throw new Error('循環依存が発生するため設定できません')
  }
  
  await createTaskRelation({
    sourceTaskId: taskId,
    targetTaskId: dependsOnTaskId,
    relationType: 'DEPENDS_ON',
    createdAt: new Date()
  })
  
  // 依存タスクの完了状況をチェック
  await checkDependencyStatus(taskId)
}
```

#### 重複検知システム
```javascript
// 類似タスクの自動検知
const detectSimilarTasks = async (newTask) => {
  const similarTasks = await findSimilarTasks({
    title: newTask.title,
    description: newTask.description,
    category: newTask.category,
    threshold: 0.8 // 類似度80%以上
  })
  
  if (similarTasks.length > 0) {
    return {
      hasSimilar: true,
      suggestions: similarTasks.map(task => ({
        id: task.id,
        title: task.title,
        similarity: task.similarity,
        action: 'merge_or_differentiate'
      }))
    }
  }
  
  return { hasSimilar: false }
}
```

### 2.4 階層構造管理

```javascript
// 親子関係のあるタスク階層
const TaskHierarchy = {
  // 親タスクの作成
  createParentTask: async (parentData) => {
    const parent = await createTask({
      ...parentData,
      isParent: true,
      childTasks: []
    })
    return parent
  },
  
  // 子タスクの追加
  addChildTask: async (parentId, childData) => {
    const child = await createTask({
      ...childData,
      parentId,
      isChild: true
    })
    
    await updateParentProgress(parentId)
    return child
  },
  
  // 進捗の自動計算
  calculateParentProgress: (childTasks) => {
    const completedChildren = childTasks.filter(
      child => child.stage === 'COMPLETE'
    ).length
    
    return Math.round((completedChildren / childTasks.length) * 100)
  }
}
```

---

## 優先度管理システム

### 3.1 優先度レベル

| レベル | 記号 | 名称 | 説明 | 色分け |
|--------|------|------|------|--------|
| **A** | 🔴 | 最高優先 | 緊急かつ重要 | 赤色 |
| **B** | 🟡 | 高優先 | 重要だが緊急でない | 黄色 |
| **C** | 🟢 | 中優先 | 緊急だが重要でない | 緑色 |
| **D** | 🔵 | 低優先 | 緊急でも重要でもない | 青色 |

### 3.2 アイゼンハワーマトリックス適用

```javascript
// 優先度自動判定システム
const determinePriority = (task) => {
  const isUrgent = checkUrgency(task)
  const isImportant = checkImportance(task)
  
  if (isUrgent && isImportant) return 'A'
  if (!isUrgent && isImportant) return 'B'
  if (isUrgent && !isImportant) return 'C'
  return 'D'
}

const checkUrgency = (task) => {
  const now = new Date()
  const deadline = new Date(task.deadline)
  const daysDiff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
  
  return daysDiff <= 3 // 3日以内は緊急
}

const checkImportance = (task) => {
  const importanceFactors = [
    task.businessImpact >= 8,     // ビジネスインパクト8以上
    task.assignedBy === 'MANAGER', // 管理者からの依頼
    task.category === 'CRITICAL',  // 重要カテゴリ
    task.stakeholders.length > 3   // 関係者3人以上
  ]
  
  return importanceFactors.filter(Boolean).length >= 2
}
```

### 3.3 優先度ベースソート

```javascript
// 優先度とその他要素を組み合わせたソート
const sortTasksByPriority = (tasks) => {
  return tasks.sort((a, b) => {
    // 優先度レベル（A > B > C > D）
    const priorityOrder = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 }
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    
    if (priorityDiff !== 0) return priorityDiff
    
    // 締切の近さ
    const deadlineDiff = new Date(a.deadline) - new Date(b.deadline)
    if (deadlineDiff !== 0) return deadlineDiff
    
    // 作成日（新しいもの優先）
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
}
```

### 3.4 動的優先度更新

```javascript
// 時間経過による優先度の動的更新
const updatePriorityBasedOnTime = async () => {
  const tasks = await getActiveTasks()
  
  for (const task of tasks) {
    const newPriority = determinePriority(task)
    
    if (newPriority !== task.priority) {
      await updateTask(task.id, { priority: newPriority })
      
      // 優先度変更通知
      await sendPriorityChangeNotification(task, newPriority)
    }
  }
}

// 定期実行（1日1回）
setInterval(updatePriorityBasedOnTime, 24 * 60 * 60 * 1000)
```

---

## 協力者・担当者管理

### 4.1 ロール定義

```javascript
// タスク内のユーザーロール
const TaskUserRoles = {
  OWNER: 'owner',           // オーナー（作成者・責任者）
  ASSIGNEE: 'assignee',     // 担当者（実行者）
  REVIEWER: 'reviewer',     // レビュワー（確認者）
  COLLABORATOR: 'collaborator', // 協力者（支援者）
  OBSERVER: 'observer'      // オブザーバー（閲覧者）
}
```

### 4.2 担当者アサイン機能

```javascript
// 担当者の自動アサイン
const autoAssignTask = async (taskId, criteria) => {
  const availableUsers = await getAvailableUsers(criteria)
  
  // 負荷分散を考慮した担当者選定
  const bestAssignee = selectBestAssignee(availableUsers, {
    skillMatch: criteria.requiredSkills,
    workload: true,
    availability: true,
    performance: true
  })
  
  await assignUserToTask(taskId, bestAssignee, 'ASSIGNEE')
  
  // 担当者に通知
  await sendAssignmentNotification(bestAssignee, taskId)
}

const selectBestAssignee = (users, criteria) => {
  return users
    .map(user => ({
      user,
      score: calculateAssignmentScore(user, criteria)
    }))
    .sort((a, b) => b.score - a.score)[0]?.user
}
```

### 4.3 コラボレーション機能

```javascript
// タスクコメント・コミュニケーション
const TaskComments = {
  addComment: async (taskId, userId, content, type = 'COMMENT') => {
    const comment = await createComment({
      taskId,
      userId,
      content,
      type, // COMMENT, QUESTION, SUGGESTION, UPDATE
      timestamp: new Date(),
      mentions: extractMentions(content)
    })
    
    // メンション通知
    if (comment.mentions.length > 0) {
      await sendMentionNotifications(comment.mentions, taskId, comment.id)
    }
    
    return comment
  },
  
  // 進捗更新コメント
  addProgressUpdate: async (taskId, userId, progress, notes) => {
    return await TaskComments.addComment(taskId, userId, 
      `進捗更新: ${progress}%\n${notes}`, 'UPDATE')
  }
}
```

### 4.4 チーム負荷管理

```javascript
// チームメンバーの作業負荷監視
const WorkloadManager = {
  // 個人の作業負荷計算
  calculateWorkload: (userId) => {
    const activeTasks = getUserActiveTasks(userId)
    
    return activeTasks.reduce((total, task) => {
      const priorityWeight = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 }
      const stageWeight = { 'DO': 1.5, 'CHECK': 1.2, 'PLAN': 1.0 }
      
      return total + (priorityWeight[task.priority] * stageWeight[task.stage])
    }, 0)
  },
  
  // チーム全体の負荷バランス
  getTeamLoadBalance: (teamMembers) => {
    const workloads = teamMembers.map(member => ({
      userId: member.id,
      name: member.name,
      workload: WorkloadManager.calculateWorkload(member.id),
      capacity: member.capacity || 10
    }))
    
    const averageLoad = workloads.reduce((sum, w) => sum + w.workload, 0) / workloads.length
    
    return {
      workloads,
      averageLoad,
      isBalanced: workloads.every(w => Math.abs(w.workload - averageLoad) < 2)
    }
  }
}
```

---

## AI機能連携

### 5.1 AI自動分類

```javascript
// AIによるタスク自動分類
const AITaskClassifier = {
  classifyTask: async (taskData) => {
    const classification = await callAI({
      prompt: `
        以下のタスクを分析して分類してください：
        タイトル: ${taskData.title}
        説明: ${taskData.description}
        
        以下の要素を判定してください：
        1. カテゴリ（開発/マーケティング/営業/管理/その他）
        2. 優先度（A/B/C/D）
        3. 予想工数（時間）
        4. 必要スキル
        5. リスクレベル（高/中/低）
      `,
      model: 'text-classification'
    })
    
    return {
      category: classification.category,
      suggestedPriority: classification.priority,
      estimatedHours: classification.hours,
      requiredSkills: classification.skills,
      riskLevel: classification.risk
    }
  }
}
```

### 5.2 AI進捗予測

```javascript
// AI による完了予測
const AIProgressPredictor = {
  predictCompletion: async (taskId) => {
    const task = await getTask(taskId)
    const historicalData = await getHistoricalTaskData(task.category)
    
    const prediction = await callAI({
      prompt: `
        タスクの完了予測を行ってください：
        現在の進捗: ${task.progress}%
        カテゴリ: ${task.category}
        優先度: ${task.priority}
        担当者: ${task.assignee}
        過去データ: ${JSON.stringify(historicalData)}
      `,
      model: 'time-series-prediction'
    })
    
    return {
      estimatedCompletionDate: prediction.completionDate,
      confidence: prediction.confidence,
      bottlenecks: prediction.identifiedBottlenecks,
      recommendations: prediction.recommendations
    }
  }
}
```

### 5.3 AI作業提案

```javascript
// AIによる次のアクション提案
const AIActionSuggester = {
  suggestNextActions: async (userId) => {
    const userTasks = await getUserTasks(userId)
    const userProfile = await getUserProfile(userId)
    const teamContext = await getTeamContext(userId)
    
    const suggestions = await callAI({
      prompt: `
        以下の情報から、最適な次のアクションを提案してください：
        
        ユーザータスク: ${JSON.stringify(userTasks)}
        ユーザープロフィール: ${JSON.stringify(userProfile)}
        チーム状況: ${JSON.stringify(teamContext)}
        
        提案内容：
        1. 優先して取り組むべきタスク
        2. 効率化のための工夫
        3. 他メンバーとの連携提案
      `,
      model: 'action-recommendation'
    })
    
    return suggestions
  }
}
```

---

## 詳細操作ガイド

### 6.1 タスク作成

#### 基本的なタスク作成
```javascript
// 新規タスク作成
const createNewTask = async (taskData) => {
  // AI分類の実行
  const aiSuggestions = await AITaskClassifier.classifyTask(taskData)
  
  const newTask = {
    id: generateTaskId(),
    title: taskData.title,
    description: taskData.description,
    stage: 'IDEA',
    priority: aiSuggestions.suggestedPriority,
    category: aiSuggestions.category,
    estimatedHours: aiSuggestions.estimatedHours,
    createdBy: taskData.userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: extractTags(taskData.description),
    status: 'ACTIVE'
  }
  
  const createdTask = await saveTask(newTask)
  
  // 重複チェックの実行
  const duplicateCheck = await detectSimilarTasks(newTask)
  if (duplicateCheck.hasSimilar) {
    await flagForDuplicateReview(createdTask.id, duplicateCheck.suggestions)
  }
  
  return createdTask
}
```

#### テンプレートからの作成
```javascript
// テンプレートベースのタスク作成
const createTaskFromTemplate = async (templateId, customData) => {
  const template = await getTaskTemplate(templateId)
  
  const taskData = {
    ...template.defaultValues,
    ...customData,
    title: customData.title || template.defaultValues.title,
    description: customData.description || template.defaultValues.description
  }
  
  // サブタスクの自動生成
  const parentTask = await createNewTask(taskData)
  
  if (template.subtasks) {
    for (const subtaskTemplate of template.subtasks) {
      await createNewTask({
        ...subtaskTemplate,
        parentId: parentTask.id,
        createdBy: customData.userId
      })
    }
  }
  
  return parentTask
}
```

### 6.2 タスク更新操作

#### 進捗更新
```javascript
// 進捗更新機能
const updateTaskProgress = async (taskId, progress, notes) => {
  const task = await getTask(taskId)
  
  await updateTask(taskId, {
    progress,
    updatedAt: new Date(),
    lastProgressUpdate: new Date()
  })
  
  // 進捗コメント追加
  await TaskComments.addProgressUpdate(taskId, task.assignee, progress, notes)
  
  // 完了予測の更新
  const prediction = await AIProgressPredictor.predictCompletion(taskId)
  await updateTask(taskId, {
    estimatedCompletionDate: prediction.estimatedCompletionDate
  })
  
  // 関係者への通知
  await notifyTaskStakeholders(taskId, 'PROGRESS_UPDATE', {
    progress,
    notes,
    prediction
  })
}
```

#### 一括編集機能
```javascript
// 複数タスクの一括編集
const bulkEditTasks = async (taskIds, updates) => {
  const validUpdates = validateBulkUpdates(updates)
  
  const results = await Promise.all(
    taskIds.map(async (taskId) => {
      try {
        await updateTask(taskId, {
          ...validUpdates,
          updatedAt: new Date()
        })
        return { taskId, success: true }
      } catch (error) {
        return { taskId, success: false, error: error.message }
      }
    })
  )
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  return {
    successful: successful.length,
    failed: failed.length,
    details: results
  }
}
```

### 6.3 フィルタリング・検索

#### 高度なフィルタリング
```javascript
// 多条件フィルタリング
const filterTasks = (tasks, filters) => {
  return tasks.filter(task => {
    // ステージフィルタ
    if (filters.stages && !filters.stages.includes(task.stage)) {
      return false
    }
    
    // 優先度フィルタ
    if (filters.priorities && !filters.priorities.includes(task.priority)) {
      return false
    }
    
    // 担当者フィルタ
    if (filters.assignees && filters.assignees.length > 0) {
      const taskAssignees = task.assignees.map(a => a.userId)
      if (!filters.assignees.some(id => taskAssignees.includes(id))) {
        return false
      }
    }
    
    // 期限フィルタ
    if (filters.dueDateRange) {
      const taskDate = new Date(task.deadline)
      const startDate = new Date(filters.dueDateRange.start)
      const endDate = new Date(filters.dueDateRange.end)
      
      if (taskDate < startDate || taskDate > endDate) {
        return false
      }
    }
    
    // タグフィルタ
    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some(tag => task.tags.includes(tag))) {
        return false
      }
    }
    
    // テキスト検索
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      const searchableText = `${task.title} ${task.description}`.toLowerCase()
      if (!searchableText.includes(searchLower)) {
        return false
      }
    }
    
    return true
  })
}
```

#### 保存済み検索・フィルタ
```javascript
// 検索条件の保存と読み込み
const SavedFilters = {
  save: async (userId, filterName, filterCriteria) => {
    const savedFilter = {
      id: generateFilterId(),
      userId,
      name: filterName,
      criteria: filterCriteria,
      createdAt: new Date(),
      lastUsed: new Date()
    }
    
    await saveSavedFilter(savedFilter)
    return savedFilter
  },
  
  load: async (userId, filterId) => {
    const filter = await getSavedFilter(filterId)
    
    if (filter.userId !== userId) {
      throw new Error('Access denied')
    }
    
    // 最終使用日時を更新
    await updateSavedFilter(filterId, { lastUsed: new Date() })
    
    return filter.criteria
  },
  
  getRecentFilters: async (userId, limit = 5) => {
    return await getSavedFilters(userId, {
      orderBy: 'lastUsed',
      direction: 'DESC',
      limit
    })
  }
}
```

---

## トラブルシューティング

### 7.1 よくある問題

#### タスクが移動できない
**症状**: ドラッグ&ドロップで移動できない
**原因と対処法**:
1. **権限不足**: タスクの編集権限を確認
2. **ステージ遷移ルール違反**: 許可された遷移パスを確認
3. **依存関係ブロック**: 前提タスクの完了状況を確認

#### 優先度が自動変更される
**症状**: 設定した優先度が勝手に変わる
**原因と対処法**:
1. **自動優先度更新が有効**: 設定で無効化可能
2. **締切日の接近**: 緊急度による自動昇格
3. **AI提案の自動適用**: AI提案設定を確認

### 7.2 パフォーマンス問題

#### 大量タスクの表示が遅い
```javascript
// 仮想化による大量データ対応
const VirtualizedTaskList = {
  // 表示領域のタスクのみレンダリング
  renderVisibleTasks: (tasks, viewport) => {
    const itemHeight = 80
    const startIndex = Math.floor(viewport.scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(viewport.height / itemHeight),
      tasks.length
    )
    
    return tasks.slice(startIndex, endIndex)
  },
  
  // 段階的読み込み
  loadTasksInBatches: async (filters, batchSize = 50) => {
    let offset = 0
    let allTasks = []
    
    while (true) {
      const batch = await getTasks(filters, offset, batchSize)
      if (batch.length === 0) break
      
      allTasks = [...allTasks, ...batch]
      offset += batchSize
      
      // UIの更新
      updateTaskList(allTasks)
    }
    
    return allTasks
  }
}
```

### 7.3 データ整合性問題

#### 依存関係の循環参照
```javascript
// 循環依存の検出と修復
const CircularDependencyResolver = {
  detect: async (taskId) => {
    const visited = new Set()
    const stack = new Set()
    
    const hasCycle = async (currentTaskId) => {
      if (stack.has(currentTaskId)) return true
      if (visited.has(currentTaskId)) return false
      
      visited.add(currentTaskId)
      stack.add(currentTaskId)
      
      const dependencies = await getTaskDependencies(currentTaskId)
      
      for (const dep of dependencies) {
        if (await hasCycle(dep.dependsOnTaskId)) {
          return true
        }
      }
      
      stack.delete(currentTaskId)
      return false
    }
    
    return await hasCycle(taskId)
  },
  
  resolve: async (cyclicPath) => {
    // 最も影響の少ない依存関係を削除
    const leastCriticalDep = findLeastCriticalDependency(cyclicPath)
    await removeTaskDependency(leastCriticalDep.source, leastCriticalDep.target)
    
    // 代替手段の提案
    return {
      removedDependency: leastCriticalDep,
      alternatives: await suggestAlternativeDependencies(leastCriticalDep)
    }
  }
}
```

---

## 統計・分析機能

### 8.1 タスク分析ダッシュボード

```javascript
// タスク完了率の分析
const TaskAnalytics = {
  getCompletionStats: async (userId, period) => {
    const tasks = await getUserTasks(userId, period)
    
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.stage === 'COMPLETE').length,
      inProgress: tasks.filter(t => ['DO', 'CHECK'].includes(t.stage)).length,
      planning: tasks.filter(t => ['IDEA', 'PLAN'].includes(t.stage)).length,
      overdue: tasks.filter(t => isOverdue(t)).length,
      
      // 完了率
      completionRate: tasks.length > 0 ? 
        (tasks.filter(t => t.stage === 'COMPLETE').length / tasks.length) * 100 : 0,
      
      // 平均完了時間
      averageCompletionTime: calculateAverageCompletionTime(tasks),
      
      // 優先度別分布
      priorityDistribution: calculatePriorityDistribution(tasks)
    }
  },
  
  // 生産性トレンド分析
  getProductivityTrend: async (userId, days = 30) => {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))
    
    const dailyStats = []
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayTasks = await getTasksCompletedOnDate(userId, d)
      dailyStats.push({
        date: new Date(d),
        tasksCompleted: dayTasks.length,
        totalHours: dayTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
        efficiency: calculateEfficiency(dayTasks)
      })
    }
    
    return dailyStats
  }
}
```

---

**最終更新日**: 2025-06-29  
**対象バージョン**: Phase 4 完了版  
**関連ドキュメント**: システム機能カテゴリ一覧、ユーザー操作完全リスト
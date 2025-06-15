import { NextRequest, NextResponse } from 'next/server';
import { AIEvaluationEngine } from '@/lib/ai/evaluation-engine';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function POST(request: NextRequest) {
  try {
    const { entityType, entityId, evaluationType } = await request.json();
    
    // 入力値検証
    if (!entityType || !entityId || !evaluationType) {
      return NextResponse.json({ 
        error: 'Missing required fields: entityType, entityId, evaluationType' 
      }, { status: 400 });
    }

    const engine = new AIEvaluationEngine(process.env.GEMINI_API_KEY);
    
    switch (evaluationType) {
      case 'resource_weight':
        return await handleResourceWeightEvaluation(engine, entityId);
      case 'success_probability':
        return await handleSuccessProbabilityEvaluation(engine, entityId);
      case 'issue_level':
        return await handleIssueLevelEvaluation(engine, entityId);
      default:
        return NextResponse.json({ 
          error: 'Invalid evaluation type. Must be: resource_weight, success_probability, or issue_level' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('AI evaluation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleResourceWeightEvaluation(engine: AIEvaluationEngine, taskId: string) {
  // 1. タスク取得
  const task = await prismaDataService.getTaskById(taskId);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // 2. ユーザー取得
  const user = await prismaDataService.getUserById(task.userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 3. 関連タスク取得（同じユーザーのアクティブタスク）
  const relatedTasks = await prismaDataService.getTasksByUserId(task.userId);
  const activeTasks = relatedTasks.filter(t => 
    t.status !== 'COMPLETE' && t.status !== 'DELETE' && t.id !== taskId
  );

  // 4. AI評価実行
  const result = await engine.calculateResourceWeight(user, task, activeTasks);
  
  // 5. 評価結果をDBに保存
  await prismaDataService.createAIEvaluation({
    entityType: 'task',
    entityId: taskId,
    evaluationType: 'resource_weight',
    score: result.weight,
    reasoning: result.reasoning,
    confidence: result.confidence
  });

  // 6. タスクのリソースウェイト更新
  await prismaDataService.updateTask(taskId, { 
    resourceWeight: result.weight 
  });

  return NextResponse.json(result);
}

async function handleSuccessProbabilityEvaluation(engine: AIEvaluationEngine, projectId: string) {
  // 1. プロジェクト取得
  const project = await prismaDataService.getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // 2. プロジェクト関連データ取得
  const tasks = await prismaDataService.getTasksByProjectId(projectId);
  // TODO: プロジェクト関連のコネクションとアクティビティを取得
  const connections: any[] = [];
  const recentActivity: any[] = [];

  // 3. AI評価実行
  const result = await engine.calculateSuccessProbability(project, tasks, connections, recentActivity);
  
  // 4. 評価結果をDBに保存
  await prismaDataService.createAIEvaluation({
    entityType: 'project',
    entityId: projectId,
    evaluationType: 'success_probability',
    score: result.probability,
    reasoning: JSON.stringify(result.factors),
    confidence: result.confidence
  });

  // 5. プロジェクトの成功確率更新
  await prismaDataService.updateProject(projectId, { 
    successProbability: result.probability 
  });

  return NextResponse.json(result);
}

async function handleIssueLevelEvaluation(engine: AIEvaluationEngine, taskId: string) {
  // 1. タスク取得
  const task = await prismaDataService.getTaskById(taskId);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // 2. プロジェクト取得（任意）
  const project = task.projectId ? await prismaDataService.getProjectById(task.projectId) : undefined;

  // 3. ユーザーワークロード計算
  const userTasks = await prismaDataService.getTasksByUserId(task.userId);
  const userWorkload = userTasks
    .filter(t => t.status !== 'COMPLETE' && t.status !== 'DELETE')
    .reduce((sum, t) => sum + (t.resourceWeight || 1), 0);

  // 4. AI評価実行
  const result = await engine.evaluateIssueLevel(task, project, userWorkload);
  
  // 5. 評価結果をDBに保存
  const scoreMap = { A: 4, B: 3, C: 2, D: 1 };
  await prismaDataService.createAIEvaluation({
    entityType: 'task',
    entityId: taskId,
    evaluationType: 'issue_level',
    score: scoreMap[result.level],
    reasoning: result.reasoning,
    confidence: result.confidence
  });

  // 6. タスクのISSUE度更新
  await prismaDataService.updateTask(taskId, { 
    aiIssueLevel: result.level 
  });

  return NextResponse.json(result);
}
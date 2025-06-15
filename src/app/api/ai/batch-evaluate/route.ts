import { NextRequest, NextResponse } from 'next/server';
import { AIEvaluationEngine } from '@/lib/ai/evaluation-engine';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function POST(request: NextRequest) {
  try {
    const { target } = await request.json(); // 'all_tasks', 'all_projects', 'specific_user'
    
    const engine = new AIEvaluationEngine(process.env.GEMINI_API_KEY);
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    if (target === 'all_tasks') {
      const tasks = await prismaDataService.getAllTasks();
      
      for (const task of tasks) {
        try {
          results.processed++;
          
          const user = await prismaDataService.getUserById(task.userId);
          if (!user) continue;

          const userTasks = await prismaDataService.getTasksByUserId(task.userId);
          const activeTasks = userTasks.filter(t => 
            t.status !== 'COMPLETE' && t.status !== 'DELETE' && t.id !== task.id
          );

          // リソースウェイト評価
          const weightResult = await engine.calculateResourceWeight(user, task, activeTasks);
          await prismaDataService.updateTask(task.id, { resourceWeight: weightResult.weight });

          // ISSUE度評価
          const project = task.projectId ? await prismaDataService.getProjectById(task.projectId) : undefined;
          const userWorkload = userTasks.reduce((sum, t) => sum + (t.resourceWeight || 1), 0);
          const issueResult = await engine.evaluateIssueLevel(task, project, userWorkload);
          await prismaDataService.updateTask(task.id, { aiIssueLevel: issueResult.level });

          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Task ${task.id}: ${error}`);
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Batch evaluation error:', error);
    return NextResponse.json({ error: 'Batch evaluation failed' }, { status: 500 });
  }
}
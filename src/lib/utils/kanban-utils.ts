import { PrismaClient } from '@prisma/client';

export interface KanbanMoveResult {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
  status?: number;
  rollbackData?: unknown;
}

export interface OptimisticUpdateConfig {
  enableRollback: boolean;
  timeout: number;
  retryCount: number;
  debounceDelay: number;
}

export class KanbanMoveHandler {
  private prisma: PrismaClient;
  private config: OptimisticUpdateConfig;

  constructor(prisma: PrismaClient, config?: Partial<OptimisticUpdateConfig>) {
    this.prisma = prisma;
    this.config = {
      enableRollback: true,
      timeout: 15000, // 15秒に延長
      retryCount: 2, // リトライ回数を減らす
      debounceDelay: 300, // デバウンス遅延を追加
      ...config
    };
  }

  async executeWithOptimisticUpdate<T>(
    operation: () => Promise<T>,
    rollbackOperation?: () => Promise<unknown>
  ): Promise<KanbanMoveResult> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt < this.config.retryCount) {
      try {
        const result = await Promise.race([
          operation(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('操作がタイムアウトしました')), this.config.timeout)
          )
        ]);

        return {
          success: true,
          data: result,
          message: '操作が正常に完了しました'
        };

      } catch (error) {
        lastError = error;
        attempt++;
        
        console.error(`カンバン操作失敗 (試行 ${attempt}/${this.config.retryCount}):`, error);

        if (attempt < this.config.retryCount) {
          // 指数バックオフで再試行
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // 全ての試行が失敗した場合、ロールバックを実行
    if (this.config.enableRollback && rollbackOperation) {
      try {
        await rollbackOperation();
        console.log('ロールバック操作が正常に完了しました');
      } catch (rollbackError) {
        console.error('ロールバック操作も失敗しました:', rollbackError);
      }
    }

    return {
      success: false,
      error: lastError?.message || '操作に失敗しました',
      status: this.getErrorStatus(lastError)
    };
  }

  private getErrorStatus(error: unknown): number {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('見つかりません')) return 404;
    if (message.includes('無効な')) return 400;
    if (message.includes('権限')) return 403;
    if (message.includes('タイムアウト')) return 408;
    return 500;
  }
}

export const KANBAN_VALIDATION_RULES = {
  task: {
    status: ['IDEA', 'PLAN', 'DO', 'CHECK', 'COMPLETE', 'KNOWLEDGE', 'DELETE'],
    priority: ['A', 'B', 'C', 'D']
  },
  appointment: {
    processing: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FOLLOW_UP', 'CLOSED'],
    relationship: ['FIRST_CONTACT', 'RAPPORT_BUILDING', 'TRUST_ESTABLISHED', 'STRATEGIC_PARTNER', 'LONG_TERM_CLIENT'],
    phase: ['LEAD', 'PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'CLOSING', 'POST_SALE'],
    source: ['REFERRAL', 'COLD_OUTREACH', 'NETWORKING_EVENT', 'INBOUND_INQUIRY', 'SOCIAL_MEDIA', 'EXISTING_CLIENT', 'PARTNER_REFERRAL']
  },
  project: {
    status: ['planning', 'active', 'on_hold', 'completed']
  }
};

export function validateKanbanMove(
  itemType: string,
  kanbanType: string,
  targetColumn: string
): { isValid: boolean; error?: string } {
  const rules = KANBAN_VALIDATION_RULES[itemType as keyof typeof KANBAN_VALIDATION_RULES];
  
  if (!rules) {
    return { isValid: false, error: `サポートされていないアイテムタイプ: ${itemType}` };
  }

  // 特別なケース（未割り当て、プロジェクトなし等）
  if (['unassigned', 'no_project', 'no_user'].includes(targetColumn)) {
    return { isValid: true };
  }

  // タスクIDが渡された場合のエラーメッセージを改善
  if (targetColumn.startsWith('task_') || targetColumn.startsWith('appointment_') || targetColumn.startsWith('project_')) {
    return { isValid: false, error: `移動先にアイテムIDが指定されています。カラムIDを指定してください: ${targetColumn}` };
  }

  const validColumns = rules[kanbanType as keyof typeof rules];
  
  if (!validColumns) {
    return { isValid: false, error: `サポートされていないカンバンタイプ: ${kanbanType}` };
  }

  if (!validColumns.includes(targetColumn)) {
    return { isValid: false, error: `無効な移動先: ${targetColumn}` };
  }

  return { isValid: true };
}

export async function validateUserAccess(
  prisma: PrismaClient,
  userId: string
): Promise<{ isValid: boolean; error?: string; user?: unknown }> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, name: true, isActive: true }
    });

    if (!user) {
      return { isValid: false, error: 'ユーザーが見つかりません' };
    }

    if (!user.isActive) {
      return { isValid: false, error: 'ユーザーがアクティブではありません' };
    }

    return { isValid: true, user };
  } catch (error) {
    console.error('ユーザーアクセス検証エラー:', error);
    return { isValid: false, error: 'ユーザーアクセスの検証に失敗しました' };
  }
}

export async function validateProjectAccess(
  prisma: PrismaClient,
  projectId: string
): Promise<{ isValid: boolean; error?: string; project?: unknown }> {
  try {
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, status: true }
    });

    if (!project) {
      return { isValid: false, error: 'プロジェクトが見つかりません' };
    }

    return { isValid: true, project };
  } catch (error) {
    console.error('プロジェクトアクセス検証エラー:', error);
    return { isValid: false, error: 'プロジェクトアクセスの検証に失敗しました' };
  }
}

export function formatKanbanResponse(
  success: boolean,
  data?: unknown,
  message?: string,
  error?: string,
  additionalData?: unknown
) {
  const response: Record<string, unknown> = {
    success,
    timestamp: new Date().toISOString()
  };

  if (success) {
    response.data = data;
    response.message = message || '操作が正常に完了しました';
  } else {
    response.error = error || '操作に失敗しました';
  }

  if (additionalData) {
    response.meta = additionalData;
  }

  return response;
}

export class KanbanCache {
  private static cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  static set(key: string, data: unknown, ttlSeconds: number = 300) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  static get(key: string): unknown | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  static invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  static clear() {
    this.cache.clear();
  }
}
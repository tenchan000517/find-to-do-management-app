import { prismaDataService } from '@/lib/database/prisma-service';

export class RelationshipService {
  
  /**
   * エンティティをプロジェクトに自動紐づけ
   */
  async linkToProject(
    entityType: 'task' | 'appointment' | 'connection' | 'calendar',
    entityId: string,
    projectId?: string,
    strength: number = 1.0
  ): Promise<void> {
    try {
      let resolvedProjectId = projectId;
      if (!resolvedProjectId) {
        resolvedProjectId = await this.inferProjectConnection(entityType, entityId);
      }
      
      if (resolvedProjectId) {
        await prismaDataService.createProjectRelationship({
          projectId: resolvedProjectId,
          relatedType: entityType,
          relatedId: entityId,
          relationshipStrength: strength
        });
        
        // プロジェクトのアクティビティスコア更新
        await this.updateProjectActivity(resolvedProjectId);
      }
    } catch (error) {
      console.error('Failed to link to project:', error);
    }
  }

  /**
   * プロジェクトアクティビティスコア更新
   */
  async updateProjectActivity(projectId: string): Promise<void> {
    try {
      const relationships = await prismaDataService.getProjectRelationships(projectId);
      const recentActivity = relationships.filter(r => {
        const daysSince = this.getDaysSince(r.createdAt);
        return daysSince <= 30;
      });

      const activityScore = Math.min(1.0, recentActivity.length / 10);
      
      await prismaDataService.updateProject(projectId, {
        activityScore,
        lastActivityDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update project activity:', error);
    }
  }

  /**
   * コネクションパワー計算・更新
   */
  async updateConnectionPower(projectId: string): Promise<void> {
    try {
      const connections = await this.getProjectConnections(projectId);
      const uniqueCompanies = new Set(connections.map(c => c.company));
      const seniorContacts = connections.filter(c => 
        c.position.includes('部長') || c.position.includes('取締役') || c.position.includes('CEO')
      );

      const connectionPower = uniqueCompanies.size + (seniorContacts.length * 2);
      
      await prismaDataService.updateProject(projectId, { connectionPower });
    } catch (error) {
      console.error('Failed to update connection power:', error);
    }
  }

  /**
   * AI判定によるプロジェクト関連性推論
   */
  private async inferProjectConnection(entityType: string, entityId: string): Promise<string | undefined> {
    try {
      const entity = await this.getEntityById(entityType, entityId);
      if (!entity) return undefined;

      const projects = await prismaDataService.getProjects();
      const scores = [];

      for (const project of projects) {
        const similarity = await this.calculateSimilarity(entity, project);
        scores.push({ projectId: project.id, score: similarity });
      }

      const bestMatch = scores.sort((a, b) => b.score - a.score)[0];
      return bestMatch && bestMatch.score > 0.6 ? bestMatch.projectId : undefined;
    } catch (error) {
      console.error('Failed to infer project connection:', error);
      return undefined;
    }
  }

  private async calculateSimilarity(entity: any, project: any): Promise<number> {
    // キーワードベースの類似度計算
    const entityText = `${entity.title || entity.name || ''} ${entity.description || ''}`.toLowerCase();
    const projectText = `${project.name} ${project.description}`.toLowerCase();

    const entityWords = new Set(entityText.split(/\s+/));
    const projectWords = new Set(projectText.split(/\s+/));
    
    const intersection = new Set([...entityWords].filter(x => projectWords.has(x)));
    const union = new Set([...entityWords, ...projectWords]);
    
    return intersection.size / union.size;
  }

  private async getEntityById(entityType: string, entityId: string): Promise<any> {
    switch (entityType) {
      case 'task':
        return await prismaDataService.getTaskById(entityId);
      case 'appointment':
        return await prismaDataService.getAppointmentById(entityId);
      case 'connection':
        return await prismaDataService.getConnectionById(entityId);
      case 'calendar':
        return await prismaDataService.getCalendarEventById(entityId);
      default:
        return undefined;
    }
  }

  private async getProjectConnections(projectId: string): Promise<any[]> {
    const relationships = await prismaDataService.getProjectRelationships(projectId);
    const connectionIds = relationships
      .filter(r => r.relatedType === 'connection')
      .map(r => r.relatedId);
    
    const connections = [];
    for (const id of connectionIds) {
      const connection = await prismaDataService.getConnectionById(id);
      if (connection) connections.push(connection);
    }
    
    return connections;
  }

  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
}
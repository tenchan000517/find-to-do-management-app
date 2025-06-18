// 統一カンバン型定義 - 既存システムとの互換性を保持しつつ新しいアーキテクチャをサポート

import { Task, Project, User, Appointment } from '../types';

// ===== コアカンバン型定義 =====

export type KanbanItemType = 'task' | 'appointment' | 'project';

export type KanbanViewType = 
  | 'status'        // タスクステータス別
  | 'user'          // ユーザー別
  | 'project'       // プロジェクト別  
  | 'deadline'      // 期限別
  | 'processing'    // アポ処理状況別
  | 'relationship'  // アポ関係性別
  | 'phase'         // アポフェーズ別
  | 'source';       // アポ獲得元別

// ===== カンバンアイテム統一インターフェース =====

export interface BaseKanbanItem {
  id: string;
  title: string;
  description?: string;
  priority: 'A' | 'B' | 'C' | 'D';
  createdAt: string;
  updatedAt: string;
  
  // 統一担当者システム
  createdBy?: string | null;
  assignedTo?: string | null;
  creator?: User;
  assignee?: User;
  
  // Legacy fields for backward compatibility
  userId?: string;
  user?: User;
  assignedToId?: string;
}

export interface TaskKanbanItem extends BaseKanbanItem {
  type: 'task';
  status: 'IDEA' | 'PLAN' | 'DO' | 'CHECK' | 'COMPLETE' | 'KNOWLEDGE' | 'DELETE';
  projectId?: string;
  project?: Project;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  difficultyScore?: number;
  aiIssueLevel?: 'A' | 'B' | 'C' | 'D';
  summary?: string;
  collaborators?: Array<{
    id: string;
    userId: string;
    user?: User;
  }>;
}

export interface AppointmentKanbanItem extends BaseKanbanItem {
  type: 'appointment';
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  status: 'pending' | 'contacted' | 'interested' | 'not_interested' | 'scheduled';
  lastContact?: string;
  nextAction: string;
  notes: string;
  
  // 拡張フィールド
  processingStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FOLLOW_UP' | 'CLOSED';
  relationshipStatus?: 'FIRST_CONTACT' | 'RAPPORT_BUILDING' | 'TRUST_ESTABLISHED' | 'STRATEGIC_PARTNER' | 'LONG_TERM_CLIENT';
  salesPhase?: 'CONTACT' | 'MEETING' | 'PROPOSAL' | 'CONTRACT' | 'CLOSED';
  sourceType?: 'REFERRAL' | 'COLD_OUTREACH' | 'NETWORKING_EVENT' | 'INBOUND_INQUIRY' | 'SOCIAL_MEDIA' | 'EXISTING_CLIENT' | 'PARTNER_REFERRAL';
  
  scheduledDate?: string;
  scheduledTime?: string;
  meetingLocation?: string;
  contractAmount?: number;
  contractStatus?: 'DRAFT' | 'SENT' | 'NEGOTIATING' | 'SIGNED' | 'CANCELLED';
}

export interface ProjectKanbanItem extends BaseKanbanItem {
  type: 'project';
  name: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  progress: number;
  startDate: string;
  endDate?: string;
  teamMembers: string[];
  phase?: string;
  kgi?: string;
  successProbability?: number;
  activityScore?: number;
}

export type KanbanItem = TaskKanbanItem | AppointmentKanbanItem | ProjectKanbanItem;

// ===== カンバンコラム定義 =====

export interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
  color?: string;
  icon?: string;
  description?: string;
  maxItems?: number;
  user?: User; // ユーザーカンバン用
  project?: Project; // プロジェクトカンバン用
}

// ===== カンバン操作型定義 =====

export interface KanbanMoveRequest {
  itemType: KanbanItemType;
  itemId: string;
  sourceColumn: string;
  targetColumn: string;
  kanbanType?: KanbanViewType;
  userId?: string;
  projectId?: string;
  newStatus?: string;
  newAssignee?: string;
}

export interface KanbanMoveResult {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
  status?: number;
  rollbackData?: unknown;
}

// ===== カンバン設定型定義 =====

export interface KanbanConfiguration {
  viewType: KanbanViewType;
  itemType: KanbanItemType;
  columns: KanbanColumnConfig[];
  allowCrossColumnMove: boolean;
  enableOptimisticUpdates: boolean;
  enableDragAndDrop: boolean;
  showQuickActions: boolean;
  showItemCounts: boolean;
  maxItemsPerColumn?: number;
}

export interface KanbanColumnConfig {
  id: string;
  title: string;
  color?: string;
  icon?: string;
  acceptedItemTypes: KanbanItemType[];
  validTargetStatuses: string[];
  allowDropFromExternal: boolean;
  maxItems?: number;
}

// ===== カンバンフィルター型定義 =====

export interface KanbanFilter {
  users?: string[];
  projects?: string[];
  priorities?: ('A' | 'B' | 'C' | 'D')[];
  statuses?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
  tags?: string[];
}

// ===== カンバンビュー別コラム定義 =====

export const KANBAN_COLUMN_CONFIGS: Record<KanbanViewType, KanbanColumnConfig[]> = {
  status: [
    { id: 'IDEA', title: 'アイデア', color: '#f3f4f6', icon: '💡', acceptedItemTypes: ['task'], validTargetStatuses: ['IDEA'], allowDropFromExternal: true },
    { id: 'PLAN', title: '計画中', color: '#dbeafe', icon: '📋', acceptedItemTypes: ['task'], validTargetStatuses: ['PLAN'], allowDropFromExternal: true },
    { id: 'DO', title: '実行中', color: '#fef3c7', icon: '🔥', acceptedItemTypes: ['task'], validTargetStatuses: ['DO'], allowDropFromExternal: true },
    { id: 'CHECK', title: '課題・改善', color: '#fed7aa', icon: '🔍', acceptedItemTypes: ['task'], validTargetStatuses: ['CHECK'], allowDropFromExternal: true },
    { id: 'COMPLETE', title: '完了', color: '#dcfce7', icon: '✅', acceptedItemTypes: ['task'], validTargetStatuses: ['COMPLETE'], allowDropFromExternal: true },
    { id: 'KNOWLEDGE', title: 'ナレッジ昇華', color: '#e0e7ff', icon: '🧠', acceptedItemTypes: ['task'], validTargetStatuses: ['KNOWLEDGE'], allowDropFromExternal: true },
    { id: 'DELETE', title: 'リスケ', color: '#fecaca', icon: '🗑️', acceptedItemTypes: ['task'], validTargetStatuses: ['DELETE'], allowDropFromExternal: true }
  ],
  
  user: [
    { id: 'unassigned', title: '未割り当て', color: '#f3f4f6', icon: '👤', acceptedItemTypes: ['task', 'appointment', 'project'], validTargetStatuses: [], allowDropFromExternal: true }
    // 動的にユーザーカラムが追加される
  ],
  
  project: [
    { id: 'no_project', title: 'プロジェクトなし', color: '#f3f4f6', icon: '📁', acceptedItemTypes: ['task'], validTargetStatuses: [], allowDropFromExternal: true },
    { id: 'planning', title: '計画中', color: '#dbeafe', icon: '📋', acceptedItemTypes: ['project'], validTargetStatuses: ['planning'], allowDropFromExternal: true },
    { id: 'active', title: 'アクティブ', color: '#dcfce7', icon: '🚀', acceptedItemTypes: ['project'], validTargetStatuses: ['active'], allowDropFromExternal: true },
    { id: 'on_hold', title: '保留中', color: '#fed7aa', icon: '⏸️', acceptedItemTypes: ['project'], validTargetStatuses: ['on_hold'], allowDropFromExternal: true },
    { id: 'completed', title: '完了', color: '#e0e7ff', icon: '✅', acceptedItemTypes: ['project'], validTargetStatuses: ['completed'], allowDropFromExternal: true }
  ],
  
  deadline: [
    { id: 'overdue', title: '期限切れ', color: '#fecaca', icon: '🚨', acceptedItemTypes: ['task'], validTargetStatuses: [], allowDropFromExternal: false },
    { id: 'today', title: '今日', color: '#fed7aa', icon: '📅', acceptedItemTypes: ['task'], validTargetStatuses: [], allowDropFromExternal: false },
    { id: 'this_week', title: '今週', color: '#fef3c7', icon: '📆', acceptedItemTypes: ['task'], validTargetStatuses: [], allowDropFromExternal: false },
    { id: 'this_month', title: '今月', color: '#dbeafe', icon: '🗓️', acceptedItemTypes: ['task'], validTargetStatuses: [], allowDropFromExternal: false },
    { id: 'later', title: 'それ以降', color: '#e0e7ff', icon: '⏰', acceptedItemTypes: ['task'], validTargetStatuses: [], allowDropFromExternal: false },
    { id: 'no_deadline', title: '期限なし', color: '#f3f4f6', icon: '♾️', acceptedItemTypes: ['task'], validTargetStatuses: [], allowDropFromExternal: false }
  ],
  
  processing: [
    { id: 'PENDING', title: '待機中', color: '#f3f4f6', icon: '⏳', acceptedItemTypes: ['appointment'], validTargetStatuses: ['PENDING'], allowDropFromExternal: true },
    { id: 'IN_PROGRESS', title: '進行中', color: '#fef3c7', icon: '🔄', acceptedItemTypes: ['appointment'], validTargetStatuses: ['IN_PROGRESS'], allowDropFromExternal: true },
    { id: 'COMPLETED', title: '完了', color: '#dcfce7', icon: '✅', acceptedItemTypes: ['appointment'], validTargetStatuses: ['COMPLETED'], allowDropFromExternal: true },
    { id: 'FOLLOW_UP', title: 'フォローアップ', color: '#dbeafe', icon: '📞', acceptedItemTypes: ['appointment'], validTargetStatuses: ['FOLLOW_UP'], allowDropFromExternal: true },
    { id: 'CLOSED', title: 'クローズ', color: '#e0e7ff', icon: '🔒', acceptedItemTypes: ['appointment'], validTargetStatuses: ['CLOSED'], allowDropFromExternal: true }
  ],
  
  relationship: [
    { id: 'FIRST_CONTACT', title: '初回接触', color: '#f3f4f6', icon: '👋', acceptedItemTypes: ['appointment'], validTargetStatuses: ['FIRST_CONTACT'], allowDropFromExternal: true },
    { id: 'RAPPORT_BUILDING', title: '関係構築', color: '#fef3c7', icon: '🤝', acceptedItemTypes: ['appointment'], validTargetStatuses: ['RAPPORT_BUILDING'], allowDropFromExternal: true },
    { id: 'TRUST_ESTABLISHED', title: '信頼関係', color: '#dbeafe', icon: '💪', acceptedItemTypes: ['appointment'], validTargetStatuses: ['TRUST_ESTABLISHED'], allowDropFromExternal: true },
    { id: 'STRATEGIC_PARTNER', title: '戦略パートナー', color: '#dcfce7', icon: '🚀', acceptedItemTypes: ['appointment'], validTargetStatuses: ['STRATEGIC_PARTNER'], allowDropFromExternal: true },
    { id: 'LONG_TERM_CLIENT', title: '長期顧客', color: '#e0e7ff', icon: '🏆', acceptedItemTypes: ['appointment'], validTargetStatuses: ['LONG_TERM_CLIENT'], allowDropFromExternal: true }
  ],
  
  phase: [
    { id: 'CONTACT', title: '接触', color: '#f3f4f6', icon: '📞', acceptedItemTypes: ['appointment'], validTargetStatuses: ['CONTACT'], allowDropFromExternal: true },
    { id: 'MEETING', title: '商談', color: '#fef3c7', icon: '🤝', acceptedItemTypes: ['appointment'], validTargetStatuses: ['MEETING'], allowDropFromExternal: true },
    { id: 'PROPOSAL', title: '提案', color: '#dbeafe', icon: '📋', acceptedItemTypes: ['appointment'], validTargetStatuses: ['PROPOSAL'], allowDropFromExternal: true },
    { id: 'CONTRACT', title: '契約', color: '#dcfce7', icon: '📄', acceptedItemTypes: ['appointment'], validTargetStatuses: ['CONTRACT'], allowDropFromExternal: true },
    { id: 'CLOSED', title: 'クローズ', color: '#e0e7ff', icon: '✅', acceptedItemTypes: ['appointment'], validTargetStatuses: ['CLOSED'], allowDropFromExternal: true }
  ],
  
  source: [
    { id: 'REFERRAL', title: '紹介', color: '#dcfce7', icon: '🤝', acceptedItemTypes: ['appointment'], validTargetStatuses: ['REFERRAL'], allowDropFromExternal: true },
    { id: 'COLD_OUTREACH', title: '新規開拓', color: '#dbeafe', icon: '🧊', acceptedItemTypes: ['appointment'], validTargetStatuses: ['COLD_OUTREACH'], allowDropFromExternal: true },
    { id: 'NETWORKING_EVENT', title: 'イベント', color: '#fef3c7', icon: '🎉', acceptedItemTypes: ['appointment'], validTargetStatuses: ['NETWORKING_EVENT'], allowDropFromExternal: true },
    { id: 'INBOUND_INQUIRY', title: 'インバウンド', color: '#fed7aa', icon: '📨', acceptedItemTypes: ['appointment'], validTargetStatuses: ['INBOUND_INQUIRY'], allowDropFromExternal: true },
    { id: 'SOCIAL_MEDIA', title: 'SNS', color: '#e0e7ff', icon: '📱', acceptedItemTypes: ['appointment'], validTargetStatuses: ['SOCIAL_MEDIA'], allowDropFromExternal: true },
    { id: 'EXISTING_CLIENT', title: '既存顧客', color: '#f3e8ff', icon: '🔄', acceptedItemTypes: ['appointment'], validTargetStatuses: ['EXISTING_CLIENT'], allowDropFromExternal: true },
    { id: 'PARTNER_REFERRAL', title: 'パートナー紹介', color: '#f0f9ff', icon: '🤝', acceptedItemTypes: ['appointment'], validTargetStatuses: ['PARTNER_REFERRAL'], allowDropFromExternal: true }
  ]
};

// ===== カンバンアクション型定義 =====

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  action: (item: KanbanItem) => void;
  isVisible: (item: KanbanItem) => boolean;
}

// ===== カンバンUIコンポーネント props型定義 =====

export interface UniversalKanbanProps {
  itemType: KanbanItemType;
  viewType: KanbanViewType;
  items: KanbanItem[];
  users?: User[];
  projects?: Project[];
  filter?: KanbanFilter;
  configuration?: Partial<KanbanConfiguration>;
  onItemMove?: (request: KanbanMoveRequest) => Promise<KanbanMoveResult>;
  onItemClick?: (item: KanbanItem) => void;
  onQuickAction?: (action: string, item: KanbanItem) => void;
  className?: string;
}

export interface KanbanColumnProps {
  column: KanbanColumn;
  viewType: KanbanViewType;
  onItemMove: (request: KanbanMoveRequest) => Promise<KanbanMoveResult>;
  onItemClick?: (item: KanbanItem) => void;
  onQuickAction?: (action: string, item: KanbanItem) => void;
}

export interface KanbanItemCardProps {
  item: KanbanItem;
  viewType: KanbanViewType;
  onItemClick?: (item: KanbanItem) => void;
  onQuickAction?: (action: string, item: KanbanItem) => void;
  isDragging?: boolean;
}

// ===== ヘルパー関数型定義 =====

export interface KanbanDataTransformer {
  transformToKanbanItems: (rawData: (Task | Appointment | Project)[]) => KanbanItem[];
  groupItemsByColumn: (items: KanbanItem[], viewType: KanbanViewType, users?: User[], projects?: Project[]) => KanbanColumn[];
  filterItems: (items: KanbanItem[], filter: KanbanFilter) => KanbanItem[];
  sortItemsInColumn: (items: KanbanItem[], sortBy: 'priority' | 'dueDate' | 'createdAt' | 'title') => KanbanItem[];
}

// ===== カンバン統計型定義 =====

export interface KanbanMetrics {
  totalItems: number;
  itemsByType: Record<KanbanItemType, number>;
  itemsByStatus: Record<string, number>;
  itemsByPriority: Record<'A' | 'B' | 'C' | 'D', number>;
  itemsByUser: Record<string, number>;
  completionRate: number;
  averageTimeInColumn: Record<string, number>;
  bottleneckColumns: string[];
}

// ===== エクスポート用統合型 =====

export interface KanbanSystemState {
  items: KanbanItem[];
  columns: KanbanColumn[];
  configuration: KanbanConfiguration;
  filter: KanbanFilter;
  metrics: KanbanMetrics;
  isLoading: boolean;
  error?: string;
}
/**
 * 統一アイコンシステム - Lucide React
 * プロジェクト全体で使用するアイコンの一元管理
 */

import {
  // ナビゲーション・基本操作
  Calendar,
  Users,
  FolderOpen,
  FileText,
  Settings,
  Home,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  
  // ステータス・状態表示
  Circle,
  Clock,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Star,
  StarOff,
  
  // タスク管理
  Target,
  Lightbulb,
  Play,
  Eye,
  BookOpen,
  Archive,
  
  // 優先度・重要度
  ArrowUp,
  ArrowDown,
  Flag,
  Zap,
  
  // プロジェクト・進捗
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Gauge,
  
  // コミュニケーション
  MessageSquare,
  Phone,
  Mail,
  Send,
  Bell,
  BellOff,
  
  // ファイル・ドキュメント
  File,
  Folder,
  Upload,
  Download,
  Link,
  ExternalLink,
  
  // MECE関係性
  GitBranch,
  Copy,
  Share2,
  
  // カレンダー関連
  CalendarDays,
  CalendarPlus,
  CalendarCheck,
  MapPin,
  
  // アポイント・営業
  Handshake,
  Building2,
  UserPlus,
  DollarSign,
  
  // 表示・切り替え
  Grid3x3,
  List,
  Eye as ViewIcon,
  EyeOff as HideIcon,
  
  // ドラッグ&ドロップ
  GripVertical,
  Move,
  
  // その他ユーティリティ
  MoreHorizontal,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  
  type LucideIcon
} from 'lucide-react';

// タスクステータス別アイコン
export const TASK_STATUS_ICONS = {
  IDEA: Target,
  PLAN: Lightbulb,
  DO: Play,
  CHECK: AlertTriangle,
  COMPLETE: CheckCircle,
  KNOWLEDGE: BookOpen,
  DELETE: Archive
} as const;

// 優先度別アイコン
export const PRIORITY_ICONS = {
  A: Zap,          // 最優先
  B: ArrowUp,      // 重要
  C: Flag,         // 緊急
  D: Circle        // 要検討
} as const;

// ナビゲーションアイコン
export const NAVIGATION_ICONS = {
  calendar: Calendar,
  tasks: FileText,
  appointments: Users,
  projects: FolderOpen,
  dashboard: Home,
  knowledge: BookOpen,
  connections: Building2,
  settings: Settings
} as const;

// アクションアイコン
export const ACTION_ICONS = {
  add: Plus,
  edit: Edit,
  delete: Trash2,
  save: Save,
  cancel: X,
  confirm: Check,
  search: Search,
  filter: Filter,
  menu: Menu,
  more: MoreHorizontal,
  refresh: RefreshCw,
  undo: RotateCcw
} as const;

// ステータスアイコン
export const STATUS_ICONS = {
  pending: Clock,
  active: PlayCircle,
  paused: PauseCircle,
  completed: CheckCircle,
  warning: AlertTriangle,
  info: Info,
  success: Check,
  error: X
} as const;

// MECE関係性アイコン
export const MECE_ICONS = {
  transferable: Share2,
  simultaneous: Copy,
  dependent: GitBranch,
  relationship: Link
} as const;

// カレンダーアイコン
export const CALENDAR_ICONS = {
  calendar: CalendarDays,
  add_event: CalendarPlus,
  completed_event: CalendarCheck,
  location: MapPin,
  time: Clock
} as const;

// アポイントメントアイコン
export const APPOINTMENT_ICONS = {
  meeting: Handshake,
  company: Building2,
  contact: UserPlus,
  phone: Phone,
  email: Mail,
  contract: DollarSign
} as const;

// プロジェクトアイコン
export const PROJECT_ICONS = {
  project: FolderOpen,
  progress: BarChart3,
  trending_up: TrendingUp,
  trending_down: TrendingDown,
  activity: Activity,
  performance: Gauge
} as const;

// 表示切り替えアイコン
export const VIEW_ICONS = {
  grid: Grid3x3,
  list: List,
  kanban: Grid3x3,
  calendar: Calendar,
  gantt: BarChart3,
  show: ViewIcon,
  hide: HideIcon
} as const;

// 通知・コミュニケーションアイコン
export const COMMUNICATION_ICONS = {
  notification: Bell,
  notification_off: BellOff,
  message: MessageSquare,
  send: Send,
  phone: Phone,
  email: Mail
} as const;

// ドラッグ&ドロップアイコン
export const DRAG_ICONS = {
  grip: GripVertical,
  move: Move
} as const;

// ファイル・リンクアイコン
export const FILE_ICONS = {
  file: File,
  folder: Folder,
  upload: Upload,
  download: Download,
  link: Link,
  external_link: ExternalLink
} as const;

// 汎用ユーティリティアイコン
export const UTILITY_ICONS = {
  star: Star,
  star_off: StarOff,
  chevron_down: ChevronDown,
  chevron_up: ChevronUp,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  more_vertical: MoreVertical
} as const;

// 型定義
export type TaskStatusIcon = keyof typeof TASK_STATUS_ICONS;
export type PriorityIcon = keyof typeof PRIORITY_ICONS;
export type NavigationIcon = keyof typeof NAVIGATION_ICONS;
export type ActionIcon = keyof typeof ACTION_ICONS;
export type StatusIcon = keyof typeof STATUS_ICONS;

// アイコンコンポーネントの共通プロパティ
export interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

// 便利な関数
export const getTaskStatusIcon = (status: string): LucideIcon => {
  const statusKey = status as keyof typeof TASK_STATUS_ICONS;
  return TASK_STATUS_ICONS[statusKey] || Circle;
};

export const getPriorityIcon = (priority: string): LucideIcon => {
  const priorityKey = priority as keyof typeof PRIORITY_ICONS;
  return PRIORITY_ICONS[priorityKey] || Circle;
};

export const getNavigationIcon = (page: string): LucideIcon => {
  const pageKey = page as keyof typeof NAVIGATION_ICONS;
  return NAVIGATION_ICONS[pageKey] || Home;
};

// デフォルトアイコンサイズ
export const DEFAULT_ICON_SIZE = {
  small: 16,
  medium: 20,
  large: 24,
  xlarge: 32
} as const;

// アイコンカラーパレット
export const ICON_COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#94a3b8'
} as const;
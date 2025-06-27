import { UserRole } from '@prisma/client'

export const PERMISSIONS = {
  // タスク管理
  TASK_CREATE: 'task:create',
  TASK_READ: 'task:read',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  TASK_ASSIGN: 'task:assign',
  
  // プロジェクト管理
  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_MANAGE: 'project:manage',
  
  // ユーザー管理
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE: 'user:manage',
  
  // システム管理
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_CONFIG: 'system:config',
  
  // 企業機能
  ENTERPRISE_POST: 'enterprise:post',
  ENTERPRISE_MANAGE: 'enterprise:manage',
} as const

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: Object.values(PERMISSIONS),
  MANAGER: [
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_MANAGE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
  ],
  MEMBER: [
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.USER_READ,
  ],
  STUDENT: [
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.USER_READ,
  ],
  ENTERPRISE: [
    PERMISSIONS.TASK_READ,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.ENTERPRISE_POST,
    PERMISSIONS.ENTERPRISE_MANAGE,
    PERMISSIONS.USER_READ,
  ],
  GUEST: [
    PERMISSIONS.TASK_READ,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.USER_READ,
  ],
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false
}

export function hasAnyPermission(userRole: UserRole, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: UserRole, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}
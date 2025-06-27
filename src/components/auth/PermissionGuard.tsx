'use client'
import { usePermissions } from "@/lib/auth/client"
import { ReactNode } from "react"

interface PermissionGuardProps {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission } = usePermissions()
  
  let hasAccess = false
  
  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions) {
    hasAccess = requireAll 
      ? permissions.every(p => hasPermission(p))
      : hasAnyPermission(permissions)
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}

interface RoleGuardProps {
  allowedRoles: string[]
  fallback?: ReactNode
  children: ReactNode
}

export function RoleGuard({
  allowedRoles,
  fallback = null,
  children
}: RoleGuardProps) {
  const { isAdmin, isManager, isMember, isGuest, isStudent, isEnterprise } = usePermissions()
  
  const roleCheckers = {
    'ADMIN': isAdmin,
    'MANAGER': isManager,
    'MEMBER': isMember,
    'GUEST': isGuest,
    'STUDENT': isStudent,
    'ENTERPRISE': isEnterprise,
  }
  
  const hasAccess = allowedRoles.some(role => {
    const checker = roleCheckers[role as keyof typeof roleCheckers]
    return typeof checker === 'function' ? checker() : false
  })
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}
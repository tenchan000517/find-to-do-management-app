'use client'
import { useSession } from "next-auth/react"
import { UserRole } from "@prisma/client"
import { hasPermission, hasAnyPermission, PERMISSIONS } from "./permissions"

export function useAuth() {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: !!session?.user,
    role: (session?.user as any)?.role as UserRole,
  }
}

export function usePermissions() {
  const { role } = useAuth()
  
  return {
    hasPermission: (permission: string) => 
      role ? hasPermission(role, permission) : false,
    hasAnyPermission: (permissions: string[]) => 
      role ? hasAnyPermission(role, permissions) : false,
    canCreateTask: () => 
      role ? hasPermission(role, PERMISSIONS.TASK_CREATE) : false,
    canManageProject: () => 
      role ? hasPermission(role, PERMISSIONS.PROJECT_MANAGE) : false,
    canManageUsers: () => 
      role ? hasPermission(role, PERMISSIONS.USER_MANAGE) : false,
    isAdmin: () => role === 'ADMIN',
    isManager: () => role === 'MANAGER' || role === 'ADMIN',
    isMember: () => role === 'MEMBER',
    isGuest: () => role === 'GUEST',
    isStudent: () => role === 'STUDENT',
    isEnterprise: () => role === 'ENTERPRISE',
  }
}
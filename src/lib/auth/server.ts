import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { UserRole } from "@prisma/client"
import { hasPermission, hasAnyPermission } from "./permissions"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth/config"

const prisma = new PrismaClient()

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "認証が必要です" },
      { status: 401 }
    )
  }
  
  return session
}

export async function requireRole(allowedRoles: UserRole[]) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  
  const user = await prisma.users.findUnique({
    where: { id: authResult.user.id },
    select: { id: true, role: true, name: true, email: true }
  })
  
  if (!user || !allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: "権限が不足しています" },
      { status: 403 }
    )
  }
  
  return { session: authResult, user }
}

export async function requirePermission(permission: string) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  
  const user = await prisma.users.findUnique({
    where: { id: authResult.user.id },
    select: { id: true, role: true, name: true, email: true }
  })
  
  if (!user || !hasPermission(user.role, permission)) {
    return NextResponse.json(
      { error: `権限 '${permission}' が不足しています` },
      { status: 403 }
    )
  }
  
  return { session: authResult, user }
}

export async function requireAnyPermission(permissions: string[]) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  
  const user = await prisma.users.findUnique({
    where: { id: authResult.user.id },
    select: { id: true, role: true, name: true, email: true }
  })
  
  if (!user || !hasAnyPermission(user.role, permissions)) {
    return NextResponse.json(
      { error: `必要な権限のいずれかが不足しています: ${permissions.join(', ')}` },
      { status: 403 }
    )
  }
  
  return { session: authResult, user }
}

// ログインなしでも使用可能な関数（既存機能保持）
export async function getOptionalAuth() {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.id) {
      const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, name: true, email: true }
      })
      return { session, user }
    }
    return { session: null, user: null }
  } catch (error) {
    console.error('Auth check error:', error)
    return { session: null, user: null }
  }
}
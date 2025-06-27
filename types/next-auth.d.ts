import { DefaultSession, DefaultUser } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface User extends DefaultUser {
    role?: UserRole
  }
  
  interface Session extends DefaultSession {
    user: {
      id: string
      role?: UserRole
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: UserRole
  }
}
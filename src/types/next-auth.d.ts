import { UserRole } from '@/lib/constants'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
      institution?: string | null
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: UserRole
    institution?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    institution?: string | null
  }
}

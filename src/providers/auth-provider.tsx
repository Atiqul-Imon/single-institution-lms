'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { User } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch current user
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }
      return response.json()
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    if (userData) {
      setUser(userData.data)
    } else {
      setUser(null)
    }
    setIsLoading(false)
  }, [userData])

  const hasPermission = (): boolean => {
    if (!user) return false
    // This would be implemented based on your permission system
    return true // Placeholder
  }

  const hasRole = (role: string): boolean => {
    if (!user) return false
    return user.role === role
  }

  const value: AuthContextType = {
    user,
    isLoading: isLoading || userLoading,
    isAuthenticated: !!user,
    hasPermission,
    hasRole,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

interface SessionProviderWrapperProps {
  children: React.ReactNode
}

export function SessionProviderWrapper({ children }: SessionProviderWrapperProps) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  )
}

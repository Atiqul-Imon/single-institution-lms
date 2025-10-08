'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import ErrorBoundary from '@/components/ErrorBoundary'
import MobileMenu from '@/components/ui/MobileMenu'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Navigation items based on role
  const navigationItems = {
    student: [
      { name: 'Dashboard', href: '/dashboard/student', icon: '🏠' },
      { name: 'Courses', href: '/dashboard/student/courses', icon: '📚' },
      { name: 'Assignments', href: '/dashboard/student/assignments', icon: '📝' },
      { name: 'Quizzes', href: '/dashboard/student/quizzes', icon: '🎯' },
    ],
    teacher: [
      { name: 'Dashboard', href: '/dashboard/teacher', icon: '🏠' },
      { name: 'Courses', href: '/dashboard/teacher/courses', icon: '📚' },
      { name: 'Assignments', href: '/dashboard/teacher/assignments', icon: '📝' },
      { name: 'Quizzes', href: '/dashboard/teacher/quizzes', icon: '🎯' },
    ],
    super_admin: [
      { name: 'Dashboard', href: '/dashboard/admin', icon: '🏠' },
      { name: 'Users', href: '/dashboard/admin/users', icon: '👥' },
      { name: 'Institutions', href: '/dashboard/admin/institutions', icon: '🏫' },
      { name: 'Analytics', href: '/dashboard/admin/analytics', icon: '📊' },
    ],
    institution_admin: [
      { name: 'Dashboard', href: '/dashboard/admin', icon: '🏠' },
      { name: 'Users', href: '/dashboard/admin/users', icon: '👥' },
      { name: 'Courses', href: '/dashboard/admin/courses', icon: '📚' },
      { name: 'Analytics', href: '/dashboard/admin/analytics', icon: '📊' },
    ]
  }

  const navItems = navigationItems[session.user?.role as keyof typeof navigationItems] || []

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu */}
              <MobileMenu 
                items={navItems} 
                userName={session.user?.name || undefined}
                userRole={session.user?.role}
              />
              
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md md:mr-2">
                  <span className="text-white text-lg md:text-xl font-bold">B</span>
                </div>
                <span className="hidden sm:block text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  BanglaLMS
                </span>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-1 ml-8">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      <span className="hidden lg:inline">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-700 hidden sm:block truncate max-w-[120px] lg:max-w-none">
                {session.user?.name}
              </span>
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                {session.user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  )
}

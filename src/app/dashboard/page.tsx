'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/lib/constants'

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const userRole = session?.user?.role

  // Redirect based on user role
  if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.INSTITUTION_ADMIN) {
    router.push('/dashboard/admin')
  } else if (userRole === UserRole.TEACHER) {
    router.push('/dashboard/teacher')
  } else if (userRole === UserRole.STUDENT) {
    router.push('/dashboard/student')
  } else if (userRole === UserRole.PARENT) {
    router.push('/dashboard/parent')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
    </div>
  )
}

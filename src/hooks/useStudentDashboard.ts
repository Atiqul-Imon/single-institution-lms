import { useState, useEffect } from 'react'

interface Course {
  _id: string
  title: string
  subject: string
  grade: string
  teacher: {
    name: string
  }
}

interface Assignment {
  _id: string
  title: string
  dueDate: string
  course: {
    title: string
  }
}

interface DashboardStats {
  enrolledCourses: number
  pendingAssignments: number
  completedAssignments: number
  averageGrade: number
}

export function useStudentDashboard(studentId: string | undefined) {
  const [stats, setStats] = useState<DashboardStats>({
    enrolledCourses: 0,
    pendingAssignments: 0,
    completedAssignments: 0,
    averageGrade: 0
  })
  const [recentCourses, setRecentCourses] = useState<Course[]>([])
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) return

    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch enrolled courses
        const coursesResponse = await fetch('/api/students/enrolled-courses')
        const coursesData = coursesResponse.ok ? await coursesResponse.json() : { data: [] }
        const courses = coursesData.data || []
        
        setRecentCourses(courses.slice(0, 5))

        // Fetch assignments
        const assignmentsResponse = await fetch('/api/assignments')
        const assignmentsData = assignmentsResponse.ok ? await assignmentsResponse.json() : { data: [] }
        const assignments = assignmentsData.data || []

        // Fetch submissions to calculate pending assignments
        const now = new Date()
        const pendingAssignments = assignments.filter((assignment: Assignment) => {
          return new Date(assignment.dueDate) > now
        })

        // Get upcoming assignments (next 5)
        const upcoming = assignments
          .filter((a: Assignment) => new Date(a.dueDate) > now)
          .sort((a: Assignment, b: Assignment) => 
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          )
          .slice(0, 5)

        setUpcomingAssignments(upcoming)

        // Calculate stats
        setStats({
          enrolledCourses: courses.length,
          pendingAssignments: pendingAssignments.length,
          completedAssignments: assignments.length - pendingAssignments.length,
          averageGrade: 0 // TODO: Calculate from actual grades
        })

      } catch (err) {
        console.error('Dashboard data fetch error:', err)
        setError('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [studentId])

  return { stats, recentCourses, upcomingAssignments, isLoading, error }
}

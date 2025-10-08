import { useState, useEffect } from 'react'

interface Course {
  _id: string
  title: string
  subject: string
  grade: string
  students: string[]
}

interface Assignment {
  _id: string
  title: string
  dueDate: string
  course: {
    _id: string
    title: string
  }
}

interface DashboardStats {
  totalCourses: number
  totalStudents: number
  pendingGrading: number
  activeAssignments: number
}

export function useTeacherDashboard(teacherId: string | undefined) {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    pendingGrading: 0,
    activeAssignments: 0
  })
  const [recentCourses, setRecentCourses] = useState<Course[]>([])
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!teacherId) return

    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch teacher's courses
        const coursesResponse = await fetch(`/api/courses?teacherId=${teacherId}`)
        const coursesData = coursesResponse.ok ? await coursesResponse.json() : { data: [] }
        const courses = coursesData.data || []
        
        setRecentCourses(courses.slice(0, 5))

        // Calculate total students across all courses
        const totalStudents = courses.reduce((sum: number, course: Course) => 
          sum + (course.students?.length || 0), 0
        )

        // Fetch assignments
        const assignmentsResponse = await fetch(`/api/assignments?teacherId=${teacherId}`)
        const assignmentsData = assignmentsResponse.ok ? await assignmentsResponse.json() : { data: [] }
        const assignments = assignmentsData.data || []

        setRecentAssignments(assignments.slice(0, 5))

        // Calculate active assignments (not past due date)
        const now = new Date()
        const activeAssignments = assignments.filter((a: Assignment) => 
          new Date(a.dueDate) > now
        ).length

        // Fetch submissions to calculate pending grading
        let pendingGrading = 0
        for (const assignment of assignments) {
          try {
            const submissionsResponse = await fetch(`/api/assignments/${assignment._id}/submit`)
            if (submissionsResponse.ok) {
              const submissionsData = await submissionsResponse.json()
              const submissions = Array.isArray(submissionsData.data) ? submissionsData.data : []
              pendingGrading += submissions.filter((s: any) => s.status === 'submitted').length
            }
          } catch {
            // Skip if error
          }
        }

        setStats({
          totalCourses: courses.length,
          totalStudents,
          pendingGrading,
          activeAssignments
        })

      } catch (err) {
        console.error('Dashboard data fetch error:', err)
        setError('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [teacherId])

  return { stats, recentCourses, recentAssignments, isLoading, error }
}

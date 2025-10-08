'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Course {
  _id: string
  title: string
  description: string
  subject: string
  grade?: string
  academicYear: string
  isPaid: boolean
  price: number
  students: string[]
  modules: Array<{
    title: string
    description: string
    lessons: Array<{
      title: string
      description: string
      type: string
    }>
  }>
  teacher: {
    _id: string
    name: string
    email: string
  }
  institution?: {
    _id: string
    name: string
  }
  createdAt: string
}

export default function StudentCoursesPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('browse')

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchCourses(), fetchEnrolledCourses()])
      setIsLoading(false)
    }
    loadData()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.data || [])
      } else {
        setError('Failed to fetch courses')
      }
    } catch {
      setError('An error occurred while fetching courses')
    }
  }

  const fetchEnrolledCourses = async () => {
    try {
      const response = await fetch('/api/students/enrolled-courses')
      if (response.ok) {
        const data = await response.json()
        setEnrolledCourses(data.data || [])
      }
    } catch {
      // Ignore error for enrolled courses
    }
  }

  const handleEnroll = async (courseId: string) => {
    try {
      const response = await fetch('/api/students/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      })

      if (response.ok) {
        // Refresh courses to update enrollment status
        fetchCourses()
        fetchEnrolledCourses()
        alert('Successfully enrolled in the course!')
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Failed to enroll in course')
      }
    } catch {
      alert('An error occurred while enrolling')
    }
  }

  if (!session || session.user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only students can access this page.</p>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500 mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600">Browse and enroll in courses</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'browse'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Browse All Courses
          </button>
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'enrolled'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Enrolled Courses ({enrolledCourses.length})
          </button>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'browse' && (
          <div>
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
                <p className="text-gray-600">Check back later for new courses</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => {
                  const isEnrolled = enrolledCourses.some(enrolled => enrolled._id === course._id)
                  
                  return (
                    <div key={course._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                              {course.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {course.subject} {course.grade && `• ${course.grade}`}
                            </p>
                            <p className="text-sm text-gray-500 mb-2">
                              by {course.teacher.name}
                            </p>
                            {course.institution && (
                              <p className="text-xs text-gray-400">
                                {course.institution.name}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {isEnrolled ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Enrolled
                              </span>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                course.isPaid 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {course.isPaid ? `৳${course.price}` : 'Free'}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {course.description}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>{course.students.length} students</span>
                          <span>{course.modules.length} modules</span>
                        </div>

                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/student/courses/${course._id}`}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium text-center"
                          >
                            {isEnrolled ? 'Continue' : 'View Details'}
                          </Link>
                          {!isEnrolled && (
                            <button
                              onClick={() => handleEnroll(course._id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium"
                            >
                              Enroll
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'enrolled' && (
          <div>
            {enrolledCourses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🎓</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No enrolled courses</h3>
                <p className="text-gray-600 mb-4">Browse courses to get started with your learning journey</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Browse Courses
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course) => (
                  <div key={course._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {course.subject} {course.grade && `• ${course.grade}`}
                          </p>
                          <p className="text-sm text-gray-500 mb-2">
                            by {course.teacher.name}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Enrolled
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {course.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{course.modules.length} modules</span>
                        <span>Progress: 0%</span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>

                      <Link
                        href={`/dashboard/student/courses/${course._id}`}
                        className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium text-center"
                      >
                        Continue Learning
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Course {
  _id: string
  title: string
  description: string
  subject: string
  grade?: string
  academicYear: string
  isPublished: boolean
  isPaid: boolean
  price: number
  students: string[]
  modules: Array<{
    title: string
    description: string
    lessons: Array<{
      title: string
      description: string
      type: 'video' | 'text' | 'quiz'
      content?: string
      videoUrl?: string
      duration?: number
    }>
  }>
  createdAt: string
  updatedAt: string
  teacher: {
    _id: string
    name: string
    email: string
  }
  institution?: {
    _id: string
    name: string
  }
}

export default function CourseDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const _router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const courseId = params.id as string

  const fetchCourse = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data.data)
      } else {
        setError('Failed to fetch course')
      }
    } catch {
      setError('An error occurred while fetching course')
    } finally {
      setIsLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (courseId) {
      fetchCourse()
    }
  }, [courseId, fetchCourse])

  const handlePublishToggle = async () => {
    if (!course) return

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !course.isPublished
        }),
      })

      if (response.ok) {
        setCourse(prev => prev ? { ...prev, isPublished: !prev.isPublished } : null)
      } else {
        setError('Failed to update course status')
      }
    } catch {
      setError('An error occurred while updating course')
    }
  }

  if (!session || session.user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only teachers can access this page.</p>
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

  if (!course) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
        <p className="text-gray-600 mb-4">The course you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Link href="/dashboard/teacher/courses" className="text-indigo-600 hover:text-indigo-500">
          Back to Courses
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link
              href="/dashboard/teacher/courses"
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              ← Back to Courses
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-600 mt-1">
            {course.subject} {course.grade && `• ${course.grade}`} • {course.academicYear}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handlePublishToggle}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              course.isPublished
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {course.isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <Link
            href={`/dashboard/teacher/courses/${courseId}/edit`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Edit Course
          </Link>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center space-x-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          course.isPublished 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {course.isPublished ? 'Published' : 'Draft'}
        </span>
        {course.isPaid && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Paid Course - ৳{course.price}
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'content', name: 'Content', icon: '📚' },
            { id: 'students', name: 'Students', icon: '👥' },
            { id: 'analytics', name: 'Analytics', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Course Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Description</h2>
              <p className="text-gray-600 leading-relaxed">{course.description}</p>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <span className="text-blue-600 text-2xl">📚</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Modules</p>
                    <p className="text-2xl font-semibold text-gray-900">{course.modules.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <span className="text-green-600 text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Students</p>
                    <p className="text-2xl font-semibold text-gray-900">{course.students.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <span className="text-purple-600 text-2xl">🎯</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Lessons</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {course.modules.reduce((sum, module) => sum + module.lessons.length, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <span className="text-yellow-600 text-2xl">📅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Created</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            {course.modules.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
                <p className="text-gray-600 mb-4">Add modules to organize your course content</p>
                <Link
                  href={`/dashboard/teacher/courses/${courseId}/edit`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add Content
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {course.modules.map((module, moduleIndex) => (
                  <div key={moduleIndex} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Module {moduleIndex + 1}: {module.title}
                        </h3>
                        <p className="text-gray-600">{module.description}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {module.lessons.length} lessons
                      </span>
                    </div>

                    <div className="space-y-3">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lessonIndex} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                lesson.type === 'video' ? 'bg-blue-100 text-blue-600' :
                                lesson.type === 'quiz' ? 'bg-purple-100 text-purple-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {lesson.type === 'video' ? '🎥' : lesson.type === 'quiz' ? '❓' : '📄'}
                              </span>
                              <div>
                                <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                                <p className="text-sm text-gray-600">{lesson.description}</p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 capitalize">
                              {lesson.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Enrolled Students</h2>
              <span className="text-sm text-gray-500">{course.students.length} students</span>
            </div>

            {course.students.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled yet</h3>
                <p className="text-gray-600">Students will appear here once they enroll in your course</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* This would typically fetch student details from the API */}
                {course.students.map((studentId, index) => (
                  <div key={studentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-medium">
                          Student {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Student {index + 1}</p>
                        <p className="text-sm text-gray-600">Enrolled recently</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Progress: 0%</span>
                      <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-medium">0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Time Spent</span>
                    <span className="font-medium">0 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Students</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Quiz Score</span>
                    <span className="font-medium">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assignments Submitted</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Rating</span>
                    <span className="font-medium">N/A</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-center py-4">
                  <div className="text-gray-400 text-2xl mb-2">📊</div>
                  <p className="text-gray-600 text-sm">No recent activity</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

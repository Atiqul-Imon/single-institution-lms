'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
      type: string
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

export default function TeacherCoursesPage() {
  const { data: session } = useSession()
  const _router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.data)
      } else {
        setError('Failed to fetch courses')
      }
    } catch {
      setError('An error occurred while fetching courses')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishToggle = async (courseId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !currentStatus
        }),
      })

      if (response.ok) {
        // Update the local state
        setCourses(prev => prev.map(course => 
          course._id === courseId 
            ? { ...course, isPublished: !currentStatus }
            : course
        ))
      } else {
        setError('Failed to update course status')
      }
    } catch {
      setError('An error occurred while updating course')
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCourses(prev => prev.filter(course => course._id !== courseId))
      } else {
        setError('Failed to delete course')
      }
    } catch {
      setError('An error occurred while deleting course')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600">Manage and organize your courses</p>
        </div>
        <Link
          href="/dashboard/teacher/courses/create"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Create New Course
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-4">Create your first course to get started</p>
          <Link
            href="/dashboard/teacher/courses/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
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
                    <p className="text-sm text-gray-500">
                      {course.academicYear}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      course.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                    {course.isPaid && (
                      <span className="text-sm font-medium text-green-600">
                        ৳{course.price}
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
                    href={`/dashboard/teacher/courses/${course._id}`}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium text-center"
                  >
                    Manage
                  </Link>
                  <button
                    onClick={() => handlePublishToggle(course._id, course.isPublished)}
                    className={`px-3 py-2 rounded text-sm font-medium ${
                      course.isPublished
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {course.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <span className="text-indigo-600 text-xl">📚</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courses.filter(c => c.isPublished).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-xl">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Drafts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courses.filter(c => !c.isPublished).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courses.reduce((sum, course) => sum + course.students.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

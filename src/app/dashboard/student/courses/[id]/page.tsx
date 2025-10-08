'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
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
      type: 'video' | 'text' | 'quiz'
      content?: string
      videoUrl?: string
      duration?: number
    }>
  }>
  createdAt: string
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

export default function StudentCourseDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [isEnrolled, setIsEnrolled] = useState(false)

  const courseId = params.id as string

  const fetchCourse = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data.data)
        setIsEnrolled(data.data.students.includes(session?.user?.id))
      } else {
        setError('Failed to fetch course')
      }
    } catch {
      setError('An error occurred while fetching course')
    } finally {
      setIsLoading(false)
    }
  }, [courseId, session?.user?.id])

  useEffect(() => {
    if (courseId) {
      fetchCourse()
    }
  }, [courseId, fetchCourse])

  const handleEnroll = async () => {
    try {
      const response = await fetch('/api/students/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      })

      if (response.ok) {
        setIsEnrolled(true)
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

  if (!course) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
        <p className="text-gray-600 mb-4">The course you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Link href="/dashboard/student/courses" className="text-indigo-600 hover:text-indigo-500">
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
              href="/dashboard/student/courses"
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              ← Back to Courses
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-600 mt-1">
            {course.subject} {course.grade && `• ${course.grade}`} • {course.academicYear}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            by {course.teacher.name}
            {course.institution && ` • ${course.institution.name}`}
          </p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          {isEnrolled ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Enrolled
            </span>
          ) : (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              course.isPaid 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {course.isPaid ? `৳${course.price}` : 'Free'}
            </span>
          )}
          {!isEnrolled && (
            <button
              onClick={handleEnroll}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-sm font-medium"
            >
              {course.isPaid ? `Enroll for ৳${course.price}` : 'Enroll for Free'}
            </button>
          )}
        </div>
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
            { id: 'content', name: 'Course Content', icon: '📚' },
            { id: 'progress', name: 'Progress', icon: '📈' }
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course Description */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Course</h2>
                <p className="text-gray-600 leading-relaxed">{course.description}</p>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <span className="text-blue-600 text-xl">📚</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Modules</p>
                      <p className="text-2xl font-semibold text-gray-900">{course.modules.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <span className="text-green-600 text-xl">👥</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Students</p>
                      <p className="text-2xl font-semibold text-gray-900">{course.students.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <span className="text-purple-600 text-xl">🎯</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Lessons</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {course.modules.reduce((sum, module) => sum + module.lessons.length, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Subject</dt>
                    <dd className="text-sm text-gray-900">{course.subject}</dd>
                  </div>
                  {course.grade && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Grade Level</dt>
                      <dd className="text-sm text-gray-900">{course.grade}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Academic Year</dt>
                    <dd className="text-sm text-gray-900">{course.academicYear}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Instructor</dt>
                    <dd className="text-sm text-gray-900">{course.teacher.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Created</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Enrollment CTA */}
              {!isEnrolled && (
                <div className="bg-indigo-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-2">Ready to Start?</h3>
                  <p className="text-indigo-700 text-sm mb-4">
                    Join {course.students.length} other students in this course
                  </p>
                  <button
                    onClick={handleEnroll}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {course.isPaid ? `Enroll for ৳${course.price}` : 'Enroll for Free'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            {!isEnrolled ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔒</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Course Content Locked</h3>
                <p className="text-gray-600 mb-4">Enroll in this course to access the content</p>
                <button
                  onClick={handleEnroll}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {course.isPaid ? `Enroll for ৳${course.price}` : 'Enroll for Free'}
                </button>
              </div>
            ) : course.modules.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                <p className="text-gray-600">The instructor hasn&apos;t added any content to this course yet</p>
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
                        <div key={lessonIndex} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3 flex-1">
                              <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-medium shadow-sm ${
                                lesson.type === 'video' ? 'bg-blue-100 text-blue-600' :
                                lesson.type === 'document' ? 'bg-red-100 text-red-600' :
                                lesson.type === 'quiz' ? 'bg-purple-100 text-purple-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {lesson.type === 'video' ? '🎥' : 
                                 lesson.type === 'document' ? '📄' : 
                                 lesson.type === 'quiz' ? '❓' : '📝'}
                              </span>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                                <p className="text-sm text-gray-600">{lesson.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {lesson.duration && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {lesson.duration} min
                                </span>
                              )}
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
                                {lesson.type}
                              </span>
                            </div>
                          </div>

                          {/* Lesson Content Display */}
                          {isEnrolled && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              {lesson.type === 'text' && lesson.content && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                    {lesson.content}
                                  </div>
                                </div>
                              )}

                              {lesson.type === 'video' && lesson.videoUrl && (
                                <div>
                                  {lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be') ? (
                                    <div className="aspect-video">
                                      <iframe
                                        src={lesson.videoUrl.replace('watch?v=', 'embed/')}
                                        className="w-full h-full rounded-lg"
                                        allowFullScreen
                                        title={lesson.title}
                                      ></iframe>
                                    </div>
                                  ) : (
                                    <video 
                                      controls 
                                      className="w-full rounded-lg"
                                      src={lesson.videoUrl}
                                    >
                                      Your browser does not support the video tag.
                                    </video>
                                  )}
                                </div>
                              )}

                              {lesson.type === 'document' && lesson.documentUrl && (
                                <div>
                                  <a
                                    href={lesson.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md"
                                  >
                                    <span className="mr-2">📄</span>
                                    View/Download PDF
                                  </a>
                                  <p className="text-xs text-gray-500 mt-2">Click to view or download the document</p>
                                </div>
                              )}

                              {lesson.type === 'quiz' && (
                                <div>
                                  <Link
                                    href="/dashboard/student/quizzes"
                                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md"
                                  >
                                    <span className="mr-2">🎯</span>
                                    Go to Quizzes
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            {!isEnrolled ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Data</h3>
                <p className="text-gray-600 mb-4">Enroll in this course to track your progress</p>
                <button
                  onClick={handleEnroll}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {course.isPaid ? `Enroll for ৳${course.price}` : 'Enroll for Free'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Course Completion</span>
                        <span>0%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Lessons Completed</span>
                        <span>0 / {course.modules.reduce((sum, module) => sum + module.lessons.length, 0)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Progress</h3>
                  <div className="space-y-3">
                    {course.modules.map((module, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Module {index + 1}</span>
                          <span>0%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

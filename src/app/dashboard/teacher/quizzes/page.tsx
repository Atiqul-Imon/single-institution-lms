'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Quiz {
  _id: string
  title: string
  description: string
  course: {
    _id: string
    title: string
    subject: string
    grade: string
  }
  totalPoints: number
  timeLimit: number
  passingPercentage: number
  attemptsAllowed: number
  isPublished: boolean
  dueDate?: string
  questions: Array<{ type: string; points: number }>
  createdAt: string
  updatedAt: string
}

export default function TeacherQuizzesPage() {
  const { data: session } = useSession()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, published, draft

  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/quizzes?teacherId=${session?.user?.id}`)
      if (response.ok) {
        const data = await response.json()
        let filteredQuizzes = data.data

        // Apply filter
        if (filter === 'published') {
          filteredQuizzes = data.data.filter((quiz: Quiz) => quiz.isPublished)
        } else if (filter === 'draft') {
          filteredQuizzes = data.data.filter((quiz: Quiz) => !quiz.isPublished)
        }

        setQuizzes(filteredQuizzes)
      } else {
        setError('Failed to fetch quizzes')
      }
    } catch {
      setError('An error occurred while fetching quizzes')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, filter])

  useEffect(() => {
    if (session?.user?.id) {
      fetchQuizzes()
    }
  }, [fetchQuizzes, session?.user?.id])

  const handleDelete = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone and all student attempts will be deleted.')) {
      return
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setQuizzes(prev => prev.filter(q => q._id !== quizId))
        alert('Quiz deleted successfully')
      } else {
        alert('Failed to delete quiz')
      }
    } catch {
      alert('An error occurred while deleting the quiz')
    }
  }

  const handleTogglePublish = async (quizId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPublished: !currentStatus })
      })

      if (response.ok) {
        setQuizzes(prev => prev.map(q => 
          q._id === quizId ? { ...q, isPublished: !currentStatus } : q
        ))
        alert(`Quiz ${!currentStatus ? 'published' : 'unpublished'} successfully`)
      } else {
        alert('Failed to update quiz status')
      }
    } catch {
      alert('An error occurred while updating the quiz')
    }
  }

  if (!session || (session.user.role !== 'teacher' && session.user.role !== 'super_admin' && session.user.role !== 'institution_admin')) {
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
          <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-gray-600">Manage your course quizzes</p>
        </div>
        <Link
          href="/dashboard/teacher/quizzes/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Quiz
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', name: 'All Quizzes', count: quizzes.length },
            { id: 'published', name: 'Published', count: quizzes.filter(q => q.isPublished).length },
            { id: 'draft', name: 'Draft', count: quizzes.filter(q => !q.isPublished).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No quizzes yet' : 
             filter === 'published' ? 'No published quizzes' : 'No draft quizzes'}
          </h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' ? 'Create your first quiz to get started' :
             filter === 'published' ? 'Publish some quizzes to see them here' :
             'Create quizzes and they will appear here as drafts'}
          </p>
          {filter === 'all' || filter === 'draft' ? (
            <Link
              href="/dashboard/teacher/quizzes/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Quiz
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => {
            const isOverdue = quiz.dueDate && new Date(quiz.dueDate) < new Date()
            const dueDate = quiz.dueDate ? new Date(quiz.dueDate) : null
            
            return (
              <div key={quiz._id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {quiz.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          quiz.isPublished 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {quiz.isPublished ? 'Published' : 'Draft'}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Overdue
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {quiz.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Course:</span>
                          <p className="text-gray-900">{quiz.course.title}</p>
                          <p className="text-xs">{quiz.course.subject} • {quiz.course.grade}</p>
                        </div>
                        <div>
                          <span className="font-medium">Questions:</span>
                          <p className="text-gray-900">{quiz.questions.length} questions</p>
                          <p className="text-xs">{quiz.totalPoints} points</p>
                        </div>
                        <div>
                          <span className="font-medium">Time Limit:</span>
                          <p className="text-gray-900">{quiz.timeLimit} minutes</p>
                          <p className="text-xs">Pass: {quiz.passingPercentage}%</p>
                        </div>
                        <div>
                          <span className="font-medium">Attempts:</span>
                          <p className="text-gray-900">{quiz.attemptsAllowed} allowed</p>
                          {dueDate && (
                            <p className="text-xs">{dueDate.toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Link
                        href={`/dashboard/teacher/quizzes/${quiz._id}`}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/dashboard/teacher/quizzes/${quiz._id}/edit`}
                        className="text-gray-600 hover:text-gray-500 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/dashboard/teacher/quizzes/${quiz._id}/results`}
                        className="text-green-600 hover:text-green-500 text-sm font-medium"
                      >
                        View Results
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(quiz._id, quiz.isPublished)}
                        className={`text-sm font-medium text-left ${
                          quiz.isPublished 
                            ? 'text-yellow-600 hover:text-yellow-500' 
                            : 'text-green-600 hover:text-green-500'
                        }`}
                      >
                        {quiz.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(quiz._id)}
                        className="text-red-600 hover:text-red-500 text-sm font-medium text-left"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface Quiz {
  _id: string
  title: string
  description: string
  instructions: string
  course: {
    _id: string
    title: string
    subject: string
    grade: string
  }
  questions: Array<{
    _id: string
    questionText: string
    type: string
    points: number
    options?: Array<{ text: string; isCorrect: boolean }>
  }>
  timeLimit: number
  totalPoints: number
  passingPercentage: number
  attemptsAllowed: number
  isPublished: boolean
  dueDate?: string
  createdAt: string
}

export default function TeacherQuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const quizId = params?.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchQuiz = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/quizzes/${quizId}`)
      if (!response.ok) {
        throw new Error('Quiz not found')
      }
      const data = await response.json()
      setQuiz(data.data)
    } catch (err) {
      setError((err as Error).message || 'Failed to load quiz')
    } finally {
      setIsLoading(false)
    }
  }, [quizId])

  useEffect(() => {
    if (session?.user?.id && quizId) {
      fetchQuiz()
    }
  }, [fetchQuiz, session?.user?.id, quizId])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quiz? All student attempts will be deleted.')) {
      return
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Quiz deleted successfully')
        router.push('/dashboard/teacher/quizzes')
      } else {
        alert('Failed to delete quiz')
      }
    } catch {
      alert('An error occurred while deleting the quiz')
    }
  }

  const handleTogglePublish = async () => {
    if (!quiz) return

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPublished: !quiz.isPublished })
      })

      if (response.ok) {
        setQuiz({ ...quiz, isPublished: !quiz.isPublished })
        alert(`Quiz ${!quiz.isPublished ? 'published' : 'unpublished'} successfully`)
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

  if (error || !quiz) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {error || 'Quiz not found'}
        </h3>
        <Link
          href="/dashboard/teacher/quizzes"
          className="text-indigo-600 hover:text-indigo-500"
        >
          Back to Quizzes
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Link
            href="/dashboard/teacher/quizzes"
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium mb-2 inline-block"
          >
            ← Back to Quizzes
          </Link>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              quiz.isPublished 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {quiz.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          <p className="text-gray-600">{quiz.course.title} • {quiz.course.subject}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/teacher/quizzes/${quizId}/results`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          View Results
        </Link>
        <Link
          href={`/dashboard/teacher/quizzes/${quizId}/edit`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Edit Quiz
        </Link>
        <button
          onClick={handleTogglePublish}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            quiz.isPublished 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {quiz.isPublished ? 'Unpublish' : 'Publish'}
        </button>
        <button
          onClick={handleDelete}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
        >
          Delete Quiz
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-medium">📝</span>
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Questions</div>
              <div className="text-2xl font-semibold text-gray-900">{quiz.questions.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-medium">🎯</span>
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Total Points</div>
              <div className="text-2xl font-semibold text-gray-900">{quiz.totalPoints}</div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-medium">⏱️</span>
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Time Limit</div>
              <div className="text-2xl font-semibold text-gray-900">{quiz.timeLimit}m</div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-medium">✓</span>
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Pass Mark</div>
              <div className="text-2xl font-semibold text-gray-900">{quiz.passingPercentage}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quiz Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quiz Details</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-gray-900">{quiz.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Instructions</h3>
                <div className="text-gray-900 whitespace-pre-wrap">{quiz.instructions}</div>
              </div>
            </div>
          </div>

          {/* Questions Preview */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions</h2>
            <div className="space-y-4">
              {quiz.questions.map((question, index) => (
                <div key={question._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
                      Q{index + 1}
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium capitalize">
                      {question.type.replace('-', ' ')}
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      {question.points} point{question.points !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium mb-2">{question.questionText}</p>
                  {question.options && question.options.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {question.options.map((option, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${option.isCorrect ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          <span className={`text-sm ${option.isCorrect ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                            {option.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quiz Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quiz Settings</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Time Limit</dt>
                <dd className="text-gray-900 font-medium">{quiz.timeLimit} minutes</dd>
              </div>
              <div>
                <dt className="text-gray-500">Passing Percentage</dt>
                <dd className="text-gray-900 font-medium">{quiz.passingPercentage}%</dd>
              </div>
              <div>
                <dt className="text-gray-500">Attempts Allowed</dt>
                <dd className="text-gray-900 font-medium">{quiz.attemptsAllowed}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Total Points</dt>
                <dd className="text-gray-900 font-medium">{quiz.totalPoints}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Questions</dt>
                <dd className="text-gray-900 font-medium">{quiz.questions.length}</dd>
              </div>
              {quiz.dueDate && (
                <div>
                  <dt className="text-gray-500">Due Date</dt>
                  <dd className="text-gray-900 font-medium text-xs">
                    {new Date(quiz.dueDate).toLocaleString()}
                  </dd>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900 font-medium text-xs">
                  {new Date(quiz.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}


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
  questions: unknown[]
  dueDate?: string
  isPublished: boolean
}

interface QuizAttempt {
  _id: string
  quiz: string
  score: number
  percentage: number
  passed: boolean
  status: string
  attemptNumber: number
  submittedAt?: string
}

export default function StudentQuizzesPage() {
  const { data: session } = useSession()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [attempts, setAttempts] = useState<Map<string, QuizAttempt[]>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/quizzes')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data.data)

        // Fetch attempts for each quiz
        const attemptsMap = new Map<string, QuizAttempt[]>()
        await Promise.all(
          data.data.map(async (quiz: Quiz) => {
            try {
              const attemptsResponse = await fetch(`/api/quizzes/${quiz._id}/attempt`)
              if (attemptsResponse.ok) {
                const attemptsData = await attemptsResponse.json()
                if (attemptsData.data && Array.isArray(attemptsData.data)) {
                  attemptsMap.set(quiz._id, attemptsData.data)
                }
              }
            } catch {
              // No attempts yet
            }
          })
        )
        setAttempts(attemptsMap)
      } else {
        setError('Failed to fetch quizzes')
      }
    } catch {
      setError('An error occurred while fetching quizzes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      fetchQuizzes()
    }
  }, [fetchQuizzes, session?.user?.id])

  const getQuizStatus = (quiz: Quiz, quizAttempts?: QuizAttempt[]) => {
    const now = new Date()
    const dueDate = quiz.dueDate ? new Date(quiz.dueDate) : null
    
    if (!quizAttempts || quizAttempts.length === 0) {
      if (dueDate && now > dueDate) return 'overdue'
      return 'not-started'
    }

    const completedAttempts = quizAttempts.filter(a => a.status === 'submitted' || a.status === 'graded')
    
    if (completedAttempts.length >= quiz.attemptsAllowed) return 'completed'
    if (completedAttempts.length > 0) return 'in-progress'
    
    return 'not-started'
  }

  const getBestAttempt = (quizAttempts?: QuizAttempt[]) => {
    if (!quizAttempts || quizAttempts.length === 0) return null
    return quizAttempts.reduce((best, current) => 
      current.score > best.score ? current : best
    )
  }

  const filteredQuizzes = quizzes.filter((quiz) => {
    const quizAttempts = attempts.get(quiz._id)
    const status = getQuizStatus(quiz, quizAttempts)
    
    if (filter === 'all') return true
    if (filter === 'available') return status === 'not-started' || status === 'in-progress'
    if (filter === 'completed') return status === 'completed'
    if (filter === 'overdue') return status === 'overdue'
    
    return true
  })

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
          <h1 className="text-2xl font-bold text-gray-900">My Quizzes</h1>
          <p className="text-gray-600">Take quizzes and view your results</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', name: 'All Quizzes', count: quizzes.length },
            { id: 'available', name: 'Available', count: quizzes.filter(q => {
              const status = getQuizStatus(q, attempts.get(q._id))
              return status === 'not-started' || status === 'in-progress'
            }).length },
            { id: 'completed', name: 'Completed', count: quizzes.filter(q => 
              getQuizStatus(q, attempts.get(q._id)) === 'completed'
            ).length },
            { id: 'overdue', name: 'Overdue', count: quizzes.filter(q => 
              getQuizStatus(q, attempts.get(q._id)) === 'overdue'
            ).length }
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
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
          <p className="text-gray-600">Check back later for new quizzes from your courses.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuizzes.map((quiz) => {
            const quizAttempts = attempts.get(quiz._id) || []
            const status = getQuizStatus(quiz, quizAttempts)
            const bestAttempt = getBestAttempt(quizAttempts)
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
                          status === 'completed' ? 'bg-green-100 text-green-800' :
                          status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {status === 'completed' ? 'Completed' :
                           status === 'in-progress' ? 'In Progress' :
                           status === 'overdue' ? 'Overdue' :
                           'Not Started'}
                        </span>
                        {bestAttempt && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Best: {bestAttempt.score}/{quiz.totalPoints}
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
                        </div>
                        <div>
                          <span className="font-medium">Questions:</span>
                          <p className="text-gray-900">{quiz.questions.length} questions</p>
                        </div>
                        <div>
                          <span className="font-medium">Time Limit:</span>
                          <p className="text-gray-900">{quiz.timeLimit} minutes</p>
                        </div>
                        <div>
                          <span className="font-medium">Attempts:</span>
                          <p className="text-gray-900">{quizAttempts.length} / {quiz.attemptsAllowed}</p>
                        </div>
                      </div>

                      {dueDate && (
                        <div className="mt-3 text-sm text-gray-500">
                          <span className="font-medium">Due:</span> {dueDate.toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      {status === 'completed' ? (
                        <Link
                          href={`/dashboard/student/quizzes/${quiz._id}/result`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                        >
                          View Results
                        </Link>
                      ) : status === 'overdue' ? (
                        <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600">
                          Quiz Closed
                        </span>
                      ) : (
                        <Link
                          href={`/dashboard/student/quizzes/${quiz._id}/take`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          {quizAttempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
                        </Link>
                      )}
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


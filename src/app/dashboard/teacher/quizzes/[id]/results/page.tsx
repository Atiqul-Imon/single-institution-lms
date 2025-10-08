'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface QuizAttempt {
  _id: string
  student: {
    _id: string
    name: string
    email: string
  }
  score: number
  percentage: number
  passed: boolean
  status: string
  attemptNumber: number
  submittedAt?: string
  timeSpent?: number
}

interface ResultsData {
  quiz: {
    _id: string
    title: string
    totalPoints: number
    passingPercentage: number
  }
  attempts: QuizAttempt[]
  statistics: {
    totalAttempts: number
    gradedAttempts: number
    pendingAttempts: number
    averageScore: number
    passedCount: number
    failedCount: number
    passRate: number
  }
}

export default function QuizResultsPage() {
  const params = useParams()
  const { data: session } = useSession()
  const quizId = params?.id as string

  const [resultsData, setResultsData] = useState<ResultsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchResults = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/quizzes/${quizId}/grade`)
      if (!response.ok) {
        throw new Error('Failed to fetch results')
      }
      const data = await response.json()
      setResultsData(data.data)
    } catch (err) {
      setError((err as Error).message || 'Failed to load results')
    } finally {
      setIsLoading(false)
    }
  }, [quizId])

  useEffect(() => {
    if (session?.user?.id && quizId) {
      fetchResults()
    }
  }, [fetchResults, session?.user?.id, quizId])

  const getFilteredAttempts = () => {
    if (!resultsData) return []
    const attempts = resultsData.attempts

    if (filter === 'all') return attempts
    if (filter === 'passed') return attempts.filter(a => a.passed)
    if (filter === 'failed') return attempts.filter(a => !a.passed && a.status !== 'in-progress')
    if (filter === 'pending') return attempts.filter(a => a.status === 'submitted')

    return attempts
  }

  if (!session || (session.user.role !== 'teacher' && session.user.role !== 'super_admin' && session.user.role !== 'institution_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
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

  if (error || !resultsData) {
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

  const filteredAttempts = getFilteredAttempts()
  const { quiz, statistics } = resultsData

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
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-gray-600">Quiz Results & Statistics</p>
        </div>
        <Link
          href={`/dashboard/teacher/quizzes/${quizId}`}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          View Quiz Details
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-medium">📊</span>
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Total Attempts</div>
              <div className="text-2xl font-semibold text-gray-900">{statistics.totalAttempts}</div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-medium">✓</span>
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Passed</div>
              <div className="text-2xl font-semibold text-gray-900">{statistics.passedCount}</div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-medium">📈</span>
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Average Score</div>
              <div className="text-2xl font-semibold text-gray-900">{statistics.averageScore.toFixed(1)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-medium">%</span>
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Pass Rate</div>
              <div className="text-2xl font-semibold text-gray-900">{statistics.passRate.toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', name: 'All Attempts', count: resultsData.attempts.length },
            { id: 'passed', name: 'Passed', count: statistics.passedCount },
            { id: 'failed', name: 'Failed', count: statistics.failedCount },
            { id: 'pending', name: 'Pending', count: statistics.pendingAttempts }
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

      {/* Attempts List */}
      {filteredAttempts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No attempts to display</h3>
          <p className="text-gray-600">No students have taken this quiz yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Spent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{attempt.student.name}</div>
                        <div className="text-sm text-gray-500">{attempt.student.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {attempt.score} / {quiz.totalPoints}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{attempt.percentage.toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        attempt.passed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {attempt.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attempt.submittedAt 
                        ? new Date(attempt.submittedAt).toLocaleDateString()
                        : 'Not submitted'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attempt.timeSpent 
                        ? `${Math.floor(attempt.timeSpent / 60)}m ${attempt.timeSpent % 60}s`
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredAttempts.map((attempt) => (
              <div key={attempt._id} className="bg-white shadow rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{attempt.student.name}</h3>
                    <p className="text-xs text-gray-500">{attempt.student.email}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    attempt.passed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {attempt.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Score:</span>
                    <p className="font-medium text-gray-900">{attempt.score} / {quiz.totalPoints}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Percentage:</span>
                    <p className="font-medium text-gray-900">{attempt.percentage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Submitted:</span>
                    <p className="font-medium text-gray-900 text-xs">
                      {attempt.submittedAt 
                        ? new Date(attempt.submittedAt).toLocaleDateString()
                        : 'Not submitted'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <p className="font-medium text-gray-900 text-xs">
                      {attempt.timeSpent 
                        ? `${Math.floor(attempt.timeSpent / 60)}m ${attempt.timeSpent % 60}s`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}


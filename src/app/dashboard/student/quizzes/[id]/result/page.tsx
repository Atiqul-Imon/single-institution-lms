'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'

interface QuizAttempt {
  _id: string
  quiz: {
    _id: string
    title: string
    totalPoints: number
    passingPercentage: number
    showAnswers: boolean
    showAnswersAfterSubmission: boolean
    questions: Array<{
      _id: string
      questionText: string
      type: string
      points: number
      options?: Array<{ text: string; isCorrect?: boolean }>
      explanation?: string
    }>
  }
  score: number
  percentage: number
  passed: boolean
  answers: Array<{
    questionId: string
    answer: string | string[]
    isCorrect?: boolean
    pointsEarned?: number
  }>
  attemptNumber: number
  submittedAt?: string
  timeSpent?: number
  feedback?: string
}

export default function QuizResultPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const quizId = params?.id as string
  const attemptId = searchParams?.get('attemptId')

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAttempt = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/quizzes/${quizId}/attempt`)
      if (!response.ok) {
        throw new Error('Failed to fetch results')
      }
      const data = await response.json()
      
      // Get the specific attempt or the latest one
      const attempts = data.data || []
      if (attemptId) {
        const specificAttempt = attempts.find((a: QuizAttempt) => a._id === attemptId)
        setAttempt(specificAttempt || attempts[0])
      } else {
        setAttempt(attempts[0]) // Most recent attempt
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load results')
    } finally {
      setIsLoading(false)
    }
  }, [quizId, attemptId])

  useEffect(() => {
    if (session?.user?.id && quizId) {
      fetchAttempt()
    }
  }, [fetchAttempt, session?.user?.id, quizId])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  if (!session || session.user.role !== 'student') {
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

  if (error || !attempt) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{error || 'Results not found'}</h3>
        <Link href="/dashboard/student/quizzes" className="text-indigo-600 hover:text-indigo-500">
          Back to Quizzes
        </Link>
      </div>
    )
  }

  const showAnswers = attempt.quiz.showAnswers && attempt.quiz.showAnswersAfterSubmission

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/student/quizzes"
          className="text-indigo-600 hover:text-indigo-500 text-sm font-medium mb-2 inline-block"
        >
          ← Back to Quizzes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{attempt.quiz.title}</h1>
        <p className="text-gray-600">Quiz Results</p>
      </div>

      {/* Results Card */}
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
            attempt.passed 
              ? 'bg-green-100 border-4 border-green-500' 
              : 'bg-red-100 border-4 border-red-500'
          }`}>
            <span className="text-4xl">{attempt.passed ? '✓' : '✗'}</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {attempt.passed ? 'Passed!' : 'Not Passed'}
          </h2>
          <p className="text-gray-600">
            You scored {attempt.score} out of {attempt.quiz.totalPoints} points
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">{attempt.percentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{attempt.quiz.passingPercentage}%</div>
            <div className="text-sm text-gray-600">Pass Mark</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {attempt.timeSpent ? formatTime(attempt.timeSpent) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Time Taken</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">#{attempt.attemptNumber}</div>
            <div className="text-sm text-gray-600">Attempt</div>
          </div>
        </div>

        {attempt.feedback && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Teacher Feedback:</h3>
            <p className="text-gray-700">{attempt.feedback}</p>
          </div>
        )}
      </div>

      {/* Answers Review */}
      {showAnswers && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Answer Review</h2>
          <div className="space-y-6">
            {attempt.quiz.questions.map((question, index) => {
              const studentAnswer = attempt.answers.find(a => a.questionId === question._id)
              const isCorrect = studentAnswer?.isCorrect

              return (
                <div 
                  key={question._id} 
                  className={`border-2 rounded-lg p-4 ${
                    isCorrect === true ? 'border-green-200 bg-green-50' :
                    isCorrect === false ? 'border-red-200 bg-red-50' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
                        Q{index + 1}
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                        {question.points} pts
                      </span>
                      {isCorrect !== undefined && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isCorrect 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      )}
                    </div>
                    {studentAnswer?.pointsEarned !== undefined && (
                      <span className="text-sm font-medium text-gray-900">
                        +{studentAnswer.pointsEarned} points
                      </span>
                    )}
                  </div>

                  <p className="text-gray-900 font-medium mb-3">{question.questionText}</p>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Your Answer:</span>
                      <p className="text-sm text-gray-900 mt-1">
                        {Array.isArray(studentAnswer?.answer) 
                          ? studentAnswer?.answer.join(', ') 
                          : studentAnswer?.answer || 'No answer'}
                      </p>
                    </div>

                    {question.options && isCorrect !== undefined && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Correct Answer:</span>
                        <div className="mt-1 space-y-1">
                          {question.options
                            .filter(opt => opt.isCorrect)
                            .map((opt, idx) => (
                              <p key={idx} className="text-sm text-green-700 font-medium">
                                {opt.text}
                              </p>
                            ))}
                        </div>
                      </div>
                    )}

                    {question.explanation && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
                        <span className="text-sm font-medium text-blue-900">Explanation:</span>
                        <p className="text-sm text-blue-800 mt-1">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Link
          href="/dashboard/student/quizzes"
          className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Quizzes
        </Link>
        <Link
          href="/dashboard/student"
          className="px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}


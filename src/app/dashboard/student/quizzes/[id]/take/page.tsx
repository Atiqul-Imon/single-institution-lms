'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface Question {
  _id: string
  questionText: string
  type: 'multiple-choice' | 'true-false' | 'short-answer'
  points: number
  options?: Array<{ _id?: string; text: string }>
  explanation?: string
}

interface Quiz {
  _id: string
  title: string
  description: string
  instructions: string
  course: {
    _id: string
    title: string
  }
  questions: Question[]
  timeLimit: number
  totalPoints: number
  passingPercentage: number
  attemptsAllowed: number
}

interface Answer {
  questionId: string
  answer: string | string[]
}

export default function TakeQuizPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const quizId = params?.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [answers, setAnswers] = useState<Map<string, string | string[]>>(new Map())
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0) // in seconds
  const [startTime] = useState(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      setTimeRemaining(data.data.timeLimit * 60) // Convert minutes to seconds
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

  // Timer countdown
  useEffect(() => {
    if (!quiz || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit() // Auto-submit when time runs out
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quiz, timeRemaining])

  const setAnswer = (questionId: string, answer: string | string[]) => {
    const newAnswers = new Map(answers)
    newAnswers.set(questionId, answer)
    setAnswers(newAnswers)
  }

  const handleSubmit = async () => {
    if (!quiz || isSubmitting) return

    // Check if all questions are answered
    const unanswered = quiz.questions.filter(q => !answers.has(q._id))
    if (unanswered.length > 0 && timeRemaining > 0) {
      if (!confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) {
        return
      }
    }

    setIsSubmitting(true)

    try {
      const submissionAnswers: Answer[] = quiz.questions.map(q => ({
        questionId: q._id,
        answer: answers.get(q._id) || ''
      }))

      const response = await fetch(`/api/quizzes/${quizId}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: submissionAnswers,
          status: 'submitted',
          startedAt: startTime.toISOString()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit quiz')
      }

      const data = await response.json()
      
      // Redirect to results page
      router.push(`/dashboard/student/quizzes/${quizId}/result?attemptId=${data.data._id}`)
    } catch (err) {
      setError((err as Error).message || 'Failed to submit quiz')
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    if (!quiz) return 0
    return (answers.size / quiz.questions.length) * 100
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

  if (error || !quiz) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{error || 'Quiz not found'}</h3>
        <Link href="/dashboard/student/quizzes" className="text-indigo-600 hover:text-indigo-500">
          Back to Quizzes
        </Link>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Timer */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-gray-600">{quiz.course.title}</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${
                timeRemaining < 60 ? 'text-red-600' : 
                timeRemaining < 300 ? 'text-yellow-600' : 
                'text-indigo-600'
              }`}>
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm text-gray-500">Time Remaining</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{answers.size} of {quiz.questions.length} answered</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.questionText}
          </h2>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion._id}`}
                      value={option.text}
                      checked={answers.get(currentQuestion._id) === option.text}
                      onChange={(e) => setAnswer(currentQuestion._id, e.target.value)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-gray-900">{option.text}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'true-false' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion._id}`}
                      value={option.text}
                      checked={answers.get(currentQuestion._id) === option.text}
                      onChange={(e) => setAnswer(currentQuestion._id, e.target.value)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-gray-900 font-medium">{option.text}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'short-answer' && (
              <textarea
                value={(answers.get(currentQuestion._id) as string) || ''}
                onChange={(e) => setAnswer(currentQuestion._id, e.target.value)}
                rows={4}
                className="w-full border-2 border-gray-200 rounded-lg p-4 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your answer here..."
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </div>

            {!isLastQuestion ? (
              <button
                onClick={() => setCurrentQuestionIndex(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            )}
          </div>

          {/* Question Navigation Dots */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-indigo-600 text-white'
                    : answers.has(quiz.questions[index]._id)
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Warning for time */}
        {timeRemaining > 0 && timeRemaining < 60 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
            <p className="font-medium">⚠️ Less than 1 minute remaining!</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}


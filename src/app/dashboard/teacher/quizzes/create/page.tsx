'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Course {
  _id: string
  title: string
  subject: string
  grade: string
}

interface Question {
  id: string
  questionText: string
  type: 'multiple-choice' | 'true-false' | 'short-answer'
  points: number
  options?: Array<{ text: string; isCorrect: boolean }>
  correctAnswer?: string
  explanation?: string
}

export default function CreateQuizPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Quiz basic info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [timeLimit, setTimeLimit] = useState(30)
  const [passingPercentage, setPassingPercentage] = useState(60)
  const [attemptsAllowed, setAttemptsAllowed] = useState(1)
  const [showAnswers, setShowAnswers] = useState(true)
  const [showAnswersAfterSubmission, setShowAnswersAfterSubmission] = useState(true)
  const [randomizeQuestions, setRandomizeQuestions] = useState(false)
  const [randomizeOptions, setRandomizeOptions] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [dueDate, setDueDate] = useState('')
  
  // Questions
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  
  // UI state
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showQuestionForm, setShowQuestionForm] = useState(false)

  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch('/api/courses?teacherId=' + session?.user?.id)
      if (response.ok) {
        const data = await response.json()
        setCourses(data.data)
      }
    } catch {
      // Handle error silently
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const addQuestion = (question: Question) => {
    if (editingQuestion) {
      setQuestions(questions.map(q => q.id === question.id ? question : q))
    } else {
      setQuestions([...questions, { ...question, id: Date.now().toString() }])
    }
    setEditingQuestion(null)
    setShowQuestionForm(false)
  }

  const editQuestion = (question: Question) => {
    setEditingQuestion(question)
    setShowQuestionForm(true)
  }

  const deleteQuestion = (id: string) => {
    if (confirm('Delete this question?')) {
      setQuestions(questions.filter(q => q.id !== id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (questions.length === 0) {
      setError('Please add at least one question')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          course: selectedCourse,
          instructions,
          questions: questions.map(q => ({
            questionText: q.questionText,
            type: q.type,
            points: q.points,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation
          })),
          timeLimit,
          passingPercentage,
          attemptsAllowed,
          showAnswers,
          showAnswersAfterSubmission,
          randomizeQuestions,
          randomizeOptions,
          isPublished,
          dueDate: dueDate || undefined
        })
      })

      if (response.ok) {
        alert('Quiz created successfully!')
        router.push('/dashboard/teacher/quizzes')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create quiz')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  if (!session || (session.user.role !== 'teacher' && session.user.role !== 'super_admin' && session.user.role !== 'institution_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only teachers can create quizzes.</p>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500 mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard/teacher/quizzes"
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Quizzes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Quiz</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter quiz title"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brief description of the quiz"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions *
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Detailed instructions for students"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.title} ({course.subject} - {course.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Quiz Settings */}
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Quiz Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (minutes) *
                </label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                  min="1"
                  className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Percentage *
                </label>
                <input
                  type="number"
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(parseInt(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attempts Allowed *
                </label>
                <input
                  type="number"
                  value={attemptsAllowed}
                  onChange={(e) => setAttemptsAllowed(parseInt(e.target.value))}
                  min="1"
                  max="10"
                  className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={showAnswers}
                  onChange={(e) => setShowAnswers(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Show correct answers to students</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={showAnswersAfterSubmission}
                  onChange={(e) => setShowAnswersAfterSubmission(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Show answers after submission</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={randomizeQuestions}
                  onChange={(e) => setRandomizeQuestions(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Randomize question order</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={randomizeOptions}
                  onChange={(e) => setRandomizeOptions(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Randomize answer options</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Publish quiz immediately</span>
              </label>
            </div>
          </div>

          {/* Questions Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {questions.length} question{questions.length !== 1 ? 's' : ''} • {totalPoints} total points
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingQuestion(null)
                  setShowQuestionForm(true)
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                + Add Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-gray-400 text-5xl mb-4">❓</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                <p className="text-gray-600 mb-4">Add your first question to get started</p>
                <button
                  type="button"
                  onClick={() => setShowQuestionForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add Question
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
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
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => editQuestion(question)}
                          className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-500 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/teacher/quizzes"
              className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || questions.length === 0}
              className="px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>

      {/* Question Form Modal */}
      {showQuestionForm && (
        <QuestionFormModal
          question={editingQuestion}
          onSave={addQuestion}
          onCancel={() => {
            setShowQuestionForm(false)
            setEditingQuestion(null)
          }}
        />
      )}
    </div>
  )
}

// Question Form Modal Component
function QuestionFormModal({ 
  question, 
  onSave, 
  onCancel 
}: { 
  question: Question | null
  onSave: (question: Question) => void
  onCancel: () => void
}) {
  const [questionText, setQuestionText] = useState(question?.questionText || '')
  const [type, setType] = useState<'multiple-choice' | 'true-false' | 'short-answer'>(question?.type || 'multiple-choice')
  const [points, setPoints] = useState(question?.points || 1)
  const [options, setOptions] = useState(question?.options || [{ text: '', isCorrect: false }])
  const [correctAnswer, setCorrectAnswer] = useState(question?.correctAnswer || '')
  const [explanation, setExplanation] = useState(question?.explanation || '')

  const addOption = () => {
    setOptions([...options, { text: '', isCorrect: false }])
  }

  const updateOption = (index: number, text: string) => {
    const newOptions = [...options]
    newOptions[index].text = text
    setOptions(newOptions)
  }

  const toggleCorrect = (index: number) => {
    const newOptions = [...options]
    if (type === 'true-false' || type === 'multiple-choice') {
      // For true-false and single answer multiple choice, only one can be correct
      newOptions.forEach((opt, idx) => {
        opt.isCorrect = idx === index
      })
    } else {
      newOptions[index].isCorrect = !newOptions[index].isCorrect
    }
    setOptions(newOptions)
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, idx) => idx !== index))
  }

  const handleSave = () => {
    if (!questionText.trim()) {
      alert('Please enter question text')
      return
    }

    if (type === 'multiple-choice' && options.length < 2) {
      alert('Please add at least 2 options')
      return
    }

    if ((type === 'multiple-choice' || type === 'true-false') && !options.some(o => o.isCorrect)) {
      alert('Please mark the correct answer')
      return
    }

    onSave({
      id: question?.id || Date.now().toString(),
      questionText,
      type,
      points,
      options: (type === 'multiple-choice' || type === 'true-false') ? options : undefined,
      correctAnswer: type === 'short-answer' ? correctAnswer : undefined,
      explanation
    })
  }

  // Set default options for true-false
  useEffect(() => {
    if (type === 'true-false' && options.length !== 2) {
      setOptions([
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: false }
      ])
    }
  }, [type])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {question ? 'Edit Question' : 'Add Question'}
          </h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your question"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="short-answer">Short Answer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points *
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value))}
                min="1"
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Options for Multiple Choice and True/False */}
          {(type === 'multiple-choice' || type === 'true-false') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer Options *
              </label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={option.isCorrect}
                      onChange={() => toggleCorrect(index)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={type === 'true-false'}
                    />
                    {type === 'multiple-choice' && options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-500 p-2"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {type === 'multiple-choice' && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                >
                  + Add Option
                </button>
              )}
            </div>
          )}

          {/* Correct Answer for Short Answer */}
          {type === 'short-answer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Answer (for teacher reference)
              </label>
              <input
                type="text"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="What's the correct answer?"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Explanation (optional)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Explain the correct answer"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {question ? 'Update' : 'Add'} Question
          </button>
        </div>
      </div>
    </div>
  )
}


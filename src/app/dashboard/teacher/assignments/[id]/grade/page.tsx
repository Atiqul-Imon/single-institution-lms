'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Assignment {
  _id: string
  title: string
  description: string
  course: {
    _id: string
    title: string
    subject: string
    grade: string
  }
  dueDate: string
  totalMarks: number
  weight: number
  latePenaltyPercentage: number
  lateSubmissionAllowed: boolean
}

interface Student {
  _id: string
  name: string
  email: string
}

interface FileAttachment {
  name: string
  url: string
  size: number
  type: string
}

interface Submission {
  _id: string
  student: Student
  assignment: string
  content?: string
  attachments: FileAttachment[]
  status: 'draft' | 'submitted' | 'graded'
  grade?: number
  feedback?: string
  submittedAt?: string
  gradedAt?: string
  gradedBy?: {
    _id: string
    name: string
  }
  isLate: boolean
}

interface GradingData {
  assignment: Assignment
  submissions: Submission[]
  statistics: {
    totalSubmissions: number
    gradedSubmissions: number
    pendingSubmissions: number
    averageGrade: number
    lateSubmissions: number
    onTimeSubmissions: number
  }
}

export default function AssignmentGradingPage() {
  const params = useParams()
  const { data: session } = useSession()
  const assignmentId = params?.id as string

  const [gradingData, setGradingData] = useState<GradingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, pending, graded, late

  // Grading state
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null)
  const [gradeInput, setGradeInput] = useState<{ [key: string]: string }>({})
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({})
  const [isSubmittingGrade, setIsSubmittingGrade] = useState<string | null>(null)
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null)

  const fetchGradingData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/grade`)
      if (!response.ok) {
        throw new Error('Failed to fetch grading data')
      }
      
      const result = await response.json()
      setGradingData(result.data)
    } catch (err) {
      setError((err as Error).message || 'Failed to load grading data')
    } finally {
      setIsLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    if (session?.user?.id && assignmentId) {
      fetchGradingData()
    }
  }, [fetchGradingData, session?.user?.id, assignmentId])

  const handleGradeSubmit = async (submissionId: string) => {
    const grade = parseFloat(gradeInput[submissionId])
    const feedback = feedbackInput[submissionId] || ''

    if (isNaN(grade) || grade < 0) {
      alert('Please enter a valid grade')
      return
    }

    if (gradingData && grade > gradingData.assignment.totalMarks) {
      alert(`Grade cannot exceed ${gradingData.assignment.totalMarks}`)
      return
    }

    setIsSubmittingGrade(submissionId)

    try {
      const response = await fetch(`/api/assignments/${assignmentId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId,
          grade,
          feedback
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit grade')
      }

      // Refresh grading data
      await fetchGradingData()
      
      // Clear inputs
      setGradeInput({ ...gradeInput, [submissionId]: '' })
      setFeedbackInput({ ...feedbackInput, [submissionId]: '' })
      setGradingSubmission(null)
      
      alert('Grade submitted successfully!')
    } catch (err) {
      alert((err as Error).message || 'Failed to submit grade')
    } finally {
      setIsSubmittingGrade(null)
    }
  }

  const calculateFinalGrade = (submission: Submission, inputGrade: string) => {
    const grade = parseFloat(inputGrade)
    if (isNaN(grade) || !gradingData) return grade

    if (submission.isLate && gradingData.assignment.latePenaltyPercentage > 0) {
      const penalty = (grade * gradingData.assignment.latePenaltyPercentage) / 100
      return Math.max(0, grade - penalty)
    }
    return grade
  }

  const getFilteredSubmissions = () => {
    if (!gradingData) return []

    const submissions = gradingData.submissions

    if (filter === 'all') return submissions
    if (filter === 'pending') return submissions.filter(s => s.status === 'submitted')
    if (filter === 'graded') return submissions.filter(s => s.status === 'graded')
    if (filter === 'late') return submissions.filter(s => s.isLate)

    return submissions
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

  if (error || !gradingData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {error || 'Assignment not found'}
        </h3>
        <Link
          href="/dashboard/teacher/assignments"
          className="text-indigo-600 hover:text-indigo-500"
        >
          Back to Assignments
        </Link>
      </div>
    )
  }

  const filteredSubmissions = getFilteredSubmissions()
  const { assignment, statistics } = gradingData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Link
            href="/dashboard/teacher/assignments"
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium mb-2 inline-block"
          >
            ← Back to Assignments
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          <p className="text-gray-600">{assignment.course.title}</p>
          <div className="mt-2 text-sm text-gray-500">
            <span>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
            <span className="mx-2">•</span>
            <span>{assignment.totalMarks} points</span>
            <span className="mx-2">•</span>
            <span>Weight: {assignment.weight}%</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/teacher/assignments/${assignmentId}`}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            View Details
          </Link>
          <Link
            href={`/dashboard/teacher/assignments/${assignmentId}/edit`}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Edit Assignment
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Submissions
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {statistics.totalSubmissions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">⏳</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Grading
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {statistics.pendingSubmissions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Graded
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {statistics.gradedSubmissions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📈</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Grade
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {statistics.averageGrade > 0 ? statistics.averageGrade.toFixed(1) : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', name: 'All Submissions', count: gradingData.submissions.length },
            { id: 'pending', name: 'Pending', count: statistics.pendingSubmissions },
            { id: 'graded', name: 'Graded', count: statistics.gradedSubmissions },
            { id: 'late', name: 'Late', count: statistics.lateSubmissions }
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

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No submissions to display
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'No students have submitted this assignment yet.' 
              : `No ${filter} submissions found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => {
            const isExpanded = expandedSubmission === submission._id
            const isGrading = gradingSubmission === submission._id
            const currentGrade = gradeInput[submission._id] || submission.grade?.toString() || ''
            const finalGrade = calculateFinalGrade(submission, currentGrade)

            return (
              <div 
                key={submission._id} 
                className="bg-white rounded-lg shadow-md border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {submission.student.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          submission.status === 'graded' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.status === 'graded' ? 'Graded' : 'Pending'}
                        </span>
                        {submission.isLate && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Late Submission
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{submission.student.email}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Submitted:</span>
                          <p className="text-gray-900 font-medium">
                            {submission.submittedAt 
                              ? new Date(submission.submittedAt).toLocaleString()
                              : 'Not submitted'}
                          </p>
                        </div>
                        {submission.status === 'graded' && (
                          <>
                            <div>
                              <span className="text-gray-500">Grade:</span>
                              <p className="text-gray-900 font-medium">
                                {submission.grade}/{assignment.totalMarks}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Percentage:</span>
                              <p className="text-gray-900 font-medium">
                                {((submission.grade! / assignment.totalMarks) * 100).toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Graded At:</span>
                              <p className="text-gray-900 font-medium text-xs">
                                {submission.gradedAt 
                                  ? new Date(submission.gradedAt).toLocaleString()
                                  : 'N/A'}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
                          {submission.content && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Submission Content:</h4>
                              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                                {submission.content}
                              </div>
                            </div>
                          )}

                          {submission.attachments && submission.attachments.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h4>
                              <div className="space-y-2">
                                {submission.attachments.map((file, index) => (
                                  <a
                                    key={index}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-500"
                                  >
                                    <span>📎</span>
                                    <span>{file.name}</span>
                                    <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {submission.status === 'graded' && submission.feedback && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback:</h4>
                              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                                {submission.feedback}
                              </div>
                            </div>
                          )}

                          {/* Grading Form */}
                          {(isGrading || submission.status !== 'graded') && (
                            <div className="bg-indigo-50 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">
                                {submission.status === 'graded' ? 'Update Grade' : 'Grade Submission'}
                              </h4>
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Grade (out of {assignment.totalMarks}) <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={assignment.totalMarks}
                                    step="0.5"
                                    value={currentGrade}
                                    onChange={(e) => setGradeInput({ ...gradeInput, [submission._id]: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter grade"
                                  />
                                  {submission.isLate && assignment.latePenaltyPercentage > 0 && currentGrade && (
                                    <p className="text-sm text-orange-600 mt-1">
                                      Late penalty ({assignment.latePenaltyPercentage}%): Final grade will be {finalGrade.toFixed(2)}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Feedback
                                  </label>
                                  <textarea
                                    rows={4}
                                    value={feedbackInput[submission._id] || submission.feedback || ''}
                                    onChange={(e) => setFeedbackInput({ ...feedbackInput, [submission._id]: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Provide feedback to the student..."
                                  />
                                </div>

                                <div className="flex space-x-3">
                                  <button
                                    onClick={() => handleGradeSubmit(submission._id)}
                                    disabled={isSubmittingGrade === submission._id || !currentGrade}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isSubmittingGrade === submission._id 
                                      ? 'Submitting...' 
                                      : submission.status === 'graded' 
                                        ? 'Update Grade' 
                                        : 'Submit Grade'}
                                  </button>
                                  <button
                                    onClick={() => setGradingSubmission(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => setExpandedSubmission(isExpanded ? null : submission._id)}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        {isExpanded ? 'Hide Details' : 'View Details'}
                      </button>
                      {submission.status !== 'graded' && !isGrading && (
                        <button
                          onClick={() => {
                            setGradingSubmission(submission._id)
                            setExpandedSubmission(submission._id)
                          }}
                          className="text-green-600 hover:text-green-500 text-sm font-medium"
                        >
                          Grade Now
                        </button>
                      )}
                      {submission.status === 'graded' && !isGrading && (
                        <button
                          onClick={() => {
                            setGradingSubmission(submission._id)
                            setExpandedSubmission(submission._id)
                          }}
                          className="text-gray-600 hover:text-gray-500 text-sm font-medium"
                        >
                          Edit Grade
                        </button>
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


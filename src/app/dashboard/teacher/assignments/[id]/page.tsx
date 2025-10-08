'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface Assignment {
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
  module?: {
    _id: string
    title: string
  }
  type: string
  dueDate: string
  totalMarks: number
  weight: number
  submissionType: 'text' | 'file' | 'both'
  lateSubmissionAllowed: boolean
  latePenaltyPercentage: number
  plagiarismCheck: boolean
  attachments?: FileAttachment[]
  isPublished: boolean
  createdAt: string
  updatedAt: string
  submissions?: Submission[]
}

interface FileAttachment {
  name: string
  url: string
  size: number
  type: string
}

interface Submission {
  _id: string
  student: {
    _id: string
    name: string
    email: string
  }
  status: 'draft' | 'submitted' | 'graded'
  grade?: number
  submittedAt?: string
  isLate: boolean
}

export default function TeacherAssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const assignmentId = params?.id as string

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAssignment = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`)
      if (!response.ok) {
        throw new Error('Assignment not found')
      }
      const data = await response.json()
      setAssignment(data.data)
    } catch (err) {
      setError((err as Error).message || 'Failed to load assignment')
    } finally {
      setIsLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    if (session?.user?.id && assignmentId) {
      fetchAssignment()
    }
  }, [fetchAssignment, session?.user?.id, assignmentId])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone and all submissions will be deleted.')) {
      return
    }

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Assignment deleted successfully')
        router.push('/dashboard/teacher/assignments')
      } else {
        alert('Failed to delete assignment')
      }
    } catch {
      alert('An error occurred while deleting the assignment')
    }
  }

  const handleTogglePublish = async () => {
    if (!assignment) return

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPublished: !assignment.isPublished })
      })

      if (response.ok) {
        setAssignment({ ...assignment, isPublished: !assignment.isPublished })
        alert(`Assignment ${!assignment.isPublished ? 'published' : 'unpublished'} successfully`)
      } else {
        alert('Failed to update assignment status')
      }
    } catch {
      alert('An error occurred while updating the assignment')
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

  if (error || !assignment) {
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

  const dueDate = new Date(assignment.dueDate)
  const isOverdue = new Date() > dueDate

  // Calculate submission statistics
  const totalSubmissions = assignment.submissions?.length || 0
  const gradedSubmissions = assignment.submissions?.filter(s => s.status === 'graded').length || 0
  const pendingSubmissions = assignment.submissions?.filter(s => s.status === 'submitted').length || 0
  const lateSubmissions = assignment.submissions?.filter(s => s.isLate).length || 0

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
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              assignment.isPublished 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {assignment.isPublished ? 'Published' : 'Draft'}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Overdue
              </span>
            )}
          </div>
          <p className="text-gray-600">{assignment.course.title} • {assignment.course.subject}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/teacher/assignments/${assignmentId}/grade`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Grade Submissions
        </Link>
        <Link
          href={`/dashboard/teacher/assignments/${assignmentId}/edit`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Edit Assignment
        </Link>
        <button
          onClick={handleTogglePublish}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
            assignment.isPublished 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {assignment.isPublished ? 'Unpublish' : 'Publish'}
        </button>
        <button
          onClick={handleDelete}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Delete Assignment
        </button>
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
                    Submissions
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {totalSubmissions}
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
                    Pending
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {pendingSubmissions}
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
                    {gradedSubmissions}
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
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🕐</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Late
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {lateSubmissions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignment Details</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-gray-900">{assignment.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Instructions</h3>
                <div className="text-gray-900 whitespace-pre-wrap">{assignment.instructions}</div>
              </div>

              {assignment.attachments && assignment.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {assignment.attachments.map((file, index) => (
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
            </div>
          </div>

          {/* Recent Submissions */}
          {assignment.submissions && assignment.submissions.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Submissions</h2>
                <Link
                  href={`/dashboard/teacher/assignments/${assignmentId}/grade`}
                  className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
              
              <div className="space-y-3">
                {assignment.submissions.slice(0, 5).map((submission) => (
                  <div key={submission._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{submission.student.name}</p>
                      <p className="text-xs text-gray-500">
                        {submission.submittedAt 
                          ? new Date(submission.submittedAt).toLocaleString()
                          : 'Not submitted'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {submission.isLate && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Late
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        submission.status === 'graded' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {submission.status === 'graded' 
                          ? `${submission.grade}/${assignment.totalMarks}` 
                          : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Info</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Type</dt>
                <dd className="text-gray-900 font-medium capitalize">{assignment.type}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Due Date</dt>
                <dd className={`text-gray-900 font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                  {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Total Marks</dt>
                <dd className="text-gray-900 font-medium">{assignment.totalMarks} points</dd>
              </div>
              <div>
                <dt className="text-gray-500">Weight</dt>
                <dd className="text-gray-900 font-medium">{assignment.weight}%</dd>
              </div>
              <div>
                <dt className="text-gray-500">Submission Type</dt>
                <dd className="text-gray-900 font-medium capitalize">{assignment.submissionType}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Late Submissions</dt>
                <dd className="text-gray-900 font-medium">
                  {assignment.lateSubmissionAllowed 
                    ? `Allowed (${assignment.latePenaltyPercentage}% penalty)` 
                    : 'Not allowed'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Plagiarism Check</dt>
                <dd className="text-gray-900 font-medium">
                  {assignment.plagiarismCheck ? 'Enabled' : 'Disabled'}
                </dd>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900 font-medium text-xs">
                  {new Date(assignment.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="text-gray-900 font-medium text-xs">
                  {new Date(assignment.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Course Info */}
          {assignment.module && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Module</h3>
              <p className="text-gray-900 font-medium">{assignment.module.title}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


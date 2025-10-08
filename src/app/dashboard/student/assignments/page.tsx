'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

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
  module?: {
    _id: string
    title: string
  }
  type: string
  dueDate: string
  totalMarks: number
  weight: number
  submissionType: string
  lateSubmissionAllowed: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface Submission {
  _id: string
  assignment: string
  status: 'draft' | 'submitted' | 'graded'
  grade?: number
  submittedAt?: string
  isLate: boolean
}

export default function StudentAssignmentsPage() {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, pending, submitted, graded, overdue

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      // Fetch all assignments for enrolled courses
      const response = await fetch('/api/assignments')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.data)

        // Fetch submissions for each assignment
        const submissionsMap = new Map<string, Submission>()
        await Promise.all(
          data.data.map(async (assignment: Assignment) => {
            try {
              const subResponse = await fetch(`/api/assignments/${assignment._id}/submit`)
              if (subResponse.ok) {
                const subData = await subResponse.json()
                if (subData.data) {
                  submissionsMap.set(assignment._id, subData.data)
                }
              }
            } catch {
              // No submission yet
            }
          })
        )
        setSubmissions(submissionsMap)
      } else {
        setError('Failed to fetch assignments')
      }
    } catch {
      setError('An error occurred while fetching assignments')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      fetchAssignments()
    }
  }, [fetchAssignments, session?.user?.id])

  const getAssignmentStatus = (assignment: Assignment, submission?: Submission) => {
    const now = new Date()
    const dueDate = new Date(assignment.dueDate)
    
    if (submission) {
      if (submission.status === 'graded') return 'graded'
      if (submission.status === 'submitted') return 'submitted'
      if (submission.status === 'draft') return 'draft'
    }
    
    if (now > dueDate && !assignment.lateSubmissionAllowed) return 'overdue'
    if (now > dueDate && assignment.lateSubmissionAllowed) return 'late'
    
    return 'pending'
  }

  const filteredAssignments = assignments.filter((assignment) => {
    const submission = submissions.get(assignment._id)
    const status = getAssignmentStatus(assignment, submission)
    
    if (filter === 'all') return true
    if (filter === 'pending') return status === 'pending' || status === 'late' || status === 'draft'
    if (filter === 'submitted') return status === 'submitted'
    if (filter === 'graded') return status === 'graded'
    if (filter === 'overdue') return status === 'overdue'
    
    return true
  })

  const getStatusBadge = (assignment: Assignment, submission?: Submission) => {
    const status = getAssignmentStatus(assignment, submission)
    
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-blue-100 text-blue-800',
      graded: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      overdue: 'bg-red-100 text-red-800',
      late: 'bg-orange-100 text-orange-800'
    }
    
    const labels = {
      pending: 'Pending',
      submitted: 'Submitted',
      graded: 'Graded',
      draft: 'Draft',
      overdue: 'Overdue',
      late: 'Late Submission Allowed'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getFilterCounts = () => {
    const counts = {
      all: assignments.length,
      pending: 0,
      submitted: 0,
      graded: 0,
      overdue: 0
    }
    
    assignments.forEach((assignment) => {
      const submission = submissions.get(assignment._id)
      const status = getAssignmentStatus(assignment, submission)
      
      if (status === 'pending' || status === 'late' || status === 'draft') counts.pending++
      if (status === 'submitted') counts.submitted++
      if (status === 'graded') counts.graded++
      if (status === 'overdue') counts.overdue++
    })
    
    return counts
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

  const counts = getFilterCounts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-gray-600">View and submit your course assignments</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', name: 'All Assignments', count: counts.all },
            { id: 'pending', name: 'Pending', count: counts.pending },
            { id: 'submitted', name: 'Submitted', count: counts.submitted },
            { id: 'graded', name: 'Graded', count: counts.graded },
            { id: 'overdue', name: 'Overdue', count: counts.overdue }
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

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' 
              ? 'No assignments yet' 
              : `No ${filter} assignments`}
          </h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? 'Assignments from your enrolled courses will appear here.' 
              : `You don't have any ${filter} assignments at the moment.`}
          </p>
          <Link
            href="/dashboard/student/courses"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const submission = submissions.get(assignment._id)
            const isOverdue = new Date(assignment.dueDate) < new Date()
            const dueDate = new Date(assignment.dueDate)
            const now = new Date()
            const timeDiff = dueDate.getTime() - now.getTime()
            const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
            
            return (
              <div 
                key={assignment._id} 
                className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assignment.title}
                        </h3>
                        {getStatusBadge(assignment, submission)}
                        {submission?.grade !== undefined && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Grade: {submission.grade}/{assignment.totalMarks}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {assignment.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Course:</span>
                          <p className="text-gray-900">{assignment.course.title}</p>
                          <p className="text-xs">{assignment.course.subject} • {assignment.course.grade}</p>
                        </div>
                        <div>
                          <span className="font-medium">Due Date:</span>
                          <p className={`text-sm ${isOverdue ? 'text-red-600' : daysUntilDue <= 2 ? 'text-orange-600' : 'text-gray-900'}`}>
                            {dueDate.toLocaleDateString()}
                          </p>
                          <p className="text-xs">
                            {isOverdue 
                              ? `Overdue by ${Math.abs(daysUntilDue)} day(s)` 
                              : daysUntilDue === 0 
                                ? 'Due today!' 
                                : `Due in ${daysUntilDue} day(s)`}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Total Marks:</span>
                          <p className="text-gray-900">{assignment.totalMarks} points</p>
                          <p className="text-xs">Weight: {assignment.weight}%</p>
                        </div>
                        <div>
                          <span className="font-medium">Type:</span>
                          <p className="text-gray-900 capitalize">{assignment.type}</p>
                          <p className="text-xs capitalize">{assignment.submissionType} submission</p>
                        </div>
                      </div>

                      {submission?.submittedAt && (
                        <div className="mt-3 text-sm text-gray-500">
                          <span className="font-medium">Submitted:</span> {new Date(submission.submittedAt).toLocaleString()}
                          {submission.isLate && (
                            <span className="ml-2 text-orange-600 font-medium">(Late Submission)</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      <Link
                        href={`/dashboard/student/assignments/${assignment._id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {submission?.status === 'graded' 
                          ? 'View Results' 
                          : submission?.status === 'submitted' 
                            ? 'View Submission' 
                            : 'Start Assignment'}
                      </Link>
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


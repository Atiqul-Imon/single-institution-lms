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
  module: {
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

export default function TeacherAssignmentsPage() {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, published, draft

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/assignments?teacherId=${session?.user?.id}`)
      if (response.ok) {
        const data = await response.json()
        let filteredAssignments = data.data

        // Apply filter
        if (filter === 'published') {
          filteredAssignments = data.data.filter((assignment: Assignment) => assignment.isPublished)
        } else if (filter === 'draft') {
          filteredAssignments = data.data.filter((assignment: Assignment) => !assignment.isPublished)
        }

        setAssignments(filteredAssignments)
      } else {
        setError('Failed to fetch assignments')
      }
    } catch {
      setError('An error occurred while fetching assignments')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, filter])

  useEffect(() => {
    if (session?.user?.id) {
      fetchAssignments()
    }
  }, [fetchAssignments, session?.user?.id])

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAssignments(prev => prev.filter(a => a._id !== assignmentId))
        alert('Assignment deleted successfully')
      } else {
        alert('Failed to delete assignment')
      }
    } catch {
      alert('An error occurred while deleting the assignment')
    }
  }

  const handleTogglePublish = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPublished: !currentStatus })
      })

      if (response.ok) {
        setAssignments(prev => prev.map(a => 
          a._id === assignmentId ? { ...a, isPublished: !currentStatus } : a
        ))
        alert(`Assignment ${!currentStatus ? 'published' : 'unpublished'} successfully`)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">Manage your course assignments</p>
        </div>
        <Link
          href="/dashboard/teacher/assignments/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Assignment
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
          {[
            { id: 'all', name: 'All Assignments', count: assignments.length },
            { id: 'published', name: 'Published', count: assignments.filter(a => a.isPublished).length },
            { id: 'draft', name: 'Draft', count: assignments.filter(a => !a.isPublished).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
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
      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No assignments yet' : 
             filter === 'published' ? 'No published assignments' : 'No draft assignments'}
          </h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' ? 'Create your first assignment to get started' :
             filter === 'published' ? 'Publish some assignments to see them here' :
             'Create assignments and they will appear here as drafts'}
          </p>
          {filter === 'all' || filter === 'draft' ? (
            <Link
              href="/dashboard/teacher/assignments/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Assignment
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const isOverdue = new Date(assignment.dueDate) < new Date()
            const dueDate = new Date(assignment.dueDate)
            
            return (
              <div key={assignment._id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {assignment.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            assignment.isPublished 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {assignment.isPublished ? 'Published' : 'Draft'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isOverdue ? 'Overdue' : 'Active'}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {assignment.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Course:</span>
                          <p className="text-gray-900 truncate">{assignment.course.title}</p>
                          <p className="text-xs truncate">{assignment.course.subject} • {assignment.course.grade}</p>
                        </div>
                        <div>
                          <span className="font-medium">Due Date:</span>
                          <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {dueDate.toLocaleDateString()}
                          </p>
                          <p className="text-xs">{dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div>
                          <span className="font-medium">Marks:</span>
                          <p className="text-gray-900">{assignment.totalMarks} points</p>
                          <p className="text-xs">Weight: {assignment.weight}%</p>
                        </div>
                        <div>
                          <span className="font-medium">Type:</span>
                          <p className="text-gray-900 capitalize">{assignment.type}</p>
                          <p className="text-xs capitalize">{assignment.submissionType} submission</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile: Horizontal buttons, Desktop: Vertical */}
                    <div className="flex flex-row md:flex-col flex-wrap md:flex-nowrap gap-2 md:space-y-0 md:ml-4">
                      <Link
                        href={`/dashboard/teacher/assignments/${assignment._id}`}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/teacher/assignments/${assignment._id}/edit`}
                        className="text-gray-600 hover:text-gray-500 text-sm font-medium px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/dashboard/teacher/assignments/${assignment._id}/grade`}
                        className="text-green-600 hover:text-green-500 text-sm font-medium px-3 py-2 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        Grade
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(assignment._id, assignment.isPublished)}
                        className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                          assignment.isPublished 
                            ? 'text-yellow-600 hover:text-yellow-500 hover:bg-yellow-50' 
                            : 'text-green-600 hover:text-green-500 hover:bg-green-50'
                        }`}
                      >
                        {assignment.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(assignment._id)}
                        className="text-red-600 hover:text-red-500 text-sm font-medium px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
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

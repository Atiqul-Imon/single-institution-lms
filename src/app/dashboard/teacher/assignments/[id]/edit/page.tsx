'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Course {
  _id: string
  title: string
  subject: string
  grade: string
  modules: Array<{
    _id: string
    title: string
  }>
}

interface Assignment {
  _id: string
  title: string
  description: string
  instructions: string
  course: {
    _id: string
    title: string
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
  latePenaltyPercentage: number
  plagiarismCheck: boolean
  isPublished: boolean
}

export default function EditAssignmentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const assignmentId = params?.id as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [type, setType] = useState('homework')
  const [dueDate, setDueDate] = useState('')
  const [totalMarks, setTotalMarks] = useState(100)
  const [weight, setWeight] = useState(10)
  const [submissionType, setSubmissionType] = useState('both')
  const [lateSubmissionAllowed, setLateSubmissionAllowed] = useState(true)
  const [latePenaltyPercentage, setLatePenaltyPercentage] = useState(10)
  const [plagiarismCheck, setPlagiarismCheck] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch assignment data
  const fetchAssignment = useCallback(async () => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`)
      if (response.ok) {
        const data = await response.json()
        const assignment: Assignment = data.data
        
        // Populate form fields
        setTitle(assignment.title)
        setDescription(assignment.description)
        setInstructions(assignment.instructions)
        setSelectedCourse(assignment.course._id)
        setSelectedModule(assignment.module?._id || '')
        setType(assignment.type)
        
        // Format date for datetime-local input
        const date = new Date(assignment.dueDate)
        const formattedDate = date.toISOString().slice(0, 16)
        setDueDate(formattedDate)
        
        setTotalMarks(assignment.totalMarks)
        setWeight(assignment.weight)
        setSubmissionType(assignment.submissionType)
        setLateSubmissionAllowed(assignment.lateSubmissionAllowed)
        setLatePenaltyPercentage(assignment.latePenaltyPercentage)
        setPlagiarismCheck(assignment.plagiarismCheck)
        setIsPublished(assignment.isPublished)
      } else {
        setError('Failed to load assignment')
      }
    } catch (err) {
      setError('An error occurred while loading the assignment')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [assignmentId])

  // Fetch courses
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
    if (session?.user?.id) {
      fetchAssignment()
      fetchCourses()
    }
  }, [fetchAssignment, fetchCourses, session?.user?.id])

  const selectedCourseData = courses.find(course => course._id === selectedCourse)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    if (!session?.user?.id) {
      setError('User not authenticated.')
      setIsSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          instructions,
          course: selectedCourse,
          module: selectedModule || undefined,
          type,
          dueDate,
          totalMarks,
          weight,
          submissionType,
          lateSubmissionAllowed,
          latePenaltyPercentage,
          plagiarismCheck,
          isPublished
        }),
      })

      if (response.ok) {
        setSuccess('Assignment updated successfully!')
        setTimeout(() => {
          router.push(`/dashboard/teacher/assignments/${assignmentId}`)
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update assignment.')
      }
    } catch (err) {
      setError('An unexpected error occurred.')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (session.user.role !== 'teacher' && session.user.role !== 'super_admin' && session.user.role !== 'institution_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only teachers can edit assignments.</p>
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/dashboard/teacher/assignments/${assignmentId}`}
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Assignment
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Assignment</h1>
          <p className="text-gray-600 mt-2">Update assignment details and settings</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter assignment title"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Brief description of the assignment"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                Instructions *
              </label>
              <textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Detailed instructions for students"
                required
              />
            </div>
          </div>

          {/* Course and Module Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                Course *
              </label>
              <select
                id="course"
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value)
                  setSelectedModule('') // Reset module when course changes
                }}
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
              <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-2">
                Module
              </label>
              <select
                id="module"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!selectedCourse}
              >
                <option value="">Select a module (optional)</option>
                {selectedCourseData?.modules.map(module => (
                  <option key={module._id} value={module._id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignment Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="homework">Homework</option>
                <option value="project">Project</option>
                <option value="presentation">Presentation</option>
                <option value="essay">Essay</option>
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="datetime-local"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="submissionType" className="block text-sm font-medium text-gray-700 mb-2">
                Submission Type
              </label>
              <select
                id="submissionType"
                value={submissionType}
                onChange={(e) => setSubmissionType(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="both">File & Text</option>
                <option value="file">File Only</option>
                <option value="text">Text Only</option>
              </select>
            </div>
          </div>

          {/* Grading Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700 mb-2">
                Total Marks *
              </label>
              <input
                type="number"
                id="totalMarks"
                value={totalMarks}
                onChange={(e) => setTotalMarks(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
                required
              />
            </div>

            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                Weight (%) *
              </label>
              <input
                type="number"
                id="weight"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
                max="100"
                required
              />
            </div>
          </div>

          {/* Late Submission Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Late Submission Settings</h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="lateSubmissionAllowed"
                checked={lateSubmissionAllowed}
                onChange={(e) => setLateSubmissionAllowed(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="lateSubmissionAllowed" className="text-sm font-medium text-gray-700">
                Allow late submissions
              </label>
            </div>

            {lateSubmissionAllowed && (
              <div>
                <label htmlFor="latePenaltyPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                  Late Penalty (%)
                </label>
                <input
                  type="number"
                  id="latePenaltyPercentage"
                  value={latePenaltyPercentage}
                  onChange={(e) => setLatePenaltyPercentage(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max="100"
                />
              </div>
            )}
          </div>

          {/* Additional Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Additional Settings</h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="plagiarismCheck"
                checked={plagiarismCheck}
                onChange={(e) => setPlagiarismCheck(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="plagiarismCheck" className="text-sm font-medium text-gray-700">
                Enable plagiarism check
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
                Published (visible to students)
              </label>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> Changing the due date or total marks may affect existing submissions and grades. Changes to submission type will not affect already submitted work.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <Link
                href={`/dashboard/teacher/assignments/${assignmentId}`}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}


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
  modules: Array<{
    _id: string
    title: string
  }>
}

export default function CreateAssignmentPage() {
  const { data: session } = useSession()
  const router = useRouter()
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  const selectedCourseData = courses.find(course => course._id === selectedCourse)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!session?.user?.id) {
      setError('User not authenticated.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          instructions,
          course: selectedCourse,
          module: selectedModule,
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
        setSuccess('Assignment created successfully!')
        router.push('/dashboard/teacher/assignments')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create assignment.')
      }
    } catch (err) {
      setError('An unexpected error occurred.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return <p>Loading...</p>
  }

  if (session.user.role !== 'teacher' && session.user.role !== 'super_admin' && session.user.role !== 'institution_admin') {
    return <p>You do not have permission to create assignments.</p>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard/teacher/assignments"
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Assignments
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Assignment</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          {success && <p className="text-green-600 text-center">{success}</p>}
          {error && <p className="text-red-600 text-center">{error}</p>}

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
                Publish assignment immediately
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard/teacher/assignments"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Assignment'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

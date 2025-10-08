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
  attachments?: FileAttachment[]
  isPublished: boolean
  createdAt: string
}

interface FileAttachment {
  name: string
  url: string
  size: number
  type: string
}

interface Submission {
  _id: string
  assignment: string
  student: {
    _id: string
    name: string
    email: string
  }
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

export default function AssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const assignmentId = params?.id as string

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Form state
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  const fetchAssignmentAndSubmission = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Fetch assignment details
      const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`)
      if (!assignmentResponse.ok) {
        throw new Error('Assignment not found')
      }
      const assignmentData = await assignmentResponse.json()
      setAssignment(assignmentData.data)

      // Fetch submission if exists
      try {
        const submissionResponse = await fetch(`/api/assignments/${assignmentId}/submit`)
        if (submissionResponse.ok) {
          const submissionData = await submissionResponse.json()
          if (submissionData.data) {
            setSubmission(submissionData.data)
            setContent(submissionData.data.content || '')
            setUploadedFiles(submissionData.data.attachments || [])
          }
        }
      } catch {
        // No submission yet, this is fine
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load assignment')
    } finally {
      setIsLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    if (session?.user?.id && assignmentId) {
      fetchAssignmentAndSubmission()
    }
  }, [fetchAssignmentAndSubmission, session?.user?.id, assignmentId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(selectedFiles)
    }
  }

  const uploadFiles = async () => {
    if (files.length === 0) return uploadedFiles

    setUploadingFiles(true)
    const newUploadedFiles: FileAttachment[] = []

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', 'lms_uploads') // You'll need to set this up in Cloudinary

        // Upload to Cloudinary
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
          {
            method: 'POST',
            body: formData
          }
        )

        if (response.ok) {
          const data = await response.json()
          newUploadedFiles.push({
            name: file.name,
            url: data.secure_url,
            size: file.size,
            type: file.type
          })
        }
      }

      setUploadedFiles([...uploadedFiles, ...newUploadedFiles])
      setFiles([])
      return [...uploadedFiles, ...newUploadedFiles]
    } catch (err) {
      setError('Failed to upload files. Please try again.')
      return uploadedFiles
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    setIsSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      // Validate submission based on assignment requirements
      if (!isDraft && assignment) {
        if (assignment.submissionType === 'text' && !content.trim()) {
          throw new Error('Please enter your submission content')
        }
        if (assignment.submissionType === 'file' && uploadedFiles.length === 0 && files.length === 0) {
          throw new Error('Please upload at least one file')
        }
        if (assignment.submissionType === 'both' && !content.trim() && uploadedFiles.length === 0 && files.length === 0) {
          throw new Error('Please provide either text content or file attachments')
        }
      }

      // Upload any new files first
      let finalFiles = uploadedFiles
      if (files.length > 0) {
        finalFiles = await uploadFiles()
      }

      // Submit the assignment
      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          attachments: finalFiles,
          status: isDraft ? 'draft' : 'submitted'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit assignment')
      }

      const data = await response.json()
      setSubmission(data.data)
      setSuccessMessage(isDraft ? 'Draft saved successfully!' : 'Assignment submitted successfully!')
      
      // Redirect after successful submission
      if (!isDraft) {
        setTimeout(() => {
          router.push('/dashboard/student/assignments')
        }, 2000)
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to submit assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  const canSubmit = () => {
    if (!assignment) return false
    
    const now = new Date()
    const dueDate = new Date(assignment.dueDate)
    
    if (submission?.status === 'graded') return false
    if (now > dueDate && !assignment.lateSubmissionAllowed) return false
    
    return true
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

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Assignment not found</h3>
        <Link
          href="/dashboard/student/assignments"
          className="text-indigo-600 hover:text-indigo-500"
        >
          Back to Assignments
        </Link>
      </div>
    )
  }

  const dueDate = new Date(assignment.dueDate)
  const now = new Date()
  const isOverdue = now > dueDate
  const timeDiff = dueDate.getTime() - now.getTime()
  const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link
            href="/dashboard/student/assignments"
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium mb-2 inline-block"
          >
            ← Back to Assignments
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          <p className="text-gray-600">{assignment.course.title}</p>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${isOverdue ? 'text-red-600' : daysUntilDue <= 2 ? 'text-orange-600' : 'text-gray-900'}`}>
            Due: {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs text-gray-500">
            {isOverdue 
              ? `Overdue by ${Math.abs(daysUntilDue)} day(s)` 
              : daysUntilDue === 0 
                ? 'Due today!' 
                : `Due in ${daysUntilDue} day(s)`}
          </div>
          {isOverdue && assignment.lateSubmissionAllowed && (
            <div className="text-xs text-orange-600 mt-1">
              Late submission allowed ({assignment.latePenaltyPercentage}% penalty)
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

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

          {/* Graded Submission View */}
          {submission?.status === 'graded' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Grade</h2>
              
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Score</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {submission.grade}/{assignment.totalMarks}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {((submission.grade! / assignment.totalMarks) * 100).toFixed(1)}% • Weight: {assignment.weight}%
                  </div>
                  {submission.isLate && (
                    <div className="text-xs text-orange-600 mt-2">
                      Late penalty applied: {assignment.latePenaltyPercentage}%
                    </div>
                  )}
                </div>

                {submission.feedback && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Feedback</h3>
                    <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                      {submission.feedback}
                    </div>
                  </div>
                )}

                {submission.gradedBy && (
                  <div className="text-sm text-gray-500">
                    Graded by {submission.gradedBy.name} on {new Date(submission.gradedAt!).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submission Form */}
          {canSubmit() && submission?.status !== 'graded' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {submission?.status === 'submitted' ? 'Your Submission' : 'Submit Assignment'}
              </h2>

              {submission?.status === 'submitted' ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 font-medium">Assignment Submitted</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Submitted on {new Date(submission.submittedAt!).toLocaleString()}
                    </p>
                  </div>

                  {submission.content && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Your Response</h3>
                      <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                        {submission.content}
                      </div>
                    </div>
                  )}

                  {submission.attachments && submission.attachments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Submitted Files</h3>
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
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {(assignment.submissionType === 'text' || assignment.submissionType === 'both') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Response {assignment.submissionType === 'text' && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter your submission here..."
                      />
                    </div>
                  )}

                  {(assignment.submissionType === 'file' || assignment.submissionType === 'both') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        File Upload {assignment.submissionType === 'file' && <span className="text-red-500">*</span>}
                      </label>
                      
                      {uploadedFiles.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div className="flex items-center space-x-2">
                                <span>📎</span>
                                <span className="text-sm">{file.name}</span>
                              </div>
                              <button
                                onClick={() => removeUploadedFile(index)}
                                className="text-red-600 hover:text-red-500 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {files.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {files.length} file(s) selected
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleSubmit(true)}
                      disabled={isSubmitting || uploadingFiles}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Saving...' : 'Save as Draft'}
                    </button>
                    <button
                      onClick={() => handleSubmit(false)}
                      disabled={isSubmitting || uploadingFiles || !canSubmit()}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : uploadingFiles ? 'Uploading Files...' : 'Submit Assignment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!canSubmit() && submission?.status !== 'graded' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Submission Closed</p>
              <p className="text-sm text-red-600 mt-1">
                This assignment is overdue and late submissions are not allowed.
              </p>
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
                  {assignment.lateSubmissionAllowed ? `Allowed (${assignment.latePenaltyPercentage}% penalty)` : 'Not allowed'}
                </dd>
              </div>
              {submission && (
                <>
                  <div className="pt-3 border-t border-gray-200">
                    <dt className="text-gray-500">Status</dt>
                    <dd className="text-gray-900 font-medium capitalize">{submission.status}</dd>
                  </div>
                  {submission.submittedAt && (
                    <div>
                      <dt className="text-gray-500">Submitted At</dt>
                      <dd className="text-gray-900 font-medium text-xs">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}


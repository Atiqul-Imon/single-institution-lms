'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Lesson {
  title: string
  description: string
  type: 'video' | 'text' | 'document' | 'quiz'
  content?: string
  videoUrl?: string
  documentUrl?: string
  duration?: number
  file?: File
}

interface Module {
  title: string
  description: string
  lessons: Lesson[]
}

export default function CreateCoursePage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    grade: '',
    academicYear: new Date().getFullYear().toString(),
    isPaid: false,
    price: 0
  })
  
  const [modules, setModules] = useState<Module[]>([
    {
      title: '',
      description: '',
      lessons: []
    }
  ])
  
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const addModule = () => {
    setModules(prev => [...prev, {
      title: '',
      description: '',
      lessons: []
    }])
  }

  const updateModule = (index: number, field: keyof Module, value: string) => {
    setModules(prev => prev.map((module, i) => 
      i === index ? { ...module, [field]: value } : module
    ))
  }

  const removeModule = (index: number) => {
    if (modules.length > 1) {
      setModules(prev => prev.filter((_, i) => i !== index))
    }
  }

  const addLesson = (moduleIndex: number) => {
    setModules(prev => prev.map((module, i) => 
      i === moduleIndex 
        ? { ...module, lessons: [...module.lessons, { title: '', description: '', type: 'text' as const }] }
        : module
    ))
  }

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: keyof Lesson, value: unknown) => {
    setModules(prev => prev.map((module, i) => 
      i === moduleIndex 
        ? {
            ...module,
            lessons: module.lessons.map((lesson, j) => 
              j === lessonIndex ? { ...lesson, [field]: value } : lesson
            )
          }
        : module
    ))
  }

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    setModules(prev => prev.map((module, i) => 
      i === moduleIndex 
        ? { ...module, lessons: module.lessons.filter((_, j) => j !== lessonIndex) }
        : module
    ))
  }

  const handleFileSelect = (moduleIndex: number, lessonIndex: number, file: File) => {
    updateLesson(moduleIndex, lessonIndex, 'file', file)
  }

  const uploadFileToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'lms_uploads')

    const resourceType = file.type.startsWith('video/') ? 'video' : 'auto'
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData
      }
    )

    if (!response.ok) {
      throw new Error('File upload failed')
    }

    const data = await response.json()
    return data.secure_url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setUploadingFiles(true)
    setError('')

    try {
      // Upload all files first
      const modulesWithUrls = await Promise.all(
        modules.map(async (module) => ({
          title: module.title,
          description: module.description,
          lessons: await Promise.all(
            module.lessons.map(async (lesson) => {
              let uploadedUrl = ''
              
              // Upload file if exists
              if (lesson.file) {
                try {
                  uploadedUrl = await uploadFileToCloudinary(lesson.file)
                } catch (err) {
                  console.error('File upload error:', err)
                  throw new Error(`Failed to upload file for lesson: ${lesson.title}`)
                }
              }

              // Determine the URL based on lesson type
              let finalContent = lesson.content || ''
              let finalVideoUrl = lesson.videoUrl || ''
              let finalDocumentUrl = lesson.documentUrl || ''

              if (uploadedUrl) {
                if (lesson.type === 'video') {
                  finalVideoUrl = uploadedUrl
                } else if (lesson.type === 'document') {
                  finalDocumentUrl = uploadedUrl
                }
              }

              return {
                title: lesson.title,
                description: lesson.description,
                type: lesson.type,
                content: finalContent,
                videoUrl: finalVideoUrl,
                documentUrl: finalDocumentUrl,
                duration: lesson.duration || 0
              }
            })
          )
        }))
      )

      setUploadingFiles(false)

      // Create course
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          modules: modulesWithUrls.filter(module => module.title.trim() !== ''),
          price: formData.isPaid ? parseFloat(formData.price.toString()) : 0
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert('Course created successfully!')
        router.push(`/dashboard/teacher/courses/${result.data._id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create course')
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
      setUploadingFiles(false)
    }
  }

  if (!session || session.user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only teachers can create courses.</p>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500 mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard/teacher/courses"
          className="text-indigo-600 hover:text-indigo-500 text-sm font-medium mb-2 inline-block"
        >
          ← Back to Courses
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
        <p className="text-gray-600 mt-2">Build and structure your course content with videos, documents, and lessons</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Mathematics for SSC"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="e.g., Mathematics"
              />
            </div>

            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                Grade/Class
              </label>
              <input
                type="text"
                id="grade"
                name="grade"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.grade}
                onChange={handleInputChange}
                placeholder="e.g., Class 10, SSC, HSC"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Course Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what students will learn in this course..."
              />
            </div>

            <div>
              <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <input
                type="text"
                id="academicYear"
                name="academicYear"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.academicYear}
                onChange={handleInputChange}
                placeholder="e.g., 2025"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing</h2>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="isPaid"
                checked={formData.isPaid}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">This is a paid course</span>
            </label>

            {formData.isPaid && (
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (৳ BDT) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  min="0"
                  step="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Enter price in Taka"
                />
              </div>
            )}
          </div>
        </div>

        {/* Course Modules */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
            <button
              type="button"
              onClick={addModule}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-md"
            >
              + Add Module
            </button>
          </div>

          <div className="space-y-6">
            {modules.map((module, moduleIndex) => (
              <div key={moduleIndex} className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Module {moduleIndex + 1}</h3>
                  {modules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeModule(moduleIndex)}
                      className="text-red-600 hover:text-red-500 text-sm font-medium"
                    >
                      Remove Module
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Module Title *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={module.title}
                      onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                      placeholder="e.g., Introduction to Algebra"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Module Description
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={module.description}
                      onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                      placeholder="Brief description of this module"
                    />
                  </div>
                </div>

                {/* Lessons */}
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-900">Lessons</h4>
                    <button
                      type="button"
                      onClick={() => addLesson(moduleIndex)}
                      className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                      + Add Lesson
                    </button>
                  </div>

                  {module.lessons.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500 text-sm mb-2">No lessons added yet</p>
                      <button
                        type="button"
                        onClick={() => addLesson(moduleIndex)}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        Add your first lesson
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lessonIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
                              Lesson {lessonIndex + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeLesson(moduleIndex, lessonIndex)}
                              className="text-red-600 hover:text-red-500 text-sm"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Lesson Title *
                              </label>
                              <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={lesson.title}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                                placeholder="Lesson title"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Lesson Type *
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={lesson.type}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'type', e.target.value)}
                              >
                                <option value="text">Text Content</option>
                                <option value="video">Video</option>
                                <option value="document">PDF/Document</option>
                                <option value="quiz">Quiz</option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              value={lesson.description}
                              onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'description', e.target.value)}
                              placeholder="Brief lesson description"
                            />
                          </div>

                          {/* Content based on type */}
                          {lesson.type === 'text' && (
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Text Content
                              </label>
                              <textarea
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={lesson.content || ''}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'content', e.target.value)}
                                placeholder="Enter lesson content or paste text here..."
                              />
                            </div>
                          )}

                          {lesson.type === 'video' && (
                            <div className="mt-3 space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  YouTube URL (or upload video file below)
                                </label>
                                <input
                                  type="url"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  value={lesson.videoUrl || ''}
                                  onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'videoUrl', e.target.value)}
                                  placeholder="https://youtube.com/watch?v=..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Or Upload Video File
                                </label>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleFileSelect(moduleIndex, lessonIndex, file)
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                                {lesson.file && (
                                  <p className="text-xs text-green-600 mt-1">
                                    ✓ {lesson.file.name} ({(lesson.file.size / 1024 / 1024).toFixed(2)} MB)
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {lesson.type === 'document' && (
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Upload PDF/Document *
                              </label>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                required={!lesson.documentUrl}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleFileSelect(moduleIndex, lessonIndex, file)
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              />
                              {lesson.file && (
                                <p className="text-xs text-green-600 mt-1">
                                  ✓ {lesson.file.name} ({(lesson.file.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Supported: PDF, Word, PowerPoint (Max 50MB)
                              </p>
                            </div>
                          )}

                          {lesson.type !== 'quiz' && (
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Duration (minutes)
                              </label>
                              <input
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={lesson.duration || ''}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'duration', parseInt(e.target.value) || 0)}
                                placeholder="Estimated duration"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-end space-x-4">
            <Link
              href="/dashboard/teacher/courses"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || uploadingFiles}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
            >
              {uploadingFiles ? 'Uploading Files...' : isLoading ? 'Creating Course...' : 'Create Course'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

import { UserRole } from '@/lib/constants'

export interface User {
  _id: string
  email: string
  password: string
  name: string
  role: UserRole
  institution?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  profile?: UserProfile
}

export interface UserProfile {
  firstName: string
  lastName: string
  phone?: string
  address?: string
  dateOfBirth?: Date
  avatar?: string
  bio?: string
  preferences: UserPreferences
}

export interface UserPreferences {
  language: 'en' | 'bn'
  timezone: string
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

export interface Institution {
  _id: string
  name: string
  type: 'school' | 'college' | 'coaching_center' | 'university'
  address: string
  phone: string
  email: string
  website?: string
  logo?: string
  isActive: boolean
  settings: InstitutionSettings
  createdAt: Date
  updatedAt: Date
}

export interface InstitutionSettings {
  academicYear: string
  semester: 'first' | 'second'
  board: 'ssc' | 'hsc' | 'jsc' | 'psc' | 'national_university' | 'dhaka_university' | 'other'
  gradingSystem: 'letter' | 'percentage' | 'gpa'
  currency: 'BDT' | 'USD'
  timezone: string
  features: {
    liveClasses: boolean
    assignments: boolean
    quizzes: boolean
    forums: boolean
    analytics: boolean
    parentPortal: boolean
  }
}

export interface Course {
  _id: string
  title: string
  description: string
  institution: string
  teacher: string
  subject: string
  class: string
  semester: 'first' | 'second'
  academicYear: string
  modules: Module[]
  prerequisites: string[]
  isPaid: boolean
  price: number
  currency: 'BDT' | 'USD'
  enrollmentLimit: number
  startDate: Date
  endDate: Date
  status: 'draft' | 'published' | 'archived'
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
}

export interface Module {
  _id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
  assignments: Assignment[]
  quiz?: Quiz
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Lesson {
  _id: string
  title: string
  content: LessonContent[]
  duration: number
  isPreview: boolean
  order: number
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

export interface LessonContent {
  type: 'video' | 'document' | 'image' | 'audio' | 'text'
  content: string
  title: string
  description?: string
  duration?: number
  order: number
}

export interface Assignment {
  _id?: string
  title: string
  description: string
  course: string
  module?: string
  type: 'homework' | 'project' | 'presentation' | 'essay'
  instructions: string
  attachments?: FileAttachment[]
  dueDate: Date
  totalMarks: number
  weight: number
  submissionType: 'file' | 'text' | 'both'
  lateSubmissionAllowed: boolean
  latePenaltyPercentage: number
  plagiarismCheck: boolean
  rubric?: Rubric[]
  isPublished: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Rubric {
  criteria: string
  description: string
  marks: number
  levels: RubricLevel[]
}

export interface RubricLevel {
  level: string
  description: string
  percentage: number
}

export interface FileAttachment {
  name: string
  url: string
  size: number
  type: string
}

export interface Quiz {
  _id: string
  title: string
  description: string
  course: string
  module: string
  questions: Question[]
  timeLimit: number
  attemptsAllowed: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  showCorrectAnswers: boolean
  showResultsImmediately: boolean
  passPercentage: number
  startDate: Date
  endDate: Date
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Question {
  _id: string
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay' | 'matching'
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  marks: number
  difficulty: 'easy' | 'medium' | 'hard'
  media?: FileAttachment[]
  order: number
}

export interface Enrollment {
  _id: string
  student: string
  course: string
  institution: string
  enrollmentDate: Date
  status: 'active' | 'completed' | 'dropped'
  progress: number
  lastAccessed: Date
  completionDate?: Date
  certificateIssued: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Submission {
  _id: string
  student: string
  assignment: string
  course: string
  content: string
  attachments: FileAttachment[]
  submittedAt: Date
  status: 'draft' | 'submitted' | 'graded'
  grade?: number
  feedback?: string
  gradedBy?: string
  gradedAt?: Date
  isLate: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Grade {
  _id: string
  student: string
  course: string
  assignment?: string
  quiz?: string
  grade: number
  totalMarks: number
  percentage: number
  letterGrade: string
  feedback?: string
  gradedBy: string
  gradedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface Announcement {
  _id: string
  title: string
  content: string
  institution: string
  course?: string
  author: string
  priority: 'low' | 'medium' | 'high'
  targetAudience: UserRole[]
  isActive: boolean
  startDate: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface DiscussionForum {
  _id: string
  course: string
  title: string
  description: string
  isPrivate: boolean
  moderationRequired: boolean
  topics: ForumTopic[]
  createdAt: Date
  updatedAt: Date
}

export interface ForumTopic {
  _id: string
  title: string
  content: string
  author: string
  replies: ForumReply[]
  isPinned: boolean
  isLocked: boolean
  tags: string[]
  views: number
  createdAt: Date
  updatedAt: Date
}

export interface ForumReply {
  _id: string
  content: string
  author: string
  parentReply?: string
  isSolution: boolean
  upvotes: number
  downvotes: number
  createdAt: Date
  updatedAt: Date
}

export interface LiveSession {
  _id: string
  title: string
  description: string
  course: string
  teacher: string
  startTime: Date
  endTime: Date
  meetingUrl: string
  meetingId: string
  password?: string
  maxParticipants: number
  recordingEnabled: boolean
  chatEnabled: boolean
  screenSharingEnabled: boolean
  participants: LiveParticipant[]
  status: 'scheduled' | 'live' | 'ended' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export interface LiveParticipant {
  user: string
  joinedAt: Date
  leftAt?: Date
  duration: number
}

export interface Payment {
  _id: string
  user: string
  course: string
  amount: number
  currency: 'BDT' | 'USD'
  gateway: 'bkash' | 'nagad' | 'rocket' | 'stripe'
  transactionId: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: string
  createdAt: Date
  completedAt?: Date
  refundedAt?: Date
}

export interface Certificate {
  _id: string
  student: string
  course: string
  institution: string
  certificateNumber: string
  issuedDate: Date
  validUntil?: Date
  downloadUrl: string
  createdAt: Date
}

export interface AcademicCalendar {
  _id: string
  institution: string
  academicYear: string
  semesters: Semester[]
  holidays: Holiday[]
  examSchedule: ExamSchedule[]
  createdAt: Date
  updatedAt: Date
}

export interface Semester {
  name: 'first' | 'second'
  startDate: Date
  endDate: Date
  classes: ClassSchedule[]
}

export interface Holiday {
  name: string
  date: Date
  type: 'national' | 'religious' | 'institutional'
  isWorkingDay: boolean
}

export interface ExamSchedule {
  examType: 'monthly' | 'half_yearly' | 'annual' | 'mock'
  subject: string
  class: string
  date: Date
  duration: number
  venue: string
}

export interface ClassSchedule {
  day: string
  startTime: string
  endTime: string
  subject: string
  teacher: string
  room?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T = unknown> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

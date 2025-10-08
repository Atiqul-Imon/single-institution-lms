export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  INSTITUTION_ADMIN: 'institution_admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
  ACCOUNTANT: 'accountant'
} as const

export type UserRole = typeof UserRole[keyof typeof UserRole]

export const UserPermissions = {
  // Course Management
  CREATE_COURSES: 'create_courses',
  EDIT_COURSES: 'edit_courses',
  DELETE_COURSES: 'delete_courses',
  VIEW_COURSES: 'view_courses',
  
  // User Management
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  VIEW_USERS: 'view_users',
  
  // Assignment Management
  CREATE_ASSIGNMENTS: 'create_assignments',
  EDIT_ASSIGNMENTS: 'edit_assignments',
  DELETE_ASSIGNMENTS: 'delete_assignments',
  GRADE_ASSIGNMENTS: 'grade_assignments',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  
  // Financial
  VIEW_FINANCIALS: 'view_financials',
  PROCESS_PAYMENTS: 'process_payments',
  
  // System
  MANAGE_SYSTEM: 'manage_system',
  MANAGE_INSTITUTION: 'manage_institution'
} as const

export type UserPermissions = typeof UserPermissions[keyof typeof UserPermissions]

export const RolePermissions: Record<UserRole, UserPermissions[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(UserPermissions),
  [UserRole.INSTITUTION_ADMIN]: [
    UserPermissions.CREATE_COURSES,
    UserPermissions.EDIT_COURSES,
    UserPermissions.DELETE_COURSES,
    UserPermissions.VIEW_COURSES,
    UserPermissions.CREATE_USERS,
    UserPermissions.EDIT_USERS,
    UserPermissions.VIEW_USERS,
    UserPermissions.VIEW_ANALYTICS,
    UserPermissions.VIEW_REPORTS,
    UserPermissions.EXPORT_DATA,
    UserPermissions.VIEW_FINANCIALS,
    UserPermissions.MANAGE_INSTITUTION
  ],
  [UserRole.TEACHER]: [
    UserPermissions.CREATE_COURSES,
    UserPermissions.EDIT_COURSES,
    UserPermissions.VIEW_COURSES,
    UserPermissions.CREATE_ASSIGNMENTS,
    UserPermissions.EDIT_ASSIGNMENTS,
    UserPermissions.DELETE_ASSIGNMENTS,
    UserPermissions.GRADE_ASSIGNMENTS,
    UserPermissions.VIEW_ANALYTICS,
    UserPermissions.VIEW_REPORTS
  ],
  [UserRole.STUDENT]: [
    UserPermissions.VIEW_COURSES
  ],
  [UserRole.PARENT]: [
    UserPermissions.VIEW_COURSES,
    UserPermissions.VIEW_ANALYTICS
  ],
  [UserRole.ACCOUNTANT]: [
    UserPermissions.VIEW_FINANCIALS,
    UserPermissions.PROCESS_PAYMENTS,
    UserPermissions.VIEW_REPORTS,
    UserPermissions.EXPORT_DATA
  ]
}

export const InstitutionType = {
  SCHOOL: 'school',
  COLLEGE: 'college',
  COACHING_CENTER: 'coaching_center',
  UNIVERSITY: 'university'
} as const

export type InstitutionType = typeof InstitutionType[keyof typeof InstitutionType]

export const BoardType = {
  SSC: 'ssc',
  HSC: 'hsc',
  JSC: 'jsc',
  PSC: 'psc',
  NATIONAL_UNIVERSITY: 'national_university',
  DHAKA_UNIVERSITY: 'dhaka_university',
  OTHER: 'other'
} as const

export type BoardType = typeof BoardType[keyof typeof BoardType]

export const GradingSystem = {
  LETTER: 'letter',
  PERCENTAGE: 'percentage',
  GPA: 'gpa'
} as const

export type GradingSystem = typeof GradingSystem[keyof typeof GradingSystem]

export const CourseStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
} as const

export type CourseStatus = typeof CourseStatus[keyof typeof CourseStatus]

export const AssignmentType = {
  HOMEWORK: 'homework',
  PROJECT: 'project',
  PRESENTATION: 'presentation',
  ESSAY: 'essay'
} as const

export type AssignmentType = typeof AssignmentType[keyof typeof AssignmentType]

export const QuestionType = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  FILL_BLANK: 'fill_blank',
  ESSAY: 'essay',
  MATCHING: 'matching'
} as const

export type QuestionType = typeof QuestionType[keyof typeof QuestionType]

export const EnrollmentStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DROPPED: 'dropped'
} as const

export type EnrollmentStatus = typeof EnrollmentStatus[keyof typeof EnrollmentStatus]

export const SubmissionStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  GRADED: 'graded'
} as const

export type SubmissionStatus = typeof SubmissionStatus[keyof typeof SubmissionStatus]

export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus]

export const PaymentGateway = {
  BKASH: 'bkash',
  NAGAD: 'nagad',
  ROCKET: 'rocket',
  STRIPE: 'stripe'
} as const

export type PaymentGateway = typeof PaymentGateway[keyof typeof PaymentGateway]

export const LiveSessionStatus = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  ENDED: 'ended',
  CANCELLED: 'cancelled'
} as const

export type LiveSessionStatus = typeof LiveSessionStatus[keyof typeof LiveSessionStatus]

export const AnnouncementPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const

export type AnnouncementPriority = typeof AnnouncementPriority[keyof typeof AnnouncementPriority]

export const DifficultyLevel = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
} as const

export type DifficultyLevel = typeof DifficultyLevel[keyof typeof DifficultyLevel]

export const LetterGrades = {
  'A+': { min: 97, max: 100 },
  'A': { min: 90, max: 96 },
  'A-': { min: 87, max: 89 },
  'B+': { min: 83, max: 86 },
  'B': { min: 80, max: 82 },
  'B-': { min: 77, max: 79 },
  'C+': { min: 73, max: 76 },
  'C': { min: 70, max: 72 },
  'C-': { min: 67, max: 69 },
  'D': { min: 60, max: 66 },
  'F': { min: 0, max: 59 }
} as const

export type LetterGrades = typeof LetterGrades

export function getLetterGrade(percentage: number): string {
  for (const [grade, range] of Object.entries(LetterGrades)) {
    if (percentage >= range.min && percentage <= range.max) {
      return grade
    }
  }
  return 'F'
}

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESET_PASSWORD: '/api/auth/reset-password'
  },
  
  // Users
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    GET: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`
  },
  
  // Institutions
  INSTITUTIONS: {
    LIST: '/api/institutions',
    CREATE: '/api/institutions',
    GET: (id: string) => `/api/institutions/${id}`,
    UPDATE: (id: string) => `/api/institutions/${id}`,
    DELETE: (id: string) => `/api/institutions/${id}`
  },
  
  // Courses
  COURSES: {
    LIST: '/api/courses',
    CREATE: '/api/courses',
    GET: (id: string) => `/api/courses/${id}`,
    UPDATE: (id: string) => `/api/courses/${id}`,
    DELETE: (id: string) => `/api/courses/${id}`,
    ENROLL: '/api/courses/enroll',
    UNENROLL: '/api/courses/unenroll'
  },
  
  // Assignments
  ASSIGNMENTS: {
    LIST: '/api/assignments',
    CREATE: '/api/assignments',
    GET: (id: string) => `/api/assignments/${id}`,
    UPDATE: (id: string) => `/api/assignments/${id}`,
    DELETE: (id: string) => `/api/assignments/${id}`,
    SUBMIT: '/api/assignments/submit',
    GRADE: '/api/assignments/grade'
  },
  
  // Quizzes
  QUIZZES: {
    LIST: '/api/quizzes',
    CREATE: '/api/quizzes',
    GET: (id: string) => `/api/quizzes/${id}`,
    UPDATE: (id: string) => `/api/quizzes/${id}`,
    DELETE: (id: string) => `/api/quizzes/${id}`,
    TAKE: '/api/quizzes/take',
    SUBMIT: '/api/quizzes/submit'
  },
  
  // Payments
  PAYMENTS: {
    LIST: '/api/payments',
    CREATE: '/api/payments',
    GET: (id: string) => `/api/payments/${id}`,
    PROCESS: '/api/payments/process',
    VERIFY: '/api/payments/verify'
  }
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  COURSES: '/courses',
  ASSIGNMENTS: '/assignments',
  QUIZZES: '/quizzes',
  GRADES: '/grades',
  PROFILE: '/profile',
  ADMIN: '/admin',
  INSTITUTION: '/institution'
} as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
} as const

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
    AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg']
  }
} as const

export const NOTIFICATION_TYPES = {
  ASSIGNMENT_DUE: 'assignment_due',
  QUIZ_AVAILABLE: 'quiz_available',
  GRADE_POSTED: 'grade_posted',
  COURSE_ANNOUNCEMENT: 'course_announcement',
  LIVE_CLASS: 'live_class',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed'
} as const

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]

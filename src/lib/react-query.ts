import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // With SSR, we usually want to set some default staleTime
      // above 0 to avoid refetching immediately on the client
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: (failureCount, error: Error) => {
        // Don't retry for 4xx errors
        if ('status' in error && typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth queries
  auth: {
    me: ['auth', 'me'] as const,
    login: ['auth', 'login'] as const,
    logout: ['auth', 'logout'] as const,
  },
  
  // User queries
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // Institution queries
  institutions: {
    all: ['institutions'] as const,
    lists: () => [...queryKeys.institutions.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.institutions.lists(), filters] as const,
    details: () => [...queryKeys.institutions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.institutions.details(), id] as const,
  },
  
  // Course queries
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.courses.lists(), filters] as const,
    details: () => [...queryKeys.courses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.courses.details(), id] as const,
    enrollments: (courseId: string) => [...queryKeys.courses.detail(courseId), 'enrollments'] as const,
    modules: (courseId: string) => [...queryKeys.courses.detail(courseId), 'modules'] as const,
    lessons: (courseId: string, moduleId: string) => [...queryKeys.courses.modules(courseId), moduleId, 'lessons'] as const,
  },
  
  // Assignment queries
  assignments: {
    all: ['assignments'] as const,
    lists: () => [...queryKeys.assignments.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.assignments.lists(), filters] as const,
    details: () => [...queryKeys.assignments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.assignments.details(), id] as const,
    submissions: (assignmentId: string) => [...queryKeys.assignments.detail(assignmentId), 'submissions'] as const,
    studentSubmissions: (studentId: string) => [...queryKeys.assignments.all, 'student', studentId, 'submissions'] as const,
  },
  
  // Quiz queries
  quizzes: {
    all: ['quizzes'] as const,
    lists: () => [...queryKeys.quizzes.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.quizzes.lists(), filters] as const,
    details: () => [...queryKeys.quizzes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.quizzes.details(), id] as const,
    attempts: (quizId: string) => [...queryKeys.quizzes.detail(quizId), 'attempts'] as const,
    results: (quizId: string) => [...queryKeys.quizzes.detail(quizId), 'results'] as const,
  },
  
  // Enrollment queries
  enrollments: {
    all: ['enrollments'] as const,
    lists: () => [...queryKeys.enrollments.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.enrollments.lists(), filters] as const,
    student: (studentId: string) => [...queryKeys.enrollments.all, 'student', studentId] as const,
    course: (courseId: string) => [...queryKeys.enrollments.all, 'course', courseId] as const,
  },
  
  // Grade queries
  grades: {
    all: ['grades'] as const,
    lists: () => [...queryKeys.grades.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.grades.lists(), filters] as const,
    student: (studentId: string) => [...queryKeys.grades.all, 'student', studentId] as const,
    course: (courseId: string) => [...queryKeys.grades.all, 'course', courseId] as const,
  },
  
  // Announcement queries
  announcements: {
    all: ['announcements'] as const,
    lists: () => [...queryKeys.announcements.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.announcements.lists(), filters] as const,
    details: () => [...queryKeys.announcements.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.announcements.details(), id] as const,
  },
  
  // Discussion queries
  discussions: {
    all: ['discussions'] as const,
    forums: () => [...queryKeys.discussions.all, 'forums'] as const,
    forum: (forumId: string) => [...queryKeys.discussions.forums(), forumId] as const,
    topics: (forumId: string) => [...queryKeys.discussions.forum(forumId), 'topics'] as const,
    topic: (topicId: string) => [...queryKeys.discussions.all, 'topics', topicId] as const,
    replies: (topicId: string) => [...queryKeys.discussions.topic(topicId), 'replies'] as const,
  },
  
  // Live session queries
  liveSessions: {
    all: ['liveSessions'] as const,
    lists: () => [...queryKeys.liveSessions.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.liveSessions.lists(), filters] as const,
    details: () => [...queryKeys.liveSessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.liveSessions.details(), id] as const,
    course: (courseId: string) => [...queryKeys.liveSessions.all, 'course', courseId] as const,
  },
  
  // Payment queries
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    user: (userId: string) => [...queryKeys.payments.all, 'user', userId] as const,
  },
} as const

// Helper function to invalidate related queries
export const invalidateQueries = {
  // Invalidate all user-related queries
  users: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
  },
  
  // Invalidate all course-related queries
  courses: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })
  },
  
  // Invalidate specific course queries
  course: (courseId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) })
  },
  
  // Invalidate all assignment-related queries
  assignments: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all })
  },
  
  // Invalidate all quiz-related queries
  quizzes: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.all })
  },
  
  // Invalidate all enrollment-related queries
  enrollments: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all })
  },
  
  // Invalidate all grade-related queries
  grades: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.grades.all })
  },
} as const

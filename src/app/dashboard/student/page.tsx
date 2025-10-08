'use client'

import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useStudentDashboard } from '@/hooks/useStudentDashboard'
import StatCard from '@/components/ui/StatCard'
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'

export default function StudentDashboard() {
  const { data: session } = useSession()
  const { stats, recentCourses, upcomingAssignments, isLoading, error } = useStudentDashboard(session?.user?.id)

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your courses today</p>
        </div>
        <button
          onClick={() => signOut()}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          Sign Out
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading dashboard data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          name="Enrolled Courses"
          value={stats.enrolledCourses}
          icon="📚"
          color="indigo"
          href="/dashboard/student/courses"
        />
        <StatCard
          name="Pending Assignments"
          value={stats.pendingAssignments}
          icon="📝"
          color="yellow"
          changeType={stats.pendingAssignments > 0 ? 'neutral' : 'positive'}
          href="/dashboard/student/assignments"
        />
        <StatCard
          name="Completed"
          value={stats.completedAssignments}
          icon="✓"
          color="green"
          changeType="positive"
        />
        <StatCard
          name="Overall Progress"
          value={stats.enrolledCourses > 0 
            ? `${Math.round((stats.completedAssignments / (stats.completedAssignments + stats.pendingAssignments || 1)) * 100)}%`
            : '0%'}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">My Courses</h3>
                <Link
                  href="/dashboard/student/courses"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentCourses.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon="📚"
                    title="No courses yet"
                    description="Enroll in courses to start your learning journey"
                    actionLabel="Browse Courses"
                    actionHref="/dashboard/student/courses"
                  />
                </div>
              ) : (
                recentCourses.map((course) => (
                  <div key={course._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white text-sm font-bold">
                              {course.title.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              {course.title}
                            </h4>
                            <p className="text-sm text-gray-500">
                              by {course.teacher?.name || 'Unknown Teacher'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 ml-13">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${0}%` }}
                              ></div>
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-600">
                              0%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link
                          href={`/dashboard/student/courses/${course._id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Assignments */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-white">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
            </div>
            <div className="p-6">
              {upcomingAssignments.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No upcoming deadlines</p>
                  <p className="text-xs text-gray-400 mt-1">You're all caught up! 🎉</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {upcomingAssignments.map((assignment) => {
                    const dueDate = new Date(assignment.dueDate)
                    const now = new Date()
                    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    const isUrgent = daysUntil <= 2

                    return (
                      <li key={assignment._id} className="flex items-start group">
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            isUrgent ? 'bg-red-500' : 'bg-indigo-500'
                          }`}></div>
                        </div>
                        <div className="ml-3 flex-1">
                          <Link
                            href={`/dashboard/student/assignments/${assignment._id}`}
                            className="block"
                          >
                            <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {assignment.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {assignment.course?.title || 'Unknown Course'}
                            </p>
                            <p className={`text-xs mt-1 font-medium ${
                              isUrgent ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {daysUntil === 0 ? 'Due today!' : 
                               daysUntil === 1 ? 'Due tomorrow' :
                               `Due in ${daysUntil} days`}
                            </p>
                          </Link>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            {upcomingAssignments.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <Link
                  href="/dashboard/student/assignments"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View all assignments →
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-4 space-y-2">
              <Link
                href="/dashboard/student/courses"
                className="flex items-center w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors group"
              >
                <span className="text-xl mr-3">📚</span>
                <span className="flex-1">Browse Courses</span>
                <span className="text-gray-400 group-hover:text-indigo-500">→</span>
              </Link>
              <Link
                href="/dashboard/student/assignments"
                className="flex items-center w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 rounded-lg transition-colors group"
              >
                <span className="text-xl mr-3">📝</span>
                <span className="flex-1">View Assignments</span>
                <span className="text-gray-400 group-hover:text-yellow-500">→</span>
              </Link>
              <Link
                href="/dashboard/student/quizzes"
                className="flex items-center w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors group"
              >
                <span className="text-xl mr-3">🎯</span>
                <span className="flex-1">Take Quizzes</span>
                <span className="text-gray-400 group-hover:text-purple-500">→</span>
              </Link>
              <Link
                href="/dashboard/student/grades"
                className="flex items-center w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group"
              >
                <span className="text-xl mr-3">📊</span>
                <span className="flex-1">Check Grades</span>
                <span className="text-gray-400 group-hover:text-green-500">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
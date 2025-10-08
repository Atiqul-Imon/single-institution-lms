'use client'

import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useTeacherDashboard } from '@/hooks/useTeacherDashboard'
import StatCard from '@/components/ui/StatCard'
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const { stats, recentCourses, recentAssignments, isLoading, error } = useTeacherDashboard(session?.user?.id)

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Teacher'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Manage your courses and track student progress</p>
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
          name="Total Courses"
          value={stats.totalCourses}
          icon="📚"
          color="blue"
          href="/dashboard/teacher/courses"
        />
        <StatCard
          name="Total Students"
          value={stats.totalStudents}
          icon="👥"
          color="indigo"
        />
        <StatCard
          name="Pending Grading"
          value={stats.pendingGrading}
          icon="📝"
          color="yellow"
          changeType={stats.pendingGrading > 0 ? 'neutral' : 'positive'}
          href="/dashboard/teacher/assignments"
        />
        <StatCard
          name="Active Assignments"
          value={stats.activeAssignments}
          icon="✓"
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">My Courses</h3>
                <Link
                  href="/dashboard/teacher/courses"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
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
                    description="Create your first course to start teaching"
                    actionLabel="Create Course"
                    actionHref="/dashboard/teacher/courses/create"
                  />
                </div>
              ) : (
                recentCourses.map((course) => (
                  <div key={course._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white text-sm font-bold">
                              {course.title.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              {course.title}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {course.subject} • {course.grade}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 ml-13 flex items-center text-sm text-gray-600">
                          <span className="flex items-center">
                            <span className="font-medium">{course.students?.length || 0}</span>
                            <span className="ml-1">students enrolled</span>
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <Link
                          href={`/dashboard/teacher/courses/${course._id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                        >
                          Manage →
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
          {/* Recent Assignments */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-white">
              <h3 className="text-lg font-semibold text-gray-900">Recent Assignments</h3>
            </div>
            <div className="p-6">
              {recentAssignments.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No assignments yet</p>
                  <Link
                    href="/dashboard/teacher/assignments/create"
                    className="text-xs text-indigo-600 hover:text-indigo-500 mt-2 inline-block"
                  >
                    Create your first assignment →
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {recentAssignments.map((assignment) => {
                    const dueDate = new Date(assignment.dueDate)
                    const isOverdue = dueDate < new Date()

                    return (
                      <li key={assignment._id} className="flex items-start group">
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            isOverdue ? 'bg-red-500' : 'bg-green-500'
                          }`}></div>
                        </div>
                        <div className="ml-3 flex-1">
                          <Link
                            href={`/dashboard/teacher/assignments/${assignment._id}`}
                            className="block"
                          >
                            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {assignment.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {assignment.course?.title || 'Unknown Course'}
                            </p>
                            <p className={`text-xs mt-1 font-medium ${
                              isOverdue ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              Due: {dueDate.toLocaleDateString()}
                            </p>
                          </Link>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            {recentAssignments.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <Link
                  href="/dashboard/teacher/assignments"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
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
                href="/dashboard/teacher/courses/create"
                className="flex items-center w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group"
              >
                <span className="text-xl mr-3">➕</span>
                <span className="flex-1">Create Course</span>
                <span className="text-gray-400 group-hover:text-blue-500">→</span>
              </Link>
              <Link
                href="/dashboard/teacher/assignments/create"
                className="flex items-center w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 rounded-lg transition-colors group"
              >
                <span className="text-xl mr-3">📝</span>
                <span className="flex-1">Create Assignment</span>
                <span className="text-gray-400 group-hover:text-yellow-500">→</span>
              </Link>
              <Link
                href="/dashboard/teacher/quizzes/create"
                className="flex items-center w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors group"
              >
                <span className="text-xl mr-3">🎯</span>
                <span className="flex-1">Create Quiz</span>
                <span className="text-gray-400 group-hover:text-purple-500">→</span>
              </Link>
              <Link
                href="/dashboard/teacher/assignments"
                className="flex items-center w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group"
              >
                <span className="text-xl mr-3">✓</span>
                <span className="flex-1">Grade Work</span>
                <span className="text-gray-400 group-hover:text-green-500">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
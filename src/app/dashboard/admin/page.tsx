'use client'

import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { data: session } = useSession()
  
  // Use session data if needed for admin-specific features
  console.log('Admin session:', session?.user?.role)

  const stats = [
    { name: 'Total Users', value: '1,247', change: '+89', changeType: 'positive' },
    { name: 'Active Courses', value: '156', change: '+12', changeType: 'positive' },
    { name: 'Institutions', value: '23', change: '+3', changeType: 'positive' },
    { name: 'Revenue (BDT)', value: '৳2.4M', change: '+15%', changeType: 'positive' },
  ]

  const recentActivity = [
    { type: 'user_registration', message: 'New student registered', time: '2 minutes ago', user: 'Ahmed Rahman' },
    { type: 'course_created', message: 'New course created', time: '15 minutes ago', user: 'Dr. Khan' },
    { type: 'payment_received', message: 'Payment received', time: '1 hour ago', user: 'Ms. Begum' },
    { type: 'institution_added', message: 'New institution added', time: '2 hours ago', user: 'Admin' },
  ]

  const systemHealth = [
    { name: 'Server Status', status: 'healthy', value: '99.9%' },
    { name: 'Database', status: 'healthy', value: 'Normal' },
    { name: 'Storage', status: 'warning', value: '75%' },
    { name: 'API Response', status: 'healthy', value: '120ms' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>
        <button
          onClick={() => signOut()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Sign Out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {stat.name.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {recentActivity.map((activity, index) => (
                <div key={index} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'user_registration' ? 'bg-green-500' :
                        activity.type === 'course_created' ? 'bg-blue-500' :
                        activity.type === 'payment_received' ? 'bg-yellow-500' : 'bg-purple-500'
                      }`}></div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-sm text-gray-500">
                        by {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">System Health</h3>
            </div>
            <div className="p-6">
              <dl className="space-y-4">
                {systemHealth.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-900">{item.name}</dt>
                    <dd className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'healthy' ? 'bg-green-100 text-green-800' :
                        item.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.value}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-3">
              <Link
                href="/dashboard/admin/users"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Manage Users
              </Link>
              <Link
                href="/dashboard/admin/institutions"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Manage Institutions
              </Link>
              <Link
                href="/dashboard/admin/courses"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Manage Courses
              </Link>
              <Link
                href="/dashboard/admin/analytics"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                View Analytics
              </Link>
              <Link
                href="/dashboard/admin/settings"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                System Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

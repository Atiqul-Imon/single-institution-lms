import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white text-xl font-bold">B</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  BanglaLMS
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full mb-6">
              <span className="text-sm font-medium text-indigo-700">🇧🇩 Learning Portal</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Welcome to Your
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Learning Portal
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Access your courses, submit assignments, take quizzes, and track your academic progress - all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/auth/signup"
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl text-lg"
              >
                Register as Student
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/auth/signin"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-indigo-600 hover:text-indigo-600 transition-all text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A complete digital learning platform for students and teachers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: '📚',
                title: 'Online Courses',
                description: 'Access all your courses with organized modules, lessons, and learning materials anytime, anywhere.',
                color: 'from-blue-500 to-indigo-600'
              },
              {
                icon: '📝',
                title: 'Assignments',
                description: 'Submit your work online with file uploads, receive grades, and get detailed feedback from teachers.',
                color: 'from-yellow-500 to-orange-600'
              },
              {
                icon: '🎯',
                title: 'Quizzes & Tests',
                description: 'Take interactive quizzes with instant grading and immediate results to test your knowledge.',
                color: 'from-purple-500 to-pink-600'
              },
              {
                icon: '📊',
                title: 'Progress Tracking',
                description: 'Monitor your academic progress, view grades, and track your performance across all subjects.',
                color: 'from-green-500 to-emerald-600'
              },
              {
                icon: '⏰',
                title: 'Deadline Management',
                description: 'Never miss a deadline with automatic reminders for assignments and upcoming tests.',
                color: 'from-cyan-500 to-blue-600'
              },
              {
                icon: '🇧🇩',
                title: 'Made for Bangladesh',
                description: 'Designed specifically for Bangladesh education system with local payment and language support.',
                color: 'from-red-500 to-rose-600'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="p-8">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Students & Teachers */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* For Students */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-4xl mb-6 shadow-lg">
                🎓
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Students</h3>
              <ul className="space-y-4">
                {[
                  'Access courses and learning materials 24/7',
                  'Submit assignments with file uploads',
                  'Take quizzes and get instant results',
                  'Track your grades and progress',
                  'View upcoming deadlines',
                  'Get feedback from teachers'
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-500 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="mt-8 block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
              >
                Register as Student
              </Link>
            </div>

            {/* For Teachers */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-4xl mb-6 shadow-lg">
                👨‍🏫
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Teachers</h3>
              <ul className="space-y-4">
                {[
                  'Create and manage courses easily',
                  'Create assignments and quizzes',
                  'Grade student work online',
                  'Provide detailed feedback',
                  'Track student performance',
                  'View analytics and reports'
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-500 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="mt-8 block w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
              >
                Register as Teacher
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-lg text-gray-600">
              Fast, reliable, and secure platform for quality education
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { name: 'Next.js 15', color: 'from-black to-gray-800' },
              { name: 'TypeScript', color: 'from-blue-600 to-blue-700' },
              { name: 'MongoDB', color: 'from-green-600 to-green-700' },
              { name: 'Tailwind CSS', color: 'from-cyan-500 to-blue-600' },
              { name: 'Secure Auth', color: 'from-purple-600 to-pink-600' },
              { name: 'Cloud Storage', color: 'from-orange-500 to-red-600' }
            ].map((tech, index) => (
              <div
                key={index}
                className={`bg-gradient-to-r ${tech.color} text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold text-sm`}
              >
                {tech.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join your classmates and teachers on our modern learning platform
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-2xl text-lg group"
          >
            Create Account Now
            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">B</span>
                </div>
                <span className="text-2xl font-bold text-white">BanglaLMS</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Complete Learning Management System for modern education in Bangladesh.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-400">
              © 2025 BanglaLMS. All rights reserved. | Made with ❤️ for Bangladesh Education
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

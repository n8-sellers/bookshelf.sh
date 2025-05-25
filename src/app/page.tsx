import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { BookIcon, Users, BarChart3, Sparkles } from 'lucide-react'

export default async function HomePage() {
  const user = await currentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <BookIcon className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Bookshelf
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A modern, minimalist book tracking application. Your reading journey, beautifully organized.
          </p>
        </header>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <BookIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Track Your Books
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Organize your reading with custom shelves and detailed progress tracking.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Connect with Readers
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Share your reading journey and discover new books through friends.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Reading Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Visualize your reading habits with beautiful stats and insights.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm max-w-md mx-auto">
            <Sparkles className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Start Your Journey
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Join thousands of readers tracking their literary adventures.
            </p>
            <div className="space-y-3">
              <a
                href="/auth/signup"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Get Started
              </a>
              <a
                href="/auth/signin"
                className="block w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

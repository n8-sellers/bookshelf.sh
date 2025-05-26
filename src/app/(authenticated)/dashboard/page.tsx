import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookIcon, Plus, TrendingUp, Library, Search } from 'lucide-react'
import { getUserBooks } from '@/lib/actions/book-actions'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch user's books
  const userBooks = await getUserBooks()
  
  // Calculate statistics
  const booksRead = userBooks.filter(ub => ub.shelf === 'READ').length
  const currentlyReading = userBooks.filter(ub => ub.shelf === 'READING').length
  const wantToRead = userBooks.filter(ub => ub.shelf === 'WANT').length
  const totalPages = userBooks
    .filter(ub => ub.shelf === 'READ')
    .reduce((sum, ub) => sum + (ub.book.pageCount || 0), 0)

  // Recent books (last 5 added)
  const recentBooks = userBooks.slice(0, 5)

  const hasBooks = userBooks.length > 0

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user.firstName || 'Reader'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Ready to continue your reading journey?
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/search"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Search className="h-4 w-4" />
              Find Books
            </Link>
            {hasBooks && (
              <Link
                href="/dashboard/library"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Library className="h-4 w-4" />
                My Library
              </Link>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <BookIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Books Read
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {booksRead}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Pages Read
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalPages.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <BookIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Currently Reading
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentlyReading}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <BookIcon className="h-8 w-8 text-amber-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Want to Read
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {wantToRead}
                </p>
              </div>
            </div>
          </div>
        </div>

        {hasBooks ? (
          /* Recent Activity */
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <Link
                href="/dashboard/library"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                View All Books →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {recentBooks.map((userBook) => (
                <div key={userBook.id} className="group">
                  <div className="aspect-[2/3] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-2">
                    {userBook.book.coverUrl ? (
                      <img
                        src={userBook.book.coverUrl}
                        alt={`Cover of ${userBook.book.title}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                    {userBook.book.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {userBook.book.authors?.[0]}
                  </p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      userBook.shelf === 'READ' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : userBook.shelf === 'READING'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                    }`}>
                      {userBook.shelf === 'READ' ? 'Read' : userBook.shelf === 'READING' ? 'Reading' : 'Want'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center shadow-sm">
            <BookIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Your library is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              Start building your personal library by adding your first book. Track your reading progress and discover new favorites.
            </p>
            <Link
              href="/search"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Find Your First Book
            </Link>
          </div>
        )}
    </div>
  )
}

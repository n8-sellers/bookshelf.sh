import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { LibraryContent } from './library-content'
import { LibrarySkeleton } from './library-skeleton'

export default async function LibraryPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Library
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage your book collection
          </p>
        </div>
        
        <Suspense fallback={<LibrarySkeleton />}>
          <LibraryContent />
        </Suspense>
      </div>
    </div>
  )
}

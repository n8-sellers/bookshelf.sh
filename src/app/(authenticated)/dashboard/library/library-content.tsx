'use client'

import { useState, useEffect } from 'react'
import { BookIcon, Search, Grid, List, Star, MoreHorizontal, Trash2, Move } from 'lucide-react'
import { getUserBooks, removeBookFromShelf, updateBookRating, addBookToShelf } from '@/lib/actions/book-actions'
import { type Shelf } from '@prisma/client'

interface UserBook {
  id: string
  shelf: Shelf
  rating: number | null
  startedAt: Date | null
  finishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  book: {
    id: string
    title: string
    authors: string[]
    coverUrl: string | null
    pageCount: number | null
    publishedDate: Date | null
    description: string | null
  }
}

type ViewMode = 'grid' | 'list'
type SortOption = 'recent' | 'title' | 'author' | 'rating'

export function LibraryContent() {
  const [books, setBooks] = useState<UserBook[]>([])
  const [filteredBooks, setFilteredBooks] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(true)
  const [activeShelf, setActiveShelf] = useState<Shelf | 'ALL'>('ALL')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchBooks()
  }, [])

  useEffect(() => {
    filterAndSortBooks()
  }, [books, activeShelf, sortBy, searchQuery])

  const fetchBooks = async () => {
    try {
      const userBooks = await getUserBooks()
      setBooks(userBooks)
    } catch (error) {
      console.error('Failed to fetch books:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortBooks = () => {
    let filtered = books

    // Filter by shelf
    if (activeShelf !== 'ALL') {
      filtered = filtered.filter(book => book.shelf === activeShelf)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(book =>
        book.book.title.toLowerCase().includes(query) ||
        book.book.authors.some(author => author.toLowerCase().includes(query))
      )
    }

    // Sort books
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.book.title.localeCompare(b.book.title)
        case 'author':
          return (a.book.authors[0] || '').localeCompare(b.book.authors[0] || '')
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

    setFilteredBooks(filtered)
  }

  const handleRating = async (bookId: string, rating: number) => {
    try {
      await updateBookRating(bookId, rating)
      await fetchBooks() // Refresh data
    } catch (error) {
      console.error('Failed to update rating:', error)
    }
  }

  const handleShelfMove = async (book: UserBook, newShelf: Shelf) => {
    try {
      await addBookToShelf({
        id: book.book.id,
        googleId: undefined,
        title: book.book.title,
        authors: book.book.authors,
        coverUrl: book.book.coverUrl || undefined,
        pageCount: book.book.pageCount || undefined,
        publishedDate: book.book.publishedDate || undefined,
        description: book.book.description || undefined,
        isbn10: undefined,
        isbn13: undefined,
        source: 'database'
      }, newShelf)
      await fetchBooks() // Refresh data
    } catch (error) {
      console.error('Failed to move book:', error)
    }
  }

  const handleRemoveBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to remove this book from your library?')) {
      return
    }
    
    try {
      await removeBookFromShelf(bookId)
      await fetchBooks() // Refresh data
    } catch (error) {
      console.error('Failed to remove book:', error)
    }
  }

  const getShelfCounts = () => {
    return {
      ALL: books.length,
      WANT: books.filter(b => b.shelf === 'WANT').length,
      READING: books.filter(b => b.shelf === 'READING').length,
      READ: books.filter(b => b.shelf === 'READ').length,
    }
  }

  const shelfCounts = getShelfCounts()

  if (loading) {
    return <div>Loading...</div>
  }

  if (books.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center shadow-sm">
        <BookIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Your library is empty
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Add some books to get started with your reading journey.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Shelf Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { key: 'ALL' as const, label: 'All Books', count: shelfCounts.ALL },
          { key: 'WANT' as const, label: 'Want to Read', count: shelfCounts.WANT },
          { key: 'READING' as const, label: 'Reading', count: shelfCounts.READING },
          { key: 'READ' as const, label: 'Read', count: shelfCounts.READ },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveShelf(key)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeShelf === key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="recent">Recently Added</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="rating">Rating</option>
          </select>

          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Books Display */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <BookIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            {searchQuery 
              ? `No books found matching "${searchQuery}"`
              : `No books in ${activeShelf === 'ALL' ? 'your library' : `${activeShelf.toLowerCase()} shelf`}`
            }
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
            : 'space-y-4'
        }>
          {filteredBooks.map((userBook) => (
            <BookCard
              key={userBook.id}
              userBook={userBook}
              viewMode={viewMode}
              onRating={(rating) => handleRating(userBook.book.id, rating)}
              onShelfMove={(shelf) => handleShelfMove(userBook, shelf)}
              onRemove={() => handleRemoveBook(userBook.book.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface BookCardProps {
  userBook: UserBook
  viewMode: ViewMode
  onRating: (rating: number) => void
  onShelfMove: (shelf: Shelf) => void
  onRemove: () => void
}

function BookCard({ userBook, viewMode, onRating, onShelfMove, onRemove }: BookCardProps) {
  const [showActions, setShowActions] = useState(false)

  const renderStars = (rating: number | null, interactive = false) => {
    const stars = []
    const currentRating = rating || 0
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => interactive && onRating(i * 2)} // Convert to 0-10 scale
          className={`${
            interactive ? 'hover:text-yellow-400 cursor-pointer' : ''
          } ${i * 2 <= currentRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
          disabled={!interactive}
        >
          <Star className="h-4 w-4 fill-current" />
        </button>
      )
    }
    
    return <div className="flex">{stars}</div>
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex items-center gap-4">
        <div className="w-16 h-24 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
          {userBook.book.coverUrl ? (
            <img
              src={userBook.book.coverUrl}
              alt={`Cover of ${userBook.book.title}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookIcon className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {userBook.book.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {userBook.book.authors.join(', ')}
          </p>
          <div className="flex items-center gap-4 mt-2">
            {renderStars(userBook.rating, true)}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              userBook.shelf === 'READ' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : userBook.shelf === 'READING'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
            }`}>
              {userBook.shelf === 'READ' ? 'Read' : userBook.shelf === 'READING' ? 'Reading' : 'Want to Read'}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
              <button
                onClick={() => onRemove()}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 flex items-center gap-2"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[2/3] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-3">
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
      
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
          {userBook.book.title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
          {userBook.book.authors.join(', ')}
        </p>
        
        <div className="flex items-center justify-between">
          {renderStars(userBook.rating, true)}
          
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                {userBook.shelf !== 'WANT' && (
                  <button
                    onClick={() => onShelfMove('WANT')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Want to Read
                  </button>
                )}
                {userBook.shelf !== 'READING' && (
                  <button
                    onClick={() => onShelfMove('READING')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Currently Reading
                  </button>
                )}
                {userBook.shelf !== 'READ' && (
                  <button
                    onClick={() => onShelfMove('READ')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => onRemove()}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
        
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
  )
}

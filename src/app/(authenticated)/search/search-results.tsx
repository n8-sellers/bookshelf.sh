'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Calendar, BookOpen, Users } from 'lucide-react';
import { type BookSearchResult } from '@/lib/book-search';
import { AddToShelfButton } from './add-to-shelf-button';

interface SearchResultsProps {
  results: BookSearchResult[];
  query: string;
  onBookAdded: () => void;
}

export function SearchResults({ results, query, onBookAdded }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No books found
          </h3>
          <p className="text-muted-foreground text-sm">
            We couldn't find any books matching "{query}". Try searching with different keywords or check your spelling.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found {results.length} book{results.length !== 1 ? 's' : ''} for "{query}"
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onBookAdded={onBookAdded}
          />
        ))}
      </div>
    </div>
  );
}

interface BookCardProps {
  book: BookSearchResult;
  onBookAdded: () => void;
}

function BookCard({ book, onBookAdded }: BookCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatAuthors = (authors: string[]) => {
    if (authors.length === 0) return 'Unknown Author';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return authors.join(' & ');
    return `${authors[0]} & ${authors.length - 1} others`;
  };

  const formatPublishedDate = (date?: Date | string) => {
    if (!date) return null;
    try {
      if (typeof date === 'string') {
        return new Date(date).getFullYear();
      }
      return date.getFullYear();
    } catch {
      return null;
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
      <div className="flex space-x-4">
        {/* Book Cover */}
        <div className="flex-shrink-0">
          <div className="w-16 h-24 bg-muted rounded overflow-hidden flex items-center justify-center">
            {book.coverUrl && !imageError ? (
              <Image
                src={book.coverUrl}
                alt={`Cover of ${book.title}`}
                width={64}
                height={96}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <BookOpen className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Book Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground line-clamp-2 mb-1">
            {book.title}
          </h3>
          
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">{formatAuthors(book.authors)}</span>
            </div>
            
            {formatPublishedDate(book.publishedDate) && (
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                <span>{formatPublishedDate(book.publishedDate)}</span>
              </div>
            )}

            {book.pageCount && (
              <div className="flex items-center">
                <BookOpen className="w-3 h-3 mr-1 flex-shrink-0" />
                <span>{book.pageCount} pages</span>
              </div>
            )}
          </div>

          {/* Source indicator */}
          <div className="mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              book.source === 'database' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            }`}>
              {book.source === 'database' ? 'In Library' : 'External'}
            </span>
          </div>

          {/* Add to Shelf Button */}
          <div className="mt-3">
            <AddToShelfButton
              book={book}
              onBookAdded={onBookAdded}
            />
          </div>
        </div>
      </div>

      {/* Description (collapsible) */}
      {book.description && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            <p className="line-clamp-3">
              {book.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Plus, Check, Loader2 } from 'lucide-react';
import { type BookSearchResult } from '@/lib/book-search';
import { addBookToShelf } from '@/lib/actions/book-actions';

interface AddToShelfButtonProps {
  book: BookSearchResult;
  onBookAdded: () => void;
}

export function AddToShelfButton({ book, onBookAdded }: AddToShelfButtonProps) {
  const { user, isLoaded } = useUser();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<'WANT' | 'READING' | 'READ'>('WANT');

  const handleAddToShelf = async (shelf: 'WANT' | 'READING' | 'READ') => {
    if (!user || isAdding) return;

    setIsAdding(true);
    setSelectedShelf(shelf);

    try {
      await addBookToShelf(book, shelf);
      setAdded(true);
      onBookAdded();
      
      // Reset after a brief moment
      setTimeout(() => {
        setAdded(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to add book to shelf:', error);
      // Could add toast notification here
    } finally {
      setIsAdding(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="text-xs text-muted-foreground">
        Sign in to add books
      </div>
    );
  }

  if (added) {
    return (
      <div className="flex items-center text-green-600 text-sm">
        <Check className="w-4 h-4 mr-1" />
        Added to {selectedShelf.toLowerCase()}!
      </div>
    );
  }

  return (
    <div className="flex space-x-1">
      <button
        onClick={() => handleAddToShelf('WANT')}
        disabled={isAdding}
        className="flex items-center px-2 py-1 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:hover:bg-amber-800 rounded transition-colors disabled:opacity-50"
        title="Add to Want to Read"
      >
        {isAdding && selectedShelf === 'WANT' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Plus className="w-3 h-3 mr-1" />
        )}
        Want
      </button>
      
      <button
        onClick={() => handleAddToShelf('READING')}
        disabled={isAdding}
        className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 rounded transition-colors disabled:opacity-50"
        title="Add to Currently Reading"
      >
        {isAdding && selectedShelf === 'READING' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Plus className="w-3 h-3 mr-1" />
        )}
        Reading
      </button>
      
      <button
        onClick={() => handleAddToShelf('READ')}
        disabled={isAdding}
        className="flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 rounded transition-colors disabled:opacity-50"
        title="Add to Read"
      >
        {isAdding && selectedShelf === 'READ' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Plus className="w-3 h-3 mr-1" />
        )}
        Read
      </button>
    </div>
  );
}

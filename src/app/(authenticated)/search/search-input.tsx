'use client';

import { Search, X, Loader2 } from 'lucide-react';

interface SearchInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function SearchInput({ query, onQueryChange, onClear, isLoading = false }: SearchInputProps) {
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search for books by title, author, or ISBN..."
          className="w-full pl-10 pr-12 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background text-foreground placeholder:text-muted-foreground"
          autoFocus
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          )}
          {query && (
            <button
              onClick={onClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Search suggestions/tips */}
      <div className="mt-2 text-sm text-muted-foreground">
        <p>Try searching for "Harry Potter", "Stephen King", or "9780132350884"</p>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { type BookSearchResult } from '@/lib/book-search';
import { SearchInput } from './search-input';
import { SearchResults } from './search-results';
import { SearchLoading } from './search-loading';

export function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce search query
  const debouncedQuery = useDebounce(query, 300);

  // Update URL when query changes
  const updateURL = useCallback((searchQuery: string) => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    const newURL = params.toString() ? `/search?${params.toString()}` : '/search';
    router.replace(newURL, { scroll: false });
  }, [router]);

  // Search function using API route
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search books. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to search when debounced query changes
  useEffect(() => {
    if (debouncedQuery !== searchParams.get('q')) {
      updateURL(debouncedQuery);
    }
    
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
      setHasSearched(false);
      setError(null);
    }
  }, [debouncedQuery, performSearch, updateURL, searchParams]);

  // Effect to handle initial search from URL
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
      performSearch(urlQuery);
    }
  }, [searchParams, query, performSearch]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
    updateURL('');
  };

  return (
    <div className="space-y-6">
      <SearchInput
        query={query}
        onQueryChange={handleQueryChange}
        onClear={handleClearSearch}
        isLoading={isLoading}
      />

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {isLoading && <SearchLoading />}

      {!isLoading && hasSearched && (
        <SearchResults
          results={results}
          query={query}
          onBookAdded={() => {
            // Optionally refresh results or show success message
          }}
        />
      )}

      {!isLoading && !hasSearched && !error && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Search for Books
            </h3>
            <p className="text-muted-foreground text-sm">
              Enter a book title, author name, or ISBN to find books to add to your library.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

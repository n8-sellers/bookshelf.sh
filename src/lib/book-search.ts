import { prisma } from './prisma';
import { googleBooksService, type GoogleBooksSearchResult } from './google-books';
import type { Book } from '@prisma/client';

export interface BookSearchResult {
  id: string;
  googleId?: string;
  title: string;
  authors: string[];
  publishedDate?: Date;
  pageCount?: number;
  description?: string;
  coverUrl?: string;
  isbn10?: string;
  isbn13?: string;
  source: 'database' | 'google-books';
}

export interface BookSearchOptions {
  maxResults?: number;
  includeExternal?: boolean;
}

class BookSearchService {
  /**
   * Hybrid search: local database first, then external APIs
   */
  async searchBooks(query: string, options: BookSearchOptions = {}): Promise<BookSearchResult[]> {
    const { maxResults = 20, includeExternal = true } = options;
    
    if (!query.trim()) return [];

    try {
      // Step 1: Search local database first
      const localResults = await this.searchLocalBooks(query, maxResults);
      
      // If we have enough results, return them
      if (localResults.length >= maxResults || !includeExternal) {
        return localResults.slice(0, maxResults);
      }

      // Step 2: Search external APIs for additional results
      const remainingCount = maxResults - localResults.length;
      const externalResults = await this.searchExternalBooks(query, remainingCount);

      // Step 3: Cache new books to database
      const cachedResults = await this.cacheExternalResults(externalResults);

      // Combine and deduplicate results
      const combinedResults = this.deduplicateResults([...localResults, ...cachedResults]);
      
      return combinedResults.slice(0, maxResults);
    } catch (error) {
      console.error('Book search error:', error);
      // Fallback to local results only
      return this.searchLocalBooks(query, maxResults);
    }
  }

  /**
   * Search books in local database
   */
  private async searchLocalBooks(query: string, limit: number): Promise<BookSearchResult[]> {
    try {
      const books = await prisma.book.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              authors: {
                hasSome: query.split(/\s+/),
              },
            },
          ],
        },
        take: limit,
        orderBy: [
          // Prioritize exact title matches
          {
            title: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });

      return books.map(book => this.normalizeBookFromDatabase(book));
    } catch (error) {
      console.error('Local book search error:', error);
      return [];
    }
  }

  /**
   * Search external APIs (Google Books)
   */
  private async searchExternalBooks(query: string, limit: number): Promise<GoogleBooksSearchResult[]> {
    try {
      return await googleBooksService.searchBooks(query, limit);
    } catch (error) {
      console.error('External book search error:', error);
      return [];
    }
  }

  /**
   * Cache external results to database (write-through)
   */
  private async cacheExternalResults(externalResults: GoogleBooksSearchResult[]): Promise<BookSearchResult[]> {
    const cachedResults: BookSearchResult[] = [];

    for (const result of externalResults) {
      try {
        // Check if book already exists
        const existingBook = await prisma.book.findFirst({
          where: {
            OR: [
              { googleId: result.id },
              ...(result.isbn13 ? [{ isbn13: result.isbn13 }] : []),
              ...(result.isbn10 ? [{ isbn10: result.isbn10 }] : []),
            ],
          },
        });

        if (existingBook) {
          // Book already exists, return it
          cachedResults.push(this.normalizeBookFromDatabase(existingBook));
        } else {
          // Create new book record
          const newBook = await prisma.book.create({
            data: {
              googleId: result.id,
              title: result.title,
              authors: result.authors,
              publishedDate: result.publishedDate,
              pageCount: result.pageCount,
              description: result.description,
              coverUrl: result.coverUrl,
              isbn10: result.isbn10,
              isbn13: result.isbn13,
            },
          });

          cachedResults.push(this.normalizeBookFromDatabase(newBook));
        }
      } catch (error) {
        console.error('Error caching book:', result.title, error);
        // On error, return the external result as-is
        cachedResults.push({
          ...result,
          source: 'google-books' as const,
        });
      }
    }

    return cachedResults;
  }

  /**
   * Search by ISBN (local first, then external)
   */
  async searchByISBN(isbn: string): Promise<BookSearchResult | null> {
    const cleanISBN = isbn.replace(/[-\s]/g, '');

    try {
      // Search local database first
      const localBook = await prisma.book.findFirst({
        where: {
          OR: [
            { isbn13: cleanISBN },
            { isbn10: cleanISBN },
          ],
        },
      });

      if (localBook) {
        return this.normalizeBookFromDatabase(localBook);
      }

      // Search external APIs
      const externalResult = await googleBooksService.searchByISBN(cleanISBN);
      if (!externalResult) return null;

      // Cache the result
      const cachedResults = await this.cacheExternalResults([externalResult]);
      return cachedResults[0] || null;
    } catch (error) {
      console.error('ISBN search error:', error);
      return null;
    }
  }

  /**
   * Get book by ID (database lookup)
   */
  async getBookById(id: string): Promise<BookSearchResult | null> {
    try {
      const book = await prisma.book.findUnique({
        where: { id },
      });

      return book ? this.normalizeBookFromDatabase(book) : null;
    } catch (error) {
      console.error('Get book by ID error:', error);
      return null;
    }
  }

  /**
   * Normalize book from database to search result format
   */
  private normalizeBookFromDatabase(book: Book): BookSearchResult {
    return {
      id: book.id,
      googleId: book.googleId || undefined,
      title: book.title,
      authors: book.authors,
      publishedDate: book.publishedDate || undefined,
      pageCount: book.pageCount || undefined,
      description: book.description || undefined,
      coverUrl: book.coverUrl || undefined,
      isbn10: book.isbn10 || undefined,
      isbn13: book.isbn13 || undefined,
      source: 'database',
    };
  }

  /**
   * Remove duplicate books from search results
   */
  private deduplicateResults(results: BookSearchResult[]): BookSearchResult[] {
    const seen = new Set<string>();
    const deduped: BookSearchResult[] = [];

    for (const result of results) {
      // Create a unique key based on various identifiers
      const keys = [
        result.googleId,
        result.isbn13,
        result.isbn10,
        `${result.title.toLowerCase()}-${result.authors.join(',').toLowerCase()}`,
      ].filter((key): key is string => Boolean(key));

      const isDuplicate = keys.some(key => seen.has(key));
      
      if (!isDuplicate) {
        keys.forEach(key => seen.add(key));
        deduped.push(result);
      }
    }

    return deduped;
  }

  /**
   * Get popular/trending books (for empty state)
   */
  async getPopularBooks(limit = 20): Promise<BookSearchResult[]> {
    try {
      const books = await prisma.book.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return books.map(book => this.normalizeBookFromDatabase(book));
    } catch (error) {
      console.error('Get popular books error:', error);
      return [];
    }
  }
}

// Singleton instance
export const bookSearchService = new BookSearchService();

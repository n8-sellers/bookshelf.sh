interface GoogleBooksVolumeInfo {
  title: string;
  authors?: string[];
  publishedDate?: string;
  pageCount?: number;
  description?: string;
  imageLinks?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  industryIdentifiers?: Array<{
    type: 'ISBN_10' | 'ISBN_13' | 'OTHER';
    identifier: string;
  }>;
  categories?: string[];
}

interface GoogleBooksItem {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
}

interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBooksItem[];
}

export interface GoogleBooksSearchResult {
  id: string;
  title: string;
  authors: string[];
  publishedDate?: Date;
  pageCount?: number;
  description?: string;
  coverUrl?: string;
  isbn10?: string;
  isbn13?: string;
  categories?: string[];
}

class GoogleBooksService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/books/v1/volumes';

  constructor() {
    this.apiKey = process.env.GOOGLE_BOOKS_API_KEY!;
    if (!this.apiKey) {
      throw new Error('GOOGLE_BOOKS_API_KEY environment variable is required');
    }
  }

  /**
   * Search books by query string
   */
  async searchBooks(query: string, maxResults = 20): Promise<GoogleBooksSearchResult[]> {
    if (!query.trim()) return [];

    try {
      const searchParams = new URLSearchParams({
        q: query,
        maxResults: maxResults.toString(),
        key: this.apiKey,
        printType: 'books',
        projection: 'full',
      });

      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}?${searchParams}`, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Google Books API rate limit exceeded');
        }
        throw new Error(`Google Books API error: ${response.status}`);
      }

      const data: GoogleBooksResponse = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return [];
      }

      return data.items.map(item => this.normalizeBookData(item));
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Google Books API search timeout');
          throw new Error('Google Books API request timed out after 10 seconds');
        }
      }
      console.error('Google Books API search error:', error);
      throw error;
    }
  }

  /**
   * Search books by ISBN
   */
  async searchByISBN(isbn: string): Promise<GoogleBooksSearchResult | null> {
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    try {
      const results = await this.searchBooks(`isbn:${cleanISBN}`, 1);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Google Books ISBN search error:', error);
      return null;
    }
  }

  /**
   * Get book details by Google Books ID
   */
  async getBookById(googleId: string): Promise<GoogleBooksSearchResult | null> {
    try {
      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/${googleId}?key=${this.apiKey}`, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        return null;
      }

      const item: GoogleBooksItem = await response.json();
      return this.normalizeBookData(item);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Google Books get book timeout');
        return null;
      }
      console.error('Google Books get book error:', error);
      return null;
    }
  }

  /**
   * Normalize Google Books API response to our format
   */
  private normalizeBookData(item: GoogleBooksItem): GoogleBooksSearchResult {
    const { volumeInfo } = item;
    
    // Extract ISBNs
    let isbn10: string | undefined;
    let isbn13: string | undefined;
    
    if (volumeInfo.industryIdentifiers) {
      for (const identifier of volumeInfo.industryIdentifiers) {
        if (identifier.type === 'ISBN_10') {
          isbn10 = identifier.identifier;
        } else if (identifier.type === 'ISBN_13') {
          isbn13 = identifier.identifier;
        }
      }
    }

    // Parse published date
    let publishedDate: Date | undefined;
    if (volumeInfo.publishedDate) {
      const dateStr = volumeInfo.publishedDate;
      // Handle various date formats from Google Books (YYYY, YYYY-MM, YYYY-MM-DD)
      if (dateStr.match(/^\d{4}$/)) {
        publishedDate = new Date(`${dateStr}-01-01`);
      } else if (dateStr.match(/^\d{4}-\d{2}$/)) {
        publishedDate = new Date(`${dateStr}-01`);
      } else {
        publishedDate = new Date(dateStr);
      }
      
      // Validate date
      if (isNaN(publishedDate.getTime())) {
        publishedDate = undefined;
      }
    }

    // Get best cover image
    const coverUrl = this.getBestCoverImage(volumeInfo.imageLinks);

    return {
      id: item.id,
      title: volumeInfo.title || 'Unknown Title',
      authors: volumeInfo.authors || [],
      publishedDate,
      pageCount: volumeInfo.pageCount,
      description: volumeInfo.description,
      coverUrl,
      isbn10,
      isbn13,
      categories: volumeInfo.categories,
    };
  }

  /**
   * Select the best available cover image
   */
  private getBestCoverImage(imageLinks?: GoogleBooksVolumeInfo['imageLinks']): string | undefined {
    if (!imageLinks) return undefined;

    // Prefer larger images, but ensure HTTPS
    const candidates = [
      imageLinks.large,
      imageLinks.medium,
      imageLinks.small,
      imageLinks.thumbnail,
    ];

    for (const url of candidates) {
      if (url) {
        // Convert HTTP to HTTPS for security
        return url.replace(/^http:/, 'https:');
      }
    }

    return undefined;
  }
}

// Singleton instance
export const googleBooksService = new GoogleBooksService();

// Export types
export type { GoogleBooksVolumeInfo, GoogleBooksItem, GoogleBooksResponse };

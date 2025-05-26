import { NextRequest, NextResponse } from 'next/server';
import { bookSearchService } from '@/lib/book-search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    const results = await bookSearchService.searchBooks(query, {
      maxResults: 20,
      includeExternal: true,
    });

    return NextResponse.json({
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

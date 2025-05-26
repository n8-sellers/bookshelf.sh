import { Suspense } from 'react';
import { SearchPageContent } from './search-page-content';

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Search Books
            </h1>
            <p className="text-muted-foreground">
              Find your next great read from our collection
            </p>
          </div>
          
          <Suspense fallback={<div>Loading...</div>}>
            <SearchPageContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export const metadata = {
  title: 'Search Books | BookTrackr',
  description: 'Search for books to add to your personal library',
};

import { Suspense } from 'react';
import { UserDiscoveryContent } from './user-discovery-content';
import { Skeleton } from '@/components/ui/skeleton';

export default function DiscoverPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Readers</h1>
        <p className="text-muted-foreground">
          Find and connect with other book lovers in the community
        </p>
      </div>

      <Suspense fallback={<DiscoverySkeleton />}>
        <UserDiscoveryContent />
      </Suspense>
    </div>
  );
}

function DiscoverySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
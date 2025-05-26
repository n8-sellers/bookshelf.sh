import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FriendsContent } from './friends-content';
import { PendingRequestsContent } from './pending-requests-content';
import { Skeleton } from '@/components/ui/skeleton';

export default function FriendsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Friends</h1>
        <p className="text-muted-foreground">
          Manage your friends and connection requests
        </p>
      </div>

      <Tabs defaultValue="friends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends">My Friends</TabsTrigger>
          <TabsTrigger value="requests">Pending Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends">
          <Suspense fallback={<FriendsSkeleton />}>
            <FriendsContent />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="requests">
          <Suspense fallback={<FriendsSkeleton />}>
            <PendingRequestsContent />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FriendsSkeleton() {
  return (
    <div className="grid gap-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
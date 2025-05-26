'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getFriendStats } from '@/lib/actions/friend-actions';

export function FriendRequestButton() {
  const { data: stats } = useQuery({
    queryKey: ['friend-stats'],
    queryFn: getFriendStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <Link href="/friends">
      <Button variant="ghost" size="icon" className="relative">
        <Users className="h-5 w-5" />
        {stats && stats.pendingRequestCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
          >
            {stats.pendingRequestCount}
          </Badge>
        )}
        <span className="sr-only">
          Friends {stats?.pendingRequestCount ? `(${stats.pendingRequestCount} pending)` : ''}
        </span>
      </Button>
    </Link>
  );
}
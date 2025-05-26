'use client';

import { useState, useTransition } from 'react';
import { Search, BookOpen, UserPlus, Check, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-debounce';
import { searchUsers, sendFriendRequest } from '@/lib/actions/friend-actions';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

type UserSearchResult = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  bookCount: number;
  friendshipStatus: 'PENDING' | 'ACCEPTED' | 'BLOCKED' | null;
  isRequester: boolean;
};

export function UserDiscoveryContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [isPending, startTransition] = useTransition();
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      return searchUsers(debouncedQuery);
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleSendRequest = async (userId: string) => {
    setSendingRequest(userId);
    try {
      await sendFriendRequest(userId);
      toast.success('Friend request sent!');
      // Refetch to update UI
      startTransition(() => {
        searchUsers(debouncedQuery);
      });
    } catch (error) {
      toast.error('Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const renderFriendButton = (user: UserSearchResult) => {
    if (user.friendshipStatus === 'ACCEPTED') {
      return (
        <Button size="sm" variant="secondary" disabled>
          <Check className="w-4 h-4 mr-1" />
          Friends
        </Button>
      );
    }

    if (user.friendshipStatus === 'PENDING') {
      if (user.isRequester) {
        return (
          <Button size="sm" variant="secondary" disabled>
            <Clock className="w-4 h-4 mr-1" />
            Request Sent
          </Button>
        );
      } else {
        return (
          <Button size="sm" variant="secondary" disabled>
            <Clock className="w-4 h-4 mr-1" />
            Request Received
          </Button>
        );
      }
    }

    if (user.friendshipStatus === 'BLOCKED') {
      return (
        <Button size="sm" variant="secondary" disabled>
          <X className="w-4 h-4 mr-1" />
          Blocked
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        onClick={() => handleSendRequest(user.id)}
        disabled={sendingRequest === user.id}
      >
        <UserPlus className="w-4 h-4 mr-1" />
        {sendingRequest === user.id ? 'Sending...' : 'Add Friend'}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <p className="text-sm text-muted-foreground text-center">
          Type at least 2 characters to search
        </p>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Searching...</p>
        </div>
      )}

      {!isLoading && debouncedQuery.length >= 2 && users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No users found</p>
        </div>
      )}

      {users.length > 0 && (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback>
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {user.name || user.email}
                    </h3>
                    {user.name && (
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <BookOpen className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {user.bookCount} book{user.bookCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                {renderFriendButton(user)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
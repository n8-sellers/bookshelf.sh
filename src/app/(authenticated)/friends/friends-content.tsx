'use client';

import { useState } from 'react';
import { BookOpen, MoreVertical, UserX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getFriends, removeFriend } from '@/lib/actions/friend-actions';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

type Friend = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  bookCount: number;
  friendshipId: string;
};

export function FriendsContent() {
  const queryClient = useQueryClient();
  const [removingFriend, setRemovingFriend] = useState<string | null>(null);

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
  });

  const removeFriendMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-stats'] });
      toast.success('Friend removed');
    },
    onError: () => {
      toast.error('Failed to remove friend');
    },
  });

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    setRemovingFriend(friendId);
    try {
      await removeFriendMutation.mutateAsync(friendId);
    } finally {
      setRemovingFriend(null);
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

  if (isLoading) {
    return <div className="text-center py-8">Loading friends...</div>;
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          You haven't added any friends yet
        </p>
        <Link href="/friends/discover">
          <Button>Discover Readers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {friends.map((friend) => (
        <Card key={friend.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={friend.avatarUrl || undefined} />
                <AvatarFallback>
                  {getInitials(friend.name, friend.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">
                  {friend.name || friend.email}
                </h3>
                {friend.name && (
                  <p className="text-sm text-muted-foreground">
                    {friend.email}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <BookOpen className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {friend.bookCount} book{friend.bookCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleRemoveFriend(friend.id)}
                  disabled={removingFriend === friend.id}
                  className="text-destructive"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Remove Friend
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
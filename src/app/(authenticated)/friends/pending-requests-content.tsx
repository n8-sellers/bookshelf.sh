'use client';

import { useState } from 'react';
import { BookOpen, Check, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from '@/lib/actions/friend-actions';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

type PendingRequest = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  bookCount: number;
  requestedAt: Date;
};

export function PendingRequestsContent() {
  const queryClient = useQueryClient();
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['pending-friend-requests'],
    queryFn: getPendingFriendRequests,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-stats'] });
      toast.success('Friend request accepted!');
    },
    onError: () => {
      toast.error('Failed to accept friend request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friend-stats'] });
      toast.success('Friend request rejected');
    },
    onError: () => {
      toast.error('Failed to reject friend request');
    },
  });

  const handleAccept = async (requesterId: string) => {
    setProcessingRequest(requesterId);
    try {
      await acceptMutation.mutateAsync(requesterId);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requesterId: string) => {
    setProcessingRequest(requesterId);
    try {
      await rejectMutation.mutateAsync(requesterId);
    } finally {
      setProcessingRequest(null);
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
    return <div className="text-center py-8">Loading requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No pending friend requests
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={request.avatarUrl || undefined} />
                  <AvatarFallback>
                    {getInitials(request.name, request.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {request.name || request.email}
                  </h3>
                  {request.name && (
                    <p className="text-sm text-muted-foreground">
                      {request.email}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {request.bookCount} book{request.bookCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(request.requestedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(request.id)}
                  disabled={processingRequest === request.id}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Reject</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAccept(request.id)}
                  disabled={processingRequest === request.id}
                >
                  <Check className="h-4 w-4" />
                  <span className="sr-only">Accept</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
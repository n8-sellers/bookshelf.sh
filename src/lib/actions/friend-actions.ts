'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * Search for users by name or email
 */
export async function searchUsers(query: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return [];
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Search for users excluding the current user
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: { not: currentUser.id },
          },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        _count: {
          select: {
            userBooks: true,
          },
        },
      },
      take: 20,
    });

    // Get friendship status for each user
    const friendships = await prisma.friend.findMany({
      where: {
        OR: [
          { requesterId: currentUser.id, addresseeId: { in: users.map(u => u.id) } },
          { addresseeId: currentUser.id, requesterId: { in: users.map(u => u.id) } },
        ],
      },
    });

    // Map users with their friendship status
    return users.map(user => {
      const friendship = friendships.find(
        f => (f.requesterId === currentUser.id && f.addresseeId === user.id) ||
             (f.addresseeId === currentUser.id && f.requesterId === user.id)
      );

      return {
        ...user,
        bookCount: user._count.userBooks,
        friendshipStatus: friendship?.status || null,
        isRequester: friendship?.requesterId === currentUser.id,
      };
    });
  } catch (error) {
    console.error('Search users error:', error);
    throw new Error('Failed to search users');
  }
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(addresseeId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    const requester = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!requester) {
      throw new Error('User not found');
    }

    // Validate addresseeId
    if (!addresseeId || addresseeId === requester.id) {
      throw new Error('Invalid friend request');
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { requesterId: requester.id, addresseeId },
          { requesterId: addresseeId, addresseeId: requester.id },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'BLOCKED') {
        throw new Error('Cannot send friend request');
      }
      throw new Error('Friend request already exists');
    }

    // Create friend request
    await prisma.friend.create({
      data: {
        requesterId: requester.id,
        addresseeId,
        status: 'PENDING',
      },
    });

    // Revalidate caches
    revalidateTag(`friends-${requester.id}`);
    revalidateTag(`friend-requests-${addresseeId}`);

    return { success: true };
  } catch (error) {
    console.error('Send friend request error:', error);
    throw new Error('Failed to send friend request');
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(requesterId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Update friend request status
    const friendship = await prisma.friend.updateMany({
      where: {
        requesterId,
        addresseeId: currentUser.id,
        status: 'PENDING',
      },
      data: {
        status: 'ACCEPTED',
        updatedAt: new Date(),
      },
    });

    if (friendship.count === 0) {
      throw new Error('Friend request not found');
    }

    // Revalidate caches
    revalidateTag(`friends-${currentUser.id}`);
    revalidateTag(`friends-${requesterId}`);
    revalidateTag(`friend-requests-${currentUser.id}`);

    return { success: true };
  } catch (error) {
    console.error('Accept friend request error:', error);
    throw new Error('Failed to accept friend request');
  }
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(requesterId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Delete friend request
    await prisma.friend.deleteMany({
      where: {
        requesterId,
        addresseeId: currentUser.id,
        status: 'PENDING',
      },
    });

    // Revalidate caches
    revalidateTag(`friend-requests-${currentUser.id}`);

    return { success: true };
  } catch (error) {
    console.error('Reject friend request error:', error);
    throw new Error('Failed to reject friend request');
  }
}

/**
 * Remove a friend
 */
export async function removeFriend(friendId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Delete friendship
    await prisma.friend.deleteMany({
      where: {
        OR: [
          { requesterId: currentUser.id, addresseeId: friendId, status: 'ACCEPTED' },
          { requesterId: friendId, addresseeId: currentUser.id, status: 'ACCEPTED' },
        ],
      },
    });

    // Revalidate caches
    revalidateTag(`friends-${currentUser.id}`);
    revalidateTag(`friends-${friendId}`);

    return { success: true };
  } catch (error) {
    console.error('Remove friend error:', error);
    throw new Error('Failed to remove friend');
  }
}

/**
 * Get user's friends
 */
export async function getFriends() {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Get all accepted friendships
    const friendships = await prisma.friend.findMany({
      where: {
        AND: [
          {
            OR: [
              { requesterId: currentUser.id },
              { addresseeId: currentUser.id },
            ],
          },
          { status: 'ACCEPTED' },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            _count: {
              select: {
                userBooks: true,
              },
            },
          },
        },
        addressee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            _count: {
              select: {
                userBooks: true,
              },
            },
          },
        },
      },
    });

    // Extract friends from friendships
    return friendships.map(friendship => {
      const friend = friendship.requesterId === currentUser.id 
        ? friendship.addressee 
        : friendship.requester;
      
      return {
        ...friend,
        bookCount: friend._count.userBooks,
        friendshipId: friendship.id,
      };
    });
  } catch (error) {
    console.error('Get friends error:', error);
    throw new Error('Failed to get friends');
  }
}

/**
 * Get pending friend requests
 */
export async function getPendingFriendRequests() {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Get pending requests where current user is the addressee
    const requests = await prisma.friend.findMany({
      where: {
        addresseeId: currentUser.id,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            _count: {
              select: {
                userBooks: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map(request => ({
      ...request.requester,
      bookCount: request.requester._count.userBooks,
      requestedAt: request.createdAt,
    }));
  } catch (error) {
    console.error('Get pending friend requests error:', error);
    throw new Error('Failed to get friend requests');
  }
}

/**
 * Get friend stats
 */
export async function getFriendStats() {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    const [friendCount, pendingRequestCount] = await Promise.all([
      prisma.friend.count({
        where: {
          AND: [
            {
              OR: [
                { requesterId: currentUser.id },
                { addresseeId: currentUser.id },
              ],
            },
            { status: 'ACCEPTED' },
          ],
        },
      }),
      prisma.friend.count({
        where: {
          addresseeId: currentUser.id,
          status: 'PENDING',
        },
      }),
    ]);

    return {
      friendCount,
      pendingRequestCount,
    };
  } catch (error) {
    console.error('Get friend stats error:', error);
    throw new Error('Failed to get friend stats');
  }
}
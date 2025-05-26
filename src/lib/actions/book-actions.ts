'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { type BookSearchResult } from '@/lib/book-search';
import { type Shelf } from '@prisma/client';

export async function addBookToShelf(book: BookSearchResult, shelf: Shelf) {
  try {
    // Get authenticated user
    const { userId } = auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    // Get or create user record
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: '', // Will be updated from Clerk webhook
        name: '', // Will be updated from Clerk webhook
      },
    });

    // Ensure book exists in our database
    let bookRecord = await prisma.book.findFirst({
      where: {
        OR: [
          { id: book.id },
          ...(book.googleId ? [{ googleId: book.googleId }] : []),
          ...(book.isbn13 ? [{ isbn13: book.isbn13 }] : []),
          ...(book.isbn10 ? [{ isbn10: book.isbn10 }] : []),
        ],
      },
    });

    if (!bookRecord) {
      // Create new book record
      bookRecord = await prisma.book.create({
        data: {
          googleId: book.googleId,
          title: book.title,
          authors: book.authors,
          publishedDate: book.publishedDate,
          pageCount: book.pageCount,
          description: book.description,
          coverUrl: book.coverUrl,
          isbn10: book.isbn10,
          isbn13: book.isbn13,
        },
      });
    }

    // Check if user already has this book
    const existingUserBook = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: bookRecord.id,
        },
      },
    });

    if (existingUserBook) {
      // Update existing shelf assignment
      await prisma.userBook.update({
        where: {
          id: existingUserBook.id,
        },
        data: {
          shelf,
          updatedAt: new Date(),
          // Set finish date if moving to READ shelf
          ...(shelf === 'READ' && !existingUserBook.finishedAt ? {
            finishedAt: new Date(),
          } : {}),
          // Set start date if moving to READING shelf
          ...(shelf === 'READING' && !existingUserBook.startedAt ? {
            startedAt: new Date(),
          } : {}),
        },
      });
    } else {
      // Create new user-book relationship
      await prisma.userBook.create({
        data: {
          userId: user.id,
          bookId: bookRecord.id,
          shelf,
          // Set appropriate dates based on shelf
          ...(shelf === 'READING' ? { startedAt: new Date() } : {}),
          ...(shelf === 'READ' ? { 
            startedAt: new Date(), 
            finishedAt: new Date() 
          } : {}),
        },
      });
    }

    // Revalidate relevant caches
    revalidateTag(`user-books-${user.id}`);
    revalidateTag(`user-library-${user.id}`);

    return { success: true };
  } catch (error) {
    console.error('Add book to shelf error:', error);
    throw new Error('Failed to add book to shelf');
  }
}

export async function removeBookFromShelf(bookId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.userBook.delete({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId,
        },
      },
    });

    // Revalidate caches
    revalidateTag(`user-books-${user.id}`);
    revalidateTag(`user-library-${user.id}`);

    return { success: true };
  } catch (error) {
    console.error('Remove book from shelf error:', error);
    throw new Error('Failed to remove book from shelf');
  }
}

export async function updateBookRating(bookId: string, rating: number) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate rating (0-10 scale for half-star support)
    if (rating < 0 || rating > 10) {
      throw new Error('Invalid rating');
    }

    await prisma.userBook.update({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId,
        },
      },
      data: {
        rating,
        updatedAt: new Date(),
      },
    });

    // Revalidate caches
    revalidateTag(`user-books-${user.id}`);
    revalidateTag(`user-library-${user.id}`);

    return { success: true };
  } catch (error) {
    console.error('Update book rating error:', error);
    throw new Error('Failed to update book rating');
  }
}

export async function getUserBooks(shelf?: Shelf) {
  try {
    const { userId } = auth();
    if (!userId) {
      return [];
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return [];
    }

    const userBooks = await prisma.userBook.findMany({
      where: {
        userId: user.id,
        ...(shelf ? { shelf } : {}),
      },
      include: {
        book: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return userBooks;
  } catch (error) {
    console.error('Get user books error:', error);
    return [];
  }
}

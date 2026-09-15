'use server';

import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function getBooksAction(params?: {
  search?: string;
  categorySlug?: string;
  filter?: 'all' | 'low_stock' | 'out_of_stock';
  page?: number;
  limit?: number;
}) {
  const search = params?.search?.trim() || '';
  const categorySlug = params?.categorySlug;
  const filter = params?.filter || 'all';
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { author: { contains: search } },
      { isbn: { contains: search } },
      { bookId: { contains: search } },
      { barcode: { equals: search } },
      { subject: { contains: search } },
      { classGrade: { contains: search } },
    ];
  }

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (filter === 'low_stock') {
    where.stockQuantity = { gt: 0, lte: prisma.book.fields.minStockThreshold };
  } else if (filter === 'out_of_stock') {
    where.stockQuantity = { equals: 0 };
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      include: { category: true },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.book.count({ where }),
  ]);

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  return { books, total, categories, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createBookAction(data: {
  isbn?: string;
  title: string;
  author: string;
  publisher: string;
  categoryId: string;
  subject?: string;
  classGrade?: string;
  description?: string;
  coverImage?: string;
  purchasePrice: number;
  sellingPrice: number;
  discount: number;
  stockQuantity: number;
  minStockThreshold: number;
  barcode?: string;
}) {
  const user = await getSession();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return { success: false, error: 'Unauthorized to add books.' };
  }

  try {
    const count = await prisma.book.count();
    const bookId = `BK-${(count + 1001).toString()}`;

    const book = await prisma.book.create({
      data: {
        bookId,
        isbn: data.isbn || null,
        title: data.title,
        author: data.author,
        publisher: data.publisher,
        categoryId: data.categoryId,
        subject: data.subject || null,
        classGrade: data.classGrade || null,
        description: data.description || null,
        coverImage: data.coverImage || null,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        discount: data.discount || 0,
        stockQuantity: data.stockQuantity || 0,
        minStockThreshold: data.minStockThreshold || 5,
        barcode: data.barcode || null,
        status: (data.stockQuantity || 0) > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
      },
    });

    if (data.stockQuantity > 0) {
      await prisma.inventoryLedger.create({
        data: {
          bookId: book.id,
          type: 'PURCHASE',
          quantity: data.stockQuantity,
          previousStock: 0,
          newStock: data.stockQuantity,
          userId: user.id,
          reason: 'Initial book creation restock',
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_BOOK',
        entity: 'Book',
        entityId: book.id,
        description: `Created book "${book.title}" (${book.bookId}) by ${user.name}.`,
      },
    });

    revalidatePath('/books');
    revalidatePath('/inventory');
    return { success: true, book };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create book.' };
  }
}

export async function updateBookAction(id: string, data: Partial<{
  isbn?: string;
  title: string;
  author: string;
  publisher: string;
  categoryId: string;
  subject?: string;
  classGrade?: string;
  description?: string;
  coverImage?: string;
  purchasePrice: number;
  sellingPrice: number;
  discount: number;
  minStockThreshold: number;
  barcode?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
}>) {
  const user = await getSession();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return { success: false, error: 'Unauthorized to edit books.' };
  }

  try {
    const book = await prisma.book.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_BOOK',
        entity: 'Book',
        entityId: book.id,
        description: `Updated book "${book.title}" (${book.bookId}) details.`,
      },
    });

    revalidatePath('/books');
    return { success: true, book };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update book.' };
  }
}

export async function adjustStockAction(data: {
  bookId: string;
  quantity: number;
  type: 'PURCHASE' | 'RETURN' | 'DAMAGE' | 'ADJUSTMENT' | 'RESTOCK';
  reason: string;
}) {
  const user = await getSession();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return { success: false, error: 'Unauthorized to adjust inventory.' };
  }

  try {
    const book = await prisma.book.findUnique({ where: { id: data.bookId } });
    if (!book) return { success: false, error: 'Book not found.' };

    let delta = data.quantity;
    if (data.type === 'DAMAGE' || (data.type === 'ADJUSTMENT' && data.quantity < 0)) {
      delta = -Math.abs(data.quantity);
    } else {
      delta = Math.abs(data.quantity);
    }

    const previousStock = book.stockQuantity;
    const newStock = Math.max(0, previousStock + delta);
    const newStatus = newStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE';

    await prisma.$transaction([
      prisma.book.update({
        where: { id: data.bookId },
        data: { stockQuantity: newStock, status: newStatus },
      }),
      prisma.inventoryLedger.create({
        data: {
          bookId: data.bookId,
          type: data.type,
          quantity: Math.abs(delta),
          previousStock,
          newStock,
          userId: user.id,
          reason: data.reason,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'ADJUST_STOCK',
          entity: 'Book',
          entityId: book.id,
          description: `Adjusted stock for "${book.title}" by ${delta} items (${data.type}). Reason: ${data.reason}`,
        },
      }),
    ]);

    revalidatePath('/books');
    revalidatePath('/inventory');
    return { success: true, previousStock, newStock };
  } catch (err: any) {
    return { success: false, error: err.message || 'Stock adjustment failed.' };
  }
}

export async function deleteBookAction(id: string) {
  const user = await getSession();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: 'Only Administrators can delete books.' };
  }

  try {
    const book = await prisma.book.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_BOOK',
        entity: 'Book',
        entityId: id,
        description: `Deleted book "${book.title}" (${book.bookId}).`,
      },
    });

    revalidatePath('/books');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete book.' };
  }
}

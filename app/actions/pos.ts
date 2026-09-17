'use server';

import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function searchBooksAction(query: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return prisma.book.findMany({
      where: { status: 'ACTIVE' },
      take: 20,
      include: { category: true },
      orderBy: { title: 'asc' },
    });
  }

  return prisma.book.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { title: { contains: cleanQuery } },
        { isbn: { contains: cleanQuery } },
        { bookId: { contains: cleanQuery } },
        { barcode: { equals: cleanQuery } },
        { author: { contains: cleanQuery } },
        { subject: { contains: cleanQuery } },
        { classGrade: { contains: cleanQuery } },
      ],
    },
    take: 30,
    include: { category: true },
    orderBy: { title: 'asc' },
  });
}

export async function searchCustomersAction(query: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return prisma.customer.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
  }

  return prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: cleanQuery } },
        { phone: { contains: cleanQuery } },
        { customerId: { contains: cleanQuery } },
        { email: { contains: cleanQuery } },
      ],
    },
    take: 15,
  });
}

export async function createCustomerInlineAction(data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const count = await prisma.customer.count();
  const customerId = `CUST-${(count + 1).toString().padStart(4, '0')}`;

  const customer = await prisma.customer.create({
    data: {
      customerId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      notes: data.notes,
    },
  });

  revalidatePath('/customers');
  return customer;
}

export interface POSCartItem {
  bookId: string;
  title: string;
  isbn?: string;
  unitPrice: number;
  quantity: number;
  discount: number;
}

export async function completeSaleAction(data: {
  customerId?: string;
  cartItems: POSCartItem[];
  globalDiscount: number;
  tax: number;
  paidAmount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'OTHER';
  notes?: string;
}) {
  const user = await getSession();
  if (!user) return { success: false, error: 'Unauthorized session.' };

  if (!data.cartItems || data.cartItems.length === 0) {
    return { success: false, error: 'Cart is empty. Please add items to complete sale.' };
  }

  const itemSubtotal = data.cartItems.reduce(
    (acc, item) => acc + (item.unitPrice * item.quantity - item.discount * item.quantity),
    0
  );
  const grandTotal = Math.max(0, itemSubtotal - (data.globalDiscount || 0) + (data.tax || 0));
  const paidAmount = Math.max(0, data.paidAmount || 0);
  const remainingAmount = Math.max(0, grandTotal - paidAmount);

  let paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' = 'UNPAID';
  if (paidAmount >= grandTotal && grandTotal > 0) {
    paymentStatus = 'PAID';
  } else if (paidAmount > 0) {
    paymentStatus = 'PARTIALLY_PAID';
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const prefixSetting = await tx.setting.findUnique({ where: { key: 'invoice_prefix' } });
      const prefix = prefixSetting?.value || 'INV-';
      const year = new Date().getFullYear();
      const count = await tx.sale.count();
      const invoiceNumber = `${prefix}${year}-${(count + 1).toString().padStart(5, '0')}`;

      const txCount = await tx.payment.count();
      const transactionId = `TXN-${year}-${(txCount + 1).toString().padStart(5, '0')}`;

      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: data.customerId || null,
          userId: user.id,
          subtotal: itemSubtotal,
          discount: data.globalDiscount || 0,
          tax: data.tax || 0,
          grandTotal,
          paidAmount,
          remainingAmount,
          paymentStatus,
          notes: data.notes,
          items: {
            create: data.cartItems.map((item) => ({
              bookId: item.bookId,
              bookTitle: item.title,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              subtotal: (item.unitPrice * item.quantity) - (item.discount * item.quantity),
            })),
          },
        },
      });

      for (const item of data.cartItems) {
        const book = await tx.book.findUnique({ where: { id: item.bookId } });
        if (!book) throw new Error(`Book not found ID: ${item.bookId}`);

        if (book.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for "${book.title}". Available: ${book.stockQuantity}, Requested: ${item.quantity}`);
        }

        const previousStock = book.stockQuantity;
        const newStock = previousStock - item.quantity;
        const newStatus = newStock === 0 ? 'OUT_OF_STOCK' : book.status;

        await tx.book.update({
          where: { id: item.bookId },
          data: {
            stockQuantity: newStock,
            status: newStatus,
          },
        });

        await tx.inventoryLedger.create({
          data: {
            bookId: item.bookId,
            type: 'SALE',
            quantity: item.quantity,
            previousStock,
            newStock,
            userId: user.id,
            reason: `Sale Invoice ${invoiceNumber}`,
          },
        });

        if (newStock <= book.minStockThreshold) {
          await tx.notification.create({
            data: {
              title: `Low Stock Alert: ${book.title}`,
              message: `Stock level for "${book.title}" dropped to ${newStock} (Min threshold: ${book.minStockThreshold}).`,
              type: 'LOW_STOCK',
              link: '/books?filter=low_stock',
            },
          });
        }
      }

      if (paidAmount > 0) {
        let prevCustBalance = 0;
        let remCustBalance = 0;

        if (data.customerId) {
          const cust = await tx.customer.findUnique({ where: { id: data.customerId } });
          if (cust) {
            prevCustBalance = cust.outstandingBalance;
            remCustBalance = prevCustBalance + remainingAmount;
          }
        }

        await tx.payment.create({
          data: {
            transactionId,
            saleId: sale.id,
            customerId: data.customerId || null,
            userId: user.id,
            method: data.paymentMethod,
            amount: paidAmount,
            previousBalance: prevCustBalance,
            remainingBalance: remCustBalance,
            notes: `Payment for POS Sale ${invoiceNumber}`,
          },
        });
      }

      if (data.customerId) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            totalPurchases: { increment: grandTotal },
            totalPaid: { increment: paidAmount },
            outstandingBalance: { increment: remainingAmount },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'COMPLETE_SALE',
          entity: 'Sale',
          entityId: sale.id,
          description: `Completed sale ${invoiceNumber} total ${grandTotal} PKR paid ${paidAmount} PKR by ${user.name}.`,
        },
      });

      return sale;
    });

    revalidatePath('/pos');
    revalidatePath('/sales');
    revalidatePath('/dashboard');
    revalidatePath('/books');
    revalidatePath('/payments');

    return { success: true, saleId: result.id, invoiceNumber: result.invoiceNumber };
  } catch (err: any) {
    console.error('POS Sale completion failed:', err);
    return { success: false, error: err.message || 'Failed to complete transaction.' };
  }
}

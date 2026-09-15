'use server';

import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export interface ReturnItemInput {
  bookId: string;
  quantity: number;
  unitPrice: number;
}

export async function processReturnAction(data: {
  saleId: string;
  items: ReturnItemInput[];
  refundType: 'REFUND_CASH' | 'STORE_CREDIT' | 'OUTSTANDING_ADJUSTMENT';
  reason?: string;
}) {
  const user = await getSession();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return { success: false, error: 'Unauthorized to process returns.' };
  }

  if (!data.items || data.items.length === 0) {
    return { success: false, error: 'No items selected for return.' };
  }

  try {
    const sale = await prisma.sale.findUnique({
      where: { id: data.saleId },
      include: { items: true, customer: true },
    });

    if (!sale) return { success: false, error: 'Sale record not found.' };

    const totalRefundAmount = data.items.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    );

    const year = new Date().getFullYear();
    const returnCount = await prisma.return.count();
    const returnNumber = `RET-${year}-${(returnCount + 1).toString().padStart(5, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Return Record
      const ret = await tx.return.create({
        data: {
          returnNumber,
          saleId: sale.id,
          userId: user.id,
          customerId: sale.customerId,
          totalRefundAmount,
          refundType: data.refundType,
          reason: data.reason,
          items: {
            create: data.items.map((item) => ({
              saleId: sale.id,
              bookId: item.bookId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              refundSubtotal: item.unitPrice * item.quantity,
            })),
          },
        },
      });

      // 2. Restock Inventory & Create Inventory Ledger Entries
      for (const item of data.items) {
        const book = await tx.book.findUnique({ where: { id: item.bookId } });
        if (book) {
          const prevStock = book.stockQuantity;
          const newStock = prevStock + item.quantity;

          await tx.book.update({
            where: { id: item.bookId },
            data: {
              stockQuantity: newStock,
              status: 'ACTIVE',
            },
          });

          await tx.inventoryLedger.create({
            data: {
              bookId: item.bookId,
              type: 'RETURN',
              quantity: item.quantity,
              previousStock: prevStock,
              newStock,
              userId: user.id,
              reason: `Sale Return ${returnNumber} for Invoice ${sale.invoiceNumber}`,
            },
          });
        }
      }

      // 3. Update Sale Status
      await tx.sale.update({
        where: { id: sale.id },
        data: { status: 'RETURNED' },
      });

      // 4. Adjust Customer Financial Balance if Outstanding Adjustment
      if (data.refundType === 'OUTSTANDING_ADJUSTMENT' && sale.customerId) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: {
            outstandingBalance: { decrement: totalRefundAmount },
          },
        });
      }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'PROCESS_RETURN',
          entity: 'Return',
          entityId: ret.id,
          description: `Processed return ${returnNumber} for Invoice ${sale.invoiceNumber} (Total refund: ${totalRefundAmount} PKR).`,
        },
      });

      return ret;
    });

    revalidatePath('/returns');
    revalidatePath('/sales');
    revalidatePath('/inventory');
    revalidatePath('/books');
    revalidatePath('/dashboard');

    return { success: true, returnNumber: result.returnNumber };
  } catch (err: any) {
    return { success: false, error: err.message || 'Return processing failed.' };
  }
}

export async function getReturnsAction() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  return prisma.return.findMany({
    include: {
      sale: true,
      customer: true,
      user: { select: { name: true, employeeId: true } },
      items: { include: { book: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

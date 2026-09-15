'use server';

import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function getSalesAction(params?: {
  search?: string;
  paymentStatus?: string;
  saleStatus?: string;
  employeeId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const page = params?.page || 1;
  const limit = params?.limit || 30;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (user.role === 'EMPLOYEE') {
    where.userId = user.id;
  } else if (params?.employeeId) {
    where.userId = params.employeeId;
  }

  if (params?.search) {
    const s = params.search.trim();
    where.OR = [
      { invoiceNumber: { contains: s } },
      { customer: { name: { contains: s } } },
      { customer: { phone: { contains: s } } },
      { user: { name: { contains: s } } },
    ];
  }

  if (params?.paymentStatus && params.paymentStatus !== 'ALL') {
    where.paymentStatus = params.paymentStatus;
  }

  if (params?.saleStatus && params.saleStatus !== 'ALL') {
    where.status = params.saleStatus;
  }

  if (params?.customerId) {
    where.customerId = params.customerId;
  }

  if (params?.startDate || params?.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = new Date(params.startDate);
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: true,
        user: { select: { id: true, name: true, employeeId: true } },
        items: { include: { book: true } },
        payments: true,
        returns: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  const employees = await prisma.user.findMany({
    select: { id: true, name: true, employeeId: true },
    orderBy: { name: 'asc' },
  });

  return { sales, total, employees, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getSaleDetailsAction(saleId: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      user: { select: { id: true, name: true, employeeId: true, email: true, phone: true } },
      items: { include: { book: true } },
      payments: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
      returns: {
        include: {
          items: { include: { book: true } },
          user: { select: { name: true } },
        },
      },
    },
  });

  const settings = await prisma.setting.findMany();
  const companyInfo: Record<string, string> = {};
  settings.forEach((s) => (companyInfo[s.key] = s.value));

  return { sale, companyInfo };
}

export async function recordPaymentAction(data: {
  saleId: string;
  amount: number;
  method: 'CASH' | 'BANK_TRANSFER' | 'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'OTHER';
  notes?: string;
}) {
  const user = await getSession();
  if (!user) return { success: false, error: 'Unauthorized.' };

  if (data.amount <= 0) {
    return { success: false, error: 'Payment amount must be greater than zero.' };
  }

  try {
    const sale = await prisma.sale.findUnique({
      where: { id: data.saleId },
      include: { customer: true },
    });

    if (!sale) return { success: false, error: 'Sale record not found.' };

    if (sale.remainingAmount <= 0) {
      return { success: false, error: 'This invoice is already fully paid.' };
    }

    const newPaidAmount = sale.paidAmount + data.amount;
    const newRemainingAmount = Math.max(0, sale.grandTotal - newPaidAmount);
    const newStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' =
      newRemainingAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';

    const year = new Date().getFullYear();
    const txCount = await prisma.payment.count();
    const transactionId = `TXN-${year}-${(txCount + 1).toString().padStart(5, '0')}`;

    let prevCustBal = 0;
    let newCustBal = 0;

    if (sale.customerId && sale.customer) {
      prevCustBal = sale.customer.outstandingBalance;
      newCustBal = Math.max(0, prevCustBal - data.amount);
    }

    await prisma.$transaction([
      prisma.sale.update({
        where: { id: data.saleId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          paymentStatus: newStatus,
        },
      }),

      prisma.payment.create({
        data: {
          transactionId,
          saleId: data.saleId,
          customerId: sale.customerId,
          userId: user.id,
          method: data.method,
          amount: data.amount,
          previousBalance: prevCustBal,
          remainingBalance: newCustBal,
          notes: data.notes || `Subsequent payment for Invoice ${sale.invoiceNumber}`,
        },
      }),

      ...(sale.customerId
        ? [
            prisma.customer.update({
              where: { id: sale.customerId },
              data: {
                totalPaid: { increment: data.amount },
                outstandingBalance: { decrement: data.amount },
              },
            }),
          ]
        : []),

      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'RECORD_PAYMENT',
          entity: 'Payment',
          entityId: transactionId,
          description: `Recorded payment of ${data.amount} PKR for invoice ${sale.invoiceNumber} by ${user.name}.`,
        },
      }),
    ]);

    revalidatePath('/sales');
    revalidatePath('/payments');
    revalidatePath('/customers');
    revalidatePath('/dashboard');

    return { success: true, transactionId, newRemainingAmount };
  } catch (err: any) {
    return { success: false, error: err.message || 'Payment recording failed.' };
  }
}

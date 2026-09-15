'use server';

import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { canViewExpenses } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function getExpensesAction(params?: { category?: string; startDate?: string; endDate?: string }) {
  const user = await getSession();
  if (!user || !canViewExpenses(user.role)) {
    throw new Error('Unauthorized to access expenses.');
  }

  const where: any = {};
  if (params?.category && params.category !== 'ALL') {
    where.category = params.category;
  }

  if (params?.startDate || params?.endDate) {
    where.date = {};
    if (params.startDate) where.date.gte = new Date(params.startDate);
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      where.date.lte = end;
    }
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      user: { select: { name: true, employeeId: true } },
    },
    orderBy: { date: 'desc' },
  });

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  return { expenses, totalExpense };
}

export async function createExpenseAction(data: {
  title: string;
  category: 'RENT' | 'ELECTRICITY' | 'TRANSPORT' | 'SALARIES' | 'PACKAGING' | 'PRINTING' | 'OTHER';
  amount: number;
  method: 'CASH' | 'BANK_TRANSFER' | 'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'OTHER';
  description?: string;
  date?: string;
}) {
  const user = await getSession();
  if (!user || !canViewExpenses(user.role)) {
    return { success: false, error: 'Unauthorized to add expenses.' };
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        title: data.title,
        category: data.category,
        amount: data.amount,
        method: data.method,
        description: data.description || null,
        userId: user.id,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_EXPENSE',
        entity: 'Expense',
        entityId: expense.id,
        description: `Recorded expense "${expense.title}" (${expense.amount} PKR) under ${expense.category}.`,
      },
    });

    revalidatePath('/expenses');
    revalidatePath('/reports');
    revalidatePath('/dashboard');
    return { success: true, expense };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record expense.' };
  }
}

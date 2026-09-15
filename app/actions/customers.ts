'use server';

import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function getCustomersAction(params?: { search?: string; page?: number; limit?: number }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const page = params?.page || 1;
  const limit = params?.limit || 30;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params?.search) {
    const s = params.search.trim();
    where.OR = [
      { name: { contains: s } },
      { customerId: { contains: s } },
      { phone: { contains: s } },
      { email: { contains: s } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: { select: { sales: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getCustomerDetailsAction(id: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } }, items: { include: { book: true } } },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      },
      returns: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return customer;
}

export async function createCustomerAction(data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  const user = await getSession();
  if (!user) return { success: false, error: 'Unauthorized.' };

  try {
    const count = await prisma.customer.count();
    const customerId = `CUST-${(count + 1).toString().padStart(4, '0')}`;

    const customer = await prisma.customer.create({
      data: {
        customerId,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
      },
    });

    revalidatePath('/customers');
    return { success: true, customer };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create customer.' };
  }
}

export async function updateCustomerAction(id: string, data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  const user = await getSession();
  if (!user) return { success: false, error: 'Unauthorized.' };

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
      },
    });

    revalidatePath('/customers');
    return { success: true, customer };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update customer.' };
  }
}

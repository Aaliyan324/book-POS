'use server';

import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function globalSearchAction(query: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const clean = query.trim();
  if (!clean || clean.length < 2) {
    return { books: [], customers: [], invoices: [], employees: [] };
  }

  const [books, customers, invoices, employees] = await Promise.all([
    prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: clean } },
          { isbn: { contains: clean } },
          { bookId: { contains: clean } },
          { barcode: { equals: clean } },
          { author: { contains: clean } },
        ],
      },
      take: 6,
      select: { id: true, bookId: true, title: true, author: true, sellingPrice: true, stockQuantity: true },
    }),
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: clean } },
          { customerId: { contains: clean } },
          { phone: { contains: clean } },
        ],
      },
      take: 6,
      select: { id: true, customerId: true, name: true, phone: true, outstandingBalance: true },
    }),
    prisma.sale.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: clean } },
          { customer: { name: { contains: clean } } },
        ],
      },
      take: 6,
      select: { id: true, invoiceNumber: true, grandTotal: true, paymentStatus: true, createdAt: true },
    }),
    user.role === 'ADMIN'
      ? prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: clean } },
              { employeeId: { contains: clean } },
              { email: { contains: clean } },
            ],
          },
          take: 6,
          select: { id: true, employeeId: true, name: true, role: true, email: true },
        })
      : Promise.resolve([]),
  ]);

  return { books, customers, invoices, employees };
}

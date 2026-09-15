'use server';

import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function getDashboardMetricsAction() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Today's Sales
  const todaySales = await prisma.sale.findMany({
    where: {
      createdAt: { gte: startOfToday, lte: endOfToday },
      status: { not: 'CANCELLED' },
    },
    include: { items: true },
  });

  const todaySalesRevenue = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);
  const todayOrdersCount = todaySales.length;
  const todayBooksSold = todaySales.reduce(
    (acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  // All time / Aggregate Metrics
  const [
    allSales,
    allExpenses,
    lowStockBooksCount,
    totalCustomers,
    recentSales,
    lowStockBooks,
    outstandingSales,
  ] = await Promise.all([
    prisma.sale.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { grandTotal: true, paidAmount: true, remainingAmount: true },
    }),
    prisma.expense.findMany({
      select: { amount: true },
    }),
    prisma.book.count({
      where: {
        stockQuantity: { lte: prisma.book.fields.minStockThreshold },
      },
    }),
    prisma.customer.count(),
    prisma.sale.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        user: { select: { name: true, employeeId: true } },
        items: { include: { book: true } },
      },
    }),
    prisma.book.findMany({
      where: {
        stockQuantity: { lte: prisma.book.fields.minStockThreshold },
      },
      include: { category: true },
      take: 8,
      orderBy: { stockQuantity: 'asc' },
    }),
    prisma.sale.findMany({
      where: { remainingAmount: { gt: 0 }, status: { not: 'CANCELLED' } },
      include: { customer: true, user: { select: { name: true } } },
      take: 8,
      orderBy: { remainingAmount: 'desc' },
    }),
  ]);

  const totalRevenue = allSales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalPaidCollected = allSales.reduce((acc, s) => acc + s.paidAmount, 0);
  const outstandingAmount = allSales.reduce((acc, s) => acc + s.remainingAmount, 0);
  const totalExpenses = allExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Generate Daily Sales Chart Data for the last 7 days
  const last7DaysChartData: Array<{ date: string; sales: number; orders: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d.setHours(0, 0, 0, 0));
    const dayEnd = new Date(d.setHours(23, 59, 59, 999));

    const daySales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: dayStart, lte: dayEnd },
        status: { not: 'CANCELLED' },
      },
      select: { grandTotal: true },
    });

    const dayRev = daySales.reduce((acc, s) => acc + s.grandTotal, 0);
    const dateLabel = dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    last7DaysChartData.push({
      date: dateLabel,
      sales: dayRev,
      orders: daySales.length,
    });
  }

  return {
    todaySalesRevenue,
    todayOrdersCount,
    todayBooksSold,
    totalRevenue,
    totalPaidCollected,
    outstandingAmount,
    lowStockBooksCount,
    totalCustomers,
    totalExpenses,
    netProfit,
    last7DaysChartData,
    recentSales,
    lowStockBooks,
    outstandingSales,
  };
}

export async function getReportsDataAction(filterType: 'sales' | 'inventory' | 'employee' | 'financial' | 'books', range: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const now = new Date();
  let startDate = new Date();

  if (range === '7days') {
    startDate.setDate(now.getDate() - 7);
  } else if (range === '30days') {
    startDate.setDate(now.getDate() - 30);
  } else if (range === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === 'this_year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    startDate.setDate(now.getDate() - 30);
  }

  if (filterType === 'sales') {
    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: startDate } },
      include: { customer: true, user: { select: { name: true, employeeId: true } }, items: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalSalesRev = sales.reduce((acc, s) => acc + s.grandTotal, 0);
    const totalPaid = sales.reduce((acc, s) => acc + s.paidAmount, 0);
    const totalRemaining = sales.reduce((acc, s) => acc + s.remainingAmount, 0);

    return { type: 'sales', sales, totalSalesRev, totalPaid, totalRemaining };
  }

  if (filterType === 'financial') {
    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: { createdAt: { gte: startDate } },
        select: { grandTotal: true, paidAmount: true, remainingAmount: true },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startDate } },
        include: { user: { select: { name: true } } },
        orderBy: { date: 'desc' },
      }),
    ]);

    const totalRevenue = sales.reduce((acc, s) => acc + s.grandTotal, 0);
    const totalCollected = sales.reduce((acc, s) => acc + s.paidAmount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    return { type: 'financial', sales, expenses, totalRevenue, totalCollected, totalExpenses, netProfit };
  }

  if (filterType === 'inventory') {
    const inventoryLogs = await prisma.inventoryLedger.findMany({
      where: { createdAt: { gte: startDate } },
      include: { book: true, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const books = await prisma.book.findMany({
      include: { category: true },
      orderBy: { title: 'asc' },
    });

    return { type: 'inventory', inventoryLogs, books };
  }

  if (filterType === 'employee') {
    const employees = await prisma.user.findMany({
      include: {
        sales: {
          where: { createdAt: { gte: startDate } },
          include: { items: true },
        },
        payments: {
          where: { createdAt: { gte: startDate } },
        },
      },
    });

    const stats = employees.map((e) => ({
      id: e.id,
      employeeId: e.employeeId,
      name: e.name,
      role: e.role,
      ordersCount: e.sales.length,
      revenueGenerated: e.sales.reduce((acc, s) => acc + s.grandTotal, 0),
      collectedAmount: e.payments.reduce((acc, p) => acc + p.amount, 0),
      outstandingCreated: e.sales.reduce((acc, s) => acc + s.remainingAmount, 0),
    }));

    return { type: 'employee', stats };
  }

  if (filterType === 'books') {
    const saleItems = await prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: startDate } } },
      include: { book: { include: { category: true } } },
    });

    const bookSalesMap: Record<string, { book: any; quantitySold: number; totalRevenue: number }> = {};
    saleItems.forEach((item) => {
      if (!bookSalesMap[item.bookId]) {
        bookSalesMap[item.bookId] = {
          book: item.book,
          quantitySold: 0,
          totalRevenue: 0,
        };
      }
      bookSalesMap[item.bookId].quantitySold += item.quantity;
      bookSalesMap[item.bookId].totalRevenue += item.subtotal;
    });

    const rankedBooks = Object.values(bookSalesMap).sort((a, b) => b.quantitySold - a.quantitySold);
    return { type: 'books', rankedBooks };
  }

  return { type: 'none' };
}

import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { PaymentLedgerView } from '@/components/payments/payment-ledger-view';
import { prisma } from '@/lib/db/prisma';

export default async function PaymentsPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const [customers, walkInSales, companySettingsRaw] = await Promise.all([
    prisma.customer.findMany({
      include: {
        sales: {
          include: {
            items: { include: { book: true } },
            payments: {
              include: { user: { select: { name: true } } },
              orderBy: { createdAt: 'asc' },
            },
            returns: true,
            user: { select: { name: true, employeeId: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          include: { user: { select: { name: true } }, sale: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.sale.findMany({
      where: { customerId: null },
      include: {
        items: { include: { book: true } },
        payments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        returns: true,
        user: { select: { name: true, employeeId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.setting.findMany(),
  ]);

  const companySettings: Record<string, string> = {};
  companySettingsRaw.forEach((s) => {
    companySettings[s.key] = s.value;
  });

  return (
    <MainLayout user={user} title="Customer Payment Ledgers">
      <PaymentLedgerView
        customers={customers}
        walkInSales={walkInSales}
        companySettings={companySettings}
      />
    </MainLayout>
  );
}

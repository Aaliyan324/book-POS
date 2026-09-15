import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { PaymentLedgerView } from '@/components/payments/payment-ledger-view';
import { prisma } from '@/lib/db/prisma';

export default async function PaymentsPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const [payments, outstandingSales] = await Promise.all([
    prisma.payment.findMany({
      include: {
        sale: true,
        customer: true,
        user: { select: { name: true, employeeId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.sale.findMany({
      where: { remainingAmount: { gt: 0 }, status: { not: 'CANCELLED' } },
      include: { customer: true, user: { select: { name: true } } },
      orderBy: { remainingAmount: 'desc' },
    }),
  ]);

  return (
    <MainLayout user={user} title="Payment Ledger & Outstanding Credit">
      <PaymentLedgerView payments={payments} outstandingSales={outstandingSales} />
    </MainLayout>
  );
}

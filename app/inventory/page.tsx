import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { InventoryLedgerTable } from '@/components/inventory/inventory-ledger-table';
import { prisma } from '@/lib/db/prisma';

export default async function InventoryPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const logs = await prisma.inventoryLedger.findMany({
    include: {
      book: true,
      user: { select: { name: true, employeeId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <MainLayout user={user} title="Inventory Movement Ledger">
      <InventoryLedgerTable logs={logs} />
    </MainLayout>
  );
}

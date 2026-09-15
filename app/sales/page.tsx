import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { SalesTable } from '@/components/sales/sales-table';
import { getSalesAction } from '@/app/actions/sales';
import { prisma } from '@/lib/db/prisma';

export default async function SalesPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const { sales, employees } = await getSalesAction({ limit: 50 });
  const settings = await prisma.setting.findMany();
  const companySettings: Record<string, string> = {};
  settings.forEach((s) => (companySettings[s.key] = s.value));

  return (
    <MainLayout user={user} title="Sales Management">
      <SalesTable initialSales={sales} employees={employees} companySettings={companySettings} />
    </MainLayout>
  );
}

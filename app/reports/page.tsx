import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { ReportsView } from '@/components/reports/reports-view';

export default async function ReportsPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  return (
    <MainLayout user={user} title="Business Reports & Export Center">
      <ReportsView />
    </MainLayout>
  );
}

import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { getDashboardMetricsAction } from '@/app/actions/reports';

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const metrics = await getDashboardMetricsAction();

  return (
    <MainLayout user={user} title="Business Dashboard">
      <DashboardView metrics={metrics} />
    </MainLayout>
  );
}

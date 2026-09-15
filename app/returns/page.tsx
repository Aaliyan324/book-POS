import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { ReturnsManagement } from '@/components/returns/returns-management';
import { getReturnsAction } from '@/app/actions/returns';

export default async function ReturnsPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const returnsList = await getReturnsAction();

  return (
    <MainLayout user={user} title="Sales Returns & Restock Management">
      <ReturnsManagement returnsList={returnsList} />
    </MainLayout>
  );
}

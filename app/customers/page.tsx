import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { CustomerManagement } from '@/components/customers/customer-management';
import { getCustomersAction } from '@/app/actions/customers';

export default async function CustomersPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const { customers } = await getCustomersAction({ limit: 100 });

  return (
    <MainLayout user={user} title="Customer Directory & Credit Balances">
      <CustomerManagement initialCustomers={customers} />
    </MainLayout>
  );
}

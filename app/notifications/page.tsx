import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { NotificationsView } from '@/components/notifications/notifications-view';
import { getNotificationsAction } from '@/app/actions/notifications';

export default async function NotificationsPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const { notifications } = await getNotificationsAction();

  return (
    <MainLayout user={user} title="System Alerts & Notifications">
      <NotificationsView notifications={notifications} />
    </MainLayout>
  );
}

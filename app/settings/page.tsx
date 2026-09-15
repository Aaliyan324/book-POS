import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { SettingsView } from '@/components/settings/settings-view';
import { getSettingsAction } from '@/app/actions/settings';
import { canManageSettings } from '@/lib/permissions';

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!canManageSettings(user.role)) redirect('/dashboard');

  const settings = await getSettingsAction();

  return (
    <MainLayout user={user} title="System & Company Settings">
      <SettingsView initialSettings={settings} />
    </MainLayout>
  );
}

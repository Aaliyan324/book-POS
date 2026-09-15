import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { POSInterface } from '@/components/pos/pos-interface';
import { prisma } from '@/lib/db/prisma';

export default async function POSPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  const settings = await prisma.setting.findMany();
  const companySettings: Record<string, string> = {};
  settings.forEach((s) => (companySettings[s.key] = s.value));

  return (
    <MainLayout user={user} title="Point of Sale Console" fullWidth>
      <POSInterface initialCategories={categories} companySettings={companySettings} />
    </MainLayout>
  );
}

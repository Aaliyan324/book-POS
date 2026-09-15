'use server';

import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { canManageSettings } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function getSettingsAction() {
  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  settings.forEach((s) => (map[s.key] = s.value));
  return map;
}

export async function updateSettingsAction(data: Record<string, string>) {
  const user = await getSession();
  if (!user || !canManageSettings(user.role)) {
    return { success: false, error: 'Forbidden: Admin permissions required.' };
  }

  try {
    for (const [key, value] of Object.entries(data)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_SETTINGS',
        entity: 'Setting',
        description: `Updated system settings by ${user.name}.`,
      },
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update settings.' };
  }
}

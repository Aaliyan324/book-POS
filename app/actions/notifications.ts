'use server';

import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function getNotificationsAction() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const unreadCount = await prisma.notification.count({ where: { isRead: false } });

  return { notifications, unreadCount };
}

export async function markNotificationReadAction(id: string) {
  const user = await getSession();
  if (!user) return { success: false };

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  revalidatePath('/', 'layout');
  return { success: true };
}

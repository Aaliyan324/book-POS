'use server';

import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword, createSession, destroySession, getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function loginAction(prevState: any, formData: FormData) {
  const loginInput = formData.get('loginInput') as string;
  const password = formData.get('password') as string;

  if (!loginInput || !password) {
    return { error: 'Please provide email/Employee ID and password.' };
  }

  const cleanInput = loginInput.trim();

  // Find user by email or employeeId
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: cleanInput } },
        { employeeId: { equals: cleanInput } },
      ],
    },
  });

  if (!user) {
    return { error: 'Invalid credentials. User not found.' };
  }

  if (user.status !== 'ACTIVE') {
    return { error: 'This account has been deactivated. Please contact your manager.' };
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return { error: 'Invalid credentials. Incorrect password.' };
  }

  // Create HTTP-only session cookie
  await createSession(user.id);

  // Log Audit Event
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      description: `User ${user.name} (${user.employeeId}) logged into POS system.`,
    },
  }).catch(() => {});

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function logoutAction() {
  const currentUser = await getSession();
  if (currentUser) {
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'LOGOUT',
        entity: 'User',
        entityId: currentUser.id,
        description: `User ${currentUser.name} logged out.`,
      },
    }).catch(() => {});
  }

  await destroySession();
  redirect('/login');
}

export async function getCurrentUserAction() {
  return getSession();
}

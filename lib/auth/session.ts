import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { Role } from '@/lib/permissions';

export const SESSION_COOKIE_NAME = 'pos_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.deleteMany({
    where: {
      OR: [
        { userId },
        { expiresAt: { lt: new Date() } }
      ]
    }
  });

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          joiningDate: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (token) {
      await prisma.session.deleteMany({ where: { token } }).catch(() => {});
    }
    return null;
  }

  if (session.user.status !== 'ACTIVE') {
    return null;
  }

  return {
    ...session.user,
    role: session.user.role as Role,
  };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

'use server';

import { prisma } from '@/lib/db/prisma';
import { getSession, hashPassword } from '@/lib/auth/session';
import { canManageEmployees } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function getEmployeesAction() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  if (!canManageEmployees(user.role)) {
    throw new Error('Forbidden: Only Admins can view employee management.');
  }

  const [employees, allBooks] = await Promise.all([
    prisma.user.findMany({
      orderBy: { employeeId: 'asc' },
      include: {
        sales: {
          select: {
            grandTotal: true,
            paidAmount: true,
            remainingAmount: true,
            items: { select: { quantity: true } },
          },
        },
        payments: {
          select: { amount: true },
        },
        allowedBooks: {
          select: { bookId: true },
        },
      },
    }),
    prisma.book.findMany({
      select: { id: true, title: true, bookId: true, author: true },
      orderBy: { title: 'asc' },
    }),
  ]);

  // Calculate performance metrics per employee
  const employeePerformance = employees.map((emp) => {
    const totalOrders = emp.sales.length;
    const totalRevenue = emp.sales.reduce((acc, s) => acc + s.grandTotal, 0);
    const paymentsCollected = emp.payments.reduce((acc, p) => acc + p.amount, 0);
    const outstandingCreated = emp.sales.reduce((acc, s) => acc + s.remainingAmount, 0);
    const booksSold = emp.sales.reduce(
      (acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0),
      0
    );
    const allowedBookIds = emp.allowedBooks.map((b) => b.bookId);

    return {
      id: emp.id,
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      status: emp.status,
      joiningDate: emp.joiningDate,
      totalOrders,
      totalRevenue,
      paymentsCollected,
      outstandingCreated,
      booksSold,
      allowedBookIds,
    };
  });

  return { employees: employeePerformance, allBooks };
}

export async function createEmployeeAction(data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  allowedBookIds?: string[];
}) {
  const user = await getSession();
  if (!user || !canManageEmployees(user.role)) {
    return { success: false, error: 'Forbidden: Admin access required.' };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return { success: false, error: 'An employee with this email already exists.' };
    }

    const count = await prisma.user.count();
    const employeeId = `EMP-${(count + 1).toString().padStart(4, '0')}`;
    const passwordHash = await hashPassword(data.password);

    const employee = await prisma.user.create({
      data: {
        employeeId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        passwordHash,
        role: data.role,
        status: 'ACTIVE',
      },
    });

    if (data.allowedBookIds && data.allowedBookIds.length > 0) {
      await prisma.employeeBook.createMany({
        data: data.allowedBookIds.map((bookId) => ({
          userId: employee.id,
          bookId,
        })),
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_EMPLOYEE',
        entity: 'User',
        entityId: employee.id,
        description: `Created new employee "${employee.name}" (${employee.employeeId}) with role ${employee.role}.`,
      },
    });

    revalidatePath('/employees');
    return { success: true, employee };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create employee.' };
  }
}

export async function updateEmployeeAction(id: string, data: {
  name?: string;
  phone?: string;
  role?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  status?: 'ACTIVE' | 'INACTIVE';
  allowedBookIds?: string[];
}) {
  const user = await getSession();
  if (!user || !canManageEmployees(user.role)) {
    return { success: false, error: 'Forbidden: Admin access required.' };
  }

  try {
    const { allowedBookIds, ...userData } = data;

    const employee = await prisma.user.update({
      where: { id },
      data: userData,
    });

    if (allowedBookIds !== undefined) {
      await prisma.$transaction([
        prisma.employeeBook.deleteMany({ where: { userId: id } }),
        ...(allowedBookIds.length > 0
          ? [
              prisma.employeeBook.createMany({
                data: allowedBookIds.map((bookId) => ({
                  userId: id,
                  bookId,
                })),
              }),
            ]
          : []),
      ]);
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_EMPLOYEE',
        entity: 'User',
        entityId: employee.id,
        description: `Updated employee "${employee.name}" (${employee.employeeId}) details & book permissions.`,
      },
    });

    revalidatePath('/employees');
    return { success: true, employee };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update employee.' };
  }
}

export async function resetEmployeePasswordAction(id: string, newPassword: string) {
  const user = await getSession();
  if (!user || !canManageEmployees(user.role)) {
    return { success: false, error: 'Forbidden: Admin access required.' };
  }

  try {
    const passwordHash = await hashPassword(newPassword);
    const employee = await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'RESET_PASSWORD',
        entity: 'User',
        entityId: employee.id,
        description: `Reset password for employee "${employee.name}" (${employee.employeeId}).`,
      },
    });

    revalidatePath('/employees');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Password reset failed.' };
  }
}

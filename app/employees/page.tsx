import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { EmployeeManagement } from '@/components/employees/employee-management';
import { getEmployeesAction } from '@/app/actions/employees';
import { canManageEmployees } from '@/lib/permissions';

export default async function EmployeesPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!canManageEmployees(user.role)) redirect('/dashboard');

  const { employees, allBooks } = await getEmployeesAction();

  return (
    <MainLayout user={user} title="Employee Management & Performance">
      <EmployeeManagement initialEmployees={employees} allBooks={allBooks} />
    </MainLayout>
  );
}

import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { ExpenseTracker } from '@/components/expenses/expense-tracker';
import { getExpensesAction } from '@/app/actions/expenses';
import { canViewExpenses } from '@/lib/permissions';

export default async function ExpensesPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!canViewExpenses(user.role)) redirect('/dashboard');

  const { expenses, totalExpense } = await getExpensesAction();

  return (
    <MainLayout user={user} title="Operating Expenses Tracker">
      <ExpenseTracker initialExpenses={expenses} totalExpense={totalExpense} />
    </MainLayout>
  );
}

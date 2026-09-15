import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { BookCatalog } from '@/components/books/book-catalog';
import { getBooksAction } from '@/app/actions/books';

export default async function BooksPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const { books, categories } = await getBooksAction({ limit: 100 });

  return (
    <MainLayout user={user} title="Book Catalog & Inventory">
      <BookCatalog initialBooks={books} categories={categories} userRole={user.role} />
    </MainLayout>
  );
}

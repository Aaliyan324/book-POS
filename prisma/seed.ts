import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Settings
  console.log('Seeding settings...');
  const settingsData = [
    { key: 'company_name', value: 'Sunlight Book Distributors' },
    { key: 'company_phone', value: '+92 300 1234567' },
    { key: 'company_email', value: 'pos@sunlightbooks.pk' },
    { key: 'company_address', value: 'Main Commercial Market, Block H, Gulberg III, Lahore' },
    { key: 'currency', value: 'Rs.' },
    { key: 'tax_rate', value: '0' },
    { key: 'invoice_prefix', value: 'INV-' },
    { key: 'pos_receipt_footer', value: 'Thank you for shopping at Sunlight Books! Knowledge is light.' },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // 2. Seed Users
  console.log('Seeding users...');
  const defaultPasswordHash = await hashPassword('admin123');
  const empPasswordHash = await hashPassword('emp123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bookpos.com' },
    update: {},
    create: {
      employeeId: 'EMP-0001',
      name: 'Ahsan Malik',
      email: 'admin@bookpos.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+92 300 9876543',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@bookpos.com' },
    update: {},
    create: {
      employeeId: 'EMP-0002',
      name: 'Fatima Raza',
      email: 'manager@bookpos.com',
      passwordHash: empPasswordHash,
      role: 'MANAGER',
      status: 'ACTIVE',
      phone: '+92 321 5551234',
    },
  });

  const emp1 = await prisma.user.upsert({
    where: { email: 'emp1@bookpos.com' },
    update: {},
    create: {
      employeeId: 'EMP-0003',
      name: 'Muhammad Usman',
      email: 'emp1@bookpos.com',
      passwordHash: empPasswordHash,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      phone: '+92 333 4445556',
    },
  });

  const emp2 = await prisma.user.upsert({
    where: { email: 'emp2@bookpos.com' },
    update: {},
    create: {
      employeeId: 'EMP-0004',
      name: 'Zainab Ahmed',
      email: 'emp2@bookpos.com',
      passwordHash: empPasswordHash,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      phone: '+92 312 8889990',
    },
  });

  // 3. Seed Categories
  console.log('Seeding categories...');
  const catAcademic = await prisma.category.upsert({
    where: { slug: 'academic-textbooks' },
    update: {},
    create: {
      name: 'Academic Textbooks',
      slug: 'academic-textbooks',
      description: 'School & College Curriculum Textbooks',
    },
  });

  const catCS = await prisma.category.upsert({
    where: { slug: 'computer-science' },
    update: {},
    create: {
      name: 'Computer Science & Tech',
      slug: 'computer-science',
      description: 'Software, Programming, Data Science & Engineering',
    },
  });

  const catLiterature = await prisma.category.upsert({
    where: { slug: 'fiction-literature' },
    update: {},
    create: {
      name: 'Fiction & Literature',
      slug: 'fiction-literature',
      description: 'Classic literature, novels, and poetry',
    },
  });

  const catIslamic = await prisma.category.upsert({
    where: { slug: 'islamic-history' },
    update: {},
    create: {
      name: 'Islamic Studies & History',
      slug: 'islamic-history',
      description: 'Islamic history, philosophy, and reference guides',
    },
  });

  const catChildren = await prisma.category.upsert({
    where: { slug: 'children-books' },
    update: {},
    create: {
      name: 'Children & Young Adult',
      slug: 'children-books',
      description: 'Story books, activity workbooks, and early learning',
    },
  });

  // 4. Seed Books
  console.log('Seeding books...');
  const booksData = [
    {
      bookId: 'BK-1001',
      isbn: '978-0131103627',
      title: 'The C Programming Language (2nd Ed)',
      author: 'Brian W. Kernighan, Dennis M. Ritchie',
      publisher: 'Prentice Hall',
      categoryId: catCS.id,
      subject: 'Computer Science',
      classGrade: 'BS CS / Higher Ed',
      description: 'The definitive handbook for C programming.',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
      purchasePrice: 1200,
      sellingPrice: 1800,
      discount: 100,
      stockQuantity: 25,
      minStockThreshold: 5,
      barcode: '9780131103627',
      status: 'ACTIVE' as const,
    },
    {
      bookId: 'BK-1002',
      isbn: '978-0262033848',
      title: 'Introduction to Algorithms (CLRS 3rd Ed)',
      author: 'Thomas H. Cormen, Charles E. Leiserson',
      publisher: 'MIT Press',
      categoryId: catCS.id,
      subject: 'Computer Science',
      classGrade: 'BS CS',
      description: 'Standard textbook for data structures and algorithms.',
      coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80',
      purchasePrice: 3500,
      sellingPrice: 4800,
      discount: 300,
      stockQuantity: 12,
      minStockThreshold: 5,
      barcode: '9780262033848',
      status: 'ACTIVE' as const,
    },
    {
      bookId: 'BK-1003',
      isbn: '978-9694001234',
      title: 'Physics for Class IX & X (Federal Board)',
      author: 'Dr. M. Akram',
      publisher: 'Caravan Book House',
      categoryId: catAcademic.id,
      subject: 'Physics',
      classGrade: 'Class 9-10',
      description: 'Comprehensive Matriculation physics textbook with solved examples.',
      coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80',
      purchasePrice: 450,
      sellingPrice: 650,
      discount: 50,
      stockQuantity: 4, // LOW STOCK
      minStockThreshold: 10,
      barcode: '9789694001234',
      status: 'ACTIVE' as const,
    },
    {
      bookId: 'BK-1004',
      isbn: '978-9694005678',
      title: 'Mathematics Class XI (FSc Part 1)',
      author: 'Prof. Riaz Ahmad',
      publisher: 'Punjab Curriculum & Textbook Board',
      categoryId: catAcademic.id,
      subject: 'Mathematics',
      classGrade: 'Class 11 (FSc)',
      description: 'Official Punjab textbook for FSc Pre-Engineering students.',
      coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80',
      purchasePrice: 520,
      sellingPrice: 750,
      discount: 0,
      stockQuantity: 50,
      minStockThreshold: 10,
      barcode: '9789694005678',
      status: 'ACTIVE' as const,
    },
    {
      bookId: 'BK-1005',
      isbn: '978-0140449136',
      title: 'The History of the Decline and Fall of the Roman Empire',
      author: 'Edward Gibbon',
      publisher: 'Penguin Classics',
      categoryId: catLiterature.id,
      subject: 'History',
      classGrade: 'General Reading',
      description: 'Masterpiece of Western historical literature.',
      coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80',
      purchasePrice: 1800,
      sellingPrice: 2500,
      discount: 200,
      stockQuantity: 8,
      minStockThreshold: 3,
      barcode: '9780140449136',
      status: 'ACTIVE' as const,
    },
    {
      bookId: 'BK-1006',
      isbn: '978-9693512345',
      title: 'Seerat-un-Nabi (Vol 1-3 Set)',
      author: 'Allama Shibli Nomani & Syed Sulaiman Nadvi',
      publisher: 'Darussalam Publications',
      categoryId: catIslamic.id,
      subject: 'Islamic History',
      classGrade: 'General Reading',
      description: 'Classic biography of Prophet Muhammad (PBUH) in Urdu.',
      coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&q=80',
      purchasePrice: 2800,
      sellingPrice: 4200,
      discount: 200,
      stockQuantity: 15,
      minStockThreshold: 4,
      barcode: '9789693512345',
      status: 'ACTIVE' as const,
    },
    {
      bookId: 'BK-1007',
      isbn: '978-0061120084',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      publisher: 'Harper Perennial',
      categoryId: catLiterature.id,
      subject: 'English Literature',
      classGrade: 'O-Level / A-Level',
      description: 'Pulitzer Prize winning classic novel.',
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80',
      purchasePrice: 950,
      sellingPrice: 1400,
      discount: 100,
      stockQuantity: 2, // LOW STOCK
      minStockThreshold: 5,
      barcode: '9780061120084',
      status: 'ACTIVE' as const,
    },
    {
      bookId: 'BK-1008',
      isbn: '978-0199061234',
      title: 'Oxford School Atlas for Pakistan',
      author: 'Oxford University Press',
      publisher: 'OUP Pakistan',
      categoryId: catAcademic.id,
      subject: 'Geography',
      classGrade: 'Class 6-10',
      description: 'Detailed geographic atlas updated with modern regional maps.',
      coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80',
      purchasePrice: 1100,
      sellingPrice: 1650,
      discount: 50,
      stockQuantity: 30,
      minStockThreshold: 5,
      barcode: '9780199061234',
      status: 'ACTIVE' as const,
    },
  ];

  const createdBooks = [];
  for (const b of booksData) {
    const book = await prisma.book.upsert({
      where: { bookId: b.bookId },
      update: {},
      create: b,
    });
    createdBooks.push(book);

    // Initial Stock Ledger Entry
    await prisma.inventoryLedger.create({
      data: {
        bookId: book.id,
        type: 'PURCHASE',
        quantity: b.stockQuantity,
        previousStock: 0,
        newStock: b.stockQuantity,
        userId: admin.id,
        reason: 'Initial stock seeding',
      },
    });
  }

  // 5. Seed Customers
  console.log('Seeding customers...');
  const cust1 = await prisma.customer.upsert({
    where: { customerId: 'CUST-0001' },
    update: {},
    create: {
      customerId: 'CUST-0001',
      name: 'Apex Grammar School',
      phone: '+92 300 5551122',
      email: 'purchase@apexgrammar.edu.pk',
      address: 'Plot 42, Sector F-8/3, Islamabad',
      notes: 'School bulk account. Net 30 payment terms.',
      totalPurchases: 15400,
      totalPaid: 10400,
      outstandingBalance: 5000,
    },
  });

  const cust2 = await prisma.customer.upsert({
    where: { customerId: 'CUST-0002' },
    update: {},
    create: {
      customerId: 'CUST-0002',
      name: 'Tariq Mahmood',
      phone: '+92 321 4443322',
      email: 'tariq.m@gmail.com',
      address: 'House 15, Street 4, Model Town, Lahore',
      totalPurchases: 4500,
      totalPaid: 4500,
      outstandingBalance: 0,
    },
  });

  const cust3 = await prisma.customer.upsert({
    where: { customerId: 'CUST-0003' },
    update: {},
    create: {
      customerId: 'CUST-0003',
      name: 'Ayesha Khan',
      phone: '+92 334 7778899',
      email: 'ayesha.k@outlook.com',
      address: 'DHA Phase 5, Karachi',
      totalPurchases: 6800,
      totalPaid: 4800,
      outstandingBalance: 2000,
    },
  });

  // 6. Seed Sales & Payments
  console.log('Seeding sample sales...');

  // Sale 1: Fully Paid Sale to Tariq Mahmood
  const sale1 = await prisma.sale.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      customerId: cust2.id,
      userId: emp1.id,
      subtotal: 4800,
      discount: 300,
      tax: 0,
      grandTotal: 4500,
      paidAmount: 4500,
      remainingAmount: 0,
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      notes: 'Cash payment over the counter.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      items: {
        create: [
          {
            bookId: createdBooks[1].id, // CLRS Algorithms
            quantity: 1,
            unitPrice: 4800,
            discount: 300,
            subtotal: 4500,
          },
        ],
      },
      payments: {
        create: [
          {
            transactionId: 'TXN-2026-0001',
            customerId: cust2.id,
            userId: emp1.id,
            method: 'CASH',
            amount: 4500,
            previousBalance: 0,
            remainingBalance: 0,
            notes: 'Full payment received in cash',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Sale 2: Partially Paid Sale to Apex Grammar School
  const sale2 = await prisma.sale.create({
    data: {
      invoiceNumber: 'INV-2026-0002',
      customerId: cust1.id,
      userId: emp1.id,
      subtotal: 16000,
      discount: 600,
      tax: 0,
      grandTotal: 15400,
      paidAmount: 10400,
      remainingAmount: 5000,
      paymentStatus: 'PARTIALLY_PAID',
      status: 'COMPLETED',
      notes: 'Bulk textbook order for Grade 9/10 physics and Oxford atlases.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            bookId: createdBooks[2].id, // Physics Class IX
            quantity: 10,
            unitPrice: 650,
            discount: 500,
            subtotal: 6000,
          },
          {
            bookId: createdBooks[7].id, // Oxford Atlas
            quantity: 6,
            unitPrice: 1650,
            discount: 100,
            subtotal: 9400,
          },
        ],
      },
      payments: {
        create: [
          {
            transactionId: 'TXN-2026-0002',
            customerId: cust1.id,
            userId: emp1.id,
            method: 'BANK_TRANSFER',
            amount: 10400,
            previousBalance: 15400,
            remainingBalance: 5000,
            notes: 'Advance bank transfer received. Remaining Rs. 5,000 pending due date.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Sale 3: Partially Paid Sale to Ayesha Khan
  const sale3 = await prisma.sale.create({
    data: {
      invoiceNumber: 'INV-2026-0003',
      customerId: cust3.id,
      userId: emp2.id,
      subtotal: 7000,
      discount: 200,
      tax: 0,
      grandTotal: 6800,
      paidAmount: 4800,
      remainingAmount: 2000,
      paymentStatus: 'PARTIALLY_PAID',
      status: 'COMPLETED',
      notes: 'Paid via JazzCash partial payment.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            bookId: createdBooks[5].id, // Seerat un Nabi
            quantity: 1,
            unitPrice: 4200,
            discount: 200,
            subtotal: 4000,
          },
          {
            bookId: createdBooks[0].id, // C Programming
            quantity: 1,
            unitPrice: 1800,
            discount: 0,
            subtotal: 1800,
          },
        ],
      },
      payments: {
        create: [
          {
            transactionId: 'TXN-2026-0003',
            customerId: cust3.id,
            userId: emp2.id,
            method: 'JAZZCASH',
            amount: 4800,
            previousBalance: 6800,
            remainingBalance: 2000,
            notes: 'JazzCash transaction ID JC-889912.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // 7. Seed Expenses
  console.log('Seeding expenses...');
  await prisma.expense.createMany({
    data: [
      {
        title: 'Showroom Monthly Rent',
        category: 'RENT',
        amount: 85000,
        method: 'BANK_TRANSFER',
        description: 'Gulberg showroom monthly rental payment for September',
        userId: admin.id,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Electricity Bill (LESCO)',
        category: 'ELECTRICITY',
        amount: 18450,
        method: 'BANK_TRANSFER',
        description: 'LESCO monthly commercial electricity bill',
        userId: admin.id,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'POS Receipt Paper & Bags',
        category: 'PACKAGING',
        amount: 4500,
        method: 'CASH',
        description: 'Purchased 20 thermal receipt rolls and 500 branded paper carry bags',
        userId: manager.id,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // 8. Seed Notifications
  console.log('Seeding notifications...');
  await prisma.notification.createMany({
    data: [
      {
        title: 'Low Stock Alert: Physics Class IX',
        message: 'Physics for Class IX & X stock dropped to 4 items (Threshold: 10)',
        type: 'LOW_STOCK',
        link: '/books?filter=low_stock',
      },
      {
        title: 'Low Stock Alert: To Kill a Mockingbird',
        message: 'To Kill a Mockingbird stock dropped to 2 items (Threshold: 5)',
        type: 'LOW_STOCK',
        link: '/books?filter=low_stock',
      },
      {
        title: 'Outstanding Balance Due: Apex Grammar School',
        message: 'Invoice INV-2026-0002 has a remaining balance of Rs. 5,000 pending',
        type: 'UNPAID_PAYMENT',
        link: '/payments?view=outstanding',
      },
    ],
  });

  console.log('✅ Seed data successfully populated!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

# Book Selling Company POS — Full-Stack Next.js System

A production-ready **Point of Sale (POS), Financial Ledger, Inventory Management, and Employee Tracking System** built specifically for book retailers and publishing companies.

Built with **Next.js (App Router), TypeScript, Tailwind CSS (Sunlight E-Book Light Theme), Prisma ORM, and Neon PostgreSQL**.

---

## Key Features

- 🛒 **High-Speed POS Interface**: Instant search by Title, ISBN, Book ID, or Barcode scan. Real-time cart calculations, item & order discounts, multi-payment methods (Cash, Card, JazzCash, Easypaisa, Bank Transfer, Partial Credit).
- 🧾 **Dual Invoice Engine**: Thermal POS Receipt (80mm) and A4 Formal Print/Download layout.
- 💳 **Payment Ledger & Credit Control**: Complete financial transaction ledger and dedicated **Outstanding Payments** module for partial/credit sale tracking without overwriting historical records.
- 📦 **Inventory Movement Ledger**: Comprehensive stock tracking with explicit movement types (`PURCHASE`, `SALE`, `RETURN`, `DAMAGE`, `ADJUSTMENT`, `RESTOCK`) and automatic low-stock notifications.
- 👥 **Employee Management & Performance Metrics**: Admin employee creation with auto-generated IDs (`EMP-0001`), password hashing (`bcryptjs`), role assignments, and sales performance analytics.
- 📊 **Reports & Expense Tracking**: Comprehensive sales, inventory, employee performance, and book ranking reports, with expense tracking and net profit calculations (`Revenue - Expenses = Net Profit`).
- 🔐 **Custom Authentication & RBAC**: HTTP-only session cookies with role-based permission guards for `ADMIN`, `MANAGER`, and `EMPLOYEE`.
- 🎨 **Sunlight E-Book Aesthetic**: Clean modern light theme with `#f97316` brand orange accents, touch-friendly responsive layouts across Desktop, Tablet, and Mobile devices.

---

## Tech Stack

- **Framework**: Next.js 15+ (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & ORM**: Neon PostgreSQL + Prisma ORM
- **Authentication**: Custom HTTP-only session cookies + `bcryptjs`
- **Icons**: Lucide React
- **Charts**: Recharts

---

## Getting Started

### 1. Installation

```bash
# Clone repository
git clone https://github.com/your-org/book-pos.git
cd book-pos

# Install dependencies
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update `DATABASE_URL` with your Neon PostgreSQL connection string.

### 3. Database Migration & Seeding

```bash
# Generate Prisma Client
npx prisma generate

# Sync schema with database
npx prisma db push

# Seed sample data (Admin user, employees, books, categories, customers, sales, expenses)
npx prisma db seed
```

### 4. Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Login Credentials

| Role | Employee ID | Email | Password |
|---|---|---|---|
| Admin | `EMP-0001` | `admin@bookpos.com` | `admin123` |
| Manager | `EMP-0002` | `manager@bookpos.com` | `emp123` |
| Employee | `EMP-0003` | `emp1@bookpos.com` | `emp123` |

---

## License

MIT License. Built for real-world commercial book retailing.

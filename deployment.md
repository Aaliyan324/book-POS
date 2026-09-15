# Deployment Guide — Book Selling POS System

This document provides step-by-step instructions to deploy the **Book Selling POS** application to **Vercel** and **Neon PostgreSQL**.

---

## 1. Prerequisites

- A [Vercel Account](https://vercel.com)
- A [Neon PostgreSQL Account](https://neon.tech)
- Node.js 18+ and npm installed locally
- Git repository created for your project

---

## 2. Database Setup (Neon PostgreSQL)

1. Log into **Neon Console** (https://console.neon.tech).
2. Click **Create Project**.
3. Name your project `book-pos-db` and select your preferred cloud region.
4. Once the project is created, copy the **Pooled Connection String** from the dashboard.
   It will look like:
   `postgresql://username:password@ep-xyz-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
5. Copy this string for your environment variables.

---

## 3. Database Migration & Seeding

Run the following commands locally or via your CI/CD build script:

```bash
# Generate Prisma Client
npx prisma generate

# Apply database schema to Neon PostgreSQL
npx prisma db push

# (Optional) Seed initial admin user, sample books, and categories
npx prisma db seed
```

---

## 4. Environment Variables Configuration

Set up the following environment variables in Vercel under **Project Settings -> Environment Variables**:

| Variable Name | Description | Example |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL Connection URL | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `SESSION_SECRET` | Secret key for HTTP-only cookie encryption | `your-random-32-character-secret-key` |
| `NEXT_PUBLIC_APP_URL` | Production URL of your deployed app | `https://book-pos.vercel.app` |

---

## 5. Deploying to Vercel

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Go to **Vercel Dashboard** -> **Add New Project**.
3. Import your `book-POS` repository.
4. Set Framework Preset: **Next.js**.
5. Add the Environment Variables from Section 4.
6. Under **Build Settings**, set the Build Command to:
   ```bash
   npx prisma generate && next build
   ```
7. Click **Deploy**.

---

## 6. Default Login Credentials (After Seeding)

- **Admin Login**:
  - Email: `admin@bookpos.com`
  - Password: `admin123`
  - Employee ID: `EMP-0001`

- **Manager Login**:
  - Email: `manager@bookpos.com`
  - Password: `emp123`
  - Employee ID: `EMP-0002`

- **Employee Login**:
  - Email: `emp1@bookpos.com`
  - Password: `emp123`
  - Employee ID: `EMP-0003`

---

## 7. Troubleshooting & Logs

- **Prisma Connection Errors**: Ensure `?sslmode=require` is appended to `DATABASE_URL`.
- **Session Expiration**: Adjust `SESSION_DURATION_MS` in `lib/auth/session.ts` if custom token TTL is required.

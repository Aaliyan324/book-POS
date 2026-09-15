import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number): string {
  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
  }).format(amount || 0);
  return `Rs. ${formatted}`;
}

export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getPaymentStatusBadge(status: string) {
  switch (status) {
    case 'PAID':
      return {
        label: 'Paid',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'PARTIALLY_PAID':
      return {
        label: 'Partially Paid',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'UNPAID':
      return {
        label: 'Unpaid',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-stone-50 text-stone-700 border-stone-200',
        dot: 'bg-stone-400',
      };
  }
}

export function getRoleBadge(role: string) {
  switch (role) {
    case 'ADMIN':
      return {
        label: 'Admin',
        bg: 'bg-orange-100 text-orange-800 border-orange-200',
      };
    case 'MANAGER':
      return {
        label: 'Manager',
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'EMPLOYEE':
      return {
        label: 'Employee',
        bg: 'bg-stone-100 text-stone-800 border-stone-200',
      };
    default:
      return {
        label: role,
        bg: 'bg-stone-100 text-stone-800 border-stone-200',
      };
  }
}

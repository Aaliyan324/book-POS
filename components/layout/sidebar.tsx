'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { hasPermission, Role } from '@/lib/permissions';
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  BookOpen,
  Package,
  Users,
  UserCheck,
  CreditCard,
  BarChart3,
  Wallet,
  RotateCcw,
  Bell,
  Settings,
  LogOut,
  BookMarked,
  X,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

interface SidebarProps {
  userRole: Role;
  userName: string;
  userEmployeeId: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { label: 'POS / New Sale', href: '/pos', key: 'pos', icon: ShoppingBag, isPos: true },
  { label: 'Sales Records', href: '/sales', key: 'sales', icon: Receipt },
  { label: 'Book Catalog', href: '/books', key: 'books', icon: BookOpen },
  { label: 'Inventory Ledger', href: '/inventory', key: 'inventory', icon: Package },
  { label: 'Customers', href: '/customers', key: 'customers', icon: Users },
  { label: 'Payments Ledger', href: '/payments', key: 'payments', icon: CreditCard },
  { label: 'Reports & Analytics', href: '/reports', key: 'reports', icon: BarChart3 },
  { label: 'Expenses', href: '/expenses', key: 'expenses', icon: Wallet },
  { label: 'Returns & Refunds', href: '/returns', key: 'returns', icon: RotateCcw },
  { label: 'Employees', href: '/employees', key: 'employees', icon: UserCheck, adminOnly: true },
  { label: 'Notifications', href: '/notifications', key: 'notifications', icon: Bell },
  { label: 'Settings', href: '/settings', key: 'settings', icon: Settings, adminOnly: true },
];

export function Sidebar({ userRole, userName, userEmployeeId, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-stone-200/80 w-64 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-stone-900 tracking-tight block leading-none">
              MUDASSAR
            </span>
            <span className="text-[10px] uppercase tracking-widest text-orange-600 font-semibold mt-1 block">
              Publishers POS
            </span>
          </div>
        </Link>
        {isMobileOpen && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-stone-400 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.filter((item) => hasPermission(userRole, item.key)).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? item.isPos
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20 font-semibold'
                    : 'bg-orange-50 text-orange-700 font-semibold border border-orange-200/60'
                  : item.isPos
                  ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive
                      ? item.isPos
                        ? 'text-white'
                        : 'text-orange-600'
                      : item.isPos
                      ? 'text-orange-600'
                      : 'text-stone-400 group-hover:text-stone-600'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.isPos && !isActive && (
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-stone-100 bg-stone-50/50">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="truncate">
            <p className="text-sm font-semibold text-stone-900 truncate">{userName}</p>
            <p className="text-xs text-stone-500 flex items-center gap-1">
              <span className="font-mono text-[11px] text-orange-600 font-bold">{userEmployeeId}</span>
              <span>•</span>
              <span className="capitalize">{userRole.toLowerCase()}</span>
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shrink-0 h-screen sticky top-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Slide-out Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}

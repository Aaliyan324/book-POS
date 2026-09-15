'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Role } from '@/lib/permissions';

interface MainLayoutProps {
  user: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    role: Role;
  };
  title?: string;
  fullWidth?: boolean;
  containerClassName?: string;
  children: React.ReactNode;
}

export function MainLayout({ user, title, fullWidth, containerClassName, children }: MainLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col md:flex-row font-sans text-stone-900 antialiased overflow-x-clip">
      {/* Sidebar */}
      <Sidebar
        userRole={user.role}
        userName={user.name}
        userEmployeeId={user.employeeId}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          userName={user.name}
          userRole={user.role}
          onMobileMenuToggle={() => setIsMobileOpen(true)}
        />
        <main
          className={`flex-1 w-full mx-auto animate-in fade-in duration-200 ${
            containerClassName
              ? containerClassName
              : fullWidth
              ? 'p-3 md:p-6 max-w-[1700px]'
              : 'p-4 md:p-8 max-w-7xl'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

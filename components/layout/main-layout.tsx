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
  children: React.ReactNode;
}

export function MainLayout({ user, title, children }: MainLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col md:flex-row font-sans text-stone-900 antialiased">
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
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}

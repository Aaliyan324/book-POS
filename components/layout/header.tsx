'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, Menu, ShoppingBag, BookOpen, Users, Receipt, Shield, X, ArrowRight } from 'lucide-react';
import { globalSearchAction } from '@/app/actions/search';
import { getNotificationsAction } from '@/app/actions/notifications';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatPKR } from '@/lib/utils';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  title?: string;
  userName: string;
  userRole: string;
}

export function Header({ onMobileMenuToggle, title, userName, userRole }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    books: any[];
    customers: any[];
    invoices: any[];
    employees: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getNotificationsAction()
      .then((res) => setUnreadCount(res.unreadCount))
      .catch(() => {});
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setIsSearchModalOpen(true);
    try {
      const results = await globalSearchAction(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg md:text-xl font-bold text-stone-900 tracking-tight">
            {title || 'POS Dashboard'}
          </h1>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Global Search (Title, ISBN, Customer, Invoice #)..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-stone-400"
            />
          </form>
        </div>

        {/* Right Side: Actions & Notifications */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Quick POS Button */}
          <Link
            href="/pos"
            className="flex items-center gap-2 px-3 py-2 md:px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xs hover:from-orange-600 hover:to-orange-700 transition-all hover:scale-102"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden xs:inline">New Sale (POS)</span>
          </Link>

          {/* Notifications Link */}
          <Link
            href="/notifications"
            className="relative p-2.5 rounded-xl text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Global Search Results Modal */}
      <Modal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title={`Search Results for "${searchQuery}"`}
        maxWidth="2xl"
      >
        {isSearching ? (
          <div className="py-12 text-center text-stone-500 text-sm">Searching records...</div>
        ) : searchResults ? (
          <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-1">
            {/* Books */}
            {searchResults.books.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-orange-500" /> Books ({searchResults.books.length})
                </h4>
                <div className="divide-y divide-stone-100 border border-stone-200/80 rounded-xl overflow-hidden bg-stone-50/50">
                  {searchResults.books.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setIsSearchModalOpen(false);
                        router.push(`/books?search=${b.bookId}`);
                      }}
                      className="p-3 flex items-center justify-between hover:bg-orange-50/50 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{b.title}</p>
                        <p className="text-xs text-stone-500">
                          ID: {b.bookId} • Author: {b.author}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-600">{formatPKR(b.sellingPrice)}</p>
                        <p className="text-[11px] text-stone-400">Stock: {b.stockQuantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customers */}
            {searchResults.customers.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-500" /> Customers ({searchResults.customers.length})
                </h4>
                <div className="divide-y divide-stone-100 border border-stone-200/80 rounded-xl overflow-hidden bg-stone-50/50">
                  {searchResults.customers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setIsSearchModalOpen(false);
                        router.push(`/customers?search=${c.customerId}`);
                      }}
                      className="p-3 flex items-center justify-between hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{c.name}</p>
                        <p className="text-xs text-stone-500">
                          ID: {c.customerId} • Phone: {c.phone || 'N/A'}
                        </p>
                      </div>
                      <Badge variant={c.outstandingBalance > 0 ? 'warning' : 'success'}>
                        {c.outstandingBalance > 0
                          ? `Due: ${formatPKR(c.outstandingBalance)}`
                          : 'Clear'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invoices */}
            {searchResults.invoices.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-500" /> Invoices ({searchResults.invoices.length})
                </h4>
                <div className="divide-y divide-stone-100 border border-stone-200/80 rounded-xl overflow-hidden bg-stone-50/50">
                  {searchResults.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => {
                        setIsSearchModalOpen(false);
                        router.push(`/sales?search=${inv.invoiceNumber}`);
                      }}
                      className="p-3 flex items-center justify-between hover:bg-emerald-50/50 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{inv.invoiceNumber}</p>
                        <p className="text-xs text-stone-500">
                          Date: {new Date(inv.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-stone-900">{formatPKR(inv.grandTotal)}</p>
                        <Badge
                          variant={
                            inv.paymentStatus === 'PAID'
                              ? 'success'
                              : inv.paymentStatus === 'PARTIALLY_PAID'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {inv.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchResults.books.length === 0 &&
              searchResults.customers.length === 0 &&
              searchResults.invoices.length === 0 && (
                <div className="py-8 text-center text-stone-500 text-sm">
                  No records matching &quot;{searchQuery}&quot; found.
                </div>
              )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

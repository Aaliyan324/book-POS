'use client';

import React, { useState } from 'react';
import { Search, Printer, Download, Share2 } from 'lucide-react';
import { formatPKR, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ReceiptModal, generateInvoicePDF, shareInvoiceOnWhatsApp } from '@/components/invoices/receipt-modal';

interface SalesTableProps {
  initialSales: any[];
  employees: any[];
  companySettings?: Record<string, string>;
}

export function SalesTable({ initialSales, employees, companySettings }: SalesTableProps) {
  const [sales] = useState(initialSales);
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');

  // Selected sale for detail modal
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Filter sales
  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.user?.name || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      paymentStatusFilter === 'ALL' || s.paymentStatus === paymentStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate totals for filtered sales records
  const totalPurchasesAmount = filteredSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const totalPaidAmount = filteredSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
  const totalRemainingAmount = filteredSales.reduce((acc, s) => acc + (s.remainingAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Sales Records</h2>
          <p className="text-xs text-stone-500">
            View completed sales transactions, print invoices, download PDFs, and share details via WhatsApp.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Invoice #, Customer, Staff..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="text-xs p-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid Only</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="UNPAID">Unpaid Only</option>
          </select>
        </div>
      </div>

      {/* Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Purchases Amount</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 mt-1">{formatPKR(totalPurchasesAmount)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-sm shrink-0">
            Rs
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Paid Amount</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-1">{formatPKR(totalPaidAmount)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
            ✓
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Remaining Amount</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-rose-600 mt-1">{formatPKR(totalRemainingAmount)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm shrink-0">
            !
          </div>
        </div>
      </div>

      {/* Sales Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Remaining</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    No sales records match your criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    tabIndex={0}
                    onClick={() => {
                      setSelectedSale(sale);
                      setIsReceiptOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSale(sale);
                        setIsReceiptOpen(true);
                      }
                    }}
                    className="hover:bg-orange-50/50 cursor-pointer transition-colors focus:outline-none focus:bg-orange-50/80 group"
                    title="Click row to view complete sale & payment details"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900 group-hover:text-orange-600 transition-colors">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">
                        {sale.customer?.name || 'Walk-in Customer'}
                      </div>
                      <div className="flex flex-col text-[10px] text-stone-500 mt-0.5 space-y-0.5">
                        <span>
                          Total Purchases: <strong className="text-stone-700 font-semibold">{formatPKR(sale.customer?.totalPurchases ?? sale.grandTotal)}</strong>
                        </span>
                        <span>
                          Remaining: <strong className={(sale.customer?.outstandingBalance || 0) > 0 || sale.remainingAmount > 0 ? 'text-rose-600 font-bold' : 'text-stone-600 font-semibold'}>
                            {formatPKR(sale.customer?.outstandingBalance ?? sale.remainingAmount)}
                          </strong>
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">{sale.user?.name}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-stone-900">
                      {formatPKR(sale.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                      {formatPKR(sale.paidAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-rose-600">
                      {formatPKR(sale.remainingAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          variant={
                            sale.paymentStatus === 'PAID'
                              ? 'success'
                              : sale.paymentStatus === 'PARTIALLY_PAID'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {sale.paymentStatus}
                        </Badge>
                        {sale.status === 'RETURNED' && (
                          <span className="text-[9px] font-bold text-rose-600 uppercase">
                            Returned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View / Print Invoice */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSale(sale);
                            setIsReceiptOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                          title="Print / View Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Download PDF */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            generateInvoicePDF(sale, companySettings);
                          }}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                          title="Download PDF Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* WhatsApp Share */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            shareInvoiceOnWhatsApp(sale, companySettings);
                          }}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={selectedSale}
        companyInfo={companySettings}
      />
    </div>
  );
}

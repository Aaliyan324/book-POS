'use client';

import React, { useState } from 'react';
import { RotateCcw, Search, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatPKR, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ReturnsManagementProps {
  returnsList: any[];
}

export function ReturnsManagement({ returnsList }: ReturnsManagementProps) {
  const [search, setSearch] = useState('');

  const filtered = returnsList.filter(
    (r) =>
      r.returnNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.sale?.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.customer?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Returns & Restock Management</h2>
          <p className="text-xs text-stone-500">
            View completed return requests, refunded amounts, and re-stocked inventory items.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
        <div className="relative max-w-md text-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Return #, Invoice #, Customer..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Returns Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3.5 px-4">Return #</th>
                <th className="py-3.5 px-4">Original Invoice #</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-center">Refund Type</th>
                <th className="py-3.5 px-4 text-right">Total Refunded</th>
                <th className="py-3.5 px-4">Processed By</th>
                <th className="py-3.5 px-4">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No return records found.
                  </td>
                </tr>
              ) : (
                filtered.map((ret) => (
                  <tr key={ret.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {ret.returnNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-700">
                      {ret.sale?.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                      {formatDateTime(ret.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-900">
                      {ret.customer?.name || 'Walk-in Customer'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="orange">{ret.refundType}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      {formatPKR(ret.totalRefundAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">{ret.user?.name}</td>
                    <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate">
                      {ret.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

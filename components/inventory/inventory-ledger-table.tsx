'use client';

import React, { useState } from 'react';
import { Search, Package, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface InventoryLedgerTableProps {
  logs: any[];
}

export function InventoryLedgerTable({ logs }: InventoryLedgerTableProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.book?.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.book?.bookId || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.reason || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.user?.name || '').toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' || log.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PURCHASE':
      case 'RESTOCK':
        return <Badge variant="success">+{type}</Badge>;
      case 'SALE':
        return <Badge variant="neutral">-{type}</Badge>;
      case 'RETURN':
        return <Badge variant="info">+{type}</Badge>;
      case 'DAMAGE':
        return <Badge variant="danger">-{type}</Badge>;
      default:
        return <Badge variant="warning">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Inventory Movement Ledger</h2>
          <p className="text-xs text-stone-500">
            Complete historical audit record of all stock adjustments, sales, returns, purchases, and damages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 text-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search book title, reason, staff..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs p-2 rounded-xl bg-stone-50 border border-stone-200"
          >
            <option value="ALL">All Transaction Types</option>
            <option value="SALE">SALE</option>
            <option value="PURCHASE">PURCHASE</option>
            <option value="RESTOCK">RESTOCK</option>
            <option value="RETURN">RETURN</option>
            <option value="DAMAGE">DAMAGE</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Book Title & ID</th>
                <th className="py-3.5 px-4 text-center">Type</th>
                <th className="py-3.5 px-4 text-center">Change Qty</th>
                <th className="py-3.5 px-4 text-center">Prev Stock</th>
                <th className="py-3.5 px-4 text-center">New Stock</th>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No inventory ledger entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-stone-900">{log.book?.title}</p>
                      <p className="text-[10px] text-stone-400 font-mono">{log.book?.bookId}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">{getTypeBadge(log.type)}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-stone-900">
                      {log.type === 'SALE' || log.type === 'DAMAGE' ? `-${log.quantity}` : `+${log.quantity}`}
                    </td>
                    <td className="py-3.5 px-4 text-center text-stone-500">{log.previousStock}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-stone-900">{log.newStock}</td>
                    <td className="py-3.5 px-4 text-stone-600">{log.user?.name || 'System'}</td>
                    <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate">
                      {log.reason || '—'}
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

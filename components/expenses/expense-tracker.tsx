'use client';

import React, { useState } from 'react';
import { Wallet, Plus, Calendar, Tag, CreditCard } from 'lucide-react';
import { formatPKR, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { createExpenseAction } from '@/app/actions/expenses';

interface ExpenseTrackerProps {
  initialExpenses: any[];
  totalExpense: number;
}

export function ExpenseTracker({ initialExpenses, totalExpense }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Create Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'OTHER' as any,
    amount: 0,
    method: 'CASH' as any,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const filtered = expenses.filter(
    (e) => categoryFilter === 'ALL' || e.category === categoryFilter
  );

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || form.amount <= 0) return;

    try {
      const res = await createExpenseAction(form);
      if (!res.success) throw new Error(res.error);

      setExpenses((prev) => [res.expense, ...prev]);
      setIsModalOpen(false);
      setForm({
        title: '',
        category: 'OTHER',
        amount: 0,
        method: 'CASH',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      alert('Expense recorded successfully!');
    } catch (err: any) {
      alert(err.message || 'Error recording expense');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Operating Expenses</h2>
          <p className="text-xs text-stone-500">
            Track business overhead expenses for accurate Net Profit calculation (Revenue - Expenses).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-xs shadow-md hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-500">Category Filter:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 rounded-xl bg-stone-50 border border-stone-200"
          >
            <option value="ALL">All Categories</option>
            <option value="RENT">Rent</option>
            <option value="ELECTRICITY">Electricity</option>
            <option value="TRANSPORT">Transport</option>
            <option value="SALARIES">Salaries</option>
            <option value="PACKAGING">Packaging</option>
            <option value="PRINTING">Printing</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="text-right">
          <span className="text-stone-400">Total Recorded Expenses:</span>
          <span className="font-bold text-stone-900 text-sm ml-2">{formatPKR(totalExpense)}</span>
        </div>
      </div>

      {/* Expense List Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Expense Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Recorded By</th>
                <th className="py-3.5 px-4 text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No expense entries recorded.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                      {formatDate(e.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-stone-900">{e.title}</p>
                      {e.description && <p className="text-[11px] text-stone-500">{e.description}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="orange">{e.category}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">{e.method}</td>
                    <td className="py-3.5 px-4 text-stone-600">{e.user?.name || 'Staff'}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      {formatPKR(e.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Operating Expense"
        maxWidth="md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Expense Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. LESCO Electricity Bill, Carry Bags Purchase"
              className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              >
                <option value="RENT">Rent</option>
                <option value="ELECTRICITY">Electricity</option>
                <option value="TRANSPORT">Transport</option>
                <option value="SALARIES">Salaries</option>
                <option value="PACKAGING">Packaging</option>
                <option value="PRINTING">Printing</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Amount (PKR) *</label>
              <input
                type="number"
                required
                min="1"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Payment Method</label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value as any })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="JAZZCASH">JazzCash</option>
                <option value="EASYPAISA">Easypaisa</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Expense Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Description / Notes</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Additional details or vendor receipt notes..."
              className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-stone-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600"
            >
              Save Expense Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

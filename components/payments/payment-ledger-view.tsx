'use client';

import React, { useState } from 'react';
import { CreditCard, Search, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatPKR, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { recordPaymentAction } from '@/app/actions/sales';

interface PaymentLedgerViewProps {
  payments: any[];
  outstandingSales: any[];
}

export function PaymentLedgerView({ payments, outstandingSales }: PaymentLedgerViewProps) {
  const [activeTab, setActiveTab] = useState<'ledger' | 'outstanding'>('ledger');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Record Payment Modal State
  const [recordSaleModal, setRecordSaleModal] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'OTHER'>('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter Payment Ledger
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      (p.sale?.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.user?.name || '').toLowerCase().includes(search.toLowerCase());

    const matchesMethod = methodFilter === 'ALL' || p.method === methodFilter;

    return matchesSearch && matchesMethod;
  });

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordSaleModal) return;

    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Enter a valid payment amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordPaymentAction({
        saleId: recordSaleModal.id,
        amount,
        method: payMethod,
        notes: payNotes,
      });

      if (!res.success) throw new Error(res.error);

      setRecordSaleModal(null);
      setPayAmount('');
      setPayNotes('');
      alert('Payment recorded successfully! Refreshing ledger.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Financial Payment Systems</h2>
          <p className="text-xs text-stone-500">
            Dedicated payment ledger audit trails & customer credit balance collection.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-stone-100 p-1.5 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'ledger'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Payment Ledger ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('outstanding')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'outstanding'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Outstanding Balances ({outstandingSales.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'ledger' ? (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Txn ID, Invoice #, Customer, Staff..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="p-2 rounded-xl bg-stone-50 border border-stone-200"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CASH">CASH</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
              <option value="JAZZCASH">JAZZCASH</option>
              <option value="EASYPAISA">EASYPAISA</option>
              <option value="CARD">CARD</option>
            </select>
          </div>

          {/* Payment Ledger Data Table */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/50 text-stone-400 uppercase text-[10px] font-bold">
                    <th className="py-3.5 px-4">Txn ID</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Collected By</th>
                    <th className="py-3.5 px-4 text-center">Method</th>
                    <th className="py-3.5 px-4 text-right">Amount Paid</th>
                    <th className="py-3.5 px-4 text-right">Rem. Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-stone-400">
                        No payment records found.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                          {p.transactionId}
                        </td>
                        <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                          {formatDateTime(p.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-stone-700">
                          {p.sale?.invoiceNumber || 'Direct'}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-stone-900">
                          {p.customer?.name || 'Walk-in Customer'}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">{p.user?.name}</td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant="orange">{p.method}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                          {formatPKR(p.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-stone-500">
                          {formatPKR(p.remainingBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Outstanding Balances Credit Manager Table */
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 bg-amber-50/50 text-amber-800 text-xs">
            <p className="font-bold">⚠️ Customer Credit Outstanding Balances</p>
            <p className="text-[11px] text-amber-700">
              The following invoices have unpaid credit balances. Click &quot;Record Payment&quot; to collect incremental payments.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50 text-stone-400 uppercase text-[10px] font-bold">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid</th>
                  <th className="py-3.5 px-4 text-right">Remaining Due</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {outstandingSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      Great! There are currently no outstanding credit balances.
                    </td>
                  </tr>
                ) : (
                  outstandingSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        {sale.customer?.name || 'Walk-in Customer'}
                        {sale.customer?.phone && (
                          <span className="block text-[10px] text-stone-400 font-normal">
                            Phone: {sale.customer.phone}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-stone-900">
                        {formatPKR(sale.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                        {formatPKR(sale.paidAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                        {formatPKR(sale.remainingAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="warning">{sale.paymentStatus}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setRecordSaleModal(sale);
                            setPayAmount(sale.remainingAmount.toString());
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                        >
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subsequent Payment Modal */}
      <Modal
        isOpen={!!recordSaleModal}
        onClose={() => setRecordSaleModal(null)}
        title="Record Payment Entry"
        description={`Invoice #${recordSaleModal?.invoiceNumber}`}
        maxWidth="md"
      >
        {recordSaleModal && (
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>Customer Account:</span>
                <span className="font-bold text-stone-900">{recordSaleModal.customer?.name}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Remaining Due:</span>
                <span>{formatPKR(recordSaleModal.remainingAmount)}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Amount Paid (PKR) *</label>
              <input
                type="number"
                required
                min="1"
                max={recordSaleModal.remainingAmount}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="JAZZCASH">JazzCash</option>
                <option value="EASYPAISA">Easypaisa</option>
                <option value="CARD">Card</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Notes</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Reference or notes..."
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordSaleModal(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
              >
                Save Payment Entry
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

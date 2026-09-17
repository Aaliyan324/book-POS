'use client';

import React, { useState } from 'react';
import { Search, Filter, Printer, CreditCard, RotateCcw, Eye, Calendar } from 'lucide-react';
import { formatPKR, formatDate, formatDateTime, getPaymentStatusBadge } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ReceiptModal } from '@/components/invoices/receipt-modal';
import { recordPaymentAction } from '@/app/actions/sales';
import { processReturnAction } from '@/app/actions/returns';

interface SalesTableProps {
  initialSales: any[];
  employees: any[];
  companySettings?: Record<string, string>;
}

export function SalesTable({ initialSales, employees, companySettings }: SalesTableProps) {
  const [sales, setSales] = useState(initialSales);
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');

  // Selected sale for detail modal
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Subsequent Payment Modal State
  const [paymentModalSale, setPaymentModalSale] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'OTHER'>('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [isPaySubmitting, setIsPaySubmitting] = useState(false);

  // Return Modal State
  const [returnModalSale, setReturnModalSale] = useState<any | null>(null);
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});
  const [refundType, setRefundType] = useState<'REFUND_CASH' | 'STORE_CREDIT' | 'OUTSTANDING_ADJUSTMENT'>('REFUND_CASH');
  const [returnReason, setReturnReason] = useState('');
  const [isReturnSubmitting, setIsReturnSubmitting] = useState(false);

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

  // Handle Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalSale) return;

    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setIsPaySubmitting(true);
    try {
      const res = await recordPaymentAction({
        saleId: paymentModalSale.id,
        amount,
        method: payMethod,
        notes: payNotes,
      });

      if (!res.success) {
        alert(res.error || 'Failed to record payment');
        return;
      }

      // Update local state
      setSales((prev) =>
        prev.map((s) => {
          if (s.id === paymentModalSale.id) {
            const newPaid = s.paidAmount + amount;
            const newRem = Math.max(0, s.grandTotal - newPaid);
            return {
              ...s,
              paidAmount: newPaid,
              remainingAmount: newRem,
              paymentStatus: newRem === 0 ? 'PAID' : 'PARTIALLY_PAID',
            };
          }
          return s;
        })
      );

      setPaymentModalSale(null);
      setPayAmount('');
      setPayNotes('');
      alert('Payment recorded successfully!');
    } catch (err: any) {
      alert(err.message || 'Error recording payment');
    } finally {
      setIsPaySubmitting(false);
    }
  };

  // Handle Process Return
  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalSale) return;

    const itemsToReturn = Object.entries(returnItems)
      .filter(([_, qty]) => qty > 0)
      .map(([bookId, qty]) => {
        const item = returnModalSale.items.find((i: any) => i.bookId === bookId);
        return {
          bookId,
          quantity: qty,
          unitPrice: item ? item.unitPrice : 0,
        };
      });

    if (itemsToReturn.length === 0) {
      alert('Please select at least one item to return.');
      return;
    }

    setIsReturnSubmitting(true);
    try {
      const res = await processReturnAction({
        saleId: returnModalSale.id,
        items: itemsToReturn,
        refundType,
        reason: returnReason,
      });

      if (!res.success) {
        alert(res.error || 'Failed to process return');
        return;
      }

      setSales((prev) =>
        prev.map((s) => (s.id === returnModalSale.id ? { ...s, status: 'RETURNED' } : s))
      );

      setReturnModalSale(null);
      setReturnItems({});
      setReturnReason('');
      alert(`Return ${res.returnNumber} processed and inventory restocked!`);
    } catch (err: any) {
      alert(err.message || 'Error processing return');
    } finally {
      setIsReturnSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Sales Records</h2>
          <p className="text-xs text-stone-500">
            View completed transactions, record credit payments, print invoices, and process returns.
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
                    <td className="py-3.5 px-4 font-medium text-stone-900">
                      {sale.customer?.name || 'Walk-in Customer'}
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

                        {/* Record Subsequent Payment */}
                        {sale.remainingAmount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentModalSale(sale);
                              setPayAmount(sale.remainingAmount.toString());
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {/* Return Items */}
                        {sale.status !== 'RETURNED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReturnModalSale(sale);
                              const initQty: Record<string, number> = {};
                              sale.items?.forEach((i: any) => (initQty[i.bookId] = 0));
                              setReturnItems(initQty);
                            }}
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            title="Process Return"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!paymentModalSale}
        onClose={() => setPaymentModalSale(null)}
        title="Record Subsequent Payment"
        description={`Invoice #${paymentModalSale?.invoiceNumber}`}
        maxWidth="md"
      >
        {paymentModalSale && (
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>Customer:</span>
                <span className="font-bold text-stone-900">
                  {paymentModalSale.customer?.name || 'Walk-in Customer'}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Invoice Total:</span>
                <span className="font-semibold">{formatPKR(paymentModalSale.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Already Paid:</span>
                <span className="font-semibold text-emerald-700">
                  {formatPKR(paymentModalSale.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold border-t border-stone-200 pt-1">
                <span>Remaining Due:</span>
                <span>{formatPKR(paymentModalSale.remainingAmount)}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Payment Amount (PKR) *</label>
              <input
                type="number"
                required
                min="1"
                max={paymentModalSale.remainingAmount}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold"
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
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Notes / Transaction Reference</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Optional notes or bank transaction ID..."
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalSale(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPaySubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
              >
                {isPaySubmitting ? 'Saving...' : 'Save Payment Entry'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Return Items Modal */}
      <Modal
        isOpen={!!returnModalSale}
        onClose={() => setReturnModalSale(null)}
        title="Process Return & Restock"
        description={`Invoice #${returnModalSale?.invoiceNumber}`}
        maxWidth="lg"
      >
        {returnModalSale && (
          <form onSubmit={handleProcessReturn} className="space-y-4 text-xs">
            <p className="text-stone-500">
              Select items and quantities being returned. Valid returned books will be automatically restored to inventory.
            </p>

            <div className="space-y-2 max-h-[220px] overflow-y-auto border border-stone-200 rounded-xl p-3">
              {returnModalSale.items?.map((item: any) => (
                <div key={item.bookId} className="flex items-center justify-between gap-3 py-1">
                  <div>
                    <p className="font-semibold text-stone-900">{item.book?.title}</p>
                    <p className="text-[10px] text-stone-400">Purchased Qty: {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-stone-500">Return Qty:</span>
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={returnItems[item.bookId] || 0}
                      onChange={(e) =>
                        setReturnItems({
                          ...returnItems,
                          [item.bookId]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-16 p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-center font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Refund / Credit Adjustment Type</label>
              <select
                value={refundType}
                onChange={(e) => setRefundType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              >
                <option value="REFUND_CASH">Refund Cash to Customer</option>
                <option value="STORE_CREDIT">Issue Store Credit</option>
                <option value="OUTSTANDING_ADJUSTMENT">Adjust Against Outstanding Balance</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Return Reason</label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Reason for return (e.g. Damaged copy, wrong edition)..."
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReturnModalSale(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isReturnSubmitting}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700"
              >
                {isReturnSubmitting ? 'Processing...' : 'Confirm Return & Restock'}
              </button>
            </div>
          </form>
        )}
      </Modal>

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

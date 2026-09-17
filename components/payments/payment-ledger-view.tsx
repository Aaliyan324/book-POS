'use client';

import React, { useState } from 'react';
import {
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ChevronRight,
  Download,
  Printer,
  Clock,
  AlertCircle,
  CheckCircle2,
  Share2,
  RotateCcw,
  Eye,
  Edit,
  X,
  FileText,
} from 'lucide-react';
import { formatPKR, formatDate, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  ReceiptModal,
  generateInvoicePDF,
  shareInvoiceOnWhatsApp,
} from '@/components/invoices/receipt-modal';
import { recordPaymentAction } from '@/app/actions/sales';
import { processReturnAction } from '@/app/actions/returns';

interface PaymentLedgerViewProps {
  customers: any[];
  walkInSales?: any[];
  companySettings?: Record<string, string>;
}

export function PaymentLedgerView({
  customers,
  walkInSales = [],
  companySettings = {},
}: PaymentLedgerViewProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');

  // Customer Ledger Details Modal
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Sub-modals for Order Actions
  const [receiptModalSale, setReceiptModalSale] = useState<any | null>(null);
  const [paymentModalSale, setPaymentModalSale] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<
    'CASH' | 'BANK_TRANSFER' | 'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'OTHER'
  >('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [isPaySubmitting, setIsPaySubmitting] = useState(false);

  // Return Modal State
  const [returnModalSale, setReturnModalSale] = useState<any | null>(null);
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});
  const [refundType, setRefundType] = useState<
    'REFUND_CASH' | 'STORE_CREDIT' | 'OUTSTANDING_ADJUSTMENT'
  >('REFUND_CASH');
  const [returnReason, setReturnReason] = useState('');
  const [isReturnSubmitting, setIsReturnSubmitting] = useState(false);

  // Prepare Walk-in Customer Record if walk-in sales exist
  const walkInTotalPurchases = walkInSales.reduce((acc, s) => acc + s.grandTotal, 0);
  const walkInTotalPaid = walkInSales.reduce((acc, s) => acc + s.paidAmount, 0);
  const walkInOutstanding = walkInSales.reduce((acc, s) => acc + s.remainingAmount, 0);

  const walkInCustomerObj =
    walkInSales.length > 0
      ? {
          id: 'walk-in-general',
          customerId: 'WALK-IN',
          name: 'Walk-in Customers (General)',
          phone: 'N/A',
          email: 'N/A',
          address: 'Store Counter',
          totalPurchases: walkInTotalPurchases,
          totalPaid: walkInTotalPaid,
          outstandingBalance: walkInOutstanding,
          sales: walkInSales,
          payments: walkInSales.flatMap((s) => s.payments || []),
          isWalkIn: true,
        }
      : null;

  const allCustomerList = walkInCustomerObj
    ? [walkInCustomerObj, ...customers]
    : customers;

  // Filter customers by search & status
  const filteredCustomers = allCustomerList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.customerId || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'PENDING') return c.outstandingBalance > 0;
    if (filterType === 'PAID') return c.outstandingBalance <= 0;
    return true;
  });

  // Calculate System Total Metrics
  const totalSystemPurchases = allCustomerList.reduce(
    (acc, c) => acc + (c.totalPurchases || 0),
    0
  );
  const totalSystemPaid = allCustomerList.reduce(
    (acc, c) => acc + (c.totalPaid || 0),
    0
  );
  const totalSystemOutstanding = allCustomerList.reduce(
    (acc, c) => acc + (c.outstandingBalance || 0),
    0
  );
  const pendingCustomerCount = allCustomerList.filter(
    (c) => c.outstandingBalance > 0
  ).length;

  // Helper to map pending orders per customer (Pending 1, Pending 2, etc.)
  const getCustomerPendingMap = (customerSales: any[]) => {
    const pendingSales = [...customerSales]
      .filter((s) => s.remainingAmount > 0 && s.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const map: Record<string, string> = {};
    pendingSales.forEach((s, idx) => {
      map[s.id] = `Pending ${idx + 1}`;
    });
    return map;
  };

  // Record Payment Handler
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

      if (!res.success) throw new Error(res.error);

      setPaymentModalSale(null);
      setPayAmount('');
      setPayNotes('');
      alert('Payment recorded successfully! Refreshing ledger.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    } finally {
      setIsPaySubmitting(false);
    }
  };

  // Process Return Handler
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

      if (!res.success) throw new Error(res.error);

      setReturnModalSale(null);
      setReturnItems({});
      setReturnReason('');
      alert(`Return ${res.returnNumber} processed and inventory restocked!`);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Error processing return');
    } finally {
      setIsReturnSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & High Level Metrics Cards */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-5">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            Customer Payment Ledgers
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Customer-centric financial ledger management, credit balance collection, and order transaction audit trails.
          </p>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80">
            <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Total Customers
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-stone-900 mt-1">
              {allCustomerList.length}
            </p>
          </div>

          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80">
            <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Total Purchases
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-stone-900 mt-1">
              {formatPKR(totalSystemPurchases)}
            </p>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Total Collected
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-800 mt-1">
              {formatPKR(totalSystemPaid)}
            </p>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80">
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center justify-between">
              <span>Total Pending</span>
              <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {pendingCustomerCount}
              </span>
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-amber-900 mt-1">
              {formatPKR(totalSystemOutstanding)}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Customer Name, Phone, Account ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl shrink-0 font-semibold">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'ALL'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Accounts ({allCustomerList.length})
          </button>
          <button
            onClick={() => setFilterType('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'PENDING'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pending Credit ({pendingCustomerCount})
          </button>
          <button
            onClick={() => setFilterType('PAID')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'PAID'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Fully Paid
          </button>
        </div>
      </div>

      {/* CUSTOMER LEDGER LIST GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-stone-200 text-stone-400 text-xs font-medium">
            <User className="w-10 h-10 mx-auto mb-2 text-stone-300" />
            <p className="text-sm font-bold text-stone-700">No customer ledgers found</p>
            <p className="mt-1 text-stone-400">Try adjusting your search or filter options.</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const sales = customer.sales || [];
            const pendingMap = getCustomerPendingMap(sales);
            const pendingSales = sales.filter(
              (s: any) => s.remainingAmount > 0 && s.status !== 'CANCELLED'
            );
            const latestSale = sales[0];

            return (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className={`bg-white p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md ${
                  customer.outstandingBalance > 0
                    ? 'border-amber-300/80 shadow-xs'
                    : 'border-stone-200/90'
                }`}
              >
                <div>
                  {/* Top Customer Info Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-stone-900 truncate">
                          {customer.name}
                        </h3>
                        {customer.isWalkIn && (
                          <Badge variant="neutral">Counter</Badge>
                        )}
                      </div>
                      {customer.phone && customer.phone !== 'N/A' && (
                        <p className="text-[11px] text-stone-500 font-medium truncate mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{customer.phone}</span>
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-orange-600 font-bold mt-0.5">
                        {customer.customerId}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold shrink-0 ${
                        customer.outstandingBalance > 0
                          ? 'bg-amber-100 text-amber-900 border border-amber-300/60'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {customer.outstandingBalance > 0
                        ? `${pendingSales.length} Pending`
                        : 'Fully Paid'}
                    </span>
                  </div>

                  {/* Per-Customer Pending Orders Pill Section */}
                  {pendingSales.length > 0 && (
                    <div className="mb-3.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 space-y-1.5 text-xs">
                      <p className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">
                        Active Pending Obligations:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {pendingSales.map((s: any) => {
                          const label = pendingMap[s.id] || 'Pending';
                          return (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 rounded-md bg-white border border-amber-300 text-[10px] font-extrabold text-amber-900 shadow-2xs"
                            >
                              {label}: {formatPKR(s.remainingAmount)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Financial Metrics breakdown */}
                  <div className="grid grid-cols-3 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs">
                    <div>
                      <p className="text-[10px] text-stone-400 font-medium">Purchases</p>
                      <p className="font-extrabold text-stone-900 text-xs truncate">
                        {formatPKR(customer.totalPurchases || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 font-medium">Total Paid</p>
                      <p className="font-extrabold text-emerald-700 text-xs truncate">
                        {formatPKR(customer.totalPaid || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 font-medium">Pending</p>
                      <p
                        className={`font-extrabold text-xs truncate ${
                          customer.outstandingBalance > 0 ? 'text-rose-600' : 'text-stone-700'
                        }`}
                      >
                        {formatPKR(customer.outstandingBalance || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer details & Action link */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-stone-400">
                    Latest: {latestSale ? formatDate(latestSale.createdAt) : 'No Orders'}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCustomer(customer);
                    }}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>View Ledger</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CUSTOMER LEDGER DETAILS DRAWER / MODAL */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer ? `Payment Ledger - ${selectedCustomer.name}` : 'Customer Ledger'}
        description={selectedCustomer ? `ID: ${selectedCustomer.customerId}` : ''}
        maxWidth="4xl"
      >
        {selectedCustomer && (
          <div className="space-y-6 text-xs text-stone-900">
            {/* Customer Header Info & Financial Overview */}
            <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {selectedCustomer.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1 font-medium">
                    {selectedCustomer.phone && selectedCustomer.phone !== 'N/A' && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        {selectedCustomer.phone}
                      </span>
                    )}
                    {selectedCustomer.email && selectedCustomer.email !== 'N/A' && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        {selectedCustomer.email}
                      </span>
                    )}
                    {selectedCustomer.address && selectedCustomer.address !== 'Store Counter' && (
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        {selectedCustomer.address}
                      </span>
                    )}
                  </div>
                </div>

                <Badge
                  variant={
                    selectedCustomer.outstandingBalance > 0 ? 'warning' : 'success'
                  }
                >
                  {selectedCustomer.outstandingBalance > 0
                    ? `Due: ${formatPKR(selectedCustomer.outstandingBalance)}`
                    : 'Account Current (No Due)'}
                </Badge>
              </div>

              {/* Total Summary Row */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                  <p className="text-[10px] text-stone-400 font-semibold uppercase">Total Purchases</p>
                  <p className="text-sm font-extrabold text-stone-900 mt-0.5">
                    {formatPKR(selectedCustomer.totalPurchases || 0)}
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                  <p className="text-[10px] text-stone-400 font-semibold uppercase">Total Paid</p>
                  <p className="text-sm font-extrabold text-emerald-700 mt-0.5">
                    {formatPKR(selectedCustomer.totalPaid || 0)}
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                  <p className="text-[10px] text-stone-400 font-semibold uppercase">Remaining Pending</p>
                  <p
                    className={`text-sm font-extrabold mt-0.5 ${
                      selectedCustomer.outstandingBalance > 0 ? 'text-rose-600' : 'text-stone-700'
                    }`}
                  >
                    {formatPKR(selectedCustomer.outstandingBalance || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Complete Chronological Orders History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-900 tracking-tight">
                  Complete Order & Payment History (Latest First)
                </h4>
                <span className="text-[11px] text-stone-500 font-medium">
                  {selectedCustomer.sales?.length || 0} order(s) recorded
                </span>
              </div>

              {(!selectedCustomer.sales || selectedCustomer.sales.length === 0) ? (
                <div className="py-10 text-center text-stone-400 bg-stone-50 rounded-2xl border border-stone-200">
                  No orders recorded for this customer yet.
                </div>
              ) : (
                (() => {
                  const pendingMap = getCustomerPendingMap(selectedCustomer.sales);

                  return (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {selectedCustomer.sales.map((sale: any) => {
                        const pendingLabel = pendingMap[sale.id];

                        return (
                          <div
                            key={sale.id}
                            className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all ${
                              sale.remainingAmount > 0
                                ? 'border-amber-300 ring-1 ring-amber-300/30 bg-amber-50/10'
                                : 'border-stone-200'
                            }`}
                          >
                            {/* Order Header Meta */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-100">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-extrabold text-sm text-stone-900">
                                  {sale.invoiceNumber}
                                </span>
                                {pendingLabel && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-[10px] shadow-2xs">
                                    {pendingLabel}
                                  </span>
                                )}
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
                              </div>

                              <div className="text-right text-[11px] text-stone-500 font-mono">
                                <span>{formatDateTime(sale.createdAt)}</span>
                                {sale.user?.name && (
                                  <span className="block text-stone-400">
                                    Staff: {sale.user.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Itemized Books Table */}
                            <div className="mb-3 overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-400 text-[10px] font-bold uppercase">
                                    <th className="py-1.5 px-2">Book / Item Title</th>
                                    <th className="py-1.5 px-2 text-center">Qty</th>
                                    <th className="py-1.5 px-2 text-right">Price</th>
                                    <th className="py-1.5 px-2 text-right">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                  {sale.items?.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                      <td className="py-1.5 px-2">
                                        <p className="font-semibold text-stone-900">
                                          {item.book?.title || item.bookTitle || 'Book'}
                                        </p>
                                        {item.book?.isbn && (
                                          <p className="text-[10px] font-mono text-stone-400">
                                            ISBN: {item.book.isbn}
                                          </p>
                                        )}
                                      </td>
                                      <td className="py-1.5 px-2 text-center font-bold">
                                        {item.quantity}
                                      </td>
                                      <td className="py-1.5 px-2 text-right text-stone-600">
                                        {formatPKR(item.unitPrice)}
                                      </td>
                                      <td className="py-1.5 px-2 text-right font-extrabold text-stone-900">
                                        {formatPKR(item.subtotal)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Financial Summary & Incremental Payments */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs">
                              {/* Order Totals Breakdown */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-stone-600">
                                  <span>Grand Total:</span>
                                  <span className="font-extrabold text-stone-900">
                                    {formatPKR(sale.grandTotal)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-emerald-700 font-semibold">
                                  <span>Amount Paid:</span>
                                  <span>{formatPKR(sale.paidAmount)}</span>
                                </div>
                                {sale.remainingAmount > 0 && (
                                  <div className="flex justify-between text-rose-600 font-extrabold">
                                    <span>Remaining Balance:</span>
                                    <span>{formatPKR(sale.remainingAmount)}</span>
                                  </div>
                                )}
                              </div>

                              {/* Incremental Payments Log */}
                              {sale.payments && sale.payments.length > 0 && (
                                <div className="border-t sm:border-t-0 sm:border-l border-stone-200/80 pt-2 sm:pt-0 sm:pl-3 space-y-1 text-[10px]">
                                  <p className="font-bold text-stone-600 uppercase">
                                    Payment Transactions:
                                  </p>
                                  {sale.payments.map((p: any, idx: number) => (
                                    <div
                                      key={p.id || idx}
                                      className="flex items-center justify-between text-stone-600"
                                    >
                                      <span>
                                        {formatDate(p.createdAt)} ({p.method})
                                      </span>
                                      <span className="font-bold text-emerald-700">
                                        +{formatPKR(p.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Order Actions Toolbar */}
                            <div className="mt-3.5 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Edit / Record Payment Button */}
                                {sale.remainingAmount > 0 && (
                                  <button
                                    onClick={() => {
                                      setPaymentModalSale(sale);
                                      setPayAmount(sale.remainingAmount.toString());
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Edit / Record Payment</span>
                                  </button>
                                )}

                                {/* Print Invoice */}
                                <button
                                  onClick={() => setReceiptModalSale(sale)}
                                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Print</span>
                                </button>

                                {/* Download PDF */}
                                <button
                                  onClick={() => generateInvoicePDF(sale, companySettings)}
                                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-200 flex items-center gap-1.5 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5 text-stone-600" />
                                  <span>PDF</span>
                                </button>

                                {/* WhatsApp Share */}
                                <button
                                  onClick={() => shareInvoiceOnWhatsApp(sale, companySettings)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs border border-emerald-200 flex items-center gap-1.5 transition-colors"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </button>
                              </div>

                              {/* Return Order Button */}
                              {sale.status !== 'RETURNED' && (
                                <button
                                  onClick={() => {
                                    setReturnModalSale(sale);
                                    const initialQty: Record<string, number> = {};
                                    sale.items?.forEach((i: any) => {
                                      initialQty[i.bookId] = 0;
                                    });
                                    setReturnItems(initialQty);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 flex items-center gap-1.5 transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Return Books</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Record / Edit Payment Modal */}
      <Modal
        isOpen={!!paymentModalSale}
        onClose={() => setPaymentModalSale(null)}
        title="Record / Update Payment Entry"
        description={`Invoice #${paymentModalSale?.invoiceNumber}`}
        maxWidth="md"
      >
        {paymentModalSale && (
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>Customer Account:</span>
                <span className="font-bold text-stone-900">
                  {paymentModalSale.customer?.name || 'Walk-in Customer'}
                </span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Current Remaining Due:</span>
                <span>{formatPKR(paymentModalSale.remainingAmount)}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Amount Paid (PKR) *
              </label>
              <input
                type="number"
                required
                min="1"
                max={paymentModalSale.remainingAmount}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-medium"
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
              <label className="block font-semibold text-stone-700 mb-1">Notes / Reference</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Transaction ID or payment notes..."
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalSale(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPaySubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs"
              >
                {isPaySubmitting ? 'Saving...' : 'Save Payment Entry'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Return Books Modal */}
      <Modal
        isOpen={!!returnModalSale}
        onClose={() => setReturnModalSale(null)}
        title="Process Book Return"
        description={`Return items for Invoice #${returnModalSale?.invoiceNumber}`}
        maxWidth="lg"
      >
        {returnModalSale && (
          <form onSubmit={handleProcessReturn} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800">
              <p className="font-bold">⚠️ Inventory Restock & Balance Adjustment</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Returned books will automatically be restocked into inventory, and the customer credit balance will update accordingly.
              </p>
            </div>

            {/* Item Selection Table */}
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                    <th className="py-2 px-3">Item / Book</th>
                    <th className="py-2 px-3 text-center">Purchased</th>
                    <th className="py-2 px-3 text-center">Return Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {returnModalSale.items?.map((item: any) => (
                    <tr key={item.bookId}>
                      <td className="py-2 px-3">
                        <p className="font-bold text-stone-900">
                          {item.book?.title || item.bookTitle}
                        </p>
                      </td>
                      <td className="py-2 px-3 text-center font-semibold text-stone-600">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={returnItems[item.bookId] || 0}
                          onChange={(e) => {
                            const val = Math.min(
                              item.quantity,
                              Math.max(0, parseInt(e.target.value, 10) || 0)
                            );
                            setReturnItems({ ...returnItems, [item.bookId]: val });
                          }}
                          className="w-16 p-1 text-center font-bold bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-stone-700">
                        {formatPKR(item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Refund Method
                </label>
                <select
                  value={refundType}
                  onChange={(e) => setRefundType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                >
                  <option value="REFUND_CASH">Cash Refund</option>
                  <option value="STORE_CREDIT">Store Credit</option>
                  <option value="OUTSTANDING_ADJUSTMENT">
                    Adjust Outstanding Balance
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Defective print, Customer request..."
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>
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
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-xs"
              >
                {isReturnSubmitting ? 'Processing Return...' : 'Confirm Return'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptModalSale}
        onClose={() => setReceiptModalSale(null)}
        sale={receiptModalSale}
        companyInfo={companySettings}
      />
    </div>
  );
}

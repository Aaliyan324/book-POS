'use client';

import React, { useState } from 'react';
import { Search, UserPlus, Phone, Mail, MapPin, Receipt, CreditCard, ChevronRight, Download, FileText, ShoppingBag } from 'lucide-react';
import { formatPKR, formatDate, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { createCustomerAction, updateCustomerAction, getCustomerDetailsAction } from '@/app/actions/customers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CustomerManagementProps {
  initialCustomers: any[];
}

export function CustomerManagement({ initialCustomers }: CustomerManagementProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');

  // Add / Edit Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState<any | null>(null);
  const [custForm, setCustForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });

  // Customer Details Profile Drawer Modal
  const [selectedCustDetail, setSelectedCustDetail] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.customerId.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name) return;

    try {
      if (editingCust) {
        const res = await updateCustomerAction(editingCust.id, custForm);
        if (!res.success) throw new Error(res.error);
        setCustomers((prev) => prev.map((c) => (c.id === editingCust.id ? res.customer : c)));
      } else {
        const res = await createCustomerAction(custForm);
        if (!res.success) throw new Error(res.error);
        setCustomers((prev) => [res.customer, ...prev]);
      }
      setIsCustomerModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Error saving customer');
    }
  };

  const handleOpenDetail = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await getCustomerDetailsAction(id);
      setSelectedCustDetail(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const resetForm = () => {
    setEditingCust(null);
    setCustForm({ name: '', phone: '', email: '', address: '', notes: '' });
  };

  const exportCustomerHistoryPDF = (cust: any) => {
    if (!cust) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Company Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12); // Orange
    doc.text('Sunlight Book Distributors', 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('CUSTOMER STATEMENT & PURCHASE HISTORY', 14, 25);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 30);

    // Customer Information Card Box
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(250, 250, 249);
    doc.rect(14, 34, 182, 28, 'F');
    doc.rect(14, 34, 182, 28, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Customer: ${cust.name} (${cust.customerId})`, 18, 41);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Phone: ${cust.phone || 'N/A'}  |  Email: ${cust.email || 'N/A'}`, 18, 47);
    doc.text(`Address: ${cust.address || 'N/A'}`, 18, 53);

    const totalOrders = cust.sales?.length || 0;
    const totalSpentStr = `Rs. ${cust.totalPurchases.toLocaleString()}`;
    const totalPaidStr = `Rs. ${cust.totalPaid.toLocaleString()}`;
    const dueStr = `Rs. ${cust.outstandingBalance.toLocaleString()}`;

    doc.setFont('helvetica', 'bold');
    doc.text(`Total Orders: ${totalOrders}  |  Total Spent: ${totalSpentStr}  |  Total Paid: ${totalPaidStr}  |  Outstanding: ${dueStr}`, 18, 58);

    // Prepare table rows
    const tableRows = (cust.sales || []).map((sale: any) => {
      const itemsList = (sale.items || [])
        .map((i: any) => {
          const title = i.bookTitle || i.book?.title || 'Book';
          return `${i.quantity}x ${title} @ Rs. ${i.unitPrice}`;
        })
        .join('\n');

      const dateStr = new Date(sale.createdAt).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      return [
        sale.invoiceNumber,
        dateStr,
        itemsList || 'N/A',
        `Rs. ${sale.grandTotal.toLocaleString()}`,
        `Rs. ${sale.paidAmount.toLocaleString()}`,
        `Rs. ${sale.remainingAmount.toLocaleString()}`,
        sale.paymentStatus,
      ];
    });

    autoTable(doc, {
      startY: 67,
      head: [['Invoice #', 'Date', 'Purchased Items (Qty x Book @ Unit Price)', 'Grand Total', 'Paid Amount', 'Remaining', 'Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [234, 88, 12],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 22 },
        2: { cellWidth: 70 },
        3: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 22 },
        6: { halign: 'center', cellWidth: 20 },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${data.pageNumber} - Sunlight Book POS Customer Record`, 14, doc.internal.pageSize.height - 10);
      },
    });

    const safeFilename = `Customer_History_${cust.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(safeFilename);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Customer Directory</h2>
          <p className="text-xs text-stone-500">
            Track customer profiles, credit balances, purchase history, and payment ledgers.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsCustomerModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-xs shadow-md hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
        <div className="relative max-w-md text-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by Name, Customer ID, Phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-orange-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">{c.name}</h4>
                  <span className="text-[10px] font-mono text-orange-600 font-bold">{c.customerId}</span>
                </div>
                <Badge variant={c.outstandingBalance > 0 ? 'warning' : 'success'}>
                  {c.outstandingBalance > 0 ? `Due: ${formatPKR(c.outstandingBalance)}` : 'Clear Balance'}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-stone-500 my-3">
                {c.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{c.phone}</span>
                  </p>
                )}
                {c.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{c.email}</span>
                  </p>
                )}
                {c.address && (
                  <p className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{c.address}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] text-stone-400">Total Purchases</p>
                <p className="font-bold text-stone-900">{formatPKR(c.totalPurchases)}</p>
              </div>

              <button
                onClick={() => handleOpenDetail(c.id)}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View Profile</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={editingCust ? 'Edit Customer' : 'Add New Customer'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Customer Name *</label>
            <input
              type="text"
              required
              value={custForm.name}
              onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={custForm.phone}
                onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
              <input
                type="email"
                value={custForm.email}
                onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Address</label>
            <input
              type="text"
              value={custForm.address}
              onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-stone-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Profile & Purchase History Modal */}
      <Modal
        isOpen={!!selectedCustDetail}
        onClose={() => setSelectedCustDetail(null)}
        title={selectedCustDetail?.name}
        description={`Customer ID: ${selectedCustDetail?.customerId}`}
        maxWidth="4xl"
      >
        {selectedCustDetail && (
          <div className="space-y-6 text-xs">
            {/* Header Toolbar with PDF Export Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <span>{selectedCustDetail.name}</span>
                  <span className="text-[10px] font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 font-bold">
                    {selectedCustDetail.customerId}
                  </span>
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-stone-500 text-[11px]">
                  {selectedCustDetail.phone && <span>Phone: {selectedCustDetail.phone}</span>}
                  {selectedCustDetail.email && <span>Email: {selectedCustDetail.email}</span>}
                  {selectedCustDetail.address && <span>Address: {selectedCustDetail.address}</span>}
                </div>
              </div>

              <button
                onClick={() => exportCustomerHistoryPDF(selectedCustDetail)}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4 text-orange-400" />
                <span>Download Purchase History PDF</span>
              </button>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                <p className="text-stone-400 text-[11px] font-medium">Total Orders</p>
                <p className="text-lg font-extrabold text-stone-900">
                  {selectedCustDetail.sales?.length || 0}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                <p className="text-stone-400 text-[11px] font-medium">Total Amount Spent</p>
                <p className="text-lg font-extrabold text-stone-900">
                  {formatPKR(selectedCustDetail.totalPurchases)}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                <p className="text-stone-400 text-[11px] font-medium">Total Paid</p>
                <p className="text-lg font-extrabold text-emerald-700">
                  {formatPKR(selectedCustDetail.totalPaid)}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                <p className="text-stone-400 text-[11px] font-medium">Outstanding Due</p>
                <p className="text-lg font-extrabold text-rose-600">
                  {formatPKR(selectedCustDetail.outstandingBalance)}
                </p>
              </div>
            </div>

            {/* Detailed Itemized Purchase History Cards / Rows */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-600" />
                <span>Complete Purchase History</span>
              </h4>

              {(!selectedCustDetail.sales || selectedCustDetail.sales.length === 0) ? (
                <div className="py-10 text-center text-stone-400 bg-stone-50 rounded-xl border border-stone-200">
                  No sales recorded for this customer yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {selectedCustDetail.sales.map((sale: any) => (
                    <div
                      key={sale.id}
                      className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-2xs space-y-3 hover:border-stone-300 transition-colors"
                    >
                      {/* Sale Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900 text-xs sm:text-sm">
                            #{sale.invoiceNumber}
                          </span>
                          <span className="text-stone-400">•</span>
                          <span className="text-stone-500 text-[11px]">
                            {formatDate(sale.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
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
                          <span className="font-extrabold text-stone-900">
                            {formatPKR(sale.grandTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Items Purchased List */}
                      <div className="space-y-1.5 bg-stone-50/70 p-3 rounded-lg border border-stone-100 text-[11px]">
                        <p className="font-bold text-stone-500 uppercase text-[9px] mb-1">
                          Items Purchased:
                        </p>
                        {sale.items?.map((item: any, idx: number) => {
                          const bookTitle = item.bookTitle || item.book?.title || 'Book Item';
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 text-stone-800"
                            >
                              <span className="font-medium truncate">
                                {item.quantity} × <strong className="text-stone-900">{bookTitle}</strong>
                              </span>
                              <span className="font-semibold text-stone-600 shrink-0">
                                @ {formatPKR(item.unitPrice)} ={' '}
                                <strong className="text-stone-900">{formatPKR(item.unitPrice * item.quantity)}</strong>
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Sale Financial Breakdown Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1 text-stone-600">
                        <div>
                          <span>Paid: </span>
                          <strong className="text-emerald-700">{formatPKR(sale.paidAmount)}</strong>
                          {sale.remainingAmount > 0 && (
                            <span className="ml-2 text-rose-600">
                              (Remaining: <strong>{formatPKR(sale.remainingAmount)}</strong>)
                            </span>
                          )}
                        </div>
                        {sale.payments && sale.payments[0] && (
                          <div className="text-stone-500">
                            Payment Method: <strong className="text-stone-800">{sale.payments[0].method}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Search, UserPlus, Phone, Mail, MapPin, Receipt, CreditCard, ChevronRight } from 'lucide-react';
import { formatPKR, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { createCustomerAction, updateCustomerAction, getCustomerDetailsAction } from '@/app/actions/customers';

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
            <div className="grid grid-cols-3 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div>
                <p className="text-stone-400">Total Purchases</p>
                <p className="text-base font-bold text-stone-900">{formatPKR(selectedCustDetail.totalPurchases)}</p>
              </div>
              <div>
                <p className="text-stone-400">Total Paid</p>
                <p className="text-base font-bold text-emerald-700">{formatPKR(selectedCustDetail.totalPaid)}</p>
              </div>
              <div>
                <p className="text-stone-400">Outstanding Balance</p>
                <p className="text-base font-bold text-rose-600">{formatPKR(selectedCustDetail.outstandingBalance)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-stone-900 mb-2">Purchase & Sales History</h4>
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 font-bold text-stone-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Grand Total</th>
                      <th className="p-3 text-right">Paid</th>
                      <th className="p-3 text-right">Remaining</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedCustDetail.sales?.map((sale: any) => (
                      <tr key={sale.id}>
                        <td className="p-3 font-mono font-bold text-stone-900">{sale.invoiceNumber}</td>
                        <td className="p-3 text-stone-500">{formatDate(sale.createdAt)}</td>
                        <td className="p-3 text-right font-bold text-stone-900">{formatPKR(sale.grandTotal)}</td>
                        <td className="p-3 text-right font-semibold text-emerald-700">{formatPKR(sale.paidAmount)}</td>
                        <td className="p-3 text-right font-semibold text-rose-600">{formatPKR(sale.remainingAmount)}</td>
                        <td className="p-3 text-center">
                          <Badge variant={sale.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                            {sale.paymentStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

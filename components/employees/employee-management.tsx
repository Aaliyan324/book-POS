'use client';

import React, { useState } from 'react';
import { UserCheck, Plus, Key, Shield, UserX, Award, ShoppingBag, Banknote, BookOpen, Search, Check } from 'lucide-react';
import { formatPKR, formatDate, getRoleBadge } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { createEmployeeAction, updateEmployeeAction, resetEmployeePasswordAction } from '@/app/actions/employees';

interface EmployeeManagementProps {
  initialEmployees: any[];
  allBooks?: any[];
}

export function EmployeeManagement({ initialEmployees, allBooks = [] }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState(initialEmployees);

  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'EMPLOYEE' as 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
    allowedBookIds: [] as string[],
  });

  // Edit Book Permissions Modal State
  const [editingPermissionsEmp, setEditingPermissionsEmp] = useState<any | null>(null);
  const [permissionBookIds, setPermissionBookIds] = useState<string[]>([]);
  const [bookSearch, setBookSearch] = useState('');
  const [isPermissionsSubmitting, setIsPermissionsSubmitting] = useState(false);

  // Password Reset Modal State
  const [resetModalEmp, setResetModalEmp] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password) return;

    try {
      const res = await createEmployeeAction(addForm);
      if (!res.success) throw new Error(res.error);

      setEmployees((prev) => [
        {
          ...res.employee,
          totalOrders: 0,
          totalRevenue: 0,
          paymentsCollected: 0,
          outstandingCreated: 0,
          booksSold: 0,
          allowedBookIds: addForm.allowedBookIds,
        },
        ...prev,
      ]);

      setIsAddModalOpen(false);
      setAddForm({ name: '', email: '', phone: '', password: '', role: 'EMPLOYEE', allowedBookIds: [] });
      alert('Employee created successfully!');
    } catch (err: any) {
      alert(err.message || 'Error creating employee');
    }
  };

  const handleToggleStatus = async (emp: any) => {
    const nextStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change status of ${emp.name} to ${nextStatus}?`)) return;

    try {
      const res = await updateEmployeeAction(emp.id, { status: nextStatus });
      if (!res.success) throw new Error(res.error);

      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, status: nextStatus } : e))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleOpenPermissionsModal = (emp: any) => {
    setEditingPermissionsEmp(emp);
    setPermissionBookIds(emp.allowedBookIds || []);
    setBookSearch('');
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPermissionsEmp) return;

    setIsPermissionsSubmitting(true);
    try {
      const res = await updateEmployeeAction(editingPermissionsEmp.id, {
        allowedBookIds: permissionBookIds,
      });

      if (!res.success) throw new Error(res.error);

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === editingPermissionsEmp.id ? { ...e, allowedBookIds: permissionBookIds } : e
        )
      );

      setEditingPermissionsEmp(null);
      alert(`Book permissions updated for ${editingPermissionsEmp.name}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to save book permissions');
    } finally {
      setIsPermissionsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalEmp || !newPassword) return;

    try {
      const res = await resetEmployeePasswordAction(resetModalEmp.id, newPassword);
      if (!res.success) throw new Error(res.error);

      setResetModalEmp(null);
      setNewPassword('');
      alert('Password reset successfully!');
    } catch (err: any) {
      alert(err.message || 'Password reset failed');
    }
  };

  const filteredBooks = allBooks.filter(
    (b) =>
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      (b.bookId || '').toLowerCase().includes(bookSearch.toLowerCase()) ||
      (b.author || '').toLowerCase().includes(bookSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Employee Management & Performance</h2>
          <p className="text-xs text-stone-500">
            Admin console to manage system staff, assign roles, configure allowed book permissions, and track sales metrics.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-xs shadow-md hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Employee Performance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => {
          const isFullAccess = emp.role === 'ADMIN' || emp.role === 'MANAGER';
          const allowedCount = emp.allowedBookIds?.length || 0;

          return (
            <div
              key={emp.id}
              className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-base font-bold text-stone-900">{emp.name}</h4>
                    <p className="text-xs text-stone-500">{emp.email}</p>
                    <span className="inline-block text-[10px] font-mono font-bold text-orange-600 mt-0.5">
                      {emp.employeeId}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={emp.role === 'ADMIN' ? 'orange' : emp.role === 'MANAGER' ? 'info' : 'neutral'}>
                      {emp.role}
                    </Badge>
                    <span
                      className={`text-[10px] font-bold ${
                        emp.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      ● {emp.status}
                    </span>
                  </div>
                </div>

                {/* Allowed Books Indicator Pill */}
                <div className="mb-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-stone-700 font-semibold text-[11px]">
                    <BookOpen className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>
                      {isFullAccess
                        ? 'All Books (Full Access)'
                        : `${allowedCount} Allowed Book(s)`}
                    </span>
                  </div>
                  {!isFullAccess && (
                    <button
                      onClick={() => handleOpenPermissionsModal(emp)}
                      className="text-[11px] text-orange-600 hover:text-orange-700 font-extrabold"
                    >
                      Edit Access
                    </button>
                  )}
                </div>

                {/* Performance Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs my-3">
                  <div>
                    <p className="text-[10px] text-stone-400">Total Sales Volume</p>
                    <p className="font-bold text-stone-900">{formatPKR(emp.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400">Orders Processed</p>
                    <p className="font-bold text-stone-900">{emp.totalOrders} orders</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400">Collected Payments</p>
                    <p className="font-bold text-emerald-700">{formatPKR(emp.paymentsCollected)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400">Outstanding Created</p>
                    <p className="font-bold text-rose-600">{formatPKR(emp.outstandingCreated)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenPermissionsModal(emp)}
                    className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-stone-700 font-semibold hover:bg-stone-50 flex items-center gap-1 text-[11px]"
                    title="Configure allowed books"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                    <span>Books</span>
                  </button>

                  <button
                    onClick={() => setResetModalEmp(emp)}
                    className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-stone-700 font-semibold hover:bg-stone-50 flex items-center gap-1 text-[11px]"
                    title="Reset password"
                  >
                    <Key className="w-3.5 h-3.5 text-stone-400" />
                    <span>Key</span>
                  </button>
                </div>

                <button
                  onClick={() => handleToggleStatus(emp)}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-[11px] transition-colors ${
                    emp.status === 'ACTIVE'
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New System Employee"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Password *</label>
              <input
                type="password"
                required
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Assigned Role *</label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value as any })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              >
                <option value="EMPLOYEE">Employee (POS & Sales - Book Restricted)</option>
                <option value="MANAGER">Manager (Operations & Reports)</option>
                <option value="ADMIN">Administrator (Full Access)</option>
              </select>
            </div>
          </div>

          {/* Allowed Books Multi-Select Section for Employee Role */}
          {addForm.role === 'EMPLOYEE' && (
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  <span>Allowed Books Access Permissions</span>
                </label>
                <span className="text-[11px] text-stone-500 font-semibold">
                  {addForm.allowedBookIds.length} book(s) selected
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Select which books this employee is allowed to view, search, and sell at the POS counter.
              </p>

              <div className="max-h-40 overflow-y-auto divide-y divide-stone-100 bg-white rounded-lg border border-stone-200 p-2">
                {allBooks.length === 0 ? (
                  <p className="text-center py-4 text-stone-400">No books available in inventory.</p>
                ) : (
                  allBooks.map((book) => {
                    const isChecked = addForm.allowedBookIds.includes(book.id);
                    return (
                      <label
                        key={book.id}
                        className="flex items-center justify-between py-1.5 px-2 hover:bg-stone-50 rounded-lg cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-stone-900">{book.title}</p>
                          <p className="text-[10px] text-stone-400 font-mono">
                            {book.bookId} {book.author ? `• ${book.author}` : ''}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAddForm({
                                ...addForm,
                                allowedBookIds: [...addForm.allowedBookIds, book.id],
                              });
                            } else {
                              setAddForm({
                                ...addForm,
                                allowedBookIds: addForm.allowedBookIds.filter(
                                  (id) => id !== book.id
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                        />
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-stone-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600"
            >
              Create Employee
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Book Permissions Modal */}
      <Modal
        isOpen={!!editingPermissionsEmp}
        onClose={() => setEditingPermissionsEmp(null)}
        title={`Book Access Permissions - ${editingPermissionsEmp?.name}`}
        description={`Manage allowed books for ${editingPermissionsEmp?.name} (${editingPermissionsEmp?.employeeId})`}
        maxWidth="lg"
      >
        {editingPermissionsEmp && (
          <form onSubmit={handleSavePermissions} className="space-y-4 text-xs">
            {/* Header / Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="Filter books by title, author, ID..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPermissionBookIds(allBooks.map((b) => b.id))}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-[11px]"
                >
                  Select All ({allBooks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPermissionBookIds([])}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-rose-600 font-semibold text-[11px]"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Currently Selected Summary Badge */}
            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 font-semibold flex items-center justify-between text-[11px]">
              <span>Currently Assigned Books:</span>
              <span className="font-extrabold bg-orange-500 text-white px-2 py-0.5 rounded-md">
                {permissionBookIds.length} of {allBooks.length} Books
              </span>
            </div>

            {/* Books Checkbox List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-xl p-2 bg-white">
              {filteredBooks.length === 0 ? (
                <p className="text-center py-6 text-stone-400">No books matched search query.</p>
              ) : (
                filteredBooks.map((book) => {
                  const isChecked = permissionBookIds.includes(book.id);
                  return (
                    <label
                      key={book.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isChecked ? 'bg-orange-50/50 font-bold' : 'hover:bg-stone-50'
                      }`}
                    >
                      <div>
                        <p className="text-stone-900 font-bold">{book.title}</p>
                        <p className="text-[10px] text-stone-400 font-mono">
                          {book.bookId} {book.author ? `• ${book.author}` : ''}
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermissionBookIds([...permissionBookIds, book.id]);
                          } else {
                            setPermissionBookIds(
                              permissionBookIds.filter((id) => id !== book.id)
                            );
                          }
                        }}
                        className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                      />
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPermissionsEmp(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPermissionsSubmitting}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-xs"
              >
                {isPermissionsSubmitting ? 'Saving...' : 'Save Book Permissions'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={!!resetModalEmp}
        onClose={() => setResetModalEmp(null)}
        title="Reset Password"
        description={`Resetting password for ${resetModalEmp?.name} (${resetModalEmp?.employeeId})`}
        maxWidth="sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setResetModalEmp(null)}
              className="px-4 py-2 rounded-xl border border-stone-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

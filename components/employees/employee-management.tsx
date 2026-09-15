'use client';

import React, { useState } from 'react';
import { UserCheck, Plus, Key, Shield, UserX, Award, ShoppingBag, Banknote } from 'lucide-react';
import { formatPKR, formatDate, getRoleBadge } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { createEmployeeAction, updateEmployeeAction, resetEmployeePasswordAction } from '@/app/actions/employees';

interface EmployeeManagementProps {
  initialEmployees: any[];
}

export function EmployeeManagement({ initialEmployees }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState(initialEmployees);

  // Add Employee Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'EMPLOYEE' as 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
  });

  // Password Reset Modal
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
        },
        ...prev,
      ]);

      setIsAddModalOpen(false);
      setAddForm({ name: '', email: '', phone: '', password: '', role: 'EMPLOYEE' });
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

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Employee Management & Performance</h2>
          <p className="text-xs text-stone-500">
            Admin console to manage system staff, assign roles, reset credentials, and track sales metrics.
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
        {employees.map((emp) => (
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

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <button
                onClick={() => setResetModalEmp(emp)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 font-semibold hover:bg-stone-50 flex items-center gap-1"
              >
                <Key className="w-3.5 h-3.5 text-stone-400" />
                <span>Reset Password</span>
              </button>

              <button
                onClick={() => handleToggleStatus(emp)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                  emp.status === 'ACTIVE'
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New System Employee"
        maxWidth="md"
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
                <option value="EMPLOYEE">Employee (POS & Sales)</option>
                <option value="MANAGER">Manager (Operations & Reports)</option>
                <option value="ADMIN">Administrator (Full Access)</option>
              </select>
            </div>
          </div>

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

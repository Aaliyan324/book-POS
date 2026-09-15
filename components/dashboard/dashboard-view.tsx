'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Banknote,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Users,
  BookOpen,
  ArrowRight,
  Clock,
  Eye,
  Receipt,
  Wallet,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { formatPKR, formatDate, getPaymentStatusBadge } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardViewProps {
  metrics: {
    todaySalesRevenue: number;
    todayOrdersCount: number;
    todayBooksSold: number;
    totalRevenue: number;
    totalPaidCollected: number;
    outstandingAmount: number;
    lowStockBooksCount: number;
    totalCustomers: number;
    totalExpenses: number;
    netProfit: number;
    last7DaysChartData: Array<{ date: string; sales: number; orders: number }>;
    recentSales: any[];
    lowStockBooks: any[];
    outstandingSales: any[];
  };
}

export function DashboardView({ metrics }: DashboardViewProps) {
  const [chartRange, setChartRange] = useState<'7days' | '30days'>('7days');

  return (
    <div className="space-y-6">
      {/* Top Banner Quick Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white p-6 rounded-3xl shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-orange-400">
            Store Performance Overview
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">Sunlight Book Distributors POS</h2>
          <p className="text-xs text-stone-300 mt-1">
            Real-time daily operations, payments, stock movement, and customer credit ledger.
          </p>
        </div>
        <Link
          href="/pos"
          className="px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all hover:scale-105 shrink-0 flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Launch POS Console</span>
        </Link>
      </div>

      {/* Summary KPI Cards Grid (8 Core Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={formatPKR(metrics.todaySalesRevenue)}
          subtitle={`${metrics.todayOrdersCount} order(s) processed today`}
          icon={Banknote}
          highlight={true}
        />
        <StatCard
          title="Today's Orders"
          value={metrics.todayOrdersCount}
          subtitle={`${metrics.todayBooksSold} book(s) sold today`}
          icon={ShoppingBag}
        />
        <StatCard
          title="Total Revenue"
          value={formatPKR(metrics.totalRevenue)}
          subtitle={`Collected: ${formatPKR(metrics.totalPaidCollected)}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Outstanding Credit"
          value={formatPKR(metrics.outstandingAmount)}
          subtitle="Pending customer balances"
          icon={Clock}
        />
        <StatCard
          title="Books Sold Today"
          value={metrics.todayBooksSold}
          subtitle="Total volume of units"
          icon={BookOpen}
        />
        <StatCard
          title="Low Stock Alerts"
          value={metrics.lowStockBooksCount}
          subtitle="Books below min threshold"
          icon={AlertTriangle}
        />
        <StatCard
          title="Total Customers"
          value={metrics.totalCustomers}
          subtitle="Active customer accounts"
          icon={Users}
        />
        <StatCard
          title="Net Operating Profit"
          value={formatPKR(metrics.netProfit)}
          subtitle={`Total Expenses: ${formatPKR(metrics.totalExpenses)}`}
          icon={Wallet}
        />
      </div>

      {/* Sales Analytics Chart & Low Stock Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-stone-900">Sales Overview</h3>
              <p className="text-xs text-stone-500">Daily revenue performance</p>
            </div>
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setChartRange('7days')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  chartRange === '7days' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                }`}
              >
                7 Days
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.last7DaysChartData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} />
                <Tooltip
                  formatter={(val: any) => [formatPKR(Number(val)), 'Sales Revenue']}
                  contentStyle={{ backgroundColor: '#1c1917', color: '#fff', borderRadius: '12px', border: 'none' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#f97316"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Widget */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Low Stock Books
              </h3>
              <Link href="/books?filter=low_stock" className="text-xs text-orange-600 font-bold hover:underline">
                View All ({metrics.lowStockBooksCount})
              </Link>
            </div>

            <div className="divide-y divide-stone-100 space-y-2">
              {metrics.lowStockBooks.length === 0 ? (
                <p className="text-xs text-stone-400 py-6 text-center">All book inventory levels are healthy!</p>
              ) : (
                metrics.lowStockBooks.slice(0, 5).map((book) => (
                  <div key={book.id} className="pt-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900 truncate">{book.title}</p>
                      <p className="text-[11px] text-stone-400">{book.category?.name || 'Book'}</p>
                    </div>
                    <Badge variant={book.stockQuantity === 0 ? 'danger' : 'warning'}>
                      {book.stockQuantity === 0 ? 'Out of Stock' : `${book.stockQuantity} left`}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/inventory"
            className="mt-4 pt-3 border-t border-stone-100 text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center justify-center gap-1"
          >
            <span>Manage Inventory Restock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Sales Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900">Recent Transactions</h3>
            <p className="text-xs text-stone-500">Latest sales completed across terminals</p>
          </div>
          <Link
            href="/sales"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>View All Sales</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-right">Paid</th>
                <th className="py-3 px-3 text-right">Remaining</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {metrics.recentSales.map((sale) => {
                const badge = getPaymentStatusBadge(sale.paymentStatus);

                return (
                  <tr key={sale.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-stone-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 font-medium text-stone-900">
                      {sale.customer?.name || 'Walk-in Customer'}
                    </td>
                    <td className="py-3 px-3 text-stone-600">{sale.user?.name}</td>
                    <td className="py-3 px-3 text-stone-500">{formatDate(sale.createdAt)}</td>
                    <td className="py-3 px-3 text-right font-bold text-stone-900">
                      {formatPKR(sale.grandTotal)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                      {formatPKR(sale.paidAmount)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-rose-600">
                      {formatPKR(sale.remainingAmount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge
                        variant={
                          sale.paymentStatus === 'PAID'
                            ? 'success'
                            : sale.paymentStatus === 'PARTIALLY_PAID'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {badge.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

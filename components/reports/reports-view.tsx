'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, Filter, Calendar, TrendingUp, BookOpen, Users, Package } from 'lucide-react';
import { formatPKR, formatDate } from '@/lib/utils';
import { getReportsDataAction } from '@/app/actions/reports';
import { Badge } from '@/components/ui/badge';

export function ReportsView() {
  const [reportType, setReportType] = useState<'sales' | 'financial' | 'inventory' | 'employee' | 'books'>('sales');
  const [dateRange, setDateRange] = useState('30days');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getReportsDataAction(reportType, dateRange)
      .then((data) => setReportData(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [reportType, dateRange]);

  const handleExportCSV = () => {
    if (!reportData) return;
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'sales' && reportData.sales) {
      csvContent += 'Invoice #,Date,Customer,Subtotal,Discount,Grand Total,Paid,Remaining,Status\n';
      reportData.sales.forEach((s: any) => {
        csvContent += `"${s.invoiceNumber}","${s.createdAt}","${s.customer?.name || 'Walk-in'}","${s.subtotal}","${s.discount}","${s.grandTotal}","${s.paidAmount}","${s.remainingAmount}","${s.paymentStatus}"\n`;
      });
    } else if (reportType === 'books' && reportData.rankedBooks) {
      csvContent += 'Book Title,ISBN,Author,Quantity Sold,Total Revenue (PKR)\n';
      reportData.rankedBooks.forEach((item: any) => {
        csvContent += `"${item.book.title}","${item.book.isbn || 'N/A'}","${item.book.author}","${item.quantitySold}","${item.totalRevenue}"\n`;
      });
    } else {
      csvContent += 'Report Data Export\n';
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `report-${reportType}-${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Business Reports & Export Center</h2>
          <p className="text-xs text-stone-500">
            Generate and export Sales, Inventory, Financial Profit/Loss, Book Ranking, and Employee reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs hover:bg-stone-100 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Range Picker */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs text-xs">
        {/* Report Type Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'sales', label: 'Sales Report' },
            { id: 'financial', label: 'Profit & Loss Report' },
            { id: 'books', label: 'Best-Selling Books' },
            { id: 'inventory', label: 'Inventory Movement' },
            { id: 'employee', label: 'Employee Performance' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setReportType(t.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                reportType === t.id
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-stone-400 font-semibold">Date Range:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="p-2 rounded-xl bg-stone-50 border border-stone-200 font-semibold text-stone-800"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
          </select>
        </div>
      </div>

      {/* Report Display Container */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6">
        {isLoading ? (
          <div className="py-20 text-center text-stone-400 text-sm">Generating report data...</div>
        ) : !reportData ? (
          <div className="py-12 text-center text-stone-400">Select report criteria above</div>
        ) : (
          <div>
            {/* Sales Report */}
            {reportType === 'sales' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
                  <div>
                    <p className="text-stone-400">Total Sales Revenue</p>
                    <p className="text-base font-bold text-stone-900">{formatPKR(reportData.totalSalesRev)}</p>
                  </div>
                  <div>
                    <p className="text-stone-400">Total Payments Collected</p>
                    <p className="text-base font-bold text-emerald-700">{formatPKR(reportData.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-stone-400">Total Remaining Balance</p>
                    <p className="text-base font-bold text-rose-600">{formatPKR(reportData.totalRemaining)}</p>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/50 text-stone-400 uppercase text-[10px] font-bold">
                      <th className="py-3 px-3">Invoice #</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Employee</th>
                      <th className="py-3 px-3 text-right">Grand Total</th>
                      <th className="py-3 px-3 text-right">Paid</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {reportData.sales?.map((s: any) => (
                      <tr key={s.id}>
                        <td className="py-3 px-3 font-mono font-bold text-stone-900">{s.invoiceNumber}</td>
                        <td className="py-3 px-3 text-stone-500">{formatDate(s.createdAt)}</td>
                        <td className="py-3 px-3 font-medium text-stone-900">{s.customer?.name || 'Walk-in'}</td>
                        <td className="py-3 px-3 text-stone-600">{s.user?.name}</td>
                        <td className="py-3 px-3 text-right font-bold text-stone-900">{formatPKR(s.grandTotal)}</td>
                        <td className="py-3 px-3 text-right font-semibold text-emerald-700">{formatPKR(s.paidAmount)}</td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant={s.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                            {s.paymentStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Profit & Loss Report */}
            {reportType === 'financial' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gradient-to-br from-stone-900 to-stone-800 text-white p-6 rounded-2xl shadow-sm text-xs">
                  <div>
                    <p className="text-stone-400 uppercase font-bold text-[10px]">Total Revenue</p>
                    <p className="text-xl font-bold mt-1 text-orange-400">{formatPKR(reportData.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 uppercase font-bold text-[10px]">Cash Collected</p>
                    <p className="text-xl font-bold mt-1 text-emerald-400">{formatPKR(reportData.totalCollected)}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 uppercase font-bold text-[10px]">Operating Expenses</p>
                    <p className="text-xl font-bold mt-1 text-rose-400">{formatPKR(reportData.totalExpenses)}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 uppercase font-bold text-[10px]">Net Operating Profit</p>
                    <p className="text-2xl font-bold mt-1 text-white">{formatPKR(reportData.netProfit)}</p>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-stone-900 pt-2">Expenses Breakdown</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/50 text-stone-400 uppercase text-[10px] font-bold">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Expense Title</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Authorized By</th>
                      <th className="py-3 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {reportData.expenses?.map((e: any) => (
                      <tr key={e.id}>
                        <td className="py-3 px-3 text-stone-500">{formatDate(e.date)}</td>
                        <td className="py-3 px-3 font-bold text-stone-900">{e.title}</td>
                        <td className="py-3 px-3 text-stone-600">{e.category}</td>
                        <td className="py-3 px-3 text-stone-600">{e.user?.name}</td>
                        <td className="py-3 px-3 text-right font-bold text-rose-600">{formatPKR(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Best Selling Books */}
            {reportType === 'books' && (
              <div className="space-y-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/50 text-stone-400 uppercase text-[10px] font-bold">
                      <th className="py-3 px-3">Rank</th>
                      <th className="py-3 px-3">Book Title</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3 text-center">Units Sold</th>
                      <th className="py-3 px-3 text-right">Total Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {reportData.rankedBooks?.map((item: any, idx: number) => (
                      <tr key={item.book.id}>
                        <td className="py-3 px-3 font-bold text-orange-600">#{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-stone-900">
                          {item.book.title}
                          <span className="block text-[10px] text-stone-400 font-normal">
                            Author: {item.book.author}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-stone-600">{item.book.category?.name}</td>
                        <td className="py-3 px-3 text-center font-bold text-stone-900">{item.quantitySold}</td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700">{formatPKR(item.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Employee Performance */}
            {reportType === 'employee' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportData.stats?.map((emp: any) => (
                  <div key={emp.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-stone-900">{emp.name}</h4>
                        <p className="text-[10px] font-mono text-orange-600">{emp.employeeId}</p>
                      </div>
                      <Badge variant="orange">{emp.role}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-stone-200/80">
                      <div>
                        <p className="text-stone-400">Total Sales Volume</p>
                        <p className="font-bold text-stone-900">{formatPKR(emp.revenueGenerated)}</p>
                      </div>
                      <div>
                        <p className="text-stone-400">Orders Processed</p>
                        <p className="font-bold text-stone-900">{emp.ordersCount}</p>
                      </div>
                      <div>
                        <p className="text-stone-400">Cash Collected</p>
                        <p className="font-bold text-emerald-700">{formatPKR(emp.collectedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-stone-400">Outstanding Created</p>
                        <p className="font-bold text-rose-600">{formatPKR(emp.outstandingCreated)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

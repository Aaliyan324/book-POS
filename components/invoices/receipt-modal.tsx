'use client';

import React, { useRef } from 'react';
import { Modal } from '@/components/ui/modal';
import { Printer, Download, CheckCircle2, RotateCcw } from 'lucide-react';
import { formatPKR, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
  companyInfo?: Record<string, string>;
  onNewSale?: () => void;
}

export function ReceiptModal({
  isOpen,
  onClose,
  sale,
  companyInfo = {},
  onNewSale,
}: ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const companyName = companyInfo.company_name || 'Sunlight Book Distributors';
  const companyPhone = companyInfo.company_phone || '+92 300 1234567';
  const companyEmail = companyInfo.company_email || 'pos@sunlightbooks.pk';
  const companyAddress = companyInfo.company_address || 'Main Commercial Market, Gulberg III, Lahore';
  const receiptFooter = companyInfo.pos_receipt_footer || 'Thank you for shopping at Sunlight Books!';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sale Completed Successfully"
      description={`Invoice #${sale.invoiceNumber}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Success Header Banner */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 no-print">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm text-emerald-900">Transaction Complete</p>
            <p>
              Invoice <span className="font-mono font-semibold">{sale.invoiceNumber}</span> was recorded into the database and stock inventory updated.
            </p>
          </div>
        </div>

        {/* Printable Receipt / Invoice Container */}
        <div
          ref={printRef}
          className="p-6 bg-white border border-stone-200 rounded-2xl text-stone-900 text-xs shadow-xs"
        >
          {/* Company Branding */}
          <div className="text-center pb-4 mb-4 border-b border-stone-200">
            <h2 className="text-lg font-bold tracking-tight text-stone-900 uppercase">
              {companyName}
            </h2>
            <p className="text-stone-500 text-[11px] mt-0.5">{companyAddress}</p>
            <p className="text-stone-500 text-[11px]">Phone: {companyPhone} • Email: {companyEmail}</p>
          </div>

          {/* Invoice Meta Grid */}
          <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-stone-100 text-[11px]">
            <div>
              <p className="text-stone-400 uppercase font-semibold">Invoice Details</p>
              <p className="font-mono font-bold text-stone-900 mt-0.5">{sale.invoiceNumber}</p>
              <p className="text-stone-600">Date: {formatDateTime(sale.createdAt)}</p>
              <p className="text-stone-600">Employee: {sale.user?.name || 'Staff'}</p>
            </div>
            <div className="text-right">
              <p className="text-stone-400 uppercase font-semibold">Billed To</p>
              <p className="font-bold text-stone-900 mt-0.5">
                {sale.customer?.name || 'Walk-in Customer'}
              </p>
              {sale.customer?.phone && (
                <p className="text-stone-600">Phone: {sale.customer.phone}</p>
              )}
              {sale.customer?.address && (
                <p className="text-stone-600 truncate">{sale.customer.address}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px]">
                  <th className="py-1.5 font-bold">Item / Book</th>
                  <th className="py-1.5 font-bold text-center">Qty</th>
                  <th className="py-1.5 font-bold text-right">Price</th>
                  <th className="py-1.5 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sale.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2 pr-2">
                      <p className="font-semibold text-stone-900">{item.book?.title || 'Book'}</p>
                      <p className="text-[10px] text-stone-400 font-mono">
                        ISBN: {item.book?.isbn || 'N/A'}
                      </p>
                    </td>
                    <td className="py-2 px-2 text-center font-semibold">{item.quantity}</td>
                    <td className="py-2 px-2 text-right text-stone-600">
                      {formatPKR(item.unitPrice)}
                    </td>
                    <td className="py-2 pl-2 text-right font-bold text-stone-900">
                      {formatPKR(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Breakdown */}
          <div className="border-t border-stone-200 pt-3 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatPKR(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-semibold">-{formatPKR(sale.discount)}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Tax:</span>
                <span className="font-semibold">{formatPKR(sale.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-stone-900 border-t border-stone-200 pt-2">
              <span>Grand Total:</span>
              <span className="text-orange-600">{formatPKR(sale.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span>Amount Paid:</span>
              <span className="font-semibold text-emerald-700">{formatPKR(sale.paidAmount)}</span>
            </div>
            {sale.remainingAmount > 0 ? (
              <div className="flex justify-between font-bold text-rose-600">
                <span>Remaining Balance Due:</span>
                <span>{formatPKR(sale.remainingAmount)}</span>
              </div>
            ) : (
              sale.paidAmount > sale.grandTotal && (
                <div className="flex justify-between font-bold text-blue-600">
                  <span>Change Given:</span>
                  <span>{formatPKR(sale.paidAmount - sale.grandTotal)}</span>
                </div>
              )
            )}
            <div className="flex justify-between text-[10px] text-stone-500 pt-1">
              <span>Payment Status:</span>
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
          </div>

          {/* Receipt Footer */}
          <div className="text-center pt-4 mt-4 border-t border-dashed border-stone-200 text-stone-400 text-[10px]">
            <p className="italic">{receiptFooter}</p>
            <p className="mt-0.5 font-mono">Software Powered by Sunlight POS</p>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 no-print pt-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-stone-900 text-white hover:bg-stone-800 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice / Receipt</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onNewSale) onNewSale();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-orange-500 text-white hover:bg-orange-600 shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start New Sale</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

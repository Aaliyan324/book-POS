'use client';

import React, { useRef } from 'react';
import { Modal } from '@/components/ui/modal';
import { Printer, Download, CheckCircle2, RotateCcw, Share2 } from 'lucide-react';
import { formatPKR, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
  companyInfo?: Record<string, string>;
  onNewSale?: () => void;
}

export function generateInvoicePDF(sale: any, companyInfo: Record<string, string> = {}) {
  const doc = new jsPDF();

  const companyName = companyInfo.company_name || 'Mudassar Publishers';
  const companyPhone = companyInfo.company_phone || '+92 300 1234567';
  const companyEmail = companyInfo.company_email || 'info@mudassarpublishers.com';
  const companyAddress = companyInfo.company_address || 'Main Commercial Market, Gulberg III, Lahore';
  const footerText = companyInfo.pos_receipt_footer || 'Thank you for shopping at Mudassar Publishers!';

  // Header Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text(companyName.toUpperCase(), 105, 16, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(companyAddress, 105, 22, { align: 'center' });
  doc.text(`Phone: ${companyPhone}  |  Email: ${companyEmail}`, 105, 27, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, 31, 196, 31);

  // Meta Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(`INVOICE: ${sale.invoiceNumber}`, 14, 39);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${formatDateTime(sale.createdAt)}`, 14, 45);
  doc.text(`Staff: ${sale.user?.name || 'Store Staff'}`, 14, 51);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(`BILLED TO:`, 120, 39);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(`${sale.customer?.name || 'Walk-in Customer'}`, 120, 45);
  if (sale.customer?.phone) doc.text(`Phone: ${sale.customer.phone}`, 120, 51);
  if (sale.customer?.address) doc.text(`Address: ${sale.customer.address}`, 120, 57);

  // Table of Items
  const tableData = sale.items?.map((item: any) => [
    item.book?.title || item.bookTitle || 'Book',
    item.book?.isbn || 'N/A',
    item.quantity.toString(),
    formatPKR(item.unitPrice),
    formatPKR(item.subtotal),
  ]) || [];

  autoTable(doc, {
    startY: sale.customer?.address ? 62 : 56,
    head: [['Item / Book Title', 'ISBN', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 35 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Breakdown Summary
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  let currentY = finalY;
  doc.text(`Subtotal:`, 130, currentY);
  doc.text(formatPKR(sale.subtotal), 196, currentY, { align: 'right' });

  if (sale.discount > 0) {
    currentY += 5;
    doc.text(`Discount:`, 130, currentY);
    doc.text(`-${formatPKR(sale.discount)}`, 196, currentY, { align: 'right' });
  }

  if (sale.tax > 0) {
    currentY += 5;
    doc.text(`Tax:`, 130, currentY);
    doc.text(`+${formatPKR(sale.tax)}`, 196, currentY, { align: 'right' });
  }

  currentY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(234, 88, 12);
  doc.text(`Grand Total:`, 130, currentY);
  doc.text(formatPKR(sale.grandTotal), 196, currentY, { align: 'right' });

  currentY += 6;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text(`Paid Amount:`, 130, currentY);
  doc.text(formatPKR(sale.paidAmount), 196, currentY, { align: 'right' });

  if (sale.remainingAmount > 0) {
    currentY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`Remaining Balance Due:`, 130, currentY);
    doc.text(formatPKR(sale.remainingAmount), 196, currentY, { align: 'right' });
  } else {
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Remaining Balance Due:`, 130, currentY);
    doc.text(formatPKR(0), 196, currentY, { align: 'right' });
  }

  if (sale.customer) {
    const previousBalance = Math.max(
      0,
      sale.payments?.[0]?.previousBalance ??
        ((sale.customer?.outstandingBalance ?? 0) - (sale.remainingAmount ?? 0))
    );
    const subtotalRemainingDue = (sale.remainingAmount ?? 0) + previousBalance;

    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`Previous Remaining Balance Due:`, 130, currentY);
    doc.text(formatPKR(previousBalance), 196, currentY, { align: 'right' });

    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`Subtotal Remaining Due:`, 130, currentY);
    doc.text(formatPKR(subtotalRemainingDue), 196, currentY, { align: 'right' });
  }

  currentY += 12;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(footerText, 105, currentY, { align: 'center' });

  doc.save(`Invoice_${sale.invoiceNumber}.pdf`);
}

export function shareInvoiceOnWhatsApp(sale: any, companyInfo: Record<string, string> = {}) {
  const companyName = companyInfo.company_name || 'Mudassar Publishers';
  const customerPhone = sale.customer?.phone || '';

  let formattedPhone = customerPhone.replace(/\D/g, '');
  if (formattedPhone.startsWith('03')) {
    formattedPhone = '92' + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith('3')) {
    formattedPhone = '92' + formattedPhone;
  }

  const itemsList = sale.items
    ?.map((i: any) => `• ${i.book?.title || i.bookTitle || 'Book'} (Qty: ${i.quantity}) - ${formatPKR(i.subtotal)}`)
    .join('\n');

  const previousBalance = sale.customer
    ? Math.max(
        0,
        sale.payments?.[0]?.previousBalance ??
          ((sale.customer?.outstandingBalance ?? 0) - (sale.remainingAmount ?? 0))
      )
    : 0;
  const subtotalRemainingDue = (sale.remainingAmount ?? 0) + previousBalance;

  const text = `📚 *${companyName.toUpperCase()} - OFFICIAL INVOICE* 📚
-------------------------------------------
*Invoice #:* ${sale.invoiceNumber}
*Date:* ${formatDateTime(sale.createdAt)}
*Customer:* ${sale.customer?.name || 'Walk-in Customer'}

*Items Purchased:*
${itemsList || 'N/A'}

-------------------------------------------
*Grand Total:* ${formatPKR(sale.grandTotal)}
*Amount Paid:* ${formatPKR(sale.paidAmount)}
*Payment Status:* ${sale.paymentStatus}
*Remaining Balance Due:* ${formatPKR(sale.remainingAmount)}
${sale.customer ? `*Previous Remaining Balance Due:* ${formatPKR(previousBalance)}\n*Subtotal Remaining Due:* ${formatPKR(subtotalRemainingDue)}` : ''}
-------------------------------------------
${companyInfo.pos_receipt_footer || 'Thank you for your business!'}`;

  const encodedText = encodeURIComponent(text);
  const waUrl = formattedPhone
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  window.open(waUrl, '_blank');
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

  const handleDownloadPDF = () => {
    generateInvoicePDF(sale, companyInfo);
  };

  const handleWhatsAppShare = () => {
    shareInvoiceOnWhatsApp(sale, companyInfo);
  };

  const companyName = companyInfo.company_name || 'Mudassar Publishers';
  const companyPhone = companyInfo.company_phone || '+92 300 1234567';
  const companyEmail = companyInfo.company_email || 'info@mudassarpublishers.com';
  const companyAddress = companyInfo.company_address || 'Main Commercial Market, Gulberg III, Lahore';
  const receiptFooter = companyInfo.pos_receipt_footer || 'Thank you for shopping at Mudassar Publishers!';

  const previousBalance = sale.customer
    ? Math.max(
        0,
        sale.payments?.[0]?.previousBalance ??
          ((sale.customer?.outstandingBalance ?? 0) - (sale.remainingAmount ?? 0))
      )
    : 0;
  const subtotalRemainingDue = (sale.remainingAmount ?? 0) + previousBalance;

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
                      <p className="font-semibold text-stone-900">{item.book?.title || item.bookTitle || 'Book'}</p>
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
              <div className="flex justify-between font-semibold text-stone-600">
                <span>Remaining Balance Due:</span>
                <span>{formatPKR(0)}</span>
              </div>
            )}
            {sale.paidAmount > sale.grandTotal && (
              <div className="flex justify-between font-bold text-blue-600">
                <span>Change Given:</span>
                <span>{formatPKR(sale.paidAmount - sale.grandTotal)}</span>
              </div>
            )}
            {sale.customer && (
              <>
                <div className="flex justify-between text-stone-600">
                  <span>Previous Remaining Balance Due:</span>
                  <span className="font-semibold">{formatPKR(previousBalance)}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-700 border-t border-stone-200/80 pt-1">
                  <span>Subtotal Remaining Due:</span>
                  <span>{formatPKR(subtotalRemainingDue)}</span>
                </div>
              </>
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

            {/* Payment Transactions & Dates Breakdown */}
            {sale.payments && sale.payments.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-stone-200/80 text-[10px]">
                <p className="font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Payment History & Payment Dates:
                </p>
                <div className="space-y-1 bg-stone-50 p-2 rounded-lg border border-stone-100">
                  {sale.payments.map((p: any, idx: number) => (
                    <div key={p.id || idx} className="flex items-center justify-between text-stone-600">
                      <span className="font-mono text-stone-500">
                        {formatDateTime(p.createdAt)} ({p.method})
                      </span>
                      <span className="font-bold text-emerald-700">
                        + {formatPKR(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Receipt Footer */}
          <div className="text-center pt-4 mt-4 border-t border-dashed border-stone-200 text-stone-400 text-[10px]">
            <p className="italic">{receiptFooter}</p>
            <p className="mt-0.5 font-mono">Software Powered by Mudassar Publishers POS</p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 no-print pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-stone-100 text-stone-800 hover:bg-stone-200 transition-colors border border-stone-200"
            >
              <Download className="w-4 h-4 text-stone-600" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              if (onNewSale) onNewSale();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-orange-500 text-white hover:bg-orange-600 shadow-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start New Sale</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

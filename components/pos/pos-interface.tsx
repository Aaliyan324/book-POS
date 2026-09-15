'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  searchBooksAction,
  searchCustomersAction,
  createCustomerInlineAction,
  completeSaleAction,
  POSCartItem,
} from '@/app/actions/pos';
import { formatPKR } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ReceiptModal } from '@/components/invoices/receipt-modal';

interface POSInterfaceProps {
  initialCategories: any[];
  companySettings?: Record<string, string>;
}

export function POSInterface({ initialCategories, companySettings }: POSInterfaceProps) {
  // Books & Catalog state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [books, setBooks] = useState<any[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);

  // Cart state
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  // Customer state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'OTHER'>('CASH');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Receipt modal state
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Load books on mount or search
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingBooks(true);
      searchBooksAction(searchQuery)
        .then((res) => {
          if (selectedCategory !== 'ALL') {
            setBooks(res.filter((b) => b.categoryId === selectedCategory));
          } else {
            setBooks(res);
          }
        })
        .finally(() => setIsLoadingBooks(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  // Load customers
  useEffect(() => {
    searchCustomersAction(customerSearch).then(setCustomers);
  }, [customerSearch]);

  // Cart helper functions
  const addToCart = (book: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.bookId === book.id);
      if (existing) {
        if (existing.quantity >= book.stockQuantity) {
          alert(`Cannot add more. Max stock available is ${book.stockQuantity}`);
          return prev;
        }
        return prev.map((item) =>
          item.bookId === book.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          bookId: book.id,
          title: book.title,
          isbn: book.isbn || undefined,
          unitPrice: book.sellingPrice - (book.discount || 0),
          quantity: 1,
          discount: 0,
        },
      ];
    });
  };

  const updateQuantity = (bookId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.bookId === bookId) {
            const book = books.find((b) => b.id === bookId);
            const maxStock = book ? book.stockQuantity : 999;
            const newQty = item.quantity + delta;
            if (newQty > maxStock) {
              alert(`Max available stock is ${maxStock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as POSCartItem[]
    );
  };

  const removeFromCart = (bookId: string) => {
    setCart((prev) => prev.filter((item) => item.bookId !== bookId));
  };

  const clearCart = () => {
    setCart([]);
    setGlobalDiscount(0);
    setTax(0);
    setPaidAmount('');
    setSelectedCustomer(null);
    setNotes('');
  };

  // Calculations
  const itemSubtotal = cart.reduce(
    (acc, item) => acc + (item.unitPrice * item.quantity - item.discount * item.quantity),
    0
  );
  const grandTotal = Math.max(0, itemSubtotal - (globalDiscount || 0) + (tax || 0));
  const numericPaid = parseFloat(paidAmount) || 0;
  const remaining = Math.max(0, grandTotal - numericPaid);
  const changeDue = numericPaid > grandTotal ? numericPaid - grandTotal : 0;

  let paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' = 'UNPAID';
  if (numericPaid >= grandTotal && grandTotal > 0) paymentStatus = 'PAID';
  else if (numericPaid > 0) paymentStatus = 'PARTIALLY_PAID';

  // Quick fill paid amount
  const handleFullPay = () => {
    setPaidAmount(grandTotal.toString());
  };

  // Submit Sale Handler
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setErrorMessage('Cart is empty. Select books to sell.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await completeSaleAction({
        customerId: selectedCustomer?.id,
        cartItems: cart,
        globalDiscount,
        tax,
        paidAmount: numericPaid,
        paymentMethod,
        notes,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to complete sale.');
        return;
      }

      // Fetch completed sale for printing receipt
      setCompletedSale({
        invoiceNumber: res.invoiceNumber,
        subtotal: itemSubtotal,
        discount: globalDiscount,
        tax,
        grandTotal,
        paidAmount: numericPaid,
        remainingAmount: remaining,
        paymentStatus,
        createdAt: new Date(),
        customer: selectedCustomer,
        items: cart.map((item) => ({
          book: { title: item.title, isbn: item.isbn },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.unitPrice * item.quantity,
        })),
      });

      setIsReceiptOpen(true);
      clearCart();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Inline Customer Creation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerData.name) return;
    try {
      const cust = await createCustomerInlineAction(newCustomerData);
      setSelectedCustomer(cust);
      setIsCustomerModalOpen(false);
      setNewCustomerData({ name: '', phone: '', email: '', address: '', notes: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start h-full">
      {/* LEFT / MAIN CATALOG PANEL */}
      <div className="flex-1 w-full flex flex-col gap-4">
        {/* Search & Category Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books by Title, ISBN, Barcode, Author, Grade..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-stone-400"
              autoFocus
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Categories
            </button>
            {initialCategories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div className="flex-1 min-h-[400px]">
          {isLoadingBooks ? (
            <div className="py-20 text-center text-stone-400 text-sm">Loading books...</div>
          ) : books.length === 0 ? (
            <div className="py-20 text-center bg-white border border-stone-200/80 rounded-2xl p-8">
              <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-stone-700">No books found</p>
              <p className="text-xs text-stone-400 mt-1">Try searching with a different title, ISBN, or barcode.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {books.map((book) => {
                const inCartItem = cart.find((item) => item.bookId === book.id);
                const isOutOfStock = book.stockQuantity <= 0;

                return (
                  <div
                    key={book.id}
                    className={`group bg-white p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                      inCartItem
                        ? 'border-orange-500 ring-1 ring-orange-500/30 shadow-md'
                        : 'border-stone-200/80 hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Cover / Stock Status */}
                      <div className="relative mb-3 aspect-4/3 bg-stone-100 rounded-xl overflow-hidden flex items-center justify-center">
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <BookOpen className="w-8 h-8 text-stone-300" />
                        )}
                        <span
                          className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isOutOfStock
                              ? 'bg-rose-500 text-white'
                              : book.stockQuantity <= book.minStockThreshold
                              ? 'bg-amber-500 text-white'
                              : 'bg-stone-900/70 text-white backdrop-blur-xs'
                          }`}
                        >
                          {isOutOfStock ? 'OUT OF STOCK' : `Stock: ${book.stockQuantity}`}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-stone-900 line-clamp-2 leading-snug">
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">{book.author}</p>
                      {book.isbn && (
                        <p className="text-[10px] text-stone-400 font-mono mt-0.5 truncate">
                          ISBN: {book.isbn}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-orange-600">
                          {formatPKR(book.sellingPrice - (book.discount || 0))}
                        </span>
                        {book.discount > 0 && (
                          <span className="text-[10px] text-stone-400 line-through ml-1">
                            {formatPKR(book.sellingPrice)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart(book)}
                        disabled={isOutOfStock}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                          isOutOfStock
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            : inCartItem
                            ? 'bg-orange-500 text-white shadow-xs hover:bg-orange-600'
                            : 'bg-orange-50 text-orange-700 hover:bg-orange-500 hover:text-white'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        {inCartItem && <span className="text-[11px]">({inCartItem.quantity})</span>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT / CART & CHECKOUT PANEL */}
      <div className="w-full lg:w-[420px] bg-white rounded-2xl border border-stone-200/80 shadow-md flex flex-col shrink-0">
        {/* Cart Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Cart Checkout</h3>
              <p className="text-[11px] text-stone-500">{cart.length} item(s) in cart</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="p-4 border-b border-stone-100 bg-stone-50/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-700">Customer Account</span>
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add New</span>
            </button>
          </div>

          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const cust = customers.find((c) => c.id === e.target.value);
              setSelectedCustomer(cust || null);
            }}
            className="w-full text-xs p-2.5 rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Walk-in Customer (General)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.customerId}) {c.outstandingBalance > 0 ? `• Due: ${formatPKR(c.outstandingBalance)}` : ''}
              </option>
            ))}
          </select>

          {selectedCustomer && selectedCustomer.outstandingBalance > 0 && (
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800">
              ⚠️ Outstanding Credit: <strong>{formatPKR(selectedCustomer.outstandingBalance)}</strong>
            </div>
          )}
        </div>

        {/* Cart Item List */}
        <div className="p-4 max-h-[280px] overflow-y-auto divide-y divide-stone-100 space-y-3">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              Your cart is empty. Click books on the left to add.
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.bookId} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-stone-900 truncate">{item.title}</h5>
                  <p className="text-[11px] text-orange-600 font-semibold mt-0.5">
                    {formatPKR(item.unitPrice)} / unit
                  </p>
                </div>

                {/* Quantity Controller */}
                <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
                  <button
                    onClick={() => updateQuantity(item.bookId, -1)}
                    className="p-1 rounded-lg hover:bg-white text-stone-600"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold px-1 min-w-[20px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.bookId, 1)}
                    className="p-1 rounded-lg hover:bg-white text-stone-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.bookId)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Payment Summary */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/50 space-y-3">
          {/* Discount & Tax Row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] text-stone-500 font-medium mb-1">
                Order Discount (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={globalDiscount || ''}
                onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full p-2 text-xs rounded-xl bg-white border border-stone-200"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-500 font-medium mb-1">
                Tax (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={tax || ''}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full p-2 text-xs rounded-xl bg-white border border-stone-200"
              />
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="pt-2 border-t border-stone-200/80 space-y-1 text-xs">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatPKR(itemSubtotal)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-stone-900 pt-1">
              <span>Grand Total:</span>
              <span className="text-orange-600 text-lg">{formatPKR(grandTotal)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'CASH', label: 'Cash' },
                { id: 'CARD', label: 'Card' },
                { id: 'JAZZCASH', label: 'JazzCash' },
                { id: 'EASYPAISA', label: 'Easypaisa' },
                { id: 'BANK_TRANSFER', label: 'Bank' },
                { id: 'OTHER', label: 'Other' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-colors ${
                    paymentMethod === m.id
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid Input & Status */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-stone-700">Amount Paid (PKR)</label>
              <button
                type="button"
                onClick={handleFullPay}
                className="text-[10px] font-bold text-orange-600 hover:underline"
              >
                Pay Full ({formatPKR(grandTotal)})
              </button>
            </div>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder={`Enter paid amount (e.g. ${grandTotal})`}
              className="w-full p-2.5 text-sm font-bold rounded-xl bg-white border border-stone-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />

            {/* Calculated Balances */}
            <div className="flex items-center justify-between text-xs pt-1">
              <Badge
                variant={
                  paymentStatus === 'PAID'
                    ? 'success'
                    : paymentStatus === 'PARTIALLY_PAID'
                    ? 'warning'
                    : 'danger'
                }
              >
                {paymentStatus === 'PAID'
                  ? 'FULL PAYMENT'
                  : paymentStatus === 'PARTIALLY_PAID'
                  ? 'PARTIAL PAYMENT'
                  : 'UNPAID'}
              </Badge>
              {remaining > 0 ? (
                <span className="font-bold text-rose-600 text-xs">
                  Remaining: {formatPKR(remaining)}
                </span>
              ) : (
                changeDue > 0 && (
                  <span className="font-bold text-blue-600 text-xs">
                    Change Due: {formatPKR(changeDue)}
                  </span>
                )
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Complete Sale Button */}
          <button
            onClick={handleCompleteSale}
            disabled={isSubmitting || cart.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm shadow-md hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Processing Sale...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Complete Sale ({formatPKR(grandTotal)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add New Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add New Customer"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Customer Name *</label>
            <input
              type="text"
              required
              value={newCustomerData.name}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
              placeholder="Full Name or School / College Title"
              className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                placeholder="+92 300 0000000"
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
              <input
                type="email"
                value={newCustomerData.email}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                placeholder="customer@email.com"
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Address</label>
            <input
              type="text"
              value={newCustomerData.address}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
              placeholder="City / Area / Street"
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
              className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Completed Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={completedSale}
        companyInfo={companySettings}
        onNewSale={clearCart}
      />
    </div>
  );
}

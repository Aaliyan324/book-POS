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
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Filter,
  X,
  Sparkles,
  Check,
  ChevronRight,
  ArrowRight,
  Info,
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
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK'>('ALL');
  const [books, setBooks] = useState<any[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);

  // Cart state
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  // Mobile/Tablet Cart Drawer State
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

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

  // Trigger temporary toast feedback
  const showToast = (text: string, type: 'success' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Load books on search or category change
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingBooks(true);
      searchBooksAction(searchQuery)
        .then((res) => {
          let filtered = res;
          if (selectedCategory !== 'ALL') {
            filtered = filtered.filter((b) => b.categoryId === selectedCategory);
          }
          if (stockFilter === 'IN_STOCK') {
            filtered = filtered.filter((b) => b.stockQuantity > 0);
          } else if (stockFilter === 'LOW_STOCK') {
            filtered = filtered.filter((b) => b.stockQuantity > 0 && b.stockQuantity <= b.minStockThreshold);
          }
          setBooks(filtered);
        })
        .finally(() => setIsLoadingBooks(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, stockFilter]);

  // Load customers on customer search
  useEffect(() => {
    searchCustomersAction(customerSearch).then(setCustomers);
  }, [customerSearch]);

  // Cart Helper: Add Book / Click Card
  const addToCart = (book: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (book.stockQuantity <= 0) {
      showToast(`"${book.title}" is out of stock!`, 'warning');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.bookId === book.id);
      if (existing) {
        if (existing.quantity >= book.stockQuantity) {
          showToast(`Max available stock for "${book.title}" is ${book.stockQuantity}`, 'warning');
          return prev;
        }
        showToast(`Increased quantity for "${book.title}" (${existing.quantity + 1})`, 'success');
        return prev.map((item) =>
          item.bookId === book.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      showToast(`Added "${book.title}" to cart`, 'success');
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

    // Trigger visual pulse on card
    setRecentlyAddedId(book.id);
    setTimeout(() => setRecentlyAddedId(null), 500);
  };

  // Cart Helper: Update Quantity (+ or -)
  const updateQuantity = (bookId: string, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.bookId === bookId) {
            const book = books.find((b) => b.id === bookId);
            const maxStock = book ? book.stockQuantity : 999;
            const newQty = item.quantity + delta;

            if (newQty > maxStock) {
              showToast(`Cannot exceed max available stock (${maxStock})`, 'warning');
              return item;
            }
            if (newQty <= 0) {
              return null;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as POSCartItem[]
    );
  };

  // Cart Helper: Remove Item
  const removeFromCart = (bookId: string) => {
    setCart((prev) => prev.filter((item) => item.bookId !== bookId));
  };

  // Cart Helper: Clear All
  const clearCart = () => {
    setCart([]);
    setGlobalDiscount(0);
    setTax(0);
    setPaidAmount('');
    setSelectedCustomer(null);
    setNotes('');
  };

  // Totals & Financial Calculations
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
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

      // Prepare receipt data
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
      setIsMobileCartOpen(false);
      clearCart();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline Customer Creation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerData.name) return;
    try {
      const cust = await createCustomerInlineAction(newCustomerData);
      setSelectedCustomer(cust);
      setIsCustomerModalOpen(false);
      setNewCustomerData({ name: '', phone: '', email: '', address: '', notes: '' });
      showToast(`Customer "${cust.name}" added`, 'success');
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  return (
    <div className="relative flex flex-col lg:flex-row gap-5 items-start w-full min-w-0 pb-20 lg:pb-0">
      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-md ${
              toastMessage.type === 'warning'
                ? 'bg-amber-500/95 text-white border-amber-400'
                : 'bg-stone-900/95 text-white border-stone-800'
            }`}
          >
            {toastMessage.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-100" />
            ) : (
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* LEFT / MAIN CATALOG PANEL */}
      <div className="flex-1 w-full min-w-0 flex flex-col gap-4">
        {/* Top Control Bar: Search + Category Filters + Cart Quick Button on Mobile */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Title, ISBN, Barcode, Author, Subject..."
                className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-stone-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile / Tablet Cart Launcher Button */}
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="lg:hidden shrink-0 px-3.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {totalItemCount > 0 && (
                <span className="bg-white text-orange-600 text-[11px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Category Filter Pills & Stock Status Toggles */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none min-w-0">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80'
                }`}
              >
                All Categories
              </button>
              {initialCategories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Quick Stock Filter Selector */}
            <div className="shrink-0 flex items-center bg-stone-100 p-1 rounded-xl text-[11px] font-semibold text-stone-600">
              <button
                onClick={() => setStockFilter('ALL')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  stockFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStockFilter('IN_STOCK')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  stockFilter === 'IN_STOCK' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                In Stock
              </button>
              <button
                onClick={() => setStockFilter('LOW_STOCK')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  stockFilter === 'LOW_STOCK' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                Low Stock
              </button>
            </div>
          </div>
        </div>

        {/* Books Catalog Grid */}
        <div className="min-h-[420px] w-full min-w-0">
          {isLoadingBooks ? (
            <div className="py-24 text-center text-stone-400 text-xs font-medium flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading catalog items...</span>
            </div>
          ) : books.length === 0 ? (
            <div className="py-20 text-center bg-white border border-stone-200/80 rounded-2xl p-8 max-w-md mx-auto my-6">
              <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-base font-bold text-stone-800">No books matched your criteria</p>
              <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                Try clearing filters or searching for a different title, ISBN, or barcode.
              </p>
              {(searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setStockFilter('ALL');
                  }}
                  className="mt-4 px-4 py-2 bg-orange-50 text-orange-600 text-xs font-bold rounded-xl hover:bg-orange-100 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
              {books.map((book) => {
                const inCartItem = cart.find((item) => item.bookId === book.id);
                const isOutOfStock = book.stockQuantity <= 0;
                const isRecentlyAdded = recentlyAddedId === book.id;

                return (
                  <div
                    key={book.id}
                    onClick={(e) => addToCart(book, e)}
                    className={`group relative bg-white p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                      isOutOfStock
                        ? 'opacity-60 bg-stone-50 border-stone-200/80 cursor-not-allowed'
                        : inCartItem
                        ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md bg-orange-50/10'
                        : 'border-stone-200/90 hover:border-orange-400 hover:shadow-md hover:-translate-y-0.5'
                    } ${isRecentlyAdded ? 'scale-[0.98] ring-4 ring-orange-500/40' : ''}`}
                  >
                    {/* Top Content: Image & Metadata */}
                    <div>
                      {/* Cover Image container */}
                      <div className="relative mb-3 aspect-4/3 bg-stone-100 rounded-xl overflow-hidden flex items-center justify-center border border-stone-100">
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-center">
                            <BookOpen className="w-7 h-7 text-stone-300 mb-1" />
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider line-clamp-1">
                              {book.category?.name || 'Book'}
                            </span>
                          </div>
                        )}

                        {/* Stock status badge */}
                        <span
                          className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow-xs ${
                            isOutOfStock
                              ? 'bg-rose-500 text-white'
                              : book.stockQuantity <= book.minStockThreshold
                              ? 'bg-amber-500 text-white'
                              : 'bg-stone-900/80 text-white backdrop-blur-xs'
                          }`}
                        >
                          {isOutOfStock ? 'OUT OF STOCK' : `Stock: ${book.stockQuantity}`}
                        </span>

                        {/* In Cart Indicator Badge */}
                        {inCartItem && (
                          <span className="absolute top-2 left-2 bg-orange-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 animate-in zoom-in-50 duration-150">
                            <Check className="w-3 h-3" />
                            <span>{inCartItem.quantity} in cart</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Author */}
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                        {book.title}
                      </h4>
                      {book.author && (
                        <p className="text-[11px] text-stone-500 truncate mt-0.5 font-medium">
                          {book.author}
                        </p>
                      )}
                      {book.isbn && (
                        <p className="text-[10px] text-stone-400 font-mono mt-0.5 truncate">
                          ISBN: {book.isbn}
                        </p>
                      )}
                    </div>

                    {/* Bottom Row: Price & Quantity Controls */}
                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-extrabold text-orange-600">
                          {formatPKR(book.sellingPrice - (book.discount || 0))}
                        </div>
                        {book.discount > 0 && (
                          <div className="text-[10px] text-stone-400 line-through">
                            {formatPKR(book.sellingPrice)}
                          </div>
                        )}
                      </div>

                      {/* Quantity Controller directly on book card */}
                      {inCartItem ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/80 shrink-0"
                        >
                          <button
                            onClick={(e) => updateQuantity(book.id, -1, e)}
                            className="p-1 rounded-lg bg-white text-stone-700 hover:bg-rose-50 hover:text-rose-600 shadow-2xs transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-extrabold px-1.5 text-stone-900 min-w-[18px] text-center">
                            {inCartItem.quantity}
                          </span>
                          <button
                            onClick={(e) => updateQuantity(book.id, 1, e)}
                            className="p-1 rounded-lg bg-white text-stone-700 hover:bg-orange-50 hover:text-orange-600 shadow-2xs transition-colors"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={isOutOfStock}
                          onClick={(e) => addToCart(book, e)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all ${
                            isOutOfStock
                              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                              : 'bg-orange-50 text-orange-700 group-hover:bg-orange-500 group-hover:text-white shadow-xs'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT DESKTOP CART PANEL (hidden on mobile/tablet, visible on lg screens) */}
      <div className="hidden lg:flex w-[380px] xl:w-[420px] bg-white rounded-2xl border border-stone-200/90 shadow-md flex-col shrink-0 sticky top-20 max-h-[calc(100vh-100px)] overflow-hidden">
        <CartContent
          cart={cart}
          totalItemCount={totalItemCount}
          itemSubtotal={itemSubtotal}
          globalDiscount={globalDiscount}
          setGlobalDiscount={setGlobalDiscount}
          tax={tax}
          setTax={setTax}
          grandTotal={grandTotal}
          paidAmount={paidAmount}
          setPaidAmount={setPaidAmount}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          customers={customers}
          onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          handleFullPay={handleFullPay}
          handleCompleteSale={handleCompleteSale}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          paymentStatus={paymentStatus}
          remaining={remaining}
          changeDue={changeDue}
        />
      </div>

      {/* MOBILE / TABLET STICKY BOTTOM CART BAR */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-stone-900 text-white p-3 sm:p-4 rounded-2xl shadow-2xl border border-stone-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 font-extrabold text-white text-sm shadow-sm">
                {totalItemCount}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-stone-400 font-medium truncate">Total Order Amount</p>
                <p className="text-base font-extrabold text-orange-400 truncate">
                  {formatPKR(grandTotal)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shrink-0 active:scale-95 transition-all"
            >
              <span>View Cart & Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE / TABLET CART DRAWER / BOTTOM SHEET */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsMobileCartOpen(false)}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
            {/* Mobile Drawer Top Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Your POS Cart</h3>
                  <p className="text-[11px] text-stone-500">{totalItemCount} item(s) selected</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-2 rounded-xl text-stone-500 hover:bg-stone-200/60"
                  aria-label="Close cart drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Drawer Content Body */}
            <div className="flex-1 overflow-y-auto">
              <CartContent
                cart={cart}
                totalItemCount={totalItemCount}
                itemSubtotal={itemSubtotal}
                globalDiscount={globalDiscount}
                setGlobalDiscount={setGlobalDiscount}
                tax={tax}
                setTax={setTax}
                grandTotal={grandTotal}
                paidAmount={paidAmount}
                setPaidAmount={setPaidAmount}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
                customers={customers}
                onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                clearCart={clearCart}
                handleFullPay={handleFullPay}
                handleCompleteSale={handleCompleteSale}
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
                paymentStatus={paymentStatus}
                remaining={remaining}
                changeDue={changeDue}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add New Customer Account"
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
              className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
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
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
              <input
                type="email"
                value={newCustomerData.email}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                placeholder="customer@email.com"
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
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
              className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-stone-200 font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xs"
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

{/* REUSABLE INNER CART & CHECKOUT COMPONENT */}
interface CartContentProps {
  cart: POSCartItem[];
  totalItemCount: number;
  itemSubtotal: number;
  globalDiscount: number;
  setGlobalDiscount: (val: number) => void;
  tax: number;
  setTax: (val: number) => void;
  grandTotal: number;
  paidAmount: string;
  setPaidAmount: (val: string) => void;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'OTHER';
  setPaymentMethod: (val: any) => void;
  selectedCustomer: any | null;
  setSelectedCustomer: (cust: any | null) => void;
  customers: any[];
  onOpenCustomerModal: () => void;
  updateQuantity: (bookId: string, delta: number) => void;
  removeFromCart: (bookId: string) => void;
  clearCart: () => void;
  handleFullPay: () => void;
  handleCompleteSale: () => void;
  isSubmitting: boolean;
  errorMessage: string;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  remaining: number;
  changeDue: number;
}

function CartContent({
  cart,
  totalItemCount,
  itemSubtotal,
  globalDiscount,
  setGlobalDiscount,
  tax,
  setTax,
  grandTotal,
  paidAmount,
  setPaidAmount,
  paymentMethod,
  setPaymentMethod,
  selectedCustomer,
  setSelectedCustomer,
  customers,
  onOpenCustomerModal,
  updateQuantity,
  removeFromCart,
  clearCart,
  handleFullPay,
  handleCompleteSale,
  isSubmitting,
  errorMessage,
  paymentStatus,
  remaining,
  changeDue,
}: CartContentProps) {
  return (
    <div className="flex flex-col h-full bg-white text-stone-900">
      {/* Desktop Cart Header (hidden inside mobile drawer since drawer has its own header) */}
      <div className="hidden lg:flex p-4 border-b border-stone-100 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Cart & Checkout</h3>
            <p className="text-[11px] text-stone-500">{totalItemCount} item(s) selected</p>
          </div>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline"
          >
            Clear Cart
          </button>
        )}
      </div>

      {/* Customer Selection Box */}
      <div className="p-3.5 sm:p-4 border-b border-stone-100 bg-stone-50/50 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-700 flex items-center gap-1">
            <span>Customer Account</span>
          </span>
          <button
            onClick={onOpenCustomerModal}
            className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 text-[11px]"
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
          className="w-full text-xs p-2.5 rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium"
        >
          <option value="">Walk-in Customer (General)</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.customerId}) {c.outstandingBalance > 0 ? `• Due: ${formatPKR(c.outstandingBalance)}` : ''}
            </option>
          ))}
        </select>

        {selectedCustomer && selectedCustomer.outstandingBalance > 0 && (
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              Outstanding Credit: <strong>{formatPKR(selectedCustomer.outstandingBalance)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 divide-y divide-stone-100 min-h-[160px]">
        {cart.length === 0 ? (
          <div className="py-14 text-center text-stone-400 text-xs flex flex-col items-center justify-center gap-2">
            <ShoppingBag className="w-10 h-10 text-stone-300" />
            <p className="font-bold text-stone-700">Your cart is empty</p>
            <p className="text-[11px] text-stone-400">Click any book card to add items to sale.</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.bookId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold text-stone-900 truncate leading-tight">
                  {item.title}
                </h5>
                <p className="text-[11px] text-orange-600 font-semibold mt-0.5">
                  {formatPKR(item.unitPrice)} × {item.quantity} ={' '}
                  <span className="font-bold">{formatPKR(item.unitPrice * item.quantity)}</span>
                </p>
              </div>

              {/* In-Cart Quantity Adjustment */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => updateQuantity(item.bookId, -1)}
                  className="p-1 rounded-lg bg-white text-stone-700 hover:bg-rose-50 hover:text-rose-600 shadow-2xs transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-extrabold px-1.5 min-w-[20px] text-center text-stone-900">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.bookId, 1)}
                  className="p-1 rounded-lg bg-white text-stone-700 hover:bg-orange-50 hover:text-orange-600 shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFromCart(item.bookId)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 shrink-0 transition-colors"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Payment Summary & Checkout Controls */}
      <div className="p-3.5 sm:p-4 border-t border-stone-200 bg-stone-50/60 space-y-3 shrink-0">
        {/* Discount & Tax Row */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[11px] text-stone-600 font-semibold mb-1">
              Order Discount (PKR)
            </label>
            <input
              type="number"
              min="0"
              value={globalDiscount || ''}
              onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full p-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold"
            />
          </div>
          <div>
            <label className="block text-[11px] text-stone-600 font-semibold mb-1">
              Tax (PKR)
            </label>
            <input
              type="number"
              min="0"
              value={tax || ''}
              onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full p-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold"
            />
          </div>
        </div>

        {/* Totals Breakdown */}
        <div className="pt-2 border-t border-stone-200/80 space-y-1 text-xs">
          <div className="flex justify-between text-stone-500 font-medium">
            <span>Items Subtotal:</span>
            <span className="font-semibold text-stone-800">{formatPKR(itemSubtotal)}</span>
          </div>
          {globalDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Discount Applied:</span>
              <span>- {formatPKR(globalDiscount)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between text-stone-600 font-medium">
              <span>Tax Added:</span>
              <span>+ {formatPKR(tax)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm sm:text-base font-extrabold text-stone-900 pt-1">
            <span>Grand Total:</span>
            <span className="text-orange-600 text-base sm:text-lg">{formatPKR(grandTotal)}</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
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
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
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
        <div className="space-y-2 pt-0.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-stone-700">Amount Paid (PKR)</label>
            <button
              type="button"
              onClick={handleFullPay}
              className="text-[11px] font-extrabold text-orange-600 hover:underline"
            >
              Pay Full ({formatPKR(grandTotal)})
            </button>
          </div>
          <input
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            placeholder={`e.g. ${grandTotal}`}
            className="w-full p-2.5 text-sm font-extrabold text-stone-900 rounded-xl bg-white border border-stone-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />

          {/* Payment Status Badges */}
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
              <span className="font-extrabold text-rose-600 text-xs">
                Remaining: {formatPKR(remaining)}
              </span>
            ) : (
              changeDue > 0 && (
                <span className="font-extrabold text-blue-600 text-xs">
                  Change Due: {formatPKR(changeDue)}
                </span>
              )
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Complete Sale Button */}
        <button
          onClick={handleCompleteSale}
          disabled={isSubmitting || cart.length === 0}
          className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-extrabold text-sm shadow-md hover:from-orange-600 hover:to-orange-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
  );
}

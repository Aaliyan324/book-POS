'use client';

import React, { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, BookOpen, AlertTriangle, ArrowUpDown, Upload, X, ImageIcon } from 'lucide-react';
import { formatPKR } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { createBookAction, updateBookAction, adjustStockAction, deleteBookAction, createCategoryAction } from '@/app/actions/books';

interface BookCatalogProps {
  initialBooks: any[];
  categories: any[];
  userRole: string;
}

export function BookCatalog({ initialBooks, categories, userRole }: BookCatalogProps) {
  const [books, setBooks] = useState(initialBooks);
  const [categoriesList, setCategoriesList] = useState(categories);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');

  // Custom Category State
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [customCategoryError, setCustomCategoryError] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Create / Edit Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any | null>(null);
  const [bookForm, setBookForm] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    categoryId: categories[0]?.id || '',
    subject: '',
    classGrade: '',
    description: '',
    coverImage: '',
    purchasePrice: 0,
    sellingPrice: 0,
    discount: 0,
    stockQuantity: 0,
    minStockThreshold: 5,
    barcode: '',
  });

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  // Stock Adjustment Modal State
  const [stockModalBook, setStockModalBook] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState<'PURCHASE' | 'DAMAGE' | 'ADJUSTMENT' | 'RESTOCK'>('RESTOCK');
  const [adjustReason, setAdjustReason] = useState('');

  // Filtering books
  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      (b.isbn || '').toLowerCase().includes(search.toLowerCase()) ||
      b.bookId.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || b.categoryId === categoryFilter;

    let matchesStock = true;
    if (stockFilter === 'low_stock') {
      matchesStock = b.stockQuantity > 0 && b.stockQuantity <= b.minStockThreshold;
    } else if (stockFilter === 'out_of_stock') {
      matchesStock = b.stockQuantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Save Book Handler
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title || !bookForm.author || !bookForm.publisher || !bookForm.categoryId) {
      alert('Please fill out all required fields.');
      return;
    }

    let finalCoverImage = bookForm.coverImage;

    // Upload image to Vercel Blob if a new file was picked
    if (imageFile) {
      setIsUploadingImage(true);
      setImageUploadError('');
      try {
        const formData = new FormData();
        formData.append('file', imageFile);
        const res = await fetch('/api/upload-book-image', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        finalCoverImage = data.url;
      } catch (err: any) {
        setImageUploadError(err.message || 'Image upload failed. Check your Vercel Blob token.');
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    try {
      const payload = { ...bookForm, coverImage: finalCoverImage };
      if (editingBook) {
        const res = await updateBookAction(editingBook.id, payload);
        if (!res.success) throw new Error(res.error);
        setBooks((prev) => prev.map((b) => (b.id === editingBook.id ? res.book : b)));
      } else {
        const res = await createBookAction(payload);
        if (!res.success) throw new Error(res.error);
        setBooks((prev) => [res.book, ...prev]);
      }
      setIsBookModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Error saving book');
    }
  };

  // Stock Adjustment Handler
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalBook || adjustQty <= 0) return;

    try {
      const res = await adjustStockAction({
        bookId: stockModalBook.id,
        quantity: adjustQty,
        type: adjustType,
        reason: adjustReason || 'Manual inventory update',
      });

      if (!res.success) throw new Error(res.error);

      setBooks((prev) =>
        prev.map((b) =>
          b.id === stockModalBook.id ? { ...b, stockQuantity: res.newStock } : b
        )
      );

      setStockModalBook(null);
      setAdjustQty(0);
      setAdjustReason('');
    } catch (err: any) {
      alert(err.message || 'Error adjusting stock');
    }
  };

  // Delete Book Handler
  const handleDeleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
      const res = await deleteBookAction(id);
      if (!res.success) throw new Error(res.error);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting book');
    }
  };

  // Save Custom Category Handler
  const handleSaveCustomCategory = async () => {
    if (!customCategoryInput.trim()) {
      setCustomCategoryError('Category name cannot be empty.');
      return;
    }
    setIsSavingCategory(true);
    setCustomCategoryError('');
    try {
      const res = await createCategoryAction(customCategoryInput);
      if (!res.success) {
        setCustomCategoryError(res.error || 'Failed to create category.');
        return;
      }
      const cat = res.category;
      if (!cat) {
        setCustomCategoryError('Failed to retrieve category record.');
        return;
      }
      if (!categoriesList.some((c) => c.id === cat.id)) {
        setCategoriesList((prev) => [...prev, cat]);
      }
      setBookForm((prev) => ({ ...prev, categoryId: cat.id }));
      setIsAddingCustomCategory(false);
      setCustomCategoryInput('');
    } catch (err: any) {
      setCustomCategoryError(err.message || 'Error creating category.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const resetForm = () => {
    setEditingBook(null);
    setIsAddingCustomCategory(false);
    setCustomCategoryInput('');
    setCustomCategoryError('');
    setImageFile(null);
    setImagePreview('');
    setImageUploadError('');
    setBookForm({
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      categoryId: categoriesList[0]?.id || '',
      subject: '',
      classGrade: '',
      description: '',
      coverImage: '',
      purchasePrice: 0,
      sellingPrice: 0,
      discount: 0,
      stockQuantity: 0,
      minStockThreshold: 5,
      barcode: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Book Catalog & Inventory</h2>
          <p className="text-xs text-stone-500">
            Manage book records, pricing, discounts, barcodes, and stock levels.
          </p>
        </div>

        {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
          <button
            onClick={() => {
              resetForm();
              setIsBookModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-xs shadow-md hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Book</span>
          </button>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Title, ISBN, Author, Book ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-2 rounded-xl bg-stone-50 border border-stone-200"
        >
          <option value="ALL">All Categories</option>
          {categoriesList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as any)}
          className="p-2 rounded-xl bg-stone-50 border border-stone-200"
        >
          <option value="all">All Stock Statuses</option>
          <option value="low_stock">Low Stock Only</option>
          <option value="out_of_stock">Out of Stock Only</option>
        </select>
      </div>

      {/* Book Catalog Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3.5 px-4">Book ID</th>
                <th className="py-3.5 px-4">Title & Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Cost Price</th>
                <th className="py-3.5 px-4 text-right">Selling Price</th>
                <th className="py-3.5 px-4 text-center">Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No books found.
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {book.bookId}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-stone-900">{book.title}</p>
                      <p className="text-[11px] text-stone-500">
                        {book.author} • {book.publisher}
                      </p>
                      {book.isbn && (
                        <p className="text-[10px] text-stone-400 font-mono">ISBN: {book.isbn}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      {book.category?.name || 'General'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-stone-500">
                      {formatPKR(book.purchasePrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-orange-600">
                      {formatPKR(book.sellingPrice - (book.discount || 0))}
                      {book.discount > 0 && (
                        <span className="block text-[10px] text-stone-400 line-through">
                          {formatPKR(book.sellingPrice)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setStockModalBook(book);
                          setAdjustQty(0);
                        }}
                        className="inline-flex items-center gap-1 font-bold text-stone-900 hover:text-orange-600 transition-colors"
                        title="Click to adjust stock"
                      >
                        <span>{book.stockQuantity}</span>
                        <ArrowUpDown className="w-3 h-3 text-stone-400" />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          book.stockQuantity === 0
                            ? 'danger'
                            : book.stockQuantity <= book.minStockThreshold
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {book.stockQuantity === 0
                          ? 'Out of Stock'
                          : book.stockQuantity <= book.minStockThreshold
                          ? 'Low Stock'
                          : 'In Stock'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                          <button
                            onClick={() => {
                              setEditingBook(book);
                              setImageFile(null);
                              setImagePreview(book.coverImage || '');
                              setImageUploadError('');
                              setBookForm({
                                isbn: book.isbn || '',
                                title: book.title,
                                author: book.author,
                                publisher: book.publisher,
                                categoryId: book.categoryId,
                                subject: book.subject || '',
                                classGrade: book.classGrade || '',
                                description: book.description || '',
                                coverImage: book.coverImage || '',
                                purchasePrice: book.purchasePrice,
                                sellingPrice: book.sellingPrice,
                                discount: book.discount || 0,
                                stockQuantity: book.stockQuantity,
                                minStockThreshold: book.minStockThreshold,
                                barcode: book.barcode || '',
                              });
                              setIsBookModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {userRole === 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteBook(book.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Book Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title={editingBook ? 'Edit Book Details' : 'Add New Book'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Book Title *</label>
              <input
                type="text"
                required
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">ISBN Number</label>
              <input
                type="text"
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                placeholder="e.g. 978-0131103627"
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Author *</label>
              <input
                type="text"
                required
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Publisher *</label>
              <input
                type="text"
                required
                value={bookForm.publisher}
                onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Category *</label>
              <select
                value={isAddingCustomCategory ? 'ADD_NEW' : bookForm.categoryId}
                onChange={(e) => {
                  if (e.target.value === 'ADD_NEW') {
                    setIsAddingCustomCategory(true);
                    setCustomCategoryInput('');
                    setCustomCategoryError('');
                  } else {
                    setIsAddingCustomCategory(false);
                    setBookForm({ ...bookForm, categoryId: e.target.value });
                  }
                }}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              >
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="ADD_NEW">+ Add Custom Category</option>
              </select>

              {isAddingCustomCategory && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customCategoryInput}
                      onChange={(e) => {
                        setCustomCategoryInput(e.target.value);
                        setCustomCategoryError('');
                      }}
                      placeholder="Category Name..."
                      className="flex-1 p-2 rounded-xl bg-white border border-orange-300 text-xs focus:ring-2 focus:ring-orange-500/20"
                    />
                    <button
                      type="button"
                      disabled={isSavingCategory}
                      onClick={handleSaveCustomCategory}
                      className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
                    >
                      {isSavingCategory ? '...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomCategory(false);
                        setCustomCategoryError('');
                      }}
                      className="px-2 py-2 text-stone-500 hover:bg-stone-100 rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                  {customCategoryError && (
                    <p className="text-[11px] text-rose-600 font-semibold">{customCategoryError}</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Subject</label>
              <input
                type="text"
                value={bookForm.subject}
                onChange={(e) => setBookForm({ ...bookForm, subject: e.target.value })}
                placeholder="e.g. Physics, Math"
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Class / Grade</label>
              <input
                type="text"
                value={bookForm.classGrade}
                onChange={(e) => setBookForm({ ...bookForm, classGrade: e.target.value })}
                placeholder="e.g. Class 9, BS CS"
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Cost Price (PKR) *</label>
              <input
                type="number"
                required
                min="0"
                value={bookForm.purchasePrice}
                onChange={(e) =>
                  setBookForm({ ...bookForm, purchasePrice: parseFloat(e.target.value) || 0 })
                }
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Selling Price (PKR) *</label>
              <input
                type="number"
                required
                min="0"
                value={bookForm.sellingPrice}
                onChange={(e) =>
                  setBookForm({ ...bookForm, sellingPrice: parseFloat(e.target.value) || 0 })
                }
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Item Discount (PKR)</label>
              <input
                type="number"
                min="0"
                value={bookForm.discount}
                onChange={(e) =>
                  setBookForm({ ...bookForm, discount: parseFloat(e.target.value) || 0 })
                }
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Initial Stock Qty</label>
              <input
                type="number"
                min="0"
                value={bookForm.stockQuantity}
                onChange={(e) =>
                  setBookForm({ ...bookForm, stockQuantity: parseInt(e.target.value) || 0 })
                }
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Min Low-Stock Threshold</label>
              <input
                type="number"
                min="1"
                value={bookForm.minStockThreshold}
                onChange={(e) =>
                  setBookForm({ ...bookForm, minStockThreshold: parseInt(e.target.value) || 5 })
                }
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
          </div>

          {/* Cover Image Upload Section */}
          <div>
            <label className="block font-semibold text-stone-700 mb-2">Book Cover Image</label>
            <div className="space-y-2">
              {/* Image Preview or Drop Zone */}
              {imagePreview || bookForm.coverImage ? (
                <div className="relative group w-full h-44 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 flex items-center justify-center">
                  <img
                    src={imagePreview || bookForm.coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-contain"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-stone-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label
                      htmlFor="cover-upload"
                      className="px-3 py-2 bg-white text-stone-900 font-semibold text-[11px] rounded-lg cursor-pointer hover:bg-stone-100 flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Change Image
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setBookForm({ ...bookForm, coverImage: '' });
                      }}
                      className="px-3 py-2 bg-rose-500 text-white font-semibold text-[11px] rounded-lg hover:bg-rose-600 flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                // Drop / Click Zone
                <label
                  htmlFor="cover-upload"
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-stone-300 hover:border-orange-400 bg-stone-50 hover:bg-orange-50/30 rounded-xl cursor-pointer transition-all group"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                      setImageUploadError('');
                    }
                  }}
                >
                  <ImageIcon className="w-8 h-8 text-stone-300 group-hover:text-orange-400 transition-colors mb-2" />
                  <p className="text-xs font-semibold text-stone-500 group-hover:text-orange-600 transition-colors">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">PNG, JPG, WEBP — max 5 MB</p>
                </label>
              )}

              {/* Hidden file input */}
              <input
                id="cover-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                    setImageUploadError('');
                  }
                  // Reset input so re-selecting same file also fires
                  e.target.value = '';
                }}
              />

              {/* Upload status messages */}
              {isUploadingImage && (
                <div className="flex items-center gap-2 text-[11px] text-orange-600 font-semibold">
                  <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  Uploading image to Vercel Blob...
                </div>
              )}
              {imageUploadError && (
                <p className="text-[11px] text-rose-600 font-semibold">{imageUploadError}</p>
              )}
              {imageFile && !isUploadingImage && !imageUploadError && (
                <p className="text-[11px] text-emerald-600 font-semibold">
                  ✓ {imageFile.name} — will be uploaded when you save
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-stone-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploadingImage}
              className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUploadingImage ? 'Uploading...' : editingBook ? 'Update Book' : 'Create Book'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={!!stockModalBook}
        onClose={() => setStockModalBook(null)}
        title="Adjust Inventory Stock"
        description={stockModalBook?.title}
        maxWidth="md"
      >
        {stockModalBook && (
          <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex justify-between">
              <span className="text-stone-600">Current Available Stock:</span>
              <span className="font-bold text-stone-900">{stockModalBook.stockQuantity} units</span>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Movement Type</label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              >
                <option value="RESTOCK">RESTOCK (Add Received Stock)</option>
                <option value="PURCHASE">PURCHASE (New Purchase Order)</option>
                <option value="DAMAGE">DAMAGE (Remove Damaged Units)</option>
                <option value="ADJUSTMENT">ADJUSTMENT (Audit Correction)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Quantity</label>
              <input
                type="number"
                required
                min="1"
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Reason / Reference</label>
              <input
                type="text"
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Received vendor shipment invoice #881"
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStockModalBook(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600"
              >
                Save Stock Adjustment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

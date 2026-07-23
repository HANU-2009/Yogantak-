import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Sparkles, TrendingUp, Package, Users, Bell, CheckCircle,
  RefreshCw, Plus, Trash2, Edit3, Upload, X, Save, BarChart2,
  ShoppingCart, Tag, AlertTriangle, IndianRupee, ChevronDown, ChevronUp
} from 'lucide-react';

const API = '';

interface AdminDashboardProps {
  token: string | null;
  onClose: () => void;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  image: string;
  rating?: number;
  reviewsCount?: number;
  createdAt?: string;
}

interface DashboardStats {
  totalRevenue: number;
  ordersCount: number;
  customersCount: number;
  lowStockAlerts: number;
}

interface Order {
  id: string;
  email: string;
  status: string;
  total: number;
  created_at: string;
  items: any[];
}

// ──────────────────────────────────────────────
// Sub-component: Add / Edit Product Modal
// ──────────────────────────────────────────────
function ProductModal({
  product,
  token,
  onClose,
  onSaved
}: {
  product: Product | null;
  token: string;
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [stock, setStock] = useState(product?.stock?.toString() || '0');
  const [category, setCategory] = useState(product?.category || 'phone-case');
  const [imageData, setImageData] = useState(product?.image || '');
  const [imagePreview, setImagePreview] = useState(product?.image || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageData(result);
      setImagePreview(result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Product name is required'); return; }
    if (!price || isNaN(Number(price)) || Number(price) < 0) { setError('Valid price is required'); return; }

    setSaving(true);
    setError('');
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock) || 0,
        category,
        image_data: imageData
      };

      const isEdit = !!product;
      const url = isEdit ? `${API}/api/admin/products/${product.id}` : `${API}/api/admin/products`;
      const method = isEdit ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Save failed');
      onSaved(data.product);
    } catch (e: any) {
      setError(e.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#fdfdfd]/80 backdrop-blur-3xl border border-neutral-200/60 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-extrabold text-neutral-900 flex items-center gap-2">
            {product ? <Edit3 className="w-5 h-5 text-[#cfff71]" /> : <Plus className="w-5 h-5 text-[#cfff71]" />}
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="p-6 space-y-5 font-sans">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">Product Photo</label>
            <div
              className="relative border-2 border-dashed border-neutral-200 rounded-2xl p-4 text-center cursor-pointer hover:border-neutral-400 bg-neutral-50 transition-colors"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-48 object-contain rounded-xl mx-auto shadow-sm bg-white"
                  />
                  <button
                    className="absolute top-2 right-2 w-7 h-7 bg-white hover:bg-red-50 rounded-full flex items-center justify-center transition-colors shadow-md border border-neutral-200 text-red-500"
                    onClick={e => { e.stopPropagation(); setImageData(''); setImagePreview(''); }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="py-6">
                  <Upload className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm font-semibold">Drag & drop or click to upload product image</p>
                  <p className="text-neutral-400 text-xs mt-1 font-mono">JPG, PNG, WebP — max 10MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-1.5">Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Premium Leather Phone Case"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors font-semibold"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe this product..."
              rows={3}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors resize-none font-medium text-sm"
            />
          </div>

          {/* Price + Stock + Category row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">Price (₹) *</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="999"
                  min="0"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">Stock Qty</label>
              <input
                type="number"
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors font-semibold cursor-pointer"
              >
                <option value="phone-case">Phone Case</option>
                <option value="accessories">Accessories</option>
                <option value="custom">Custom</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-red-600 text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-[#cfff71]/80 backdrop-blur-sm hover:bg-[#cfff71] disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
          >
            {saving ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> {product ? 'Save Changes' : 'Add Product'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main AdminDashboard Component
// ──────────────────────────────────────────────
export default function AdminDashboard({ token, onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'coupons'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState<Product | null | 'new'>('new' as any);
  const [showModal, setShowModal] = useState(false);
  const [restockMap, setRestockMap] = useState<Record<string, string>>({});
  const [restockLoading, setRestockLoading] = useState<Record<string, boolean>>({});
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState('');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percent', discount_value: '', min_purchase: '' });
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // ── Data Fetching ──
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dashRes, prodRes, ordersRes, couponRes] = await Promise.all([
        fetch(`${API}/api/admin/dashboard`, { headers: authHeader }),
        fetch(`${API}/api/admin/products`, { headers: authHeader }),
        fetch(`${API}/api/admin/orders`, { headers: authHeader }),
        fetch(`${API}/api/admin/coupons`, { headers: authHeader })
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        setStats(d.stats);
        setSalesHistory(d.salesHistory || []);
      }
      if (prodRes.ok) {
        setProducts(await prodRes.json());
      } else {
        const fallbackRes = await fetch('/api/products');
        if (fallbackRes.ok) setProducts(await fallbackRes.json());
      }
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (couponRes.ok) setCoupons(await couponRes.json());
    } catch (e) {
      console.error(e);
      try {
        const fallbackRes = await fetch('/api/products');
        if (fallbackRes.ok) setProducts(await fallbackRes.json());
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Restock ──
  const handleRestock = async (productId: string) => {
    const newStock = Number(restockMap[productId]);
    if (isNaN(newStock) || newStock < 0) {
      showToast('Enter a valid stock number');
      return;
    }
    setRestockLoading(p => ({ ...p, [productId]: true }));
    try {
      const resp = await fetch(`${API}/api/admin/products/${productId}/stock`, {
        method: 'PUT',
        headers: authHeader,
        body: JSON.stringify({ stock: newStock })
      });
      if (!resp.ok) throw new Error((await resp.json()).error);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
      setRestockMap(prev => ({ ...prev, [productId]: '' }));
      showToast('✅ Stock updated successfully');
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setRestockLoading(p => ({ ...p, [productId]: false }));
    }
  };

  // ── Delete Product ──
  const handleDelete = async (productId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    setDeleteLoading(p => ({ ...p, [productId]: true }));
    try {
      const resp = await fetch(`${API}/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: authHeader
      });
      if (!resp.ok) throw new Error((await resp.json()).error);
      setProducts(prev => prev.filter(p => p.id !== productId));
      showToast('🗑️ Product deleted');
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setDeleteLoading(p => ({ ...p, [productId]: false }));
    }
  };

  // ── Order Status Update ──
  const handleOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch(`${API}/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: authHeader,
        body: JSON.stringify({ status })
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      showToast('✅ Order status updated');
    } catch (e) {
      showToast('❌ Failed to update order status');
    }
  };

  // ── Coupon Create ──
  const handleCreateCoupon = async () => {
    if (!couponForm.code || !couponForm.discount_value) {
      showToast('Code and discount value required');
      return;
    }
    try {
      const resp = await fetch(`${API}/api/admin/coupons`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          code: couponForm.code.toUpperCase(),
          discount_type: couponForm.discount_type,
          discount_value: Number(couponForm.discount_value),
          min_purchase: Number(couponForm.min_purchase) || 0
        })
      });
      if (!resp.ok) throw new Error((await resp.json()).error);
      setCouponForm({ code: '', discount_type: 'percent', discount_value: '', min_purchase: '' });
      showToast('✅ Coupon created');
      fetchAll();
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    try {
      await fetch(`${API}/api/admin/coupons/${code}`, { method: 'DELETE', headers: authHeader });
      setCoupons(prev => prev.filter(c => c.code !== code));
      showToast('🗑️ Coupon deleted');
    } catch {
      showToast('❌ Failed to delete coupon');
    }
  };

  const statusColor = (s: string) => {
    if (s === 'processing') return 'text-amber-600 bg-amber-50 border-amber-200';
    if (s === 'shipped') return 'text-blue-600 bg-blue-50 border-blue-200';
    if (s === 'delivered') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (s === 'cancelled') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-neutral-500 bg-neutral-100 border-neutral-200';
  };

  const stockColor = (s: number) => {
    if (s === 0) return 'text-red-600';
    if (s <= 5) return 'text-amber-600';
    return 'text-emerald-600';
  };

  return (
    <div className="fixed inset-0 bg-[#fdfdfd]/70 backdrop-blur-3xl z-[9000] flex flex-col overflow-hidden font-sans">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-[10000] bg-white border border-neutral-200 text-neutral-900 px-5 py-3 rounded-xl shadow-xl text-sm font-bold animate-fade-in flex items-center gap-2">
          {toastMsg}
        </div>
      )}

      {/* Product Modal */}
      {showModal && token && (
        <ProductModal
          product={typeof modalProduct === 'object' && modalProduct !== null ? modalProduct as Product : null}
          token={token}
          onClose={() => setShowModal(false)}
          onSaved={(p) => {
            if (typeof modalProduct === 'object' && modalProduct !== null) {
              setProducts(prev => prev.map(pr => pr.id === p.id ? p : pr));
            } else {
              setProducts(prev => [p, ...prev]);
            }
            setShowModal(false);
            showToast(typeof modalProduct === 'object' && modalProduct !== null ? '✅ Product updated' : '✅ Product added to catalog');
          }}
        />
      )}

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10 relative shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#cfff71] border border-[#bceb5e] flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 text-neutral-900" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Yogantak Control Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors shadow-sm cursor-pointer border border-neutral-200">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex-shrink-0 flex bg-neutral-50 border-b border-neutral-200 px-6 overflow-x-auto">
        {[
          { id: 'overview', icon: BarChart2, label: 'Overview' },
          { id: 'products', icon: Package, label: 'Products & Inventory' },
          { id: 'orders', icon: ShoppingCart, label: 'Orders' },
          { id: 'coupons', icon: Tag, label: 'Coupons' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#fdfdfd]">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp },
                { label: 'Total Orders', value: stats?.ordersCount || 0, icon: ShoppingCart },
                { label: 'Customers', value: stats?.customersCount || 0, icon: Users },
                { label: 'Low Stock Alerts', value: stats?.lowStockAlerts || 0, icon: Bell }
              ].map((card, i) => (
                <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-neutral-50 rounded-full translate-x-8 -translate-y-8 group-hover:bg-[#cfff71]/20 transition-colors pointer-events-none"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">{card.label}</p>
                    <div className="p-2 bg-neutral-100 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                      <card.icon className="w-4 h-4 text-neutral-900" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-neutral-900 font-mono relative z-10">{loading ? '—' : card.value}</p>
                </div>
              ))}
            </div>

            {/* Recent Sales */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-neutral-900 font-extrabold mb-5 flex items-center gap-2">
                <div className="p-1.5 bg-[#cfff71] rounded-lg">
                  <Sparkles className="w-4 h-4 text-neutral-900" />
                </div>
                Recent Sales (Last 7 Days)
              </h3>
              {salesHistory.length === 0 ? (
                <div className="text-center py-10 bg-neutral-50 rounded-xl border border-neutral-100">
                  <p className="text-neutral-400 text-sm font-semibold">No sales data yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {salesHistory.map((day: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-colors">
                      <span className="text-neutral-600 font-mono font-bold text-xs">{day.date}</span>
                      <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider bg-white px-2 py-1 rounded-md border border-neutral-200">{day.count} orders</span>
                      <span className="text-neutral-900 font-extrabold font-mono text-sm">₹{Number(day.amount).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {activeTab === 'products' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Add Product Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-extrabold text-neutral-900">
                Product Catalog
                <span className="ml-3 text-xs text-neutral-500 font-bold uppercase tracking-wider bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200">{products.length} products</span>
              </h2>
              <button
                onClick={() => { setModalProduct(null); setShowModal(true); }}
                className="flex items-center gap-2 px-5 py-3 bg-[#cfff71]/80 backdrop-blur-sm hover:bg-[#cfff71] text-neutral-900 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16 text-neutral-400 font-bold flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-neutral-300" />
                Loading catalog...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white border-2 border-dashed border-neutral-200 rounded-[2rem] shadow-sm">
                <Package className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                <h3 className="text-neutral-900 text-lg font-extrabold mb-2">No Products Yet</h3>
                <p className="text-neutral-500 text-sm mb-6 font-medium">Click "Add New Product" to list your first product on the storefront</p>
                <button
                  onClick={() => { setModalProduct(null); setShowModal(true); }}
                  className="px-6 py-3 bg-[#cfff71]/80 backdrop-blur-sm hover:bg-[#cfff71] text-neutral-900 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Add First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start shadow-sm hover:shadow-md transition-shadow">
                    {/* Product Image */}
                    <div className="w-full sm:w-28 h-32 rounded-xl overflow-hidden bg-neutral-50 flex-shrink-0 border border-neutral-100">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-neutral-300" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0 w-full space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <h3 className="text-neutral-900 font-extrabold truncate text-base">{product.name}</h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md inline-block mt-1">{product.category}</span>
                        </div>
                        <span className="text-neutral-900 font-extrabold font-mono text-lg bg-[#cfff71]/30 px-2 py-1 rounded-lg border border-[#cfff71]">₹{Number(product.price).toLocaleString('en-IN')}</span>
                      </div>
                      
                      <p className="text-neutral-500 text-xs line-clamp-2 font-medium">{product.description || 'No description'}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <span className={`font-bold text-xs px-2 py-1 rounded-md border ${product.stock === 0 ? 'bg-red-50 text-red-600 border-red-200' : product.stock <= 5 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                          {product.stock === 0 ? '⚠ Out of Stock' : `${product.stock} in stock`}
                        </span>
                        {product.rating !== undefined && (
                          <span className="text-neutral-400 text-xs font-bold">★ {product.rating?.toFixed(1)} ({product.reviewsCount})</span>
                        )}
                      </div>

                      {/* Actions inline */}
                      <div className="pt-4 mt-2 border-t border-neutral-100 flex flex-col sm:flex-row gap-2 w-full">
                        {/* Restock row */}
                        <div className="flex gap-2 flex-1">
                          <input
                            type="number"
                            min="0"
                            placeholder="Qty..."
                            value={restockMap[product.id] || ''}
                            onChange={e => setRestockMap(prev => ({ ...prev, [product.id]: e.target.value }))}
                            className="w-16 bg-neutral-50 border border-neutral-200 rounded-lg px-2 text-neutral-900 text-xs font-bold placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                          />
                          <button
                            onClick={() => handleRestock(product.id)}
                            disabled={restockLoading[product.id] || !restockMap[product.id]}
                            className="px-3 py-2 bg-neutral-900/80 backdrop-blur-sm hover:bg-neutral-900 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                          >
                            {restockLoading[product.id] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Add
                          </button>
                        </div>

                        {/* Edit + Delete row */}
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => { setModalProduct(product); setShowModal(true); }}
                            className="px-3 py-2 bg-neutral-100/70 backdrop-blur-sm hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-200/50"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={deleteLoading[product.id]}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-600 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center cursor-pointer border border-red-100"
                          >
                            {deleteLoading[product.id] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            <h2 className="text-xl font-extrabold text-neutral-900 mb-4">
              All Orders
              <span className="ml-3 text-xs text-neutral-500 font-bold uppercase tracking-wider bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200">{orders.length} total</span>
            </h2>
            {orders.length === 0 ? (
              <div className="text-center py-16 bg-white border border-neutral-200 rounded-2xl shadow-sm text-neutral-400 font-bold">No orders yet</div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="text-neutral-900 font-mono font-extrabold text-sm bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">{order.id}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${statusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-neutral-500 text-xs font-mono">{order.email}</p>
                      </div>
                      <div className="flex items-center gap-4 md:w-auto w-full justify-between md:justify-end">
                        <span className="text-neutral-900 font-extrabold font-mono text-lg">₹{Number(order.total).toLocaleString('en-IN')}</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={order.status}
                            onChange={e => handleOrderStatus(order.id, e.target.value)}
                            className="bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-lg px-2.5 py-2 focus:outline-none focus:border-neutral-400 cursor-pointer shadow-sm"
                          >
                            {['processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="p-2 text-neutral-400 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                          >
                            {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    {expandedOrder === order.id && order.items?.length > 0 && (
                      <div className="border-t border-neutral-100 bg-neutral-50 px-5 pb-5 pt-4 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Order Items</h4>
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-white p-3 rounded-xl border border-neutral-200 shadow-sm">
                            <span className="font-bold text-neutral-700">{item.product_name || item.product?.name || 'Product'} <span className="text-neutral-400 ml-2 text-xs">×{item.quantity}</span></span>
                            <span className="font-mono font-extrabold text-neutral-900">₹{Number(item.price).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COUPONS TAB ── */}
        {activeTab === 'coupons' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Create Coupon */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-neutral-900 font-extrabold mb-5 flex items-center gap-2">
                <div className="p-1.5 bg-[#cfff71] rounded-lg">
                  <Tag className="w-4 h-4 text-neutral-900" />
                </div>
                Create New Coupon
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Coupon Code"
                  value={couponForm.code}
                  onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-900 font-mono font-bold text-sm placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 shadow-inner-sm uppercase"
                />
                <select
                  value={couponForm.discount_type}
                  onChange={e => setCouponForm(p => ({ ...p, discount_type: e.target.value }))}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-900 font-bold text-sm focus:outline-none focus:border-neutral-400 shadow-inner-sm cursor-pointer"
                >
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
                <input
                  type="number"
                  placeholder="Value"
                  value={couponForm.discount_value}
                  onChange={e => setCouponForm(p => ({ ...p, discount_value: e.target.value }))}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-900 font-bold text-sm placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 shadow-inner-sm"
                />
                <input
                  type="number"
                  placeholder="Min Purchase (₹)"
                  value={couponForm.min_purchase}
                  onChange={e => setCouponForm(p => ({ ...p, min_purchase: e.target.value }))}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-900 font-bold text-sm placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 shadow-inner-sm"
                />
              </div>
              <button
                onClick={handleCreateCoupon}
                className="px-6 py-3 bg-[#cfff71]/80 backdrop-blur-sm hover:bg-[#cfff71] text-neutral-900 text-xs uppercase tracking-wider font-extrabold rounded-xl transition-colors flex items-center gap-2 shadow-sm cursor-pointer active:scale-[0.98] w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" /> Create Coupon
              </button>
            </div>

            {/* Coupon List */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2 px-2">Active Coupons</h4>
              {coupons.length === 0 ? (
                <div className="text-center py-10 bg-white border border-neutral-200 rounded-2xl text-neutral-400 text-sm font-bold shadow-sm">No coupons created yet</div>
              ) : coupons.map(coupon => (
                <div key={coupon.code} className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-neutral-900 font-mono font-extrabold text-lg">{coupon.code}</span>
                    <span className="text-neutral-600 font-bold text-sm bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
                      {coupon.discount_type === 'percent' ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`}
                      {coupon.min_purchase > 0 && <span className="text-neutral-400 text-xs ml-1">(min ₹${coupon.min_purchase})</span>}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteCoupon(coupon.code)}
                    className="p-2 text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0f0f14] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {product ? <Edit3 className="w-5 h-5 text-violet-400" /> : <Plus className="w-5 h-5 text-emerald-400" />}
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Product Photo</label>
            <div
              className="relative border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-violet-500/60 transition-colors"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-48 object-contain rounded-lg mx-auto"
                  />
                  <button
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                    onClick={e => { e.stopPropagation(); setImageData(''); setImagePreview(''); }}
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="py-6">
                  <Upload className="w-10 h-10 text-white/30 mx-auto mb-3" />
                  <p className="text-white/50 text-sm">Drag & drop or click to upload product image</p>
                  <p className="text-white/30 text-xs mt-1">JPG, PNG, WebP — max 10MB</p>
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
            <label className="block text-sm font-medium text-white/60 mb-1.5">Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Premium Leather Phone Case"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe this product..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 transition-colors resize-none"
            />
          </div>

          {/* Price + Stock + Category row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Price (₹) *</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="999"
                  min="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Stock Qty</label>
              <input
                type="number"
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/60 transition-colors"
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
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
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
      if (prodRes.ok) setProducts(await prodRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (couponRes.ok) setCoupons(await couponRes.json());
    } catch (e) {
      console.error(e);
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
    if (s === 'processing') return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    if (s === 'shipped') return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    if (s === 'delivered') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
    if (s === 'cancelled') return 'text-red-400 bg-red-400/10 border-red-400/30';
    return 'text-white/60 bg-white/5 border-white/10';
  };

  const stockColor = (s: number) => {
    if (s === 0) return 'text-red-400';
    if (s <= 5) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[9000] flex flex-col overflow-hidden">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-[10000] bg-[#1a1a24] border border-white/20 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in">
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
      <div className="flex-shrink-0 bg-[#0a0a0f]/90 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
            <p className="text-white/40 text-xs">Yogantak Control Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex-shrink-0 flex border-b border-white/10 px-6">
        {[
          { id: 'overview', icon: BarChart2, label: 'Overview' },
          { id: 'products', icon: Package, label: 'Products & Inventory' },
          { id: 'orders', icon: ShoppingCart, label: 'Orders' },
          { id: 'coupons', icon: Tag, label: 'Coupons' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/30' },
                { label: 'Total Orders', value: stats?.ordersCount || 0, icon: ShoppingCart, color: 'from-blue-600/20 to-indigo-600/20 border-blue-500/30' },
                { label: 'Customers', value: stats?.customersCount || 0, icon: Users, color: 'from-violet-600/20 to-purple-600/20 border-violet-500/30' },
                { label: 'Low Stock Alerts', value: stats?.lowStockAlerts || 0, icon: Bell, color: 'from-amber-600/20 to-orange-600/20 border-amber-500/30' }
              ].map((card, i) => (
                <div key={i} className={`bg-gradient-to-br ${card.color} border rounded-xl p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white/50 text-xs font-medium">{card.label}</p>
                    <card.icon className="w-4 h-4 text-white/40" />
                  </div>
                  <p className="text-2xl font-bold text-white">{loading ? '—' : card.value}</p>
                </div>
              ))}
            </div>

            {/* Recent Sales */}
            <div className="bg-white/3 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Recent Sales (Last 7 Days)
              </h3>
              {salesHistory.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-4">No sales data yet</p>
              ) : (
                <div className="space-y-2">
                  {salesHistory.map((day: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-white/60 text-sm">{day.date}</span>
                      <span className="text-white/50 text-sm">{day.count} orders</span>
                      <span className="text-emerald-400 font-semibold text-sm">₹{Number(day.amount).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {activeTab === 'products' && (
          <div className="space-y-5">
            {/* Add Product Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Product Catalog
                <span className="ml-2 text-sm text-white/40 font-normal">({products.length} products)</span>
              </h2>
              <button
                onClick={() => { setModalProduct(null); setShowModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16 text-white/40">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-2xl">
                <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-white/50 text-lg font-medium mb-2">No Products Yet</h3>
                <p className="text-white/30 text-sm mb-6">Click "Add New Product" to list your first product on the storefront</p>
                <button
                  onClick={() => { setModalProduct(null); setShowModal(true); }}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors"
                >
                  Add First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white/3 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start">
                    {/* Product Image */}
                    <div className="w-full md:w-24 h-24 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold truncate">{product.name}</h3>
                        <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full w-fit">{product.category}</span>
                      </div>
                      <p className="text-white/40 text-sm line-clamp-1 mb-2">{product.description || 'No description'}</p>
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-emerald-400 font-bold text-lg">₹{Number(product.price).toLocaleString('en-IN')}</span>
                        <span className={`font-medium text-sm ${stockColor(product.stock)}`}>
                          {product.stock === 0 ? '⚠ Out of Stock' : `${product.stock} in stock`}
                        </span>
                        {product.rating !== undefined && (
                          <span className="text-white/30 text-sm">★ {product.rating?.toFixed(1)} ({product.reviewsCount})</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[200px]">
                      {/* Restock row */}
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Set stock to..."
                          value={restockMap[product.id] || ''}
                          onChange={e => setRestockMap(prev => ({ ...prev, [product.id]: e.target.value }))}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 w-0"
                        />
                        <button
                          onClick={() => handleRestock(product.id)}
                          disabled={restockLoading[product.id] || !restockMap[product.id]}
                          className="px-3 py-2 bg-emerald-600/80 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm rounded-lg transition-colors flex items-center gap-1 shrink-0"
                        >
                          {restockLoading[product.id] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Restock
                        </button>
                      </div>

                      {/* Edit + Delete row */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setModalProduct(product); setShowModal(true); }}
                          className="flex-1 px-3 py-2 bg-violet-600/50 hover:bg-violet-600/80 text-violet-300 text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={deleteLoading[product.id]}
                          className="px-3 py-2 bg-red-600/30 hover:bg-red-600/60 disabled:opacity-40 text-red-400 hover:text-red-300 text-sm rounded-lg transition-colors flex items-center justify-center"
                        >
                          {deleteLoading[product.id] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
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
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-2">
              All Orders
              <span className="ml-2 text-sm text-white/40 font-normal">({orders.length} total)</span>
            </h2>
            {orders.length === 0 ? (
              <div className="text-center py-16 text-white/30">No orders yet</div>
            ) : orders.map(order => (
              <div key={order.id} className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center gap-3 p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white font-mono font-semibold text-sm">{order.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-white/40 text-sm">{order.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-emerald-400 font-bold">₹{Number(order.total).toLocaleString('en-IN')}</span>
                    <select
                      value={order.status}
                      onChange={e => handleOrderStatus(order.id, e.target.value)}
                      className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none"
                    >
                      {['processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {expandedOrder === order.id && order.items?.length > 0 && (
                  <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm text-white/50">
                        <span>{item.product_name || item.product?.name || 'Product'} ×{item.quantity}</span>
                        <span>₹{Number(item.price).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── COUPONS TAB ── */}
        {activeTab === 'coupons' && (
          <div className="space-y-5">
            {/* Create Coupon */}
            <div className="bg-white/3 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-violet-400" /> Create New Coupon
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Coupon Code"
                  value={couponForm.code}
                  onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                />
                <select
                  value={couponForm.discount_type}
                  onChange={e => setCouponForm(p => ({ ...p, discount_type: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                >
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
                <input
                  type="number"
                  placeholder="Value"
                  value={couponForm.discount_value}
                  onChange={e => setCouponForm(p => ({ ...p, discount_value: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                />
                <input
                  type="number"
                  placeholder="Min Purchase (₹)"
                  value={couponForm.min_purchase}
                  onChange={e => setCouponForm(p => ({ ...p, min_purchase: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <button
                onClick={handleCreateCoupon}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Coupon
              </button>
            </div>

            {/* Coupon List */}
            <div className="space-y-2">
              {coupons.length === 0 ? (
                <div className="text-center py-10 text-white/30 text-sm">No coupons created yet</div>
              ) : coupons.map(coupon => (
                <div key={coupon.code} className="flex items-center justify-between bg-white/3 border border-white/10 rounded-xl px-4 py-3">
                  <div>
                    <span className="text-white font-mono font-bold">{coupon.code}</span>
                    <span className="ml-3 text-white/50 text-sm">
                      {coupon.discount_type === 'percent' ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`}
                      {coupon.min_purchase > 0 && ` (min ₹${coupon.min_purchase})`}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteCoupon(coupon.code)}
                    className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
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

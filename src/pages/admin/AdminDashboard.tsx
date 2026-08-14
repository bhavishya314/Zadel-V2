import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ShoppingBag,
  Package,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  PackageCheck,
  IndianRupee,
  ArrowRight,
  Sun,
  Moon,
  ExternalLink,
  Plus,
  Sparkles,
  MessageSquare,
  Mail,
  Settings,
  Loader2,
  Calendar,
  Eye,
  TrendingUp,
} from 'lucide-react';
import {
  subscribeToOrders,
  subscribeToProducts,
  subscribeToCategories,
} from '../../lib/firebase';
import type { FirestoreOrder, FirestoreProduct, FirestoreCategory, OrderStatus } from '../../lib/types';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [categories, setCategories] = useState<FirestoreCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscriptions to real-time Firestore collections
  useEffect(() => {
    let unsubOrders: (() => void) | undefined;
    let unsubProducts: (() => void) | undefined;
    let unsubCategories: (() => void) | undefined;

    try {
      unsubOrders = subscribeToOrders((orderList) => {
        setOrders(orderList);
        setLoading(false);
      });
    } catch (e) {
      console.error('Error subscribing to orders:', e);
    }

    try {
      unsubProducts = subscribeToProducts((productList) => {
        setProducts(productList);
        setLoading(false);
      });
    } catch (e) {
      console.error('Error subscribing to products:', e);
    }

    try {
      unsubCategories = subscribeToCategories((catList) => {
        setCategories(catList);
        setLoading(false);
      });
    } catch (e) {
      console.error('Error subscribing to categories:', e);
    }

    return () => {
      if (unsubOrders) unsubOrders();
      if (unsubProducts) unsubProducts();
      if (unsubCategories) unsubCategories();
    };
  }, []);

  // Compute Store Metrics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) =>
      !o.status ||
      String(o.status).toLowerCase() === 'pending' ||
      String(o.status).toLowerCase() === 'paid' ||
      String(o.status).toLowerCase() === 'processing'
  ).length;
  const approvedOrders = orders.filter(
    (o) => String(o.status).toLowerCase() === 'approved'
  ).length;
  const completedOrders = orders.filter(
    (o) =>
      String(o.status).toLowerCase() === 'completed' ||
      String(o.status).toLowerCase() === 'delivered'
  ).length;
  const notApprovedOrders = orders.filter(
    (o) =>
      String(o.status).toLowerCase() === 'not approved' ||
      String(o.status).toLowerCase() === 'not_approved' ||
      String(o.status).toLowerCase() === 'rejected' ||
      String(o.status).toLowerCase() === 'cancelled'
  ).length;

  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.published !== false).length;
  const totalCategories = categories.length;
  const grossRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Helper for Order Status Badge
  const getStatusBadge = (status: OrderStatus) => {
    const s = String(status || 'Pending').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          <span>Approved</span>
        </span>
      );
    }
    if (s === 'completed' || s === 'delivered') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
          <PackageCheck className="h-3 w-3" />
          <span>Completed</span>
        </span>
      );
    }
    if (s === 'not approved' || s === 'not_approved' || s === 'rejected' || s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[11px] font-semibold text-red-400">
          <XCircle className="h-3 w-3" />
          <span>Not Approved</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
        <Clock className="h-3 w-3" />
        <span>Pending</span>
      </span>
    );
  };

  // Helper for Payment Status Badge
  const getPaymentBadge = (paymentStatus?: string, razorpayId?: string) => {
    const isPaid = paymentStatus === 'paid' || Boolean(razorpayId);
    if (isPaid) {
      return (
        <span className="inline-flex items-center rounded bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400">
          Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-mono font-medium text-neutral-400">
        {paymentStatus || 'Pending'}
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 w-full max-w-full overflow-hidden">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-neutral-800 bg-zadel-elevated p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-zadel-gold">
              <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0" />
              <span className="truncate">Store Overview & Intelligence</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-normal text-foreground break-words">
              Welcome back, {user?.email?.split('@')[0] || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
              Real-time snapshot of customer purchases, product catalog health, and storefront operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs text-emerald-400 font-mono">
              <span className="h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Firestore Sync</span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-foreground hover:border-zadel-gold transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-zadel-gold shrink-0" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-zadel-gold shrink-0" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-foreground hover:border-zadel-gold transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-zadel-gold shrink-0" />
              <span>View Storefront</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 6 Store Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
        {/* 1. Total Orders */}
        <Link
          to="/admin/orders"
          className="group rounded-xl border border-neutral-800 bg-zadel-elevated p-3 sm:p-4 space-y-1.5 sm:space-y-2 hover:border-zadel-gold/60 transition-all cursor-pointer shadow-sm hover:shadow-md min-w-0"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-medium text-neutral-400 uppercase tracking-wider truncate">
              Total Orders
            </span>
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-neutral-900 text-neutral-300 group-hover:text-zadel-gold transition-colors shrink-0">
              <ShoppingBag className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground font-mono truncate">
            {loading ? '-' : totalOrders}
          </p>
          <div className="text-[9px] sm:text-[10px] text-neutral-400 flex items-center justify-between pt-0.5 min-w-0">
            <span className="truncate">All Channels</span>
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-zadel-gold shrink-0" />
          </div>
        </Link>

        {/* 2. Pending Orders */}
        <Link
          to="/admin/orders"
          className="group rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 sm:p-4 space-y-1.5 sm:space-y-2 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm min-w-0"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-medium text-amber-400 uppercase tracking-wider truncate">
              Pending
            </span>
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-400 font-mono truncate">
            {loading ? '-' : pendingOrders}
          </p>
          <div className="text-[9px] sm:text-[10px] text-amber-400/80 flex items-center justify-between pt-0.5 min-w-0">
            <span className="truncate">Requires Action</span>
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-500 shrink-0" />
          </div>
        </Link>

        {/* 3. Approved Orders */}
        <Link
          to="/admin/orders"
          className="group rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 sm:p-4 space-y-1.5 sm:space-y-2 hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm min-w-0"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-medium text-emerald-400 uppercase tracking-wider truncate">
              Approved
            </span>
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <CheckCircle2 className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono truncate">
            {loading ? '-' : approvedOrders}
          </p>
          <div className="text-[9px] sm:text-[10px] text-emerald-400/80 flex items-center justify-between pt-0.5 min-w-0">
            <span className="truncate">Ready to Ship</span>
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-500 shrink-0" />
          </div>
        </Link>

        {/* 4. Completed Orders */}
        <Link
          to="/admin/orders"
          className="group rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 sm:p-4 space-y-1.5 sm:space-y-2 hover:border-blue-500/40 transition-all cursor-pointer shadow-sm min-w-0"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-medium text-blue-400 uppercase tracking-wider truncate">
              Completed
            </span>
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
              <PackageCheck className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-400 font-mono truncate">
            {loading ? '-' : completedOrders}
          </p>
          <div className="text-[9px] sm:text-[10px] text-blue-400/80 flex items-center justify-between pt-0.5 min-w-0">
            <span className="truncate">Fulfilled</span>
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-blue-500 shrink-0" />
          </div>
        </Link>

        {/* 5. Total Products */}
        <Link
          to="/admin/products"
          className="group rounded-xl border border-neutral-800 bg-zadel-elevated p-3 sm:p-4 space-y-1.5 sm:space-y-2 hover:border-zadel-gold/60 transition-all cursor-pointer shadow-sm hover:shadow-md min-w-0"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-medium text-neutral-400 uppercase tracking-wider truncate">
              Products
            </span>
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-neutral-900 text-neutral-300 group-hover:text-zadel-gold transition-colors shrink-0">
              <Package className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground font-mono truncate">
            {loading ? '-' : totalProducts}
          </p>
          <div className="text-[9px] sm:text-[10px] text-neutral-400 flex items-center justify-between pt-0.5 min-w-0">
            <span className="truncate">{publishedProducts} Published</span>
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-zadel-gold shrink-0" />
          </div>
        </Link>

        {/* 6. Total Categories */}
        <Link
          to="/admin/categories"
          className="group rounded-xl border border-neutral-800 bg-zadel-elevated p-3 sm:p-4 space-y-1.5 sm:space-y-2 hover:border-zadel-gold/60 transition-all cursor-pointer shadow-sm hover:shadow-md min-w-0"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-medium text-neutral-400 uppercase tracking-wider truncate">
              Categories
            </span>
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-neutral-900 text-neutral-300 group-hover:text-zadel-gold transition-colors shrink-0">
              <Layers className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground font-mono truncate">
            {loading ? '-' : totalCategories}
          </p>
          <div className="text-[9px] sm:text-[10px] text-neutral-400 flex items-center justify-between pt-0.5 min-w-0">
            <span className="truncate">Taxonomy</span>
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-zadel-gold shrink-0" />
          </div>
        </Link>
      </div>

      {/* Revenue & Quick Highlights Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="md:col-span-2 rounded-xl sm:rounded-2xl border border-neutral-800 bg-zadel-elevated p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-zadel-gold/10 border border-zadel-gold/30 text-zadel-gold shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-neutral-400 font-medium block truncate">
                Total Store Revenue (Settled)
              </span>
              <p className="text-xl sm:text-2xl font-bold font-mono text-zadel-gold truncate">
                ₹{grossRevenue.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-800/80">
            <Link
              to="/admin/orders"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-zadel-gold px-3.5 sm:px-4 py-2 text-xs font-semibold text-stone-950 hover:opacity-95 transition-opacity whitespace-nowrap"
            >
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
              <span>Manage Orders</span>
            </Link>
            <Link
              to="/admin/products"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 sm:px-4 py-2 text-xs font-medium text-foreground hover:border-zadel-gold transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5 text-zadel-gold shrink-0" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>

        {/* Store Health Snapshot */}
        <div className="rounded-xl sm:rounded-2xl border border-neutral-800 bg-zadel-elevated p-4 sm:p-5 space-y-2">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-neutral-400 font-medium block">
            Catalog & Service Status
          </span>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Published Products</span>
              <span className="font-mono font-medium text-foreground">{publishedProducts}/{totalProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Disapproved / Cancelled</span>
              <span className="font-mono text-red-400">{notApprovedOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Payment Gateway</span>
              <span className="text-emerald-400 font-medium">Razorpay Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Recent Orders & Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left 2 Cols: Recent Orders Section */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ShoppingBag className="h-4 w-4 text-zadel-gold shrink-0" />
              <h2 className="font-display text-base sm:text-lg md:text-xl text-foreground truncate">
                Recent Orders
              </h2>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-zadel-gold hover:underline shrink-0"
            >
              <span>View all ({totalOrders})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-neutral-800 bg-zadel-elevated shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-zadel-gold" />
                <span className="text-xs text-neutral-400 font-mono">Loading orders...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center p-4 sm:p-6 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-neutral-400">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h3 className="font-display text-base text-foreground">No Orders Yet</h3>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Customer purchases placed on the storefront will automatically stream into this feed in real time.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Responsive Order Cards (< 768px) */}
                <div className="divide-y divide-neutral-800/60 block md:hidden">
                  {orders.slice(0, 5).map((order) => {
                    const customer = order.customer || {};
                    const totalItemsCount = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0;
                    return (
                      <div key={order.id} className="p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-xs font-bold text-foreground">
                              #{order.id.slice(0, 8)}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                  })
                                : 'Recent'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {getStatusBadge(order.status)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate text-xs">
                              {customer.fullName || 'Guest Customer'}
                            </p>
                            <p className="text-[10px] text-neutral-400 truncate">
                              {customer.city || customer.phone || 'Store purchase'} • {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                            </p>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <span className="font-mono font-bold text-foreground text-xs">
                              ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                            </span>
                            {getPaymentBadge(order.paymentStatus, order.razorpayPaymentId)}
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <Link
                            to="/admin/orders"
                            className="inline-flex items-center gap-1 text-[11px] text-zadel-gold hover:underline font-medium"
                          >
                            <span>Manage in Orders</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tablet & Desktop Table (>= 768px) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-neutral-800 bg-neutral-950/60 text-[10px] uppercase font-medium text-neutral-400">
                      <tr>
                        <th className="px-3.5 lg:px-4 py-3.5">Order ID</th>
                        <th className="px-3.5 lg:px-4 py-3.5">Customer</th>
                        <th className="px-3.5 lg:px-4 py-3.5">Items</th>
                        <th className="px-3.5 lg:px-4 py-3.5">Amount</th>
                        <th className="px-3.5 lg:px-4 py-3.5">Payment</th>
                        <th className="px-3.5 lg:px-4 py-3.5">Status</th>
                        <th className="px-3.5 lg:px-4 py-3.5">Date</th>
                        <th className="px-3.5 lg:px-4 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 font-sans">
                      {orders.slice(0, 6).map((order) => {
                        const customer = order.customer || {};
                        const totalItemsCount = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0;

                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-neutral-900/50 transition-colors"
                          >
                            {/* Order ID */}
                            <td className="px-3.5 lg:px-4 py-3.5 font-mono font-semibold text-foreground whitespace-nowrap">
                              #{order.id.slice(0, 8)}
                            </td>

                            {/* Customer */}
                            <td className="px-3.5 lg:px-4 py-3.5 max-w-[140px]">
                              <div className="space-y-0.5 min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {customer.fullName || 'Guest Customer'}
                                </p>
                                <p className="text-[10px] text-neutral-400 truncate">
                                  {customer.city || customer.phone || 'Store purchase'}
                                </p>
                              </div>
                            </td>

                            {/* Items */}
                            <td className="px-3.5 lg:px-4 py-3.5 whitespace-nowrap">
                              <span className="rounded bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-neutral-300 border border-neutral-800">
                                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                              </span>
                            </td>

                            {/* Amount */}
                            <td className="px-3.5 lg:px-4 py-3.5 font-mono font-bold text-foreground whitespace-nowrap">
                              ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                            </td>

                            {/* Payment */}
                            <td className="px-3.5 lg:px-4 py-3.5 whitespace-nowrap">
                              {getPaymentBadge(order.paymentStatus, order.razorpayPaymentId)}
                            </td>

                            {/* Status */}
                            <td className="px-3.5 lg:px-4 py-3.5 whitespace-nowrap">
                              {getStatusBadge(order.status)}
                            </td>

                            {/* Date */}
                            <td className="px-3.5 lg:px-4 py-3.5 text-[11px] text-neutral-400 whitespace-nowrap">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                  })
                                : 'Recent'}
                            </td>

                            {/* Action */}
                            <td className="px-3.5 lg:px-4 py-3.5 text-right whitespace-nowrap">
                              <Link
                                to="/admin/orders"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-zadel-gold hover:text-zadel-gold transition-colors"
                                title="View in Orders"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Products & Quick Store Actions */}
        <div className="space-y-5 sm:space-y-6">
          {/* Recent Products Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Package className="h-4 w-4 text-zadel-gold shrink-0" />
                <h2 className="font-display text-base sm:text-lg md:text-xl text-foreground truncate">
                  Recent Products
                </h2>
              </div>
              <Link
                to="/admin/products"
                className="inline-flex items-center gap-1 text-xs font-medium text-zadel-gold hover:underline shrink-0"
              >
                <span>Manage ({totalProducts})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-neutral-800 bg-zadel-elevated p-3 sm:p-4 space-y-3 shadow-sm">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                  <Loader2 className="h-5 w-5 animate-spin text-zadel-gold" />
                  <span className="text-xs text-neutral-400 font-mono">Loading products...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral-500">
                  No products in catalog yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {products.slice(0, 4).map((prod) => {
                    const img = prod.images && prod.images.length > 0 ? prod.images[0] : '';
                    return (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between gap-2.5 rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-2 sm:p-2.5 hover:border-zadel-gold/40 transition-colors min-w-0"
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                          {img ? (
                            <img
                              src={img}
                              alt={prod.name}
                              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg object-cover border border-neutral-800 shrink-0"
                            />
                          ) : (
                            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                              <Package className="h-4 sm:h-5 w-4 sm:w-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs text-foreground truncate">
                              {prod.name}
                            </p>
                            <span className="inline-block text-[10px] text-neutral-400 uppercase tracking-wider truncate max-w-full">
                              {prod.category}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-mono text-xs font-bold text-foreground">
                            ₹{prod.price.toLocaleString('en-IN')}
                          </p>
                          <span
                            className={`inline-block text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                              prod.published !== false
                                ? 'text-emerald-400'
                                : 'text-neutral-400'
                            }`}
                          >
                            {prod.published !== false ? 'Active' : 'Draft'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Link
                to="/admin/products"
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 py-2 text-xs font-medium text-foreground hover:border-zadel-gold transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-zadel-gold shrink-0" />
                <span>Add / Manage Products</span>
              </Link>
            </div>
          </div>

          {/* Store Quick Controls */}
          <div className="rounded-xl sm:rounded-2xl border border-neutral-800 bg-zadel-elevated p-3.5 sm:p-4 md:p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Store Control Center
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/admin/categories"
                className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-2 sm:p-2.5 text-foreground hover:border-zadel-gold transition-colors min-w-0"
              >
                <Layers className="h-4 w-4 text-zadel-gold shrink-0" />
                <span className="truncate text-xs">Categories</span>
              </Link>

              <Link
                to="/admin/hero"
                className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-2 sm:p-2.5 text-foreground hover:border-zadel-gold transition-colors min-w-0"
              >
                <Sparkles className="h-4 w-4 text-zadel-gold shrink-0" />
                <span className="truncate text-xs">Hero Banners</span>
              </Link>

              <Link
                to="/admin/reviews"
                className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-2 sm:p-2.5 text-foreground hover:border-zadel-gold transition-colors min-w-0"
              >
                <MessageSquare className="h-4 w-4 text-zadel-gold shrink-0" />
                <span className="truncate text-xs">Reviews</span>
              </Link>

              <Link
                to="/admin/contact"
                className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-2 sm:p-2.5 text-foreground hover:border-zadel-gold transition-colors min-w-0"
              >
                <Mail className="h-4 w-4 text-zadel-gold shrink-0" />
                <span className="truncate text-xs">Inquiries</span>
              </Link>
            </div>

            <Link
              to="/admin/settings"
              className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-2.5 text-xs text-foreground hover:border-zadel-gold transition-colors min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Settings className="h-4 w-4 text-zadel-gold shrink-0" />
                <span className="truncate">Store Configuration & Policies</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-neutral-400 shrink-0 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


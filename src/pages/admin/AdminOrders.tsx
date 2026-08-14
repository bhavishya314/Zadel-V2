import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Trash2,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Package,
  IndianRupee,
  X,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { subscribeToOrders, updateOrderStatus, deleteOrder } from '../../lib/firebase';
import type { FirestoreOrder, OrderStatus } from '../../lib/types';
import AdminConfirmModal from '../../components/AdminConfirmModal';
import AdminToast, { ToastMessage } from '../../components/AdminToast';

export default function AdminOrders() {
  const [ordersList, setOrdersList] = useState<FirestoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<FirestoreOrder | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Confirm delete modal state
  const [orderToDelete, setOrderToDelete] = useState<FirestoreOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Real-time Firestore subscription
  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (orders) => {
        setOrdersList(orders);
        setLoading(false);

        // Keep active detail modal in sync if open
        if (selectedOrder) {
          const fresh = orders.find((o) => o.id === selectedOrder.id);
          if (fresh) setSelectedOrder(fresh);
        }
      },
      (error) => {
        console.error('Error fetching orders:', error);
        setLoading(false);
        addToast('error', 'Failed to load real-time orders feed from Firestore.');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [selectedOrder?.id]);

  const handleCopyId = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    addToast('info', `Copied to clipboard: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: 'Pending' | 'Approved' | 'Not Approved' | 'Completed'
  ) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      addToast('success', `Order status updated to "${newStatus}".`);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus, orderStatus: newStatus } : null));
      }
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      addToast('error', err.message || 'Failed to update order status in Firestore.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setDeletingOrder(true);
    try {
      await deleteOrder(orderToDelete.id);
      if (selectedOrder?.id === orderToDelete.id) {
        setSelectedOrder(null);
      }
      addToast('success', `Order #${orderToDelete.id.slice(0, 8)} deleted successfully.`);
      setOrderToDelete(null);
    } catch (err: any) {
      console.error('Error deleting order:', err);
      addToast('error', 'Failed to delete order from Firestore.');
    } finally {
      setDeletingOrder(false);
    }
  };

  // Helper for status badge styling
  const getStatusBadge = (status: OrderStatus) => {
    const s = String(status || 'Pending').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          <span>Approved</span>
        </span>
      );
    }
    if (s === 'completed' || s === 'delivered') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 text-xs font-semibold text-blue-400">
          <Package className="h-3 w-3" />
          <span>Completed</span>
        </span>
      );
    }
    if (s === 'not approved' || s === 'not_approved' || s === 'rejected' || s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-400">
          <XCircle className="h-3 w-3" />
          <span>Not Approved</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs font-semibold text-amber-400">
        <Clock className="h-3 w-3" />
        <span>Pending</span>
      </span>
    );
  };

  // Helper for payment status badge
  const getPaymentBadge = (paymentStatus?: string, razorpayId?: string) => {
    const isPaid = paymentStatus === 'paid' || Boolean(razorpayId);
    if (isPaid) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 text-[11px] font-mono font-medium text-emerald-400">
          Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-neutral-800 px-2 py-0.5 text-[11px] font-mono font-medium text-neutral-400">
        {paymentStatus || 'Pending'}
      </span>
    );
  };

  // Metrics computation
  const totalOrders = ordersList.length;
  const pendingCount = ordersList.filter(
    (o) => !o.status || String(o.status).toLowerCase() === 'pending' || String(o.status).toLowerCase() === 'paid'
  ).length;
  const approvedCount = ordersList.filter((o) => String(o.status).toLowerCase() === 'approved').length;
  const notApprovedCount = ordersList.filter(
    (o) =>
      String(o.status).toLowerCase() === 'not approved' ||
      String(o.status).toLowerCase() === 'not_approved' ||
      String(o.status).toLowerCase() === 'rejected'
  ).length;
  const completedCount = ordersList.filter((o) => String(o.status).toLowerCase() === 'completed').length;
  const totalRevenue = ordersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Filtered list
  const filteredOrders = ordersList.filter((order) => {
    // Status Filter
    const s = String(order.status || 'Pending').toLowerCase();
    let matchesStatus = true;
    if (statusFilter === 'Pending') {
      matchesStatus = s === 'pending' || s === 'paid' || s === 'processing';
    } else if (statusFilter === 'Approved') {
      matchesStatus = s === 'approved';
    } else if (statusFilter === 'Not Approved') {
      matchesStatus = s === 'not approved' || s === 'not_approved' || s === 'rejected' || s === 'cancelled';
    } else if (statusFilter === 'Completed') {
      matchesStatus = s === 'completed' || s === 'delivered';
    }

    if (!matchesStatus) return false;

    // Search Filter
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const customer = order.customer || {};
    const nameMatch = customer.fullName?.toLowerCase().includes(q);
    const emailMatch = customer.email?.toLowerCase().includes(q);
    const phoneMatch = customer.phone?.toLowerCase().includes(q);
    const idMatch = order.id.toLowerCase().includes(q);
    const rOrderIdMatch = order.razorpayOrderId?.toLowerCase().includes(q);
    const rPayIdMatch = order.razorpayPaymentId?.toLowerCase().includes(q);
    const productMatch = order.items?.some((it) => it.productName?.toLowerCase().includes(q));

    return nameMatch || emailMatch || phoneMatch || idMatch || rOrderIdMatch || rPayIdMatch || productMatch;
  });

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Storefront Orders</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground">
            Customer Orders Management
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time Firestore stream of customer purchases, delivery addresses, and payment settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 px-3.5 py-2 text-xs text-emerald-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Firestore Sync</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-4 space-y-1.5">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
            Total Orders
          </span>
          <p className="text-2xl font-bold text-foreground font-mono">{totalOrders}</p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1.5">
          <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider block">
            Pending
          </span>
          <p className="text-2xl font-bold text-amber-400 font-mono">{pendingCount}</p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1.5">
          <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block">
            Approved
          </span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{approvedCount}</p>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-1.5">
          <span className="text-[11px] font-medium text-red-400 uppercase tracking-wider block">
            Not Approved
          </span>
          <p className="text-2xl font-bold text-red-400 font-mono">{notApprovedCount}</p>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-1.5">
          <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider block">
            Completed
          </span>
          <p className="text-2xl font-bold text-blue-400 font-mono">{completedCount}</p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-4 space-y-1.5">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
            Gross Volume
          </span>
          <p className="text-2xl font-bold text-zadel-gold font-mono">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-zadel-elevated p-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, email, phone, order ID, or product..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 pl-10 pr-4 py-2.5 text-xs text-foreground placeholder-neutral-500 focus:border-zadel-gold focus:outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {['All', 'Pending', 'Approved', 'Not Approved', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-zadel-gold text-stone-950 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-neutral-800 bg-zadel-elevated space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-zadel-gold" />
          <p className="text-xs font-mono text-neutral-400">Loading Firestore orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-neutral-800 bg-zadel-elevated text-center p-6 space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-neutral-500">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h3 className="font-display text-lg text-foreground">No Orders Found</h3>
          <p className="text-xs text-neutral-400 max-w-sm">
            {searchTerm || statusFilter !== 'All'
              ? 'No orders match your active search filter. Try clearing your search or switching filter tabs.'
              : 'There are no customer orders in the Firestore database yet. Once customers complete checkout, their purchases will appear here live.'}
          </p>
          {(searchTerm || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}
              className="mt-2 rounded-xl bg-neutral-800 px-4 py-2 text-xs font-medium text-foreground hover:bg-neutral-700 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-zadel-elevated shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 bg-neutral-950/60 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-5 py-4">Order ID & Date</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Products</th>
                  <th className="px-5 py-4">Total Amount</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-sans">
                {filteredOrders.map((order) => {
                  const customer = order.customer || {};
                  const totalItemsCount = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0;
                  const isUpdating = updatingOrderId === order.id;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-neutral-900/50 transition-colors cursor-pointer group"
                    >
                      {/* Order ID & Date */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-foreground">
                              #{order.id.slice(0, 8)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyId(order.id, e)}
                              className="text-neutral-500 hover:text-zadel-gold opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Copy Order ID"
                            >
                              {copiedId === order.id ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                            <Calendar className="h-3 w-3 text-neutral-500" />
                            <span>
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Recent'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground text-xs">
                            {customer.fullName || 'Guest Customer'}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
                            <Phone className="h-3 w-3 text-neutral-500" />
                            <span>{customer.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 truncate max-w-[180px]">
                            <Mail className="h-3 w-3 text-neutral-500 shrink-0" />
                            <span className="truncate">{customer.email || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Products Summary */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1.5 max-w-[220px]">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-zadel-gold border border-neutral-800">
                              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              ({order.items?.length || 0} unique)
                            </span>
                          </div>
                          <div className="space-y-1">
                            {order.items?.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs truncate">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.productName}
                                    className="h-6 w-6 rounded object-cover border border-neutral-800 shrink-0"
                                  />
                                )}
                                <span className="text-neutral-300 truncate">
                                  {item.productName}{' '}
                                  <span className="text-neutral-500">×{item.quantity}</span>
                                </span>
                              </div>
                            ))}
                            {(order.items?.length || 0) > 2 && (
                              <p className="text-[10px] text-neutral-500 italic">
                                +{(order.items?.length || 0) - 2} more item(s)...
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <p className="font-mono text-sm font-bold text-foreground">
                            ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                          </p>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                            INR Total
                          </span>
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          {getPaymentBadge(order.paymentStatus, order.razorpayPaymentId)}
                          {order.razorpayPaymentId && (
                            <p className="text-[10px] text-neutral-500 font-mono truncate max-w-[130px]">
                              {order.razorpayPaymentId}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-2">
                          <div>{getStatusBadge(order.status)}</div>

                          {/* Quick Status Selector */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1"
                          >
                            <select
                              value={
                                String(order.status).toLowerCase() === 'approved'
                                  ? 'Approved'
                                  : String(order.status).toLowerCase() === 'not approved' ||
                                    String(order.status).toLowerCase() === 'not_approved' ||
                                    String(order.status).toLowerCase() === 'rejected'
                                  ? 'Not Approved'
                                  : String(order.status).toLowerCase() === 'completed' ||
                                    String(order.status).toLowerCase() === 'delivered'
                                  ? 'Completed'
                                  : 'Pending'
                              }
                              disabled={isUpdating}
                              onChange={(e) =>
                                handleStatusChange(
                                  order.id,
                                  e.target.value as 'Pending' | 'Approved' | 'Not Approved' | 'Completed'
                                )
                              }
                              className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-200 focus:border-zadel-gold focus:outline-none transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="Not Approved">Not Approved</option>
                              <option value="Completed">Completed</option>
                            </select>
                            {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-zadel-gold shrink-0" />}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 align-top text-right">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-end gap-1.5"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-zadel-gold hover:text-zadel-gold transition-colors"
                            title="View Full Order Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(order)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-950/60 bg-red-950/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-zadel-elevated shadow-2xl space-y-6 p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zadel-gold uppercase tracking-wider">
                    Order Summary
                  </span>
                  <span className="font-mono text-xs text-neutral-500">#{selectedOrder.id}</span>
                  <button
                    onClick={() => handleCopyId(selectedOrder.id)}
                    className="text-neutral-500 hover:text-zadel-gold"
                    title="Copy ID"
                  >
                    {copiedId === selectedOrder.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <h2 className="font-display text-xl sm:text-2xl text-foreground">
                  Order Details
                </h2>
                <p className="text-xs text-neutral-400 flex items-center gap-1.5 pt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                  <span>
                    Placed on{' '}
                    {selectedOrder.createdAt
                      ? new Date(selectedOrder.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'full',
                          timeStyle: 'medium',
                        })
                      : 'Recently'}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 hover:bg-neutral-800 hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Switcher Banner */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-neutral-400">Current Status:</span>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-neutral-500 mr-1">Set to:</span>
                {(['Pending', 'Approved', 'Not Approved', 'Completed'] as const).map((st) => (
                  <button
                    key={st}
                    disabled={updatingOrderId === selectedOrder.id}
                    onClick={() => handleStatusChange(selectedOrder.id, st)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      String(selectedOrder.status).toLowerCase() === st.toLowerCase() ||
                      (st === 'Pending' && String(selectedOrder.status).toLowerCase() === 'paid')
                        ? 'bg-zadel-gold text-stone-950 font-bold shadow-md'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-foreground'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Two-Column Info: Customer & Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Info */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zadel-gold border-b border-neutral-800/80 pb-2">
                  <User className="h-3.5 w-3.5" />
                  <span>Customer Contact</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Full Name</span>
                    <p className="font-medium text-foreground">
                      {selectedOrder.customer?.fullName || 'Guest Customer'}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Phone Number</span>
                    <a
                      href={`tel:${selectedOrder.customer?.phone}`}
                      className="font-mono text-neutral-300 hover:text-zadel-gold flex items-center gap-1.5"
                    >
                      <Phone className="h-3 w-3 text-neutral-500" />
                      <span>{selectedOrder.customer?.phone || 'N/A'}</span>
                    </a>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Email Address</span>
                    <a
                      href={`mailto:${selectedOrder.customer?.email}`}
                      className="font-mono text-neutral-300 hover:text-zadel-gold flex items-center gap-1.5 truncate"
                    >
                      <Mail className="h-3 w-3 text-neutral-500 shrink-0" />
                      <span className="truncate">{selectedOrder.customer?.email || 'N/A'}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zadel-gold border-b border-neutral-800/80 pb-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Delivery Address</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Street Address</span>
                    <p className="text-neutral-200 leading-relaxed">
                      {selectedOrder.customer?.address || 'N/A'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-neutral-500 block text-[10px]">City</span>
                      <p className="font-medium text-neutral-200">
                        {selectedOrder.customer?.city || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px]">Postal Code / PIN</span>
                      <p className="font-mono font-medium text-neutral-200">
                        {selectedOrder.customer?.pincode || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Ordered Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  <Package className="h-4 w-4 text-zadel-gold" />
                  <span>
                    Items in Order (
                    {selectedOrder.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 0} Total Items
                    )
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 bg-neutral-900/80 text-[10px] uppercase font-medium text-neutral-400">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {selectedOrder.items?.map((item, idx) => {
                      const lineTotal = (item.price || 0) * (item.quantity || 1);
                      return (
                        <tr key={idx} className="hover:bg-neutral-900/40">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.productName}
                                  className="h-10 w-10 rounded-lg object-cover border border-neutral-800 shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                                  <Package className="h-5 w-5" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-foreground">{item.productName}</p>
                                <span className="font-mono text-[10px] text-neutral-500">
                                  ID: {item.productId || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-[11px] text-neutral-300">
                              {item.size || 'Standard'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-neutral-300">
                            ₹{(item.price || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-foreground">
                            ×{item.quantity || 1}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Payment Details */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zadel-gold border-b border-neutral-800 pb-2">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Payment Gateway Reference</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Payment Status:</span>
                    {getPaymentBadge(selectedOrder.paymentStatus, selectedOrder.razorpayPaymentId)}
                  </div>
                  {selectedOrder.razorpayOrderId && (
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-neutral-500">Razorpay Order:</span>
                      <span className="font-mono text-neutral-300 text-[11px] truncate">
                        {selectedOrder.razorpayOrderId}
                      </span>
                    </div>
                  )}
                  {selectedOrder.razorpayPaymentId && (
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-neutral-500">Razorpay Payment:</span>
                      <span className="font-mono text-emerald-400 text-[11px] truncate">
                        {selectedOrder.razorpayPaymentId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    Grand Total
                  </span>
                  <span className="font-mono text-lg font-bold text-zadel-gold">
                    ₹{(selectedOrder.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="space-y-1 text-neutral-400 text-[11px]">
                  <div className="flex justify-between">
                    <span>Total Products:</span>
                    <span className="font-mono text-neutral-200">
                      {selectedOrder.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Charges:</span>
                    <span className="font-mono text-emerald-400 font-medium">Free Shipping</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Currency:</span>
                    <span className="font-mono text-neutral-200">INR (₹)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-neutral-800 pt-5">
              <button
                type="button"
                onClick={() => {
                  const order = selectedOrder;
                  setSelectedOrder(null);
                  setOrderToDelete(order);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-900/50 hover:text-red-300 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Record</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-neutral-800 px-5 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-foreground transition-colors"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <AdminConfirmModal
        isOpen={Boolean(orderToDelete)}
        title="Delete Order Record"
        message={`Are you sure you want to permanently delete order #${orderToDelete?.id?.slice(0, 8)}? This will remove the customer order record from Firestore.`}
        confirmText="Delete Order"
        cancelText="Cancel"
        isDanger={true}
        loading={deletingOrder}
        onConfirm={handleConfirmDelete}
        onCancel={() => setOrderToDelete(null)}
      />
    </div>
  );
}

import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import type { FirestoreOrder, OrderStatus } from './types';

const ORDERS_COLLECTION = 'orders';

/**
 * Normalizes raw Firestore doc data into strongly typed FirestoreOrder
 */
export function normalizeOrder(id: string, data: DocumentData): FirestoreOrder {
  let createdAt = new Date().toISOString();
  if (data.createdAt?.toDate) {
    createdAt = data.createdAt.toDate().toISOString();
  } else if (typeof data.createdAt === 'string') {
    createdAt = data.createdAt;
  } else if (data.createdAtString) {
    createdAt = data.createdAtString;
  }

  let updatedAt = createdAt;
  if (data.updatedAt?.toDate) {
    updatedAt = data.updatedAt.toDate().toISOString();
  } else if (typeof data.updatedAt === 'string') {
    updatedAt = data.updatedAt;
  }

  // Handle items array
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems.map((item: any) => ({
    productId: item.productId || item.id || '',
    productName: item.productName || item.name || item.title || 'Product Item',
    price: typeof item.price === 'number' ? item.price : 0,
    quantity: typeof item.quantity === 'number' ? item.quantity : 1,
    size: item.size || 'Standard',
    image: item.image || item.imageUrl || (Array.isArray(item.images) ? item.images[0] : '') || '',
  }));

  // Total calculation fallback
  const totalAmount =
    typeof data.totalAmount === 'number'
      ? data.totalAmount
      : typeof data.total === 'number'
      ? data.total
      : items.reduce((sum: number, it: any) => sum + (it.price || 0) * (it.quantity || 1), 0);

  // Status mapping
  const rawStatus = data.orderStatus || data.status || 'Pending';
  let normalizedStatus: OrderStatus = rawStatus;
  const sLower = String(rawStatus).toLowerCase();
  if (sLower === 'approved') normalizedStatus = 'Approved';
  else if (sLower === 'not approved' || sLower === 'not_approved' || sLower === 'rejected' || sLower === 'cancelled') normalizedStatus = 'Not Approved';
  else if (sLower === 'completed' || sLower === 'delivered' || sLower === 'shipped') normalizedStatus = 'Completed';
  else if (sLower === 'pending' || sLower === 'paid' || sLower === 'processing') normalizedStatus = 'Pending';

  // Customer mapping
  const cust = data.customer || {};
  const customer = {
    fullName: cust.fullName || cust.name || data.customerName || data.name || 'Guest Customer',
    email: cust.email || data.customerEmail || data.email || 'N/A',
    phone: cust.phone || cust.contact || data.customerPhone || data.phone || 'N/A',
    address: cust.address || data.address || 'N/A',
    city: cust.city || data.city || 'N/A',
    pincode: cust.pincode || cust.postalCode || data.pincode || data.postalCode || 'N/A',
  };

  return {
    id,
    customer,
    items,
    totalAmount,
    razorpayOrderId: data.razorpayOrderId || data.orderId || '',
    razorpayPaymentId: data.razorpayPaymentId || data.paymentId || '',
    paymentStatus: data.paymentStatus || (data.razorpayPaymentId ? 'paid' : 'pending'),
    status: normalizedStatus,
    orderStatus: normalizedStatus,
    createdAt,
    updatedAt,
  };
}

/**
 * Real-time listener for the orders collection
 */
export function subscribeToOrders(
  onOrdersUpdated: (orders: FirestoreOrder[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const ordersCol = collection(db, ORDERS_COLLECTION);

    // Try real-time listener with fallback
    return onSnapshot(
      ordersCol,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const ordersList: FirestoreOrder[] = [];
        snapshot.forEach((docSnap) => {
          ordersList.push(normalizeOrder(docSnap.id, docSnap.data()));
        });

        // Sort by newest created date first
        ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        onOrdersUpdated(ordersList);
      },
      (error) => {
        console.error('Firestore Error listening to orders:', error);
        handleFirestoreError(error, OperationType.LIST, 'orders');
        if (onError) onError(error);
      }
    );
  } catch (error) {
    console.error('Error setting up orders listener:', error);
    if (onError) onError(error as Error);
    return () => {};
  }
}

/**
 * Updates the order status in Firestore (Pending, Approved, Not Approved, Completed)
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: 'Pending' | 'Approved' | 'Not Approved' | 'Completed'
): Promise<void> {
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
    const updatedAt = new Date().toISOString();

    await updateDoc(orderDocRef, {
      status: newStatus,
      orderStatus: newStatus,
      updatedAt,
    });
  } catch (error) {
    console.error(`Error updating order status for ${orderId}:`, error);
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    throw error;
  }
}

/**
 * Deletes an order record from Firestore
 */
export async function deleteOrder(orderId: string): Promise<void> {
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(orderDocRef);
  } catch (error) {
    console.error(`Error deleting order ${orderId}:`, error);
    handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
    throw error;
  }
}

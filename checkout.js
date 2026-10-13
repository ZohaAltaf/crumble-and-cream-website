// CHECKOUT.JS
// ============================================

import { auth, db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, query, where, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getCartItems, getCartTotal, clearCart } from './cart.js';
import { showToast } from './toast.js';
import { isFirebaseConfigured } from './products.js';
import { addDemoOrder, getCurrentDemoUid, getDemoOrders } from './demo-store.js';
import { getSiteSettings } from './baker-admin.js';

// First-order discount: how much a brand-new customer's very first order is
// reduced by. Only applies to logged-in customers (guests have no order
// history to check against), and only when they have zero past orders.
export const FIRST_ORDER_DISCOUNT_PERCENT = 10;

export const KARACHI_AREAS = [
  'Gulshan-e-Iqbal', 'North Nazimabad', 'Nazimabad', 'DHA', 'Clifton', 'PECHS',
  'Bahadurabad', 'Johar', 'Federal B Area', 'Malir', 'Korangi', 'Landhi',
  'Saddar', 'Gulistan-e-Johar', 'Gulshan-e-Maymar', 'Buffer Zone', 'North Karachi'
];

// These start as sensible defaults and are refreshed from Firestore's
// settings/general document (edited on the baker's Settings page) by
// loadCheckoutSettings() — call that once when the checkout page loads.
let DELIVERY_CHARGE = 150;
let MIN_ORDER_AMOUNT = 500;
let SAME_DAY_CUTOFF_HOUR = 16;

export async function loadCheckoutSettings() {
  if (!isFirebaseConfigured()) return; // demo mode keeps the defaults above
  try {
    const settings = await getSiteSettings();
    DELIVERY_CHARGE = settings.deliveryCharge;
    MIN_ORDER_AMOUNT = settings.minOrderAmount;
    SAME_DAY_CUTOFF_HOUR = settings.sameDayCutoffHour;
  } catch (err) {
    console.error('Could not load checkout settings, using defaults:', err);
  }
}

// --------------------------------------------
// CITY / AREA VALIDATION
// --------------------------------------------
export function isKarachiArea(input) {
  return KARACHI_AREAS.some((area) => area.toLowerCase() === input.trim().toLowerCase());
}

export function filterAreaSuggestions(term) {
  if (!term.trim()) return [];
  return KARACHI_AREAS.filter((a) => a.toLowerCase().includes(term.toLowerCase()));
}

// --------------------------------------------
// GEOLOCATION — explicit permission, never silent
// --------------------------------------------
export function requestLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      showToast('Location is not supported on this browser.', 'error');
      reject();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        showToast('Location permission denied. Please enter your address manually.', 'error');
        reject();
      }
    );
  });
}

// --------------------------------------------
// MINIMUM ORDER CHECK
// --------------------------------------------
export function meetsMinimumOrder() {
  return getCartTotal() >= MIN_ORDER_AMOUNT;
}

export function getMinimumOrderAmount() {
  return MIN_ORDER_AMOUNT;
}

export function getDeliveryCharge() {
  return DELIVERY_CHARGE;
}

// Returns the discount amount (in Rs.) for a first-time customer, or 0 if
// they're a guest or already have at least one past order. Call this with
// the current cart subtotal whenever you need to show/apply the discount.
export async function getFirstOrderDiscount(subtotal) {
  if (!subtotal || subtotal <= 0) return 0;

  if (!isFirebaseConfigured()) {
    const uid = getCurrentDemoUid();
    if (!uid) return 0; // guest — no identity to check order history against
    const hasPastOrder = getDemoOrders().some((o) => o.customerId === uid);
    return hasPastOrder ? 0 : Math.round(subtotal * FIRST_ORDER_DISCOUNT_PERCENT / 100);
  }

  const user = auth.currentUser;
  if (!user) return 0; // guest — no identity to check order history against

  const q = query(collection(db, 'orders'), where('customerId', '==', user.uid), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? Math.round(subtotal * FIRST_ORDER_DISCOUNT_PERCENT / 100) : 0;
}

export const BAKE_IT_FORWARD_AMOUNT = 100;

// --------------------------------------------
// ORDER CUTOFF CHECK — no same-day orders after 4 PM
// --------------------------------------------
export function isSameDayAllowed() {
  return new Date().getHours() < SAME_DAY_CUTOFF_HOUR;
}

// --------------------------------------------
// PLACE ORDER
// --------------------------------------------
export async function placeOrder(orderData) {
  const items = getCartItems();

  if (items.length === 0) {
    showToast('Your cart is empty.', 'error');
    return null;
  }

  if (!meetsMinimumOrder()) {
    showToast(`Minimum order amount is Rs. ${MIN_ORDER_AMOUNT}.`, 'error');
    return null;
  }

  if (!isKarachiArea(orderData.area)) {
    showToast('Sorry! Crumble & Cream currently delivers only within Karachi.', 'error');
    return null;
  }

  const subtotal = getCartTotal();
  const discount = await getFirstOrderDiscount(subtotal);
  const bakeItForwardAmount = orderData.bakeItForward ? BAKE_IT_FORWARD_AMOUNT : 0;
  const total = subtotal + DELIVERY_CHARGE - discount + bakeItForwardAmount;

  if (!isFirebaseConfigured()) {
    // Firebase isn't set up yet — save the order to the local demo store instead,
    // so checkout, order tracking, and both dashboards can all be tested together.
    const orderId = 'demo-' + Date.now();
    addDemoOrder({
      id: orderId,
      customerId: getCurrentDemoUid() || 'guest',
      customerName: orderData.name,
      phone: orderData.phone,
      email: orderData.email,
      products: items,
      subtotal,
      deliveryCharges: DELIVERY_CHARGE,
      discount,
      bakeItForward: !!orderData.bakeItForward,
      bakeItForwardAmount,
      total,
      address: orderData.address,
      area: orderData.area,
      city: 'Karachi',
      landmark: orderData.landmark || '',
      latitude: orderData.latitude || null,
      longitude: orderData.longitude || null,
      deliveryDate: orderData.deliveryDate,
      deliveryTime: orderData.deliveryTime,
      notes: orderData.notes || '',
      paymentMethod: orderData.paymentMethod,
      status: 'Pending',
      createdAt: { seconds: Math.floor(Date.now() / 1000) }
    });
    clearCart();
    // No showToast here — checkout.html redirects to index.html right after
    // this resolves, so a toast shown on this page would either never be
    // seen or flash before navigating away. main.js shows the real success
    // toast on index.html once the redirect lands (see checkOrderSuccess()).
    return orderId;
  }

  const user = auth.currentUser;

  const order = {
    customerId: user ? user.uid : 'guest',
    customerName: orderData.name,
    phone: orderData.phone,
    email: orderData.email,
    products: items,
    subtotal,
    deliveryCharges: DELIVERY_CHARGE,
    discount,
    bakeItForward: !!orderData.bakeItForward,
    bakeItForwardAmount,
    total,
    address: orderData.address,
    area: orderData.area,
    city: 'Karachi',
    landmark: orderData.landmark || '',
    latitude: orderData.latitude || null,
    longitude: orderData.longitude || null,
    deliveryDate: orderData.deliveryDate,
    deliveryTime: orderData.deliveryTime,
    notes: orderData.notes || '',
    paymentMethod: orderData.paymentMethod,
    status: 'Pending',
    createdAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, 'orders'), order);
    clearCart();
    // No showToast here either — see the comment in the demo-mode branch above.
    return docRef.id;
  } catch (err) {
    console.error('Order creation failed:', err);
    showToast('Something went wrong placing your order. Please try again.', 'error');
    return null;
  }
}
// DEMO-STORE.JS
// ============================================
// A tiny localStorage-backed fake backend, used ONLY while Firebase hasn't
// been configured yet (see isFirebaseConfigured() in products.js). This lets
// signup, login, checkout, and both dashboards be tested end-to-end before a
// real Firebase project exists.
//
// This is NOT secure (passwords sit in plain text in localStorage) and is
// never used once real Firebase credentials are added to firebase-config.js —
// every function that reads this file checks isFirebaseConfigured() first.
// ============================================

const USERS_KEY = 'cnc_demo_users';
const CURRENT_KEY = 'cnc_demo_current_uid';
const ORDERS_KEY = 'cnc_demo_orders';
const CHANGE_EVENT = 'cnc-demo-orders-changed';

// --------------------------------------------
// USERS
// --------------------------------------------
export function getDemoUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}

export function saveDemoUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getDemoUserByUid(uid) {
  return getDemoUsers().find((u) => u.uid === uid) || null;
}

export function updateDemoUser(uid, data) {
  const users = getDemoUsers();
  const user = users.find((u) => u.uid === uid);
  if (user) {
    Object.assign(user, data);
    saveDemoUsers(users);
  }
}

// --------------------------------------------
// SAVED ADDRESSES (per user)
// --------------------------------------------
export function getDemoAddresses(uid) {
  try { return JSON.parse(localStorage.getItem('cnc_demo_addresses_' + uid)) || []; } catch { return []; }
}

export function saveDemoAddresses(uid, list) {
  localStorage.setItem('cnc_demo_addresses_' + uid, JSON.stringify(list));
}

// Baker accounts are never self-service (see signup.html), so seed one demo
// baker account the first time anything touches the demo store.
export function ensureDemoBakerSeed() {
  const users = getDemoUsers();
  if (!users.some((u) => u.role === 'baker')) {
    users.push({
      uid: 'demo-baker-1',
      name: 'Head Baker',
      email: 'baker@demo.com',
      phone: '03000000000',
      password: 'baker123',
      role: 'baker',
      createdAt: Date.now()
    });
    saveDemoUsers(users);
  }
}

export function getCurrentDemoUid() {
  return localStorage.getItem(CURRENT_KEY);
}

export function setCurrentDemoUid(uid) {
  if (uid) localStorage.setItem(CURRENT_KEY, uid);
  else localStorage.removeItem(CURRENT_KEY);
}

// --------------------------------------------
// ORDERS
// --------------------------------------------
export function getDemoOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch { return []; }
}

function saveDemoOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function addDemoOrder(order) {
  const orders = getDemoOrders();
  orders.push(order);
  saveDemoOrders(orders);
  return order.id;
}

export function updateDemoOrderStatus(orderId, newStatus) {
  const orders = getDemoOrders();
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    order.status = newStatus;
    saveDemoOrders(orders);
  }
}

// Call to react whenever any demo order changes (new order placed, or a
// baker drags a card to a new column) — mirrors Firestore's onSnapshot.
export function onDemoOrdersChanged(callback) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}
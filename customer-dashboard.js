// CUSTOMER-DASHBOARD.JS
// ============================================

import { db } from './firebase-config.js';
import { collection, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { isFirebaseConfigured, escapeHTML } from './products.js';
import { getDemoOrders, onDemoOrdersChanged } from './demo-store.js';

export function loadCustomerOrders(uid, { onOrders }) {
  if (!isFirebaseConfigured()) {
    function pushDemoOrders() {
      const orders = getDemoOrders().filter((o) => o.customerId === uid);
      orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      onOrders(orders);
    }
    pushDemoOrders();
    return onDemoOrdersChanged(pushDemoOrders);
  }

  const q = query(collection(db, 'orders'), where('customerId', '==', uid));

  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    onOrders(orders);
  });
}

export function computeStats(orders) {
  return {
    total: orders.length,
    pending: orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status)).length,
    completed: orders.filter((o) => o.status === 'Delivered').length,
    spent: orders.filter((o) => o.status === 'Delivered').reduce((s, o) => s + (o.total || 0), 0)
  };
}

export function orderCardHTML(order) {
  return `
    <div class="order-card">
      <div class="order-card-top">
        <span style="font-size:0.85rem; color:var(--brown-mid);">#${order.id.slice(0, 8).toUpperCase()}</span>
        <span class="status-pill" data-status="${order.status}">${escapeHTML(order.status)}</span>
      </div>
      <p style="font-size:0.9rem; margin-bottom:0.5rem;">${order.products?.map(p => escapeHTML(p.name)).join(', ') || ''}</p>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; flex-wrap:wrap;">
        <span style="font-family:var(--font-display); color:var(--brown-deep);">Rs. ${order.total?.toLocaleString()}</span>
        <div style="display:flex; gap:0.6rem;">
          <button class="btn btn-outline order-again-btn" data-order-id="${order.id}" style="padding:0.5rem 1.1rem; font-size:0.82rem;">Order Again</button>
          <a href="order-tracking.html?id=${order.id}" class="btn btn-outline" style="padding:0.5rem 1.1rem; font-size:0.82rem;">Track Order</a>
        </div>
      </div>
    </div>
  `;
}
// BAKER-DASHBOARD.JS
// ============================================

import { db } from './firebase-config.js';
import { collection, onSnapshot, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { showToast } from './toast.js';
import { isFirebaseConfigured, escapeHTML } from './products.js';
import { getDemoOrders, updateDemoOrderStatus, onDemoOrdersChanged } from './demo-store.js';

export const STATUSES = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];

let knownOrderIds = new Set();
let isFirstLoad = true;

// --------------------------------------------
// LISTEN TO ALL ORDERS (real-time)
// --------------------------------------------
export function watchAllOrders(onOrders) {
  function handleOrders(orders) {
    if (!isFirstLoad) {
      orders.forEach((o) => {
        if (!knownOrderIds.has(o.id)) {
          showToast(`New order from ${o.customerName}!`);
        }
      });
    }
    knownOrderIds = new Set(orders.map((o) => o.id));
    isFirstLoad = false;

    onOrders(orders);
  }

  if (!isFirebaseConfigured()) {
    handleOrders(getDemoOrders());
    return onDemoOrdersChanged(() => handleOrders(getDemoOrders()));
  }

  return onSnapshot(collection(db, 'orders'), (snap) => {
    handleOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// --------------------------------------------
// UPDATE ORDER STATUS (drag-and-drop drop handler)
// --------------------------------------------
export async function updateOrderStatus(orderId, newStatus) {
  if (!isFirebaseConfigured()) {
    updateDemoOrderStatus(orderId, newStatus);
    return;
  }
  try {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
  } catch (err) {
    console.error('Failed to update order:', err);
    showToast('Could not update order status.', 'error');
    throw err;
  }
}

// --------------------------------------------
// URGENCY BADGE (time elapsed since order was placed)
// --------------------------------------------
export function urgencyClass(order) {
  if (!order.createdAt?.seconds) return '';
  const minutes = (Date.now() / 1000 - order.createdAt.seconds) / 60;
  if (minutes < 30) return 'urgent-green';
  if (minutes < 60) return 'urgent-yellow';
  return 'urgent-red';
}

// --------------------------------------------
// KANBAN CARD HTML
// --------------------------------------------
export function kanbanCardHTML(order, isNew = false) {
  return `
    <div class="kanban-card ${urgencyClass(order)} ${isNew ? 'new-order' : ''}" draggable="true" data-id="${order.id}">
      <div class="k-id">#${order.id.slice(0, 6).toUpperCase()}</div>
      <div class="k-name">${escapeHTML(order.customerName)}</div>
      <div style="font-size:0.8rem; color:var(--brown-mid); margin-bottom:0.3rem;">${order.products?.length || 0} item(s) · ${escapeHTML(order.area)}</div>
      <div class="k-total">Rs. ${order.total?.toLocaleString()}</div>
      <select class="k-status-select" data-id="${order.id}">
        ${STATUSES.map((s) => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>
  `;
}

// --------------------------------------------
// RENDER THE FULL BOARD + WIRE UP DRAG & DROP
// options.onCardClick(order): called when a card (not its dropdown) is
// tapped/clicked — used to open the full order-detail view.
// --------------------------------------------
let lastOrders = [];

export function renderBoard(containerSelector, orders, { onCardClick } = {}) {
  lastOrders = orders;
  const board = document.querySelector(containerSelector);
  if (!board) return;

  board.innerHTML = STATUSES.map((status) => {
    const columnOrders = orders.filter((o) => o.status === status);
    return `
      <div class="kanban-col" data-status="${status}">
        <h4>${status} <span>${columnOrders.length}</span></h4>
        <div class="kanban-col-body">${columnOrders.map((o) => kanbanCardHTML(o)).join('')}</div>
      </div>
    `;
  }).join('');

  // Drag events on cards
  board.querySelectorAll('.kanban-card').forEach((card) => {
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => card.classList.remove('dragging'));

    // Tap to open full order detail (cake message, flavor, size, notes...)
    if (onCardClick) {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.k-status-select')) return;
        const order = lastOrders.find((o) => o.id === card.dataset.id);
        if (order) onCardClick(order);
      });
    }
  });

  // Status dropdown — a touch-friendly alternative to drag-and-drop,
  // since native HTML5 drag-and-drop doesn't work on phones/tablets.
  board.querySelectorAll('.k-status-select').forEach((select) => {
    select.addEventListener('click', (e) => e.stopPropagation());
    select.addEventListener('change', async () => {
      const orderId = select.dataset.id;
      const newStatus = select.value;
      try {
        await updateOrderStatus(orderId, newStatus);
        showToast(`Order moved to ${newStatus}.`);
      } catch {
        // onSnapshot / demo listener will re-render with the true state if this fails
      }
    });
  });

  // Drop events on columns
  board.querySelectorAll('.kanban-col').forEach((col) => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));

    col.addEventListener('drop', async (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const dragging = board.querySelector('.dragging');
      if (!dragging) return;

      const orderId = dragging.dataset.id;
      const newStatus = col.dataset.status;

      // Optimistic UI move
      col.querySelector('.kanban-col-body').appendChild(dragging);

      try {
        await updateOrderStatus(orderId, newStatus);
        showToast(`Order moved to ${newStatus}.`);
      } catch {
        // onSnapshot will re-render with the true state if this fails
      }
    });
  });
  }
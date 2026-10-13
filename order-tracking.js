// ORDER-TRACKING.JS — real-time order status via Firestore onSnapshot
// ============================================

import { db } from './firebase-config.js';
import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { showToast } from './toast.js';

export const STATUS_STEPS = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];

// --------------------------------------------
// WATCH AN ORDER — calls onUpdate every time Firestore changes,
// no page refresh needed on either the customer or baker side.
// --------------------------------------------
export function watchOrder(orderId, onUpdate) {
  const ref = doc(db, 'orders', orderId);
  let previousStatus = null;

  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    const data = { id: snap.id, ...snap.data() };

    if (previousStatus && previousStatus !== data.status) {
      showToast(`Order status: ${data.status}`);
    }
    previousStatus = data.status;

    onUpdate(data);
  });
}

// --------------------------------------------
// RENDER STORY-STYLE PROGRESS BAR
// --------------------------------------------
export function renderProgress(containerSelector, currentStatus) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  if (currentStatus === 'Cancelled') {
    container.innerHTML = `<p style="color:#b23b2f; font-weight:500;">This order was cancelled.</p>`;
    return;
  }

  const currentIndex = STATUS_STEPS.indexOf(currentStatus);

  const bars = STATUS_STEPS.map((step, i) => {
    let cls = '';
    if (i < currentIndex) cls = 'done';
    else if (i === currentIndex) cls = 'active';
    return `<div class="progress-seg ${cls}"><div class="progress-seg-fill"></div></div>`;
  }).join('');

  const labels = STATUS_STEPS.map((step) => `<span>${step}</span>`).join('');

  container.innerHTML = `
    <div class="progress-story">${bars}</div>
    <div class="progress-labels">${labels}</div>
  `;
}
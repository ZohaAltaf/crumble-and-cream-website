// TOAST NOTIFICATION SYSTEM
// Replaces alert() everywhere on the site.
// Usage: import { showToast } from './toast.js';
//        showToast('Product added to cart!');
//        showToast('Something went wrong.', 'error');
// ============================================

function ensureContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = 'success', duration = 3000) {
  const container = ensureContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Trigger enter animation on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// Same as showToast, but with a clickable action (e.g. "Undo"). onAction fires
// once, either on click or is simply never called if the toast times out.
// `message` is treated as plain text (like showToast) — it is never inserted
// via innerHTML, so a product name or other user/baker-supplied text passed
// here can't inject HTML/script.
export function showActionToast(message, actionLabel, onAction, duration = 5000) {
  const container = ensureContainer();

  const toast = document.createElement('div');
  toast.className = 'toast toast-success toast-action';

  const span = document.createElement('span');
  span.textContent = message;
  toast.appendChild(span);

  const btn = document.createElement('button');
  btn.className = 'toast-undo-btn';
  btn.textContent = actionLabel;
  let handled = false;
  btn.addEventListener('click', () => {
    if (handled) return;
    handled = true;
    onAction();
    dismiss();
  });
  toast.appendChild(btn);
  container.appendChild(toast);

  function dismiss() {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(dismiss, duration);
}
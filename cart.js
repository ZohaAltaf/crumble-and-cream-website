// ============================================
// CART.JS — localStorage-based cart, synced to header badge
// (Firebase sync for logged-in users hooks in here in checkout.js)
// ============================================

import { showToast, showActionToast } from './toast.js';

const CART_KEY = 'cnc_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

export function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find(
    (item) => item.id === product.id && item.size === product.size && item.flavor === product.flavor
  );

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...product, qty });
  }

  saveCart(cart);
  showToast(`${product.name} added to cart!`);
}

export function removeFromCart(id, size, flavor) {
  const cart = getCart();
  const removed = cart.find((item) => item.id === id && item.size === size && item.flavor === flavor);
  const remaining = cart.filter((item) => !(item.id === id && item.size === size && item.flavor === flavor));
  saveCart(remaining);

  if (removed) {
    showActionToast(`${removed.name} removed.`, 'Undo', () => {
      const current = getCart();
      current.push(removed);
      saveCart(current);
      window.dispatchEvent(new CustomEvent('cnc-cart-restored'));
    });
  }
}

export function updateQty(id, size, flavor, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id && i.size === size && i.flavor === flavor);
  if (item) {
    item.qty = Math.max(1, qty);
    saveCart(cart);
  }
}

export function clearCart() {
  saveCart([]);
}

export function getCartItems() {
  return getCart();
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;
  const newCount = String(getCartCount());
  if (badge.textContent !== newCount) {
    badge.textContent = newCount;
    badge.classList.remove('jiggle');
    void badge.offsetWidth; // restart animation
    badge.classList.add('jiggle');
  }
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
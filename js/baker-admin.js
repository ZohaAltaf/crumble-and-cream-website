// BAKER-ADMIN.JS
// Shared Firestore helpers for the baker's admin pages:
// Products, Add Product, Customers, Reviews, Messages, Settings.
// All of these require a real, configured Firebase project — there is no
// localStorage demo-mode fallback here, since a baker only ever exists once
// Firebase Auth + Firestore are actually connected.
// ============================================

import { db } from './firebase-config.js';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, setDoc,
  query, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// --------------------------------------------
// PRODUCTS
// --------------------------------------------
export async function loadAllProductsForAdmin() {
  const snap = await getDocs(collection(db, 'products'));
  const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return products;
}

export async function addProduct(data) {
  return addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
}

export async function updateProduct(id, data) {
  return updateDoc(doc(db, 'products', id), data);
}

export async function deleteProduct(id) {
  return deleteDoc(doc(db, 'products', id));
}

export const PRODUCT_CATEGORIES = [
  'Cakes', 'Cup Cakes', 'Pastries', 'Nimco', 'Biscuits',
  'Chocolates', 'Desserts', 'Breads', 'Special Gifts', 'Juices'
];

// --------------------------------------------
// CUSTOMERS
// --------------------------------------------
export async function loadCustomers() {
  const q = query(collection(db, 'users'), where('role', '==', 'customer'));
  const snap = await getDocs(q);
  const customers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  customers.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return customers;
}

// --------------------------------------------
// REVIEWS (moderation)
// --------------------------------------------
export async function loadReviewsForAdmin() {
  const snap = await getDocs(collection(db, 'reviews'));
  const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  reviews.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return reviews;
}

export async function setReviewApproved(id, approved) {
  return updateDoc(doc(db, 'reviews', id), { approved });
}

export async function deleteReview(id) {
  return deleteDoc(doc(db, 'reviews', id));
}

// --------------------------------------------
// MESSAGES (contact + corporate inquiries)
// --------------------------------------------
export async function loadMessages() {
  const snap = await getDocs(collection(db, 'messages'));
  const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  messages.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return messages;
}

export async function deleteMessage(id) {
  return deleteDoc(doc(db, 'messages', id));
}

// --------------------------------------------
// SETTINGS (delivery charge, minimum order, cutoff hour)
// --------------------------------------------
const DEFAULT_SETTINGS = {
  deliveryCharge: 150,
  minOrderAmount: 500,
  sameDayCutoffHour: 16
};

export async function getSiteSettings() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'general'));
    return snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSiteSettings(data) {
  return setDoc(doc(db, 'settings', 'general'), data, { merge: true });
}

// PRODUCTS.JS — Firestore product fetching + rendering
// ============================================

import { db } from './firebase-config.js';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { addToCart } from './cart.js';
import { flyToCart, animatePriceChange, initScrollReveal } from './animations.js';
import { showToast } from './toast.js';

// --------------------------------------------
// SAMPLE PRODUCTS (fallback demo data)
// --------------------------------------------
const SAMPLE_PRODUCTS = [
  // --- Cakes ---
  { id: 'demo-cake-caramel', name: 'Caramel Drip Cake', category: 'Cakes', price: 2900, rating: 4.9, featured: true, description: 'Delicious vanilla sponge layered with rich caramel and topped with spun sugar.', image: 'images/ceramal-cake.png' },
  { id: 'demo-cake-mango-trimilk', name: 'Mango Tres Leches Cake', category: 'Cakes', price: 3100, rating: 5.0, featured: true, description: 'Soft sponge soaked in three milks, topped with fresh cream, mango cubes, and pistachios.', image: 'images/mango-trimilk.png' },
  { id: 'demo-cake-chocolate-crunch', name: 'Chocolate Crunch Cake', category: 'Cakes', price: 2700, rating: 4.9, featured: true, description: 'Delicious chocolate cake loaded with crunchy bits and chocolate cream.', image: 'images/chocolate-crunch.png' },
  { id: 'demo-cake-chocolate-cherry', name: 'Chocolate Cherry Cake', category: 'Cakes', price: 2850, rating: 4.9, featured: true, description: 'Rich chocolate sponge layered with cherries and cream.', image: 'images/chocolate-cherry.png' },
  { id: 'demo-cake-vanilla', name: 'Vanilla Cake', category: 'Cakes', price: 2200, rating: 4.7, featured: false, description: 'Classic light vanilla sponge with smooth cream frosting.', image: 'images/vanilla-cake.png' },
  { id: 'demo-cake-chocolate', name: 'Chocolate Cake', category: 'Cakes', price: 2600, rating: 4.8, featured: true, description: 'Decadent chocolate cake with rich chocolate frosting.', image: 'images/chocolate-cake.png' },

  // --- Cup Cakes ---
  { id: 'demo-cupcake-mix', name: 'Assorted Cupcakes Box', category: 'Cup Cakes', price: 950, rating: 4.8, featured: true, description: 'Assorted cupcakes with rich chocolate and vanilla frosting.', image: 'images/cupcakes.jfif' },
  { id: 'demo-cupcake-choc', name: 'Rich Chocolate Cupcake', category: 'Cup Cakes', price: 280, rating: 4.9, featured: true, description: 'Rich chocolate cupcakes with smooth chocolate frosting and hazelnuts.', image: 'images/chocolate-cupcake.jfif' },
  { id: 'demo-cupcake-strawberry', name: 'Chocolate Strawberry Cupcake', category: 'Cup Cakes', price: 320, rating: 5.0, featured: true, description: 'Chocolate cupcakes filled with strawberry cream and topped with chocolate-dipped strawberries.', image: 'images/chocolate-strawberry-cupcake.jfif' },
  { id: 'demo-cupcake-cream', name: 'Cream Vanilla Cupcake', category: 'Cup Cakes', price: 260, rating: 4.7, description: 'Soft cupcakes with smooth cream frosting.', image: 'images/creame-cupcake.jfif' },
  { id: 'demo-cupcake-green', name: 'Pistachio Green Cupcake', category: 'Cup Cakes', price: 290, rating: 4.8, description: 'Light green frosted cupcakes with soft sponge.', image: 'images/gluten-cupcake.jfif' },
  { id: 'demo-cupcake-lemon', name: 'Lemon Cupcake', category: 'Cup Cakes', price: 270, rating: 4.6, description: 'Zesty lemon cupcakes with creamy frosting.', image: 'images/lemon-cupcake.jfif' },

  // --- Pastries ---
  { id: 'demo-pastry-lemon-tart', name: 'Mini Lemon Tarts', category: 'Pastries', price: 340, rating: 4.9, featured: true, description: 'Delightful mini tarts filled with zesty lemon curd and topped with delicate cream flowers.', image: 'images/mini-lemon-tarts.jfif' },
  { id: 'demo-pastry-pistachio', name: 'Pistachio Pastry', category: 'Pastries', price: 380, rating: 5.0, featured: true, description: 'Flaky pastry filled with rich cream and topped with crunchy chopped pistachios.', image: 'images/pistachio-pastry.jfif' },
  { id: 'demo-pastry-royal', name: 'Royal Walnut Pastry', category: 'Pastries', price: 420, rating: 4.8, featured: true, description: 'Rich spiced bundt-style pastry packed with walnuts and cinnamon.', image: 'images/royal-pastry.jfif' },
  { id: 'demo-pastry-chocolate', name: 'Chocolate Fudge Pastry', category: 'Pastries', price: 360, rating: 4.9, featured: true, description: 'Decadent chocolate pastry slice drizzled with rich liquid chocolate fudge.', image: 'images/chocolate-pastry.jfif' },
  { id: 'demo-pastry-vanilla', name: 'Classic Vanilla Pastry', category: 'Pastries', price: 300, rating: 4.7, description: 'Soft layered vanilla sponge cake slice with whipped cream and a cherry on top.', image: 'images/vanilla-pastry.jfif' },

  // --- Nimco ---
  { id: 'demo-nimco-crispy-rice', name: 'Crispy Rice Snack Stack', category: 'Nimco', price: 350, rating: 4.8, featured: true, description: 'Crunchy savory crispy rice snack bites stacked together with special spices.', image: 'images/nimco-1.jfif' },
  { id: 'demo-nimco-dal-mot', name: 'Special Dal Moth & Peanut Mix', category: 'Nimco', price: 400, rating: 4.9, featured: true, description: 'Traditional spicy nimco mix loaded with crispy lentils and roasted peanuts.', image: 'images/nimco-2.jfif' },
  { id: 'demo-nimco-spicy-sticks', name: 'Crispy Spicy Nimco Sticks', category: 'Nimco', price: 320, rating: 4.7, description: 'Golden crunchy savory sticks seasoned with traditional tangy spices.', image: 'images/nimco-3.jfif' },
  { id: 'demo-nimco-grand-mix', name: 'Grand Festive Nimco Assortment', category: 'Nimco', price: 650, rating: 5.0, featured: true, description: 'A massive variety assortment of different traditional crunchy nimco snacks and savories.', image: 'images/mix-nimko-4.jfif' },

  // --- Biscuits & Cookies ---
  { id: 'demo-cookie-trio', name: 'Trio Style Cookies', category: 'Biscuits', price: 350, rating: 4.8, featured: true, description: 'A delightful combination pack featuring three distinct flavored cookies.', image: 'images/3-diffrent-cookies.jfif' },
  { id: 'demo-cookie-deal', name: 'All Cookies Grand Deal Box', category: 'Biscuits', price: 950, rating: 5.0, featured: true, description: 'A grand assorted box filled with all varieties of fresh cookies.', image: 'images/all-cookies-deal.jfif' },
  { id: 'demo-cookie-butter', name: 'Classic Butter Cookies Stack', category: 'Biscuits', price: 300, rating: 4.7, featured: true, description: 'Crisp and crumbly traditional butter cookies stacked nicely.', image: 'images/butter-cookie.jfif' },
  { id: 'demo-cookie-choco', name: 'Floating Chocolate Chip Cookies', category: 'Biscuits', price: 380, rating: 4.9, featured: true, description: 'Rich chocolate chip cookies bursting with cocoa flavor.', image: 'images/chocolate-cookie.jfif' },
  { id: 'demo-cookie-coconut', name: 'Coconut Star Cookies', category: 'Biscuits', price: 320, rating: 4.8, description: 'Delicious flower-shaped coconut flavored cookies.', image: 'images/coconut-cookie.jfif' },
  { id: 'demo-cookie-mix', name: 'Assorted Mix Cookies Platter', category: 'Biscuits', price: 450, rating: 4.9, featured: true, description: 'An assorted platter of crunchy and sweet mix cookies.', image: 'images/mix-cookies.jfif' },

  // --- Traditional Sweets ---
  { id: 'demo-sweet-platter', name: 'Grand Royal Sweets Platter', category: 'Traditional Sweets', price: 1500, rating: 4.9, featured: true, description: 'A magnificent assortment of traditional mithai and festive sweets.', image: 'images/sweet-plater.jfif' },
  { id: 'demo-sweet-motichoor', name: 'Premium Motichoor Laddu Platter', category: 'Traditional Sweets', price: 1200, rating: 4.8, featured: true, description: 'Delicious golden motichoor laddus garnished with pistachios.', image: 'images/pngtree-traditional-indian-sweets-with-pistachio-garnish-on-silver-platter-png-image_.jpg' },
  { id: 'demo-sweet-gulab-bowl', name: 'Rich Gulab Jamun Bowl', category: 'Traditional Sweets', price: 850, rating: 4.9, featured: true, description: 'Soft and juicy gulab jamuns soaking in sweet sugar syrup.', image: 'images/makkan-peda.jpg' },
  { id: 'demo-sweet-kaju-katli', name: 'Silver Leaf Kaju Katli', category: 'Traditional Sweets', price: 1400, rating: 5.0, featured: true, description: 'Premium cashew diamond sweets decorated with edible silver leaf.', image: 'images/kaju-katli.jpg' },
  { id: 'demo-sweet-rasgulla', name: 'Special Rasgulla Bowl', category: 'Traditional Sweets', price: 900, rating: 4.7, featured: true, description: 'Spongy white rasgullas garnished with green pistachio flakes.', image: 'images/gulab-jamun.jfif' },
  { id: 'demo-sweet-desi-platter', name: 'Royal Desi Assortment Tray', category: 'Traditional Sweets', price: 1600, rating: 4.9, featured: true, description: 'An elegant silver tray filled with various rich traditional delicacies.', image: 'images/desi plater.jfif' },
  { id: 'demo-sweet-badam-halwa', name: 'Rich Almond Badam Halwa', category: 'Traditional Sweets', price: 1100, rating: 4.8, featured: false, description: 'Warm and rich badam halwa loaded with almonds and cardamom.', image: 'images/badam-halwa.jfif' },
  { id: 'demo-sweet-barfi', name: 'Saffron Silver Barfi Stack', category: 'Traditional Sweets', price: 1300, rating: 4.9, featured: true, description: 'Traditional milk barfi stacked neatly with silver leaf and saffron threads.', image: 'images/360_F_1642007683_TpuXZaVURl5eEOJboPTVwPAfLmza6lQx.jpg' },

  // --- Breads (New items added) ---
  { id: 'demo-bread-basket', name: 'Fresh Soft Baguette Basket', category: 'Breads', price: 450, rating: 4.8, featured: true, description: 'Warm, freshly baked golden baguettes served in a rustic woven basket[cite: 36].', image: 'images/soft-bread.jfif' },
  { id: 'demo-bread-puffs', name: 'Crispy Layered Pastry Patties', category: 'Breads', price: 320, rating: 4.9, featured: true, description: 'Flaky, golden-brown layered savory pastry patties stacked to perfection[cite: 37].', image: 'images/petis.jfif' },
  { id: 'demo-bread-deal', name: 'Artisan Bread Assortment Box', category: 'Breads', price: 850, rating: 5.0, featured: true, description: 'A grand daily selection of various fresh artisanal loaves and buns[cite: 38].', image: 'images/bread-deal.jfif' },
  { id: 'demo-bread-donuts', name: 'Glazed & Topped Sweet Donuts', category: 'Breads', price: 400, rating: 4.9, featured: true, description: 'Soft fluffy donuts topped with colorful sprinkles, nuts, and rich chocolate frosting[cite: 39].', image: 'images/donuts.jfif' },
  { id: 'demo-bread-1', name: 'Sourdough Loaf', category: 'Breads', price: 550, rating: 4.6, description: 'Crusty artisan sourdough, baked daily.', image: 'https://images.unsplash.com/photo-1650123465396-a065c2340715?auto=format&fit=crop&w=800&q=80' },

  // --- Baaki Sample Products ---
  { id: 'demo-choc-1', name: 'Assorted Chocolate Box', category: 'Chocolates', price: 1800, rating: 4.9, featured: true, description: 'A curated box of handmade chocolate truffles.', image: 'https://images.unsplash.com/photo-1756318084626-de5cf8bab8c6?auto=format&fit=crop&w=800&q=80' },
  { id: 'demo-gift-1', name: 'Celebration Gift Box', category: 'Special Gifts', price: 2200, rating: 4.9, featured: true, description: 'Chocolates, a mini cake, and a handwritten note.', image: 'https://images.unsplash.com/photo-1756318084626-de5cf8bab8c6?auto=format&fit=crop&w=800&q=80' }
];

// --------------------------------------------
// ESCAPE HTML
// --------------------------------------------
export function escapeHTML(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --------------------------------------------
// SKELETON CARDS
// --------------------------------------------
function renderSkeletons(container, count = 4) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.innerHTML = `
      <div class="skeleton-shimmer img"></div>
      <div class="skeleton-shimmer line"></div>
      <div class="skeleton-shimmer line short"></div>
    `;
    container.appendChild(card);
  }
}

// --------------------------------------------
// RENDER A SINGLE PRODUCT CARD
// --------------------------------------------
function productCardHTML(product) {
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  return `
    <div class="product-card reveal" data-id="${product.id}">
      <div class="product-media" data-cursor="view" data-cursor-label="View">
        ${discount ? `<span class="badge">${discount}% OFF</span>` : ''}
        <button class="fav-btn" aria-label="Add to favorites">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3E2723" stroke-width="1.6">
            <path d="M12 21s-6.7-4.35-9.3-8.1C.8 9.8 1.8 6 5.2 5.1c2-.5 3.9.4 4.8 2 .9-1.6 2.8-2.5 4.8-2 3.4.9 4.4 4.7 2.5 7.8-2.6 3.75-9.3 8.1-9.3 8.1z"/>
          </svg>
        </button>
        ${product.image
          ? `<img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" onerror="this.src='${'https://images.unsplash.com/photo-1535911765168-1fafc87dcfa3?auto=format&fit=crop&w=800&q=80'}'" />`
          : `<img src="https://images.unsplash.com/photo-1535911765168-1fafc87dcfa3?auto=format&fit=crop&w=800&q=80" alt="${escapeHTML(product.name)}" loading="lazy" />`}
      </div>
      <div class="product-info">
        <span class="product-cat">${escapeHTML(product.category)}</span>
        <h4>${escapeHTML(product.name)}</h4>
        <div class="price-row">
          <span class="price-now" data-value="${product.price}">Rs. ${product.price.toLocaleString()}</span>
          ${product.oldPrice ? `<span class="price-old">Rs. ${product.oldPrice.toLocaleString()}</span>` : ''}
        </div>
        <div class="product-actions">
          <button class="add-to-cart-btn magnetic" data-id="${product.id}">Add to Cart</button>
        </div>
      </div>
    </div>
  `;
}

const FAV_KEY = 'cnc_favorites';

function getFavoriteIds() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
}

function toggleFavoriteId(id) {
  const favs = getFavoriteIds();
  const idx = favs.indexOf(id);
  if (idx === -1) favs.push(id); else favs.splice(idx, 1);
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  return idx === -1;
}

function attachCardEvents(container, products) {
  container.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const product = products.find((p) => p.id === btn.dataset.id);
      if (!product) return;
      const img = btn.closest('.product-card').querySelector('img');
      flyToCart(img);
      addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, size: null, flavor: null });
    });
  });

  container.querySelectorAll('.fav-btn').forEach((btn) => {
    const card = btn.closest('.product-card');
    if (getFavoriteIds().includes(card.dataset.id)) btn.classList.add('active');

    btn.addEventListener('click', () => {
      const isNowFav = toggleFavoriteId(card.dataset.id);
      btn.classList.toggle('active', isNowFav);
      showToast(isNowFav ? 'Added to favorites!' : 'Removed from favorites.');
    });
  });

  container.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.add-to-cart-btn') || e.target.closest('.fav-btn')) return;
      window.location.href = `product-details.html?id=${card.dataset.id}`;
    });
  });

  initScrollReveal();
}

export async function loadProductsByIds(ids, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container || ids.length === 0) return;

  renderSkeletons(container, ids.length);

  function applySample() {
    const products = SAMPLE_PRODUCTS.filter((p) => ids.includes(p.id));
    if (products.length === 0) {
      container.innerHTML = `<p class="empty-state">No favorites found.</p>`;
      return;
    }
    container.innerHTML = products.map(productCardHTML).join('');
    attachCardEvents(container, products);
  }

  if (!isFirebaseConfigured()) {
    applySample();
    return;
  }

  try {
    const results = await Promise.all(
      ids.map((id) => getDoc(doc(db, 'products', id)))
    );
    const products = results.filter((s) => s.exists()).map((s) => ({ id: s.id, ...s.data() }));

    if (products.length === 0) {
      container.innerHTML = `<p class="empty-state">No favorites found.</p>`;
      return;
    }

    container.innerHTML = products.map(productCardHTML).join('');
    attachCardEvents(container, products);
  } catch (err) {
    console.error('Failed to load favorites from Firebase, showing sample products:', err);
    applySample();
  }
}

function isFirebaseConfigured() {
  try {
    return db && db.app && db.app.options && db.app.options.apiKey && db.app.options.apiKey !== 'YOUR_API_KEY';
  } catch {
    return false;
  }
}

export { SAMPLE_PRODUCTS, isFirebaseConfigured };

export async function loadFeaturedProducts(containerSelector, max = 8) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  renderSkeletons(container, max);

  if (!isFirebaseConfigured()) {
    const products = SAMPLE_PRODUCTS.filter((p) => p.featured).slice(0, max);
    container.innerHTML = products.map(productCardHTML).join('');
    attachCardEvents(container, products);
    return;
  }

  try {
    const q = query(
      collection(db, 'products'),
      where('featured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(max)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      const products = SAMPLE_PRODUCTS.filter((p) => p.featured).slice(0, max);
      container.innerHTML = products.map(productCardHTML).join('');
      attachCardEvents(container, products);
      return;
    }

    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    container.innerHTML = products.map(productCardHTML).join('');
    attachCardEvents(container, products);
  } catch (err) {
    console.error('Failed to load products from Firebase, showing sample products:', err);
    const products = SAMPLE_PRODUCTS.filter((p) => p.featured).slice(0, max);
    container.innerHTML = products.map(productCardHTML).join('');
    attachCardEvents(container, products);
  }
}

export async function loadCategoryProducts(categoryName, containerSelector, sortKey = 'newest') {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  renderSkeletons(container, 8);

  function applySample() {
    let products = SAMPLE_PRODUCTS.filter((p) => p.category === categoryName);
    products = sortProducts(products, sortKey);
    if (products.length === 0) {
      container.innerHTML = `<p class="empty-state">No products available in this category yet.</p>`;
      return;
    }
    container.innerHTML = products.map(productCardHTML).join('');
    attachCardEvents(container, products);
  }

  if (!isFirebaseConfigured()) {
    applySample();
    return;
  }

  try {
    const q = query(collection(db, 'products'), where('category', '==', categoryName));
    const snap = await getDocs(q);

    if (snap.empty) {
      applySample();
      return;
    }

    let products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    products = sortProducts(products, sortKey);

    container.innerHTML = products.map(productCardHTML).join('');
    attachCardEvents(container, products);
  } catch (err) {
    console.error('Failed to load category products from Firebase, showing sample products:', err);
    applySample();
  }
}

function sortProducts(products, sortKey) {
  const copy = [...products];
  if (sortKey === 'price-low') copy.sort((a, b) => a.price - b.price);
  else if (sortKey === 'price-high') copy.sort((a, b) => b.price - a.price);
  else if (sortKey === 'popular') copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return copy;
}

export async function searchProducts(term, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  if (!term.trim()) {
    container.innerHTML = '';
    return;
  }

  renderSkeletons(container, 4);

  function applySample() {
    const matches = SAMPLE_PRODUCTS.filter((p) => p.name.toLowerCase().includes(term.toLowerCase()));
    if (matches.length === 0) {
      container.innerHTML = `<p class="empty-state">No products found.</p>`;
      return;
    }
    container.innerHTML = matches.map(productCardHTML).join('');
    attachCardEvents(container, matches);
  }

  if (!isFirebaseConfigured()) {
    applySample();
    return;
  }

  try {
    const snap = await getDocs(collection(db, 'products'));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const matches = all.filter((p) => p.name.toLowerCase().includes(term.toLowerCase()));

    if (matches.length === 0) {
      applySample();
      return;
    }

    container.innerHTML = matches.map(productCardHTML).join('');
    attachCardEvents(container, matches);
  } catch (err) {
    console.error('Search failed, falling back to sample data:', err);
    applySample();
  }
}

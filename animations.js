// ============================================
// ANIMATIONS.JS — GSAP-powered interactions
// ============================================

gsap.registerPlugin(ScrollTrigger);

// --------------------------------------------
// 1. CUSTOM CURSOR (desktop only)
// --------------------------------------------
export function initCustomCursor() {
  if (window.matchMedia('(max-width: 860px)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'cursor-dot';
  cursor.innerHTML = '<span>View</span>';
  document.body.appendChild(cursor);

  const quickX = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const quickY = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });

  window.addEventListener('mousemove', (e) => {
    quickX(e.clientX);
    quickY(e.clientY);
  });

  document.querySelectorAll('[data-cursor="view"]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('grow');
      cursor.querySelector('span').textContent = el.dataset.cursorLabel || 'View';
    });
    el.addEventListener('mouseleave', () => cursor.classList.remove('grow'));
  });
}

// --------------------------------------------
// 2. MAGNETIC BUTTONS
// --------------------------------------------
export function initMagneticButtons() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  document.querySelectorAll('.magnetic').forEach((btn) => {
    const strength = 0.35;

    const moveX = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
    const moveY = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });

    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      moveX(relX * strength);
      moveY(relY * strength);
    });

    btn.addEventListener('mouseleave', () => {
      moveX(0);
      moveY(0);
    });
  });
}

// --------------------------------------------
// 3. SCROLL REVEAL
// --------------------------------------------
export function initScrollReveal() {
  const items = gsap.utils.toArray('.reveal:not(.reveal-bound)');
  items.forEach((el) => {
    el.classList.add('reveal-bound');

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      el.classList.add('visible');
      return;
    }

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => el.classList.add('visible'),
      once: true
    });
  });
}

// --------------------------------------------
// 4. STAGGERED HERO ENTRANCE
// --------------------------------------------
export function staggerEntrance(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const children = container.querySelectorAll('[data-stagger]');
  gsap.fromTo(
    children,
    { opacity: 0, y: 26 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.15 }
  );
}

// --------------------------------------------
// 5. HORIZONTAL PINNING SECTION
// --------------------------------------------
export function initPinSection() {
  const section = document.querySelector('.pin-section');
  if (!section) return;

  if (window.matchMedia('(max-width: 860px)').matches) return;

  const track = section.querySelector('.pin-track');
  if (!track) return;

  const distance = track.scrollWidth - section.clientWidth;
  if (distance <= 0) return;

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${track.scrollWidth - section.clientWidth}`,
    scrub: 1,
    pin: true,
    animation: gsap.to(track, { x: () => -(track.scrollWidth - section.clientWidth), ease: 'none' }),
    invalidateOnRefresh: true
  });

  ScrollTrigger.refresh();
}

//-------------------------------------

export function initStaggerGrids() {
  gsap.utils.toArray('.grid--4 > div, .row > div').forEach((grid) => {
    gsap.from(grid, {
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15, // Har card thore delay se aayega
      ease: "power2.out",
      scrollTrigger: {
        trigger: grid,
        start: "top 88%",
        toggleActions: "play none none none"
      }
    });
  });
}
//-------------------------------------------


//------------------------------------------

export function initPageTransition() {
  gsap.from("body", {
    opacity: 0,
    duration: 0.6,
    ease: "power2.out"
  });
}
//--------------------------------------

// --------------------------------------------
// 6. PRICE DIGIT ROLL
// --------------------------------------------
export function animatePriceChange(el, newValue) {
  const obj = { val: parseInt(el.dataset.value || '0', 10) };
  gsap.to(obj, {
    val: newValue,
    duration: 0.5,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = 'Rs. ' + Math.round(obj.val).toLocaleString();
    }
  });
  el.dataset.value = newValue;
}

// --------------------------------------------
// 7. "FLY TO CART"
// --------------------------------------------
export function flyToCart(sourceImgEl) {
  const cartIcon = document.getElementById('cart-icon');
  if (!cartIcon || !sourceImgEl) return;

  const startRect = sourceImgEl.getBoundingClientRect();
  const endRect = cartIcon.getBoundingClientRect();

  const clone = sourceImgEl.cloneNode(true);
  clone.style.position = 'fixed';
  clone.style.top = startRect.top + 'px';
  clone.style.left = startRect.left + 'px';
  clone.style.width = startRect.width + 'px';
  clone.style.height = startRect.height + 'px';
  clone.style.borderRadius = '50%';
  clone.style.objectFit = 'cover';
  clone.style.zIndex = 9998;
  clone.style.pointerEvents = 'none';
  document.body.appendChild(clone);

  gsap.to(clone, {
    top: endRect.top + endRect.height / 2,
    left: endRect.left + endRect.width / 2,
    width: 18,
    height: 18,
    opacity: 0.5,
    duration: 0.7,
    ease: 'power2.in',
    onComplete: () => {
      clone.remove();
      gsap.fromTo(cartIcon, { scale: 1 }, { scale: 1.3, duration: 0.15, yoyo: true, repeat: 1 });
    }
  });
}
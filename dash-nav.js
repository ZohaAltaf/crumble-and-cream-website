// DASH-NAV.JS
// Mobile hamburger toggle for the dashboard sidebar, shared by both the
// customer dashboard and every baker admin page.
// ============================================
export function initDashNav() {
  const hamburger = document.getElementById('dash-hamburger');
  const scrim = document.getElementById('dash-scrim');
  if (!hamburger) return;

  const close = () => document.body.classList.remove('dash-nav-open');

  hamburger.addEventListener('click', () => document.body.classList.toggle('dash-nav-open'));
  scrim?.addEventListener('click', close);
  document.querySelectorAll('.dash-nav a').forEach((a) => a.addEventListener('click', close));
}
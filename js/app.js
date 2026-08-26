import { DB } from './db.js';
import { el, toast } from './utils.js';
import { state, setSettings } from './store.js';
import { firebaseReady } from './firebase.js';
import { onAuthChange } from './auth.js';
import { initTheme } from './theme.js';
import { DONATION_RETURN_PARAM } from './donate.js';

import * as setupFirebase from './views/setupFirebase.js';
import * as login from './views/login.js';
import * as onboarding from './views/onboarding.js';
import * as tickets from './views/tickets.js';
import * as day from './views/day.js';
import * as attendance from './views/attendance.js';
import * as more from './views/more.js';
import * as stats from './views/stats.js';
import * as history from './views/history.js';
import * as workers from './views/workers.js';
import * as products from './views/products.js';
import * as config from './views/config.js';
import * as backup from './views/backup.js';

const NAV_ITEMS = [
  { path: '/tickets', icon: '🎫', label: 'Tickets' },
  { path: '/day', icon: '📅', label: 'Día' },
  { path: '/attendance', icon: '⏱️', label: 'Asistencia' },
  { path: '/stats', icon: '📊', label: 'Stats' },
  { path: '/more', icon: '☰', label: 'Más' },
];

const ROUTES = {
  '/tickets': { view: tickets, nav: '/tickets' },
  '/day': { view: day, nav: '/day' },
  '/attendance': { view: attendance, nav: '/attendance' },
  '/stats': { view: stats, nav: '/stats' },
  '/more': { view: more, nav: '/more' },
  '/more/history': { view: history, nav: '/more' },
  '/more/workers': { view: workers, nav: '/more' },
  '/more/products': { view: products, nav: '/more' },
  '/more/config': { view: config, nav: '/more' },
  '/more/backup': { view: backup, nav: '/more' },
};

const appEl = document.getElementById('app');
const navEl = document.getElementById('bottomNav');

export function navigate(path) {
  if (location.hash.slice(1) === path) {
    handleRoute();
  } else {
    location.hash = path;
  }
  window.scrollTo(0, 0);
}

let currentCleanup = null;

function handleRoute() {
  const hash = location.hash.slice(1) || '/tickets';
  const route = ROUTES[hash] || ROUTES['/tickets'];

  if (typeof currentCleanup === 'function') {
    try { currentCleanup(); } catch (e) { /* noop */ }
    currentCleanup = null;
  }

  appEl.innerHTML = '';
  renderBottomNav(route.nav);
  const result = route.view.render(appEl, { navigate });
  if (typeof result === 'function') currentCleanup = result;
}

function renderBottomNav(activePath) {
  navEl.style.display = 'flex';
  navEl.innerHTML = '';
  NAV_ITEMS.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = activePath === item.path ? 'active' : '';
    btn.innerHTML = `<span class="ic">${item.icon}</span><span class="nav-label">${item.label}</span>`;
    btn.addEventListener('click', () => navigate(item.path));
    navEl.appendChild(btn);
  });
}

function showFullScreen(renderFn) {
  navEl.style.display = 'none';
  appEl.innerHTML = '';
  renderFn(appEl);
}

function showLoadingScreen() {
  navEl.style.display = 'none';
  appEl.innerHTML = '';
  appEl.appendChild(el(`
    <div class="auth-screen">
      <div class="loader-mark">🧽</div>
    </div>
  `));
}

let routerBound = false;

// Si Stripe nos regresa desde un pago exitoso (ver README → "Donaciones"),
// marcamos la cuenta como donante para mostrarle un agradecimiento. No es
// una verificación blindada (la app es 100% estática, sin servidor propio
// para validar el pago real), pero no vale la pena complicar esto con
// funciones en la nube por tan poco.
async function checkDonationReturn(settings) {
  const params = new URLSearchParams(location.search);
  if (params.get(DONATION_RETURN_PARAM) !== '1') return settings;

  window.history.replaceState({}, '', location.pathname + location.hash);
  if (settings.donorAdFree) return settings;

  const updated = { ...settings, donorAdFree: true };
  await DB.saveSettings(updated);
  toast('¡Gracias por tu apoyo!', 'success');
  return updated;
}

async function enterApp(settings) {
  settings = await checkDonationReturn(settings);
  setSettings(settings);
  if (!routerBound) {
    window.addEventListener('hashchange', handleRoute);
    routerBound = true;
  }
  handleRoute();
}

async function handleAuthedUser(user) {
  let settings = await DB.getSettings();
  if (!settings || !settings.onboarded) {
    showFullScreen((container) => {
      onboarding.render(container, { onDone: (newSettings) => enterApp(newSettings) });
    });
    return;
  }
  enterApp(settings);
}

function boot() {
  initTheme();

  if (!firebaseReady) {
    showFullScreen(setupFirebase.render);
    return;
  }

  showLoadingScreen();
  onAuthChange((user) => {
    if (!user) {
      showFullScreen(login.render);
      return;
    }
    handleAuthedUser(user);
  });
}

// Permite a cualquier vista refrescar el estado global tras editar Config.
export async function reloadSettings() {
  const settings = await DB.getSettings();
  setSettings(settings);
  return settings;
}

boot();

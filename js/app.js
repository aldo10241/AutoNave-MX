import { DB } from './db.js';
import { setCurrencySymbol } from './utils.js';
import { state, setSettings } from './store.js';

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
    btn.innerHTML = `<span class="ic">${item.icon}</span><span>${item.label}</span>`;
    btn.addEventListener('click', () => navigate(item.path));
    navEl.appendChild(btn);
  });
}

async function boot() {
  let settings = await DB.getSettings();

  if (!settings || !settings.onboarded) {
    navEl.style.display = 'none';
    appEl.innerHTML = '';
    onboarding.render(appEl, {
      onDone: async (newSettings) => {
        setSettings(newSettings);
        setCurrencySymbol(newSettings.currency);
        window.addEventListener('hashchange', handleRoute);
        location.hash = '/tickets';
        handleRoute();
      },
    });
    return;
  }

  setSettings(settings);
  setCurrencySymbol(settings.currency);
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

// Permite a cualquier vista refrescar el estado global tras editar Config.
export async function reloadSettings() {
  const settings = await DB.getSettings();
  setSettings(settings);
  setCurrencySymbol(settings.currency);
  return settings;
}

boot();

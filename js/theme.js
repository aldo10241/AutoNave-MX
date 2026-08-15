// Preferencia de tema (claro/oscuro). Es solo una preferencia visual del
// dispositivo, así que se guarda en localStorage, no en Firestore.
// Por defecto la app se ve oscura (el usuario puede cambiar a claro cuando quiera).
const KEY = 'autonave-mx-theme';

export function getTheme() {
  return localStorage.getItem(KEY) || 'dark';
}

export function setTheme(mode) {
  localStorage.setItem(KEY, mode);
  document.documentElement.dataset.theme = mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#0E1220' : '#F5F7FB');
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function initTheme() {
  setTheme(getTheme());
}

// Preferencia de tema (claro/oscuro). Es solo una preferencia visual del
// dispositivo, así que se guarda en localStorage, no en Firestore.
const KEY = 'carwash-libre-theme';

export function getTheme() {
  return localStorage.getItem(KEY) || 'light';
}

export function setTheme(mode) {
  localStorage.setItem(KEY, mode);
  document.documentElement.dataset.theme = mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#17140F' : '#FBF6EC');
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function initTheme() {
  setTheme(getTheme());
}

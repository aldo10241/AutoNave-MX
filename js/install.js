// Manejo del prompt de instalación de la PWA ("Agregar a pantalla de inicio").
let deferredPrompt = null;
let installed = false;
const listeners = new Set();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  listeners.forEach((fn) => fn());
});

window.addEventListener('appinstalled', () => {
  installed = true;
  deferredPrompt = null;
  listeners.forEach((fn) => fn());
});

export function onInstallAvailabilityChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function canInstall() {
  return !!deferredPrompt && !installed;
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === 'accepted';
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

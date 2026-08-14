// Módulo de anuncios (Google AdSense) — discretos y solo en pantallas
// secundarias (Stats, Historial, Config). Nunca en el flujo de Tickets/Día
// ni como interstitial/popup.
//
// CÓMO ACTIVARLO (ver README.md, sección "Monetización con anuncios"):
// 1. Crea una cuenta en https://adsense.google.com y agrega tu sitio.
// 2. Cuando te aprueben, reemplaza ADSENSE_CLIENT por tu ID "ca-pub-XXXXXXXXXXXXXXXX".
// 3. Crea bloques de anuncio "Display" en AdSense y pega sus IDs en AD_SLOTS.
// 4. Actualiza también ads.txt en la raíz del proyecto con tu pub-id.
// Mientras ADSENSE_CLIENT tenga el valor de ejemplo, no se carga ningún
// anuncio real (evita errores de consola y bloques vacíos para tus usuarios).

export const ADSENSE_CLIENT = 'ca-pub-0000000000000000';

export const AD_SLOTS = {
  stats: '0000000000',
  history: '0000000000',
  config: '0000000000',
};

const isLocalhost = ['localhost', '127.0.0.1', ''].includes(location.hostname);

function isConfigured() {
  return ADSENSE_CLIENT !== 'ca-pub-0000000000000000';
}

let scriptPromise = null;
function loadScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    s.crossOrigin = 'anonymous';
    s.onload = resolve;
    s.onerror = resolve;
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Inserta un bloque de anuncio discreto dentro de `container`.
 * placement: 'stats' | 'history' | 'config'
 */
export function mountAd(container, placement) {
  if (!container) return;

  if (!isConfigured()) {
    if (isLocalhost) {
      const box = document.createElement('div');
      box.className = 'ad-slot';
      box.textContent = `Espacio de anuncio (${placement}) — configura ADSENSE_CLIENT en js/ads.js`;
      container.appendChild(box);
    }
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'ad-slot';
  wrap.style.border = 'none';
  wrap.style.padding = '0';

  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.display = 'block';
  ins.setAttribute('data-ad-client', ADSENSE_CLIENT);
  ins.setAttribute('data-ad-slot', AD_SLOTS[placement] || '');
  ins.setAttribute('data-ad-format', 'auto');
  ins.setAttribute('data-full-width-responsive', 'true');
  wrap.appendChild(ins);
  container.appendChild(wrap);

  loadScript().then(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      /* silencioso: AdSense puede fallar en dev/ad-blockers, no debe romper la app */
    }
  });
}

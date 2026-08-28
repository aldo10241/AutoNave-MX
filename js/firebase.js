// Inicializa Firebase (Auth + Firestore) usando los módulos oficiales servidos
// desde el CDN de Google — sin npm ni bundler, funciona directo en el navegador.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app-check.js';
import { firebaseConfig, isFirebaseConfigured, RECAPTCHA_SITE_KEY } from './firebaseConfig.js';

export const firebaseReady = isFirebaseConfigured();

let _auth = null;
let _db = null;
let _storage = null;

if (firebaseReady) {
  const app = initializeApp(firebaseConfig);
  _auth = getAuth(app);
  try {
    // Cache local persistente: la app sigue funcionando sin internet y se
    // sincroniza sola en cuanto vuelve la conexión.
    _db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (e) {
    _db = getFirestore(app);
  }
  _storage = getStorage(app);

  // Protección anti-bots gratuita (ver README → "Bloquear bots en el
  // registro"). Mientras no configures tu llave de reCAPTCHA, se omite sin
  // romper nada.
  if (RECAPTCHA_SITE_KEY && !RECAPTCHA_SITE_KEY.startsWith('TU_')) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (e) {
      /* si falla, la app sigue funcionando sin App Check */
    }
  }
}

export const auth = _auth;
export const db = _db;
export const storage = _storage;

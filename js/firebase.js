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
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig.js';

export const firebaseReady = isFirebaseConfigured();

let _auth = null;
let _db = null;

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
}

export const auth = _auth;
export const db = _db;

// Configuración de tu backend gratuito (Firebase). Ver README.md → sección
// "Login y datos en la nube (Firebase)" para el paso a paso completo.
//
// Resumen:
// 1. Crea un proyecto gratis en https://console.firebase.google.com
// 2. Dentro del proyecto: ⚙️ → "Configuración del proyecto" → pestaña "Apps"
//    → agrega una app Web (</>) → copia el objeto "firebaseConfig" que te
//    muestra y pégalo abajo, reemplazando todo este objeto de ejemplo.
// 3. Activa "Authentication" → método "Correo/contraseña" y "Google".
// 4. Activa "Firestore Database" (modo producción) y pega las reglas de
//    seguridad que están en el README.
//
// Mientras estos valores sigan siendo los de ejemplo, la app muestra una
// pantalla de ayuda en vez de intentar conectarse (para no romperse).

export const firebaseConfig = {
  apiKey: "AIzaSyBwyOkGWj1lBiNo1YJB3jibE57D7KcORuI",
  authDomain: "autonave-mx.firebaseapp.com",
  projectId: "autonave-mx",
  storageBucket: "autonave-mx.firebasestorage.app",
  messagingSenderId: "784786733057",
  appId: "1:784786733057:web:8c61159622d3e69c42e800",
  measurementId: "G-GW3LF4CSC2"
};

export function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== 'TU_API_KEY' && !!firebaseConfig.apiKey;
}

// Bloquear bots en el registro (gratis) con Firebase App Check + reCAPTCHA v3.
// Es invisible para la gente real — normalmente no les pide resolver nada.
// 1. Ve a https://www.google.com/recaptcha/admin/create y registra tu sitio
//    con reCAPTCHA v3, dominio autonavemx.com (y localhost para probar).
//    Te da una "Clave del sitio" (pública) y una "Clave secreta" (privada).
// 2. En Firebase Console → ⚙️ Configuración del proyecto → App Check →
//    registra tu app web con el proveedor reCAPTCHA v3, pegando ahí la
//    clave SECRETA (esa nunca va en este archivo).
// 3. Pega aquí abajo la clave del SITIO (la pública).
// 4. En App Check → pestaña "APIs", marca "Enforce" para Authentication.
export const RECAPTCHA_SITE_KEY = '6Ldq-IstAAAAANac5VppucYNQDCXg4xckweA5600';
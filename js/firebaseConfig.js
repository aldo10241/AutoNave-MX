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

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
  apiKey: 'TU_API_KEY',
  authDomain: 'TU_PROYECTO.firebaseapp.com',
  projectId: 'TU_PROYECTO',
  storageBucket: 'TU_PROYECTO.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000000000',
};

export function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== 'TU_API_KEY' && !!firebaseConfig.apiKey;
}

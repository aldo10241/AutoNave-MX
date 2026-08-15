// Enlace de donación/propina opcional (Ko-fi, PayPal.me, Mercado Pago, etc.)
// Aparece como un botón discreto en "Más" solo si configuras una URL aquí.
//
// CÓMO ACTIVARLO:
// 1. Crea tu cuenta en alguno de estos (gratis, tú decides cuál):
//    - Ko-fi: https://ko-fi.com  → tu link queda como ko-fi.com/tunombre
//    - PayPal.me: https://paypal.me  → paypal.me/tunombre
//    - Mercado Pago (Link de pago): dentro de tu cuenta de Mercado Pago
// 2. Pega esa URL completa abajo, reemplazando el valor de ejemplo.
//
// Mientras DONATION_URL siga vacío, el botón no aparece (no molesta a nadie).

export const DONATION_URL = '';

export function isDonationConfigured() {
  return !!DONATION_URL && DONATION_URL.startsWith('http');
}

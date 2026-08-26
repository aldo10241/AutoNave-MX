// Enlace de donación/propina opcional. Aparece como un botón en "Más" solo
// si configuras una URL aquí abajo.
//
// RECOMENDADO — Stripe Payment Link: cobra en pesos mexicanos, muestra el
// checkout con "Link" (autocompletado) y no necesita servidor propio.
// Ver README.md → "Donaciones" para el paso a paso completo.
// También funcionan enlaces simples como Ko-fi o PayPal.me, pero solo un
// Payment Link de Stripe con "página de éxito" configurada como se explica
// en el README puede mostrar el agradecimiento automático al volver.
//
// Mientras DONATION_URL siga vacío, el botón no aparece (no molesta a nadie).

export const DONATION_URL = 'https://donate.stripe.com/dRm7sMbNqept1zX9ewa3u00';

export function isDonationConfigured() {
  return !!DONATION_URL && DONATION_URL.startsWith('http');
}

// Parámetro que Stripe debe agregar a la URL de éxito para mostrar el
// agradecimiento al volver. Ver README para configurarlo en Stripe.
export const DONATION_RETURN_PARAM = 'gracias';

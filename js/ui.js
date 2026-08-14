// Pequeños helpers de interfaz reutilizados por las vistas: topbar y sheets (modales).
import { el, money, formatTime, escapeHtml } from './utils.js';

export function renderTopbar({ title, onBack, actionIcon, onAction, actionIcon2, onAction2 }) {
  const bar = el(`<div class="topbar">
    ${onBack ? `<button class="back" aria-label="Volver">←</button>` : ''}
    <h1>${title}</h1>
    <div class="spacer"></div>
    ${actionIcon2 ? `<button class="action" id="topbarAction2">${actionIcon2}</button>` : ''}
    ${actionIcon ? `<button class="action" id="topbarAction">${actionIcon}</button>` : ''}
  </div>`);
  if (onBack) bar.querySelector('.back').addEventListener('click', onBack);
  if (actionIcon && onAction) bar.querySelector('#topbarAction').addEventListener('click', onAction);
  if (actionIcon2 && onAction2) bar.querySelector('#topbarAction2').addEventListener('click', onAction2);
  return bar;
}

let currentOverlay = null;

export function closeSheet() {
  if (currentOverlay) {
    currentOverlay.remove();
    currentOverlay = null;
  }
}

/**
 * Abre una hoja inferior (bottom sheet). `bodyNode` puede ser un string HTML o un Node.
 * Devuelve el nodo raíz del sheet para que el llamador pueda buscar elementos dentro.
 */
export function openSheet(title, bodyNode, { onClose } = {}) {
  closeSheet();
  const overlay = el(`<div class="sheet-overlay">
    <div class="sheet">
      <div class="sheet-header">
        <h2>${title}</h2>
        <button class="close" aria-label="Cerrar">✕</button>
      </div>
      <div class="sheet-body"></div>
    </div>
  </div>`);
  const body = overlay.querySelector('.sheet-body');
  if (typeof bodyNode === 'string') {
    body.innerHTML = bodyNode;
  } else if (bodyNode) {
    body.appendChild(bodyNode);
  }
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeSheet();
      if (onClose) onClose();
    }
  });
  overlay.querySelector('.close').addEventListener('click', () => {
    closeSheet();
    if (onClose) onClose();
  });
  document.body.appendChild(overlay);
  currentOverlay = overlay;
  return overlay;
}

export function emptyState(emoji, title, text) {
  return `<div class="empty">
    <div class="big-emoji">${emoji}</div>
    <h3>${title}</h3>
    <p>${text}</p>
  </div>`;
}

/**
 * Tarjeta de ticket con motivo de "boleto perforado". Usada en Tickets e Historial.
 */
export function renderTicketRow(t, onClick) {
  const statusClass = t.status === 'closed' ? 'status-closed' : 'status-open';
  const card = el(`
    <button class="ticket-card ticket-row ${statusClass}" style="text-align:left;">
      <div class="ticket-stub"><span class="ticket-emoji">${t.vehicleEmoji || '🚗'}</span></div>
      <div class="ticket-perf" aria-hidden="true"></div>
      <div class="ticket-body">
        <div class="ticket-id">${escapeHtml(t.shortId)}${t.plate ? ' · ' + escapeHtml(t.plate) : ''}</div>
        <div class="ticket-meta">${escapeHtml(t.vehicleTypeName)} · ${escapeHtml(t.washerName || 'Sin asignar')}</div>
      </div>
      <div class="ticket-side">
        <div class="ticket-amount">${money(t.total)}</div>
        <span class="stamp ${t.status === 'open' ? 'stamp-open' : 'stamp-closed'}">${t.status === 'open' ? 'Abierto' : formatTime(t.closedAt)}</span>
      </div>
    </button>
  `);
  card.addEventListener('click', () => onClick(t));
  return card;
}

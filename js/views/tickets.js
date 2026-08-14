import { DB } from '../db.js';
import { state } from '../store.js';
import { todayStr, money, el } from '../utils.js';
import { emptyState, renderTicketRow } from '../ui.js';
import { openNewTicketSheet, openCloseTicketSheet, openTicketDetailSheet } from './ticketModal.js';
import { canInstall, promptInstall, isStandalone, onInstallAvailabilityChange } from '../install.js';

export function render(container) {
  const s = state.settings;
  const root = el(`
    <div>
      <div class="topbar"><h1>Tickets</h1><div class="spacer"></div></div>
      <div class="view" id="tickets-view"></div>
      <button class="fab" id="fab-new" aria-label="Nuevo ticket">+</button>
    </div>
  `);
  container.appendChild(root);
  const viewEl = root.querySelector('#tickets-view');

  root.querySelector('#fab-new').addEventListener('click', () => {
    openNewTicketSheet({ onCreated: () => refresh() });
  });

  const unsubInstall = onInstallAvailabilityChange(() => refresh());

  function openTicket(t) {
    if (t.status === 'open') openCloseTicketSheet(t, { onUpdated: refresh });
    else openTicketDetailSheet(t);
  }

  async function refresh() {
    const date = todayStr();
    const [todayTickets, day] = await Promise.all([DB.getTicketsByDate(date), DB.getDay(date)]);
    const reserve = day ? day.cashReserveStart : s.cashReserve;

    const closed = todayTickets.filter((t) => t.status === 'closed');
    const open = todayTickets.filter((t) => t.status === 'open').sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));

    let cash = 0, digital = 0;
    closed.forEach((t) => {
      if (t.paymentMethod === 'efectivo') cash += t.total;
      else if (t.paymentMethod === 'digital') digital += t.total;
      else if (t.paymentMethod === 'mixto') { cash += t.total / 2; digital += t.total / 2; }
      // 'credito' queda pendiente de cobro, no entra a caja todavía
    });
    const totalDia = cash + digital;

    viewEl.innerHTML = '';

    if (canInstall() && !isStandalone()) {
      const banner = el(`<div class="install-banner">
        <span class="e">📲</span>
        <span class="t">Instala la app en tu celular para usarla más rápido y sin internet.</span>
        <button class="btn btn-primary btn-sm" id="install-btn">Instalar</button>
      </div>`);
      banner.querySelector('#install-btn').addEventListener('click', async () => {
        await promptInstall();
        refresh();
      });
      viewEl.appendChild(banner);
    }

    viewEl.appendChild(el(`
      <div class="hero">
        <div class="label">Total del día</div>
        <div class="amount">${money(totalDia)}</div>
        <div class="sub">Reserva: ${money(reserve)}</div>
      </div>
    `));

    viewEl.appendChild(el(`
      <div class="section-title">Caja en tiempo real</div>
      <div class="grid-2">
        <div class="stat-card green"><div class="icon">💵</div><div class="label">Efectivo</div><div class="value">${money(cash)}</div></div>
        <div class="stat-card purple"><div class="icon">📱</div><div class="label">Pago digital</div><div class="value">${money(digital)}</div></div>
      </div>
    `));

    const activeSection = el(`<div><div class="section-title">Tickets activos (${open.length})</div><div class="list" id="open-list"></div></div>`);
    viewEl.appendChild(activeSection);
    const openList = activeSection.querySelector('#open-list');
    if (open.length === 0) {
      openList.innerHTML = emptyState('🚗', 'Sin tickets activos', 'Toca el botón + para registrar un nuevo lavado.');
    } else {
      open.forEach((t) => openList.appendChild(renderTicketRow(t, openTicket)));
    }

    if (closed.length) {
      const closedSection = el(`<div><div class="section-title">Historial de hoy (${closed.length})</div><div class="list" id="closed-list"></div></div>`);
      viewEl.appendChild(closedSection);
      const closedList = closedSection.querySelector('#closed-list');
      closed
        .sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt))
        .forEach((t) => closedList.appendChild(renderTicketRow(t, openTicket)));
    }
  }

  refresh();
  return () => unsubInstall();
}

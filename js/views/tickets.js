import { DB } from '../db.js';
import { state } from '../store.js';
import { todayStr, money, toast, el, escapeHtml } from '../utils.js';
import { emptyState, renderTicketRow, renderApptCard } from '../ui.js';
import { openNewTicketSheet, openCloseTicketSheet, openTicketDetailSheet } from './ticketModal.js';
import { canInstall, promptInstall, isStandalone, onInstallAvailabilityChange } from '../install.js';

const HISTORY_PREVIEW_LIMIT = 5;

export function render(container, { navigate }) {
  const s = state.settings;
  const displayName = (s.businessName || 'tu carwash').split(' ')[0];
  const initial = (s.businessName || 'A').trim().charAt(0).toUpperCase();

  const root = el(`
    <div>
      <div class="greeting-header">
        <div class="greeting-avatar">${initial}</div>
        <div class="greeting-text">
          <div class="greeting-hello">Hola,</div>
          <div class="greeting-name">${escapeHtml(displayName)}</div>
        </div>
        <button class="greeting-bell" id="bell-btn" aria-label="Avisos">
          🔔<span class="dot" id="bell-dot" style="display:none;"></span>
        </button>
      </div>
      <button class="search-bar" id="search-shortcut" style="text-align:left;">
        <span class="ic">🔎</span>
        <span class="subtext" style="margin:0;">Buscar ticket o placa...</span>
      </button>
      <div class="view" id="tickets-view"></div>
      <button class="fab" id="fab-new" aria-label="Nuevo ticket">+</button>
    </div>
  `);
  container.appendChild(root);
  const viewEl = root.querySelector('#tickets-view');

  root.querySelector('#fab-new').addEventListener('click', () => {
    openNewTicketSheet({ onCreated: () => refresh() });
  });
  root.querySelector('#search-shortcut').addEventListener('click', () => navigate('/more/history'));
  root.querySelector('#bell-btn').addEventListener('click', async () => {
    const open = await DB.getOpenTickets();
    toast(open.length ? `Tienes ${open.length} ticket(s) abiertos` : 'No tienes tickets pendientes', '');
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

    const closed = todayTickets.filter((t) => t.status === 'closed').sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));
    const open = todayTickets.filter((t) => t.status === 'open').sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));

    let cash = 0, digital = 0;
    closed.forEach((t) => {
      if (t.paymentMethod === 'efectivo') cash += t.total;
      else if (t.paymentMethod === 'digital') digital += t.total;
      else if (t.paymentMethod === 'mixto') { cash += t.total / 2; digital += t.total / 2; }
    });
    const totalDia = cash + digital;

    root.querySelector('#bell-dot').style.display = open.length ? 'block' : 'none';

    viewEl.innerHTML = '';

    if (canInstall() && !isStandalone()) {
      const banner = el(`<div class="install-banner">
        <span class="e">📲</span>
        <span class="t">Instala AutoNave MX en tu celular para usarla más rápido y sin internet.</span>
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

    // Inicio rápido: elegir el tipo abre el sheet de nuevo ticket con ese tipo ya elegido.
    if (s.vehicleTypes.length) {
      viewEl.appendChild(el(`<div class="section-title">Registrar lavado</div>`));
      const quickRow = el(`<div class="quick-row"></div>`);
      s.vehicleTypes.forEach((v) => {
        const chip = el(`<button class="quick-chip"><div class="e">${v.emoji}</div><div class="t">${escapeHtml(v.name)}</div></button>`);
        chip.addEventListener('click', () => openNewTicketSheet({ onCreated: () => refresh(), initialTypeId: v.id }));
        quickRow.appendChild(chip);
      });
      viewEl.appendChild(quickRow);
    }

    // Tickets activos, en carrusel horizontal (lo más accionable).
    const activeTitle = el(`<div class="section-title"><span>Tickets activos (${open.length})</span></div>`);
    viewEl.appendChild(activeTitle);
    if (open.length === 0) {
      const empty = el(`<div class="empty-carousel">
        <span class="e">🚗</span>
        <span class="subtext">Sin vehículos en el patio ahora mismo.</span>
      </div>`);
      const wrap = el(`<div class="hscroll"></div>`);
      wrap.appendChild(empty);
      viewEl.appendChild(wrap);
    } else {
      const hscroll = el(`<div class="hscroll"></div>`);
      open.forEach((t) => hscroll.appendChild(renderApptCard(t, openTicket)));
      viewEl.appendChild(hscroll);
    }

    // Caja del día.
    viewEl.appendChild(el(`
      <div class="section-title">Caja en tiempo real</div>
      <div class="grid-2">
        <div class="stat-card green"><div class="icon">💵</div><div class="label">Efectivo</div><div class="value">${money(cash)}</div></div>
        <div class="stat-card purple"><div class="icon">📱</div><div class="label">Pago digital</div><div class="value">${money(digital)}</div></div>
      </div>
    `));

    if (closed.length) {
      const title = el(`<div class="section-title"><span>Historial de hoy (${closed.length})</span>${closed.length > HISTORY_PREVIEW_LIMIT ? '<button class="see-all" id="hist-see-all">Ver todo</button>' : ''}</div>`);
      viewEl.appendChild(title);
      const seeAll = title.querySelector('#hist-see-all');
      if (seeAll) seeAll.addEventListener('click', () => navigate('/more/history'));

      const closedList = el(`<div class="list"></div>`);
      closed.slice(0, HISTORY_PREVIEW_LIMIT).forEach((t) => closedList.appendChild(renderTicketRow(t, openTicket)));
      viewEl.appendChild(closedList);
    }
  }

  refresh();
  return () => unsubInstall();
}

import { DB } from '../db.js';
import { todayStr, addDays, formatDateShort, el } from '../utils.js';
import { renderTopbar, emptyState, renderTicketRow } from '../ui.js';
import { openCloseTicketSheet, openTicketDetailSheet } from './ticketModal.js';

export function render(container, { navigate }) {
  let range = 'week';
  let query = '';

  const root = el(`<div></div>`);
  root.appendChild(renderTopbar({ title: 'Historial', onBack: () => navigate('/more') }));
  const view = el(`
    <div class="view">
      <div class="search-bar-inline">
        <span>🔎</span>
        <input id="hi-search" type="text" placeholder="Buscar por placa o ticket..." />
      </div>
      <div class="tabs" id="hi-tabs">
        <button data-r="week" class="active">7 días</button>
        <button data-r="month">Este mes</button>
        <button data-r="all">Todo</button>
      </div>
      <div class="list" id="hi-list"></div>
    </div>
  `);
  root.appendChild(view);
  container.appendChild(root);

  const list = view.querySelector('#hi-list');

  view.querySelector('#hi-search').addEventListener('input', (e) => {
    query = e.target.value.trim().toLowerCase();
    refresh();
  });
  view.querySelectorAll('#hi-tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      view.querySelectorAll('#hi-tabs button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      range = btn.dataset.r;
      refresh();
    });
  });

  async function refresh() {
    let tickets;
    const today = todayStr();
    if (range === 'week') tickets = await DB.getTicketsInRange(addDays(today, -6), today);
    else if (range === 'month') tickets = await DB.getTicketsInRange(today.slice(0, 8) + '01', today);
    else tickets = await DB.getAllTickets();

    tickets.sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));

    if (query) {
      tickets = tickets.filter((t) =>
        (t.plate || '').toLowerCase().includes(query) || (t.shortId || '').toLowerCase().includes(query)
      );
    }

    list.innerHTML = '';
    if (tickets.length === 0) {
      list.innerHTML = emptyState('🕘', 'Sin resultados', 'No hay tickets en este rango o búsqueda.');
      return;
    }

    let lastDate = null;
    tickets.forEach((t) => {
      if (t.date !== lastDate) {
        lastDate = t.date;
        list.appendChild(el(`<div class="subtext" style="font-weight:800; margin-top:8px;">${formatDateShort(t.date)}</div>`));
      }
      list.appendChild(renderTicketRow(t, (ticket) => {
        if (ticket.status === 'open') openCloseTicketSheet(ticket, { onUpdated: refresh });
        else openTicketDetailSheet(ticket);
      }));
    });
  }

  refresh();
}

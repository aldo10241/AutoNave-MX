import { DB } from '../db.js';
import { state } from '../store.js';
import { todayStr, addDays, formatDateLong, money, toast, el, escapeHtml } from '../utils.js';
import { openExpenseSheet, categoryLabel } from './expenseModal.js';

export function render(container, { navigate }) {
  const s = state.settings;
  let currentDate = todayStr();

  const root = el(`
    <div>
      <div class="topbar"><h1>Día</h1><div class="spacer"></div>
        <button class="action" id="day-expense" title="Registrar gasto">➕</button>
      </div>
      <div class="view">
        <div class="row mb16">
          <button class="btn btn-ghost btn-sm" id="day-prev">← Anterior</button>
          <strong id="day-label" style="font-size:13px; text-align:center; flex:1;"></strong>
          <button class="btn btn-ghost btn-sm" id="day-next">Siguiente →</button>
        </div>
        <div id="day-content"></div>
      </div>
    </div>
  `);
  container.appendChild(root);

  const content = root.querySelector('#day-content');
  const label = root.querySelector('#day-label');

  root.querySelector('#day-prev').addEventListener('click', () => { currentDate = addDays(currentDate, -1); refresh(); });
  root.querySelector('#day-next').addEventListener('click', () => {
    if (currentDate >= todayStr()) return;
    currentDate = addDays(currentDate, 1);
    refresh();
  });
  root.querySelector('#day-expense').addEventListener('click', () => openExpenseSheet(currentDate, refresh));

  async function refresh() {
    label.textContent = formatDateLong(currentDate);
    root.querySelector('#day-next').disabled = currentDate >= todayStr();

    const [tickets, expenses, day] = await Promise.all([
      DB.getTicketsByDate(currentDate),
      DB.getExpensesByDate(currentDate),
      DB.getDay(currentDate),
    ]);

    const reserve = day ? day.cashReserveStart : s.cashReserve;
    const closed = tickets.filter((t) => t.status === 'closed');

    let cash = 0, digital = 0;
    closed.forEach((t) => {
      if (t.paymentMethod === 'efectivo') cash += t.total;
      else if (t.paymentMethod === 'digital') digital += t.total;
      else if (t.paymentMethod === 'mixto') { cash += t.total / 2; digital += t.total / 2; }
    });

    // Solo lo pagado en efectivo sale físicamente de la caja.
    const gastosEfectivo = expenses.filter((e) => e.paymentMethod === 'efectivo').reduce((sum, e) => sum + e.amount, 0);
    const totalCaja = reserve + cash - gastosEfectivo;
    const ingresoTotal = closed.reduce((sum, t) => sum + t.total, 0);
    const serviciosAdic = closed.reduce((sum, t) => sum + (t.services || []).length, 0);
    const ventasSueltas = closed.reduce((sum, t) => sum + (t.extraItems || []).length, 0);

    content.innerHTML = '';
    content.appendChild(el(`
      <div class="card">
        <p class="subtext mb8">Total en caja</p>
        <h2 style="font-size:30px; font-weight:800;">${money(totalCaja)}</h2>
        <div class="divider"></div>
        <div class="row"><span class="subtext">+ Reserva inicial</span><span style="color:var(--green); font-weight:800;">${money(reserve)}</span></div>
        <div class="row"><span class="subtext">+ Cobros en efectivo</span><span style="color:var(--green); font-weight:800;">${money(cash)}</span></div>
        <div class="row"><span class="subtext">− Gastos pagados en efectivo</span><span style="color:var(--red); font-weight:800;">−${money(gastosEfectivo)}</span></div>
        <div class="divider"></div>
        <div class="row"><strong>Total efectivo en caja</strong><strong>${money(totalCaja)}</strong></div>
      </div>

      <div class="section-title">Resumen del día</div>
      <div class="grid-3 mb16">
        <div class="stat-card blue"><div class="icon">🚗</div><div class="label">Carros lavados</div><div class="value">${closed.length}</div></div>
        <div class="stat-card orange"><div class="icon">✨</div><div class="label">Servicios adic.</div><div class="value">${serviciosAdic}</div></div>
        <div class="stat-card purple"><div class="icon">🛍️</div><div class="label">Ventas sueltas</div><div class="value">${ventasSueltas}</div></div>
      </div>

      <div class="card row">
        <div>
          <p class="subtext">Ingresos totales del día</p>
          <h3 style="font-size:22px; font-weight:800;">${money(ingresoTotal)}</h3>
        </div>
        <button class="btn btn-outline btn-sm" id="day-detail">Ver detalle →</button>
      </div>

      <div class="section-title"><span>Gastos${expenses.length ? ` (${expenses.length})` : ''}</span></div>
      ${expenses.length ? '<div class="list" id="expense-list"></div>' : `
        <button class="card" id="day-expense-empty" style="text-align:left; width:100%; display:flex; align-items:center; gap:12px;">
          <span style="font-size:22px;">➕</span>
          <div>
            <p style="font-weight:800; font-size:14.5px;">Registra tu primer gasto del día</p>
            <p class="subtext">Insumos, sueldos, propinas u otros — toca para agregarlo.</p>
          </div>
        </button>
      `}

      ${currentDate === todayStr() ? `
        <button class="btn btn-primary mt20" id="day-close">✓ Cerrar día</button>
        <p class="subtext center mt8">Al terminar la jornada, cierra el día para dejar guardado el resumen de hoy (caja, ingresos y lavados). Puedes seguir viéndolo después.</p>
      ` : `<div class="badge closed center mt16" style="display:block;">${day && day.closed ? 'Día cerrado ✓' : 'Día sin cerrar'}</div>`}
    `));

    const emptyBtn = content.querySelector('#day-expense-empty');
    if (emptyBtn) emptyBtn.addEventListener('click', () => openExpenseSheet(currentDate, refresh));

    if (expenses.length) {
      const list = content.querySelector('#expense-list');
      expenses
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .forEach((e) => {
          const cat = categoryLabel(e.category);
          const row = el(`<div class="row" style="background:var(--surface); box-shadow:var(--shadow-sm); border-radius:var(--radius-sm); padding:11px 13px;">
            <div style="min-width:0;">
              <div style="font-weight:700; font-size:13.5px;">${cat.e} ${escapeHtml(e.concept)}</div>
              <div class="subtext">${cat.t} · ${e.paymentMethod === 'efectivo' ? '💵 Efectivo' : '📱 Digital'}${e.note ? ' · ' + escapeHtml(e.note) : ''}</div>
            </div>
            <span class="flex gap8" style="flex-shrink:0;">
              <strong>${money(e.amount)}</strong>
              <button style="color:var(--text-faint);" data-id="${e.id}">✕</button>
            </span>
          </div>`);
          row.querySelector('button').addEventListener('click', async () => {
            await DB.deleteExpense(e.id);
            refresh();
          });
          list.appendChild(row);
        });
    }

    const detailBtn = content.querySelector('#day-detail');
    if (detailBtn) detailBtn.addEventListener('click', () => navigate('/more/history'));

    const closeBtn = content.querySelector('#day-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', async () => {
        if (!confirm('¿Cerrar el día de hoy? Se guardará un resumen con los totales actuales.')) return;
        await DB.saveDay({
          date: currentDate,
          closed: true,
          cashReserveStart: reserve,
          closedAt: new Date().toISOString(),
          summary: { cash, digital, totalCaja, ingresoTotal, carsWashed: closed.length },
        });
        toast('Día cerrado. ¡Buen trabajo!', 'success');
        refresh();
      });
    }
  }

  refresh();
}

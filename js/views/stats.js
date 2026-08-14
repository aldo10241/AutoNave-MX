import { DB } from '../db.js';
import { state } from '../store.js';
import { todayStr, addDays, money, toCSV, downloadFile, el } from '../utils.js';
import { mountAd } from '../ads.js';

export function render(container) {
  const s = state.settings;
  let range = 'today';
  let customStart = todayStr();
  let customEnd = todayStr();

  const root = el(`
    <div>
      <div class="topbar"><h1>Estadísticas</h1><div class="spacer"></div>
        <button class="action" id="st-export" title="Exportar CSV">⬇️</button>
      </div>
      <div class="view">
        <div class="tabs" id="st-tabs">
          <button data-r="today" class="active">Hoy</button>
          <button data-r="week">7 días</button>
          <button data-r="month">Este mes</button>
          <button data-r="custom">Rango</button>
        </div>
        <div class="grid-2 mb16" id="st-custom" style="display:none;">
          <div class="field"><label>Desde</label><input type="date" id="st-start" /></div>
          <div class="field"><label>Hasta</label><input type="date" id="st-end" /></div>
        </div>
        <div id="st-content"></div>
      </div>
    </div>
  `);
  container.appendChild(root);

  const content = root.querySelector('#st-content');

  root.querySelectorAll('#st-tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('#st-tabs button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      range = btn.dataset.r;
      root.querySelector('#st-custom').style.display = range === 'custom' ? 'grid' : 'none';
      refresh();
    });
  });
  root.querySelector('#st-start').addEventListener('change', (e) => { customStart = e.target.value; refresh(); });
  root.querySelector('#st-end').addEventListener('change', (e) => { customEnd = e.target.value; refresh(); });
  root.querySelector('#st-start').value = customStart;
  root.querySelector('#st-end').value = customEnd;

  function getRangeDates() {
    const today = todayStr();
    if (range === 'today') return [today, today];
    if (range === 'week') return [addDays(today, -6), today];
    if (range === 'month') return [today.slice(0, 8) + '01', today];
    return [customStart, customEnd];
  }

  root.querySelector('#st-export').addEventListener('click', async () => {
    const [start, end] = getRangeDates();
    const tickets = await DB.getTicketsInRange(start, end);
    const rows = [['Fecha', 'Hora cierre', 'Ticket', 'Placa', 'Vehículo', 'Lavador', 'Lavado', 'Servicios', 'Consumo', 'Total', 'Pago', 'Estado']];
    tickets.forEach((t) => {
      rows.push([
        t.date,
        t.closedAt ? new Date(t.closedAt).toLocaleTimeString('es-ES') : '',
        t.shortId,
        t.plate || '',
        t.vehicleTypeName,
        t.washerName || '',
        t.basePrice,
        (t.services || []).reduce((sum, x) => sum + x.price, 0),
        (t.extraItems || []).reduce((sum, x) => sum + x.price, 0),
        t.total,
        t.paymentMethod,
        t.status,
      ]);
    });
    downloadFile(`reporte_${start}_a_${end}.csv`, toCSV(rows), 'text/csv');
  });

  async function refresh() {
    const [start, end] = getRangeDates();
    const [tickets, expenses] = await Promise.all([
      DB.getTicketsInRange(start, end),
      DB.getExpensesInRange(start, end),
    ]);
    const closed = tickets.filter((t) => t.status === 'closed');
    const totalBruto = closed.reduce((sum, t) => sum + t.total, 0);
    const totalGastos = expenses.reduce((sum, e) => sum + e.amount, 0);
    const ganancia = totalBruto - totalGastos;
    const ingresoLavados = closed.reduce((sum, t) => sum + t.basePrice, 0);
    const ingresoServicios = closed.reduce((sum, t) => sum + (t.services || []).reduce((a, x) => a + x.price, 0), 0);
    const ingresoConsumo = closed.reduce((sum, t) => sum + (t.extraItems || []).reduce((a, x) => a + x.price, 0), 0);
    let cash = 0, digital = 0;
    closed.forEach((t) => {
      if (t.paymentMethod === 'efectivo') cash += t.total;
      else if (t.paymentMethod === 'digital') digital += t.total;
      else if (t.paymentMethod === 'mixto') { cash += t.total / 2; digital += t.total / 2; }
    });

    // últimos 7 días (siempre, independiente del rango elegido)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(todayStr(), -i);
      const dayTickets = tickets.filter((t) => t.date === d && t.status === 'closed');
      days.push({ date: d, total: dayTickets.reduce((s, t) => s + t.total, 0), count: dayTickets.length });
    }
    const allDaysTickets = await Promise.all(days.map((d) => DB.getTicketsByDate(d.date)));
    days.forEach((d, i) => {
      const closedForDay = allDaysTickets[i].filter((t) => t.status === 'closed');
      d.total = closedForDay.reduce((s, t) => s + t.total, 0);
      d.count = closedForDay.length;
    });
    const maxTotal = Math.max(1, ...days.map((d) => d.total));
    const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    content.innerHTML = '';
    content.appendChild(el(`
      <div class="grid-3 mb16">
        <div class="stat-card blue"><div class="label">Total bruto</div><div class="value">${money(totalBruto)}</div></div>
        <div class="stat-card orange"><div class="label">Total gastos</div><div class="value">${money(totalGastos)}</div></div>
        <div class="stat-card green"><div class="label">Ganancia</div><div class="value">${money(ganancia)}</div></div>
      </div>

      <div class="card">
        <div class="row"><strong>🚗 Carros lavados</strong><strong>${closed.length}</strong></div>
        <div class="divider"></div>
        <div class="row"><span class="subtext">Ingreso por lavados</span><span>${money(ingresoLavados)}</span></div>
        <div class="row"><span class="subtext">Ingreso por servicios adicionales</span><span>${money(ingresoServicios)}</span></div>
        <div class="row"><span class="subtext">Ingreso por consumo adicional</span><span>${money(ingresoConsumo)}</span></div>
      </div>

      <div class="grid-3 mb16">
        <div class="stat-card"><div class="label">Efectivo</div><div class="value">${money(cash)}</div></div>
        <div class="stat-card"><div class="label">Digital</div><div class="value">${money(digital)}</div></div>
        <div class="stat-card"><div class="label">Reserva</div><div class="value">${money(s.cashReserve)}</div></div>
      </div>

      <div class="card">
        <p class="subtext mb8">Últimos 7 días</p>
        <div class="bars" id="st-bars"></div>
        <p class="subtext center mt8">Barras = ingresos · número = carros</p>
      </div>
      <div id="st-ad"></div>
    `));

    const barsWrap = content.querySelector('#st-bars');
    days.forEach((d) => {
      const h = Math.round((d.total / maxTotal) * 90) + 4;
      const dow = new Date(d.date + 'T00:00:00').getDay();
      barsWrap.appendChild(el(`
        <div class="bar-wrap">
          <span class="bar-value">${d.count}</span>
          <div class="bar" style="height:${h}px;"></div>
          <span class="bar-label">${dayLabels[dow]}</span>
        </div>
      `));
    });

    mountAd(content.querySelector('#st-ad'), 'stats');
  }

  refresh();
}

import { DB } from '../db.js';
import { state } from '../store.js';
import { todayStr, addDays, formatDateLong, formatTime, uid, toast, el, escapeHtml } from '../utils.js';
import { openSheet, closeSheet, emptyState } from '../ui.js';

export function render(container) {
  const s = state.settings;
  let currentDate = todayStr();

  const root = el(`
    <div>
      <div class="topbar"><h1>Asistencia</h1><div class="spacer"></div>
        <button class="action" id="at-summary-btn" title="Resumen de horas">📊</button>
      </div>
      <div class="view">
        <div class="row mb16">
          <button class="btn btn-ghost btn-sm" id="at-prev">← Anterior</button>
          <strong id="at-label" style="font-size:13px; text-align:center; flex:1;"></strong>
          <button class="btn btn-ghost btn-sm" id="at-next">Siguiente →</button>
        </div>
        <div class="list" id="at-list"></div>
        <p class="subtext center mt16" id="at-summary"></p>
      </div>
    </div>
  `);
  container.appendChild(root);

  const list = root.querySelector('#at-list');
  const label = root.querySelector('#at-label');
  const summary = root.querySelector('#at-summary');

  root.querySelector('#at-prev').addEventListener('click', () => { currentDate = addDays(currentDate, -1); refresh(); });
  root.querySelector('#at-next').addEventListener('click', () => {
    if (currentDate >= todayStr()) return;
    currentDate = addDays(currentDate, 1);
    refresh();
  });
  root.querySelector('#at-summary-btn').addEventListener('click', () => openSummarySheet(s));

  async function refresh() {
    label.textContent = formatDateLong(currentDate);
    root.querySelector('#at-next').disabled = currentDate >= todayStr();

    const workers = s.workers.filter((w) => w.active);
    const records = await DB.getAttendanceByDate(currentDate);
    const byWorker = Object.fromEntries(records.map((r) => [r.workerId, r]));

    list.innerHTML = '';
    if (workers.length === 0) {
      list.innerHTML = emptyState('👷', 'Sin trabajadores', 'Agrega trabajadores en Más → Trabajadores.');
      summary.textContent = '';
      return;
    }

    let present = 0;
    workers.forEach((w) => {
      const rec = byWorker[w.id];
      if (rec && rec.checkIn) present++;
      const statusText = !rec || !rec.checkIn
        ? 'Sin marcar'
        : !rec.checkOut
          ? `Entrada ${formatTime(rec.checkIn)}`
          : `${formatTime(rec.checkIn)} – ${formatTime(rec.checkOut)}`;

      const row = el(`
        <div class="row" style="background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:14px;">
          <div>
            <strong>🧽 ${escapeHtml(w.name)}</strong>
            <div class="subtext mt8">${statusText}</div>
          </div>
          <div class="flex gap8">
            <button class="btn btn-primary btn-sm" data-action="toggle">${!rec || !rec.checkIn ? '→ Entrada' : !rec.checkOut ? '← Salida' : '↺ Reiniciar'}</button>
            <button class="btn btn-ghost btn-sm" data-action="edit">✎</button>
          </div>
        </div>
      `);

      row.querySelector('[data-action="toggle"]').addEventListener('click', async () => {
        const now = new Date().toISOString();
        let updated;
        if (!rec || !rec.checkIn) {
          updated = { id: `${currentDate}_${w.id}`, date: currentDate, workerId: w.id, workerName: w.name, checkIn: now, checkOut: null };
        } else if (!rec.checkOut) {
          updated = { ...rec, checkOut: now };
        } else {
          updated = { ...rec, checkIn: null, checkOut: null };
        }
        await DB.upsertAttendance(updated);
        refresh();
      });

      row.querySelector('[data-action="edit"]').addEventListener('click', () => {
        openEditSheet(currentDate, w, rec, refresh);
      });

      list.appendChild(row);
    });

    summary.textContent = `Presentes: ${present} de ${workers.length}`;
  }

  refresh();
}

function openEditSheet(date, worker, rec, onSaved) {
  const toInputTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const body = el(`
    <div>
      <div class="field">
        <label>Entrada</label>
        <input id="ed-in" type="time" value="${toInputTime(rec?.checkIn)}" />
      </div>
      <div class="field">
        <label>Salida</label>
        <input id="ed-out" type="time" value="${toInputTime(rec?.checkOut)}" />
      </div>
      <button class="btn btn-primary" id="ed-save">Guardar</button>
      ${rec ? `<button class="btn btn-danger mt8" id="ed-clear">Borrar marcas de hoy</button>` : ''}
    </div>
  `);

  function toIso(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    const [y, mo, d] = date.split('-').map(Number);
    return new Date(y, mo - 1, d, h, m).toISOString();
  }

  body.querySelector('#ed-save').addEventListener('click', async () => {
    const checkIn = toIso(body.querySelector('#ed-in').value);
    const checkOut = toIso(body.querySelector('#ed-out').value);
    await DB.upsertAttendance({ id: `${date}_${worker.id}`, date, workerId: worker.id, workerName: worker.name, checkIn, checkOut });
    toast('Actualizado', 'success');
    closeSheet();
    onSaved();
  });

  const clearBtn = body.querySelector('#ed-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      await DB.upsertAttendance({ id: `${date}_${worker.id}`, date, workerId: worker.id, workerName: worker.name, checkIn: null, checkOut: null });
      closeSheet();
      onSaved();
    });
  }

  openSheet(`Asistencia — ${worker.name}`, body);
}

function formatHours(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function openSummarySheet(s) {
  let range = 'week';

  const body = el(`
    <div>
      <div class="tabs" id="sum-tabs">
        <button data-r="today">Hoy</button>
        <button data-r="week" class="active">7 días</button>
        <button data-r="month">Este mes</button>
      </div>
      <div class="list" id="sum-list"></div>
    </div>
  `);
  const list = body.querySelector('#sum-list');

  body.querySelectorAll('#sum-tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      body.querySelectorAll('#sum-tabs button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      range = btn.dataset.r;
      load();
    });
  });

  async function load() {
    const today = todayStr();
    const start = range === 'today' ? today : range === 'week' ? addDays(today, -6) : today.slice(0, 8) + '01';
    const records = await DB.getAttendanceInRange(start, today);
    const workers = s.workers.filter((w) => w.active);

    list.innerHTML = '';
    if (workers.length === 0) {
      list.innerHTML = emptyState('👷', 'Sin trabajadores', 'Agrega trabajadores en Más → Trabajadores.');
      return;
    }

    workers.forEach((w) => {
      const workerRecords = records.filter((r) => r.workerId === w.id);
      const diasPresente = workerRecords.filter((r) => r.checkIn).length;
      const minutos = workerRecords.reduce((sum, r) => {
        if (!r.checkIn || !r.checkOut) return sum;
        return sum + (new Date(r.checkOut) - new Date(r.checkIn)) / 60000;
      }, 0);
      list.appendChild(el(`
        <div class="row" style="background:var(--surface); box-shadow:var(--shadow-sm); border-radius:var(--radius-sm); padding:12px 14px;">
          <div>
            <strong>🧽 ${escapeHtml(w.name)}</strong>
            <div class="subtext mt8">${diasPresente} día(s) presente</div>
          </div>
          <strong style="font-variant-numeric:tabular-nums;">${formatHours(minutos)}</strong>
        </div>
      `));
    });
  }

  load();
  openSheet('Resumen de horas', body);
}

import { DB } from '../db.js';
import { uid, toast, el } from '../utils.js';
import { openSheet, closeSheet } from '../ui.js';

const CATEGORIES = [
  { id: 'insumos', e: '🧴', t: 'Insumos' },
  { id: 'sueldos', e: '👷', t: 'Sueldos' },
  { id: 'propinas', e: '💸', t: 'Propinas' },
  { id: 'otro', e: '📦', t: 'Otro' },
];

// Gastos registrados antes de agregar categorías/forma de pago (versión
// anterior) usaban 'gasto' | 'propina' y no tenían paymentMethod. Los
// mapeamos para que se sigan viendo bien y sigan contando en la caja.
const LEGACY_CATEGORY_MAP = { gasto: 'otro', propina: 'propinas' };

/**
 * Hoja para registrar un gasto (insumos, sueldos, propinas u otro).
 * Solo los gastos pagados en efectivo descuentan de la caja física del día.
 */
export function openExpenseSheet(date, onSaved) {
  let category = 'insumos';
  let paymentMethod = 'efectivo';

  const body = el(`
    <div>
      <div class="field">
        <label>Categoría</label>
        <div class="chip-grid" id="ex-cat" style="grid-template-columns:repeat(2,1fr);">
          ${CATEGORIES.map((c, i) => `
            <button type="button" class="chip${i === 0 ? ' selected' : ''}" data-c="${c.id}">
              <span class="e">${c.e}</span><span>${c.t}</span>
            </button>`).join('')}
        </div>
      </div>
      <div class="field">
        <label>Descripción</label>
        <input id="ex-concept" type="text" placeholder="¿En qué se gastó?" />
      </div>
      <div class="field">
        <label>Monto</label>
        <input id="ex-amount" type="number" inputmode="decimal" placeholder="0.00" />
      </div>
      <div class="field">
        <label>Forma de pago</label>
        <div class="pill-row" id="ex-pay">
          <button type="button" class="pill selected" data-p="efectivo">💵 Efectivo</button>
          <button type="button" class="pill" data-p="digital">📱 Pago digital</button>
        </div>
      </div>
      <div class="field">
        <label>Nota (opcional)</label>
        <input id="ex-note" type="text" placeholder="Detalle adicional..." />
      </div>
      <button class="btn btn-danger" id="ex-save">Registrar gasto</button>
    </div>
  `);

  body.querySelectorAll('#ex-cat .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      body.querySelectorAll('#ex-cat .chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      category = chip.dataset.c;
    });
  });
  body.querySelectorAll('#ex-pay .pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      body.querySelectorAll('#ex-pay .pill').forEach((p) => p.classList.remove('selected'));
      pill.classList.add('selected');
      paymentMethod = pill.dataset.p;
    });
  });

  body.querySelector('#ex-save').addEventListener('click', async () => {
    const concept = body.querySelector('#ex-concept').value.trim();
    const amount = Number(body.querySelector('#ex-amount').value);
    const note = body.querySelector('#ex-note').value.trim();
    if (!concept || !amount) return toast('Completa la descripción y el monto', 'error');
    await DB.addExpense({
      id: uid(), date, category, concept, amount, paymentMethod, note,
      createdAt: new Date().toISOString(),
    });
    toast('Gasto registrado', 'success');
    closeSheet();
    onSaved();
  });

  openSheet('Registrar gasto', body);
}

export function categoryLabel(id) {
  const resolved = LEGACY_CATEGORY_MAP[id] || id;
  return CATEGORIES.find((c) => c.id === resolved) || CATEGORIES[3];
}

/**
 * Los gastos guardados antes de que existiera "forma de pago" no tienen ese
 * campo. En ese entonces todo gasto salía de la caja, así que por
 * compatibilidad los seguimos tratando como efectivo.
 */
export function isCashExpense(e) {
  return (e.paymentMethod || 'efectivo') === 'efectivo';
}

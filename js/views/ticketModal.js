import { DB } from '../db.js';
import { state } from '../store.js';
import { uid, shortId, todayStr, money, toast, el, formatTime, shareOrOpenWhatsApp, openPrintableReceipt, escapeHtml } from '../utils.js';
import { openSheet, closeSheet } from '../ui.js';
import { getUserLabel } from '../auth.js';

// ---------------------------------------------------------------------------
// Nuevo ticket
// ---------------------------------------------------------------------------
export function openNewTicketSheet({ onCreated } = {}) {
  const s = state.settings;
  const activeWorkers = s.workers.filter((w) => w.active);

  let selectedType = s.vehicleTypes[0] || null;
  let selectedWorker = activeWorkers[0] || null;

  const body = el(`
    <div>
      <div class="field">
        <label>Placa (opcional)</label>
        <input id="nt-plate" type="text" placeholder="AAA123" autocapitalize="characters" />
      </div>
      <div class="field">
        <label>Tipo de vehículo</label>
        <div class="chip-grid" id="nt-types">
          ${s.vehicleTypes.map((v) => `
            <button type="button" class="chip${v === selectedType ? ' selected' : ''}" data-id="${v.id}">
              <span class="e">${v.emoji}</span><span>${escapeHtml(v.name)}</span>
              <span style="opacity:.7">${money(v.price)}</span>
            </button>`).join('')}
        </div>
        ${s.vehicleTypes.length === 0 ? '<p class="subtext">Agrega tipos de vehículo en Más → Configuración.</p>' : ''}
      </div>
      <div class="field">
        <label>Lavador</label>
        <div class="pill-row" id="nt-workers">
          ${activeWorkers.map((w) => `<button type="button" class="pill${w === selectedWorker ? ' selected' : ''}" data-id="${w.id}">${escapeHtml(w.name)}</button>`).join('')}
        </div>
        ${activeWorkers.length === 0 ? '<p class="subtext">No hay trabajadores activos. Agrega uno en Más → Trabajadores.</p>' : ''}
      </div>
      <button class="btn btn-primary mt12" id="nt-submit">Abrir ticket</button>
    </div>
  `);

  body.querySelectorAll('#nt-types .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      body.querySelectorAll('#nt-types .chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedType = s.vehicleTypes.find((v) => v.id === chip.dataset.id);
    });
  });
  body.querySelectorAll('#nt-workers .pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      body.querySelectorAll('#nt-workers .pill').forEach((p) => p.classList.remove('selected'));
      pill.classList.add('selected');
      selectedWorker = activeWorkers.find((w) => w.id === pill.dataset.id);
    });
  });

  body.querySelector('#nt-submit').addEventListener('click', async () => {
    if (!selectedType) return toast('Selecciona un tipo de vehículo', 'error');
    const plate = body.querySelector('#nt-plate').value.trim().toUpperCase();
    const ticket = {
      id: uid(),
      shortId: shortId(),
      date: todayStr(),
      plate,
      vehicleTypeId: selectedType.id,
      vehicleTypeName: selectedType.name,
      vehicleEmoji: selectedType.emoji,
      washerId: selectedWorker ? selectedWorker.id : null,
      washerName: selectedWorker ? selectedWorker.name : 'Sin asignar',
      basePrice: selectedType.price,
      services: [],
      extraItems: [],
      advancePayment: false,
      paymentMethod: 'efectivo',
      note: '',
      total: selectedType.price,
      status: 'open',
      openedAt: new Date().toISOString(),
      closedAt: null,
      openedBy: getUserLabel(),
      closedBy: null,
    };
    await DB.addTicket(ticket);
    closeSheet();
    toast('Ticket abierto', 'success');
    if (onCreated) onCreated(ticket);
  });

  openSheet('Nuevo ticket', body);
}

// ---------------------------------------------------------------------------
// Cerrar / editar ticket
// ---------------------------------------------------------------------------
function computeTotal(draft) {
  const services = draft.services.reduce((sum, sv) => sum + (Number(sv.price) || 0), 0);
  const extras = draft.extraItems.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  return (Number(draft.basePrice) || 0) + services + extras;
}

export function openCloseTicketSheet(ticket, { onUpdated } = {}) {
  const s = state.settings;
  const activeWorkers = s.workers.filter((w) => w.active || w.id === ticket.washerId);

  const draft = {
    washerId: ticket.washerId,
    basePrice: ticket.basePrice,
    services: JSON.parse(JSON.stringify(ticket.services || [])),
    extraItems: JSON.parse(JSON.stringify(ticket.extraItems || [])),
    advancePayment: !!ticket.advancePayment,
    paymentMethod: ticket.paymentMethod || 'efectivo',
    note: ticket.note || '',
  };

  const elapsedMin = Math.max(0, Math.floor((Date.now() - new Date(ticket.openedAt).getTime()) / 60000));

  const body = el(`
    <div>
      <div class="row">
        <span class="badge open" style="background:var(--card-2); color:var(--text-dim);">⏱ ${elapsedMin} min</span>
      </div>

      <div class="field mt12">
        <label>Lavador</label>
        <select id="ct-worker">
          ${activeWorkers.map((w) => `<option value="${w.id}" ${w.id === draft.washerId ? 'selected' : ''}>${escapeHtml(w.name)}</option>`).join('')}
        </select>
      </div>

      <div class="field">
        <label>Precio de lavado</label>
        <input id="ct-base" type="number" inputmode="decimal" value="${draft.basePrice}" />
      </div>

      <div class="field">
        <label>Servicios adicionales</label>
        <div id="ct-services"></div>
        <div class="flex gap8 mt8">
          <input id="ct-custom-service-name" type="text" placeholder="Techo, asientos, aros..." />
          <input id="ct-custom-service-price" type="number" inputmode="decimal" placeholder="0" style="width:90px;" />
          <button class="btn btn-primary btn-sm" id="ct-add-service">+</button>
        </div>
      </div>

      <div class="field">
        <label>Consumo adicional</label>
        ${s.products.length ? `<div class="pill-row mb8" id="ct-product-pills">
          ${s.products.map((p) => `<button type="button" class="pill" data-name="${escapeHtml(p.name)}" data-price="${p.price}">${escapeHtml(p.name)} · ${money(p.price)}</button>`).join('')}
        </div>` : ''}
        <div id="ct-extras"></div>
        <div class="flex gap8 mt8">
          <input id="ct-custom-extra-name" type="text" placeholder="Otro item..." />
          <input id="ct-custom-extra-price" type="number" inputmode="decimal" placeholder="0" style="width:90px;" />
          <button class="btn btn-primary btn-sm" id="ct-add-extra">+</button>
        </div>
      </div>

      <div class="totals-box" id="ct-totals"></div>

      <div class="field row" style="border:1.5px dashed var(--border); border-radius:var(--radius-sm); padding:12px;">
        <span>💰 Pago adelantado</span>
        <div class="switch${draft.advancePayment ? ' on' : ''}" id="ct-advance"><div class="knob"></div></div>
      </div>

      <div class="field">
        <label>Forma de pago</label>
        <div class="pill-row" id="ct-payment">
          ${['efectivo', 'digital', 'mixto', 'credito'].map((p) => `<button type="button" class="pill${draft.paymentMethod === p ? ' selected' : ''}" data-p="${p}">${p[0].toUpperCase() + p.slice(1)}</button>`).join('')}
        </div>
      </div>

      <button class="btn btn-ghost mt8" id="ct-note-toggle">📝 ${draft.note ? 'Editar nota' : 'Agregar nota'}</button>
      <div class="field mt8" id="ct-note-field" style="display:${draft.note ? 'block' : 'none'};">
        <textarea id="ct-note" rows="2" placeholder="Nota interna...">${escapeHtml(draft.note)}</textarea>
      </div>

      <button class="btn btn-outline mt16" id="ct-update">Actualizar ticket (sin cerrar)</button>
      <button class="btn btn-success mt8" id="ct-close">Cerrar · Cobrar ${money(computeTotal(draft))}</button>
      <button class="btn btn-danger mt8" id="ct-cancel">Cancelar ticket</button>
    </div>
  `);

  function renderServices() {
    const wrap = body.querySelector('#ct-services');
    wrap.innerHTML = '';
    s.additionalServices.forEach((addon) => {
      const applied = draft.services.find((sv) => sv.id === addon.id);
      const row = el(`<div class="addon-row${applied ? ' on' : ''}" data-id="${addon.id}">
        <div class="check">${applied ? '✓' : ''}</div>
        <div class="name">${escapeHtml(addon.name)}</div>
        <input type="number" inputmode="decimal" value="${applied ? applied.price : addon.price}" ${applied ? '' : 'disabled'} />
      </div>`);
      row.querySelector('.check, .name').closest('.addon-row');
      row.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;
        const idx = draft.services.findIndex((sv) => sv.id === addon.id);
        if (idx >= 0) {
          draft.services.splice(idx, 1);
        } else {
          draft.services.push({ id: addon.id, name: addon.name, price: Number(row.querySelector('input').value) || addon.price });
        }
        renderServices();
        renderTotals();
      });
      row.querySelector('input').addEventListener('input', (e) => {
        const item = draft.services.find((sv) => sv.id === addon.id);
        if (item) {
          item.price = Number(e.target.value) || 0;
          renderTotals();
        }
      });
      wrap.appendChild(row);
    });
    // servicios personalizados ya agregados a este ticket (no están en el catálogo)
    draft.services.filter((sv) => !s.additionalServices.some((a) => a.id === sv.id)).forEach((custom) => {
      const row = el(`<div class="addon-row on" data-custom-id="${custom.id}">
        <div class="check">✓</div>
        <div class="name">${escapeHtml(custom.name)}</div>
        <input type="number" inputmode="decimal" value="${custom.price}" />
        <button style="color:var(--red); font-size:16px; padding:2px 4px;">✕</button>
      </div>`);
      row.querySelector('input').addEventListener('input', (e) => {
        custom.price = Number(e.target.value) || 0;
        renderTotals();
      });
      row.querySelector('button').addEventListener('click', () => {
        draft.services = draft.services.filter((sv) => sv.id !== custom.id);
        renderServices();
        renderTotals();
      });
      wrap.appendChild(row);
    });
  }

  function renderExtras() {
    const wrap = body.querySelector('#ct-extras');
    wrap.innerHTML = '';
    draft.extraItems.forEach((item) => {
      const row = el(`<div class="addon-row on">
        <div class="name">${escapeHtml(item.name)}</div>
        <input type="number" inputmode="decimal" value="${item.price}" />
        <button style="color:var(--red); font-size:16px; padding:2px 4px;">✕</button>
      </div>`);
      row.querySelector('input').addEventListener('input', (e) => {
        item.price = Number(e.target.value) || 0;
        renderTotals();
      });
      row.querySelector('button').addEventListener('click', () => {
        draft.extraItems = draft.extraItems.filter((it) => it !== item);
        renderExtras();
        renderTotals();
      });
      wrap.appendChild(row);
    });
  }

  function renderTotals() {
    draft.basePrice = Number(body.querySelector('#ct-base').value) || 0;
    const total = computeTotal(draft);
    const box = body.querySelector('#ct-totals');
    box.innerHTML = `
      <div class="row"><span>Lavado</span><span>${money(draft.basePrice)}</span></div>
      ${draft.services.map((sv) => `<div class="row"><span>${escapeHtml(sv.name)}</span><span>${money(sv.price)}</span></div>`).join('')}
      ${draft.extraItems.map((it) => `<div class="row"><span>${escapeHtml(it.name)}</span><span>${money(it.price)}</span></div>`).join('')}
      <div class="row total"><span>Total</span><span>${money(total)}</span></div>
    `;
    body.querySelector('#ct-close').textContent = `Cerrar · Cobrar ${money(total)}`;
  }

  renderServices();
  renderExtras();
  renderTotals();

  body.querySelector('#ct-base').addEventListener('input', renderTotals);

  body.querySelector('#ct-add-service').addEventListener('click', () => {
    const nameInput = body.querySelector('#ct-custom-service-name');
    const priceInput = body.querySelector('#ct-custom-service-price');
    const name = nameInput.value.trim();
    if (!name) return;
    draft.services.push({ id: uid(), name, price: Number(priceInput.value) || 0 });
    nameInput.value = '';
    priceInput.value = '';
    renderServices();
    renderTotals();
  });

  body.querySelector('#ct-add-extra').addEventListener('click', () => {
    const nameInput = body.querySelector('#ct-custom-extra-name');
    const priceInput = body.querySelector('#ct-custom-extra-price');
    const name = nameInput.value.trim();
    if (!name) return;
    draft.extraItems.push({ name, price: Number(priceInput.value) || 0 });
    nameInput.value = '';
    priceInput.value = '';
    renderExtras();
    renderTotals();
  });

  const pillsWrap = body.querySelector('#ct-product-pills');
  if (pillsWrap) {
    pillsWrap.querySelectorAll('.pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        draft.extraItems.push({ name: pill.dataset.name, price: Number(pill.dataset.price) || 0 });
        renderExtras();
        renderTotals();
      });
    });
  }

  body.querySelector('#ct-advance').addEventListener('click', (e) => {
    draft.advancePayment = !draft.advancePayment;
    e.currentTarget.classList.toggle('on', draft.advancePayment);
  });

  body.querySelectorAll('#ct-payment .pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      body.querySelectorAll('#ct-payment .pill').forEach((p) => p.classList.remove('selected'));
      pill.classList.add('selected');
      draft.paymentMethod = pill.dataset.p;
    });
  });

  body.querySelector('#ct-note-toggle').addEventListener('click', () => {
    const field = body.querySelector('#ct-note-field');
    field.style.display = field.style.display === 'none' ? 'block' : 'none';
  });

  function collectTicketUpdate() {
    const worker = s.workers.find((w) => w.id === body.querySelector('#ct-worker').value);
    return {
      ...ticket,
      washerId: worker ? worker.id : ticket.washerId,
      washerName: worker ? worker.name : ticket.washerName,
      basePrice: draft.basePrice,
      services: draft.services,
      extraItems: draft.extraItems,
      advancePayment: draft.advancePayment,
      paymentMethod: draft.paymentMethod,
      note: body.querySelector('#ct-note').value.trim(),
      total: computeTotal(draft),
    };
  }

  body.querySelector('#ct-update').addEventListener('click', async () => {
    const updated = collectTicketUpdate();
    await DB.updateTicket(updated);
    toast('Ticket actualizado', 'success');
    closeSheet();
    if (onUpdated) onUpdated(updated);
  });

  body.querySelector('#ct-close').addEventListener('click', async () => {
    const updated = collectTicketUpdate();
    updated.status = 'closed';
    updated.closedAt = new Date().toISOString();
    updated.closedBy = getUserLabel();
    await DB.updateTicket(updated);
    toast('Ticket cerrado y cobrado', 'success');
    closeSheet();
    if (onUpdated) onUpdated(updated);
    openTicketDetailSheet(updated);
  });

  body.querySelector('#ct-cancel').addEventListener('click', async () => {
    if (!confirm('¿Cancelar y eliminar este ticket? Esta acción no se puede deshacer.')) return;
    await DB.deleteTicket(ticket.id);
    toast('Ticket cancelado', '');
    closeSheet();
    if (onUpdated) onUpdated(null);
  });

  openSheet(`Cerrar — ${ticket.shortId}`, body);
}

// ---------------------------------------------------------------------------
// Detalle de ticket cerrado (compartir / imprimir)
// ---------------------------------------------------------------------------
export function openTicketDetailSheet(ticket) {
  const s = state.settings;

  const receiptText = buildReceiptText(ticket, s);

  const body = el(`
    <div>
      <div class="flex gap8 mb16">
        <button class="btn btn-success btn-sm" style="flex:1;" id="td-whatsapp">💬 WhatsApp</button>
        <button class="btn btn-primary btn-sm" style="flex:1;" id="td-pdf">🧾 Ticket / PDF</button>
      </div>

      <div class="card card-tight mb16" style="background:var(--green-bg); border-color:var(--green);">
        <p class="subtext mb8">Enviar comprobante por WhatsApp</p>
        <div class="flex gap8">
          <input id="td-phone" type="tel" placeholder="Número (10 dígitos)" style="flex:1;" />
          <button class="btn btn-success btn-sm" id="td-send">Enviar</button>
        </div>
      </div>

      <p class="subtext mb8">${escapeHtml(ticket.vehicleTypeName)} · Lavador: ${escapeHtml(ticket.washerName || '—')}</p>
      <div class="totals-box">
        <div class="row"><span>Lavado</span><span>${money(ticket.basePrice)}</span></div>
        ${(ticket.services || []).map((sv) => `<div class="row"><span>${escapeHtml(sv.name)}</span><span>${money(sv.price)}</span></div>`).join('')}
        ${(ticket.extraItems || []).map((it) => `<div class="row"><span>${escapeHtml(it.name)}</span><span>${money(it.price)}</span></div>`).join('')}
        <div class="row total"><span>Total</span><span>${money(ticket.total)}</span></div>
      </div>
      <div class="list">
        <div class="row"><span class="subtext">Pago</span><span class="subtext">${paymentIcon(ticket.paymentMethod)} ${ticket.paymentMethod}</span></div>
        <div class="row"><span class="subtext">Abrió</span><span class="subtext">${escapeHtml(ticket.openedBy || '—')} · ${formatTime(ticket.openedAt)}</span></div>
        <div class="row"><span class="subtext">Cerró</span><span class="subtext">${escapeHtml(ticket.closedBy || '—')} · ${formatTime(ticket.closedAt)}</span></div>
      </div>
    </div>
  `);

  body.querySelector('#td-whatsapp').addEventListener('click', () => shareOrOpenWhatsApp('', receiptText));
  body.querySelector('#td-send').addEventListener('click', () => {
    const phone = body.querySelector('#td-phone').value.trim();
    if (!phone) return toast('Ingresa un número', 'error');
    shareOrOpenWhatsApp(phone, receiptText);
  });
  body.querySelector('#td-pdf').addEventListener('click', () => {
    openPrintableReceipt(`Ticket ${ticket.shortId}`, buildReceiptHtml(ticket, s));
  });

  openSheet(ticket.shortId, body);
}

function paymentIcon(method) {
  return { efectivo: '💵', digital: '📱', mixto: '🔀', credito: '🧾' }[method] || '💵';
}

function buildReceiptText(ticket, s) {
  const lines = [
    `*${s.businessName || 'Carwash'}*`,
    `Ticket ${ticket.shortId}`,
    `${ticket.vehicleTypeName}${ticket.plate ? ' · ' + ticket.plate : ''}`,
    '',
    `Lavado: ${money(ticket.basePrice)}`,
    ...(ticket.services || []).map((sv) => `${sv.name}: ${money(sv.price)}`),
    ...(ticket.extraItems || []).map((it) => `${it.name}: ${money(it.price)}`),
    '',
    `*Total: ${money(ticket.total)}*`,
    `Pago: ${ticket.paymentMethod}`,
    '',
    '¡Gracias por tu preferencia!',
  ];
  return lines.join('\n');
}

function buildReceiptHtml(ticket, s) {
  return `
    <h1>${escapeHtml(s.businessName || 'Carwash')}</h1>
    <p class="center muted">Ticket ${ticket.shortId}</p>
    <p class="center muted">${escapeHtml(ticket.vehicleTypeName)}${ticket.plate ? ' · ' + escapeHtml(ticket.plate) : ''}</p>
    <hr/>
    <table>
      <tr><td>Lavado</td><td class="r">${money(ticket.basePrice)}</td></tr>
      ${(ticket.services || []).map((sv) => `<tr><td>${escapeHtml(sv.name)}</td><td class="r">${money(sv.price)}</td></tr>`).join('')}
      ${(ticket.extraItems || []).map((it) => `<tr><td>${escapeHtml(it.name)}</td><td class="r">${money(it.price)}</td></tr>`).join('')}
      <tr class="total"><td>Total</td><td class="r">${money(ticket.total)}</td></tr>
    </table>
    <p class="muted">Pago: ${ticket.paymentMethod} · ${formatTime(ticket.closedAt)}</p>
    <p class="center muted mt16">¡Gracias por tu preferencia!</p>
  `;
}

import { DB } from '../db.js';
import { state } from '../store.js';
import { uid, money, toast, el, escapeHtml } from '../utils.js';
import { renderTopbar, openSheet, closeSheet } from '../ui.js';
import { reloadSettings } from '../app.js';
import { mountAd } from '../ads.js';

const EMOJI_CHOICES = ['🏍️', '🚗', '🚙', '🚐', '🚚', '🚌', '🚲', '🚕', '🚓', '🚑', '🚒', '🛵', '⛵', '🚜', '🚘', '🚖'];

export function render(container, { navigate }) {
  const root = el(`<div></div>`);
  root.appendChild(renderTopbar({ title: 'Configuración', onBack: () => navigate('/more') }));
  const view = el(`<div class="view"></div>`);
  root.appendChild(view);
  container.appendChild(root);

  async function persist() {
    await DB.saveSettings(state.settings);
    await reloadSettings();
  }

  function draw() {
    const s = state.settings;
    view.innerHTML = '';

    view.appendChild(el(`
      <div class="section-title">Datos del negocio</div>
      <div class="field"><label>Nombre</label><input id="c-name" type="text" value="${escapeHtml(s.businessName)}" /></div>

      <div class="section-title">Reserva de caja</div>
      <p class="subtext mb8">Monto inicial que dejas en caja para tener cambio cada día.</p>
      <input id="c-reserve" type="number" inputmode="decimal" value="${s.cashReserve}" />

      <div class="section-title">Tipos de vehículo</div>
      <p class="subtext mb8">Precios sugeridos, editables al cerrar cada ticket. Toca el emoji para personalizarlo.</p>
      <div id="c-vehicle-list"></div>
      <div class="flex gap8 mt8">
        <input id="c-vt-name" type="text" placeholder="Nuevo tipo de vehículo" style="flex:1;" />
        <input id="c-vt-price" type="number" inputmode="decimal" placeholder="0" style="width:80px;" />
        <button class="btn btn-primary btn-sm" id="c-vt-add">+</button>
      </div>

      <div class="section-title">Servicios adicionales</div>
      <p class="subtext mb8">Trabajos extra que cobras además del lavado básico.</p>
      <div id="c-service-list"></div>
      <div class="flex gap8 mt8">
        <input id="c-sv-name" type="text" placeholder="Nuevo servicio" style="flex:1;" />
        <input id="c-sv-price" type="number" inputmode="decimal" placeholder="0" style="width:80px;" />
        <button class="btn btn-primary btn-sm" id="c-sv-add">+</button>
      </div>

      <div id="c-ad"></div>

      <div class="section-title">Zona de peligro</div>
      <button class="btn btn-outline" id="c-goto-backup" style="border-color:var(--red); color:var(--red);">Borrar todos los datos</button>
    `));

    // nombre / reserva
    view.querySelector('#c-name').addEventListener('change', async (e) => { s.businessName = e.target.value.trim(); await persist(); });
    view.querySelector('#c-reserve').addEventListener('change', async (e) => { s.cashReserve = Number(e.target.value) || 0; await persist(); });

    // tipos de vehículo
    const vList = view.querySelector('#c-vehicle-list');
    s.vehicleTypes.forEach((v) => {
      const row = el(`
        <div class="editable-list-item">
          <button class="e" data-action="emoji" style="background:none; border:none;">${v.emoji}</button>
          <span class="name">${escapeHtml(v.name)}</span>
          <input type="number" value="${v.price}" inputmode="decimal" />
          <button class="del" data-action="del">🗑️</button>
        </div>
      `);
      row.querySelector('[data-action="emoji"]').addEventListener('click', () => openEmojiPicker(v, async (emoji) => {
        v.emoji = emoji; await persist(); draw();
      }));
      row.querySelector('input').addEventListener('change', async (e) => { v.price = Number(e.target.value) || 0; await persist(); });
      row.querySelector('[data-action="del"]').addEventListener('click', async () => {
        if (!confirm(`¿Eliminar ${v.name}?`)) return;
        s.vehicleTypes = s.vehicleTypes.filter((x) => x.id !== v.id);
        await persist(); draw();
      });
      vList.appendChild(row);
    });
    view.querySelector('#c-vt-add').addEventListener('click', async () => {
      const name = view.querySelector('#c-vt-name').value.trim();
      const price = Number(view.querySelector('#c-vt-price').value) || 0;
      if (!name) return;
      s.vehicleTypes.push({ id: uid(), emoji: '🚗', name, price });
      await persist(); draw();
      toast('Tipo de vehículo agregado', 'success');
    });

    // servicios adicionales
    const svList = view.querySelector('#c-service-list');
    s.additionalServices.forEach((sv) => {
      const row = el(`
        <div class="editable-list-item">
          <span class="e">✨</span>
          <span class="name">${escapeHtml(sv.name)}</span>
          <input type="number" value="${sv.price}" inputmode="decimal" />
          <button class="del" data-action="del">🗑️</button>
        </div>
      `);
      row.querySelector('input').addEventListener('change', async (e) => { sv.price = Number(e.target.value) || 0; await persist(); });
      row.querySelector('[data-action="del"]').addEventListener('click', async () => {
        if (!confirm(`¿Eliminar ${sv.name}?`)) return;
        s.additionalServices = s.additionalServices.filter((x) => x.id !== sv.id);
        await persist(); draw();
      });
      svList.appendChild(row);
    });
    view.querySelector('#c-sv-add').addEventListener('click', async () => {
      const name = view.querySelector('#c-sv-name').value.trim();
      const price = Number(view.querySelector('#c-sv-price').value) || 0;
      if (!name) return;
      s.additionalServices.push({ id: uid(), name, price });
      await persist(); draw();
      toast('Servicio agregado', 'success');
    });

    view.querySelector('#c-goto-backup').addEventListener('click', () => navigate('/more/backup'));

    mountAd(view.querySelector('#c-ad'), 'config');
  }

  function openEmojiPicker(vehicleType, onPick) {
    const body = el(`<div class="chip-grid">${EMOJI_CHOICES.map((e) => `<button type="button" class="chip" data-e="${e}" style="font-size:22px;">${e}</button>`).join('')}</div>`);
    body.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => { onPick(c.dataset.e); closeSheet(); }));
    openSheet(`Ícono para ${vehicleType.name}`, body);
  }

  draw();
}

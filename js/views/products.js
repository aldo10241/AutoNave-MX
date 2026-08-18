import { DB } from '../db.js';
import { state } from '../store.js';
import { uid, money, toast, el, escapeHtml } from '../utils.js';
import { renderTopbar, emptyState } from '../ui.js';
import { reloadSettings } from '../app.js';
import { mountAd } from '../ads.js';

export function render(container, { navigate }) {
  const root = el(`<div></div>`);
  root.appendChild(renderTopbar({ title: 'Productos', onBack: () => navigate('/more') }));
  const view = el(`
    <div class="view">
      <p class="subtext mb16">Estos productos aparecen como accesos rápidos al agregar "Consumo adicional" en un ticket (ej. bebidas, ambientador, cera en spray).</p>
      <div class="card mb16">
        <div class="field"><label>Nombre</label><input id="p-name" type="text" placeholder="Agua embotellada" /></div>
        <div class="grid-2">
          <div class="field"><label>Precio</label><input id="p-price" type="number" inputmode="decimal" placeholder="0" /></div>
          <div class="field"><label>Stock (opcional)</label><input id="p-stock" type="number" inputmode="numeric" placeholder="—" /></div>
        </div>
        <button class="btn btn-primary" id="p-add">+ Agregar producto</button>
      </div>
      <div class="list" id="p-list"></div>
      <div id="p-ad"></div>
    </div>
  `);
  root.appendChild(view);
  container.appendChild(root);
  mountAd(view.querySelector('#p-ad'), 'products');

  const list = view.querySelector('#p-list');

  async function refresh() {
    const s = state.settings;
    list.innerHTML = '';
    if (s.products.length === 0) {
      list.innerHTML = emptyState('📦', 'Sin productos', 'Agrega productos que sueles vender junto al lavado.');
      return;
    }
    s.products.forEach((p) => {
      const row = el(`
        <div class="editable-list-item">
          <span class="e">🧴</span>
          <span class="name">${escapeHtml(p.name)} ${p.stock != null ? `<span class="subtext">· stock: ${p.stock}</span>` : ''}</span>
          <input type="number" value="${p.price}" inputmode="decimal" />
          <button class="del" data-action="del">🗑️</button>
        </div>
      `);
      row.querySelector('input').addEventListener('change', async (e) => {
        p.price = Number(e.target.value) || 0;
        await DB.saveSettings(s);
        await reloadSettings();
      });
      row.querySelector('[data-action="del"]').addEventListener('click', async () => {
        if (!confirm(`¿Eliminar ${p.name}?`)) return;
        state.settings.products = s.products.filter((x) => x.id !== p.id);
        await DB.saveSettings(state.settings);
        await reloadSettings();
        refresh();
      });
      list.appendChild(row);
    });
  }

  view.querySelector('#p-add').addEventListener('click', async () => {
    const name = view.querySelector('#p-name').value.trim();
    const price = Number(view.querySelector('#p-price').value) || 0;
    const stockVal = view.querySelector('#p-stock').value;
    const stock = stockVal === '' ? null : Number(stockVal);
    if (!name) return toast('Ingresa un nombre', 'error');
    const s = state.settings;
    s.products.push({ id: uid(), name, price, stock });
    await DB.saveSettings(s);
    await reloadSettings();
    view.querySelector('#p-name').value = '';
    view.querySelector('#p-price').value = '';
    view.querySelector('#p-stock').value = '';
    toast('Producto agregado', 'success');
    refresh();
  });

  refresh();
}

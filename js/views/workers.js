import { DB } from '../db.js';
import { state } from '../store.js';
import { uid, toast, el, escapeHtml } from '../utils.js';
import { renderTopbar, emptyState } from '../ui.js';
import { reloadSettings } from '../app.js';
import { mountAd } from '../ads.js';

export function render(container, { navigate }) {
  const root = el(`<div></div>`);
  root.appendChild(renderTopbar({ title: 'Trabajadores', onBack: () => navigate('/more') }));
  const view = el(`
    <div class="view">
      <div class="flex gap8 mb16">
        <input id="w-name" type="text" placeholder="Nombre del trabajador" style="flex:1;" />
        <button class="btn btn-primary btn-sm" id="w-add">+ Agregar</button>
      </div>
      <div class="list" id="w-list"></div>
      <div id="w-ad"></div>
    </div>
  `);
  root.appendChild(view);
  container.appendChild(root);
  mountAd(view.querySelector('#w-ad'), 'workers');

  const list = view.querySelector('#w-list');

  async function refresh() {
    const s = state.settings;
    list.innerHTML = '';
    if (s.workers.length === 0) {
      list.innerHTML = emptyState('👷', 'Sin trabajadores', 'Agrega a tu primer lavador arriba.');
      return;
    }
    s.workers.forEach((w) => {
      const row = el(`
        <div class="editable-list-item">
          <span class="e">🧽</span>
          <span class="name">${escapeHtml(w.name)}</span>
          <div class="switch${w.active ? ' on' : ''}" data-action="toggle"><div class="knob"></div></div>
          <button class="del" data-action="del">🗑️</button>
        </div>
      `);
      row.querySelector('[data-action="toggle"]').addEventListener('click', async () => {
        w.active = !w.active;
        await DB.saveSettings(s);
        await reloadSettings();
        refresh();
      });
      row.querySelector('[data-action="del"]').addEventListener('click', async () => {
        if (!confirm(`¿Eliminar a ${w.name}? El historial ya registrado no se verá afectado.`)) return;
        state.settings.workers = s.workers.filter((x) => x.id !== w.id);
        await DB.saveSettings(state.settings);
        await reloadSettings();
        refresh();
      });
      list.appendChild(row);
    });
  }

  view.querySelector('#w-add').addEventListener('click', async () => {
    const input = view.querySelector('#w-name');
    const name = input.value.trim();
    if (!name) return;
    const s = state.settings;
    s.workers.push({ id: uid(), name, active: true });
    await DB.saveSettings(s);
    await reloadSettings();
    input.value = '';
    toast('Trabajador agregado', 'success');
    refresh();
  });

  refresh();
}

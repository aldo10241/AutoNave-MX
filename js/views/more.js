import { state } from '../store.js';
import { el } from '../utils.js';
import { canInstall, promptInstall, isStandalone, isIos } from '../install.js';

const ITEMS = [
  { path: '/more/history', e: '🕘', t: 'Historial', d: 'Todos los tickets, filtra por fecha o placa' },
  { path: '/more/workers', e: '👷', t: 'Trabajadores', d: 'Agrega y administra tu equipo' },
  { path: '/more/products', e: '📦', t: 'Productos', d: 'Consumo adicional y precios' },
  { path: '/more/config', e: '⚙️', t: 'Configuración', d: 'Vehículos, servicios, caja, moneda' },
  { path: '/more/backup', e: '💾', t: 'Copia de seguridad', d: 'Exporta o restaura tus datos' },
];

export function render(container, { navigate }) {
  const s = state.settings;
  const root = el(`
    <div>
      <div class="topbar"><h1>${s.businessName || 'Más'}</h1><div class="spacer"></div></div>
      <div class="view">
        <div id="install-slot"></div>
        <div class="menu-grid" id="menu-grid"></div>
        <div class="card mt20 center">
          <p class="subtext">Control Carwash Libre · gratis y de código abierto</p>
        </div>
      </div>
    </div>
  `);
  container.appendChild(root);

  const grid = root.querySelector('#menu-grid');
  ITEMS.forEach((item) => {
    const tile = el(`<button class="menu-tile"><span class="e">${item.e}</span><span class="t">${item.t}</span><span class="d">${item.d}</span></button>`);
    tile.addEventListener('click', () => navigate(item.path));
    grid.appendChild(tile);
  });

  const installSlot = root.querySelector('#install-slot');
  if (!isStandalone()) {
    if (canInstall()) {
      const b = el(`<div class="install-banner"><span class="e">📲</span><span class="t">Instala la app en este dispositivo.</span><button class="btn btn-primary btn-sm" id="mi-install">Instalar</button></div>`);
      b.querySelector('#mi-install').addEventListener('click', () => promptInstall());
      installSlot.appendChild(b);
    } else if (isIos()) {
      installSlot.appendChild(el(`<div class="install-banner"><span class="e">📲</span><span class="t">En iPhone: toca Compartir → "Agregar a pantalla de inicio" para instalar la app.</span></div>`));
    }
  }
}

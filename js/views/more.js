import { state } from '../store.js';
import { el } from '../utils.js';
import { canInstall, promptInstall, isStandalone, isIos } from '../install.js';
import { getCurrentUser, getUserLabel, logOut } from '../auth.js';
import { getTheme, toggleTheme } from '../theme.js';

const ITEMS = [
  { path: '/more/history', e: '🕘', t: 'Historial', d: 'Todos los tickets, filtra por fecha o placa' },
  { path: '/more/workers', e: '👷', t: 'Trabajadores', d: 'Agrega y administra tu equipo' },
  { path: '/more/products', e: '📦', t: 'Productos', d: 'Consumo adicional y precios' },
  { path: '/more/config', e: '⚙️', t: 'Configuración', d: 'Vehículos, servicios, caja' },
  { path: '/more/backup', e: '💾', t: 'Copia de seguridad', d: 'Exporta o restaura tus datos' },
];

export function render(container, { navigate }) {
  const s = state.settings;
  const user = getCurrentUser();

  const root = el(`
    <div>
      <div class="topbar"><h1>${s.businessName || 'Más'}</h1><div class="spacer"></div>
        <button class="action" id="theme-toggle" title="Cambiar tema">${getTheme() === 'dark' ? '☀️' : '🌙'}</button>
      </div>
      <div class="view">
        <div class="account-strip">
          <div class="account-avatar">${(getUserLabel() || '?').charAt(0).toUpperCase()}</div>
          <div style="flex:1; min-width:0;">
            <div class="account-name">${getUserLabel()}</div>
            <div class="account-email">${user?.email || ''}</div>
          </div>
          <button class="btn btn-outline btn-sm" id="logout-btn">Salir</button>
        </div>

        <div id="install-slot"></div>
        <div class="menu-grid" id="menu-grid"></div>
        <div class="card center" style="margin-top:20px;">
          <p class="subtext center">AutoNave MX · gratis y de código abierto</p>
        </div>
      </div>
    </div>
  `);
  container.appendChild(root);

  root.querySelector('#theme-toggle').addEventListener('click', (e) => {
    const mode = toggleTheme();
    e.currentTarget.textContent = mode === 'dark' ? '☀️' : '🌙';
  });

  root.querySelector('#logout-btn').addEventListener('click', async () => {
    if (!confirm('¿Cerrar sesión?')) return;
    await logOut();
  });

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

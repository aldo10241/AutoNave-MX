import { state } from '../store.js';
import { el, toast } from '../utils.js';
import { canInstall, promptInstall, isStandalone, isIos } from '../install.js';
import { getCurrentUser, getUserLabel, logOut, needsEmailVerification, resendVerificationEmail } from '../auth.js';
import { getTheme, toggleTheme } from '../theme.js';
import { DONATION_URL, isDonationConfigured } from '../donate.js';

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

        <div id="verify-slot"></div>
        <div id="install-slot"></div>
        <div class="menu-grid" id="menu-grid"></div>

        ${s.donorAdFree ? `
        <div class="card" style="margin-top:20px; display:flex; align-items:center; gap:12px;">
          <span style="font-size:24px;">✨</span>
          <div>
            <p style="font-weight:800; font-size:14.5px;">Gracias por tu apoyo</p>
            <p class="subtext">Tu donación ayuda a mantener el proyecto activo.</p>
          </div>
        </div>` : isDonationConfigured() ? `
        <div class="card" style="margin-top:20px; display:flex; align-items:center; gap:12px;">
          <span style="font-size:24px;">☕</span>
          <div style="flex:1;">
            <p style="font-weight:800; font-size:14.5px;">¿Te sirve AutoNave MX?</p>
            <p class="subtext">Apoya el proyecto, es gratis y de código abierto.</p>
          </div>
          <a href="${DONATION_URL}" rel="noopener" class="btn btn-primary" style="width:auto; padding:10px 16px; font-size:13.5px;">Donar</a>
        </div>` : ''}

        <div class="card center" style="margin-top:${(s.donorAdFree || isDonationConfigured()) ? '12px' : '20px'};">
          <p class="subtext center">AutoNave MX · gratis y de código abierto</p>
          <p class="subtext center mt8"><a href="privacidad.html" target="_blank" rel="noopener">Aviso de privacidad</a> · <a href="terminos.html" target="_blank" rel="noopener">Términos de uso</a></p>
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

  if (needsEmailVerification()) {
    const vb = el(`<div class="verify-banner"><span class="e">✉️</span><span class="t">Confirma tu correo para proteger tu cuenta.</span><button class="btn btn-outline btn-sm" id="resend-verify">Reenviar</button></div>`);
    vb.querySelector('#resend-verify').addEventListener('click', async () => {
      const result = await resendVerificationEmail();
      if (result.error) toast(result.error, 'error');
      else toast('Correo de verificación enviado', 'success');
    });
    root.querySelector('#verify-slot').appendChild(vb);
  }

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

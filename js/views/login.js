import { signIn, signUp, signInGoogle, resetPassword } from '../auth.js';
import { toast, el } from '../utils.js';
import { openSheet, closeSheet } from '../ui.js';

const GOOGLE_ICON = `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"/>
  <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03z"/>
  <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"/>
</svg>`;

export function render(container) {
  let mode = 'signin'; // signin | signup

  const root = el(`
    <div class="auth-screen">
      <div class="auth-wrap">
        <div class="brand-mark">
          <span>🚗</span>
        </div>
        <h1 class="auth-title">Control Carwash</h1>
        <p class="auth-tagline">Gratis. Tus datos, en la nube, contigo en cualquier dispositivo.</p>

        <div class="ticket-card auth-card">
          <div class="tabs" id="auth-tabs">
            <button data-m="signin" class="active">Entrar</button>
            <button data-m="signup">Crear cuenta</button>
          </div>

          <div class="field" id="auth-name-field" style="display:none;">
            <label>Nombre del negocio o tu nombre</label>
            <input id="auth-name" type="text" placeholder="Carwash San José" />
          </div>
          <div class="field">
            <label>Correo</label>
            <input id="auth-email" type="email" placeholder="tucorreo@ejemplo.com" autocomplete="email" />
          </div>
          <div class="field">
            <label>Contraseña</label>
            <input id="auth-password" type="password" placeholder="••••••••" autocomplete="current-password" />
          </div>

          <button class="btn btn-primary" id="auth-submit">Entrar</button>
          <button class="btn btn-ghost mt8" id="auth-forgot">¿Olvidaste tu contraseña?</button>

          <div class="auth-divider"><span>o</span></div>

          <button class="btn btn-google" id="auth-google">${GOOGLE_ICON}<span>Continuar con Google</span></button>
        </div>

        <p class="subtext center mt16">Al continuar aceptas que tus datos del negocio se guarden en tu cuenta para poder verlos desde cualquier dispositivo.</p>
      </div>
    </div>
  `);
  container.appendChild(root);

  const tabs = root.querySelectorAll('#auth-tabs button');
  const nameField = root.querySelector('#auth-name-field');
  const submitBtn = root.querySelector('#auth-submit');

  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.m;
      tabs.forEach((b) => b.classList.toggle('active', b === btn));
      nameField.style.display = mode === 'signup' ? 'block' : 'none';
      submitBtn.textContent = mode === 'signup' ? 'Crear mi cuenta' : 'Entrar';
    });
  });

  submitBtn.addEventListener('click', async () => {
    const email = root.querySelector('#auth-email').value.trim();
    const password = root.querySelector('#auth-password').value;
    if (!email || !password) return toast('Completa correo y contraseña', 'error');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Un momento...';
    let result;
    if (mode === 'signup') {
      const name = root.querySelector('#auth-name').value.trim();
      result = await signUp(email, password, name);
    } else {
      result = await signIn(email, password);
    }
    submitBtn.disabled = false;
    submitBtn.textContent = mode === 'signup' ? 'Crear mi cuenta' : 'Entrar';
    if (result.error) toast(result.error, 'error');
    // Si tiene éxito, onAuthStateChanged en app.js se encarga de continuar.
  });

  root.querySelector('#auth-google').addEventListener('click', async () => {
    const result = await signInGoogle();
    if (result.error) toast(result.error, 'error');
  });

  root.querySelector('#auth-forgot').addEventListener('click', () => {
    const body = el(`
      <div>
        <div class="field">
          <label>Correo</label>
          <input id="fp-email" type="email" placeholder="tucorreo@ejemplo.com" />
        </div>
        <button class="btn btn-primary" id="fp-send">Enviar enlace de recuperación</button>
      </div>
    `);
    body.querySelector('#fp-send').addEventListener('click', async () => {
      const email = body.querySelector('#fp-email').value.trim();
      if (!email) return toast('Ingresa tu correo', 'error');
      const result = await resetPassword(email);
      if (result.error) toast(result.error, 'error');
      else { toast('Revisa tu correo para restablecer la contraseña', 'success'); closeSheet(); }
    });
    openSheet('Recuperar contraseña', body);
  });
}

import { el } from '../utils.js';

export function render(container) {
  const root = el(`
    <div class="auth-screen">
      <div class="auth-wrap">
        <div class="brand-mark"><span>🔧</span></div>
        <h1 class="auth-title">Falta conectar Firebase</h1>
        <p class="auth-tagline">Esta app usa una cuenta gratuita de Firebase para el login y para guardar los datos en la nube.</p>

        <div class="ticket-card auth-card" style="text-align:left;">
          <ol style="padding-left:18px; display:flex; flex-direction:column; gap:10px; font-size:14px; line-height:1.5;">
            <li>Crea un proyecto gratis en <strong>console.firebase.google.com</strong></li>
            <li>Agrega una app <strong>Web</strong> y copia el objeto de configuración</li>
            <li>Pégalo en <code>js/firebaseConfig.js</code></li>
            <li>Activa <strong>Authentication</strong> (Correo/contraseña + Google)</li>
            <li>Activa <strong>Firestore Database</strong> y pega las reglas de seguridad del README</li>
          </ol>
        </div>
        <p class="subtext center mt16">El paso a paso completo con capturas de dónde hacer clic está en el archivo <strong>README.md</strong> del proyecto, sección "Login y datos en la nube".</p>
      </div>
    </div>
  `);
  container.appendChild(root);
}

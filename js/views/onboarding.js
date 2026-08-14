import { DB } from '../db.js';
import { uid, toast, el } from '../utils.js';

function defaultSettings(businessName, cashReserve) {
  return {
    id: 'main',
    onboarded: true,
    businessName,
    currency: 'MXN',
    cashReserve: Number(cashReserve) || 0,
    createdAt: new Date().toISOString(),
    vehicleTypes: [
      { id: uid(), emoji: '🏍️', name: 'Moto', price: 10 },
      { id: uid(), emoji: '🚗', name: 'Auto por fuera', price: 8 },
      { id: uid(), emoji: '🚙', name: 'Auto', price: 10 },
      { id: uid(), emoji: '🚐', name: 'Camioneta pequeña', price: 15 },
      { id: uid(), emoji: '🚚', name: 'Camioneta grande', price: 20 },
      { id: uid(), emoji: '🚌', name: 'Otro', price: 25 },
    ],
    additionalServices: [
      { id: uid(), name: 'Lavado de motor', price: 10 },
      { id: uid(), name: 'Encerado', price: 10 },
      { id: uid(), name: 'Chasis', price: 10 },
    ],
    products: [],
    workers: [
      { id: uid(), name: 'Lavador 1', active: true },
      { id: uid(), name: 'Lavador 2', active: true },
    ],
    pin: null,
  };
}

export function render(container, { onDone }) {
  container.innerHTML = '';
  const node = el(`
    <div class="auth-screen">
      <div class="auth-wrap">
        <div class="brand-mark"><span>🚗</span></div>
        <h1 class="auth-title">¿Cómo se llama tu negocio?</h1>
        <p class="auth-tagline">Un último paso (20 segundos) y queda listo tu carwash.</p>

        <div class="ticket-card auth-card">
          <div class="field">
            <label>Nombre del negocio</label>
            <input id="ob-name" type="text" placeholder="Carwash San José" />
          </div>

          <div class="field">
            <label>Reserva de caja inicial</label>
            <input id="ob-reserve" type="number" inputmode="decimal" placeholder="50" value="50" />
            <p class="subtext mt8">El cambio que dejas en caja al empezar el día. Lo puedes ajustar luego en Config.</p>
          </div>

          <button class="btn btn-primary" id="ob-submit">Crear mi carwash</button>
        </div>
        <p class="subtext center mt16">Los tipos de vehículo, precios, servicios y trabajadores ya quedan con valores comunes — los editas cuando quieras en Config.</p>
      </div>
    </div>
  `);
  container.appendChild(node);

  node.querySelector('#ob-submit').addEventListener('click', async () => {
    const name = node.querySelector('#ob-name').value.trim() || 'Mi Carwash';
    const reserve = node.querySelector('#ob-reserve').value || 0;
    const settings = defaultSettings(name, reserve);
    await DB.saveSettings(settings);
    toast('¡Listo! Bienvenido a tu carwash', 'success');
    onDone(settings);
  });
}

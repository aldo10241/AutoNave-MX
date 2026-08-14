import { DB } from '../db.js';
import { uid, toast, el } from '../utils.js';

const CURRENCIES = ['$', 'S/', '€', 'Bs', 'MX$', 'Q', 'L', '₡', '£', 'RD$'];

function defaultSettings(businessName, currency, cashReserve) {
  return {
    id: 'main',
    onboarded: true,
    businessName,
    currency,
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
    <div class="view" style="padding-top:48px; max-width:460px;">
      <div class="center mb16">
        <div style="font-size:44px;">🚗💦</div>
        <h1 style="font-size:24px; font-weight:800; margin-top:10px;">Control Carwash Libre</h1>
        <p class="subtext mt8">Gratis, sin anuncios invasivos y funciona sin internet. Cuéntanos de tu negocio para empezar (30 segundos).</p>
      </div>

      <div class="field">
        <label>Nombre del negocio</label>
        <input id="ob-name" type="text" placeholder="Carwash San José" />
      </div>

      <div class="field">
        <label>Moneda</label>
        <div class="pill-row" id="ob-currency">
          ${CURRENCIES.map((c, i) => `<button type="button" class="pill${i === 0 ? ' selected' : ''}" data-c="${c}">${c}</button>`).join('')}
        </div>
      </div>

      <div class="field">
        <label>Reserva de caja inicial ($)</label>
        <input id="ob-reserve" type="number" inputmode="decimal" placeholder="50" value="50" />
        <p class="subtext mt8">Monto que dejas en caja para tener cambio. Lo puedes cambiar luego en Config.</p>
      </div>

      <button class="btn btn-primary mt12" id="ob-submit">Crear mi carwash</button>
      <p class="subtext center mt12">Podrás editar tipos de vehículo, precios, servicios y trabajadores después, en la sección Config.</p>
    </div>
  `);
  container.appendChild(node);

  let selectedCurrency = CURRENCIES[0];
  node.querySelectorAll('#ob-currency .pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      node.querySelectorAll('#ob-currency .pill').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCurrency = btn.dataset.c;
    });
  });

  node.querySelector('#ob-submit').addEventListener('click', async () => {
    const name = node.querySelector('#ob-name').value.trim() || 'Mi Carwash';
    const reserve = node.querySelector('#ob-reserve').value || 0;
    const settings = defaultSettings(name, selectedCurrency, reserve);
    await DB.saveSettings(settings);
    toast('¡Listo! Bienvenido a tu carwash', 'success');
    onDone(settings);
  });
}

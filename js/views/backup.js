import { DB } from '../db.js';
import { state } from '../store.js';
import { todayStr, downloadFile, toast, el } from '../utils.js';
import { renderTopbar } from '../ui.js';
import { reloadSettings } from '../app.js';
import { deleteAllUserPhotos } from '../photos.js';

export function render(container, { navigate }) {
  const root = el(`<div></div>`);
  root.appendChild(renderTopbar({ title: 'Copia de seguridad', onBack: () => navigate('/more') }));
  const view = el(`
    <div class="view">
      <div class="card">
        <p class="subtext mb12">Tus datos se guardan en tu cuenta (Firebase), no solo en este dispositivo. Aun así, exportar de vez en cuando te da un respaldo propio que puedes guardar donde quieras.</p>
        <button class="btn btn-primary" id="b-export">⬇️ Exportar datos (.json)</button>
      </div>

      <div class="card">
        <p class="subtext mb12">Importar reemplaza los registros con el mismo ID y agrega los que no existan. No borra nada que no esté en el archivo.</p>
        <input type="file" id="b-file" accept="application/json" style="display:none;" />
        <button class="btn btn-outline" id="b-import">⬆️ Importar datos (.json)</button>
      </div>

      <div class="card" style="border-left:4px solid var(--red);">
        <p class="subtext mb12">Esto elimina tickets, asistencia, gastos y configuración de tu cuenta en la nube de forma permanente (no solo de este dispositivo).</p>
        <button class="btn btn-danger" id="b-wipe">🗑️ Borrar todos los datos</button>
      </div>

      <div class="card center">
        <p style="font-size:15px; font-weight:800;">AutoNave MX</p>
        <p class="subtext mt8">App gratuita, sin suscripciones, y de código abierto.</p>
        <p class="subtext mt8">Tus datos son tuyos: quedan guardados en tu cuenta y puedes exportarlos cuando quieras.</p>
      </div>
    </div>
  `);
  root.appendChild(view);
  container.appendChild(root);

  view.querySelector('#b-export').addEventListener('click', async () => {
    const data = await DB.exportAll();
    downloadFile(`autonave-mx-backup-${todayStr()}.json`, JSON.stringify(data, null, 2), 'application/json');
    toast('Respaldo descargado', 'success');
  });

  const fileInput = view.querySelector('#b-file');
  view.querySelector('#b-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await DB.importAll(data);
      await reloadSettings();
      toast('Datos importados correctamente', 'success');
    } catch (e) {
      toast('El archivo no es un respaldo válido', 'error');
    }
    fileInput.value = '';
  });

  view.querySelector('#b-wipe').addEventListener('click', async () => {
    if (!confirm('¿Seguro que quieres borrar TODOS los datos? Esta acción no se puede deshacer.')) return;
    if (!confirm('Última confirmación: se perderán tickets, asistencia, configuración y fotos de evidencia. ¿Continuar?')) return;
    await deleteAllUserPhotos();
    await DB.wipeAll();
    toast('Datos borrados. Recargando...', '');
    setTimeout(() => location.reload(), 1000);
  });
}

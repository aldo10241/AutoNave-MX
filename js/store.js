// Estado compartido en memoria (se recarga desde IndexedDB al iniciar y tras
// cada cambio de configuración). Evita pasar `settings` por cada función.
export const state = {
  settings: null,
};

export function setSettings(s) {
  state.settings = s;
}

export function getSettings() {
  return state.settings;
}

// Utilidades compartidas por toda la app.

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function shortId() {
  return Math.random().toString(36).slice(2, 9).toUpperCase();
}

export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr, delta) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return todayStr(dt);
}

export function formatDateLong(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const s = dt.toLocaleDateString('es-ES', opts);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDateShort(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function formatTime(iso) {
  if (!iso) return '--:--';
  const dt = new Date(iso);
  return dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

let currencySymbol = '$';
export function setCurrencySymbol(sym) {
  currencySymbol = sym || '$';
}
export function money(n) {
  const v = Number(n) || 0;
  return `${currencySymbol} ${v.toFixed(2)}`;
}

export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Convierte una plantilla HTML en Node(s) reales.
// Si hay un único elemento raíz devuelve ese Element (lo normal: se puede
// seguir usando querySelector/addEventListener sobre él antes o después de
// insertarlo). Si la plantilla tiene varios elementos hermanos en el nivel
// superior, devuelve un DocumentFragment con todos ellos (también soporta
// querySelector), para no perder silenciosamente los demás nodos.
export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  const nodes = t.content.childNodes;
  if (nodes.length === 1 && nodes[0].nodeType === 1) return nodes[0];
  return t.content;
}

export function toast(message, type = '') {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  const node = el(`<div class="toast ${type}">${escapeHtml(message)}</div>`);
  wrap.appendChild(node);
  setTimeout(() => {
    node.style.transition = 'opacity .25s ease';
    node.style.opacity = '0';
    setTimeout(() => node.remove(), 250);
  }, 2200);
}

export function downloadFile(filename, content, mime = 'application/json') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function toCSV(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '');
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    )
    .join('\n');
}

export function shareOrOpenWhatsApp(phone, text) {
  const clean = (phone || '').replace(/[^\d]/g, '');
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
}

export function openPrintableReceipt(title, html) {
  const w = window.open('', '_blank');
  if (!w) {
    toast('Permite las ventanas emergentes para ver el ticket', 'error');
    return;
  }
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body{font-family: -apple-system, Arial, sans-serif; max-width:340px; margin:20px auto; color:#111; padding:0 12px;}
    h1{font-size:16px; text-align:center; margin-bottom:2px;}
    .center{text-align:center;}
    .muted{color:#666; font-size:12px;}
    table{width:100%; border-collapse:collapse; margin-top:12px; font-size:13px;}
    td{padding:4px 0;}
    .r{text-align:right;}
    .total td{font-weight:800; font-size:15px; border-top:1px solid #999; padding-top:8px;}
    hr{border:none; border-top:1px dashed #999; margin:12px 0;}
    @media print{ button{display:none;} }
  </style></head><body>${html}
  <div class="center" style="margin-top:20px;"><button onclick="window.print()" style="padding:10px 18px;">Imprimir / Guardar PDF</button></div>
  </body></html>`);
  w.document.close();
}

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

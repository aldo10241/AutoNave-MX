// Capa de datos: Firestore (nube de Firebase), organizado por usuario:
//   users/{uid}                      → documento con la configuración (settings)
//   users/{uid}/tickets/{id}
//   users/{uid}/attendance/{id}
//   users/{uid}/expenses/{id}
//   users/{uid}/days/{date}
// Mantiene la misma API que la versión anterior basada en IndexedDB para que
// las vistas no tengan que cambiar. Incluye caché local persistente (ver
// js/firebase.js), así que sigue funcionando sin internet y se sincroniza
// sola al reconectar.
import { db } from './firebase.js';
import { getUid } from './auth.js';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

function uid() {
  const u = getUid();
  if (!u) throw new Error('No hay sesión activa');
  return u;
}
function userDocRef() {
  return doc(db, 'users', uid());
}
function colRef(name) {
  return collection(db, 'users', uid(), name);
}
async function docsOf(q) {
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export const DB = {
  // ---------- settings ----------
  async getSettings() {
    const snap = await getDoc(userDocRef());
    return snap.exists() ? snap.data() : null;
  },
  async saveSettings(settings) {
    await setDoc(userDocRef(), settings);
  },

  // ---------- tickets ----------
  async addTicket(ticket) {
    await setDoc(doc(colRef('tickets'), ticket.id), ticket);
  },
  async updateTicket(ticket) {
    await setDoc(doc(colRef('tickets'), ticket.id), ticket);
  },
  async deleteTicket(id) {
    await deleteDoc(doc(colRef('tickets'), id));
  },
  async getTicket(id) {
    const snap = await getDoc(doc(colRef('tickets'), id));
    return snap.exists() ? snap.data() : null;
  },
  async getTicketsByDate(date) {
    return docsOf(query(colRef('tickets'), where('date', '==', date)));
  },
  async getTicketsInRange(startDate, endDate) {
    return docsOf(query(colRef('tickets'), where('date', '>=', startDate), where('date', '<=', endDate)));
  },
  async getOpenTickets() {
    return docsOf(query(colRef('tickets'), where('status', '==', 'open')));
  },
  async getAllTickets() {
    return docsOf(colRef('tickets'));
  },

  // ---------- attendance ----------
  async upsertAttendance(record) {
    await setDoc(doc(colRef('attendance'), record.id), record);
  },
  async getAttendanceByDate(date) {
    return docsOf(query(colRef('attendance'), where('date', '==', date)));
  },
  async getAllAttendance() {
    return docsOf(colRef('attendance'));
  },

  // ---------- expenses ----------
  async addExpense(expense) {
    await setDoc(doc(colRef('expenses'), expense.id), expense);
  },
  async deleteExpense(id) {
    await deleteDoc(doc(colRef('expenses'), id));
  },
  async getExpensesByDate(date) {
    return docsOf(query(colRef('expenses'), where('date', '==', date)));
  },
  async getExpensesInRange(startDate, endDate) {
    return docsOf(query(colRef('expenses'), where('date', '>=', startDate), where('date', '<=', endDate)));
  },

  // ---------- days ----------
  async getDay(date) {
    const snap = await getDoc(doc(colRef('days'), date));
    return snap.exists() ? snap.data() : null;
  },
  async saveDay(day) {
    await setDoc(doc(colRef('days'), day.date), day);
  },
  async getAllDays() {
    return docsOf(colRef('days'));
  },

  // ---------- backup ----------
  async exportAll() {
    const [settings, tickets, attendance, expenses, days] = await Promise.all([
      this.getSettings(),
      this.getAllTickets(),
      this.getAllAttendance(),
      docsOf(colRef('expenses')),
      this.getAllDays(),
    ]);
    return { exportedAt: new Date().toISOString(), version: 2, settings, tickets, attendance, expenses, days };
  },
  async importAll(data) {
    const ops = [];
    if (data.settings) ops.push(setDoc(userDocRef(), data.settings));
    (data.tickets || []).forEach((r) => ops.push(setDoc(doc(colRef('tickets'), r.id), r)));
    (data.attendance || []).forEach((r) => ops.push(setDoc(doc(colRef('attendance'), r.id), r)));
    (data.expenses || []).forEach((r) => ops.push(setDoc(doc(colRef('expenses'), r.id), r)));
    (data.days || []).forEach((r) => ops.push(setDoc(doc(colRef('days'), r.date), r)));
    await Promise.all(ops);
  },
  async wipeAll() {
    for (const name of ['tickets', 'attendance', 'expenses', 'days']) {
      const snap = await getDocs(colRef(name));
      if (snap.empty) continue;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await deleteDoc(userDocRef());
  },
};

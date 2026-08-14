// Capa de datos: IndexedDB envuelto en promesas. Sin librerías externas.
// Todo vive en el navegador del dispositivo (no hay servidor ni nube).

const DB_NAME = 'carwash-libre-db';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tickets')) {
        const s = db.createObjectStore('tickets', { keyPath: 'id' });
        s.createIndex('date', 'date');
        s.createIndex('status', 'status');
      }
      if (!db.objectStoreNames.contains('attendance')) {
        const s = db.createObjectStore('attendance', { keyPath: 'id' });
        s.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('expenses')) {
        const s = db.createObjectStore('expenses', { keyPath: 'id' });
        s.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('days')) {
        db.createObjectStore('days', { keyPath: 'date' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeNames, mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(storeNames, mode);
        let result;
        Promise.resolve(fn(t)).then((r) => (result = r));
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      })
  );
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function cursorAll(index, range) {
  return new Promise((resolve, reject) => {
    const out = [];
    const req = range ? index.openCursor(range) : index.openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        out.push(cursor.value);
        cursor.continue();
      } else {
        resolve(out);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export const DB = {
  // ---------- settings ----------
  async getSettings() {
    return tx('settings', 'readonly', (t) => reqToPromise(t.objectStore('settings').get('main')));
  },
  async saveSettings(settings) {
    settings.id = 'main';
    return tx('settings', 'readwrite', (t) => reqToPromise(t.objectStore('settings').put(settings)));
  },

  // ---------- tickets ----------
  async addTicket(ticket) {
    return tx('tickets', 'readwrite', (t) => reqToPromise(t.objectStore('tickets').add(ticket)));
  },
  async updateTicket(ticket) {
    return tx('tickets', 'readwrite', (t) => reqToPromise(t.objectStore('tickets').put(ticket)));
  },
  async deleteTicket(id) {
    return tx('tickets', 'readwrite', (t) => reqToPromise(t.objectStore('tickets').delete(id)));
  },
  async getTicket(id) {
    return tx('tickets', 'readonly', (t) => reqToPromise(t.objectStore('tickets').get(id)));
  },
  async getTicketsByDate(date) {
    return tx('tickets', 'readonly', (t) => {
      const idx = t.objectStore('tickets').index('date');
      return cursorAll(idx, IDBKeyRange.only(date));
    });
  },
  async getTicketsInRange(startDate, endDate) {
    return tx('tickets', 'readonly', (t) => {
      const idx = t.objectStore('tickets').index('date');
      return cursorAll(idx, IDBKeyRange.bound(startDate, endDate));
    });
  },
  async getOpenTickets() {
    return tx('tickets', 'readonly', (t) => {
      const idx = t.objectStore('tickets').index('status');
      return cursorAll(idx, IDBKeyRange.only('open'));
    });
  },
  async getAllTickets() {
    return tx('tickets', 'readonly', (t) => reqToPromise(t.objectStore('tickets').getAll()));
  },

  // ---------- attendance ----------
  async upsertAttendance(record) {
    return tx('attendance', 'readwrite', (t) => reqToPromise(t.objectStore('attendance').put(record)));
  },
  async getAttendanceByDate(date) {
    return tx('attendance', 'readonly', (t) => {
      const idx = t.objectStore('attendance').index('date');
      return cursorAll(idx, IDBKeyRange.only(date));
    });
  },
  async getAllAttendance() {
    return tx('attendance', 'readonly', (t) => reqToPromise(t.objectStore('attendance').getAll()));
  },

  // ---------- expenses ----------
  async addExpense(expense) {
    return tx('expenses', 'readwrite', (t) => reqToPromise(t.objectStore('expenses').add(expense)));
  },
  async deleteExpense(id) {
    return tx('expenses', 'readwrite', (t) => reqToPromise(t.objectStore('expenses').delete(id)));
  },
  async getExpensesByDate(date) {
    return tx('expenses', 'readonly', (t) => {
      const idx = t.objectStore('expenses').index('date');
      return cursorAll(idx, IDBKeyRange.only(date));
    });
  },
  async getExpensesInRange(startDate, endDate) {
    return tx('expenses', 'readonly', (t) => {
      const idx = t.objectStore('expenses').index('date');
      return cursorAll(idx, IDBKeyRange.bound(startDate, endDate));
    });
  },

  // ---------- days ----------
  async getDay(date) {
    return tx('days', 'readonly', (t) => reqToPromise(t.objectStore('days').get(date)));
  },
  async saveDay(day) {
    return tx('days', 'readwrite', (t) => reqToPromise(t.objectStore('days').put(day)));
  },
  async getAllDays() {
    return tx('days', 'readonly', (t) => reqToPromise(t.objectStore('days').getAll()));
  },

  // ---------- backup ----------
  async exportAll() {
    const [settings, tickets, attendance, expenses, days] = await Promise.all([
      this.getSettings(),
      this.getAllTickets(),
      this.getAllAttendance(),
      tx('expenses', 'readonly', (t) => reqToPromise(t.objectStore('expenses').getAll())),
      this.getAllDays(),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      version: 1,
      settings,
      tickets,
      attendance,
      expenses,
      days,
    };
  },
  async importAll(data) {
    return tx(
      ['settings', 'tickets', 'attendance', 'expenses', 'days'],
      'readwrite',
      (t) => {
        if (data.settings) t.objectStore('settings').put(data.settings);
        (data.tickets || []).forEach((r) => t.objectStore('tickets').put(r));
        (data.attendance || []).forEach((r) => t.objectStore('attendance').put(r));
        (data.expenses || []).forEach((r) => t.objectStore('expenses').put(r));
        (data.days || []).forEach((r) => t.objectStore('days').put(r));
      }
    );
  },
  async wipeAll() {
    return tx(
      ['settings', 'tickets', 'attendance', 'expenses', 'days'],
      'readwrite',
      (t) => {
        t.objectStore('settings').clear();
        t.objectStore('tickets').clear();
        t.objectStore('attendance').clear();
        t.objectStore('expenses').clear();
        t.objectStore('days').clear();
      }
    );
  },
};

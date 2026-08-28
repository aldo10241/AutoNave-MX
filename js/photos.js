// Evidencia fotográfica opcional por ticket (Firebase Storage), organizada
// igual que Firestore: users/{uid}/tickets/{ticketId}/{photoId}.jpg
// Las reglas de seguridad de Storage (ver README → "Evidencia fotográfica")
// vuelven a exigir el mismo límite de tamaño del lado del servidor, así que
// esto es solo para que la subida sea rápida y barata, no la única barrera.
import { storage } from './firebase.js';
import { getUid } from './auth.js';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

export const MAX_PHOTOS_PER_TICKET = 3;

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.72;

function uid() {
  const u = getUid();
  if (!u) throw new Error('No hay sesión activa');
  return u;
}

function newPhotoId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Redimensiona y comprime la foto en el navegador antes de subirla (de
// varios MB a ~150-300 KB), para no gastar datos móviles ni cuota de
// Storage de más.
async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen'))), 'image/jpeg', JPEG_QUALITY);
  });
}

export async function uploadTicketPhoto(ticketId, file) {
  const blob = await compressImage(file);
  const path = `users/${uid()}/tickets/${ticketId}/${newPhotoId()}.jpg`;
  const photoRef = ref(storage, path);
  await uploadBytes(photoRef, blob, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(photoRef);
  return { path, url };
}

export async function deleteTicketPhoto(path) {
  await deleteObject(ref(storage, path)).catch(() => {});
}

export async function deleteAllTicketPhotos(ticketId) {
  const folderRef = ref(storage, `users/${uid()}/tickets/${ticketId}`);
  const { items } = await listAll(folderRef).catch(() => ({ items: [] }));
  await Promise.all(items.map((item) => deleteObject(item).catch(() => {})));
}

export async function deleteAllUserPhotos() {
  const folderRef = ref(storage, `users/${uid()}/tickets`);
  const { prefixes } = await listAll(folderRef).catch(() => ({ prefixes: [] }));
  await Promise.all(
    prefixes.map((ticketFolder) =>
      listAll(ticketFolder).then((res) => Promise.all(res.items.map((item) => deleteObject(item).catch(() => {}))))
    )
  );
}

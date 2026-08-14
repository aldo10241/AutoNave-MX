import { auth } from './firebase.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

let currentUser = null;

export function onAuthChange(cb) {
  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    cb(user);
  });
}

export function getUid() {
  return currentUser ? currentUser.uid : null;
}

export function getCurrentUser() {
  return currentUser;
}

export function getUserLabel() {
  if (!currentUser) return 'Invitado';
  return currentUser.displayName || currentUser.email || 'Cuenta';
}

function friendlyError(err) {
  const map = {
    'auth/invalid-email': 'Ese correo no es válido.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Intenta iniciar sesión.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/popup-closed-by-user': 'Cerraste la ventana antes de terminar.',
    'auth/network-request-failed': 'Sin conexión a internet.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase (agrega tu dominio en Authentication → Settings → Authorized domains).',
  };
  return map[err?.code] || err?.message || 'Ocurrió un error. Intenta de nuevo.';
}

export async function signUp(email, password, name) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name) await updateProfile(cred.user, { displayName: name });
    return { user: cred.user };
  } catch (err) {
    return { error: friendlyError(err) };
  }
}

export async function signIn(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { user: cred.user };
  } catch (err) {
    return { error: friendlyError(err) };
  }
}

export async function signInGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    return { user: cred.user };
  } catch (err) {
    return { error: friendlyError(err) };
  }
}

export async function logOut() {
  await signOut(auth);
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { ok: true };
  } catch (err) {
    return { error: friendlyError(err) };
  }
}

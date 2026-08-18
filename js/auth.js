import { auth } from './firebase.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
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

// Con Google el correo ya viene verificado por Google; solo pedimos
// verificación para cuentas creadas con correo/contraseña.
export function needsEmailVerification() {
  if (!currentUser) return false;
  const isPasswordAccount = currentUser.providerData.some((p) => p.providerId === 'password');
  return isPasswordAccount && !currentUser.emailVerified;
}

export async function resendVerificationEmail() {
  if (!currentUser) return { error: 'No hay sesión activa.' };
  try {
    await sendEmailVerification(currentUser);
    return { ok: true };
  } catch (err) {
    return { error: friendlyError(err) };
  }
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
    'auth/too-many-requests': 'Demasiados intentos. Espera un momento y vuelve a intentar.',
    'auth/app-check-token-invalid': 'No pudimos verificar que eres una persona real. Recarga la página e intenta de nuevo.',
  };
  return map[err?.code] || err?.message || 'Ocurrió un error. Intenta de nuevo.';
}

export async function signUp(email, password, name) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name) await updateProfile(cred.user, { displayName: name });
    sendEmailVerification(cred.user).catch(() => {});
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

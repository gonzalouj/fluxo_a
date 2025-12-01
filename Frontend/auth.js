// auth.js
const STORAGE_KEY = 'fluxoUser';

// Capturar datos del callback de Google
const urlParams = new URLSearchParams(window.location.search);
const googleEmail = urlParams.get('google_email');
const userId = urlParams.get('user_id');
const userName = urlParams.get('user_name');
const userRol = urlParams.get('user_rol');

if (googleEmail && userId) {
  const user = {
    id: parseInt(userId),
    email: googleEmail,
    nombre: userName || googleEmail,
    rol: userRol || 'usuario',
    loggedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.history.replaceState({}, document.title, window.location.pathname);
}

function isLoggedIn() {
  return !!localStorage.getItem(STORAGE_KEY);
}

function getCurrentUser() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

function logout() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = 'login.html';
}

if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

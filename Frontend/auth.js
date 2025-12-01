// js/auth.js
const STORAGE_KEY = 'fluxoUser';

function isLoggedIn() {
  return !!localStorage.getItem(STORAGE_KEY);
}

if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

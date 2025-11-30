// js/login.js

const STORAGE_KEY = 'fluxoUser';

function isLoggedIn() {
  return !!localStorage.getItem(STORAGE_KEY);
}

// Si ya está loggeado y viene al login, lo mandamos a Inicio (index.html)
if (isLoggedIn()) {
  window.location.href = 'index.html';
}

const form = document.getElementById('loginForm');
const errorBox = document.getElementById('loginError');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  errorBox.style.display = 'none';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    errorBox.textContent = 'Ingresa correo y contraseña.';
    errorBox.style.display = 'block';
    return;
  }

  // 🔐 Aquí después se reemplaza por un fetch al backend (/api/login)
  // Por ahora aceptamos cualquier correo/clave:
  const fakeUser = {
    email,
    role: 'demo',          // esto luego vendrá desde la BD
    loggedAt: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(fakeUser));

  // Redirigir a "Inicio" (Gestión de pedidos)
  window.location.href = 'index.html';
});

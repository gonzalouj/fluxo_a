// login.js

const STORAGE_KEY = 'fluxoUser';

function isLoggedIn() {
  return !!localStorage.getItem(STORAGE_KEY);
}

// Si ya está loggeado, redirigir a inicio
if (isLoggedIn()) {
  window.location.href = 'index.html';
}

// Manejar errores del callback de Google
const urlParams = new URLSearchParams(window.location.search);
const error = urlParams.get('error');
const errorEmail = urlParams.get('email');
const errorBox = document.getElementById('loginError');

if (error === 'no_autorizado') {
  errorBox.textContent = `El correo ${errorEmail || ''} no está autorizado. Contacta al administrador.`;
  errorBox.style.display = 'block';
  window.history.replaceState({}, document.title, window.location.pathname);
} else if (error === 'usuario_inactivo') {
  errorBox.textContent = 'Tu cuenta está desactivada. Contacta al administrador.';
  errorBox.style.display = 'block';
  window.history.replaceState({}, document.title, window.location.pathname);
}

const form = document.getElementById('loginForm');

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

  // Por ahora solo Google
  errorBox.textContent = 'Por favor usa el botón "Iniciar sesión con Google".';
  errorBox.style.display = 'block';
});

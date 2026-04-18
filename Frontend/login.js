// login.js

const STORAGE_KEY = "fluxoUser";

function isLoggedIn() {
  return !!localStorage.getItem(STORAGE_KEY);
}

// Si ya está loggeado, redirigir a inicio
if (isLoggedIn()) {
  window.location.href = "index.html";
}

// Manejar errores del callback de Google
const urlParams = new URLSearchParams(window.location.search);
const error = urlParams.get("error");
const errorEmail = urlParams.get("email");
const errorBox = document.getElementById("loginError");

// Limpiar localStorage en caso de error para evitar estados inconsistentes
if (error) {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("usuario");

  // Mostrar mensaje de error según el tipo
  let mensaje = "";
  switch (error) {
    case "no_autorizado":
      mensaje = `El correo ${
        errorEmail || ""
      } no está autorizado. Contacta al administrador.`;
      break;
    case "usuario_inactivo":
      mensaje = "Tu cuenta está desactivada. Contacta al administrador.";
      break;
    case "no_code":
    case "exchange_failed":
    case "user_info_failed":
      mensaje = "Error al conectar con Google. Por favor intenta nuevamente.";
      break;
    case "database_error":
      mensaje = "Error del sistema. Contacta al administrador.";
      break;
    default:
      mensaje = "Error de autenticación. Por favor intenta nuevamente.";
  }

  errorBox.textContent = mensaje;
  errorBox.style.display = "block";

  // Limpiar URL sin recargar
  window.history.replaceState({}, document.title, window.location.pathname);
}

const form = document.getElementById("loginForm");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  errorBox.style.display = "none";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    errorBox.textContent = "Ingresa correo y contraseña.";
    errorBox.style.display = "block";
    return;
  }

  // Por ahora solo Google
  errorBox.textContent = 'Por favor usa el botón "Iniciar sesión con Google".';
  errorBox.style.display = "block";
});

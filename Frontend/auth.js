// auth.js - Sistema de autenticación y control de permisos por roles
const STORAGE_KEY = "fluxoUser";

/* ============================================
   FUNCIONES DE USUARIO
============================================ */

// Guardar usuario en localStorage
function guardarUsuario(usuario) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
}

// Obtener usuario actual
function getUsuarioActual() {
  const usuarioStr = localStorage.getItem(STORAGE_KEY);
  return usuarioStr ? JSON.parse(usuarioStr) : null;
}

// Verificar si está autenticado
function estaAutenticado() {
  return getUsuarioActual() !== null;
}

// Verificar si el usuario es Admin
function esAdmin() {
  const usuario = getUsuarioActual();
  return usuario && usuario.rol === "Admin";
}

// Verificar si el usuario es Trabajador
function esTrabajador() {
  const usuario = getUsuarioActual();
  return usuario && usuario.rol === "Trabajador";
}

// Cerrar sesión
function cerrarSesion() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = "/login.html";
}

/* ============================================
   CARGAR USUARIO DESDE BACKEND
============================================ */

// Obtener datos del usuario desde el backend
async function cargarUsuarioActual(email) {
  try {
    const response = await fetch(
      `/api/auth/me?email=${encodeURIComponent(email)}`
    );
    if (response.ok) {
      const usuario = await response.json();
      guardarUsuario(usuario);
      return usuario;
    } else {
      console.error("Error cargando usuario:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error cargando usuario:", error);
    return null;
  }
}

/* ============================================
   PROTECCIÓN DE PÁGINAS
============================================ */

// Proteger página según rol
function protegerPagina(rolesPermitidos = ["Admin", "Trabajador"]) {
  const usuario = getUsuarioActual();

  // Si no está autenticado, redirigir a login
  if (!usuario) {
    window.location.href = "/login.html";
    return false;
  }

  // Si no tiene el rol necesario, redirigir a página permitida
  if (!rolesPermitidos.includes(usuario.rol)) {
    if (usuario.rol === "Trabajador") {
      window.location.href = "/pedidos.html"; // Trabajadores van a pedidos activos
    } else {
      window.location.href = "/index.html"; // Admin va a crear pedido
    }
    return false;
  }

  return true;
}

/* ============================================
   REDIRECCIÓN SEGÚN ROL
============================================ */

// Redirigir después del login según rol
function redirigirSegunRol(usuario) {
  if (!usuario) return;

  if (usuario.rol === "Admin") {
    window.location.href = "/index.html"; // Admin va a crear pedido
  } else if (usuario.rol === "Trabajador") {
    window.location.href = "/pedidos.html"; // Trabajador va a pedidos activos
  } else {
    window.location.href = "/pedidos.html"; // Por defecto
  }
}

/* ============================================
   CAPTURA DE CALLBACK DE GOOGLE
============================================ */

// Capturar datos del callback de Google
(function () {
  // Solo ejecutar si no estamos en login.html
  if (window.location.pathname.includes("login.html")) return;

  const urlParams = new URLSearchParams(window.location.search);
  const googleEmail = urlParams.get("google_email");
  const userId = urlParams.get("user_id");
  const userName = urlParams.get("user_name");
  const userRol = urlParams.get("user_rol");

  if (googleEmail && userId) {
    const user = {
      id_usuario: parseInt(userId),
      email: googleEmail,
      nombre_completo: userName || googleEmail,
      rol: userRol || "Trabajador",
      activo: true,
    };
    guardarUsuario(user);

    // Limpiar URL
    window.history.replaceState({}, document.title, window.location.pathname);

    // Redirigir según rol
    redirigirSegunRol(user);
  }
})();

/* ============================================
   FUNCIONES LEGACY (para compatibilidad)
============================================ */

function isLoggedIn() {
  return estaAutenticado();
}

function getCurrentUser() {
  return getUsuarioActual();
}

function logout() {
  cerrarSesion();
}

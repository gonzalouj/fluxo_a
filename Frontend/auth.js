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

// Verificar sesión con el backend
async function verificarSesionConBackend() {
  const user = getCurrentUser();
  if (!user || !user.id) {
    return false;
  }

  try {
    const response = await fetch(`/api/usuarios/verificar/${user.id}`);
    const data = await response.json();
    
    if (!data.valid) {
      console.log('Sesión inválida:', data.reason);
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    
    // Actualizar datos locales si cambiaron en el servidor
    if (data.rol !== user.rol || data.nombre !== user.nombre) {
      user.rol = data.rol;
      user.nombre = data.nombre;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
    
    return true;
  } catch (error) {
    console.error('Error verificando sesión:', error);
    // En caso de error de red, permitir continuar con la sesión local
    return true;
  }
}

// Verificar autenticación
(async function() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  
  const sesionValida = await verificarSesionConBackend();
  if (!sesionValida) {
    window.location.href = 'login.html?error=sesion_expirada';
  }
})();

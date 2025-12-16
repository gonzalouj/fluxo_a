// push-ui.js
// Interfaz de usuario para notificaciones push
// Incluir después de push-subscription.js

(function() {
  'use strict';

  // Crear el botón de notificaciones en el header
  function createNotificationButton() {
    const actionsContainer = document.getElementById('header-actions');
    if (!actionsContainer) return;

    // Verificar si el botón ya existe
    if (document.getElementById('notification-toggle')) return;

    // Verificar si push es soportado
    if (!window.FluxoPush || !window.FluxoPush.isSupported()) {
      console.log('[PushUI] Push no soportado, no se muestra botón');
      return;
    }

    // Crear el botón
    const button = document.createElement('button');
    button.id = 'notification-toggle';
    button.className = 'p-2 hover:bg-gray-100 rounded-lg transition-colors relative';
    button.title = 'Notificaciones';
    button.innerHTML = `
      <svg id="notification-icon-off" class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
      </svg>
      <svg id="notification-icon-on" class="w-6 h-6 text-green-600 hidden" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"></path>
      </svg>
      <span id="notification-badge" class="hidden absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
    `;

    // Insertar antes del primer elemento
    actionsContainer.insertBefore(button, actionsContainer.firstChild);

    // Evento de clic
    button.addEventListener('click', toggleNotifications);

    // Actualizar estado inicial
    updateNotificationButtonState();
  }

  // Alternar estado de notificaciones
  async function toggleNotifications() {
    const button = document.getElementById('notification-toggle');
    if (!button) return;

    // Deshabilitar temporalmente
    button.disabled = true;
    button.classList.add('opacity-50');

    try {
      const isSubscribed = await window.FluxoPush.isSubscribed();

      if (isSubscribed) {
        // Cancelar suscripción
        await window.FluxoPush.unsubscribe();
        showToast('Notificaciones desactivadas', 'info');
      } else {
        // Suscribir
        const success = await window.FluxoPush.requestPermission();
        if (success) {
          showToast('¡Notificaciones activadas!', 'success');
        } else {
          showToast('No se pudieron activar las notificaciones', 'error');
        }
      }
    } catch (error) {
      console.error('[PushUI] Error:', error);
      showToast('Error con las notificaciones', 'error');
    } finally {
      button.disabled = false;
      button.classList.remove('opacity-50');
      updateNotificationButtonState();
    }
  }

  // Actualizar apariencia del botón según estado
  async function updateNotificationButtonState() {
    const iconOff = document.getElementById('notification-icon-off');
    const iconOn = document.getElementById('notification-icon-on');
    const badge = document.getElementById('notification-badge');

    if (!iconOff || !iconOn) return;

    try {
      const isSubscribed = await window.FluxoPush.isSubscribed();

      if (isSubscribed) {
        iconOff.classList.add('hidden');
        iconOn.classList.remove('hidden');
        badge?.classList.add('hidden');
      } else {
        iconOff.classList.remove('hidden');
        iconOn.classList.add('hidden');
        // Mostrar badge para indicar que no están activadas
        badge?.classList.remove('hidden');
      }
    } catch (error) {
      // Por defecto, mostrar como desactivadas
      iconOff.classList.remove('hidden');
      iconOn.classList.add('hidden');
    }
  }

  // Mostrar toast de notificación
  function showToast(message, type = 'info') {
    // Buscar si ya existe un toast container
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-20 right-4 z-50 space-y-2';
      document.body.appendChild(container);
    }

    // Crear toast
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    };
    toast.className = `${colors[type] || colors.info} text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
    toast.textContent = message;

    container.appendChild(toast);

    // Animar entrada
    setTimeout(() => toast.classList.remove('translate-x-full'), 10);

    // Remover después de 3 segundos
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Inicializar cuando el DOM y el header estén listos
  function init() {
    // Esperar a que el header esté cargado
    const checkHeader = setInterval(() => {
      const actionsContainer = document.getElementById('header-actions');
      if (actionsContainer && window.FluxoPush) {
        clearInterval(checkHeader);
        createNotificationButton();
      }
    }, 100);

    // Timeout de seguridad
    setTimeout(() => clearInterval(checkHeader), 5000);
  }

  // Iniciar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

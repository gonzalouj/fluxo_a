// sw.js - Service Worker para notificaciones push
// Este archivo debe estar en la raíz del frontend

// Evento de instalación
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker instalado');
  self.skipWaiting();
});

// Evento de activación
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activado');
  event.waitUntil(clients.claim());
});

// Evento de notificación push recibida
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event);

  let data = {
    title: 'FLUXO',
    body: 'Nueva notificación',
    icon: '/icon-192.png',
    url: '/pedidos.html',
    tag: 'fluxo-notification'
  };

  // Parsear datos del servidor si existen
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      console.log('[SW] Error parseando payload:', e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-72.png',
    tag: data.tag || 'fluxo-notification',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/pedidos.html'
    },
    actions: [
      {
        action: 'ver',
        title: 'Ver pedido'
      },
      {
        action: 'cerrar',
        title: 'Cerrar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Evento de clic en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Clic en notificación:', event.action);

  event.notification.close();

  // Si hace clic en "cerrar", no hacer nada más
  if (event.action === 'cerrar') {
    return;
  }

  // Abrir o enfocar la ventana de la app
  const urlToOpen = event.notification.data?.url || '/pedidos.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Buscar si ya hay una ventana abierta
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Evento de cierre de notificación (swipe away)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificación cerrada por el usuario');
});

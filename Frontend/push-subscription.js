// push-subscription.js
// Manejo de suscripción a notificaciones push
// Incluir este script después de auth.js en las páginas que necesiten push

(function () {
  "use strict";

  // ========= CONFIGURACIÓN =========
  const PUSH_ENABLED_KEY = "fluxoPushEnabled";

  // ========= FUNCIONES PRINCIPALES =========

  // Verificar si el navegador soporta push
  function isPushSupported() {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  // Registrar el Service Worker
  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("[Push] Service Worker registrado:", registration.scope);
      return registration;
    } catch (error) {
      console.error("[Push] Error registrando Service Worker:", error);
      return null;
    }
  }

  // Obtener la clave VAPID del servidor
  async function getVAPIDPublicKey() {
    try {
      const response = await fetch("/api/push/vapid-key");
      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error("[Push] Error obteniendo VAPID key:", error);
      return null;
    }
  }

  // Convertir la clave VAPID de base64 a Uint8Array
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Suscribir al usuario a notificaciones push
  async function subscribeToPush(registration) {
    const vapidPublicKey = await getVAPIDPublicKey();
    if (!vapidPublicKey) {
      console.error("[Push] No se pudo obtener la clave VAPID");
      return null;
    }

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log(
        "[Push] Suscripción creada:",
        subscription.endpoint.substring(0, 50) + "..."
      );
      return subscription;
    } catch (error) {
      console.error("[Push] Error creando suscripción:", error);
      return null;
    }
  }

  // Guardar suscripción en el servidor
  async function saveSubscriptionOnServer(subscription) {
    const user = getCurrentUser();
    if (!user || !user.id) {
      console.error("[Push] Usuario no autenticado");
      return false;
    }

    try {
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          user_id: user.id,
        }),
      });

      if (response.ok) {
        console.log("[Push] Suscripción guardada en servidor");
        localStorage.setItem(PUSH_ENABLED_KEY, "true");
        return true;
      } else {
        console.error(
          "[Push] Error guardando suscripción:",
          await response.text()
        );
        return false;
      }
    } catch (error) {
      console.error("[Push] Error enviando suscripción al servidor:", error);
      return false;
    }
  }

  // Pedir permiso y suscribir
  async function requestPushPermission() {
    if (!isPushSupported()) {
      console.log("[Push] Push no soportado en este navegador");
      return false;
    }

    // Verificar si ya tenemos permiso
    if (Notification.permission === "denied") {
      console.log("[Push] Permisos denegados por el usuario");
      return false;
    }

    // Pedir permiso si no lo tenemos
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("[Push] Usuario no concedió permiso");
        return false;
      }
    }

    // Registrar SW y suscribir
    const registration = await registerServiceWorker();
    if (!registration) return false;

    // Esperar a que el SW esté activo
    await navigator.serviceWorker.ready;

    // Verificar si ya existe una suscripción
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await subscribeToPush(registration);
    }

    if (subscription) {
      return await saveSubscriptionOnServer(subscription);
    }

    return false;
  }

  // Cancelar suscripción
  async function unsubscribeFromPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Eliminar del servidor
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Cancelar localmente
        await subscription.unsubscribe();
        localStorage.removeItem(PUSH_ENABLED_KEY);
        console.log("[Push] Suscripción cancelada");
      }
    } catch (error) {
      console.error("[Push] Error cancelando suscripción:", error);
    }
  }

  // Verificar estado de suscripción
  async function isPushSubscribed() {
    if (!isPushSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      return false;
    }
  }

  // ========= INICIALIZACIÓN =========

  // Inicializar push cuando el usuario esté autenticado
  async function initPush() {
    // Solo inicializar si el usuario está logueado
    if (typeof isLoggedIn !== "function" || !isLoggedIn()) {
      return;
    }

    if (!isPushSupported()) {
      console.log("[Push] Notificaciones push no soportadas");
      return;
    }

    // Registrar el Service Worker siempre
    await registerServiceWorker();

    // Si ya está habilitado, refrescar la suscripción
    if (localStorage.getItem(PUSH_ENABLED_KEY) === "true") {
      const subscribed = await isPushSubscribed();
      if (!subscribed) {
        // Re-suscribir si se perdió la suscripción
        await requestPushPermission();
      }
    }
  }

  // Exponer funciones globalmente
  window.FluxoPush = {
    isSupported: isPushSupported,
    requestPermission: requestPushPermission,
    unsubscribe: unsubscribeFromPush,
    isSubscribed: isPushSubscribed,
  };

  // Inicializar cuando el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPush);
  } else {
    initPush();
  }
})();

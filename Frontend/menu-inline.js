// menu-inline.js
// Sistema de menú lateral - versión inline que funciona sin servidor

document.addEventListener("DOMContentLoaded", () => {
  // Obtener usuario actual para filtrar opciones
  const usuario = getUsuarioActual ? getUsuarioActual() : null;
  const esAdminUsuario = usuario && usuario.rol === "Admin";

  // Construir opciones de menú según rol
  let opcionesMenu = "";

  // Crear Pedido - Solo Admin
  if (esAdminUsuario) {
    opcionesMenu += `
                    <li>
                        <a href="index.html" class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                            <svg class="w-5 h-5 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            <span class="font-medium text-gray-900 group-hover:text-blue-600">Crear Pedido</span>
                        </a>
                    </li>`;
  }

  // Pedidos Activos - Todos
  opcionesMenu += `
                    <li>
                        <a href="pedidos.html" class="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group">
                            <svg class="w-5 h-5 text-gray-500 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            <span class="font-medium text-gray-900 group-hover:text-green-600">Pedidos Activos</span>
                        </a>
                    </li>`;

  // Historial de Pedidos - Todos
  opcionesMenu += `
                    <li>
                        <a href="historial.html" class="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group">
                            <svg class="w-5 h-5 text-gray-500 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span class="font-medium text-gray-900 group-hover:text-purple-600">Historial de Pedidos</span>
                        </a>
                    </li>`;

  // Catálogo de Productos - Solo Admin
  if (esAdminUsuario) {
    opcionesMenu += `
                    <li>
                        <a href="catalogo.html" class="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors group">
                            <svg class="w-5 h-5 text-gray-500 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                            <span class="font-medium text-gray-900 group-hover:text-orange-600">Catálogo de Productos</span>
                        </a>
                    </li>`;
  }

  // Gestión de Usuarios - Solo Admin
  if (esAdminUsuario) {
    opcionesMenu += `
                    <li>
                        <a href="usuarios.html" class="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors group">
                            <svg class="w-5 h-5 text-gray-500 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                            <span class="font-medium text-gray-900 group-hover:text-indigo-600">Gestión de Usuarios</span>
                        </a>
                    </li>`;
  }

  // Cerrar Sesión - Todos
  opcionesMenu += `
                    <li class="mt-4 pt-4 border-t border-gray-200">
                        <button onclick="cerrarSesion()" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors group text-left">
                            <svg class="w-5 h-5 text-gray-500 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                            </svg>
                            <div>
                                <div class="font-medium text-gray-900 group-hover:text-red-600">Cerrar Sesión</div>
                                ${
                                  usuario
                                    ? `<div class="text-xs text-gray-500">${
                                        usuario.nombre_completo || usuario.email
                                      }</div>`
                                    : ""
                                }
                            </div>
                        </button>
                    </li>`;

  // HTML del menú lateral
  const menuHTML = `
        <div id="menu-overlay" class="fixed inset-0 bg-black bg-opacity-20 z-[55] hidden"></div>
        <div id="mobile-menu" class="fixed inset-y-0 left-0 w-64 bg-white z-[60] shadow-lg transform -translate-x-full transition-transform duration-300 ease-in-out">
            <div class="flex items-center justify-between p-4 border-b">
                <h2 class="text-xl font-bold text-gray-800">Menú</h2>
                <button id="close-menu-button" class="p-2 hover:bg-gray-100 rounded-lg">
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="p-4">
                <ul class="space-y-1">
                    ${opcionesMenu}
                </ul>
            </div>
        </div>
    `;

  // Función para inicializar los listeners del menú
  const initializeMenu = () => {
    const menuToggle = document.getElementById("menu-toggle"); // Botón hamburguesa en el header
    const mobileMenu = document.getElementById("mobile-menu"); // El menú que inyectamos
    const closeMenuButton = document.getElementById("close-menu-button"); // Botón 'X' en el menú
    const menuOverlay = document.getElementById("menu-overlay");

    // Función para deshabilitar funciones del header
    const disableHeaderFunctions = () => {
      const searchInput = document.getElementById("search-input");
      const filterToggle = document.getElementById("filter-toggle");
      const saveBtn = document.getElementById("save-btn");
      const resetBtn = document.getElementById("reset-btn");

      if (searchInput) {
        searchInput.disabled = true;
        searchInput.style.pointerEvents = "none";
      }
      if (filterToggle) {
        filterToggle.disabled = true;
        filterToggle.style.pointerEvents = "none";
      }
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.style.pointerEvents = "none";
      }
      if (resetBtn) {
        resetBtn.disabled = true;
        resetBtn.style.pointerEvents = "none";
      }
    };

    // Función para habilitar funciones del header
    const enableHeaderFunctions = () => {
      const searchInput = document.getElementById("search-input");
      const filterToggle = document.getElementById("filter-toggle");
      const saveBtn = document.getElementById("save-btn");
      const resetBtn = document.getElementById("reset-btn");

      if (searchInput) {
        searchInput.disabled = false;
        searchInput.style.pointerEvents = "auto";
      }
      if (filterToggle) {
        filterToggle.disabled = false;
        filterToggle.style.pointerEvents = "auto";
      }
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.style.pointerEvents = "auto";
      }
      if (resetBtn) {
        resetBtn.disabled = false;
        resetBtn.style.pointerEvents = "auto";
      }
    };

    // Función para abrir/cerrar
    const toggleMenu = () => {
      if (mobileMenu && menuOverlay) {
        const isOpen = !mobileMenu.classList.contains("-translate-x-full");

        // ✅ CAMBIO 2: Eliminamos la manipulación de opacidad del header.
        // El overlay se encargará de todo de manera uniforme.
        if (isOpen) {
          // Cerrar menú
          mobileMenu.classList.add("-translate-x-full");
          menuOverlay.classList.add("hidden");
          enableHeaderFunctions();
        } else {
          // Abrir menú
          mobileMenu.classList.remove("-translate-x-full");
          menuOverlay.classList.remove("hidden");
          disableHeaderFunctions();
        }
      }
    };

    // Función para cerrar el menú (solo cerrar)
    const closeMenu = () => {
      if (mobileMenu && menuOverlay) {
        const isOpen = !mobileMenu.classList.contains("-translate-x-full");
        if (isOpen) {
          // ✅ CAMBIO 3: También eliminamos la manipulación de opacidad aquí.
          mobileMenu.classList.add("-translate-x-full");
          menuOverlay.classList.add("hidden");
          enableHeaderFunctions();
        }
      }
    };

    // Cerrar menú al hacer click en el overlay
    if (menuOverlay) {
      menuOverlay.onclick = closeMenu;
    }

    // Asignar evento al botón de hamburguesa (que está en el header dinámico)
    if (menuToggle) {
      // Remover listeners anteriores si existen
      menuToggle.removeEventListener("click", toggleMenu);
      menuToggle.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevenir que el evento se propague al header
        toggleMenu();
      });
    }

    // Asignar evento al botón de cerrar (que está en el componente)
    if (closeMenuButton) {
      closeMenuButton.removeEventListener("click", toggleMenu);
      closeMenuButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevenir que el evento se propague
        toggleMenu();
      });
    }

    // Agregar evento al header para cerrar el menú
    const header = document.querySelector("header");
    if (header) {
      header.removeEventListener("click", closeMenu);
      header.addEventListener("click", (e) => {
        // Solo cerrar si el menú está abierto y no se hizo click en el botón hamburguesa o sus elementos hijos
        if (
          !mobileMenu.classList.contains("-translate-x-full") &&
          e.target.id !== "menu-toggle" &&
          !e.target.closest("#menu-toggle")
        ) {
          closeMenu();
        }
      });
    }
  };

  // Cargar el menú
  const menuPlaceholder = document.getElementById("menu-placeholder");
  if (menuPlaceholder) {
    menuPlaceholder.innerHTML = menuHTML;
    // Inicializar el menú después de crearlo
    initializeMenu();
  }

  // Observador para detectar cuando se carga el header dinámico
  const headerObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "childList" &&
        mutation.target.id === "header-placeholder"
      ) {
        // El header se ha cargado, inicializar el menú
        setTimeout(initializeMenu, 100); // Pequeño delay para asegurar que el DOM esté listo
      }
    });
  });

  // Observar cambios en el placeholder del header
  const headerPlaceholder = document.getElementById("header-placeholder");
  if (headerPlaceholder) {
    headerObserver.observe(headerPlaceholder, {
      childList: true,
      subtree: true,
    });
  }
});

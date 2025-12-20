// header-inline.js
// Sistema de headers híbridos - versión inline que funciona sin servidor

document.addEventListener("DOMContentLoaded", () => {
  // Configuración por página
  const pageConfigs = {
    "index.html": {
      title: "Crear Pedido",
      actions: [], // Sin acciones extra
      extra: null, // Sin contenido extra
    },
    "pedidos.html": {
      title: "Pedidos Activos",
      actions: ["filter"], // Botón de filtro
      extra: "search", // Barra de búsqueda
    },
    "historial.html": {
      title: "Historial de Pedidos",
      actions: ["filter"], // Botón de filtro
      extra: "search", // Barra de búsqueda
    },
    "catalogo.html": {
      title: "Catálogo de Productos",
      actions: [], // Sin acciones extra
      extra: null, // Sin contenido extra
    },
    "usuarios.html": {
      title: "Gestión de Usuarios",
      actions: [], // Sin acciones extra
      extra: null, // Sin contenido extra
    },
    "configuracion.html": {
      title: "Configuración",
      actions: ["save", "reset"], // Botones de guardar y reset
      extra: null,
    },
  };

  // HTML del header base
  const headerBaseHTML = `
        <header class="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <button id="menu-toggle" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                    <h1 id="page-title" class="text-xl md:text-2xl font-bold text-gray-800">Título por defecto</h1>
                    <div id="header-actions" class="flex items-center space-x-2"></div>
                </div>
                <div id="header-extra" class="mt-4"></div>
            </div>
        </header>
    `;

  // Función para cargar el header
  function loadHeader() {
    const currentPage = window.location.pathname.split("/").pop();
    const config = pageConfigs[currentPage] || pageConfigs["index.html"];

    // Inyectar header base
    const headerPlaceholder = document.getElementById("header-placeholder");
    if (headerPlaceholder) {
      headerPlaceholder.innerHTML = headerBaseHTML;

      // Aplicar configuración específica
      applyPageConfig(config);

      // Inicializar eventos del header
      initializeHeaderEvents();

      // Ajustar padding del body para el header fijo
      setTimeout(adjustBodyPadding, 100);
    }
  }

  // Función para ajustar el padding del body
  function adjustBodyPadding() {
    const header = document.querySelector("header");
    if (header) {
      const headerHeight = header.offsetHeight;
      document.body.style.paddingTop = headerHeight + "px";
    }
  }

  // Función para aplicar configuración de página
  function applyPageConfig(config) {
    // 1. Aplicar título
    const titleElement = document.getElementById("page-title");
    if (titleElement) {
      titleElement.textContent = config.title;
    }

    // 2. Aplicar acciones
    const actionsContainer = document.getElementById("header-actions");
    if (actionsContainer) {
      actionsContainer.innerHTML = "";

      config.actions.forEach((action) => {
        const actionHTML = createActionHTML(action);
        if (actionHTML) {
          actionsContainer.innerHTML += actionHTML;
        }
      });
    }

    // 3. Aplicar contenido extra
    const extraContainer = document.getElementById("header-extra");
    if (extraContainer) {
      extraContainer.innerHTML = "";

      if (config.extra) {
        const extraHTML = createExtraHTML(config.extra);
        if (extraHTML) {
          extraContainer.innerHTML = extraHTML;
        }
      }
    }
  }

  // Función para crear HTML de acciones
  function createActionHTML(action) {
    switch (action) {
      case "filter":
        return `
                    <button id="filter-toggle" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                        </svg>
                    </button>
                `;
      case "save":
        return `
                    <button id="save-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Guardar
                    </button>
                `;
      case "reset":
        return `
                    <button id="reset-btn" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        Reset
                    </button>
                `;
      default:
        return "";
    }
  }

  // Función para crear HTML de contenido extra
  function createExtraHTML(extra) {
    switch (extra) {
      case "search":
        return `
                    <div class="relative">
                        <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <input 
                            id="search-input"
                            type="text" 
                            placeholder="Buscar por cliente, teléfono o producto..." 
                            class="search-input w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                        />
                        <button 
                            id="search-clear"
                            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors hidden"
                            title="Limpiar búsqueda"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                `;
      case "stats":
        return `
                    <div class="flex space-x-4 text-sm text-gray-600">
                        <span>Total: <strong>150</strong></span>
                        <span>Pendientes: <strong>25</strong></span>
                        <span>Completados: <strong>125</strong></span>
                    </div>
                `;
      default:
        return "";
    }
  }

  // Función para inicializar eventos del header
  function initializeHeaderEvents() {
    // Evento del botón de filtro
    const filterToggle = document.getElementById("filter-toggle");
    if (filterToggle) {
      filterToggle.addEventListener("click", function () {
        console.log("Filtro clicked - funcionalidad pendiente");
        // TODO: Implementar panel de filtros
      });
    }

    // Evento del botón de búsqueda
    const searchInput = document.getElementById("search-input");
    const searchClear = document.getElementById("search-clear");

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        const value = this.value;

        // Mostrar/ocultar botón de limpiar
        if (searchClear) {
          if (value.trim() !== "") {
            searchClear.classList.remove("hidden");
          } else {
            searchClear.classList.add("hidden");
          }
        }

        // Actualizar variable global de búsqueda si existe (para páginas que lo soporten)
        if (typeof textoBusqueda !== "undefined") {
          textoBusqueda = value;

          // Si existe la función renderizarPedidos, ejecutarla (página de pedidos)
          if (typeof renderizarPedidos === "function") {
            renderizarPedidos();
          }
        } else {
          console.log("Búsqueda:", value, "- funcionalidad pendiente");
        }
      });
    }

    // Evento del botón de limpiar búsqueda
    if (searchClear) {
      searchClear.addEventListener("click", function () {
        if (searchInput) {
          searchInput.value = "";
          searchInput.dispatchEvent(new Event("input")); // Trigger input event
          searchInput.focus();
        }
      });
    }

    // Evento del botón de guardar
    const saveBtn = document.getElementById("save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        console.log("Guardar clicked - funcionalidad pendiente");
        // TODO: Implementar guardado
      });
    }

    // Evento del botón de reset
    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        console.log("Reset clicked - funcionalidad pendiente");
        // TODO: Implementar reset
      });
    }
  }

  // Cargar header al inicializar
  loadHeader();

  // Ajustar padding cuando la ventana cambie de tamaño
  window.addEventListener("resize", function () {
    setTimeout(adjustBodyPadding, 50);
  });
});

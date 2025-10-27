// historial.js

// --- CONSTANTES Y ESTADO GLOBAL ---
const API_BASE = "/api";
let pedidosData = [];
let pedidoActual = null;
let textoBusqueda = ""; // Estado para la búsqueda
let accionAConfirmar = null; // Para el modal de confirmación

// Estado de filtros
let filtrosActivos = {
  estados: [], // Array de estados seleccionados: ['Pendiente', 'Listo', 'Entregado', 'Cancelado']
  fechaEntrega: {
    tipo: "todos", // 'todos', 'hoy', 'semana', 'mes', 'personalizado'
    desde: null,
    hasta: null,
  },
  fechaCreacion: {
    tipo: "todos", // 'todos', 'hoy', 'semana', 'mes', 'personalizado'
    desde: null,
    hasta: null,
  },
};

// ✅ CONFIGURACIÓN DE ESTADOS CON COLORES
const estadosConfig = {
  Pendiente: {
    bg: "bg-yellow-500",
    bgLight: "bg-yellow-100",
    text: "text-yellow-800",
    icon: "⏳",
    label: "Pendiente",
  },
  Listo: {
    bg: "bg-blue-600",
    bgLight: "bg-blue-100",
    text: "text-blue-800",
    icon: "✓",
    label: "Listo",
  },
  Entregado: {
    bg: "bg-green-600",
    bgLight: "bg-green-100",
    text: "text-green-800",
    icon: "✓✓",
    label: "Entregado",
  },
  Cancelado: {
    bg: "bg-red-600",
    bgLight: "bg-red-100",
    text: "text-red-800",
    icon: "✕",
    label: "Cancelado",
  },
};

// --- REFERENCIAS AL DOM ---
const listaEl = document.getElementById("lista-pedidos");
const loadingEl = document.getElementById("loading");
const emptyStateEl = document.getElementById("empty-state");
const modalEl = document.getElementById("modal-detalle");
const modalConfirmacionEl = document.getElementById("modal-confirmacion");

// --- FUNCIONES DE FORMATO ---
function getStatusClass(estado) {
  const config = estadosConfig[estado];
  return config ? config.bg : "bg-gray-500";
}

function getStatusBadgeClasses(estado) {
  const config = estadosConfig[estado];
  return config
    ? `${config.bgLight} ${config.text}`
    : "bg-gray-100 text-gray-800";
}

function formatDate(fecha) {
  if (!fecha) return "Sin fecha";
  try {
    const date = new Date(fecha + "T00:00:00");
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return fecha;
  }
}

function formatShortDate(fecha) {
  if (!fecha) return "Sin fecha";
  try {
    const date = new Date(fecha.split("T")[0] + "T00:00:00");
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return fecha;
  }
}

function capitalize(v) {
  return v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : "";
}

// --- LÓGICA DEL MODAL DE DETALLES ---
function abrirModal(pedidoId) {
  const pedido = pedidosData.find((p) => p.id_pedido === pedidoId);
  if (!pedido) {
    console.error("No se pudo encontrar el pedido con ID:", pedidoId);
    mostrarNotificacion("Error al cargar el pedido.", "error");
    return;
  }

  pedidoActual = pedido;
  const estado = pedido.estado || "Pendiente";
  const config = estadosConfig[estado] || estadosConfig["Pendiente"];

  document.getElementById("modal-titulo").textContent =
    pedido.nombre_cliente || "Cliente sin nombre";
  const fechaCreacionStr = pedido.fecha_creacion
    ? pedido.fecha_creacion.Time || pedido.fecha_creacion
    : null;
  document.getElementById("modal-fecha-creacion").textContent = `Pedido #${
    pedido.id_pedido
  } • Creado el ${formatShortDate(fechaCreacionStr)}`;

  document.getElementById(
    "modal-status-indicator"
  ).className = `w-5 h-5 rounded-full flex-shrink-0 ${config.bg}`;

  const badgeEl = document.getElementById("modal-estado-badge");
  badgeEl.textContent = estado;
  badgeEl.className = `px-4 py-2 rounded-full font-semibold status-badge-large ${config.bgLight} ${config.text}`;

  document.getElementById("modal-cliente").textContent =
    pedido.nombre_cliente || "Sin nombre";

  const emailContainer = document.getElementById("modal-email-container");
  if (pedido.email_cliente) {
    emailContainer.style.display = "flex";
    document.getElementById("modal-email").textContent = pedido.email_cliente;
  } else {
    emailContainer.style.display = "none";
  }

  const telefonoContainer = document.getElementById("modal-telefono-container");
  if (pedido.telefono_cliente) {
    telefonoContainer.style.display = "flex";
    document.getElementById("modal-telefono").textContent =
      pedido.telefono_cliente;
  } else {
    telefonoContainer.style.display = "none";
  }

  document.getElementById("modal-fecha-entrega").textContent = formatDate(
    pedido.fecha_entrega
  );

  const productosEl = document.getElementById("modal-productos");
  if (pedido.productos && pedido.productos.length > 0) {
    productosEl.innerHTML = pedido.productos
      .map(
        (prod) => `
        <div class="flex justify-between items-center bg-white rounded-lg p-3">
          <div>
            <span class="text-sm font-medium text-gray-900">${
              prod.producto || "Producto sin nombre"
            }</span>
            <div class="text-xs text-gray-500 mt-1">${
              prod.cantidad || 0
            } unidad${prod.cantidad !== 1 ? "es" : ""}</div>
          </div>
        </div>`
      )
      .join("");
  } else {
    productosEl.innerHTML = `<div class="text-center py-4 text-gray-500"><p class="text-sm italic">Sin productos asociados</p></div>`;
  }

  // Renderizar Etiquetas
  const etiquetasContainer = document.getElementById(
    "modal-etiquetas-container"
  );
  const etiquetasEl = document.getElementById("modal-etiquetas");
  const etiquetasStr = pedido.detalles_pedido || "";

  if (etiquetasStr) {
    etiquetasContainer.style.display = "block";
    const etiquetas = etiquetasStr
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    etiquetasEl.innerHTML = etiquetas
      .map(
        (tag) =>
          `<span class="inline-block bg-purple-200 text-purple-800 text-xs font-semibold px-2.5 py-1 rounded-full">${tag}</span>`
      )
      .join("");
  } else {
    etiquetasContainer.style.display = "none";
  }

  // Renderizar Comentarios
  document.getElementById("modal-comentarios-container").style.display =
    "block";
  const comentariosListEl = document.getElementById("modal-comentarios-list");
  renderizarComentarios(comentariosListEl, pedido.comentarios || []);

  // Renderizar botón de reactivación si el pedido está cancelado
  const modalActions = document.getElementById("modal-actions");
  if (estado === "Cancelado") {
    modalActions.innerHTML = `
      <button
        onclick="reactivarPedido()"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reactivar Pedido
      </button>
    `;
  } else {
    modalActions.innerHTML = "";
  }

  modalEl.classList.remove("hidden");
  modalEl.classList.add("flex");
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  modalEl.classList.add("hidden");
  modalEl.classList.remove("flex");
  document.body.style.overflow = "";
  pedidoActual = null;
}

// --- LÓGICA DEL MODAL DE CONFIRMACIÓN ---
function abrirConfirmacion(titulo, mensaje, colorBoton, accion) {
  document.getElementById("confirmacion-titulo").textContent = titulo;
  document.getElementById("confirmacion-mensaje").textContent = mensaje;

  const botonAccion = document.getElementById("confirmacion-boton-accion");
  botonAccion.className = `w-full px-4 py-2.5 text-white rounded-lg font-medium transition-colors ${colorBoton}`;

  const iconoEl = document.getElementById("confirmacion-icono");
  iconoEl.className = `w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${colorBoton}`;

  accionAConfirmar = accion;
  modalConfirmacionEl.classList.remove("hidden");
}

function cerrarConfirmacion() {
  modalConfirmacionEl.classList.add("hidden");
  accionAConfirmar = null;
}

function confirmarAccion() {
  if (typeof accionAConfirmar === "function") {
    accionAConfirmar();
  }
  cerrarConfirmacion();
}

// Función para reactivar un pedido cancelado
async function reactivarPedido() {
  if (!pedidoActual) return;

  // Guardar el ID del pedido antes de abrir la confirmación
  const pedidoId = pedidoActual.id_pedido;

  abrirConfirmacion(
    "¿Reactivar pedido?",
    `El pedido #${pedidoId} pasará a estado "Pendiente" y volverá a aparecer en la Vista General.`,
    "bg-blue-600 hover:bg-blue-700",
    () => ejecutarReactivacion(pedidoId)
  );
}

async function ejecutarReactivacion(pedidoId) {
  try {
    const response = await fetch(`${API_BASE}/pedidos/${pedidoId}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ estado: "Pendiente" }),
    });

    if (!response.ok) {
      throw new Error("Error al reactivar el pedido");
    }

    // Actualizar el pedido en el array local
    const index = pedidosData.findIndex((p) => p.id_pedido === pedidoId);
    if (index !== -1) {
      pedidosData[index].estado = "Pendiente"; // ✅ Corregido: era estado_pedido
    }

    // Cerrar modal de detalle
    cerrarModal();

    // Recargar la vista
    renderizarPedidos();

    // Actualizar estadísticas
    actualizarEstadisticas();

    // Mostrar notificación de éxito
    mostrarNotificacion(
      `✓ Pedido #${pedidoId} reactivado correctamente`,
      "success"
    );
  } catch (error) {
    console.error("Error al reactivar pedido:", error);
    mostrarNotificacion(
      "Error al reactivar el pedido. Por favor, intenta nuevamente.",
      "error"
    );
  }
}

// Helper para renderizar comentarios
function renderizarComentarios(container, comentarios) {
  if (comentarios && comentarios.length > 0) {
    container.innerHTML = comentarios
      .map(
        (c) =>
          `<div class="bg-white p-3 rounded-lg border border-gray-200">
            <div class="flex justify-between items-center mb-1">
              <p class="text-xs font-bold text-gray-800">${
                c.usuario || "Usuario desconocido"
              }</p>
              <p class="text-xs text-gray-500">${c.fecha || ""}</p>
            </div>
            <p class="text-sm text-gray-700 whitespace-pre-wrap break-words">${
              c.comentario || "Sin comentario."
            }</p>
          </div>`
      )
      .join("");
  } else {
    container.innerHTML = `<p class="text-sm text-gray-500">No hay comentarios para este pedido.</p>`;
  }
}

// --- LÓGICA DE NOTIFICACIONES ---
function mostrarNotificacion(mensaje, tipo) {
  const notif = document.createElement("div");
  notif.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transform translate-x-full transition-transform duration-300 ${
    tipo === "success" ? "bg-green-500" : "bg-red-500"
  }`;
  notif.textContent = mensaje;
  document.body.appendChild(notif);
  setTimeout(() => {
    notif.style.transform = "translateX(0)";
  }, 100);
  setTimeout(() => {
    notif.style.transform = "translateX(100%)";
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// --- LÓGICA DE RENDERIZADO Y CARGA DE DATOS ---
function renderPedidoCard(pedido) {
  const estado = pedido.estado || "Pendiente";
  const statusClass = getStatusClass(estado);
  const nombreCliente = pedido.nombre_cliente || "Cliente sin nombre";
  const statusBadgeClasses = getStatusBadgeClasses(estado);

  // Extraer y formatear la fecha de creación
  const fechaCreacionStr =
    pedido.fecha_creacion?.Time || pedido.fecha_creacion || "";
  const fechaCreacionFormateada = formatShortDate(fechaCreacionStr);

  // Formatear la fecha de entrega
  const fechaEntregaFormateada = formatShortDate(pedido.fecha_entrega);

  // Tarjeta minimalista: solo nombre, fecha de entrega, fecha de creación y estado
  return `<div class="pedido-card bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all p-4" onclick='abrirModal(${
    pedido.id_pedido
  })'>
    <div class="flex items-center justify-between gap-3">
      <!-- Indicador de estado y nombre del cliente -->
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="w-3 h-3 rounded-full ${statusClass} flex-shrink-0"></div>
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-semibold text-gray-900 truncate">${nombreCliente}</h3>
          <p class="text-sm text-gray-600 mt-0.5 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span>Entrega: ${fechaEntregaFormateada}</span>
          </p>
        </div>
      </div>
      
      <!-- Estado y fecha de creación -->
      <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span class="text-xs px-2.5 py-1 rounded-full font-medium ${statusBadgeClasses}">${capitalize(
    estado
  )}</span>
        <div class="flex items-center text-xs text-gray-500">
          <svg class="w-3.5 h-3.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Creado el ${fechaCreacionFormateada}
        </div>
      </div>
    </div>
  </div>`;
}

function actualizarEstadisticas() {
  const total = pedidosData.length;
  const pendiente = pedidosData.filter((p) => p.estado === "Pendiente").length;
  const listo = pedidosData.filter((p) => p.estado === "Listo").length;
  const entregado = pedidosData.filter((p) => p.estado === "Entregado").length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-pendiente").textContent = pendiente;
  document.getElementById("stat-listo").textContent = listo;
  document.getElementById("stat-entregado").textContent = entregado;
}

function renderizarPedidos() {
  // Comenzar con todos los pedidos
  let pedidosFiltrados = [...pedidosData];

  // Aplicar filtro de búsqueda si hay texto
  if (textoBusqueda.trim() !== "") {
    pedidosFiltrados = filtrarPedidosPorTexto(pedidosFiltrados, textoBusqueda);
  }

  // Aplicar filtros de estado y fecha
  pedidosFiltrados = aplicarFiltros(pedidosFiltrados);

  // Ordenar por fecha de creación (más recientes primero)
  pedidosFiltrados.sort((a, b) => {
    // Extraer la fecha de creación de cada pedido
    const fechaA = a.fecha_creacion?.Time || a.fecha_creacion || "";
    const fechaB = b.fecha_creacion?.Time || b.fecha_creacion || "";

    // Convertir a Date para comparar
    const dateA = new Date(fechaA);
    const dateB = new Date(fechaB);

    // Ordenar descendente (más reciente primero)
    return dateB - dateA;
  });

  if (pedidosFiltrados.length === 0) {
    emptyStateEl.classList.remove("hidden");
    listaEl.classList.add("hidden");

    // Actualizar mensaje según si hay búsqueda activa
    if (textoBusqueda.trim() !== "") {
      emptyStateEl.querySelector("p.text-lg").textContent =
        "No se encontraron pedidos";
      emptyStateEl.querySelector(
        "p.text-sm"
      ).textContent = `No hay resultados para "${textoBusqueda}"`;
    } else {
      emptyStateEl.querySelector("p.text-lg").textContent = "No hay pedidos";
      emptyStateEl.querySelector("p.text-sm").textContent =
        "Aún no se han creado pedidos en el sistema";
    }
    return;
  }

  listaEl.innerHTML = pedidosFiltrados.map(renderPedidoCard).join("");
  listaEl.classList.remove("hidden");
  emptyStateEl.classList.add("hidden");
}

// Función para filtrar pedidos por texto de búsqueda
function filtrarPedidosPorTexto(pedidos, texto) {
  const textoLower = texto.toLowerCase().trim();

  return pedidos.filter((pedido) => {
    // 1. Buscar en nombre del cliente
    const matchNombre = pedido.nombre_cliente
      ?.toLowerCase()
      .includes(textoLower);

    // 2. Buscar en teléfono del cliente
    const matchTelefono = pedido.telefono_cliente?.includes(textoLower);

    // 3. Buscar en email del cliente
    const matchEmail = pedido.email_cliente?.toLowerCase().includes(textoLower);

    // 4. Buscar en productos (nombres)
    const matchProductos = pedido.productos?.some((producto) =>
      producto.producto?.toLowerCase().includes(textoLower)
    );

    // 5. Buscar por ID del pedido
    const matchId = pedido.id_pedido?.toString().includes(textoLower);

    // Si coincide en CUALQUIERA de estos campos, mostrar el pedido
    return (
      matchNombre || matchTelefono || matchEmail || matchProductos || matchId
    );
  });
}

// Función para aplicar filtros de estado y fecha
function aplicarFiltros(pedidos) {
  return pedidos.filter((pedido) => {
    // 1. Filtro por estado
    if (filtrosActivos.estados.length > 0) {
      if (!filtrosActivos.estados.includes(pedido.estado)) {
        return false;
      }
    }

    // 2. Filtro por fecha de entrega
    if (filtrosActivos.fechaEntrega.tipo !== "todos") {
      const [year, month, day] = pedido.fecha_entrega.split("-").map(Number);
      const fechaEntrega = new Date(year, month - 1, day);
      fechaEntrega.setHours(0, 0, 0, 0);

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      switch (filtrosActivos.fechaEntrega.tipo) {
        case "hoy": {
          const fechaEntregaStr = fechaEntrega.toDateString();
          const hoyStr = hoy.toDateString();
          if (fechaEntregaStr !== hoyStr) return false;
          break;
        }
        case "semana": {
          const finSemana = new Date(hoy);
          const diaActual = hoy.getDay();

          if (diaActual === 0) {
            finSemana.setHours(23, 59, 59, 999);
          } else {
            const diasHastaDomingo = 7 - diaActual;
            finSemana.setDate(finSemana.getDate() + diasHastaDomingo);
            finSemana.setHours(23, 59, 59, 999);
          }

          if (fechaEntrega < hoy || fechaEntrega > finSemana) return false;
          break;
        }
        case "mes": {
          if (
            fechaEntrega.getMonth() !== hoy.getMonth() ||
            fechaEntrega.getFullYear() !== hoy.getFullYear()
          ) {
            return false;
          }
          break;
        }
        case "personalizado": {
          if (
            filtrosActivos.fechaEntrega.desde &&
            filtrosActivos.fechaEntrega.hasta
          ) {
            const [yearDesde, monthDesde, dayDesde] =
              filtrosActivos.fechaEntrega.desde.split("-").map(Number);
            const desde = new Date(yearDesde, monthDesde - 1, dayDesde);
            desde.setHours(0, 0, 0, 0);

            const [yearHasta, monthHasta, dayHasta] =
              filtrosActivos.fechaEntrega.hasta.split("-").map(Number);
            const hasta = new Date(yearHasta, monthHasta - 1, dayHasta);
            hasta.setHours(23, 59, 59, 999);

            if (fechaEntrega < desde || fechaEntrega > hasta) return false;
          }
          break;
        }
      }
    }

    // 3. Filtro por fecha de creación
    if (filtrosActivos.fechaCreacion.tipo !== "todos") {
      // Extraer la fecha de creación
      const fechaCreacionStr =
        pedido.fecha_creacion?.Time || pedido.fecha_creacion || "";
      if (!fechaCreacionStr) return false;

      // Parsear la fecha de creación (formato ISO)
      const fechaCreacion = new Date(fechaCreacionStr);
      fechaCreacion.setHours(0, 0, 0, 0);

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      switch (filtrosActivos.fechaCreacion.tipo) {
        case "hoy": {
          const fechaCreacionDate = fechaCreacion.toDateString();
          const hoyStr = hoy.toDateString();
          if (fechaCreacionDate !== hoyStr) return false;
          break;
        }
        case "semana": {
          const inicioSemana = new Date(hoy);
          const diaActual = hoy.getDay();

          // Calcular inicio de la semana (lunes)
          const diasDesdeInicio = diaActual === 0 ? 6 : diaActual - 1;
          inicioSemana.setDate(inicioSemana.getDate() - diasDesdeInicio);
          inicioSemana.setHours(0, 0, 0, 0);

          const finSemana = new Date(inicioSemana);
          finSemana.setDate(finSemana.getDate() + 6);
          finSemana.setHours(23, 59, 59, 999);

          if (fechaCreacion < inicioSemana || fechaCreacion > finSemana)
            return false;
          break;
        }
        case "mes": {
          if (
            fechaCreacion.getMonth() !== hoy.getMonth() ||
            fechaCreacion.getFullYear() !== hoy.getFullYear()
          ) {
            return false;
          }
          break;
        }
        case "personalizado": {
          if (
            filtrosActivos.fechaCreacion.desde &&
            filtrosActivos.fechaCreacion.hasta
          ) {
            const [yearDesde, monthDesde, dayDesde] =
              filtrosActivos.fechaCreacion.desde.split("-").map(Number);
            const desde = new Date(yearDesde, monthDesde - 1, dayDesde);
            desde.setHours(0, 0, 0, 0);

            const [yearHasta, monthHasta, dayHasta] =
              filtrosActivos.fechaCreacion.hasta.split("-").map(Number);
            const hasta = new Date(yearHasta, monthHasta - 1, dayHasta);
            hasta.setHours(23, 59, 59, 999);

            if (fechaCreacion < desde || fechaCreacion > hasta) return false;
          }
          break;
        }
      }
    }

    return true;
  });
}

async function cargarPedidos() {
  try {
    const res = await fetch(`${API_BASE}/pedidos`);
    if (!res.ok) throw new Error("Error al cargar pedidos");
    const data = await res.json();
    pedidosData = data.pedidos || [];
    loadingEl.classList.add("hidden");
    actualizarEstadisticas();
    renderizarPedidos();
  } catch (e) {
    loadingEl.classList.add("hidden");
    listaEl.innerHTML = `<div class="text-center py-12"><div class="text-red-400 mb-4"><svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.19 2.5 1.732 2.5z"></path></svg></div><p class="text-red-500 text-lg font-medium">Error de conexión</p><p class="text-gray-500 text-sm mt-1">No se pudo conectar con el servidor</p></div>`;
    listaEl.classList.remove("hidden");
    emptyStateEl.classList.add("hidden");
    console.error(e);
  }
}

// --- LÓGICA DEL PANEL DE FILTROS ---
function inicializarPanelFiltros() {
  const panel = document.getElementById("filtros-panel");
  const overlay = document.getElementById("filtros-overlay");
  const closeBtn = document.getElementById("filtros-close");
  const aplicarBtn = document.getElementById("filtros-aplicar");
  const limpiarBtn = document.getElementById("filtros-limpiar");

  // Abrir panel desde el header (el botón se crea dinámicamente)
  document.addEventListener("click", (e) => {
    if (e.target.id === "filter-toggle" || e.target.closest("#filter-toggle")) {
      panel.classList.toggle("active");
      panel.classList.toggle("hidden");
    }
  });

  // Cerrar panel
  const cerrarPanel = () => {
    panel.classList.remove("active");
    setTimeout(() => {
      panel.classList.add("hidden");
    }, 300);
  };

  overlay.addEventListener("click", cerrarPanel);
  closeBtn.addEventListener("click", cerrarPanel);

  // Aplicar filtros
  aplicarBtn.addEventListener("click", () => {
    // Recoger estados seleccionados
    const estadoCheckboxes = document.querySelectorAll(
      ".filtro-estado-checkbox:checked"
    );
    filtrosActivos.estados = Array.from(estadoCheckboxes).map((cb) => cb.value);

    // Recoger filtro de fecha de entrega
    const fechaPreset = document.querySelector(
      ".filtro-fecha-radio:checked"
    ).value;
    filtrosActivos.fechaEntrega.tipo = fechaPreset;

    if (fechaPreset === "personalizado") {
      filtrosActivos.fechaEntrega.desde =
        document.getElementById("fecha-desde").value;
      filtrosActivos.fechaEntrega.hasta =
        document.getElementById("fecha-hasta").value;
    }

    // Recoger filtro de fecha de creación
    const fechaCreacionPreset = document.querySelector(
      ".filtro-fecha-creacion-radio:checked"
    ).value;
    filtrosActivos.fechaCreacion.tipo = fechaCreacionPreset;

    if (fechaCreacionPreset === "personalizado") {
      filtrosActivos.fechaCreacion.desde = document.getElementById(
        "fecha-creacion-desde"
      ).value;
      filtrosActivos.fechaCreacion.hasta = document.getElementById(
        "fecha-creacion-hasta"
      ).value;
    }

    // Actualizar badge de contador de filtros
    actualizarBadgeFiltros();

    // Renderizar con los nuevos filtros
    renderizarPedidos();
    cerrarPanel();
  });

  // Limpiar filtros
  limpiarBtn.addEventListener("click", () => {
    // Reset estado
    filtrosActivos.estados = [];
    filtrosActivos.fechaEntrega = {
      tipo: "todos",
      desde: null,
      hasta: null,
    };
    filtrosActivos.fechaCreacion = {
      tipo: "todos",
      desde: null,
      hasta: null,
    };

    // Reset UI - Estados
    document
      .querySelectorAll(".filtro-estado-checkbox")
      .forEach((cb) => (cb.checked = false));

    // Reset UI - Fecha de entrega
    document
      .querySelectorAll(".filtro-fecha-radio")
      .forEach((radio) => (radio.checked = radio.value === "todos"));
    document.getElementById("fecha-desde").value = "";
    document.getElementById("fecha-hasta").value = "";
    document
      .getElementById("fecha-personalizada-inputs")
      .classList.add("hidden");

    // Reset UI - Fecha de creación
    document
      .querySelectorAll(".filtro-fecha-creacion-radio")
      .forEach((radio) => (radio.checked = radio.value === "todos"));
    document.getElementById("fecha-creacion-desde").value = "";
    document.getElementById("fecha-creacion-hasta").value = "";
    document
      .getElementById("fecha-creacion-personalizada-inputs")
      .classList.add("hidden");

    // Actualizar badge
    actualizarBadgeFiltros();

    // Renderizar sin filtros
    renderizarPedidos();
    cerrarPanel();
  });

  // Toggle fecha personalizada
  document.querySelectorAll(".filtro-fecha-radio").forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const inputsContainer = document.getElementById(
        "fecha-personalizada-inputs"
      );
      if (e.target.value === "personalizado") {
        inputsContainer.classList.remove("hidden");
      } else {
        inputsContainer.classList.add("hidden");
      }
    });
  });

  // Toggle fecha de creación personalizada
  document.querySelectorAll(".filtro-fecha-creacion-radio").forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const inputsContainer = document.getElementById(
        "fecha-creacion-personalizada-inputs"
      );
      if (e.target.value === "personalizado") {
        inputsContainer.classList.remove("hidden");
      } else {
        inputsContainer.classList.add("hidden");
      }
    });
  });
}

function actualizarBadgeFiltros() {
  let contador = 0;

  // Contar filtros activos
  if (filtrosActivos.estados.length > 0) {
    contador += filtrosActivos.estados.length;
  }

  if (filtrosActivos.fechaEntrega.tipo !== "todos") {
    contador += 1;
  }

  if (filtrosActivos.fechaCreacion.tipo !== "todos") {
    contador += 1;
  }

  // Actualizar badge en el botón de filtros (se crea dinámicamente en el header)
  const filterBtn = document.getElementById("filter-toggle");
  if (filterBtn) {
    let badge = filterBtn.querySelector(".filter-badge");

    if (contador > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "filter-badge";
        filterBtn.style.position = "relative";
        filterBtn.appendChild(badge);
      }
      badge.textContent = contador;
    } else {
      if (badge) {
        badge.remove();
      }
    }
  }
}

// --- EVENT LISTENERS GLOBALES ---
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!modalEl.classList.contains("hidden")) {
      cerrarModal();
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  cargarPedidos();
  inicializarPanelFiltros();

  // Listener para búsqueda en el header (se crea dinámicamente)
  document.addEventListener("input", (e) => {
    if (e.target.id === "search-input") {
      textoBusqueda = e.target.value;
      renderizarPedidos();
    }
  });
});

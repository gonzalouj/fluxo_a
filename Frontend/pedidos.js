// pedidos.js

// --- CONSTANTES Y ESTADO GLOBAL ---
const API_BASE = "/api";
let pedidosData = [];
let pedidoActual = null;
let accionAConfirmar = null;
let calendar = null;
let vistaActual = "lista"; // "lista" o "calendario"
let textoBusqueda = ""; // Estado para la búsqueda

// Estado de filtros
let filtrosActivos = {
  estados: [], // Array de estados seleccionados: ['Pendiente', 'Listo', 'Entregado', 'Cancelado']
  fechaEntrega: {
    tipo: "todos", // 'todos', 'hoy', 'manana', 'semana', 'proximos7', 'mes', 'personalizado'
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
const modalEdicionEl = document.getElementById("modal-edicion"); // Nuevo modal
const calendarContainerEl = document.getElementById("calendar-container");

// Estado para el modal de edición
let allProducts = [];
let edicionSelectedProducts = [];

// --- PLACEHOLDERS DE UI (Funcionalidad pendiente) ---
document.getElementById("menu-toggle")?.addEventListener("click", function () {
  console.log("Menú toggle - funcionalidad pendiente");
});
document
  .getElementById("filter-toggle")
  ?.addEventListener("click", function () {
    console.log("Filtro toggle - funcionalidad pendiente");
  });
document.getElementById("search-input")?.addEventListener("input", function () {
  console.log("Búsqueda:", this.value, "- funcionalidad pendiente");
});

// --- FUNCIONES DE FORMATO ---
function getStatusClass(estado) {
  const config = estadosConfig[estado];
  return config ? config.bg : "bg-gray-500";
}

// ✅ ACTUALIZADO: Función para obtener las clases de color para la etiqueta de estado en la tarjeta.
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
    // Añadir 'T00:00:00' asegura que la fecha se interprete en la zona horaria local del usuario,
    // previniendo el error común de que se muestre el día anterior.
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

function formatNumber(numero) {
  if (!numero && numero !== 0) return "0";
  return new Intl.NumberFormat("es-CL").format(numero);
}

function capitalize(v) {
  return v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : "";
}

// Función para formatear precios (mantener para compatibilidad interna)
function formatCLP(value) {
  // Retorna cadena vacía para ocultar precios al usuario
  return "";
}

// --- LÓGICA DEL MODAL DE DETALLES ---
// (Esta sección no tiene cambios)
function abrirModal(pedidoId) {
  // CAMBIO CLAVE: Buscamos el pedido en la fuente de datos principal.
  const pedido = pedidosData.find((p) => p.id_pedido === pedidoId);
  if (!pedido) {
    console.error("No se pudo encontrar el pedido con ID:", pedidoId);
    mostrarNotificacion("Error al cargar el pedido.", "error");
    return;
  }

  pedidoActual = pedido; // Ahora `pedidoActual` es una referencia directa al objeto en `pedidosData`.
  const estado = pedido.estado || "Pendiente"; // ✅ Mantener capitalizado
  const config = estadosConfig[estado] || estadosConfig["Pendiente"]; // ✅ Usar configuración

  document.getElementById("modal-titulo").textContent =
    pedido.nombre_cliente || "Cliente sin nombre";
  const fechaCreacionStr = pedido.fecha_creacion
    ? pedido.fecha_creacion.Time || pedido.fecha_creacion
    : null;
  document.getElementById("modal-fecha-creacion").textContent = `Pedido #${
    pedido.id_pedido
  } • Creado el ${formatShortDate(fechaCreacionStr)}`;

  // ✅ Usar color del estado para el indicador
  document.getElementById(
    "modal-status-indicator"
  ).className = `w-5 h-5 rounded-full flex-shrink-0 ${config.bg}`;

  // ✅ Usar colores del badge para el estado
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

  // ✅ CAMBIO: Se añade la lógica para mostrar el teléfono del cliente si existe.
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
      .map((prod) => {
        return `<div 
          class="flex justify-between items-center bg-white rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition-colors border border-gray-200 hover:border-blue-300" 
          onclick="mostrarDetalleProducto(${prod.id_producto})"
        >
          <div>
            <span class="text-sm font-medium text-gray-900">${
              prod.producto || "Producto sin nombre"
            }</span>
            <div class="text-xs text-gray-500 mt-1">${
              prod.cantidad || 0
            } unidad${prod.cantidad !== 1 ? "es" : ""} • $${formatNumber(
          prod.precio_unitario_congelado || 0
        )}</div>
          </div>
          <div class="text-blue-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>`;
      })
      .join("");
  } else {
    productosEl.innerHTML = `<div class="text-center py-4 text-gray-500"><p class="text-sm italic">Sin productos asociados</p></div>`;
  }

  // Renderizar Etiquetas
  const etiquetasContainer = document.getElementById(
    "modal-etiquetas-container"
  );
  const etiquetasEl = document.getElementById("modal-etiquetas");
  const etiquetasStr = pedido.detalles_pedido || ""; // Ahora 'detalles_pedido' solo contiene etiquetas

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

  // Renderizar Comentarios de la tabla 'comentarios'
  document.getElementById("modal-comentarios-container").style.display =
    "block";
  const comentariosListEl = document.getElementById("modal-comentarios-list");
  renderizarComentarios(comentariosListEl, pedido.comentarios || []);

  // ✅ NUEVO: Lógica de botones según el estado actual
  const actionsEl = document.getElementById("modal-actions");

  if (estado === "Pendiente") {
    // Pendiente → Puede pasar a Listo o Cancelado
    actionsEl.innerHTML = `
      <div class="flex items-center justify-center gap-3">
        <button onclick="cambiarEstado('Cancelado')" class="action-button flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium text-sm hover:from-red-600 hover:to-red-700 transition-all">
          <span class="flex items-center justify-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Cancelar
          </span>
        </button>
        <button onclick="cambiarEstado('Listo')" class="action-button flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium text-sm hover:from-blue-600 hover:to-blue-700 transition-all">
          <span class="flex items-center justify-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Marcar Listo
          </span>
        </button>
      </div>`;
  } else if (estado === "Listo") {
    // Listo → Puede pasar a Entregado o Cancelado
    actionsEl.innerHTML = `
      <div class="flex items-center justify-center gap-3">
        <button onclick="cambiarEstado('Cancelado')" class="action-button flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium text-sm hover:from-red-600 hover:to-red-700 transition-all">
          <span class="flex items-center justify-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Cancelar
          </span>
        </button>
        <button onclick="cambiarEstado('Entregado')" class="action-button flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium text-sm hover:from-green-600 hover:to-green-700 transition-all">
          <span class="flex items-center justify-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Marcar Entregado
          </span>
        </button>
      </div>`;
  } else {
    // Entregado o Cancelado → Sin acciones (estados finales)
    actionsEl.innerHTML = "";
  }

  modalEl.classList.remove("hidden");
  modalEl.classList.add("flex");
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  modalEl.classList.add("hidden");
  modalEl.classList.remove("flex"); // Asegurarse de quitar flex al cerrar
  document.body.style.overflow = "";
  pedidoActual = null;
}

// ========= INICIO: LÓGICA DEL MODAL DE EDICIÓN =========

// Función placeholder que el HTML ya está llamando
function abrirModalEdicion() {
  if (!pedidoActual) return;

  // 1. Cargar productos (si no se han cargado) y luego abrir el modal
  if (allProducts.length === 0) {
    cargarProductosParaEdicion().then(() => {
      poblarYAbrirModalEdicion();
    });
  } else {
    poblarYAbrirModalEdicion();
  }
}

function poblarYAbrirModalEdicion() {
  // 2. Poblar el formulario con los datos del pedido actual
  const form = document.getElementById("form-edicion");
  form.querySelector('[name="cliente"]').value =
    pedidoActual.nombre_cliente || "";

  // Asignar fecha y establecer la fecha mínima para hoy
  const fechaInput = form.querySelector('[name="fecha"]');
  fechaInput.value = pedidoActual.fecha_entrega
    ? pedidoActual.fecha_entrega.split("T")[0]
    : "";
  const hoy = new Date().toISOString().split("T")[0];
  fechaInput.setAttribute("min", hoy);

  form.querySelector('[name="email"]').value = pedidoActual.email_cliente || "";
  form.querySelector('[name="telefono"]').value =
    pedidoActual.telefono_cliente || "";

  // En edición, las etiquetas van en su campo.
  form.querySelector('[name="etiquetas"]').value =
    pedidoActual.detalles_pedido || "";

  // Elemento edicion-subtitulo no existe en el HTML actual
  // document.getElementById(
  //   "edicion-subtitulo"
  // ).textContent = `Modificando el pedido #${pedidoActual.id_pedido} para el cliente ${pedidoActual.nombre_cliente}`;

  // 3. Poblar la lista de productos seleccionados
  edicionSelectedProducts = (pedidoActual.productos || []).map((p) => {
    // Hacemos una búsqueda en la lista completa de productos para obtener todos los detalles
    const fullProduct = allProducts.find(
      (ap) => ap.id_producto === p.id_producto
    );
    return {
      id_producto: p.id_producto,
      nombre: p.producto, // Usamos el nombre del pedido (puede ser histórico)
      codigo: fullProduct ? fullProduct.codigo : "N/A", // Obtenemos el código si existe
      precio_unitario: p.precio_unitario, // Usamos el precio congelado del pedido
      cantidad: p.cantidad,
    };
  });
  renderEdicionSelectedProducts();

  // 4. Transición de modals: ocultar detalles, mostrar edición
  modalEl.classList.add("hidden");
  modalEdicionEl.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // 5. Inicializar listeners del modal de edición
  inicializarListenersEdicion();

  // 6. Inicializar el botón de agregar producto (debe hacerse cada vez que se abre el modal)
  const addProductBtn = document.getElementById("edicion-add-product-btn");
  if (addProductBtn) {
    // Remover listener anterior si existe para evitar duplicados
    addProductBtn.replaceWith(addProductBtn.cloneNode(true));
    const newBtn = document.getElementById("edicion-add-product-btn");
    newBtn.addEventListener("click", () => {
      console.log("🔵 Botón clickeado, abriendo modal...");
      abrirProductModal();
    });
    console.log("✅ Botón de agregar producto configurado correctamente");
  } else {
    console.error(
      "❌ No se encontró el botón edicion-add-product-btn en el DOM"
    );
  }
}

function cerrarModalEdicion() {
  modalEdicionEl.classList.add("hidden");
  document.body.style.overflow = "";
  edicionSelectedProducts = []; // Limpiar estado de edición
}

function cancelarEdicion() {
  cerrarModalEdicion();
  if (pedidoActual) {
    abrirModal(pedidoActual.id_pedido); // Reabre el modal de detalles con los datos previos a la edición
  }
}

async function cargarProductosParaEdicion() {
  try {
    const res = await fetch(`${API_BASE}/productos`);
    if (!res.ok) throw new Error("Error al cargar productos para edición");
    const data = await res.json();
    allProducts = data.productos || [];
  } catch (e) {
    console.error("Error:", e);
    mostrarNotificacion(
      "No se pudieron cargar los productos para la edición",
      "error"
    );
  }
}

// --- Renderizado y Lógica del Buscador de Productos (en Edición) ---
function renderEdicionSelectedProducts() {
  const container = document.getElementById("edicion-selected-products");
  const noProductsMsg = document.getElementById("edicion-no-products-message");
  if (edicionSelectedProducts.length === 0) {
    noProductsMsg.classList.remove("hidden");
    container.innerHTML = "";
  } else {
    noProductsMsg.classList.add("hidden");
    container.innerHTML = edicionSelectedProducts
      .map(
        (p) => `
        <div class="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm break-words">
                ${p.nombre} (${p.codigo || "N/A"})
                ${
                  p.es_temporal
                    ? '<span class="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">⏱️ Temporal</span>'
                    : ""
                }
              </p>
              <p class="text-xs text-gray-500">${formatCLP(
                p.precio_unitario || 0
              )}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <label class="text-sm font-medium whitespace-nowrap">Cant:</label>
              <input type="number" value="${
                p.cantidad
              }" min="1" onchange="updateEdicionQuantity('${
          p.id_producto
        }', this.value)" class="w-16 p-1 border border-gray-300 rounded text-center">
            </div>
            <button type="button" onclick="removeEdicionProduct('${
              p.id_producto
            }')" class="shrink-0 text-red-500 hover:text-red-700 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
        </div>`
      )
      .join("");
  }
}

function renderEdicionSearchResults(results) {
  const container = document.getElementById("edicion-search-results");
  container.innerHTML =
    results.length === 0
      ? '<p class="p-3 text-sm text-gray-500">No se encontraron productos.</p>'
      : results
          .map(
            (p) =>
              `<div class="p-3 cursor-pointer hover:bg-gray-100 border-b" onclick="selectEdicionProduct(${
                p.id_producto
              })"><p class="font-semibold text-sm">${
                p.nombre
              }</p><p class="text-xs text-gray-500">${p.codigo} - ${formatCLP(
                p.precio_unitario
              )}</p></div>`
          )
          .join("");
  container.classList.remove("hidden");
}

function selectEdicionProduct(productId) {
  if (edicionSelectedProducts.some((p) => p.id_producto === productId)) {
    mostrarNotificacion("Este producto ya ha sido agregado.", "error");
    return;
  }
  const productToAdd = allProducts.find((p) => p.id_producto === productId);
  if (productToAdd) {
    edicionSelectedProducts.push({ ...productToAdd, cantidad: 1 });
    renderEdicionSelectedProducts();
  }
  document.getElementById("edicion-product-search").value = "";
  document.getElementById("edicion-search-results").classList.add("hidden");
}

function removeEdicionProduct(productId) {
  console.log(
    "🗑️ Eliminando producto con ID:",
    productId,
    "Tipo:",
    typeof productId
  );
  edicionSelectedProducts = edicionSelectedProducts.filter(
    (p) => String(p.id_producto) !== String(productId)
  );
  renderEdicionSelectedProducts();
}

function updateEdicionQuantity(productId, newQuantity) {
  const quantity = parseInt(newQuantity);
  if (quantity < 1) {
    mostrarNotificacion("La cantidad mínima es 1.", "error");
    renderEdicionSelectedProducts();
    return;
  }
  console.log(
    "📝 Actualizando cantidad para producto:",
    productId,
    "Nueva cantidad:",
    quantity
  );
  const product = edicionSelectedProducts.find(
    (p) => String(p.id_producto) === String(productId)
  );
  if (product) {
    product.cantidad = quantity;
    console.log("✅ Cantidad actualizada correctamente");
  } else {
    console.error("❌ No se encontró el producto con ID:", productId);
  }
}

// --- Listeners para el modal de edición ---
let listenersEdicionInicializados = false;
function inicializarListenersEdicion() {
  if (listenersEdicionInicializados) return;

  const searchInput = document.getElementById("edicion-product-search");
  const searchResults = document.getElementById("edicion-search-results");
  const toggleBtn = document.getElementById("edicion-toggle-product-list-btn");
  const fechaInput = document.querySelector("#form-edicion [name='fecha']");
  const telefonoInput = document.querySelector(
    "#form-edicion [name='telefono']"
  );

  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.length < 2) {
      searchResults.classList.add("hidden");
      return;
    }
    const results = allProducts.filter(
      (p) =>
        (p.nombre && p.nombre.toLowerCase().includes(searchTerm)) ||
        (p.codigo && p.codigo.toLowerCase().includes(searchTerm))
    );
    renderEdicionSearchResults(results);
  });

  toggleBtn.addEventListener("click", () => {
    searchResults.classList.toggle("hidden");
    if (!searchResults.classList.contains("hidden")) {
      renderEdicionSearchResults(allProducts);
    }
  });

  document.addEventListener("click", (e) => {
    if (
      !searchInput.contains(e.target) &&
      !searchResults.contains(e.target) &&
      !toggleBtn.contains(e.target)
    ) {
      searchResults.classList.add("hidden");
    }
  });

  // --- Validación de Teléfono con Aviso Sutil (Modal Edición) ---
  const telefonoWarning = document.getElementById("edicion-telefono-warning");
  let warningTimeout;

  telefonoInput.addEventListener("input", () => {
    const originalValue = telefonoInput.value;
    const sanitizedValue = originalValue.replace(/[^0-9]/g, "");

    if (originalValue !== sanitizedValue) {
      telefonoWarning.textContent = "Solo se permiten números.";
      clearTimeout(warningTimeout);
      warningTimeout = setTimeout(() => {
        telefonoWarning.textContent = "";
      }, 2000);
    }
    telefonoInput.value = sanitizedValue;
  });

  listenersEdicionInicializados = true;
}

// --- Guardado de cambios ---
async function guardarCambiosPedido() {
  if (!pedidoActual) return;

  const currentPedidoId = pedidoActual.id_pedido;
  const form = document.getElementById("form-edicion");
  const submitBtnText = document.getElementById("edicion-submit-text");
  const submitBtnSpinner = document.getElementById("edicion-submit-spinner");

  // Validaciones previas
  const cliente = form.querySelector('[name="cliente"]').value;
  const fecha = form.querySelector('[name="fecha"]').value;

  if (!cliente || !fecha) {
    mostrarNotificacion(
      "El nombre del cliente y la fecha son obligatorios.",
      "error"
    );
    return;
  }

  if (edicionSelectedProducts.length === 0) {
    mostrarNotificacion("El pedido debe tener al menos un producto.", "error");
    return;
  }

  submitBtnText.textContent = "Guardando...";
  submitBtnSpinner.classList.remove("hidden");

  try {
    // PASO 1: Crear productos temporales pendientes en el backend
    const productosTemporalesPendientes = edicionSelectedProducts.filter(
      (p) => p.es_temporal
    );
    const productosTemporalesCreados = [];

    if (productosTemporalesPendientes.length > 0) {
      submitBtnText.textContent = "Creando productos temporales...";

      for (const productoTemp of productosTemporalesPendientes) {
        try {
          // Asegurar que id_categoria sea un número o null
          const idCategoriaValido = productoTemp.id_categoria
            ? parseInt(productoTemp.id_categoria)
            : null;

          // Validar que stock no sea demasiado grande (límite PostgreSQL INTEGER: 2147483647)
          const stockValido = productoTemp.stock
            ? Math.min(parseInt(productoTemp.stock), 2147483647)
            : null;

          const response = await fetch(`${API_BASE}/productos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              codigo: null, // Siempre NULL para productos temporales
              nombre: productoTemp.nombre,
              descripcion: productoTemp.descripcion,
              id_categoria: idCategoriaValido,
              precio_unitario: productoTemp.precio_unitario,
              largo_cm: productoTemp.largo_cm,
              ancho_cm: productoTemp.ancho_cm,
              alto_cm: productoTemp.alto_cm,
              diametro_cm: productoTemp.diametro_cm,
              fondo_cm: productoTemp.fondo_cm,
              altura_asiento_cm: productoTemp.altura_asiento_cm,
              altura_cubierta_cm: productoTemp.altura_cubierta_cm,
              peso_kg: productoTemp.peso_kg,
              material: productoTemp.material,
              moneda: productoTemp.moneda,
              incluye_iva: productoTemp.incluye_iva,
              requiere_presupuesto: productoTemp.requiere_presupuesto,
              unidad_venta: productoTemp.unidad_venta,
              stock: stockValido,
              notas_especiales: productoTemp.notas_especiales,
              es_temporal: true, // Siempre true para productos temporales
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error ||
                `Error al crear producto temporal "${productoTemp.nombre}"`
            );
          }

          const result = await response.json();
          productosTemporalesCreados.push({
            tempId: productoTemp.id_producto,
            realId: result.producto_id,
            cantidad: productoTemp.cantidad,
          });
        } catch (error) {
          throw new Error(`Error al crear producto temporal: ${error.message}`);
        }
      }
    }

    // PASO 2: Preparar lista de productos (temporales ya creados + permanentes)
    submitBtnText.textContent = "Actualizando pedido...";

    const productosParaPedido = edicionSelectedProducts.map((p) => {
      // Si es temporal, usar el ID real creado
      if (p.es_temporal) {
        const tempCreado = productosTemporalesCreados.find(
          (t) => t.tempId === p.id_producto
        );

        if (!tempCreado) {
          console.error(
            `No se encontró mapeo para producto temporal: ${p.id_producto}`
          );
          throw new Error(
            `Error interno: No se pudo mapear el producto temporal "${p.nombre}"`
          );
        }

        return {
          id_producto: parseInt(tempCreado.realId),
          cantidad: parseInt(tempCreado.cantidad),
        };
      }
      // Si es permanente, usar su ID original
      return {
        id_producto: parseInt(p.id_producto),
        cantidad: parseInt(p.cantidad),
      };
    });

    const pedidoData = {
      cliente: cliente,
      fecha: fecha,
      email: form.querySelector('[name="email"]').value,
      telefono: form.querySelector('[name="telefono"]').value,
      etiquetas: form.querySelector('[name="etiquetas"]').value,
      productos: productosParaPedido,
    };

    console.log("📦 Datos del pedido a enviar:", pedidoData);
    console.log(
      "📦 Productos para pedido:",
      JSON.stringify(productosParaPedido, null, 2)
    );

    // PASO 3: Actualizar el pedido
    const res = await fetch(`${API_BASE}/pedidos/${currentPedidoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedidoData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al actualizar el pedido");
    }

    // PASO 4: Actualizar productos temporales con el id_pedido_origen
    if (productosTemporalesCreados.length > 0) {
      submitBtnText.textContent = "Finalizando...";

      for (const tempProd of productosTemporalesCreados) {
        try {
          await fetch(`${API_BASE}/productos/${tempProd.realId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_pedido_origen: currentPedidoId,
              es_temporal: true,
            }),
          });
        } catch (error) {
          console.warn(
            `No se pudo actualizar producto temporal ${tempProd.realId}:`,
            error
          );
        }
      }
    }

    await cargarPedidos();

    const updatedPedido = pedidosData.find(
      (p) => p.id_pedido === currentPedidoId
    );

    cerrarModalEdicion();

    if (updatedPedido) {
      abrirModal(updatedPedido.id_pedido);
    }

    let mensajeExito = "Pedido actualizado exitosamente";
    if (productosTemporalesCreados.length > 0) {
      mensajeExito += `. ${productosTemporalesCreados.length} producto(s) temporal(es) guardado(s).`;
    }
    mostrarNotificacion(mensajeExito, "success");
  } catch (e) {
    console.error("Error:", e);
    mostrarNotificacion(`Error: ${e.message}`, "error");
  } finally {
    submitBtnText.textContent = "Guardar Cambios";
    submitBtnSpinner.classList.add("hidden");
  }
}

async function fetchPedidoPorId(id) {
  try {
    const res = await fetch(`${API_BASE}/pedidos/${id}`, { cache: "no-cache" });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "No se pudo cargar el pedido");
    }
    const data = await res.json();
    return data.pedido;
  } catch (e) {
    console.error("Error:", e);
    mostrarNotificacion(`Error al cargar el pedido: ${e.message}`, "error");
    return null;
  }
}

// --- LÓGICA DE DATOS ---
// Ya no necesitamos esta función con el nuevo enfoque.
// function sincronizarPedidoActualizado() { ... }

// ========= INICIO: LÓGICA DEL MODAL DE DETALLES =========

// Helper para renderizar solo la sección de comentarios
function renderizarComentarios(container, comentarios) {
  if (comentarios && comentarios.length > 0) {
    container.innerHTML = comentarios
      .map(
        (c) =>
          `<div class="bg-white p-3 rounded-lg border border-gray-200" id="comentario-${
            c.id_comentario
          }">
            <div class="flex justify-between items-center mb-1">
              <p class="text-xs font-bold text-gray-800">${
                c.usuario || "Usuario desconocido"
              }</p>
              <div class="flex items-center gap-2">
                <p class="text-xs text-gray-500">${c.fecha || ""}</p>
                <button onclick="startEditComment(${
                  c.id_comentario
                })" class="text-gray-400 hover:text-blue-600"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"></path></svg></button>
                <button onclick="confirmDeleteComment(${
                  c.id_comentario
                })" class="text-gray-400 hover:text-red-600"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
              </div>
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

function poblarYAbrirModal(pedidoId) {
  // CAMBIO CLAVE: Buscamos el pedido en la fuente de datos principal.
  const pedido = pedidosData.find((p) => p.id_pedido === pedidoId);
  if (!pedido) {
    console.error("No se pudo encontrar el pedido con ID:", pedidoId);
    mostrarNotificacion("Error al cargar el pedido.", "error");
    return;
  }

  pedidoActual = pedido; // Ahora `pedidoActual` es una referencia directa al objeto en `pedidosData`.
  const estado = pedido.estado || "Pendiente"; // ✅ Mantener capitalizado
  const config = estadosConfig[estado] || estadosConfig["Pendiente"]; // ✅ Usar configuración

  document.getElementById("modal-titulo").textContent =
    pedido.nombre_cliente || "Cliente sin nombre";
  const fechaCreacionStr = pedido.fecha_creacion
    ? pedido.fecha_creacion.Time || pedido.fecha_creacion
    : null;
  document.getElementById("modal-fecha-creacion").textContent = `Pedido #${
    pedido.id_pedido
  } • Creado el ${formatShortDate(fechaCreacionStr)}`;

  // ✅ Usar color del estado para el indicador
  document.getElementById(
    "modal-status-indicator"
  ).className = `w-5 h-5 rounded-full flex-shrink-0 ${config.bg}`;

  // ✅ Usar colores del badge para el estado
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

  // ✅ CAMBIO: Se añade la lógica para mostrar el teléfono del cliente si existe.
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
      .map((prod) => {
        return `<div class="flex justify-between items-center bg-white rounded-lg p-3"><div><span class="text-sm font-medium text-gray-900">${
          prod.producto || "Producto sin nombre"
        }</span><div class="text-xs text-gray-500 mt-1">${
          prod.cantidad || 0
        } unidad${prod.cantidad !== 1 ? "es" : ""}</div></div></div>`;
      })
      .join("");
  } else {
    productosEl.innerHTML = `<div class="text-center py-2 text-gray-500"><p class="text-sm italic">Sin productos asociados</p></div>`;
  }

  // Renderizar Etiquetas
  const etiquetasContainer = document.getElementById(
    "modal-etiquetas-container"
  );
  const etiquetasEl = document.getElementById("modal-etiquetas");
  const etiquetasStr = pedido.detalles_pedido || ""; // Ahora 'detalles_pedido' solo contiene etiquetas

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

  // Renderizar Comentarios de la tabla 'comentarios'
  document.getElementById("modal-comentarios-container").style.display =
    "block";
  const comentariosListEl = document.getElementById("modal-comentarios-list");
  renderizarComentarios(comentariosListEl, pedido.comentarios || []);

  // ✅ NUEVO: Lógica de botones según el estado actual (duplicado en poblarYAbrirModal)
  const actionsEl = document.getElementById("modal-actions");

  if (estado === "Pendiente") {
    // Pendiente → Puede pasar a Listo o Cancelado
    actionsEl.innerHTML = `
      <div class="flex items-center justify-center gap-3">
        <button onclick="cambiarEstado('Cancelado')" class="action-button flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium text-sm hover:from-red-600 hover:to-red-700 transition-all">
          <span class="flex items-center justify-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Cancelar
          </span>
        </button>
        <button onclick="cambiarEstado('Listo')" class="action-button flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium text-sm hover:from-blue-600 hover:to-blue-700 transition-all">
          <span class="flex items-center justify-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Marcar Listo
          </span>
        </button>
      </div>`;
  } else if (estado === "Listo") {
    // Listo → Puede pasar a Entregado o Cancelado
    actionsEl.innerHTML = `
      <div class="flex items-center justify-center gap-3">
        <button onclick="cambiarEstado('Cancelado')" class="action-button flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium text-sm hover:from-red-600 hover:to-red-700 transition-all">
          <span class="flex items-center justify-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Cancelar
          </span>
        </button>
        <button onclick="cambiarEstado('Entregado')" class="action-button flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium text-sm hover:from-green-600 hover:to-green-700 transition-all">
          <span class="flex items-center justify-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Marcar Entregado
          </span>
        </button>
      </div>`;
  } else {
    // Entregado o Cancelado → Sin acciones (estados finales)
    actionsEl.innerHTML = "";
  }

  modalEl.classList.remove("hidden");
  modalEl.classList.add("flex");
  document.body.style.overflow = "hidden";
}

async function agregarNuevoComentario(e) {
  e.preventDefault();
  const form = e.target;
  const textarea = document.getElementById("nuevo-comentario-texto");
  const comentario = textarea.value.trim();

  if (!comentario || !pedidoActual) {
    return;
  }

  const boton = form.querySelector('button[type="submit"]');
  boton.disabled = true;
  boton.textContent = "Enviando...";

  try {
    // Asumimos id_usuario = 1 (Admin/sistema) como en otros lugares
    const res = await fetch(
      `${API_BASE}/pedidos/${pedidoActual.id_pedido}/comentarios`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: 1, comentario: comentario }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "No se pudo añadir el comentario");
    }

    const data = await res.json();
    const nuevoComentario = data.comentario;

    mostrarNotificacion("Comentario añadido exitosamente", "success");
    textarea.value = ""; // Limpiar el textarea

    // Actualización optimista: añadir el nuevo comentario a la lista existente
    if (!pedidoActual.comentarios) {
      pedidoActual.comentarios = [];
    }
    pedidoActual.comentarios.push(nuevoComentario);
    // Ya no se necesita sincronizar, el cambio es directo en `pedidosData`.

    // Volver a renderizar solo la sección de comentarios
    const comentariosContainer = document.getElementById(
      "modal-comentarios-list"
    );
    renderizarComentarios(comentariosContainer, pedidoActual.comentarios);

    // ✅ NUEVO: Actualizar también la vista general para mostrar los nuevos comentarios
    renderizarPedidos();
  } catch (e) {
    console.error("Error:", e);
    mostrarNotificacion(`Error: ${e.message}`, "error");
  } finally {
    boton.disabled = false;
    boton.textContent = "Enviar Comentario";
  }
}

// ========= INICIO: LÓGICA DE EDICIÓN Y BORRADO DE COMENTARIOS =========

function startEditComment(commentId) {
  const commentDiv = document.getElementById(`comentario-${commentId}`);
  if (!commentDiv) return;

  const p = commentDiv.querySelector("p.text-sm");
  const originalText = p.textContent;

  // Reemplazar el párrafo con un textarea y botones
  commentDiv.innerHTML += `
        <div class="edit-area mt-2">
            <textarea class="w-full p-2 border rounded-md text-sm">${originalText}</textarea>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="cancelEditComment(${commentId}, '${originalText.replace(
    /'/g,
    "\\'"
  )}')" class="text-xs px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                <button onclick="saveComment(${commentId})" class="text-xs px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar</button>
            </div>
        </div>
    `;
  p.style.display = "none"; // Ocultar el párrafo original
  commentDiv.querySelector(".flex.items-center.gap-2").style.display = "none"; // Ocultar botones de editar/borrar originales
}

function cancelEditComment(commentId, originalText) {
  const commentDiv = document.getElementById(`comentario-${commentId}`);
  if (!commentDiv) return;

  commentDiv.querySelector(".edit-area").remove(); // Eliminar el área de edición
  commentDiv.querySelector("p.text-sm").style.display = "block"; // Mostrar el párrafo original
  commentDiv.querySelector(".flex.items-center.gap-2").style.display = "flex"; // Mostrar botones originales
}

async function saveComment(commentId) {
  const commentDiv = document.getElementById(`comentario-${commentId}`);
  if (!commentDiv) return;

  const textarea = commentDiv.querySelector("textarea");
  const nuevoComentario = textarea.value.trim();

  if (!nuevoComentario) {
    mostrarNotificacion("El comentario no puede estar vacío.", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/comentarios/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comentario: nuevoComentario }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al actualizar el comentario");
    }

    mostrarNotificacion("Comentario actualizado", "success");

    // Actualizar el texto en la UI sin recargar todo
    commentDiv.querySelector("p.text-sm").textContent = nuevoComentario;
    cancelEditComment(commentId, nuevoComentario); // Revertir la UI al estado de visualización

    // Sincronizar el dato en el objeto `pedidoActual`
    const commentIndex = pedidoActual.comentarios.findIndex(
      (c) => c.id_comentario === commentId
    );
    if (commentIndex > -1) {
      pedidoActual.comentarios[commentIndex].comentario = nuevoComentario;
      // Ya no se necesita sincronizar.
    }
  } catch (e) {
    console.error("Error:", e);
    mostrarNotificacion(`Error: ${e.message}`, "error");
  }
}

function confirmDeleteComment(commentId) {
  abrirConfirmacion(
    "¿Eliminar Comentario?",
    "Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este comentario?",
    "bg-red-500 hover:bg-red-600",
    () => deleteComment(commentId)
  );
}

async function deleteComment(commentId) {
  try {
    const res = await fetch(`${API_BASE}/comentarios/${commentId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al eliminar el comentario");
    }

    mostrarNotificacion("Comentario eliminado", "success");

    // Sincronizar el dato ANTES de modificar la UI
    pedidoActual.comentarios = pedidoActual.comentarios.filter(
      (c) => c.id_comentario !== commentId
    );
    // Ya no se necesita sincronizar.

    // Eliminar el comentario de la UI
    document.getElementById(`comentario-${commentId}`).remove();
  } catch (e) {
    console.error("Error:", e);
    mostrarNotificacion(`Error: ${e.message}`, "error");
  }
}

// ========= FIN: LÓGICA DE EDICIÓN Y BORRADO DE COMENTARIOS =========

// ========= FIN: LÓGICA DEL MODAL DE EDICIÓN =========

// --- LÓGICA DEL MODAL DE CONFIRMACIÓN ---
// (Esta sección no tiene cambios)
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

// --- LÓGICA DE CAMBIO DE ESTADO (API) ---
async function ejecutarCambioEstado(nuevoEstado) {
  if (!pedidoActual) return;
  try {
    const res = await fetch(
      `${API_BASE}/pedidos/${pedidoActual.id_pedido}/estado`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      }
    );
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al actualizar estado");
    }

    cerrarModal();
    await cargarPedidos();

    // ✅ Mensajes personalizados según el estado
    const mensajes = {
      Listo: "Pedido marcado como listo",
      Entregado: "Pedido marcado como entregado",
      Cancelado: "Pedido cancelado",
    };

    mostrarNotificacion(
      mensajes[nuevoEstado] || "Estado actualizado exitosamente",
      "success"
    );
  } catch (e) {
    console.error("Error:", e);
    mostrarNotificacion(
      e.message || "Error al actualizar el estado del pedido",
      "error"
    );
  }
}

function cambiarEstado(nuevoEstado) {
  if (nuevoEstado === "Listo") {
    abrirConfirmacion(
      "¿Marcar como Listo?",
      "¿Estás seguro de que quieres marcar este pedido como listo para entrega?",
      "bg-blue-500 hover:bg-blue-600",
      () => ejecutarCambioEstado("Listo")
    );
  } else if (nuevoEstado === "Entregado") {
    abrirConfirmacion(
      "¿Marcar como Entregado?",
      "¿Confirmas que este pedido ha sido entregado al cliente?",
      "bg-green-500 hover:bg-green-600",
      () => ejecutarCambioEstado("Entregado")
    );
  } else if (nuevoEstado === "Cancelado") {
    abrirConfirmacion(
      "¿Cancelar Pedido?",
      "Esta acción no se puede deshacer. ¿Estás seguro de que quieres cancelar este pedido?",
      "bg-red-500 hover:bg-red-600",
      () => ejecutarCambioEstado("Cancelado")
    );
  }
}

// --- LÓGICA DE NOTIFICACIONES ---
// (Esta sección no tiene cambios)
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
  const fechaFormateada = formatShortDate(pedido.fecha_entrega);

  const productosHtml =
    pedido.productos && pedido.productos.length > 0
      ? `<div class="space-y-2"><h3 class="text-sm font-medium text-gray-700 mb-2">Productos:</h3><div class="bg-gray-50 rounded-xl p-3">${pedido.productos
          .map(
            (prod) =>
              `<div class="flex justify-between items-center py-1"><span class="text-sm text-gray-800 flex-1">${
                prod.producto || "Producto sin nombre"
              }</span><span class="text-sm text-gray-600 ml-2">x${
                prod.cantidad || 0
              }</span></div>`
          )
          .join("")}</div></div>`
      : `<div class="text-center py-2"><svg class="w-6 h-6 text-gray-300 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg><p class="text-gray-400 text-sm italic">Sin productos asociados</p></div>`;

  // Renderizar etiquetas (máximo 3 para vista compacta)
  let etiquetasHtml = "";
  const etiquetasStr = pedido.detalles_pedido || "";
  if (etiquetasStr) {
    const etiquetas = etiquetasStr
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 3); // Máximo 3 etiquetas

    if (etiquetas.length > 0) {
      const etiquetasDisplay = etiquetas
        .map(
          (tag) =>
            `<span class="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">${tag}</span>`
        )
        .join(" ");

      const masEtiquetas =
        pedido.detalles_pedido.split(",").filter(Boolean).length > 3
          ? ` <span class="text-xs text-gray-500">+${
              pedido.detalles_pedido.split(",").filter(Boolean).length - 3
            }</span>`
          : "";

      etiquetasHtml = `<div class="mb-3"><h4 class="text-xs font-medium text-gray-600 mb-1">Etiquetas:</h4><div class="flex flex-wrap gap-1">${etiquetasDisplay}${masEtiquetas}</div></div>`;
    }
  }

  // Renderizar comentarios recientes (máximo 3)
  let comentarioHtml = "";
  if (pedido.comentarios && pedido.comentarios.length > 0) {
    // Tomar los últimos 3 comentarios
    const comentariosRecientes = pedido.comentarios.slice(-3);

    const comentariosDisplay = comentariosRecientes
      .map((comentario) => {
        const comentarioTexto = comentario.comentario || "";
        const comentarioCorto =
          comentarioTexto.length > 60
            ? comentarioTexto.substring(0, 60) + "..."
            : comentarioTexto;

        return `<div class="bg-blue-50 rounded-lg p-2 mb-1"><p class="text-xs text-gray-700 break-words">${comentarioCorto}</p><p class="text-xs text-gray-500 mt-1">Por: ${
          comentario.usuario || "Usuario"
        }</p></div>`;
      })
      .join("");

    const masComentarios =
      pedido.comentarios.length > 3
        ? ` <span class="text-xs text-gray-500">+${
            pedido.comentarios.length - 3
          } comentarios más</span>`
        : "";

    if (comentariosRecientes.length > 0) {
      comentarioHtml = `<div class="mb-3"><h4 class="text-xs font-medium text-gray-600 mb-1">Últimos comentarios:${masComentarios}</h4><div>${comentariosDisplay}</div></div>`;
    }
  }

  const nombreCliente = (
    pedido.nombre_cliente || "Cliente sin nombre"
  ).toUpperCase();

  // CAMBIO CLAVE: Ya no pasamos el objeto entero. Solo el ID.
  // const escapedPedido = JSON.stringify(pedido).replace(/'/g, "&apos;");

  // ✅ CAMBIO: Usamos la nueva función para obtener las clases de la etiqueta de estado.
  const statusBadgeClasses = getStatusBadgeClasses(estado);

  return `<div class="pedido-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" onclick='abrirModal(${
    pedido.id_pedido
  })'><div class="flex items-center p-4 pb-3"><div class="w-4 h-4 rounded-full ${statusClass} mr-3 flex-shrink-0"></div><div class="flex-1 min-w-0"><h2 class="text-lg md:text-xl font-semibold text-gray-900 truncate">${nombreCliente}</h2></div><span class="text-xs px-2 py-1 rounded-full ${statusBadgeClasses} ml-2 flex-shrink-0">${capitalize(
    estado
  )}</span></div><div class="px-4 pb-4"><div class="flex items-center justify-between text-sm text-gray-600 mb-3"><div class="flex items-center"><svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span>Entrega: ${fechaFormateada}</span></div><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></div>${productosHtml}${etiquetasHtml}${comentarioHtml}</div></div>`;
}

function renderizarPedidos() {
  // Filtrar solo pedidos activos (Pendiente y Listo)
  // Los pedidos Entregados y Cancelados se muestran en la sección de Historial
  let pedidosActivos = pedidosData.filter(
    (p) => p.estado === "Pendiente" || p.estado === "Listo"
  );

  // Aplicar filtro de búsqueda si hay texto
  if (textoBusqueda.trim() !== "") {
    pedidosActivos = filtrarPedidosPorTexto(pedidosActivos, textoBusqueda);
  }

  // Aplicar filtros de estado y fecha
  pedidosActivos = aplicarFiltros(pedidosActivos);

  if (pedidosActivos.length === 0) {
    emptyStateEl.classList.remove("hidden");
    listaEl.classList.add("hidden");
    calendarContainerEl.classList.add("hidden");

    // Actualizar mensaje según si hay búsqueda activa
    if (textoBusqueda.trim() !== "") {
      emptyStateEl.querySelector("p.text-lg").textContent =
        "No se encontraron pedidos";
      emptyStateEl.querySelector(
        "p.text-sm"
      ).textContent = `No hay resultados para "${textoBusqueda}"`;
    } else {
      emptyStateEl.querySelector("p.text-lg").textContent =
        "No hay pedidos activos";
      emptyStateEl.querySelector("p.text-sm").textContent =
        "Los pedidos completados y cancelados se encuentran en el Historial";
    }
    return;
  }

  // Renderizar según la vista actual
  if (vistaActual === "lista") {
    listaEl.innerHTML = pedidosActivos.map(renderPedidoCard).join("");
    listaEl.classList.remove("hidden");
    calendarContainerEl.classList.add("hidden");
  } else {
    renderizarCalendario();
    listaEl.classList.add("hidden");
    calendarContainerEl.classList.remove("hidden");
  }
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
      // Parsear la fecha como local (sin conversión de timezone)
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
        case "manana": {
          const manana = new Date(hoy);
          manana.setDate(manana.getDate() + 1);
          const fechaEntregaStr = fechaEntrega.toDateString();
          const mananaStr = manana.toDateString();
          if (fechaEntregaStr !== mananaStr) return false;
          break;
        }
        case "semana": {
          // Esta semana = desde hoy hasta el próximo domingo (o hasta hoy si hoy es domingo)
          const finSemana = new Date(hoy);
          const diaActual = hoy.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado

          if (diaActual === 0) {
            // Si hoy es domingo, la semana termina hoy
            finSemana.setHours(23, 59, 59, 999);
          } else {
            // Calcular días hasta el próximo domingo
            const diasHastaDomingo = 7 - diaActual;
            finSemana.setDate(finSemana.getDate() + diasHastaDomingo);
            finSemana.setHours(23, 59, 59, 999);
          }

          if (fechaEntrega < hoy || fechaEntrega > finSemana) return false;
          break;
        }
        case "proximos7": {
          const proximos7 = new Date(hoy);
          proximos7.setDate(proximos7.getDate() + 7);
          proximos7.setHours(23, 59, 59, 999);
          if (fechaEntrega < hoy || fechaEntrega > proximos7) return false;
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
            // Parsear fechas desde/hasta como locales
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
    renderizarPedidos();
  } catch (e) {
    loadingEl.classList.add("hidden");
    listaEl.innerHTML = `<div class="text-center py-12"><div class="text-red-400 mb-4"><svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.19 2.5 1.732 2.5z"></path></svg></div><p class="text-red-500 text-lg font-medium">Error de conexión</p><p class="text-gray-500 text-sm mt-1">No se pudo conectar con el servidor</p></div>`;
    listaEl.classList.remove("hidden");
    emptyStateEl.classList.add("hidden");
    console.error(e);
  }
}

// --- LÓGICA DEL CALENDARIO ---
function getColorPorEstado(estado) {
  const config = estadosConfig[estado] || estadosConfig["Pendiente"];
  // Convertir colores de Tailwind a colores hex para FullCalendar
  const colorMap = {
    "bg-yellow-500": "#eab308",
    "bg-blue-600": "#2563eb",
    "bg-green-600": "#16a34a",
    "bg-red-600": "#dc2626",
    "bg-gray-500": "#6b7280",
  };
  return colorMap[config.bg] || "#6b7280";
}

function renderizarCalendario() {
  // Si el calendario ya existe, solo actualizamos los eventos
  if (calendar) {
    actualizarEventosCalendario();
    return;
  }

  // Crear el calendario por primera vez
  calendar = new FullCalendar.Calendar(calendarContainerEl, {
    initialView: "dayGridMonth",
    locale: "es",
    firstDay: 1, // Lunes como primer día
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "", // Sin botones a la derecha ya que solo hay una vista
    },
    buttonText: {
      today: "Hoy",
    },
    events: convertirPedidosAEventos(),

    // ⭐ Limitar eventos visibles por día
    dayMaxEvents: 3, // Mostrar máximo 3 eventos por día
    moreLinkText: function (num) {
      // Texto corto en móvil, completo en desktop
      if (window.innerWidth < 768) {
        return `+${num}`;
      }
      return `+${num} más`;
    },
    moreLinkClick: function (info) {
      // Al hacer click en "+X más", mostrar modal con todos los pedidos del día
      mostrarPedidosDelDia(info.date, info.allSegs);
      return "none"; // No mostrar el popover nativo, solo nuestro modal
    },

    eventClick: function (info) {
      const pedidoId = parseInt(info.event.id);
      abrirModal(pedidoId);
    },
    eventContent: function (arg) {
      const pedido = pedidosData.find(
        (p) => p.id_pedido === parseInt(arg.event.id)
      );
      if (!pedido) return { html: arg.event.title };

      const estadoIcon = estadosConfig[pedido.estado]?.icon || "•";
      return {
        html: `<div class="fc-event-main-frame">
          <div class="fc-event-title-container">
            <div class="fc-event-title fc-sticky text-xs font-medium truncate">
              ${estadoIcon} ${arg.event.title}
            </div>
          </div>
        </div>`,
      };
    },
    height: "auto",
    eventDisplay: "block",
    displayEventTime: false,
    fixedWeekCount: false, // No fijar 6 semanas si el mes tiene menos
  });

  calendar.render();
}

function convertirPedidosAEventos() {
  // Filtrar solo pedidos activos (Pendiente y Listo) para el calendario
  // Los pedidos Entregados y Cancelados se muestran en la sección de Historial
  let pedidosActivos = pedidosData.filter(
    (p) => p.estado === "Pendiente" || p.estado === "Listo"
  );

  // Aplicar filtro de búsqueda si hay texto
  if (textoBusqueda.trim() !== "") {
    pedidosActivos = filtrarPedidosPorTexto(pedidosActivos, textoBusqueda);
  }

  // Aplicar filtros de estado y fecha
  pedidosActivos = aplicarFiltros(pedidosActivos);

  return pedidosActivos.map((pedido) => ({
    id: pedido.id_pedido.toString(),
    title: pedido.nombre_cliente || "Sin nombre",
    start: pedido.fecha_entrega,
    backgroundColor: getColorPorEstado(pedido.estado || "Pendiente"),
    borderColor: getColorPorEstado(pedido.estado || "Pendiente"),
    extendedProps: {
      estado: pedido.estado,
      productos: pedido.productos?.length || 0,
    },
  }));
}

function actualizarEventosCalendario() {
  if (!calendar) return;
  calendar.removeAllEvents();
  calendar.addEventSource(convertirPedidosAEventos());
}

// Mostrar todos los pedidos de un día específico en un modal
function mostrarPedidosDelDia(fecha, segmentos) {
  // Obtener IDs de los pedidos del día
  const pedidosDelDia = segmentos
    .map((seg) => {
      const pedidoId = parseInt(seg.event.id);
      return pedidosData.find((p) => p.id_pedido === pedidoId);
    })
    .filter((p) => p);

  if (pedidosDelDia.length === 0) return;

  // Formatear la fecha - Ajustar para zona horaria local
  // FullCalendar devuelve la fecha en UTC, necesitamos ajustarla
  const fechaLocal = new Date(
    fecha.getTime() + fecha.getTimezoneOffset() * 60000
  );
  const fechaFormateada = fechaLocal.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Crear el modal
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 z-[60] overflow-y-auto";
  modal.id = "modal-pedidos-dia";

  // Función para cerrar el modal y restaurar el scroll
  const cerrarModalPedidosDia = () => {
    modal.remove();
    document.body.style.overflow = "";
  };

  modal.innerHTML = `
    <div class="modal-backdrop flex items-center justify-center min-h-screen px-4 py-6">
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onclick="document.getElementById('modal-pedidos-dia').dispatchEvent(new Event('cerrar'))"></div>
      <div class="modal-content relative bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-auto z-10 max-h-[85vh] overflow-hidden flex flex-col">
        <!-- Header fijo -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold text-gray-900 capitalize">
              ${fechaFormateada}
            </h3>
            <p class="text-sm text-gray-600 mt-1">${
              pedidosDelDia.length
            } pedido(s) agendado(s)</p>
          </div>
          <button onclick="document.getElementById('modal-pedidos-dia').dispatchEvent(new Event('cerrar'))" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <!-- Lista de pedidos con scroll -->
        <div class="flex-1 overflow-y-auto p-6 space-y-3">
          ${pedidosDelDia
            .map((pedido) => {
              const config =
                estadosConfig[pedido.estado] || estadosConfig["Pendiente"];
              const statusBadgeClasses = getStatusBadgeClasses(pedido.estado);

              return `
              <div class="pedido-card bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                   onclick="document.getElementById('modal-pedidos-dia').dispatchEvent(new Event('cerrar')); abrirModal(${
                     pedido.id_pedido
                   });">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="w-4 h-4 rounded-full flex-shrink-0 ${
                      config.bg
                    }"></div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-semibold text-gray-900 text-lg truncate">
                        ${pedido.nombre_cliente || "Sin nombre"}
                      </h3>
                      <p class="text-sm text-gray-600 mt-1">
                        ${pedido.productos?.length || 0} producto(s)
                        ${
                          pedido.detalles_pedido
                            ? "• " +
                              pedido.detalles_pedido
                                .split(",")
                                .slice(0, 2)
                                .join(", ")
                            : ""
                        }
                      </p>
                    </div>
                  </div>
                  <span class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${statusBadgeClasses}">
                    ${config.icon} ${capitalize(pedido.estado)}
                  </span>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";

  // Event listener para cerrar el modal y restaurar scroll
  modal.addEventListener("cerrar", cerrarModalPedidosDia);

  // Cerrar con ESC
  const handleEsc = (e) => {
    if (e.key === "Escape") {
      cerrarModalPedidosDia();
      document.removeEventListener("keydown", handleEsc);
    }
  };
  document.addEventListener("keydown", handleEsc);
}

function cambiarVista(vista) {
  vistaActual = vista;

  // Actualizar botones
  const btnLista = document.getElementById("view-list-btn");
  const btnCalendario = document.getElementById("view-calendar-btn");

  if (vista === "lista") {
    btnLista.classList.add("active");
    btnCalendario.classList.remove("active");
  } else {
    btnLista.classList.remove("active");
    btnCalendario.classList.add("active");
  }

  // Renderizar vista
  renderizarPedidos();

  // Si cambiamos a calendario y ya existe, forzar actualización de tamaño
  // Esto soluciona el problema de renderizado cuando el contenedor estaba oculto
  if (vista === "calendario" && calendar) {
    setTimeout(() => {
      calendar.updateSize();
    }, 0);
  }
}

// --- EVENT LISTENERS GLOBALES ---
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!modalConfirmacionEl.classList.contains("hidden")) {
      cerrarConfirmacion();
    } else if (!modalEdicionEl.classList.contains("hidden")) {
      cancelarEdicion();
    } else if (!modalEl.classList.contains("hidden")) {
      cerrarModal();
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  cargarPedidos();

  // Inicializar panel de filtros
  inicializarPanelFiltros();

  // Event listeners para los botones de vista
  document.getElementById("view-list-btn")?.addEventListener("click", () => {
    cambiarVista("lista");
  });

  document
    .getElementById("view-calendar-btn")
    ?.addEventListener("click", () => {
      cambiarVista("calendario");
    });

  // Usar delegación de eventos para el botón de editar.
  // Esto es más robusto y soluciona el problema.
  modalEl.addEventListener("click", (e) => {
    if (e.target.closest("#edit-pedido-btn")) {
      abrirModalEdicion();
    } else if (e.target === modalEl) {
      // Si se hace clic directamente en el fondo del modal (no en el contenido), cerrar el modal
      cerrarModal();
    }
  });

  const addCommentForm = document.getElementById("add-comment-form");
  if (addCommentForm) {
    addCommentForm.addEventListener("submit", agregarNuevoComentario);
  }

  inicializarListenersEdicion();
  inicializarModalProducto();

  // Listener para actualizar el calendario al cambiar tamaño de ventana
  // Esto actualiza el texto "+X más" según el tamaño de pantalla
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (calendar && vistaActual === "calendario") {
        calendar.refetchEvents(); // Refresca los eventos para actualizar el texto
      }
    }, 250); // Debounce de 250ms
  });
});

// ========= INICIO: LÓGICA DEL MODAL DE PRODUCTOS =========

function inicializarModalProducto() {
  const productModal = document.getElementById("product-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const cancelProductBtn = document.getElementById("cancel-product");
  const productForm = document.getElementById("product-form");
  const toggleNuevaCategoriaBtn = document.getElementById(
    "toggle-nueva-categoria"
  );
  const guardarCategoriaBtn = document.getElementById("guardar-categoria");
  const cancelarCategoriaBtn = document.getElementById("cancelar-categoria");

  // Cerrar modal
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", cerrarProductModal);
  }
  if (cancelProductBtn) {
    cancelProductBtn.addEventListener("click", cerrarProductModal);
  }

  // Cerrar modal al hacer clic fuera del contenido
  if (productModal) {
    productModal.addEventListener("click", (e) => {
      // Solo cerrar si se hace clic exactamente en el fondo negro o en el overlay
      if (
        e.target.id === "product-modal" ||
        e.target.id === "product-modal-overlay"
      ) {
        cerrarProductModal();
      }
    });
  }

  // Toggle nueva categoría
  if (toggleNuevaCategoriaBtn) {
    toggleNuevaCategoriaBtn.addEventListener("click", () => {
      const container = document.getElementById("nueva-categoria-container");
      container.classList.toggle("hidden");
      if (!container.classList.contains("hidden")) {
        document.getElementById("nueva-categoria-input").focus();
      }
    });
  }

  // Guardar nueva categoría
  if (guardarCategoriaBtn) {
    guardarCategoriaBtn.addEventListener("click", guardarNuevaCategoria);
  }

  // Cancelar nueva categoría
  if (cancelarCategoriaBtn) {
    cancelarCategoriaBtn.addEventListener("click", () => {
      document
        .getElementById("nueva-categoria-container")
        .classList.add("hidden");
      document.getElementById("nueva-categoria-input").value = "";
    });
  }

  // Enviar formulario de producto
  if (productForm) {
    productForm.addEventListener("submit", guardarProducto);
  }

  // Cargar categorías al inicializar
  cargarCategoriasEnModal();
}

function abrirProductModal() {
  console.log("🔵 Intentando abrir modal de producto...");
  const productModal = document.getElementById("product-modal");
  if (!productModal) {
    console.error("❌ No se encontró el modal de producto (product-modal)");
    return;
  }
  console.log("✅ Modal encontrado, abriendo...");
  productModal.classList.remove("hidden");
  limpiarFormularioProducto();
}

function cerrarProductModal() {
  const productModal = document.getElementById("product-modal");
  productModal.classList.add("hidden");
  limpiarFormularioProducto();
}

function limpiarFormularioProducto() {
  document.getElementById("product-form").reset();
  document.getElementById("nueva-categoria-container").classList.add("hidden");
  document.getElementById("nueva-categoria-input").value = "";
  // Restablecer el radio button a "permanente"
  document.querySelector(
    'input[name="tipo-agregado"][value="permanente"]'
  ).checked = true;
}

async function cargarCategoriasEnModal() {
  try {
    const res = await fetch(`${API_BASE}/categorias`);
    if (!res.ok) throw new Error("Error al cargar categorías");
    const data = await res.json();

    const select = document.getElementById("prod-categoria");
    select.innerHTML = '<option value="">Sin categoría</option>';

    if (data.categorias && data.categorias.length > 0) {
      data.categorias.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.id_categoria;
        option.textContent = cat.nombre;
        select.appendChild(option);
      });
    }
  } catch (e) {
    console.error("Error al cargar categorías:", e);
  }
}

async function guardarNuevaCategoria() {
  const input = document.getElementById("nueva-categoria-input");
  const nombreCategoria = input.value.trim();

  if (!nombreCategoria) {
    mostrarNotificacion("Por favor ingresa un nombre de categoría", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/categorias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombreCategoria }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al crear categoría");
    }

    const data = await res.json();
    mostrarNotificacion("Categoría creada exitosamente", "success");

    // Recargar las categorías
    await cargarCategoriasEnModal();

    // Seleccionar la nueva categoría
    const select = document.getElementById("prod-categoria");
    select.value = data.categoria_id;

    // Limpiar y ocultar el contenedor de nueva categoría
    document
      .getElementById("nueva-categoria-container")
      .classList.add("hidden");
    input.value = "";
  } catch (e) {
    console.error("Error:", e);
    mostrarNotificacion(`Error: ${e.message}`, "error");
  }
}

async function guardarProducto(e) {
  e.preventDefault();

  // Validación previa del nombre
  const nombre = document.getElementById("prod-nombre").value.trim();
  if (!nombre) {
    mostrarNotificacion("📝 El nombre del producto es obligatorio", "error");
    document.getElementById("prod-nombre").focus();
    return;
  }

  const tipoAgregado = document.querySelector(
    'input[name="tipo-agregado"]:checked'
  ).value;

  // Obtener y convertir id_categoria correctamente
  const categoriaValue = document.getElementById("prod-categoria").value;
  const idCategoria =
    categoriaValue && categoriaValue !== "" ? parseInt(categoriaValue) : null;

  // Para productos temporales, forzar código NULL
  const codigoValue =
    tipoAgregado === "temporal"
      ? null
      : document.getElementById("prod-codigo").value.trim() || null;

  const producto = {
    codigo: codigoValue,
    nombre: nombre,
    descripcion:
      document.getElementById("prod-descripcion").value.trim() || null,
    id_categoria: idCategoria,
    material: document.getElementById("prod-material").value.trim() || null,
    largo: parseFloat(document.getElementById("prod-largo").value) || null,
    ancho: parseFloat(document.getElementById("prod-ancho").value) || null,
    alto: parseFloat(document.getElementById("prod-alto").value) || null,
    diametro:
      parseFloat(document.getElementById("prod-diametro").value) || null,
    fondo: parseFloat(document.getElementById("prod-fondo").value) || null,
    altura_asiento:
      parseFloat(document.getElementById("prod-altura-asiento").value) || null,
    altura_cubierta:
      parseFloat(document.getElementById("prod-altura-cubierta").value) || null,
    peso: parseFloat(document.getElementById("prod-peso").value) || null,
    precio: parseFloat(document.getElementById("prod-precio").value) || null,
    moneda: document.getElementById("prod-moneda").value,
    stock: parseInt(document.getElementById("prod-stock").value) || null,
    unidad_venta:
      document.getElementById("prod-unidad").value.trim() || "unidad",
    incluye_iva: document.getElementById("prod-incluye-iva").checked,
    requiere_presupuesto: document.getElementById("prod-requiere-presupuesto")
      .checked,
    notas_especiales:
      document.getElementById("prod-notas").value.trim() || null,
  };

  // Obtener elementos del botón para mostrar spinner
  const btnGuardar = document.getElementById("save-product");
  const btnIcon = btnGuardar.querySelector("svg");
  const btnText = btnGuardar.querySelector("path").nextSibling;
  const originalBtnContent = btnGuardar.innerHTML;

  // Mostrar spinner
  btnGuardar.disabled = true;
  btnGuardar.classList.add("opacity-75", "cursor-not-allowed");
  btnGuardar.innerHTML = `
    <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Guardando...</span>
  `;

  try {
    if (tipoAgregado === "temporal") {
      // Agregar producto temporal solo a la lista de edición actual
      // Guardar TODOS los campos para poder crear el producto después
      const productoTemporal = {
        id_producto: `temp-${Date.now()}`, // ID temporal único
        nombre: producto.nombre,
        codigo: producto.codigo,
        descripcion: producto.descripcion,
        id_categoria: producto.id_categoria,
        material: producto.material,
        largo_cm: producto.largo,
        ancho_cm: producto.ancho,
        alto_cm: producto.alto,
        diametro_cm: producto.diametro,
        fondo_cm: producto.fondo,
        altura_asiento_cm: producto.altura_asiento,
        altura_cubierta_cm: producto.altura_cubierta,
        peso_kg: producto.peso,
        precio_unitario: producto.precio,
        moneda: producto.moneda,
        stock: producto.stock,
        unidad_venta: producto.unidad_venta,
        incluye_iva: producto.incluye_iva,
        requiere_presupuesto: producto.requiere_presupuesto,
        notas_especiales: producto.notas_especiales,
        cantidad: 1,
        es_temporal: true,
      };

      edicionSelectedProducts.push(productoTemporal);
      renderEdicionSelectedProducts();
      cerrarProductModal();
      mostrarNotificacion(
        `✅ Producto temporal "${producto.nombre}" agregado al pedido`,
        "success"
      );
    } else {
      // Guardar producto permanente en el catálogo
      const res = await fetch(`${API_BASE}/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: producto.codigo,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          id_categoria: producto.id_categoria,
          material: producto.material,
          largo_cm: producto.largo,
          ancho_cm: producto.ancho,
          alto_cm: producto.alto,
          diametro_cm: producto.diametro,
          fondo_cm: producto.fondo,
          altura_asiento_cm: producto.altura_asiento,
          altura_cubierta_cm: producto.altura_cubierta,
          peso_kg: producto.peso,
          precio_unitario: producto.precio,
          moneda: producto.moneda,
          stock: producto.stock,
          unidad_venta: producto.unidad_venta,
          incluye_iva: producto.incluye_iva,
          requiere_presupuesto: producto.requiere_presupuesto,
          notas_especiales: producto.notas_especiales,
          es_temporal: false, // ✅ IMPORTANTE: Marcar explícitamente como permanente
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Manejo de errores específicos
        let errorMsg = "No se pudo crear el producto";

        if (res.status === 400) {
          if (data.error && data.error.includes("duplicate key")) {
            errorMsg = `⚠️ Ya existe un producto con el código "${producto.codigo}"`;
          } else if (data.error && data.error.includes("nombre")) {
            errorMsg = "⚠️ El nombre del producto es obligatorio";
          } else if (data.code === "VALIDATION_ERROR") {
            errorMsg = `⚠️ ${data.error}`;
          } else {
            errorMsg = `❌ ${
              data.error || "Datos inválidos. Verifica los campos."
            }`;
          }
        } else if (res.status === 409) {
          errorMsg = `⚠️ ${data.error || "El producto ya existe"}`;
        } else if (res.status === 500) {
          errorMsg =
            "❌ Error en el servidor. Intenta nuevamente en unos momentos.";
        } else {
          errorMsg = data.error || "Error desconocido al crear el producto";
        }

        throw new Error(errorMsg);
      }

      console.log("✅ Producto creado exitosamente:", data);

      // El backend solo devuelve producto_id, necesitamos construir el objeto
      const productoParaLista = {
        id_producto: data.producto_id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        precio_unitario: producto.precio,
        cantidad: 1,
        es_temporal: false,
      };

      edicionSelectedProducts.push(productoParaLista);

      // También agregarlo a la lista completa con todos los campos
      const productoCompleto = {
        id_producto: data.producto_id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        precio: producto.precio,
        precio_unitario: producto.precio,
        descripcion: producto.descripcion,
        id_categoria: producto.id_categoria,
        material: producto.material,
      };
      allProducts.push(productoCompleto);

      renderEdicionSelectedProducts();
      cerrarProductModal();
      mostrarNotificacion(
        `✅ Producto "${producto.nombre}" agregado al catálogo y al pedido exitosamente`,
        "success"
      );
    }
  } catch (error) {
    console.error("❌ Error al guardar producto:", error);
    const errorMessage =
      error.message || "Error desconocido al guardar el producto";
    mostrarNotificacion(errorMessage, "error");
  } finally {
    // Restaurar botón en cualquier caso
    btnGuardar.disabled = false;
    btnGuardar.classList.remove("opacity-75", "cursor-not-allowed");
    btnGuardar.innerHTML = originalBtnContent;
  }
}

// ========= FIN: LÓGICA DEL MODAL DE PRODUCTOS =========

// ========= INICIO: LÓGICA DEL PANEL DE FILTROS =========

function inicializarPanelFiltros() {
  const filtrosPanel = document.getElementById("filtros-panel");
  const filtrosOverlay = document.getElementById("filtros-overlay");
  const filtrosClose = document.getElementById("filtros-close");
  const filtrosAplicar = document.getElementById("filtros-aplicar");
  const filtrosLimpiar = document.getElementById("filtros-limpiar");
  const filterToggleBtn = document.getElementById("filter-toggle");

  const estadoCheckboxes = document.querySelectorAll(".filtro-estado-checkbox");
  const fechaRadios = document.querySelectorAll(".filtro-fecha-radio");
  const fechaPersonalizadaInputs = document.getElementById(
    "fecha-personalizada-inputs"
  );
  const fechaDesde = document.getElementById("fecha-desde");
  const fechaHasta = document.getElementById("fecha-hasta");

  // Abrir panel
  function abrirPanel() {
    filtrosPanel.classList.remove("hidden");
    filtrosPanel.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  // Cerrar panel
  function cerrarPanel() {
    filtrosPanel.classList.remove("active");
    setTimeout(() => {
      filtrosPanel.classList.add("hidden");
      document.body.style.overflow = "";
    }, 300);
  }

  // Event listeners para abrir/cerrar
  if (filterToggleBtn) {
    filterToggleBtn.addEventListener("click", abrirPanel);
  }

  if (filtrosClose) {
    filtrosClose.addEventListener("click", cerrarPanel);
  }

  if (filtrosOverlay) {
    filtrosOverlay.addEventListener("click", cerrarPanel);
  }

  // Mostrar/ocultar inputs de fecha personalizada
  fechaRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "personalizado") {
        fechaPersonalizadaInputs.classList.remove("hidden");
      } else {
        fechaPersonalizadaInputs.classList.add("hidden");
      }
    });
  });

  // Aplicar filtros
  if (filtrosAplicar) {
    filtrosAplicar.addEventListener("click", function () {
      // Obtener estados seleccionados
      filtrosActivos.estados = Array.from(estadoCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);

      // Obtener preset de fecha seleccionado
      const fechaSeleccionada = document.querySelector(
        'input[name="fecha-preset"]:checked'
      );
      if (fechaSeleccionada) {
        filtrosActivos.fechaEntrega.tipo = fechaSeleccionada.value;

        // Si es personalizado, obtener las fechas
        if (fechaSeleccionada.value === "personalizado") {
          filtrosActivos.fechaEntrega.desde = fechaDesde.value;
          filtrosActivos.fechaEntrega.hasta = fechaHasta.value;
        } else {
          filtrosActivos.fechaEntrega.desde = null;
          filtrosActivos.fechaEntrega.hasta = null;
        }
      }

      // Re-renderizar pedidos con los filtros aplicados
      renderizarPedidos();

      // Actualizar indicador visual
      actualizarIndicadorFiltros();

      // Cerrar panel
      cerrarPanel();
    });
  }

  // Limpiar filtros
  if (filtrosLimpiar) {
    filtrosLimpiar.addEventListener("click", function () {
      // Resetear estados
      filtrosActivos.estados = [];
      estadoCheckboxes.forEach((cb) => (cb.checked = false));

      // Resetear fecha
      filtrosActivos.fechaEntrega = {
        tipo: "todos",
        desde: null,
        hasta: null,
      };

      // Marcar "Todas las fechas" como seleccionado
      const todosFechaRadio = document.querySelector(
        'input[name="fecha-preset"][value="todos"]'
      );
      if (todosFechaRadio) {
        todosFechaRadio.checked = true;
      }

      // Ocultar inputs personalizados
      fechaPersonalizadaInputs.classList.add("hidden");
      fechaDesde.value = "";
      fechaHasta.value = "";

      // Re-renderizar pedidos
      renderizarPedidos();

      // Actualizar indicador visual
      actualizarIndicadorFiltros();

      // Cerrar panel
      cerrarPanel();
    });
  }
}

// Función para contar filtros activos
function contarFiltrosActivos() {
  let count = 0;

  // Contar estados seleccionados
  count += filtrosActivos.estados.length;

  // Contar filtro de fecha si no es "todos"
  if (filtrosActivos.fechaEntrega.tipo !== "todos") {
    count++;
  }

  return count;
}

// Función para actualizar el badge del botón de filtros
function actualizarIndicadorFiltros() {
  const filterToggleBtn = document.getElementById("filter-toggle");
  if (!filterToggleBtn) return;

  const count = contarFiltrosActivos();

  // Remover badge existente si hay
  const existingBadge = filterToggleBtn.querySelector(".filter-badge");
  if (existingBadge) {
    existingBadge.remove();
  }

  // Agregar nuevo badge si hay filtros activos
  if (count > 0) {
    const badge = document.createElement("span");
    badge.className = "filter-badge";
    badge.textContent = count;
    filterToggleBtn.style.position = "relative";
    filterToggleBtn.appendChild(badge);
  }
}

// ========= FIN: LÓGICA DEL PANEL DE FILTROS =========
// ========= MODAL DETALLE DE PRODUCTO =========

async function mostrarDetalleProducto(idProducto) {
  try {
    // Obtener detalles del producto desde el backend
    const response = await fetch(`${API_BASE}/productos/${idProducto}`);
    if (!response.ok) throw new Error("Error al cargar producto");

    const data = await response.json();
    const producto = data.producto || data;

    // Renderizar el contenido del modal
    const contenidoEl = document.getElementById("producto-detalle-contenido");
    contenidoEl.innerHTML = generarHTMLDetalleProducto(producto);

    // Mostrar el modal
    document
      .getElementById("modal-producto-detalle")
      .classList.remove("hidden");
  } catch (error) {
    console.error("Error al mostrar detalle del producto:", error);
    mostrarNotificacion("Error al cargar los detalles del producto", "error");
  }
}

function cerrarModalProductoDetalle() {
  document.getElementById("modal-producto-detalle").classList.add("hidden");
}

function generarHTMLDetalleProducto(producto) {
  let html = "";

  // Información básica
  html += `<div class="bg-gray-50 rounded-lg p-4 border border-gray-300">
    <h3 class="text-lg font-bold text-gray-800 mb-3">📝 Información Básica</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">`;

  if (producto.codigo)
    html += `<div><span class="text-xs text-gray-500">Código:</span><div class="font-semibold text-gray-900">${producto.codigo}</div></div>`;
  if (producto.nombre)
    html += `<div><span class="text-xs text-gray-500">Nombre:</span><div class="font-semibold text-gray-900">${producto.nombre}</div></div>`;
  if (producto.categoria)
    html += `<div><span class="text-xs text-gray-500">Categoría:</span><div class="font-semibold text-gray-900">${producto.categoria}</div></div>`;
  if (producto.material)
    html += `<div><span class="text-xs text-gray-500">Material:</span><div class="font-semibold text-gray-900">${producto.material}</div></div>`;

  html += `</div></div>`;

  // Descripción
  if (producto.descripcion) {
    html += `<div class="bg-white rounded-lg p-4 border border-gray-300">
      <h3 class="text-lg font-bold text-gray-800 mb-2">📄 Descripción</h3>
      <p class="text-gray-700 text-sm">${producto.descripcion}</p>
    </div>`;
  }

  // Precios
  if (producto.precio_unitario || producto.requiere_presupuesto) {
    html += `<div class="bg-gray-50 rounded-lg p-4 border border-gray-300">
      <h3 class="text-lg font-bold text-gray-800 mb-3">💰 Precio</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">`;

    if (producto.precio_unitario) {
      html += `<div><span class="text-xs text-gray-500">Precio Unitario:</span><div class="font-semibold text-gray-900 text-lg">${formatNumber(
        producto.precio_unitario
      )} ${producto.moneda || "CLP"}</div></div>`;
      html += `<div><span class="text-xs text-gray-500">IVA:</span><div class="font-semibold text-gray-900">${
        producto.incluye_iva ? "Incluido" : "No incluido"
      }</div></div>`;
    }
    if (producto.requiere_presupuesto) {
      html += `<div class="col-span-2"><span class="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-amber-300">⚠️ Requiere Presupuesto</span></div>`;
    }
    if (producto.unidad_venta) {
      html += `<div><span class="text-xs text-gray-500">Unidad de venta:</span><div class="font-semibold text-gray-900">${producto.unidad_venta}</div></div>`;
    }

    html += `</div></div>`;
  }

  // Dimensiones
  const tieneDimensiones =
    producto.largo_cm ||
    producto.ancho_cm ||
    producto.alto_cm ||
    producto.diametro_cm ||
    producto.fondo_cm ||
    producto.altura_asiento_cm ||
    producto.altura_cubierta_cm;
  if (tieneDimensiones) {
    html += `<div class="bg-white rounded-lg p-4 border border-gray-300">
      <h3 class="text-lg font-bold text-gray-800 mb-3">📏 Dimensiones</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">`;

    if (producto.largo_cm)
      html += `<div><span class="text-xs text-gray-500">Largo:</span><div class="font-semibold text-gray-900">${producto.largo_cm} cm</div></div>`;
    if (producto.ancho_cm)
      html += `<div><span class="text-xs text-gray-500">Ancho:</span><div class="font-semibold text-gray-900">${producto.ancho_cm} cm</div></div>`;
    if (producto.alto_cm)
      html += `<div><span class="text-xs text-gray-500">Alto:</span><div class="font-semibold text-gray-900">${producto.alto_cm} cm</div></div>`;
    if (producto.diametro_cm)
      html += `<div><span class="text-xs text-gray-500">Diámetro:</span><div class="font-semibold text-gray-900">${producto.diametro_cm} cm</div></div>`;
    if (producto.fondo_cm)
      html += `<div><span class="text-xs text-gray-500">Fondo:</span><div class="font-semibold text-gray-900">${producto.fondo_cm} cm</div></div>`;
    if (producto.altura_asiento_cm)
      html += `<div><span class="text-xs text-gray-500">Altura Asiento:</span><div class="font-semibold text-gray-900">${producto.altura_asiento_cm} cm</div></div>`;
    if (producto.altura_cubierta_cm)
      html += `<div><span class="text-xs text-gray-500">Altura Cubierta:</span><div class="font-semibold text-gray-900">${producto.altura_cubierta_cm} cm</div></div>`;
    if (producto.peso_kg)
      html += `<div><span class="text-xs text-gray-500">Peso:</span><div class="font-semibold text-gray-900">${producto.peso_kg} kg</div></div>`;

    html += `</div></div>`;
  }

  // Notas especiales
  if (producto.notas_especiales) {
    html += `<div class="bg-amber-50 rounded-lg p-4 border border-amber-300">
      <h3 class="text-lg font-bold text-gray-800 mb-2">⚠️ Notas Especiales</h3>
      <p class="text-gray-700 text-sm whitespace-pre-line">${producto.notas_especiales}</p>
    </div>`;
  }

  // Información de stock
  if (producto.stock !== null && producto.stock !== undefined) {
    html += `<div class="bg-gray-50 rounded-lg p-4 border border-gray-300">
      <h3 class="text-lg font-bold text-gray-800 mb-2">📦 Stock</h3>
      <div class="font-semibold text-gray-900 text-lg">${producto.stock} unidades disponibles</div>
    </div>`;
  }

  // Producto temporal
  if (producto.es_temporal) {
    html += `<div class="bg-slate-100 rounded-lg p-4 border border-slate-300">
      <span class="inline-block bg-slate-200 text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-slate-400">🔄 Producto Temporal (asociado a un pedido específico)</span>
    </div>`;
  }

  return (
    html ||
    '<p class="text-gray-500 text-center py-4">No hay información adicional disponible</p>'
  );
}

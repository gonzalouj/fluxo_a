// pedidos.js

// --- CONSTANTES Y ESTADO GLOBAL ---
const API_BASE = "/api";
let pedidosData = [];
let pedidoActual = null;
let accionAConfirmar = null;

// --- REFERENCIAS AL DOM ---
const listaEl = document.getElementById("lista-pedidos");
const loadingEl = document.getElementById("loading");
const emptyStateEl = document.getElementById("empty-state");
const modalEl = document.getElementById("modal-detalle");
const modalConfirmacionEl = document.getElementById("modal-confirmacion");
const modalEdicionEl = document.getElementById("modal-edicion"); // Nuevo modal

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
  const estados = {
    pendiente: "status-pendiente",
    listo: "status-listo",
    cancelado: "status-cancelado",
  };
  return estados[(estado || "").toLowerCase()] || "bg-gray-500";
}

// ✅ NUEVO: Función para obtener las clases de color para la etiqueta de estado en la tarjeta.
function getStatusBadgeClasses(estado) {
  const normalizedEstado = (estado || "").toLowerCase();
  const classes = {
    pendiente: "bg-yellow-100 text-yellow-800",
    listo: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
  };
  return classes[normalizedEstado] || "bg-gray-100 text-gray-800"; // Color por defecto
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
function capitalize(v) {
  return v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : "";
}
function formatCLP(value) {
  if (value == null || value === "") return "$0";
  const n = Number(value);
  if (Number.isNaN(n)) return `$${value}`;
  return `$${Math.round(n).toLocaleString("es-CL")}`;
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
  const estado = (pedido.estado || "Pendiente").toLowerCase();
  const statusClass = getStatusClass(estado);

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
  ).className = `w-5 h-5 rounded-full flex-shrink-0 ${statusClass}`;

  const badgeEl = document.getElementById("modal-estado-badge");
  badgeEl.textContent = capitalize(estado);
  badgeEl.className = `px-4 py-2 rounded-full text-white font-semibold status-badge-large ${statusClass}`;

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
  let total = 0;
  if (pedido.productos && pedido.productos.length > 0) {
    productosEl.innerHTML = pedido.productos
      .map((prod) => {
        const subtotal = (prod.cantidad || 0) * (prod.precio_unitario || 0);
        total += subtotal;
        return `<div class="flex justify-between items-center bg-white rounded-lg p-3"><div><span class="text-sm font-medium text-gray-900">${
          prod.producto || "Producto sin nombre"
        }</span><div class="text-xs text-gray-500 mt-1">${
          prod.cantidad || 0
        } unidad${prod.cantidad !== 1 ? "es" : ""} × ${formatCLP(
          prod.precio_unitario
        )}</div></div><span class="text-sm font-semibold text-gray-900">${formatCLP(
          subtotal
        )}</span></div>`;
      })
      .join("");
  } else {
    productosEl.innerHTML = `<div class="text-center py-4 text-gray-500"><p class="text-sm italic">Sin productos asociados</p></div>`;
  }
  document.getElementById("modal-total").textContent = formatCLP(total);

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

  const actionsEl = document.getElementById("modal-actions");
  if (estado === "pendiente") {
    actionsEl.innerHTML = `<div class="flex items-center justify-center gap-3"><button onclick="cambiarEstado('Cancelado')" class="action-button flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium text-sm"><span class="flex items-center justify-center"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>Cancelar</span></button><button onclick="cambiarEstado('Listo')" class="action-button flex-1 px-4 py-2.5 text-white rounded-lg font-medium text-sm" style="background: #059669; background: linear-gradient(135deg, #059669, #10b981); text-white rounded-lg font-medium text-sm"><span class="flex items-center justify-center"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Marcar Listo</span></button></div>`;
  } else {
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
        <div class="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border">
            <div class="flex-1"><p class="font-semibold text-sm">${p.nombre} (${
          p.codigo
        })</p><p class="text-xs text-gray-500">${formatCLP(
          p.precio_unitario
        )}</p></div>
            <div class="flex items-center gap-2"><label class="text-sm font-medium">Cant:</label><input type="number" value="${
              p.cantidad
            }" min="1" onchange="updateEdicionQuantity(${
          p.id_producto
        }, this.value)" class="w-16 p-1 border rounded text-center"></div>
            <button type="button" onclick="removeEdicionProduct(${
              p.id_producto
            })" class="text-red-500 hover:text-red-700 p-1"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
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
  edicionSelectedProducts = edicionSelectedProducts.filter(
    (p) => p.id_producto !== productId
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
  const product = edicionSelectedProducts.find(
    (p) => p.id_producto === productId
  );
  if (product) product.cantidad = quantity;
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
        p.nombre.toLowerCase().includes(searchTerm) ||
        p.codigo.toLowerCase().includes(searchTerm)
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

  const currentPedidoId = pedidoActual.id_pedido; // Guardamos el ID para buscarlo después
  const form = document.getElementById("form-edicion");
  const submitBtnText = document.getElementById("edicion-submit-text");
  const submitBtnSpinner = document.getElementById("edicion-submit-spinner");

  const pedidoData = {
    cliente: form.querySelector('[name="cliente"]').value,
    fecha: form.querySelector('[name="fecha"]').value,
    email: form.querySelector('[name="email"]').value,
    telefono: form.querySelector('[name="telefono"]').value,
    etiquetas: form.querySelector('[name="etiquetas"]').value,
    productos: edicionSelectedProducts.map((p) => ({
      id_producto: p.id_producto,
      cantidad: p.cantidad,
    })),
  };

  // Validaciones
  if (!pedidoData.cliente || !pedidoData.fecha) {
    mostrarNotificacion(
      "El nombre del cliente y la fecha son obligatorios.",
      "error"
    );
    return;
  }
  if (pedidoData.productos.length === 0) {
    mostrarNotificacion("El pedido debe tener al menos un producto.", "error");
    return;
  }

  submitBtnText.textContent = "Guardando...";
  submitBtnSpinner.classList.remove("hidden");

  try {
    const res = await fetch(`${API_BASE}/pedidos/${pedidoActual.id_pedido}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedidoData),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al actualizar el pedido");
    }

    await cargarPedidos(); // Recargar la lista principal de pedidos

    // Buscar el pedido recién actualizado en la lista de datos
    const updatedPedido = pedidosData.find(
      (p) => p.id_pedido === currentPedidoId
    );

    cerrarModalEdicion();

    if (updatedPedido) {
      abrirModal(updatedPedido.id_pedido); // Reabrir el modal de detalles con los datos frescos
    }

    mostrarNotificacion("Pedido actualizado exitosamente", "success");
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
            <p class="text-sm text-gray-700 whitespace-pre-wrap">${
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
  const estado = (pedido.estado || "Pendiente").toLowerCase();
  const statusClass = getStatusClass(estado);

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
  ).className = `w-5 h-5 rounded-full flex-shrink-0 ${statusClass}`;

  const badgeEl = document.getElementById("modal-estado-badge");
  badgeEl.textContent = capitalize(estado);
  badgeEl.className = `px-4 py-2 rounded-full text-white font-semibold status-badge-large ${statusClass}`;

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
  let total = 0;
  if (pedido.productos && pedido.productos.length > 0) {
    productosEl.innerHTML = pedido.productos
      .map((prod) => {
        const subtotal = (prod.cantidad || 0) * (prod.precio_unitario || 0);
        total += subtotal;
        return `<div class="flex justify-between items-center bg-white rounded-lg p-3"><div><span class="text-sm font-medium text-gray-900">${
          prod.producto || "Producto sin nombre"
        }</span><div class="text-xs text-gray-500 mt-1">${
          prod.cantidad || 0
        } unidad${prod.cantidad !== 1 ? "es" : ""} × ${formatCLP(
          prod.precio_unitario
        )}</div></div><span class="text-sm font-semibold text-gray-900">${formatCLP(
          subtotal
        )}</span></div>`;
      })
      .join("");
  } else {
    productosEl.innerHTML = `<div class="text-center py-4 text-gray-500"><p class="text-sm italic">Sin productos asociados</p></div>`;
  }
  document.getElementById("modal-total").textContent = formatCLP(total);

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

  const actionsEl = document.getElementById("modal-actions");
  if (estado === "pendiente") {
    actionsEl.innerHTML = `<div class="flex items-center justify-center gap-3"><button onclick="cambiarEstado('Cancelado')" class="action-button flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium text-sm"><span class="flex items-center justify-center"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>Cancelar</span></button><button onclick="cambiarEstado('Listo')" class="action-button flex-1 px-4 py-2.5 text-white rounded-lg font-medium text-sm" style="background: #059669; background: linear-gradient(135deg, #059669, #10b981); text-white rounded-lg font-medium text-sm"><span class="flex items-center justify-center"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Marcar Listo</span></button></div>`;
  } else {
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
// (Esta sección no tiene cambios)
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
    if (!res.ok) throw new Error("Error al actualizar estado");
    cerrarModal();
    await cargarPedidos();
    mostrarNotificacion(
      `Pedido ${
        nuevoEstado === "Listo" ? "completado" : "cancelado"
      } exitosamente`,
      "success"
    );
  } catch (e) {
    console.error("Error:", e);
    mostrarNotificacion("Error al actualizar el estado del pedido", "error");
  }
}

function cambiarEstado(nuevoEstado) {
  if (nuevoEstado === "Listo") {
    abrirConfirmacion(
      "¿Marcar como Listo?",
      "¿Estás seguro de que quieres marcar este pedido como listo para entrega?",
      "bg-green-500 hover:bg-green-600",
      () => ejecutarCambioEstado("Listo")
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
              } • ${formatCLP(prod.precio_unitario)}</span></div>`
          )
          .join("")}</div></div>`
      : `<div class="text-center py-4"><svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg><p class="text-gray-400 text-sm italic">Sin productos asociados</p></div>`;
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
  )}</span></div><div class="px-4 pb-4"><div class="flex items-center justify-between text-sm text-gray-600 mb-3"><div class="flex items-center"><svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span>Entrega: ${fechaFormateada}</span></div><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></div>${productosHtml}</div></div>`;
}

function renderizarPedidos() {
  if (pedidosData.length === 0) {
    emptyStateEl.classList.remove("hidden");
    listaEl.classList.add("hidden");
    return;
  }
  listaEl.innerHTML = pedidosData.map(renderPedidoCard).join("");
  listaEl.classList.remove("hidden");
  emptyStateEl.classList.add("hidden");
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

  // Usar delegación de eventos para el botón de editar.
  // Esto es más robusto y soluciona el problema.
  modalEl.addEventListener("click", (e) => {
    if (e.target.closest("#edit-pedido-btn")) {
      abrirModalEdicion();
    }
  });

  const addCommentForm = document.getElementById("add-comment-form");
  if (addCommentForm) {
    addCommentForm.addEventListener("submit", agregarNuevoComentario);
  }

  inicializarListenersEdicion();
});

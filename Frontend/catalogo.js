// ============================================
// CATÁLOGO DE PRODUCTOS - JAVASCRIPT
// ============================================

// Configuración de API
const API_BASE = window.location.port === "8080" ? "/api" : "/api";

// Estado global
let allProducts = [];
let allCategories = [];
let filteredProducts = [];
let currentProduct = null; // Para edición
let pedidosAsociados = []; // IDs de pedidos asociados al producto actual
let confirmacionCallback = null;
let mostrarStock = false; // Estado del toggle de stock

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  cargarCategorias();
  cargarProductos();
  inicializarEventListeners();
});

function inicializarEventListeners() {
  // Botones principales
  document
    .getElementById("add-product-btn")
    .addEventListener("click", () => abrirModalCrear());
  document.getElementById("close-modal").addEventListener("click", cerrarModal);
  document
    .getElementById("cancel-product")
    .addEventListener("click", cerrarModal);
  document
    .getElementById("save-product")
    .addEventListener("click", guardarProducto);

  // Búsqueda y filtros
  document
    .getElementById("search-input")
    .addEventListener("input", filtrarProductos);
  document
    .getElementById("category-filter")
    .addEventListener("change", filtrarProductos);

  // Toggle de stock
  document
    .getElementById("show-stock-toggle")
    .addEventListener("change", (e) => {
      mostrarStock = e.target.checked;
      renderizarProductos();
    });

  // Cerrar modal al hacer clic fuera
  document.getElementById("product-modal").addEventListener("click", (e) => {
    if (e.target.id === "product-modal") {
      cerrarModal();
    }
  });
}

// ============================================
// CARGA DE DATOS
// ============================================

async function cargarCategorias() {
  try {
    const response = await fetch(`${API_BASE}/categorias`);
    if (!response.ok) throw new Error("Error al cargar categorías");

    const data = await response.json();
    allCategories = data.categorias || [];

    // Llenar selects de categorías
    const selects = [
      document.getElementById("prod-categoria"),
      document.getElementById("category-filter"),
    ];

    selects.forEach((select) => {
      // Guardar la primera opción
      const firstOption = select.querySelector("option");
      select.innerHTML = "";
      select.appendChild(firstOption);

      allCategories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.id_categoria;
        option.textContent = cat.nombre;
        select.appendChild(option);
      });
    });
  } catch (error) {
    console.error("Error al cargar categorías:", error);
    showToast("Error al cargar categorías", "error");
  }
}

async function cargarProductos() {
  mostrarLoading(true);

  try {
    const response = await fetch(`${API_BASE}/productos`);
    if (!response.ok) throw new Error("Error al cargar productos");

    const data = await response.json();
    allProducts = data.productos || [];
    filteredProducts = [...allProducts];

    renderizarProductos();
  } catch (error) {
    console.error("Error al cargar productos:", error);
    showToast("Error al cargar productos", "error");
    mostrarEmptyState();
  } finally {
    mostrarLoading(false);
  }
}

// ============================================
// VERIFICACIÓN DE ASOCIACIONES
// ============================================

async function verificarAsociacionesPedidos(productoId) {
  try {
    // Obtener todos los pedidos
    const response = await fetch(`${API_BASE}/pedidos`);
    if (!response.ok) {
      console.error("Error al verificar asociaciones");
      return [];
    }

    const data = await response.json();
    const pedidos = data.pedidos || [];

    // Filtrar pedidos que contienen el producto
    const pedidosConProducto = pedidos.filter((pedido) =>
      pedido.productos.some((p) => p.id_producto === productoId)
    );

    return pedidosConProducto;
  } catch (error) {
    console.error("Error al verificar asociaciones:", error);
    return [];
  }
}

// ============================================
// RENDERIZADO
// ============================================

function renderizarProductos() {
  const grid = document.getElementById("products-grid");
  const emptyState = document.getElementById("empty-state");

  if (filteredProducts.length === 0) {
    grid.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  grid.classList.remove("hidden");
  emptyState.classList.add("hidden");

  grid.innerHTML = filteredProducts
    .map(
      (producto) => `
        <div class="product-card bg-white rounded-lg p-5 fade-in">
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-bold text-gray-800 truncate" title="${
                producto.nombre
              }">
                ${producto.nombre}
              </h3>
              ${
                producto.codigo
                  ? `<p class="text-sm text-gray-500 mt-1">Código: ${producto.codigo}</p>`
                  : ""
              }
            </div>
            <div class="flex gap-2 ml-2">
              <button
                onclick="abrirModalEditar(${producto.id_producto})"
                class="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Editar producto"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path>
                  <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path>
                </svg>
              </button>
              <button
                onclick="eliminarProducto(${producto.id_producto})"
                class="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Eliminar producto"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
              </button>
            </div>
          </div>

          ${
            producto.descripcion
              ? `<p class="text-sm text-gray-600 mb-3 line-clamp-2">${producto.descripcion}</p>`
              : ""
          }

          <div class="space-y-2 text-sm">
            ${
              producto.precio_unitario > 0
                ? `
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Precio:</span>
                <span class="font-semibold text-green-600">$${formatNumber(
                  producto.precio_unitario
                )}</span>
              </div>
            `
                : ""
            }

            ${
              mostrarStock &&
              producto.stock !== null &&
              producto.stock !== undefined
                ? `
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Stock:</span>
                <span class="font-semibold ${
                  producto.stock > 0 ? "text-blue-600" : "text-red-600"
                }">
                  ${producto.stock > 0 ? producto.stock : "Sin stock"}
                </span>
              </div>
            `
                : ""
            }

            ${
              getDimensionesTexto(producto)
                ? `
              <div class="pt-2 border-t border-gray-200">
                <p class="text-xs text-gray-500">${getDimensionesTexto(
                  producto
                )}</p>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `
    )
    .join("");
}

function getDimensionesTexto(producto) {
  const dimensiones = [];
  if (producto.largo_cm) dimensiones.push(`L: ${producto.largo_cm}cm`);
  if (producto.ancho_cm) dimensiones.push(`A: ${producto.ancho_cm}cm`);
  if (producto.alto_cm) dimensiones.push(`H: ${producto.alto_cm}cm`);
  if (producto.diametro_cm) dimensiones.push(`Ø: ${producto.diametro_cm}cm`);

  return dimensiones.length > 0 ? dimensiones.join(" × ") : "";
}

function formatNumber(num) {
  return new Intl.NumberFormat("es-CL").format(num);
}

// ============================================
// FILTRADO Y BÚSQUEDA
// ============================================

function filtrarProductos() {
  const searchTerm = document
    .getElementById("search-input")
    .value.toLowerCase();
  const categoryFilter = document.getElementById("category-filter").value;

  filteredProducts = allProducts.filter((producto) => {
    const matchSearch =
      !searchTerm ||
      producto.nombre.toLowerCase().includes(searchTerm) ||
      (producto.codigo && producto.codigo.toLowerCase().includes(searchTerm)) ||
      (producto.descripcion &&
        producto.descripcion.toLowerCase().includes(searchTerm));

    // Corrección: comparar como números o manejar null/undefined correctamente
    const matchCategory =
      !categoryFilter ||
      (producto.id_categoria !== null &&
        producto.id_categoria !== undefined &&
        producto.id_categoria.toString() === categoryFilter.toString());

    return matchSearch && matchCategory;
  });

  renderizarProductos();
}

// ============================================
// MODAL - CREAR/EDITAR
// ============================================

function abrirModalCrear() {
  currentProduct = null;
  pedidosAsociados = [];

  // Resetear formulario
  document.getElementById("product-form").reset();
  document.getElementById("modal-title").textContent = "Agregar Producto";
  document.getElementById("save-btn-text").textContent = "Guardar Producto";

  // Valores por defecto
  document.getElementById("prod-moneda").value = "CLP";
  document.getElementById("prod-unidad").value = "unidad";
  document.getElementById("prod-incluye-iva").checked = true;

  abrirModal();
}

async function abrirModalEditar(productoId) {
  // Buscar el producto en la lista
  currentProduct = allProducts.find((p) => p.id_producto === productoId);

  if (!currentProduct) {
    showToast("Producto no encontrado", "error");
    return;
  }

  // Verificar asociaciones con pedidos
  pedidosAsociados = await verificarAsociacionesPedidos(productoId);

  // Llenar formulario con datos del producto
  document.getElementById("modal-title").textContent = "Editar Producto";
  document.getElementById("save-btn-text").textContent = "Guardar Cambios";

  document.getElementById("prod-codigo").value = currentProduct.codigo || "";
  document.getElementById("prod-nombre").value = currentProduct.nombre || "";
  document.getElementById("prod-descripcion").value =
    currentProduct.descripcion || "";
  document.getElementById("prod-categoria").value =
    currentProduct.id_categoria || "";
  document.getElementById("prod-material").value =
    currentProduct.material || "";

  // Dimensiones
  document.getElementById("prod-largo").value = currentProduct.largo_cm || "";
  document.getElementById("prod-ancho").value = currentProduct.ancho_cm || "";
  document.getElementById("prod-alto").value = currentProduct.alto_cm || "";
  document.getElementById("prod-diametro").value =
    currentProduct.diametro_cm || "";
  document.getElementById("prod-fondo").value = currentProduct.fondo_cm || "";
  document.getElementById("prod-altura-asiento").value =
    currentProduct.altura_asiento_cm || "";
  document.getElementById("prod-altura-cubierta").value =
    currentProduct.altura_cubierta_cm || "";
  document.getElementById("prod-peso").value = currentProduct.peso_kg || "";

  // Precio y stock
  document.getElementById("prod-precio").value =
    currentProduct.precio_unitario || "";
  document.getElementById("prod-moneda").value = currentProduct.moneda || "CLP";
  document.getElementById("prod-stock").value = currentProduct.stock || "";
  document.getElementById("prod-unidad").value =
    currentProduct.unidad_venta || "unidad";
  document.getElementById("prod-incluye-iva").checked =
    currentProduct.incluye_iva !== false;
  document.getElementById("prod-requiere-presupuesto").checked =
    currentProduct.requiere_presupuesto || false;

  // Notas
  document.getElementById("prod-notas").value =
    currentProduct.notas_especiales || "";

  abrirModal();
}

function abrirModal() {
  document.getElementById("product-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  document.getElementById("product-modal").classList.add("hidden");
  document.body.style.overflow = "auto";
  currentProduct = null;
  pedidosAsociados = [];
}

// ============================================
// GUARDAR PRODUCTO (CREAR O EDITAR)
// ============================================

async function guardarProducto(e) {
  if (e) e.preventDefault();

  // Validación de nombre
  const nombre = document.getElementById("prod-nombre").value.trim();
  if (!nombre) {
    showToast("El nombre del producto es obligatorio", "error");
    return;
  }

  // Si está editando y hay pedidos asociados, mostrar confirmación
  if (currentProduct && pedidosAsociados.length > 0) {
    // GUARDAR el conteo de pedidos Y el producto antes de cerrar el modal
    const cantidadPedidos = pedidosAsociados.length;
    const productoAEditar = currentProduct; // Guardar referencia

    // Cerrar el modal PRIMERO
    cerrarModal();

    // LUEGO mostrar la confirmación con el conteo guardado
    mostrarConfirmacion(
      "Confirmar Cambios",
      `⚠️ Este producto está asociado a ${cantidadPedidos} pedido(s). Los cambios afectarán estos pedidos. ¿Deseas continuar?`,
      "warning",
      async () => {
        currentProduct = productoAEditar; // Restaurar producto
        await ejecutarGuardado();
      }
    );
    return;
  }

  await ejecutarGuardado();
}
async function ejecutarGuardado() {
  const saveBtn = document.getElementById("save-product");
  const saveBtnText = document.getElementById("save-btn-text");
  const saveSpinner = document.getElementById("save-spinner");

  saveBtn.disabled = true;
  saveBtnText.classList.add("hidden");
  saveSpinner.classList.remove("hidden");

  try {
    const formData = obtenerDatosFormulario();

    let response;
    if (currentProduct) {
      // Editar producto existente
      response = await fetch(
        `${API_BASE}/productos/${currentProduct.id_producto}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
    } else {
      // Crear nuevo producto (siempre permanente en el catálogo)
      response = await fetch(`${API_BASE}/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          es_temporal: false, // Productos del catálogo son permanentes
        }),
      });
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Error al guardar producto");
    }

    showToast(
      currentProduct
        ? "✅ Producto actualizado exitosamente"
        : "✅ Producto creado exitosamente",
      "success"
    );

    cerrarModal();
    await cargarProductos();
  } catch (error) {
    console.error("Error al guardar producto:", error);
    showToast(error.message, "error", 6000);
  } finally {
    saveBtn.disabled = false;
    saveBtnText.classList.remove("hidden");
    saveSpinner.classList.add("hidden");
  }
}

function obtenerDatosFormulario() {
  const getValue = (id, type = "string") => {
    const value = document.getElementById(id).value.trim();
    if (!value) return null;
    if (type === "number") return parseFloat(value);
    if (type === "int") return parseInt(value);
    return value;
  };

  return {
    codigo: getValue("prod-codigo"),
    nombre: getValue("prod-nombre"),
    descripcion: getValue("prod-descripcion"),
    id_categoria: getValue("prod-categoria", "int"),
    precio_unitario: getValue("prod-precio", "number"),
    largo_cm: getValue("prod-largo", "number"),
    ancho_cm: getValue("prod-ancho", "number"),
    alto_cm: getValue("prod-alto", "number"),
    diametro_cm: getValue("prod-diametro", "number"),
    fondo_cm: getValue("prod-fondo", "number"),
    altura_asiento_cm: getValue("prod-altura-asiento", "number"),
    altura_cubierta_cm: getValue("prod-altura-cubierta", "number"),
    peso_kg: getValue("prod-peso", "number"),
    material: getValue("prod-material"),
    moneda: document.getElementById("prod-moneda").value || "CLP",
    incluye_iva: document.getElementById("prod-incluye-iva").checked,
    requiere_presupuesto: document.getElementById("prod-requiere-presupuesto")
      .checked,
    unidad_venta: getValue("prod-unidad") || "unidad",
    stock: getValue("prod-stock", "int"),
    notas_especiales: getValue("prod-notas"),
  };
}

// ============================================
// ELIMINAR PRODUCTO
// ============================================

async function eliminarProducto(productoId) {
  const producto = allProducts.find((p) => p.id_producto === productoId);
  if (!producto) return;

  // Verificar asociaciones
  const pedidos = await verificarAsociacionesPedidos(productoId);

  if (pedidos.length > 0) {
    // Producto asociado a pedidos - NO SE PUEDE ELIMINAR
    mostrarConfirmacion(
      "No se puede eliminar",
      `Este producto está asociado a ${pedidos.length} pedido(s) activo(s). No es posible eliminarlo mientras esté en uso.`,
      "error",
      null,
      true // Solo mostrar botón de cancelar
    );
    return;
  }

  // Producto sin asociaciones - Pedir confirmación
  mostrarConfirmacion(
    "Confirmar Eliminación",
    `¿Estás seguro de eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`,
    "danger",
    async () => {
      await ejecutarEliminacion(productoId);
    }
  );
}

async function ejecutarEliminacion(productoId) {
  try {
    const response = await fetch(`${API_BASE}/productos/${productoId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Error al eliminar producto");
    }

    showToast("✅ Producto eliminado exitosamente", "success");
    await cargarProductos();
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    showToast(error.message, "error", 6000);
  }
}

// ============================================
// MODAL DE CONFIRMACIÓN
// ============================================

function mostrarConfirmacion(
  titulo,
  mensaje,
  tipo = "warning",
  callback = null,
  soloInfo = false
) {
  const modal = document.getElementById("confirmacion-modal");
  const icono = document.getElementById("confirmacion-icono");
  const tituloEl = document.getElementById("confirmacion-titulo");
  const mensajeEl = document.getElementById("confirmacion-mensaje");
  const botonAccion = document.getElementById("confirmacion-boton-accion");

  // Configurar colores según el tipo
  const configs = {
    warning: {
      bg: "bg-yellow-100",
      btnBg: "bg-yellow-600 hover:bg-yellow-700",
      btnText: "Confirmar",
    },
    danger: {
      bg: "bg-red-100",
      btnBg: "bg-red-600 hover:bg-red-700",
      btnText: "Eliminar",
    },
    error: {
      bg: "bg-red-100",
      btnBg: "bg-red-600 hover:bg-red-700",
      btnText: "Entendido",
    },
  };

  const config = configs[tipo] || configs.warning;

  icono.className = `w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${config.bg}`;
  tituloEl.textContent = titulo;
  mensajeEl.textContent = mensaje;
  botonAccion.className = `flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors ${config.btnBg}`;
  botonAccion.textContent = config.btnText;

  if (soloInfo) {
    botonAccion.classList.add("hidden");
  } else {
    botonAccion.classList.remove("hidden");
  }

  confirmacionCallback = callback;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function cerrarConfirmacion() {
  document.getElementById("confirmacion-modal").classList.add("hidden");
  document.body.style.overflow = "auto";
  confirmacionCallback = null;
}

function confirmarAccion() {
  if (confirmacionCallback) {
    confirmacionCallback();
  }
  cerrarConfirmacion();
}

// ============================================
// UTILIDADES
// ============================================

function mostrarLoading(mostrar) {
  const loading = document.getElementById("loading");
  const grid = document.getElementById("products-grid");

  if (mostrar) {
    loading.classList.remove("hidden");
    grid.classList.add("hidden");
  } else {
    loading.classList.add("hidden");
  }
}

function mostrarEmptyState() {
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("products-grid").classList.add("hidden");
  document.getElementById("empty-state").classList.remove("hidden");
}

function showToast(message, type = "info", duration = 4000) {
  const toast = document.createElement("div");

  let bgColor = "bg-blue-600";
  let icon = "ℹ️";

  if (type === "success") {
    bgColor = "bg-green-600";
    icon = "✓";
  } else if (type === "error") {
    bgColor = "bg-red-600";
    icon = "✕";
  } else if (type === "warning") {
    bgColor = "bg-yellow-600";
    icon = "⚠";
  }

  toast.className = `fixed top-20 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-white transform translate-x-full transition-all duration-300 max-w-md ${bgColor}`;

  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-lg font-bold flex-shrink-0 mt-0.5">
        ${icon}
      </div>
      <div class="font-medium text-sm leading-relaxed">${message}</div>
    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = "translateX(0)";
  }, 100);

  setTimeout(() => {
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

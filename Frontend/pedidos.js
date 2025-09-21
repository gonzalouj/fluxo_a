// pedidos.js

// --- CONSTANTES Y ESTADO GLOBAL ---
const API_BASE = '/api';
let pedidosData = [];
let pedidoActual = null;
let accionAConfirmar = null;

// --- REFERENCIAS AL DOM ---
const listaEl = document.getElementById('lista-pedidos');
const loadingEl = document.getElementById('loading');
const emptyStateEl = document.getElementById('empty-state');
const modalEl = document.getElementById('modal-pedido');
const modalConfirmacionEl = document.getElementById('modal-confirmacion');

// --- PLACEHOLDERS DE UI (Funcionalidad pendiente) ---
document.getElementById('menu-toggle')?.addEventListener('click', function() {
  console.log('Menú toggle - funcionalidad pendiente');
});
document.getElementById('filter-toggle')?.addEventListener('click', function() {
  console.log('Filtro toggle - funcionalidad pendiente');
});
document.getElementById('search-input')?.addEventListener('input', function() {
  console.log('Búsqueda:', this.value, '- funcionalidad pendiente');
});


// --- FUNCIONES DE FORMATO ---
function getStatusClass(estado) {
  const estados = { 'pendiente': 'status-pendiente', 'listo': 'status-listo', 'cancelado': 'status-cancelado' };
  return estados[(estado || '').toLowerCase()] || 'bg-gray-500';
}

// ✅ NUEVO: Función para obtener las clases de color para la etiqueta de estado en la tarjeta.
function getStatusBadgeClasses(estado) {
  const normalizedEstado = (estado || '').toLowerCase();
  const classes = {
    'pendiente': 'bg-yellow-100 text-yellow-800',
    'listo':     'bg-green-100 text-green-800',
    'cancelado': 'bg-red-100 text-red-800',
  };
  return classes[normalizedEstado] || 'bg-gray-100 text-gray-800'; // Color por defecto
}

function formatDate(fecha) {
  if (!fecha) return 'Sin fecha';
  try { const date = new Date(fecha + 'T00:00:00'); return date.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }); } catch { return fecha; }
}
function formatShortDate(fecha) {
  if (!fecha) return 'Sin fecha';
  try { const date = new Date(fecha); return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return fecha; }
}
function capitalize(v) { return v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : ''; }
function formatCLP(value) {
  if (value == null || value === '') return '$0';
  const n = Number(value);
  if (Number.isNaN(n)) return `$${value}`;
  return `$${Math.round(n).toLocaleString('es-CL')}`;
}

// --- LÓGICA DEL MODAL DE DETALLES ---
// (Esta sección no tiene cambios)
function abrirModal(pedido) {
  pedidoActual = pedido;
  const estado = (pedido.estado || 'Pendiente').toLowerCase();
  const statusClass = getStatusClass(estado);
  
  document.getElementById('modal-titulo').textContent = pedido.nombre_cliente || 'Cliente sin nombre';
  const fechaCreacionStr = pedido.fecha_creacion ? pedido.fecha_creacion.Time : null;
  document.getElementById('modal-fecha-creacion').textContent = `Pedido #${pedido.id_pedido} • Creado el ${formatShortDate(fechaCreacionStr)}`;
  document.getElementById('modal-status-indicator').className = `w-5 h-5 rounded-full flex-shrink-0 ${statusClass}`;
  
  const badgeEl = document.getElementById('modal-estado-badge');
  badgeEl.textContent = capitalize(estado);
  badgeEl.className = `px-4 py-2 rounded-full text-white font-semibold status-badge-large ${statusClass}`;
  
  document.getElementById('modal-cliente').textContent = pedido.nombre_cliente || 'Sin nombre';
  
  const emailContainer = document.getElementById('modal-email-container');
  if (pedido.email_cliente) { emailContainer.style.display = 'flex'; document.getElementById('modal-email').textContent = pedido.email_cliente; } else { emailContainer.style.display = 'none'; }
  
  // ✅ CAMBIO: Se añade la lógica para mostrar el teléfono del cliente si existe.
  const telefonoContainer = document.getElementById('modal-telefono-container');
  if (pedido.telefono_cliente) { 
    telefonoContainer.style.display = 'flex'; 
    document.getElementById('modal-telefono').textContent = pedido.telefono_cliente; 
  } else { 
    telefonoContainer.style.display = 'none'; 
  }
  document.getElementById('modal-fecha-entrega').textContent = formatDate(pedido.fecha_entrega);
  
  const productosEl = document.getElementById('modal-productos');
  let total = 0;
  if (pedido.productos && pedido.productos.length > 0) {
    productosEl.innerHTML = pedido.productos.map(prod => {
      const subtotal = (prod.cantidad || 0) * (prod.precio_unitario || 0);
      total += subtotal;
      return `<div class="flex justify-between items-center bg-white rounded-lg p-3"><div><span class="text-sm font-medium text-gray-900">${prod.producto || 'Producto sin nombre'}</span><div class="text-xs text-gray-500 mt-1">${prod.cantidad || 0} unidad${prod.cantidad !== 1 ? 'es' : ''} × ${formatCLP(prod.precio_unitario)}</div></div><span class="text-sm font-semibold text-gray-900">${formatCLP(subtotal)}</span></div>`;
    }).join('');
  } else { productosEl.innerHTML = `<div class="text-center py-4 text-gray-500"><p class="text-sm italic">Sin productos asociados</p></div>`; }
  document.getElementById('modal-total').textContent = formatCLP(total);
  
  const detallesContainer = document.getElementById('modal-detalles-container');
  const detallesEl = document.getElementById('modal-detalles');
  if (pedido.detalles_pedido) {
    detallesContainer.style.display = 'block';
    const etiquetas = pedido.detalles_pedido.split(',') // 1. Dividir solo por coma
                                     .map(tag => tag.trim()) // 2. Quitar espacios en blanco al inicio y final
                                     .filter(Boolean);      // 3. Quitar etiquetas vacías

    detallesEl.innerHTML = etiquetas.map(tag => 
      `<span class="inline-block bg-purple-200 text-purple-800 text-xs font-semibold mr-2 mb-2 px-2.5 py-1 rounded-full">${tag}</span>`
    ).join('');
  } else {
    detallesContainer.style.display = 'none';
  }
  
  const comentariosContainer = document.getElementById('modal-comentarios-container');
  const comentariosEl = document.getElementById('modal-comentarios');
  const comentarios = pedido.comentarios || [];
  if (comentarios.length > 0) {
    comentariosContainer.style.display = 'block';
    comentariosEl.innerHTML = comentarios.map(c => `<div class="bg-white p-3 rounded-lg border border-gray-200"><div class="flex justify-between items-center mb-1"><p class="text-xs font-bold text-gray-800">${c.usuario || 'Usuario desconocido'}</p><p class="text-xs text-gray-500">${c.fecha || ''}</p></div><p class="text-sm text-gray-700">${c.comentario || 'Sin comentario.'}</p></div>`).join('');
  } else { comentariosContainer.style.display = 'none'; }
  
  const actionsEl = document.getElementById('modal-actions');
  if (estado === 'pendiente') {
    actionsEl.innerHTML = `<div class="flex items-center justify-center gap-3"><button onclick="cambiarEstado('Cancelado')" class="action-button flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium text-sm"><span class="flex items-center justify-center"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>Cancelar</span></button><button onclick="cambiarEstado('Listo')" class="action-button flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium text-sm"><span class="flex items-center justify-center"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Marcar Listo</span></button></div>`;
  } else { actionsEl.innerHTML = ''; }
  
  modalEl.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  modalEl.classList.add('hidden');
  document.body.style.overflow = '';
  pedidoActual = null;
}



// --- LÓGICA DEL MODAL DE CONFIRMACIÓN ---
// (Esta sección no tiene cambios)
function abrirConfirmacion(titulo, mensaje, colorBoton, accion) {
    document.getElementById('confirmacion-titulo').textContent = titulo;
    document.getElementById('confirmacion-mensaje').textContent = mensaje;
    
    const botonAccion = document.getElementById('confirmacion-boton-accion');
    botonAccion.className = `w-full px-4 py-2.5 text-white rounded-lg font-medium transition-colors ${colorBoton}`;
    
    const iconoEl = document.getElementById('confirmacion-icono');
    iconoEl.className = `w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${colorBoton}`;

    accionAConfirmar = accion;
    modalConfirmacionEl.classList.remove('hidden');
}

function cerrarConfirmacion() {
    modalConfirmacionEl.classList.add('hidden');
    accionAConfirmar = null;
}

function confirmarAccion() {
    if (typeof accionAConfirmar === 'function') {
        accionAConfirmar();
    }
    cerrarConfirmacion();
}

// --- LÓGICA DE CAMBIO DE ESTADO (API) ---
// (Esta sección no tiene cambios)
async function ejecutarCambioEstado(nuevoEstado) {
  if (!pedidoActual) return;
  try {
    const res = await fetch(`${API_BASE}/pedidos/${pedidoActual.id_pedido}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (!res.ok) throw new Error('Error al actualizar estado');
    cerrarModal();
    await cargarPedidos(); 
    mostrarNotificacion(`Pedido ${nuevoEstado === 'Listo' ? 'completado' : 'cancelado'} exitosamente`, 'success');
  } catch (e) {
    console.error('Error:', e);
    mostrarNotificacion('Error al actualizar el estado del pedido', 'error');
  }
}

function cambiarEstado(nuevoEstado) {
  if (nuevoEstado === 'Listo') {
    abrirConfirmacion('¿Marcar como Listo?', '¿Estás seguro de que quieres marcar este pedido como listo para entrega?', 'bg-green-500 hover:bg-green-600', () => ejecutarCambioEstado('Listo'));
  } else if (nuevoEstado === 'Cancelado') {
    abrirConfirmacion('¿Cancelar Pedido?', 'Esta acción no se puede deshacer. ¿Estás seguro de que quieres cancelar este pedido?', 'bg-red-500 hover:bg-red-600', () => ejecutarCambioEstado('Cancelado'));
  }
}

// --- LÓGICA DE NOTIFICACIONES ---
// (Esta sección no tiene cambios)
function mostrarNotificacion(mensaje, tipo) {
  const notif = document.createElement('div');
  notif.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transform translate-x-full transition-transform duration-300 ${ tipo === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
  notif.textContent = mensaje;
  document.body.appendChild(notif);
  setTimeout(() => { notif.style.transform = 'translateX(0)'; }, 100);
  setTimeout(() => { notif.style.transform = 'translateX(100%)'; setTimeout(() => notif.remove(), 300); }, 3000);
}

// --- LÓGICA DE RENDERIZADO Y CARGA DE DATOS ---
function renderPedidoCard(pedido) {
  const estado = pedido.estado || 'Pendiente';
  const statusClass = getStatusClass(estado);
  const fechaFormateada = formatShortDate(pedido.fecha_entrega);
  const productosHtml = (pedido.productos && pedido.productos.length > 0) ? `<div class="space-y-2"><h3 class="text-sm font-medium text-gray-700 mb-2">Productos:</h3><div class="bg-gray-50 rounded-xl p-3">${pedido.productos.map(prod => `<div class="flex justify-between items-center py-1"><span class="text-sm text-gray-800 flex-1">${prod.producto || 'Producto sin nombre'}</span><span class="text-sm text-gray-600 ml-2">x${prod.cantidad || 0} • ${formatCLP(prod.precio_unitario)}</span></div>`).join('')}</div></div>` : `<div class="text-center py-4"><svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg><p class="text-gray-400 text-sm italic">Sin productos asociados</p></div>`;
  const nombreCliente = (pedido.nombre_cliente || 'Cliente sin nombre').toUpperCase();
  const escapedPedido = JSON.stringify(pedido).replace(/'/g, "&apos;");
  
  // ✅ CAMBIO: Usamos la nueva función para obtener las clases de la etiqueta de estado.
  const statusBadgeClasses = getStatusBadgeClasses(estado);

  return `<div class="pedido-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" onclick='abrirModal(${escapedPedido})'><div class="flex items-center p-4 pb-3"><div class="w-4 h-4 rounded-full ${statusClass} mr-3 flex-shrink-0"></div><div class="flex-1 min-w-0"><h2 class="text-lg md:text-xl font-semibold text-gray-900 truncate">${nombreCliente}</h2></div><span class="text-xs px-2 py-1 rounded-full ${statusBadgeClasses} ml-2 flex-shrink-0">${capitalize(estado)}</span></div><div class="px-4 pb-4"><div class="flex items-center justify-between text-sm text-gray-600 mb-3"><div class="flex items-center"><svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span>Entrega: ${fechaFormateada}</span></div><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></div>${productosHtml}</div></div>`;
}

function renderizarPedidos() {
  if (pedidosData.length === 0) { emptyStateEl.classList.remove('hidden'); listaEl.classList.add('hidden'); return; }
  listaEl.innerHTML = pedidosData.map(renderPedidoCard).join('');
  listaEl.classList.remove('hidden');
  emptyStateEl.classList.add('hidden');
}

async function cargarPedidos() {
  try {
    const res = await fetch(`${API_BASE}/pedidos`);
    if (!res.ok) throw new Error('Error al cargar pedidos');
    const data = await res.json();
    pedidosData = data.pedidos || [];
    loadingEl.classList.add('hidden');
    renderizarPedidos();
  } catch (e) {
    loadingEl.classList.add('hidden');
    listaEl.innerHTML = `<div class="text-center py-12"><div class="text-red-400 mb-4"><svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.19 2.5 1.732 2.5z"></path></svg></div><p class="text-red-500 text-lg font-medium">Error de conexión</p><p class="text-gray-500 text-sm mt-1">No se pudo conectar con el servidor</p></div>`;
    listaEl.classList.remove('hidden');
    emptyStateEl.classList.add('hidden');
    console.error(e);
  }
}

// --- EVENT LISTENERS GLOBALES ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!modalConfirmacionEl.classList.contains('hidden')) {
      cerrarConfirmacion();
    } else if (!modalEl.classList.contains('hidden')) {
      cerrarModal();
    }
  }
});

document.addEventListener('DOMContentLoaded', cargarPedidos);
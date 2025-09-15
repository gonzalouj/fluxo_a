// Funciones de interfaz (sin funcionalidad completa - preparadas para futuras historias)
document.getElementById('menu-toggle')?.addEventListener('click', function() {
    // TODO: Implementar menú lateral
  });
  
  document.getElementById('filter-toggle')?.addEventListener('click', function() {
    console.log('Filtro clicked - funcionalidad pendiente');
    // TODO: Implementar panel de filtros
  });
  
  document.getElementById('search-input')?.addEventListener('input', function() {
    console.log('Búsqueda:', this.value, '- funcionalidad pendiente');
    // TODO: Implementar búsqueda en tiempo real
  });
  
  // Función para determinar la clase CSS del estado
  function getStatusClass(estado) {
    const estados = {
      'pendiente': 'status-pendiente',
      'listo': 'status-listo',
      'cancelado': 'status-cancelado'
    };
    const normalizedEstado = estado.toLowerCase();
    return estados[normalizedEstado] || 'bg-gray-500';
  }
  
  // Función para formatear fecha
  function formatDate(fecha) {
    if (!fecha) return 'Sin fecha';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  }
  
  // Función para renderizar un pedido
  function renderPedido(pedido) {
    console.log("Renderizando pedido con estado:", pedido.estado); // Nuevo log
    const statusClass = getStatusClass(pedido.estado);
    const fechaFormateada = formatDate(pedido.fecha_entrega);
    
    return `
      <div class="pedido-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Header con indicador de estado -->
        <div class="flex items-center p-4 pb-3">
          <div class="w-4 h-4 rounded-full ${statusClass} mr-3 flex-shrink-0"></div>
          <div class="flex-1 min-w-0">
            <h2 class="text-lg md:text-xl font-semibold text-gray-900 truncate">
              ${pedido.nombre_cliente || 'Cliente sin nombre'}
            </h2>
          </div>
          <span class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 ml-2 flex-shrink-0">
            ${pedido.estado ? pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1) : 'Sin estado'}
          </span>
        </div>
  
        <!-- Información del pedido -->
        <div class="px-4 pb-4">
          <div class="flex items-center text-sm text-gray-600 mb-3">
            <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>
            </svg>
            <span>Entrega: ${fechaFormateada}</span>
          </div>
  
          <!-- Lista de productos -->
          ${
            pedido.productos && pedido.productos.length > 0
              ? `<div class="space-y-2">
                  <h3 class="text-sm font-medium text-gray-700 mb-2">Productos:</h3>
                  <div class="bg-gray-50 rounded-xl p-3">
                    ${pedido.productos.map(prod => `
                      <div class="flex justify-between items-center py-1">
                        <span class="text-sm text-gray-800 flex-1">
                          ${prod.producto || 'Producto sin nombre'}
                        </span>
                        <span class="text-sm text-gray-600 ml-2">
                          x${prod.cantidad || 0} • $${prod.precio_unitario || '0'}
                        </span>
                      </div>
                    `).join("")}
                  </div>
                </div>`
              : `<div class="text-center py-4">
                  <svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                  </svg>
                  <p class="text-gray-400 text-sm italic">Sin productos asociados</p>
                </div>`
          }
        </div>
      </div>
    `;
  }
  
  // Función para mostrar estado de error
  function showErrorState(message = 'Error cargando pedidos', subMessage = 'Por favor, intenta recargar la página') {
    return `
      <div class="text-center py-12">
        <div class="text-red-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.19 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <p class="text-red-500 text-lg font-medium">${message}</p>
        <p class="text-gray-500 text-sm mt-1">${subMessage}</p>
      </div>
    `;
  }
  
  // Manejo de respuesta exitosa de HTMX
  document.body.addEventListener("htmx:afterSwap", (event) => {
    const lista = document.getElementById("lista-pedidos");
    const loading = document.getElementById("loading");
    const emptyState = document.getElementById("empty-state");
    
    // Ocultar loading
    loading.classList.add("hidden");
    
    try {
      const pedidos = JSON.parse(event.detail.xhr.response);
        
        // Verificar si hay pedidos
        if (!pedidos || pedidos.length === 0) {
          lista.classList.add("hidden");
          emptyState.classList.remove("hidden");
          return;
        }
    
        // Ordenar pedidos (pendientes primero)
        /*const pedidosOrdenados = sortPedidos(pedidos);*/
        
        // Renderizar pedidos
        lista.innerHTML = pedidos.map(renderPedido).join("");
      
      lista.classList.remove("hidden");
      emptyState.classList.add("hidden");
      
    } catch (e) {
      console.error('Error parsing pedidos:', e);
      lista.innerHTML = showErrorState();
      lista.classList.remove("hidden");
      emptyState.classList.add("hidden");
    }
  });
  
  // Manejo de errores de conexión HTMX
  document.body.addEventListener("htmx:responseError", (event) => {
    const loading = document.getElementById("loading");
    const lista = document.getElementById("lista-pedidos");
    const emptyState = document.getElementById("empty-state");
    
    loading.classList.add("hidden");
    lista.innerHTML = showErrorState('Error de conexión', 'No se pudo conectar con el servidor');
    lista.classList.remove("hidden");
    emptyState.classList.add("hidden");
  });
  
  // Manejo de errores de timeout HTMX
  document.body.addEventListener("htmx:timeout", (event) => {
    const loading = document.getElementById("loading");
    const lista = document.getElementById("lista-pedidos");
    const emptyState = document.getElementById("empty-state");
    
    loading.classList.add("hidden");
    lista.innerHTML = showErrorState('Tiempo de espera agotado', 'El servidor no respondió a tiempo');
    lista.classList.remove("hidden");
    emptyState.classList.add("hidden");
  });

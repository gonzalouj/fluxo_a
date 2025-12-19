const API_BASE = "/api";

/* ============================================================
   SISTEMA DE NOTIFICACIONES PERSONALIZADO
============================================================ */

// Toast notifications
window.showToast = function (message, type = "info") {
  const container =
    document.getElementById("toastContainer") || createToastContainer();

  const toast = document.createElement("div");
  toast.className = `transform transition-all duration-300 ease-in-out mb-3 p-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-md`;

  // Colores según tipo
  const colors = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-blue-500 text-white",
  };

  toast.className += " " + (colors[type] || colors.info);

  toast.innerHTML = `
    <span class="flex-1">${message}</span>
    <button onclick="this.parentElement.remove()" class="text-white hover:text-gray-200 font-bold">
      ✕
    </button>
  `;

  container.appendChild(toast);

  // Animación de entrada
  setTimeout(() => toast.classList.add("opacity-100"), 10);

  // Auto-eliminar después de 4 segundos
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-x-full");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toastContainer";
  container.className = "fixed top-4 right-4 z-50 flex flex-col items-end";
  document.body.appendChild(container);
  return container;
}

// Modal de confirmación personalizado
window.showConfirm = function (message, onConfirm) {
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in";
  modal.id = "confirmModal";

  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all animate-scale-in">
      <div class="flex items-start mb-4">
        <div class="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
          <span class="text-2xl">⚠️</span>
        </div>
        <div class="ml-4 flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Confirmar acción</h3>
          <p class="text-gray-600">${message}</p>
        </div>
      </div>
      <div class="flex justify-end space-x-3 mt-6">
        <button id="btnCancelarConfirm" 
                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium">
          Cancelar
        </button>
        <button id="btnAceptarConfirm" 
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
          Aceptar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Eventos
  document.getElementById("btnCancelarConfirm").onclick = () => {
    modal.classList.add("animate-fade-out");
    setTimeout(() => modal.remove(), 200);
  };

  document.getElementById("btnAceptarConfirm").onclick = () => {
    modal.classList.add("animate-fade-out");
    setTimeout(() => {
      modal.remove();
      onConfirm();
    }, 200);
  };

  // Cerrar al hacer clic fuera
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.add("animate-fade-out");
      setTimeout(() => modal.remove(), 200);
    }
  };
};

/* ============================================================
   INICIALIZACIÓN
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  cargarUsuarios();

  // Abrir modal
  const btn = document.getElementById("btnNuevoUsuario");
  if (btn) btn.addEventListener("click", mostrarModal);

  // Botón cancelar dentro del modal
  const btnCancelar = document.getElementById("btnCancelar");
  if (btnCancelar) btnCancelar.addEventListener("click", cerrarModal);

  // Botón cancelar modal editar
  const btnCancelarEditar = document.getElementById("btnCancelarEditar");
  if (btnCancelarEditar)
    btnCancelarEditar.addEventListener("click", cerrarModalEditar);

  // Evento guardar usuario
  const form = document.getElementById("formUsuario");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      crearUsuario();
    });
  }

  // Evento actualizar usuario
  const formEditar = document.getElementById("formEditarUsuario");
  if (formEditar) {
    formEditar.addEventListener("submit", (e) => {
      e.preventDefault();
      actualizarUsuario();
    });
  }
});

/* ============================================================
   CARGAR USUARIOS
============================================================ */
async function cargarUsuarios() {
  try {
    const res = await fetch(`${API_BASE}/usuarios`);

    if (!res.ok) throw new Error("Error consultando usuarios.");

    const data = await res.json();

    const tbody = document.getElementById("tablaUsuarios");
    tbody.innerHTML = "";

    data.usuarios.forEach((u) => {
      const estadoBadge = u.activo
        ? '<span class="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Activo</span>'
        : '<span class="px-2 py-1 rounded text-xs bg-red-100 text-red-800">Inactivo</span>';

      tbody.innerHTML += `
                <tr>
                    <td class="px-4 py-2">${u.id_usuario}</td>
                    <td class="px-4 py-2">${u.nombre_completo}</td>
                    <td class="px-4 py-2">${u.email}</td>
                    <td class="px-4 py-2">${u.rut}</td>
                    <td class="px-4 py-2">${u.rol}</td>
                    <td class="px-4 py-2">${estadoBadge}</td>

                    <td class="px-4 py-2">
                        <div class="flex flex-col sm:flex-row gap-2">
                            <button class="w-full sm:w-auto px-3 py-1.5 rounded text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-medium"
                                    onclick="editarUsuario(${u.id_usuario})">
                                ✏️ Editar
                            </button>
                            <button class="w-full sm:w-auto px-3 py-1.5 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-medium"
                                    onclick="eliminarUsuario(${u.id_usuario})">
                                🗑️ Eliminar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
    });
  } catch (e) {
    console.error(e);
    showToast("❌ Error cargando usuarios", "error");
  }
}

/* ============================================================
   ABRIR / CERRAR MODAL
============================================================ */
function mostrarModal() {
  const modal = document.getElementById("modalUsuario");
  modal.classList.remove("hidden");
}

function cerrarModal() {
  const modal = document.getElementById("modalUsuario");
  modal.classList.add("hidden");
}

/* ============================================================
   VALIDACIÓN
============================================================ */
function validarUsuario(nuevo) {
  if (!nuevo.nombre_completo.trim())
    return "El nombre completo es obligatorio.";
  if (!nuevo.rut.trim()) return "El RUT es obligatorio.";
  if (!nuevo.email.trim()) return "El email es obligatorio.";
  if (!nuevo.email.includes("@")) return "El email no es válido.";

  return null;
}

/* ============================================================
   CREAR USUARIO
============================================================ */
async function crearUsuario() {
  const permisos = [...document.querySelectorAll(".permiso:checked")].map(
    (cb) => cb.value
  );

  const nuevo = {
    nombre_completo: document.getElementById("nombreNuevo").value,
    rut: document.getElementById("rutNuevo").value.trim(),
    email: document.getElementById("emailNuevo").value,
    password: "password-google-oauth", // contraseña por defecto para usuarios OAuth
    rol: document.getElementById("rolNuevo").value,
    permisos: permisos,
  };

  // Validar
  const error = validarUsuario(nuevo);
  if (error) {
    showToast("⚠ " + error, "warning");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevo),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(
        "❌ Error al crear usuario: " + (err.msg || "Desconocido"),
        "error"
      );
      return;
    }

    showToast("✅ Usuario creado correctamente", "success");

    cerrarModal();
    cargarUsuarios();
  } catch (e) {
    console.error(e);
    showToast("❌ Error inesperado", "error");
  }
}

/* ============================================================
   EDITAR USUARIO
============================================================ */
async function editarUsuario(id) {
  try {
    // Buscar usuario en la tabla
    const res = await fetch(`${API_BASE}/usuarios`);
    const data = await res.json();
    const usuario = data.usuarios.find((u) => u.id_usuario === id);

    if (!usuario) {
      showToast("❌ Usuario no encontrado", "error");
      return;
    }

    // Llenar el formulario de edición
    document.getElementById("editarIdUsuario").value = usuario.id_usuario;
    document.getElementById("editarNombre").value = usuario.nombre_completo;
    document.getElementById("editarRut").value = usuario.rut;
    document.getElementById("editarEmail").value = usuario.email;
    document.getElementById("editarRol").value = usuario.rol;
    document.getElementById("editarActivo").value = usuario.activo.toString();

    // Mostrar modal
    document.getElementById("modalEditarUsuario").classList.remove("hidden");
  } catch (e) {
    console.error(e);
    showToast("❌ Error al cargar usuario", "error");
  }
}

function cerrarModalEditar() {
  document.getElementById("modalEditarUsuario").classList.add("hidden");
}

async function actualizarUsuario() {
  const id = document.getElementById("editarIdUsuario").value;

  const usuario = {
    nombre_completo: document.getElementById("editarNombre").value,
    rut: document.getElementById("editarRut").value.trim(),
    email: document.getElementById("editarEmail").value,
    rol: document.getElementById("editarRol").value,
    activo: document.getElementById("editarActivo").value === "true",
  };

  // Validar
  const error = validarUsuario(usuario);
  if (error) {
    showToast("⚠ " + error, "warning");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuario),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(
        "❌ Error al actualizar usuario: " + (err.msg || "Desconocido"),
        "error"
      );
      return;
    }

    showToast("✅ Usuario actualizado correctamente", "success");

    cerrarModalEditar();
    cargarUsuarios();
  } catch (e) {
    console.error(e);
    showToast("❌ Error inesperado", "error");
  }
}

/* ============================================================
   ELIMINAR PERMANENTE
============================================================ */
async function eliminarUsuario(id) {
  showConfirm(
    "Esta acción eliminará al usuario PERMANENTEMENTE. ¿Deseas continuar?",
    async () => {
      try {
        const res = await fetch(`${API_BASE}/usuarios/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Error al eliminar:", errorData);
          showToast(
            "❌ " + (errorData.msg || "No se pudo eliminar el usuario"),
            "error"
          );
          return;
        }

        showToast("✅ Usuario eliminado correctamente", "success");
        cargarUsuarios();
      } catch (e) {
        console.error("Error en eliminarUsuario:", e);
        showToast("❌ Error al eliminar usuario", "error");
      }
    }
  );
}

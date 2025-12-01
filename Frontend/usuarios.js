const API_BASE = "http://localhost:8080/api";

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

    // Evento guardar usuario
    const form = document.getElementById("formUsuario");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            crearUsuario();
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

        data.usuarios.forEach(u => {
            tbody.innerHTML += `
                <tr>
                    <td class="px-4 py-2">${u.id_usuario}</td>
                    <td class="px-4 py-2">${u.nombre_completo}</td>
                    <td class="px-4 py-2">${u.email}</td>
                    <td class="px-4 py-2">${u.rut}</td>
                    <td class="px-4 py-2">${u.rol}</td>
                    <td class="px-4 py-2">${u.activo ? "Activo" : "Inactivo"}</td>

                    <td class="px-4 py-2">
                        <button class="text-red-600 hover:underline"
                                onclick="eliminarUsuario(${u.id_usuario})">
                            Eliminar Permanentemente
                        </button>
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
    if (!nuevo.nombre_completo.trim()) return "El nombre completo es obligatorio.";
    if (!nuevo.email.trim()) return "El email es obligatorio.";
    if (!nuevo.email.includes("@")) return "El email no es válido.";
    if (!nuevo.rut.trim()) return "El RUT es obligatorio.";
    if (!nuevo.password.trim()) return "La contraseña es obligatoria.";

    return null;
}

/* ============================================================
   CREAR USUARIO
============================================================ */
async function crearUsuario() {

    const permisos = [...document.querySelectorAll(".permiso:checked")].map(cb => cb.value);

    const nuevo = {
        nombre_completo: document.getElementById("nombreNuevo").value,
        rut: document.getElementById("rutNuevo").value,
        email: document.getElementById("emailNuevo").value,
        password: document.getElementById("passwordNuevo").value, // backend hará hash
        rol: document.getElementById("rolNuevo").value,
        permisos: permisos
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
            body: JSON.stringify(nuevo)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showToast("❌ Error al crear usuario: " + (err.msg || "Desconocido"), "error");
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
   ELIMINAR PERMANENTE
============================================================ */
async function eliminarUsuario(id) {

    if (!confirm("⚠ Esta acción eliminará al usuario PERMANENTEMENTE.\n¿Deseas continuar?")) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/usuarios/${id}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            showToast("❌ No se pudo eliminar el usuario", "error");
            return;
        }

        showToast("🗑 Usuario eliminado", "success");
        cargarUsuarios();

    } catch (e) {
        console.error(e);
        showToast("❌ Error al eliminar usuario", "error");
    }
}



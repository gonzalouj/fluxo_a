const API_BASE = "/api";

async function cargarUsuarios() {
  try {
    const res = await fetch(`${API_BASE}/usuarios`);
    if (!res.ok) throw new Error("Error al cargar los usuarios");
    const data = await res.json();
    mostrarUsuarios(data.usuarios);
  } catch (err) {
    console.error(err);
    alert("No se pudieron cargar los usuarios.");
  }
}

function mostrarUsuarios(usuarios) {
  const tbody = document.querySelector("#tablaUsuarios tbody");
  tbody.innerHTML = "";
  usuarios.forEach(u => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${u.id_usuario}</td>
      <td>${u.nombre_completo}</td>
      <td>${u.email}</td>
      <td>${u.rut}</td>
      <td>${u.rol}</td>
      <td>${u.activo ? "Activo" : "Inactivo"}</td>
      <td>
        <button class="btn-eliminar" data-id="${u.id_usuario}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

document.addEventListener("DOMContentLoaded", cargarUsuarios);

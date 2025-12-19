// handlers/user_handler.go

package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"fmt"
	"strconv"

	"fluxo/backend/models"
)

// Usa la variable 'db' definida en pedidos.go (mismo paquete)

// CrearUsuario maneja la creación de un nuevo usuario
func CrearUsuario(c *gin.Context) {
	var req models.NewUserRequest

	// 1. Recibir y Validar los datos del JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"msg": "Datos de entrada inválidos", "error": err.Error()})
		return
	}

	// --- Lógica de Negocio: Validar Existencia (H12) ---
	// 2. Verificar si el RUT o Email ya existen
	var existingID int
	err := db.QueryRow("SELECT id_usuario FROM usuarios WHERE rut = $1 OR email = $2", req.Rut, req.Email).Scan(&existingID)

	if err != nil && err != sql.ErrNoRows {
		// Error de la base de datos
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "Error de base de datos al verificar usuario", "error": err.Error()})
		return
	}

	if existingID > 0 {
		// El usuario ya existe (por RUT o Email)
		c.JSON(http.StatusConflict, gin.H{"msg": "Ya existe un usuario con ese RUT o Email."})
		return
	}

	// 3. Hashear la Contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "Error al hashear la contraseña"})
		return
	}
	passwordHash := string(hashedPassword)

	// 4. Guardar Usuario en la DB
	query := `
        INSERT INTO usuarios (rut, nombre_completo, email, password_hash, rol, activo, fecha_creacion)
        VALUES ($1, $2, $3, $4, $5, TRUE, $6)
        RETURNING id_usuario
    `
	var newID int
	err = db.QueryRow(query, req.Rut, req.NombreCompleto, req.Email, passwordHash, req.Rol, time.Now()).Scan(&newID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "Error al crear el usuario", "error": err.Error()})
		return
	}

	// **Nota sobre Permisos:** La gestión de `req.Permisos` requiere otra tabla
	// (ej: `usuario_permisos`). Si aún no la tienes, este es el punto
	// donde insertarías registros en esa tabla usando `newID`.

	c.JSON(http.StatusCreated, gin.H{
		"msg": "Usuario creado exitosamente",
		"usuario": gin.H{
			"id_usuario": newID,
			"nombre":     req.NombreCompleto,
			// ... otros datos
		},
	})
}

// handlers/user_handler.go (Añadir esta función)

// ListarUsuarios consulta y devuelve la lista de TODOS los usuarios (activos e inactivos)
func ListarUsuarios(c *gin.Context) {
	// 1. Consulta SQL
	// Seleccionamos todos los campos necesarios para la tabla del frontend.
	query := `
        SELECT id_usuario, rut, nombre_completo, email, rol, activo
        FROM usuarios
        ORDER BY id_usuario DESC
    `
	rows, err := db.Query(query)
	if err != nil {
		// Loguear el error y responder con un error 500
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "Error de base de datos al listar usuarios", "error": err.Error()})
		return
	}
	defer rows.Close()

	var usuarios []models.UserResponse // Usamos el struct definido para la respuesta

	// 2. Iterar sobre los resultados
	for rows.Next() {
		var u models.UserResponse

		// Scan de los campos de la fila de la DB
		if err := rows.Scan(
			&u.IDUsuario,
			&u.Rut,
			&u.NombreCompleto,
			&u.Email,
			&u.Rol,
			&u.Activo,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"msg": "Error al leer datos de la DB", "error": err.Error()})
			return
		}

		// NOTA sobre Permisos:
		// Si hay una tabla de permisos (ej: usuario_permisos), aquí
		// se debería hacer una sub-consulta o un JOIN para obtener los permisos
		// del usuario actual y asignarlos a u.Permisos.
		// Por ahora, lo dejaremos como una lista vacía o nula.
		u.Permisos = []string{}

		usuarios = append(usuarios, u)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "Error en la iteración de resultados", "error": err.Error()})
		return
	}

	// 3. Devolver la respuesta al frontend

	c.JSON(http.StatusOK, gin.H{
		"usuarios": usuarios,
		"total":    len(usuarios),
	})
}

// handlers/user_handler.go (Añadir esta función)

// EliminarUsuario realiza una eliminación LÓGICA (desactiva) del usuario.
// Si deseas una eliminación física, cambia la consulta.
func EliminarUsuario(c *gin.Context) {
	// 1. Obtener el ID desde el parámetro de la URL
	idParam := c.Param("id")
	userID, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"msg": "ID de usuario inválido"})
		return
	}

	// 2. Consulta SQL: Eliminar permanentemente el usuario
	query := `DELETE FROM usuarios WHERE id_usuario = $1`

	result, err := db.Exec(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "Error de base de datos al intentar eliminar usuario", "error": err.Error()})
		return
	}

	// Verificar si alguna fila fue afectada (si el usuario existía)
	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"msg": "Usuario no encontrado"})
		return
	}

	// 3. Devolver la respuesta
	c.JSON(http.StatusOK, gin.H{"msg": fmt.Sprintf("Usuario con ID %d eliminado exitosamente.", userID)})
}

// VerificarUsuario verifica si un usuario existe y está activo
func VerificarUsuario(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"valid": false, "error": "ID inválido"})
		return
	}

	var email string
	var activo bool
	var rol string
	var nombreCompleto string

	err = db.QueryRow(
		"SELECT email, activo, rol, nombre_completo FROM usuarios WHERE id_usuario = $1",
		userID,
	).Scan(&email, &activo, &rol, &nombreCompleto)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusOK, gin.H{"valid": false, "reason": "usuario_no_existe"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"valid": false, "error": "Error de base de datos"})
		return
	}

	if !activo {
		c.JSON(http.StatusOK, gin.H{"valid": false, "reason": "usuario_inactivo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":  true,
		"id":     userID,
		"email":  email,
		"nombre": nombreCompleto,
		"rol":    rol,
	})
}

// ObtenerUsuarioActual devuelve la información del usuario logueado
func ObtenerUsuarioActual(c *gin.Context) {
	// Obtener email del query param (viene del frontend)
	email := c.Query("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email requerido"})
		return
	}

	var usuario struct {
		IDUsuario      int    `json:"id_usuario"`
		NombreCompleto string `json:"nombre_completo"`
		Email          string `json:"email"`
		Rol            string `json:"rol"`
		Activo         bool   `json:"activo"`
	}

	query := `
		SELECT id_usuario, nombre_completo, email, rol, activo
		FROM usuarios
		WHERE email = $1 AND activo = true
	`

	err := db.QueryRow(query, email).Scan(
		&usuario.IDUsuario,
		&usuario.NombreCompleto,
		&usuario.Email,
		&usuario.Rol,
		&usuario.Activo,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo usuario"})
		return
	}

	c.JSON(http.StatusOK, usuario)
}

// ActualizarUsuario actualiza los datos de un usuario existente
func ActualizarUsuario(c *gin.Context) {
	userID := c.Param("id")

	var req struct {
		NombreCompleto string `json:"nombre_completo"`
		Rut            string `json:"rut"`
		Email          string `json:"email"`
		Rol            string `json:"rol"`
		Activo         bool   `json:"activo"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"msg": "Datos de entrada inválidos", "error": err.Error()})
		return
	}

	// Actualizar usuario
	query := `
		UPDATE usuarios
		SET nombre_completo = $1, rut = $2, email = $3, rol = $4, activo = $5
		WHERE id_usuario = $6
	`

	result, err := db.Exec(query, req.NombreCompleto, req.Rut, req.Email, req.Rol, req.Activo, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "Error al actualizar usuario", "error": err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"msg": "Usuario no encontrado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"msg": "Usuario actualizado exitosamente"})
}

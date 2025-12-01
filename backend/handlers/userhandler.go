// handlers/user_handler.go

package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	// Asegúrate de que esta ruta sea correcta para tu proyecto
	"fluxo/backend/models"
)

var DB *sql.DB // **IMPORTANTE: Debes inicializar tu conexión DB aquí o pasarla como dependencia.**

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
	err := DB.QueryRow("SELECT id_usuario FROM usuarios WHERE rut = $1 OR email = $2", req.Rut, req.Email).Scan(&existingID)

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
	err = DB.QueryRow(query, req.Rut, req.NombreCompleto, req.Email, passwordHash, req.Rol, time.Now()).Scan(&newID)

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

// ... Otras funciones de manejador (ListarUsuarios, EliminarUsuario)

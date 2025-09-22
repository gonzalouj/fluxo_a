// comentarios.go
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// AddComentarioRequest define la estructura para añadir un comentario.
type AddComentarioRequest struct {
	IDUsuario  int    `json:"id_usuario" binding:"required"` // En un futuro, esto vendría de un token JWT
	Comentario string `json:"comentario" binding:"required"`
}

// UpdateComentarioRequest define la estructura para actualizar un comentario.
type UpdateComentarioRequest struct {
	Comentario string `json:"comentario" binding:"required"`
}

// NuevoComentarioResponse define la estructura del comentario devuelto tras la creación.
type NuevoComentarioResponse struct {
	IDComentario int    `json:"id_comentario"`
	Usuario      string `json:"usuario"`
	Comentario   string `json:"comentario"`
	Fecha        string `json:"fecha"`
}


// AddComentario maneja POST /api/pedidos/:id/comentarios
func AddComentario(c *gin.Context) {
	// 1. Obtener ID del pedido desde la URL
	idPedido, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de pedido inválido"})
		return
	}

	// 2. Parsear el body de la petición
	var req AddComentarioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3. Insertar el comentario en la base de datos y obtenerlo de vuelta
	var nuevoComentario NuevoComentarioResponse
	err = db.QueryRow(`
		WITH inserted_comment AS (
			INSERT INTO comentarios (id_pedido, id_usuario, comentario)
			VALUES ($1, $2, $3)
			RETURNING id_comentario, id_usuario, comentario, fecha_creacion
		)
		SELECT 
			ic.id_comentario,
			u.nombre_completo,
			ic.comentario,
			to_char(ic.fecha_creacion, 'DD-MM-YYYY HH24:MI')
		FROM inserted_comment ic
		JOIN usuarios u ON u.id_usuario = ic.id_usuario`,
		idPedido, req.IDUsuario, req.Comentario).Scan(
		&nuevoComentario.IDComentario,
		&nuevoComentario.Usuario,
		&nuevoComentario.Comentario,
		&nuevoComentario.Fecha,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar y recuperar el comentario"})
		return
	}

	// 4. Responder con éxito y el nuevo comentario
	c.JSON(http.StatusCreated, gin.H{
		"message":    "Comentario añadido exitosamente",
		"comentario": nuevoComentario,
	})
}

// UpdateComentario maneja PATCH /api/comentarios/:id
func UpdateComentario(c *gin.Context) {
	idComentario, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de comentario inválido"})
		return
	}

	var req UpdateComentarioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := db.Exec(`UPDATE comentarios SET comentario = $1 WHERE id_comentario = $2`, req.Comentario, idComentario)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar el comentario"})
		return
	}
	
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comentario no encontrado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comentario actualizado exitosamente"})
}

// DeleteComentario maneja DELETE /api/comentarios/:id
func DeleteComentario(c *gin.Context) {
	idComentario, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de comentario inválido"})
		return
	}

	res, err := db.Exec(`DELETE FROM comentarios WHERE id_comentario = $1`, idComentario)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar el comentario"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comentario no encontrado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comentario eliminado exitosamente"})
}

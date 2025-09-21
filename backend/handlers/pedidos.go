// pedidos.go
package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"fluxo/backend/models"
	"github.com/gin-gonic/gin"
)

// Mantenemos la variable global para la base de datos
var db *sql.DB

// ✅ CAMBIO: Reemplazamos InitDB por SetDB.
// Esta función permite que 'main.go' nos "entregue" la conexión a la base de datos.
func SetDB(database *sql.DB) {
	db = database
}

// CrearPedido maneja POST /api/pedidos
func CrearPedido(c *gin.Context) {
	var req models.PedidoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Iniciar transacción para crear pedido + producto + relación
	tx, err := db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al iniciar transacción"})
		return
	}
	defer tx.Rollback()

	// 1. Crear o buscar producto
	var productoID int
	err = tx.QueryRow(`
		INSERT INTO productos (nombre, precio_unitario) 
		VALUES ($1, $2) 
		ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
		RETURNING id_producto`,
		req.Producto, 10.0).Scan(&productoID) // Precio por defecto

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear producto"})
		return
	}

	// 2. Crear pedido
	var pedidoID int
	var emailCliente *string
	if req.Email != "" {
		emailCliente = &req.Email
	}

	err = tx.QueryRow(`
		INSERT INTO pedidos (nombre_cliente, email_cliente, fecha_entrega, detalles_pedido, estado) 
		VALUES ($1, $2, $3, $4, 'Pendiente') 
		RETURNING id_pedido`,
		req.Cliente, emailCliente, req.Fecha, req.Etiquetas).Scan(&pedidoID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear pedido"})
		return
	}

	// 3. Crear relación pedido-producto
	_, err = tx.Exec(`
		INSERT INTO pedido_productos (id_pedido, id_producto, cantidad, precio_unitario_congelado) 
		VALUES ($1, $2, $3, $4)`,
		pedidoID, productoID, req.Cantidad, 10.0)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al asociar producto con pedido"})
		return
	}

	// Confirmar transacción
	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al confirmar transacción"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Pedido creado exitosamente",
		"pedido_id": pedidoID,
	})
}

// ListarPedidos maneja GET /api/pedidos
func ListarPedidos(c *gin.Context) {
	// Estructuras de respuesta que incluyen productos
	type ProductoResumen struct {
		Producto       string  `json:"producto"`
		Cantidad       int     `json:"cantidad"`
		PrecioUnitario float64 `json:"precio_unitario"`
	}

	type PedidoConProductos struct {
		ID             int               `json:"id_pedido"`
		NombreCliente  string            `json:"nombre_cliente"`
		EmailCliente   *string           `json:"email_cliente,omitempty"`
		TelefonoCliente *string          `json:"telefono_cliente,omitempty"` 
		FechaEntrega   string            `json:"fecha_entrega"`
		Estado         string            `json:"estado"`
		FechaCreacion  sql.NullTime      `json:"fecha_creacion,omitempty"`
		DetallesPedido *string           `json:"detalles_pedido,omitempty"` // Para las etiquetas
		Productos      []ProductoResumen `json:"productos"`
		Comentarios    json.RawMessage   `json:"comentarios"` // Para los comentarios
	}

	query := `
		SELECT 
		  p.id_pedido,
		  p.nombre_cliente,
		  p.email_cliente,
		  p.telefono_cliente, -- <-- AÑADIDO
		  to_char(p.fecha_entrega, 'YYYY-MM-DD') AS fecha_entrega,
		  p.estado,
		  p.fecha_creacion,
		  p.detalles_pedido,
		  COALESCE((
		    SELECT json_agg(json_build_object(
		      'producto', pr.nombre,
		      'cantidad', pp.cantidad,
		      'precio_unitario', pp.precio_unitario_congelado
		    ))
		    FROM pedido_productos pp
		    JOIN productos pr ON pr.id_producto = pp.id_producto
		    WHERE pp.id_pedido = p.id_pedido
		  ), '[]') AS productos,
		  COALESCE((
            SELECT json_agg(json_build_object(
                'usuario', u.nombre_completo,
                'comentario', cm.comentario,
                'fecha', to_char(cm.fecha_creacion, 'DD-MM-YYYY HH24:MI')
            ))
            FROM comentarios cm
            JOIN usuarios u ON u.id_usuario = cm.id_usuario
            WHERE cm.id_pedido = p.id_pedido
          ), '[]') AS comentarios
		FROM pedidos p
		ORDER BY
		  CASE p.estado
		    WHEN 'Pendiente' THEN 1
		    WHEN 'Listo' THEN 2
		    WHEN 'Cancelado' THEN 3
		    ELSE 4
		  END,
		  CASE WHEN p.estado = 'Pendiente' THEN p.fecha_entrega END ASC,
		  CASE WHEN p.estado IN ('Listo','Cancelado') THEN p.fecha_entrega END DESC`

	rows, err := db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pedidos"})
		return
	}
	defer rows.Close()

	var pedidos []PedidoConProductos
	for rows.Next() {
		var p PedidoConProductos
		var productosRaw []byte
		err := rows.Scan(
			&p.ID,
			&p.NombreCliente,
			&p.EmailCliente,
			&p.TelefonoCliente,
			&p.FechaEntrega,
			&p.Estado,
			&p.FechaCreacion,
			&p.DetallesPedido, // <-- Nuevo
			&productosRaw,
			&p.Comentarios,   // <-- Nuevo
		)
		if err != nil {
			continue
		}
		if err := json.Unmarshal(productosRaw, &p.Productos); err != nil {
			p.Productos = []ProductoResumen{}
		}
		pedidos = append(pedidos, p)
	}

	c.JSON(http.StatusOK, gin.H{"pedidos": pedidos})
}

// ObtenerPedidoPorID maneja GET /api/pedidos/:id
func ObtenerPedidoPorID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var p models.Pedido
	err = db.QueryRow(`
		SELECT id_pedido, nombre_cliente, email_cliente, fecha_entrega, estado, fecha_creacion
		FROM pedidos WHERE id_pedido = $1`, id).Scan(
		&p.ID, &p.NombreCliente, &p.EmailCliente, &p.FechaEntrega, &p.Estado, &p.FechaCreacion)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pedido no encontrado"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pedido"})
		return
	}

	c.JSON(http.StatusOK, p)
}

// ActualizarEstadoPedido maneja PATCH /api/pedidos/:id/estado
func ActualizarEstadoPedido(c *gin.Context) {
	// Obtener ID del pedido desde la URL
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Estructura para recibir el nuevo estado
	var req struct {
		Estado string `json:"estado" binding:"required"`
	}

	// Parsear el body de la petición
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Estado requerido"})
		return
	}

	// Validar que el estado sea válido
	estadosValidos := map[string]bool{
		"Pendiente": true,
		"Listo":     true,
		"Cancelado": true,
	}

	if !estadosValidos[req.Estado] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Estado inválido. Use: Pendiente, Listo o Cancelado"})
		return
	}

	// Verificar que el pedido existe y obtener su estado actual
	var estadoActual string
	err = db.QueryRow("SELECT estado FROM pedidos WHERE id_pedido = $1", id).Scan(&estadoActual)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pedido no encontrado"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al verificar pedido"})
		return
	}

	// Validar transiciones de estado permitidas
	// Solo se puede cambiar estado si está Pendiente
	if estadoActual != "Pendiente" && req.Estado != estadoActual {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No se puede cambiar el estado de un pedido que ya está " + estadoActual,
		})
		return
	}

	// Actualizar el estado en la base de datos
	_, err = db.Exec("UPDATE pedidos SET estado = $1 WHERE id_pedido = $2", req.Estado, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar estado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Estado actualizado exitosamente",
		"pedido_id": id,
		"nuevo_estado": req.Estado,
	})
}
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

func CrearPedido(c *gin.Context) {
	var req models.PedidoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx, err := db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al iniciar transacción"})
		return
	}
	defer tx.Rollback()

	var emailCliente *string
	if req.Email != "" {
		emailCliente = &req.Email
	}

	var telefonoCliente *string
	if req.Telefono != "" {
		telefonoCliente = &req.Telefono
	}

	var detallesPedido *string
	if req.Etiquetas != "" {
		detallesPedido = &req.Etiquetas
	}

	var pedidoID int
	err = tx.QueryRow(`
		INSERT INTO pedidos (nombre_cliente, email_cliente, telefono_cliente, fecha_entrega, detalles_pedido, estado) 
		VALUES ($1, $2, $3, $4, $5, 'Pendiente') 
		RETURNING id_pedido`,
		req.Cliente, emailCliente, telefonoCliente, req.Fecha, detallesPedido).Scan(&pedidoID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear pedido: " + err.Error()})
		return
	}

	for _, prod := range req.Productos {
		_, err := tx.Exec(`
			INSERT INTO pedido_productos (id_pedido, id_producto, cantidad, precio_unitario_congelado) 
			SELECT $1, $2, $3, COALESCE(p.precio_unitario, 0.00) 
			FROM productos p 
			WHERE p.id_producto = $2`,
			pedidoID, prod.IDProducto, prod.Cantidad)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al asociar producto con pedido: " + err.Error()})
			return
		}
	}
    // Si hay un comentario inicial, lo agregamos
	if req.Comentarios != "" {
		// Asumimos un id_usuario = 1 por ahora, esto debería venir del contexto de autenticación
		_, err := tx.Exec(`
            INSERT INTO comentarios (id_pedido, id_usuario, comentario)
            VALUES ($1, 1, $2)`,
			pedidoID, req.Comentarios)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al agregar comentario inicial: " + err.Error()})
			return
		}
	}

	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al confirmar transacción"})
		return
	}

	// Enviar notificación push a todos los usuarios
	SendPushToAllUsers(
		"🛒 Nuevo Pedido",
		"Pedido #"+strconv.Itoa(pedidoID)+" de "+req.Cliente,
		"/pedidos.html",
	)

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Pedido creado exitosamente",
		"pedido_id": pedidoID,
	})
}

// ListarPedidos maneja GET /api/pedidos
func ListarPedidos(c *gin.Context) {
	type ProductoResumen struct {
		IDProducto     int     `json:"id_producto"`
		Producto       string  `json:"producto"`
		Cantidad       int     `json:"cantidad"`
		PrecioUnitario float64 `json:"precio_unitario"`
	}

    type ComentarioResumen struct {
		IDComentario int    `json:"id_comentario"`
		Usuario      string `json:"usuario"`
		Comentario   string `json:"comentario"`
		Fecha        string `json:"fecha"`
	}

	type PedidoConProductos struct {
		ID              int                 `json:"id_pedido"`
		NombreCliente   string              `json:"nombre_cliente"`
		EmailCliente    *string             `json:"email_cliente,omitempty"`
		TelefonoCliente *string             `json:"telefono_cliente,omitempty"`
		FechaEntrega    string              `json:"fecha_entrega"`
		Estado          string              `json:"estado"`
		FechaCreacion   sql.NullTime        `json:"fecha_creacion,omitempty"`
		DetallesPedido  *string             `json:"detalles_pedido,omitempty"`
		Productos       []ProductoResumen   `json:"productos"`
		Comentarios     []ComentarioResumen `json:"comentarios"`
	}

	query := `
		SELECT 
		  p.id_pedido,
		  p.nombre_cliente,
		  p.email_cliente,
		  p.telefono_cliente,
		  to_char(p.fecha_entrega, 'YYYY-MM-DD') AS fecha_entrega,
		  p.estado,
		  p.fecha_creacion,
		  p.detalles_pedido,
		  COALESCE((
		    SELECT json_agg(json_build_object(
		      'id_producto', pr.id_producto,
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
                'id_comentario', cm.id_comentario,
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
		    WHEN 'Entregado' THEN 3
		    WHEN 'Cancelado' THEN 4
		    ELSE 5
		  END,
		  CASE WHEN p.estado = 'Pendiente' THEN p.fecha_entrega END ASC,
		  CASE WHEN p.estado IN ('Listo','Entregado','Cancelado') THEN p.fecha_creacion END DESC`

	rows, err := db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pedidos"})
		return
	}
	defer rows.Close()

	var pedidos []PedidoConProductos
	for rows.Next() {
		var p PedidoConProductos
		var productosRaw, comentariosRaw []byte
		err := rows.Scan(
			&p.ID,
			&p.NombreCliente,
			&p.EmailCliente,
			&p.TelefonoCliente,
			&p.FechaEntrega,
			&p.Estado,
			&p.FechaCreacion,
			&p.DetallesPedido,
			&productosRaw,
			&comentariosRaw,
		)
		if err != nil {
			continue
		}
		if err := json.Unmarshal(productosRaw, &p.Productos); err != nil {
			p.Productos = []ProductoResumen{}
		}
		if err := json.Unmarshal(comentariosRaw, &p.Comentarios); err != nil {
			p.Comentarios = []ComentarioResumen{}
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

func ActualizarPedido(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de pedido inválido"})
		return
	}

	var req models.PedidoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx, err := db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al iniciar transacción"})
		return
	}
	defer tx.Rollback()

	var emailCliente *string
	if req.Email != "" {
		emailCliente = &req.Email
	}

	var telefonoCliente *string
	if req.Telefono != "" {
		telefonoCliente = &req.Telefono
	}
    var detallesPedido *string
	if req.Etiquetas != "" {
		detallesPedido = &req.Etiquetas
	}

	// 1. Actualizar datos principales del pedido
	_, err = tx.Exec(`
        UPDATE pedidos
        SET nombre_cliente = $1, email_cliente = $2, telefono_cliente = $3, fecha_entrega = $4, detalles_pedido = $5
        WHERE id_pedido = $6`,
		req.Cliente, emailCliente, telefonoCliente, req.Fecha, detallesPedido, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar el pedido: " + err.Error()})
		return
	}

	// 2. Borrar productos antiguos asociados al pedido
	_, err = tx.Exec(`DELETE FROM pedido_productos WHERE id_pedido = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al limpiar productos antiguos del pedido: " + err.Error()})
		return
	}

	// 3. Insertar nuevos productos
	for _, prod := range req.Productos {
		_, err := tx.Exec(`
            INSERT INTO pedido_productos (id_pedido, id_producto, cantidad, precio_unitario_congelado)
            SELECT $1, $2, $3, COALESCE(p.precio_unitario, 0.00)
            FROM productos p
            WHERE p.id_producto = $2`,
			id, prod.IDProducto, prod.Cantidad)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al asociar nuevos productos al pedido: " + err.Error()})
			return
		}
	}
    
    // 4. Manejar el comentario inicial
    // Busca si ya existe un primer comentario para este pedido
    var comentarioID int
    err = tx.QueryRow(`
        SELECT id_comentario FROM comentarios WHERE id_pedido = $1 ORDER BY fecha_creacion ASC LIMIT 1
    `, id).Scan(&comentarioID)

    if err == sql.ErrNoRows {
        // No hay comentarios, si el request trae uno, se inserta
        if req.Comentarios != "" {
            _, err = tx.Exec(`
                INSERT INTO comentarios (id_pedido, id_usuario, comentario) VALUES ($1, 1, $2)
            `, id, req.Comentarios)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear comentario inicial: " + err.Error()})
                return
            }
        }
    } else if err != nil {
        // Error real en la consulta
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar comentario: " + err.Error()})
        return
    } else {
        // Ya existe un comentario inicial
        if req.Comentarios != "" {
            // Si el request trae comentario, se actualiza el existente
            _, err = tx.Exec(`
                UPDATE comentarios SET comentario = $1 WHERE id_comentario = $2
            `, req.Comentarios, comentarioID)
             if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar comentario: " + err.Error()})
                return
            }
        } else {
            // Si el request NO trae comentario, NO eliminamos el existente
            // Los comentarios se manejan por separado a través de la API de comentarios
            // No hacemos nada aquí para preservar los comentarios existentes
        }
    }


	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al confirmar la transacción"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pedido actualizado exitosamente"})
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
		"Pendiente":  true,
		"Listo":      true,
		"Entregado":  true,
		"Cancelado":  true,
	}

	if !estadosValidos[req.Estado] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Estado inválido. Use: Pendiente, Listo, Entregado o Cancelado"})
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
	transicionesValidas := map[string]map[string]bool{
		"Pendiente":  {"Listo": true, "Cancelado": true},
		"Listo":      {"Entregado": true, "Cancelado": true},
		"Entregado":  {},                        // Estado final, no se puede cambiar
		"Cancelado":  {"Pendiente": true},       // Se puede reactivar a Pendiente
	}

	if !transicionesValidas[estadoActual][req.Estado] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Transición de estado no permitida: " + estadoActual + " → " + req.Estado,
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
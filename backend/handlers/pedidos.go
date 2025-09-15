// pedidos.go
// Handlers para gestión de pedidos
package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"fluxo/backend/config"
	"fluxo/backend/models"

	"github.com/gin-gonic/gin"
)

var db *sql.DB

// InitDB inicializa la conexión global a la base de datos
func InitDB() {
	var err error
	db, err = config.ConnectDB()
	if err != nil {
		log.Fatal("No se pudo conectar a la base de datos:", err)
	}
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
	rows, err := db.Query(`
		SELECT p.id_pedido, p.nombre_cliente, p.email_cliente, p.fecha_entrega, 
		       p.estado, p.fecha_creacion
		FROM pedidos p 
		ORDER BY p.fecha_creacion DESC`)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pedidos"})
		return
	}
	defer rows.Close()

	var pedidos []models.Pedido
	for rows.Next() {
		var p models.Pedido
		err := rows.Scan(&p.ID, &p.NombreCliente, &p.EmailCliente, 
						 &p.FechaEntrega, &p.Estado, &p.FechaCreacion)
		if err != nil {
			continue
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
// user.go
// Modelos de datos para usuarios, pedidos y productos
package models

import "time"

type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// Pedido representa un pedido del frontend
type Pedido struct {
	ID            int       `json:"id_pedido"`
	NombreCliente string    `json:"nombre_cliente"`
	EmailCliente  *string   `json:"email_cliente,omitempty"`
	FechaEntrega  string    `json:"fecha_entrega"`
	Estado        string    `json:"estado"`
	FechaCreacion time.Time `json:"fecha_creacion"`
}

// PedidoRequest representa la estructura del formulario frontend
type PedidoRequest struct {
	Cliente    string             `json:"cliente" binding:"required"`
	Fecha      string             `json:"fecha" binding:"required"`
	Email      string             `json:"email"`
	Telefono   string             `json:"telefono"`
	Etiquetas  string             `json:"etiquetas"`
	Comentarios string            `json:"comentarios"`
	Productos  []ProductoEnPedido `json:"productos" binding:"required,min=1"`
}

// ProductoEnPedido representa un producto dentro de un pedido
type ProductoEnPedido struct {
	IDProducto int `json:"id_producto" binding:"required"`
	Cantidad   int `json:"cantidad" binding:"required,min=1"`
}


// Producto representa un producto del catálogo
type Producto struct {
	ID             int     `json:"id_producto"`
	Codigo         *string `json:"codigo,omitempty"`
	Nombre         string  `json:"nombre"`
	PrecioUnitario float64 `json:"precio_unitario"`
	Stock          int     `json:"stock"`
	FotoURL        *string `json:"foto_url,omitempty"`
	IDCategoria    *int    `json:"id_categoria,omitempty"`
}

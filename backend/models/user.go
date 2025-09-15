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
	Producto  string `json:"producto" binding:"required"`
	Cantidad  int    `json:"cantidad" binding:"required,min=1"`
	Cliente   string `json:"cliente" binding:"required"`
	Fecha     string `json:"fecha" binding:"required"`
	Email     string `json:"email"`
	Etiquetas string `json:"etiquetas"`
}

// Producto representa un producto del catálogo
type Producto struct {
	ID             int     `json:"id_producto"`
	Nombre         string  `json:"nombre"`
	Descripcion    *string `json:"descripcion,omitempty"`
	PrecioUnitario float64 `json:"precio_unitario"`
}

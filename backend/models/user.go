// user.go
// Modelos de datos para usuarios, pedidos y productos
package models

import "time"

// --- Modelos para el Módulo de Usuarios ---

// NewUserRequest representa el JSON de entrada para crear un nuevo usuario
type NewUserRequest struct {
	NombreCompleto string   `json:"nombre_completo" binding:"required"`
	Rut            string   `json:"rut" binding:"required"`
	Email          string   `json:"email" binding:"required,email"`
	Password       string   `json:"password" binding:"required,min=6"` // Mínimo de 6 caracteres, por ejemplo
	Rol            string   `json:"rol" binding:"required,oneof=administrador trabajador"`
	Permisos       []string `json:"permisos"` // Lista de permisos (ej: ["pedidos", "usuarios"])
}

// UsuarioDB representa la estructura del usuario tal como está en la DB
type UsuarioDB struct {
	IDUsuario      int       `json:"id_usuario"`
	Rut            string    `json:"rut"`
	NombreCompleto string    `json:"nombre_completo"`
	Email          string    `json:"email"`
	PasswordHash   string    `json:"password_hash"`
	Rol            string    `json:"rol"`
	Activo         bool      `json:"activo"`
	FechaCreacion  time.Time `json:"fecha_creacion"`
}

// UserResponse representa la estructura de un usuario al enviarse al frontend (sin password_hash)
type UserResponse struct {
	IDUsuario      int      `json:"id_usuario"`
	Rut            string   `json:"rut"`
	NombreCompleto string   `json:"nombre_completo"`
	Email          string   `json:"email"`
	Rol            string   `json:"rol"`
	Activo         bool     `json:"activo"`
	Permisos       []string `json:"permisos"` // Se necesitará una lógica para cargar esto
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
	Cliente     string             `json:"cliente" binding:"required"`
	Fecha       string             `json:"fecha" binding:"required"`
	Email       string             `json:"email"`
	Telefono    string             `json:"telefono"`
	Etiquetas   string             `json:"etiquetas"`
	Comentarios string             `json:"comentarios"`
	Productos   []ProductoEnPedido `json:"productos" binding:"required,min=1"`
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

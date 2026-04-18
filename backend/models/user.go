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
	Password       string   `json:"password" binding:"required,min=6"`
	Rol            string   `json:"rol" binding:"required,oneof=Admin Trabajador"`
	Permisos       []string `json:"permisos"`
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
	ID                  int      `json:"id_producto"`
	Codigo              *string  `json:"codigo,omitempty"`
	Nombre              string   `json:"nombre"`
	Descripcion         *string  `json:"descripcion,omitempty"`
	IDCategoria         *int     `json:"id_categoria,omitempty"`
	CategoriaNombre     *string  `json:"categoria_nombre,omitempty"`
	PrecioUnitario      float64  `json:"precio_unitario"`
	LargoCm             *float64 `json:"largo_cm,omitempty"`
	AnchoCm             *float64 `json:"ancho_cm,omitempty"`
	AltoCm              *float64 `json:"alto_cm,omitempty"`
	DiametroCm          *float64 `json:"diametro_cm,omitempty"`
	FondoCm             *float64 `json:"fondo_cm,omitempty"`
	AlturaAsientoCm     *float64 `json:"altura_asiento_cm,omitempty"`
	AlturaCubiertaCm    *float64 `json:"altura_cubierta_cm,omitempty"`
	PesoKg              *float64 `json:"peso_kg,omitempty"`
	Material            *string  `json:"material,omitempty"`
	Moneda              string   `json:"moneda"`
	IncluyeIVA          bool     `json:"incluye_iva"`
	RequierePresupuesto bool     `json:"requiere_presupuesto"`
	UnidadVenta         string   `json:"unidad_venta"`
	Stock               int      `json:"stock"`
	FotoPrincipalURL    *string  `json:"foto_principal_url,omitempty"`
	NotasEspeciales     *string  `json:"notas_especiales,omitempty"`
	EsTemporal          *bool    `json:"es_temporal,omitempty"`
	IDPedidoOrigen      *int     `json:"id_pedido_origen,omitempty"`
	FotoURL             *string  `json:"foto_url,omitempty"` // Mantener por compatibilidad
}

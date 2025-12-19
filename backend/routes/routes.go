// routes.go
package routes

import (
	"fluxo/backend/auth"
	"fluxo/backend/handlers"
	"fluxo/backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Aplicar middleware CORS
	r.Use(middleware.CORSMiddleware())

	// Registrar rutas en un grupo (para /api y para raíz si Caddy hace strip)
	registerAPIRoutes(r.Group("/api"))
	registerAPIRoutes(r.Group("/")) // Para cuando Caddy hace strip del /api

	return r
}

func registerAPIRoutes(api *gin.RouterGroup) {
	api.GET("/hello", handlers.HelloHandler)
	api.GET("/productos", handlers.ListarProductos)
	api.GET("/productos/con-temporales", handlers.ListarProductosConTemporales)
	api.GET("/productos/:id", handlers.ObtenerProducto)
	api.POST("/productos", handlers.CrearProducto)
	api.PATCH("/productos/:id", handlers.ActualizarProducto)
	api.PUT("/productos/:id", handlers.ActualizarProductoCompleto)
	api.DELETE("/productos/:id", handlers.EliminarProducto)
	api.GET("/categorias", handlers.ListarCategorias)
	api.POST("/categorias", handlers.CrearCategoria)

	pedidos := api.Group("/pedidos")
	{
		pedidos.POST("", handlers.CrearPedido)
		pedidos.GET("", handlers.ListarPedidos)
		pedidos.GET("/:id", handlers.ObtenerPedidoPorID)
		pedidos.PATCH("/:id", handlers.ActualizarPedido)
		pedidos.PATCH("/:id/estado", handlers.ActualizarEstadoPedido)
		pedidos.POST("/:id/comentarios", handlers.AddComentario)
	}

	comentarios := api.Group("/comentarios")
	{
		comentarios.PATCH("/:id", handlers.UpdateComentario)
		comentarios.DELETE("/:id", handlers.DeleteComentario)
	}

	usuarios := api.Group("/usuarios")
	{
		usuarios.GET("", handlers.ListarUsuarios)
		usuarios.POST("", handlers.CrearUsuario)
		usuarios.PUT("/:id", handlers.ActualizarUsuario)
		usuarios.DELETE("/:id", handlers.EliminarUsuario)
		usuarios.GET("/verificar/:id", handlers.VerificarUsuario)
	}

	// Rutas de notificaciones push
	push := api.Group("/push")
	{
		push.GET("/vapid-key", handlers.GetVAPIDPublicKey)
		push.POST("/subscribe", handlers.SubscribePush)
		push.POST("/unsubscribe", handlers.UnsubscribePush)
	}

	// Rutas de autenticación Google
	authGroup := api.Group("/auth")
	{
		authGroup.GET("/google/login", auth.GoogleLogin)
		authGroup.GET("/google/callback", auth.GoogleCallback)
		authGroup.POST("/logout", auth.Logout)
		authGroup.GET("/me", handlers.ObtenerUsuarioActual)
	}
}

// routes.go
// Configura las rutas del servidor
package routes

import (
	"fluxo/backend/handlers"
	"fluxo/backend/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRouter inicializa el router y las rutas
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Inicializar conexión a base de datos
	handlers.InitDB()

	// Aplicar middleware CORS
	r.Use(middleware.CORSMiddleware())

	// Ruta de prueba
	r.GET("/api/hello", handlers.HelloHandler)

	// Rutas de pedidos
	r.POST("/api/pedidos", handlers.CrearPedido)
	r.GET("/api/pedidos", handlers.ListarPedidos)
	r.GET("/api/pedidos/:id", handlers.ObtenerPedidoPorID)

	return r
}

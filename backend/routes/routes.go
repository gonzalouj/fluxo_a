// routes.go
// Configura las rutas del servidor
package routes

import (
	"fluxo/backend/handlers"
	"fluxo/backend/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRouter inicializa el router y las rutas.
// Su única responsabilidad ahora es definir los endpoints.
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// ✅ CAMBIO: Eliminamos la línea "handlers.InitDB()" de aquí.
	// La inicialización de la base de datos ahora la hace main.go, que es el lugar correcto.

	// Aplicar middleware CORS
	r.Use(middleware.CORSMiddleware())

	// ✅ MEJORA: Organizamos las rutas bajo un grupo /api para mantener el código ordenado.
	api := r.Group("/api")
	{
		api.GET("/hello", handlers.HelloHandler)

		// Rutas de pedidos agrupadas
		pedidos := api.Group("/pedidos")
		{
			pedidos.POST("", handlers.CrearPedido)
			pedidos.GET("", handlers.ListarPedidos)
			pedidos.GET("/:id", handlers.ObtenerPedidoPorID)
		}
	}

	return r
}
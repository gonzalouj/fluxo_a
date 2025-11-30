// routes.go
package routes

import (
	"fluxo/backend/handlers"
	"fluxo/backend/middleware"
	"os"
	"path/filepath"

	//"strings"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Aplicar middleware CORS
	r.Use(middleware.CORSMiddleware())

	// --- RUTAS DE LA API ---
	// Se definen primero para que tengan la máxima prioridad.
	api := r.Group("/api")
	{
		api.GET("/hello", handlers.HelloHandler)
		api.GET("/productos", handlers.ListarProductos)
		api.GET("/productos/con-temporales", handlers.ListarProductosConTemporales)
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
		/*usuarios := api.Group("/usuarios")
		{
			usuarios.GET("", handlers.ListarUsuarios)
			usuarios.POST("", handlers.CrearUsuario)
			usuarios.DELETE("/:id", handlers.EliminarUsuario)
		}*/
	}

	// Usamos un manejador "NoRoute" para atrapar cualquier petición
	// que no coincida con una ruta de la API.
	r.NoRoute(func(c *gin.Context) {
		// Obtenemos la ruta solicitada por el navegador
		path := c.Request.URL.Path

		// Si la ruta es la raíz "/", servimos index.html
		if path == "/" {
			c.File("../Frontend/index.html")
			return
		}

		// Construimos la ruta completa al archivo en la carpeta Frontend
		// filepath.Join es una forma segura de unir rutas de directorios
		filePath := filepath.Join("../Frontend", path)

		// Verificamos si el archivo solicitado existe
		if _, err := os.Stat(filePath); err == nil {
			// Si el archivo existe (ej: /pedidos.js, /index.html), lo servimos
			c.File(filePath)
		} else {
			// Si el archivo no existe, servimos la página 404
			c.File("../Frontend/404.html")
		}
	})

	return r
}

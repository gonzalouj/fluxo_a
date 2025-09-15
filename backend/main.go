// main.go
// Punto de entrada del backend en Go
// Inicializa el servidor, rutas y middlewares
package main

import (
	"fluxo/backend/config"
	"fluxo/backend/routes"
)

func main() {
	// Configurar puerto del servidor
	port := config.GetEnv("PORT", "8080")

	// Configurar router con Gin
	router := routes.SetupRouter()

	// Iniciar servidor
	router.Run(":" + port)
}

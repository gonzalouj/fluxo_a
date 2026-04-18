// main.go
package main

import (
	"fluxo/backend/auth"
	"fluxo/backend/config"
	"fluxo/backend/handlers"
	"fluxo/backend/routes"
	"log" // Importamos 'log' para manejar errores fatales

	"github.com/gin-gonic/gin" // Importamos 'gin' para configurar el modo
)

func main() {
	// ✅ PASO 1: 'main' crea la conexión a la base de datos directamente.
	database, err := config.ConnectDB()
	if err != nil {
		// Si la conexión falla, la aplicación se detiene con un error claro.
		log.Fatalf("Error fatal: no se pudo conectar a la base de datos: %v", err)
	}

	// ✅ PASO 2: 'main' le entrega la conexión a los paquetes que la necesitan.
	handlers.SetDB(database)
	auth.DB = database

	// Configurar el modo de Gin desde la variable de entorno.
	gin.SetMode(config.GetEnv("GIN_MODE", "debug"))
	
	// Configurar el router con Gin.
	router := routes.SetupRouter()
	
	// Obtener el puerto desde la variable de entorno.
	port := config.GetEnv("PORT", "8080")
	
	log.Printf("🚀 Servidor corriendo en ----- > http://localhost:%s/", port)
	
	router.Run(":" + port)
}
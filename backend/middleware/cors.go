// cors.go
// Middleware para habilitar CORS con Gin de forma segura
package middleware

import (
	"fluxo/backend/config" // Importamos tu paquete config para usar GetEnv
	"github.com/gin-gonic/gin"
)

// CORSMiddleware agrega los headers necesarios para CORS
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// ✅ 1. Lee el dominio permitido desde las variables de entorno.
		// Si no se define, vuelve a un valor por defecto seguro para desarrollo.
		allowedOrigin := config.GetEnv("CORS_ALLOWED_ORIGIN", "http://127.0.0.1:5500")

		// ✅ 2. Usa esa variable para el header en lugar de "*".
		// Esto asegura que solo tu frontend pueda conectarse en producción.
		c.Header("Access-Control-Allow-Origin", allowedOrigin)
		
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true") // Es buena práctica añadir esto

		// Si es una petición OPTIONS (pre-vuelo), responde y termina.
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
// auth.go
// Middleware de autenticación y autorización
package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireAdmin middleware que verifica que el usuario sea Admin
// Este es un middleware básico que verifica el header X-User-Role
// En producción, deberías usar JWT o sesiones para mayor seguridad
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetHeader("X-User-Role")
		
		// Si no hay rol o no es Admin, denegar acceso
		if userRole != "Admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Acceso denegado. Solo administradores pueden acceder a este recurso.",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// RequireAuth middleware que verifica que haya un usuario autenticado
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetHeader("X-User-Role")
		
		// Si no hay rol, denegar acceso
		if userRole == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Autenticación requerida.",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

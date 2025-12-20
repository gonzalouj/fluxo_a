package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Logout maneja POST /api/auth/logout
// Limpia todas las cookies y sesiones del usuario
func Logout(c *gin.Context) {
	// Limpiar todas las cookies relacionadas con la autenticación
	c.SetCookie("_oauth_state", "", -1, "/", "", false, true)
	c.SetCookie("session", "", -1, "/", "", false, true)
	c.SetCookie("token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Sesión cerrada correctamente",
	})
}

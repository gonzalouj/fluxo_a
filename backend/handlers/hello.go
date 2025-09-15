// hello.go
// Handler para el endpoint de prueba /api/hello
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type HelloResponse struct {
	Message string `json:"message"`
}

// HelloHandler responde con un mensaje de bienvenida
func HelloHandler(c *gin.Context) {
	response := HelloResponse{Message: "¡Hola desde el backend en Go con Gin!"}
	c.JSON(http.StatusOK, response)
}

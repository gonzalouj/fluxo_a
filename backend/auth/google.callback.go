package auth

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
)

// Estructura para leer datos básicos del usuario de Google
type GoogleUserInfo struct {
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

// GET /api/auth/google/callback
func GoogleCallback(c *gin.Context) {
	// Google nos manda estos parámetros
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "code missing"})
		return
	}

	// En una app real validarías que "state" coincida con el que enviaste
	log.Println("GoogleCallback: state =", state)

	// Intercambiar el "code" por un token de acceso
	token, err := GoogleOAuthConfig.Exchange(c.Request.Context(), code)
	if err != nil {
		log.Println("Error intercambiando code por token:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token exchange failed"})
		return
	}

	// Obtener información del usuario (email, nombre, etc.)
	userInfo, err := fetchGoogleUserInfo(token.AccessToken)
	if err != nil {
		log.Println("Error obteniendo userinfo de Google:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get userinfo"})
		return
	}

	log.Printf("Usuario Google logeado: email=%s, name=%s\n", userInfo.Email, userInfo.Name)

	// 🧠 Aquí es donde en el futuro:
	// - Buscarías/crearías el usuario en la base de datos
	// - Crearías una sesión (cookie / JWT) con su ID o email

	// Por ahora, para no meternos en sesiones reales,
	// lo redirigimos al frontend (index) y le pasamos el email por querystring.
	redirectURL := "http://localhost:3006/index.html?google_email=" + url.QueryEscape(userInfo.Email)
	c.Redirect(http.StatusFound, redirectURL)
}

// Llamar a la API de Google para obtener datos del usuario
func fetchGoogleUserInfo(accessToken string) (*GoogleUserInfo, error) {
	endpoint := "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + url.QueryEscape(accessToken)

	resp, err := http.Get(endpoint)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}

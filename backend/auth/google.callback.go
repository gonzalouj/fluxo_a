package auth

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
)

// DB referencia a la base de datos (se inicializa desde main)
var DB *sql.DB

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
		// Limpiar cualquier cookie OAuth residual
		c.SetCookie("_oauth_state", "", -1, "/", "", false, true)
		redirectURL := BaseURL + "/login.html?error=no_code"
		c.Redirect(http.StatusFound, redirectURL)
		return
	}

	// En una app real validarías que "state" coincida con el que enviaste
	log.Println("GoogleCallback: state =", state)

	// Intercambiar el "code" por un token de acceso
	token, err := GoogleOAuthConfig.Exchange(c.Request.Context(), code)
	if err != nil {
		log.Println("Error intercambiando code por token:", err)
		// Limpiar cookies OAuth antes de redirigir
		c.SetCookie("_oauth_state", "", -1, "/", "", false, true)
		redirectURL := BaseURL + "/login.html?error=exchange_failed"
		c.Redirect(http.StatusFound, redirectURL)
		return
	}

	// Obtener información del usuario (email, nombre, etc.)
	userInfo, err := fetchGoogleUserInfo(token.AccessToken)
	if err != nil {
		log.Println("Error obteniendo userinfo de Google:", err)
		// Limpiar cookies OAuth antes de redirigir
		c.SetCookie("_oauth_state", "", -1, "/", "", false, true)
		redirectURL := BaseURL + "/login.html?error=user_info_failed"
		c.Redirect(http.StatusFound, redirectURL)
		return
	}

	log.Printf("Usuario Google intentando login: email=%s, name=%s\n", userInfo.Email, userInfo.Name)

	// Verificar si el email existe en la base de datos
	var userID int
	var nombreCompleto string
	var rol string
	var activo bool

	err = DB.QueryRow(
		"SELECT id_usuario, nombre_completo, rol, activo FROM usuarios WHERE email = $1",
		userInfo.Email,
	).Scan(&userID, &nombreCompleto, &rol, &activo)

	if err == sql.ErrNoRows {
		// Email no autorizado - limpiar cookies OAuth
		log.Printf("Acceso denegado: email %s no está registrado\n", userInfo.Email)
		c.SetCookie("_oauth_state", "", -1, "/", "", false, true)
		redirectURL := BaseURL + "/login.html?error=no_autorizado&email=" + url.QueryEscape(userInfo.Email)
		c.Redirect(http.StatusFound, redirectURL)
		return
	}

	if err != nil {
		log.Println("Error consultando usuario en BD:", err)
		// Limpiar cookies OAuth antes de redirigir
		c.SetCookie("_oauth_state", "", -1, "/", "", false, true)
		redirectURL := BaseURL + "/login.html?error=database_error"
		c.Redirect(http.StatusFound, redirectURL)
		return
	}

	if !activo {
		// Usuario inactivo - limpiar cookies OAuth
		log.Printf("Acceso denegado: usuario %s está desactivado\n", userInfo.Email)
		c.SetCookie("_oauth_state", "", -1, "/", "", false, true)
		redirectURL := BaseURL + "/login.html?error=usuario_inactivo"
		c.Redirect(http.StatusFound, redirectURL)
		return
	}

	log.Printf("Login exitoso: %s (ID: %d, Rol: %s)\n", userInfo.Email, userID, rol)

	// Redirigir con los datos del usuario
	redirectURL := fmt.Sprintf(
		"%s/index.html?google_email=%s&user_id=%d&user_name=%s&user_rol=%s",
		BaseURL,
		url.QueryEscape(userInfo.Email),
		userID,
		url.QueryEscape(nombreCompleto),
		url.QueryEscape(rol),
	)
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

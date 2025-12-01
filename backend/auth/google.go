package auth

import (
	"fluxo/backend/config"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var GoogleOAuthConfig *oauth2.Config

// BaseURL para redirecciones (configurable via env)
var BaseURL string

func init() {
	// URL base configurable (para producción)
	BaseURL = config.GetEnv("BASE_URL", "http://localhost:4006")

	GoogleOAuthConfig = &oauth2.Config{
		ClientID:     config.GetEnv("GOOGLE_CLIENT_ID", "801049859632-fda1bj0kt5qrn5g724c2s5lrjdn8r7ro.apps.googleusercontent.com"),
		ClientSecret: config.GetEnv("GOOGLE_CLIENT_SECRET", "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"),
		RedirectURL:  BaseURL + "/api/auth/google/callback",
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
}

func GoogleLogin(c *gin.Context) {
	state := "random-state" // En producción usar valor aleatorio
	url := GoogleOAuthConfig.AuthCodeURL(state)
	c.Redirect(http.StatusFound, url)
}

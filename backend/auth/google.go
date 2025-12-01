package auth

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
)

var GoogleOAuthConfig = &oauth2.Config{
    ClientID:     "801049859632-fda1bj0kt5qrn5g724c2s5lrjdn8r7ro.apps.googleusercontent.com",
    ClientSecret: "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",
    RedirectURL:  "http://localhost:4006/api/auth/google/callback",
    Scopes:       []string{"openid", "email", "profile"},
    Endpoint:     google.Endpoint,
}

func GoogleLogin(c *gin.Context) {
    // Para la demo: valor fijo (en producción debe ser aleatorio)
    state := "random-state"

    // URL de Google para iniciar login
    url := GoogleOAuthConfig.AuthCodeURL(state)
    c.Redirect(http.StatusFound, url)
}

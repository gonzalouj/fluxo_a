// push.go
// Handlers para notificaciones Web Push
package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/gin-gonic/gin"
)

// ========= ESTRUCTURAS =========

// PushSubscription representa la suscripción del navegador
type PushSubscription struct {
	Endpoint string `json:"endpoint" binding:"required"`
	Keys     struct {
		P256dh string `json:"p256dh" binding:"required"`
		Auth   string `json:"auth" binding:"required"`
	} `json:"keys" binding:"required"`
}

// SubscribeRequest incluye la suscripción y el usuario
type SubscribeRequest struct {
	Subscription PushSubscription `json:"subscription" binding:"required"`
	UserID       int              `json:"user_id" binding:"required"`
}

// NotificationPayload es el contenido de la notificación
type NotificationPayload struct {
	Title   string `json:"title"`
	Body    string `json:"body"`
	Icon    string `json:"icon,omitempty"`
	URL     string `json:"url,omitempty"`
	Tag     string `json:"tag,omitempty"`
}

// ========= HANDLERS =========

// GetVAPIDPublicKey devuelve la clave pública VAPID para el frontend
// GET /api/push/vapid-key
func GetVAPIDPublicKey(c *gin.Context) {
	publicKey := os.Getenv("VAPID_PUBLIC_KEY")
	if publicKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "VAPID_PUBLIC_KEY no configurada"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"publicKey": publicKey})
}

// SubscribePush guarda la suscripción del usuario
// POST /api/push/subscribe
func SubscribePush(c *gin.Context) {
	var req SubscribeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos de suscripción inválidos", "details": err.Error()})
		return
	}

	// Verificar que el usuario existe
	var userExists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM usuarios WHERE id_usuario = $1 AND activo = true)", req.UserID).Scan(&userExists)
	if err != nil || !userExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Usuario no válido"})
		return
	}

	// Insertar o actualizar la suscripción (upsert por endpoint)
	query := `
		INSERT INTO push_subscriptions (id_usuario, endpoint, p256dh, auth)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (endpoint) 
		DO UPDATE SET id_usuario = $1, p256dh = $3, auth = $4, fecha_creacion = NOW()
	`
	_, err = db.Exec(query, req.UserID, req.Subscription.Endpoint, req.Subscription.Keys.P256dh, req.Subscription.Keys.Auth)
	if err != nil {
		log.Printf("Error guardando suscripción push: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar suscripción"})
		return
	}

	log.Printf("Suscripción push guardada para usuario %d", req.UserID)
	c.JSON(http.StatusOK, gin.H{"message": "Suscripción guardada exitosamente"})
}

// UnsubscribePush elimina la suscripción del usuario
// POST /api/push/unsubscribe
func UnsubscribePush(c *gin.Context) {
	var req struct {
		Endpoint string `json:"endpoint" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Endpoint requerido"})
		return
	}

	result, err := db.Exec("DELETE FROM push_subscriptions WHERE endpoint = $1", req.Endpoint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar suscripción"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Suscripción no encontrada"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Suscripción eliminada"})
}

// ========= FUNCIONES INTERNAS =========

// SendPushToAllUsers envía una notificación push a todos los usuarios suscritos
// Se llama internamente desde otros handlers (ej: al crear un pedido)
func SendPushToAllUsers(title, body, url string) {
	go sendPushNotifications(title, body, url, nil)
}

// SendPushToUser envía una notificación push a un usuario específico
func SendPushToUser(userID int, title, body, url string) {
	go sendPushNotifications(title, body, url, &userID)
}

// sendPushNotifications envía notificaciones (en goroutine)
func sendPushNotifications(title, body, url string, userID *int) {
	vapidPublicKey := os.Getenv("VAPID_PUBLIC_KEY")
	vapidPrivateKey := os.Getenv("VAPID_PRIVATE_KEY")
	vapidEmail := os.Getenv("VAPID_EMAIL")

	if vapidPublicKey == "" || vapidPrivateKey == "" {
		log.Println("VAPID keys no configuradas, no se envían push")
		return
	}

	if vapidEmail == "" {
		vapidEmail = "mailto:admin@fluxo.cl"
	}

	// Obtener suscripciones
	var rows *sql.Rows
	var err error
	if userID != nil {
		rows, err = db.Query("SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE id_usuario = $1", *userID)
	} else {
		rows, err = db.Query("SELECT endpoint, p256dh, auth FROM push_subscriptions")
	}

	if err != nil {
		log.Printf("Error obteniendo suscripciones push: %v", err)
		return
	}
	defer rows.Close()

	// Preparar payload
	payload := NotificationPayload{
		Title: title,
		Body:  body,
		Icon:  "/icon-192.png",
		URL:   url,
		Tag:   "fluxo-notification",
	}
	payloadJSON, _ := json.Marshal(payload)

	// Enviar a cada suscripción
	successCount := 0
	failCount := 0

	for rows.Next() {
		var endpoint, p256dh, auth string
		if err := rows.Scan(&endpoint, &p256dh, &auth); err != nil {
			continue
		}

		subscription := &webpush.Subscription{
			Endpoint: endpoint,
			Keys: webpush.Keys{
				P256dh: p256dh,
				Auth:   auth,
			},
		}

		resp, err := webpush.SendNotification(payloadJSON, subscription, &webpush.Options{
			Subscriber:      vapidEmail,
			VAPIDPublicKey:  vapidPublicKey,
			VAPIDPrivateKey: vapidPrivateKey,
			TTL:             60,
		})

		if err != nil {
			log.Printf("Error enviando push a %s: %v", endpoint[:50], err)
			failCount++
			// Si el endpoint ya no es válido (410 Gone), eliminarlo
			if resp != nil && resp.StatusCode == 410 {
				db.Exec("DELETE FROM push_subscriptions WHERE endpoint = $1", endpoint)
				log.Printf("Suscripción eliminada (endpoint expirado)")
			}
			continue
		}
		resp.Body.Close()
		successCount++
	}

	log.Printf("Push enviados: %d exitosos, %d fallidos", successCount, failCount)
}

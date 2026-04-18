// config.go
// Configuración de la aplicación y conexión a base de datos
package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

// GetEnv obtiene una variable de entorno o un valor por defecto.
func GetEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// ConnectDB establece conexión con PostgreSQL usando variables de entorno
func ConnectDB() (*sql.DB, error) {
	// El backend usa variables de entorno provistas por Docker Compose.
	dbUser := GetEnv("DB_USER", "postgres")
	dbPassword := GetEnv("DB_PASSWORD", "") // Asegúrate que el fallback sea seguro o vacío
	dbHost := GetEnv("DB_HOST", "localhost")
	dbPort := GetEnv("DB_PORT", "5432")
	dbName := GetEnv("DB_NAME", "fluxo_db")
	dbSSLMode := GetEnv("DB_SSLMODE", "disable")

	// Construir la cadena de conexión
	dbURL := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode)

	// Conectar a la base de datos
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("error al abrir conexión: %w", err)
	}

	// Probar la conexión
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error al conectar con la base de datos: %w", err)
	}

	log.Println("✅ Conexión a base de datos establecida")
	return db, nil
}
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

// GetEnv obtiene una variable de entorno o un valor por defecto
func GetEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// ConnectDB establece conexión con PostgreSQL
func ConnectDB() (*sql.DB, error) {
	dbURL := GetEnv("DATABASE_URL", "postgres://postgres:password@localhost:5432/fluxo?sslmode=disable")
	
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("error al abrir conexión: %v", err)
	}
	
	// Probar la conexión
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error al conectar con la base de datos: %v", err)
	}
	
	log.Println("✅ Conexión a base de datos establecida")
	return db, nil
}

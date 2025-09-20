// config.go
// Configuración de la aplicación y conexión a base de datos
package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv" // Importamos la librería para .env
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
	// 1. Cargar el archivo .env. Si no existe, no es un error fatal.
	err := godotenv.Load()
	if err != nil {
		log.Println("Advertencia: No se pudo cargar el archivo .env. Se usarán las variables de entorno existentes.")
	}

	// 2. Usamos tu función GetEnv para leer las variables de forma segura
	dbUser := GetEnv("DB_USER", "postgres")
	dbPassword := GetEnv("DB_PASSWORD", "") // Asegúrate que el fallback sea seguro o vacío
	dbHost := GetEnv("DB_HOST", "localhost")
	dbPort := GetEnv("DB_PORT", "5432")
	dbName := GetEnv("DB_NAME", "fluxo_db")
	dbSSLMode := GetEnv("DB_SSLMODE", "disable")

	// 3. Construir la cadena de conexión
	dbURL := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode)

	// 4. Conectar a la base de datos
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("error al abrir conexión: %w", err)
	}

	// 5. Probar la conexión
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error al conectar con la base de datos: %w", err)
	}

	log.Println("✅ Conexión a base de datos establecida")
	return db, nil
}
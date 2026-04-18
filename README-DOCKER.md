# Fluxo - Sistema de Pedidos Dockerizado

## Requisitos
- Docker
- Docker Compose

## Instalación y Ejecución

### Opción 1: Docker Compose (Recomendado)
```bash
# Clonar el repositorio
git clone https://github.com/Neverknowsbesst/fluxo.git
cd fluxo

# Ejecutar con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Opción 2: Construir manualmente
```bash
# Construir backend
docker build -t fluxo-backend ./backend

# Construir frontend
docker build -t fluxo-frontend -f Dockerfile.frontend .

# Ejecutar PostgreSQL
docker run -d --name fluxo-postgres \
  -e POSTGRES_DB=fluxo \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5432:5432 \
  postgres:15-alpine

# Ejecutar backend
docker run -d --name fluxo-backend \
  -e DB_HOST=fluxo-postgres \
  -e DB_NAME=fluxo \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres123 \
  --link fluxo-postgres \
  -p 8080:8080 \
  fluxo-backend

# Ejecutar frontend
docker run -d --name fluxo-frontend \
  --link fluxo-backend:backend \
  -p 3000:3000 \
  fluxo-frontend
```

## Acceso
- **Aplicación**: http://localhost:3000
- **API Backend**: http://localhost:8080
- **Base de datos**: localhost:5432

## Estructura de Docker
- **PostgreSQL**: Base de datos con inicialización automática usando `schema_unificado.sql`
- **Backend**: API Go con Gin framework
- **Frontend**: Archivos estáticos servidos por Caddy con proxy reverso

## Comandos útiles
```bash
# Detener servicios
docker-compose down

# Ver logs de un servicio específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Reconstruir imágenes
docker-compose build

# Ejecutar en modo desarrollo (con logs)
docker-compose up

# Limpiar volúmenes (¡cuidado! borra la base de datos)
docker-compose down -v
```

## Variables de Entorno
Las siguientes variables se configuran automáticamente en docker-compose.yml:

### Backend
- `DB_HOST`: Host de la base de datos
- `DB_PORT`: Puerto de la base de datos  
- `DB_NAME`: Nombre de la base de datos
- `DB_USER`: Usuario de PostgreSQL
- `DB_PASSWORD`: Contraseña de PostgreSQL

### PostgreSQL
- `POSTGRES_DB`: Nombre de la base de datos inicial
- `POSTGRES_USER`: Usuario administrador
- `POSTGRES_PASSWORD`: Contraseña del administrador
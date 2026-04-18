# Fluxo – Manual DevOps

Version: v0.8

Este documento describe cómo construir, desplegar y operar el sistema Fluxo en entornos de producción y desarrollo.

## 1. Visión General

Fluxo es una aplicación de gestión de pedidos compuesta por:
- Frontend estático (HTML/CSS/JS) servido por un servidor HTTP simple (Python) dentro de un contenedor.
- Backend en Go (framework Gin) que expone una API REST.
- Base de datos PostgreSQL.
- Orquestación con Docker Compose.

El entorno de la universidad expone solo el frontend a internet y enruta las peticiones `/api/*` al backend mediante el proxy inverso del servidor (Caddy externo al stack). La base de datos no se expone públicamente.

## 2. Arquitectura y Puertos

```
Internet -> Proxy Universidad (Caddy) -> Host Docker
																		 |
																		 +-> Frontend (externo 3006 -> contenedor 3006)
																		 +-> Backend  (externo 4006 -> contenedor 8080)
																		 +-> PostgreSQL (externo 5006 -> contenedor 5432)
```

Tabla de puertos:

| Servicio   | Puerto externo | Puerto contenedor | Descripción                                 |
|------------|-----------------|-------------------|---------------------------------------------|
| Frontend   | 3006            | 3006              | Servidor HTTP simple (solo frontend)        |
| Backend    | 4006            | 8080              | API REST Go/Gin (acceso interno / por proxy) |
| PostgreSQL | 5006            | 5432              | Base de datos (acceso restringido)          |

## 3. Requisitos Generales

Software recomendado (versiones de referencia):
- Docker y Docker Compose
- Git
- Go 1.20+ (para desarrollo del backend)
- Python 3.x (opcional para servir el frontend en local)
- PostgreSQL 15.x (local o en contenedor)

Notas:
- En producción se recomienda usar exclusivamente Docker Compose para estandarizar el entorno.
- En desarrollo, puedes optar por servicios locales o también contenedores.

## 4. Despliegue con Docker

1) Obtener el código en el servidor (una de las opciones):

```bash
git clone -b production <URL_DEL_REPO>
cd fluxo
```

2) Construir e iniciar servicios:

```bash
docker-compose up -d --build
```

3) Verificar estado y logs:

```bash
docker-compose ps
docker-compose logs -f --tail=100
```

4) Verificación funcional básica:

```bash
curl http://localhost:3006
curl http://localhost:4006/api/hello
```

Actualizaciones de versión:

```bash
git pull origin production
docker-compose up -d --build
```

## 5. Variables de Entorno

El backend usa variables de entorno inyectadas por Docker Compose. Parámetros típicos:

```env
# backend
PORT=8080
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fluxo
DB_USER=postgres
DB_PASSWORD=postgres123
```

Consideraciones:
- No commitear secretos reales. Usar archivos `.env` privados o sistemas de secretos del orquestador.
- Alinear los puertos del compose con el proxy frontal del entorno (Caddy u otro).

## 6. Operación y Mantenimiento

Comandos de operación comunes:

```bash
# Ver servicios
docker-compose ps

# Logs en tiempo real
docker-compose logs -f --tail=100

# Reinicios puntuales
docker-compose restart frontend
docker-compose restart backend

# Parar / levantar
docker-compose down
docker-compose up -d --build

# Limpieza (cuidado)
docker system prune -f
```

Base de datos (vía contenedor):

```bash
# Ingresar a psql
docker-compose exec postgres psql -U postgres -d fluxo

# Backup
docker-compose exec postgres pg_dump -U postgres fluxo > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres fluxo < backup.sql
```

## 7. Desarrollo Local

Backend:

```bash
cd backend
go mod tidy
cp .env.example .env
go run main.go
# Servirá en http://localhost:8080
```

Frontend:

```bash
cd Frontend
python -m http.server 3000
# Abrir http://localhost:3000
```

Con Docker (entorno completo local):

```bash
docker-compose up --build
```

## 8. API (Resumen)

Endpoints principales:

| Método | Endpoint         | Descripción        |
|--------|------------------|--------------------|
| GET    | /api/hello       | Prueba de conexión |
| POST   | /api/pedidos     | Crear pedido       |
| GET    | /api/pedidos     | Listar pedidos     |
| GET    | /api/pedidos/:id | Obtener por id     |

Ejemplos:

```bash
curl http://localhost:8080/api/hello

curl -X POST http://localhost:8080/api/pedidos \
	-H "Content-Type: application/json" \
	-d '{"producto":"Mesa","cantidad":1,"cliente":"Juan","fecha":"2025-12-25"}'
```

## 9. Esquema de Datos

Tablas: usuarios, productos, pedidos, pedido_productos, comentarios.

Estados de pedido: Pendiente, Listo, Cancelado.

## 10. CI/CD (Guía Breve)

Flujo recomendado:
1. Commit y push a la rama de despliegue (p. ej., `production`).
2. En el servidor: `git pull origin production`.
3. Reconstruir e iniciar: `docker-compose up -d --build`.
4. Verificar logs y endpoints.

## 11. Seguridad y Buenas Prácticas

- Exponer solo el frontend a internet; backend y BD restringidos.
- Delegar el proxy `/api/*` al frontal del entorno (Caddy/Nginx).
- Mantener secretos fuera del repositorio (Variables de entorno/API keys).
- Versionar cambios de infraestructura (compose, Dockerfiles).
- Automatizar backups de BD.

## 12. Resolución de Problemas

Síntomas frecuentes y revisión sugerida:

- Frontend carga pero API falla: confirmar que el proxy de la institución enruta `/api/*` al puerto 4006 del host y que el compose mapea 4006->8080.
- Error de conexión a BD: revisar `DB_HOST` (debe ser `postgres` dentro de la red de Docker) y credenciales.
- Puertos ocupados: verificar colisiones con `netstat`/`ss`, ajustar mapeos en `docker-compose.yml`.
- Cambios no aplican tras despliegue: ejecutar con `--build` y revisar cachés.

---

# Fluxo - Guia de Ejecucion Local con Docker

Este documento es la referencia para levantar Fluxo en entorno local (rama `main`).

## 1. Clonar el repositorio

```bash
git clone https://github.com/gonzalouj/fluxo_a.git
cd fluxo_a
git switch main
```

## 2. Preparar variables de entorno

Copia el archivo de ejemplo y edita solo lo necesario:

```bash
cp .env.example .env
```

Valores minimos recomendados para local:

```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fluxo_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSLMODE=disable

GIN_MODE=debug
BASE_URL=http://localhost

# Si no usaras Google OAuth localmente, puedes dejarlas vacias
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## 3. (Opcional) Ajustar usuario admin inicial

El seed SQL crea un usuario administrador por defecto en `schema_unificado_new.sql`.

Si quieres usar otro correo para pruebas locales, cambia solo el campo `email` antes de levantar el stack por primera vez.

## 4. Levantar el entorno local

```bash
docker-compose -f docker-compose.local.yml up -d --build
```

## 5. Verificar que todo quedo arriba

```bash
docker-compose -f docker-compose.local.yml ps
```

Pruebas rapidas:

```bash
curl http://localhost/api/hello
curl http://localhost:4006/api/hello
```

## 6. Acceso a la aplicacion

- Frontend via proxy: http://localhost/
- Backend directo: http://localhost:4006
- PostgreSQL expuesto localmente: localhost:5006

## 7. Apagar o reconstruir

```bash
# Apagar servicios
docker-compose -f docker-compose.local.yml down

# Reconstruir y volver a levantar
docker-compose -f docker-compose.local.yml up -d --build
```

## 8. Limpieza de base de datos local

```bash
# Cuidado: elimina volumenes y datos

docker-compose -f docker-compose.local.yml down -v
```

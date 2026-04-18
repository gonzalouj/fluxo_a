# Fluxo - Guia Unificada de Desarrollo Local

Este documento es la referencia oficial para trabajar en la rama `main`.
El flujo local es Docker-only: no se ejecuta backend ni frontend en modo standalone.

## 1. Que es Fluxo

Fluxo es una aplicacion de gestion de pedidos con:

- Frontend web estatico (HTML/CSS/JS).
- Backend en Go con API REST (Gin).
- Base de datos PostgreSQL.
- Proxy local con Caddy para enrutar `"/api/*"` al backend.

## 2. Modelo de ramas

- `main`: desarrollo local, pruebas y ajustes diarios.
- `production`: despliegue productivo (solo cambios validados).

## 3. Arquitectura local actual

```text
Navegador -> Proxy Caddy (localhost:80) -> Frontend (3006)
																	 |
																	 +-> Backend API (4006)
																					 |
																					 +-> PostgreSQL (5006 externo / 5432 interno)
```

Puertos de referencia en local:

| Servicio      | Host | Contenedor | Notas                                 |
| ------------- | ---- | ---------- | ------------------------------------- |
| Proxy (Caddy) | 80   | 80         | Entrada principal para frontend y API |
| Frontend      | 3006 | 3006       | Acceso directo opcional               |
| Backend       | 4006 | 4006       | Acceso directo opcional               |
| PostgreSQL    | 5006 | 5432       | Conexion local a BD                   |

## 4. Estructura del repositorio (main)

- `Frontend/`: interfaz web.
- `backend/`: API, logica y acceso a datos.
- `docker-compose.local.yml`: stack local oficial.
- `Dockerfile.frontend`: imagen del frontend local.
- `Caddyfile.local`: reglas del proxy local.
- `schema_fluxo_inicial.sql`: schema + seed inicial de BD.
- `.env.example`: plantilla de variables para entorno local.

## 5. Requisitos

- Docker + Docker Compose.
- Git.
- `curl` (opcional, para smoke tests).

## 6. Inicio rapido local

1. Clonar y cambiar a `main`:

```bash
git clone https://github.com/gonzalouj/fluxo_a.git
cd fluxo_a
git switch main
```

2. Crear archivo de variables:

```bash
cp .env.example .env
```

3. Completar `.env` para local:

```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fluxo_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSLMODE=disable

GIN_MODE=debug
BASE_URL=http://localhost
CORS_ALLOWED_ORIGIN=http://localhost

GOOGLE_CLIENT_ID=TU_CLIENT_ID_REAL
GOOGLE_CLIENT_SECRET=TU_CLIENT_SECRET_REAL
```

4. Requisitos obligatorios para login:

4.1 Claves Google OAuth propias:

- No uses credenciales de terceros o de ejemplo.
- En Google Cloud Console, crea tu cliente OAuth y registra esta redirect URI:

`http://localhost/api/auth/google/callback`

Si cambias el puerto publico del proxy, `BASE_URL` y la redirect URI deben coincidir exactamente.

4.2 Correo admin en schema:

- Antes del primer `up`, edita `schema_fluxo_inicial.sql` y cambia:

```sql
'correo@ejemplo.com'
```

- Debes reemplazarlo por el correo real con el que iniciaras sesion via Google.

5. Levantar entorno:

```bash
docker-compose -f docker-compose.local.yml up -d --build
```

6. Verificar API y login:

```bash
docker-compose -f docker-compose.local.yml ps
docker-compose -f docker-compose.local.yml logs --tail=80 backend

curl http://localhost/api/hello
curl -i http://localhost/api/auth/google/login | sed -n '1,15p'
```

Para OAuth, se espera redireccion (HTTP 302) en `/api/auth/google/login`.

Si esas verificaciones salen bien, el software ya esta en linea en `http://localhost/`.

## 7. Comandos utiles del dia a dia

```bash
# Logs en tiempo real
docker-compose -f docker-compose.local.yml logs -f --tail=100 backend proxy

# Reinicios puntuales
docker-compose -f docker-compose.local.yml restart backend
docker-compose -f docker-compose.local.yml restart proxy

# Bajar entorno
docker-compose -f docker-compose.local.yml down

# Levantar sin rebuild
docker-compose -f docker-compose.local.yml up -d

# Levantar con rebuild
docker-compose -f docker-compose.local.yml up -d --build
```

## 8. Base de datos local y seed

- La configuracion obligatoria del correo admin inicial esta en el paso 4.2.
- El archivo `schema_fluxo_inicial.sql` se ejecuta solo cuando el volumen de PostgreSQL es nuevo.
- Si cambiaste el schema (o el correo admin) y quieres resembrar desde cero, debes eliminar volumen.

Importante:

- Si ya levantaste la BD y luego cambiaste el correo admin del schema, debes reiniciar con `down -v` para que se reejecute el seed.

Reinicio limpio de BD:

```bash
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d --build
```

## 9. Recomendaciones de trabajo

- No commitear secretos reales en `.env`.
- Mantener `main` enfocado en entorno local.
- Hacer cambios pequenos y verificables (smoke test rapido tras cada ajuste relevante).
- Si cambias variables de BD, recuerda que un volumen existente puede conservar credenciales antiguas.

## 10. Problemas frecuentes

- Error 502 al consumir API:
  backend caido o proxy sin alcanzar backend. Revisar logs de `backend` y `proxy`.

- Error de autenticacion PostgreSQL (`password authentication failed`):
  desalineacion entre `.env` y volumen actual. Ajustar credenciales o reiniciar con `down -v`.

- Login Google devuelve error/502:
  revisar estado de backend y variables OAuth en `.env`.

- Login Google redirige, pero no deja entrar al sistema:
  verificar que el correo de la cuenta Google sea el mismo que pusiste en el admin seed de `schema_fluxo_inicial.sql`.

- Puerto ocupado (80/3006/4006/5006):
  cambiar mapeos en `docker-compose.local.yml` o liberar puertos del host.

## 11. Alcance de este README

Este documento cubre desarrollo local en `main`.
La operacion de despliegue productivo se mantiene en la rama `production`.

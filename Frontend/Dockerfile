# Dockerfile para frontend con servidor Python simple
# El Caddy centralizado de la universidad hace el proxy

FROM python:3.11-alpine

WORKDIR /app

# Copiar archivos del frontend (el context ya es ./Frontend)
COPY . .

# Exponer puerto (definido en .env como FRONTEND_PORT)
EXPOSE 3006

# Servidor HTTP simple
CMD ["python", "-m", "http.server", "3006"]

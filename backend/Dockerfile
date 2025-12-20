# Dockerfile para el backend Go
FROM golang:1.21-alpine AS builder

# Instalar dependencias del sistema
RUN apk add --no-cache git

# Establecer directorio de trabajo
WORKDIR /app

# Copiar go mod files
COPY go.mod go.sum ./

# Descargar dependencias
ENV GOPROXY=https://proxy.golang.org,direct
ENV GOSUMDB=off
RUN go env -w GOPROXY=https://proxy.golang.org,direct && \
    go env -w GOSUMDB=off && \
    go mod download

# Copiar código fuente
COPY . .

# Compilar la aplicación
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o fluxo-backend .

# Imagen final
FROM alpine:latest

# Instalar ca-certificates para HTTPS y postgresql-client para wait script
RUN apk --no-cache add ca-certificates postgresql-client

WORKDIR /root/

# Copiar el binario compilado
COPY --from=builder /app/fluxo-backend .

# Copiar archivo de configuración si existe
COPY --from=builder /app/.env* ./

# Crear script de espera para PostgreSQL
RUN echo '#!/bin/sh' > /wait-for-postgres.sh && \
    echo 'set -e' >> /wait-for-postgres.sh && \
    echo 'host="$1"' >> /wait-for-postgres.sh && \
    echo 'shift' >> /wait-for-postgres.sh && \
    echo 'until PGPASSWORD=$DB_PASSWORD psql -h "$host" -U "$DB_USER" -d "$DB_NAME" -c "\\q"; do' >> /wait-for-postgres.sh && \
    echo '  >&2 echo "Postgres no disponible - esperando..."' >> /wait-for-postgres.sh && \
    echo '  sleep 1' >> /wait-for-postgres.sh && \
    echo 'done' >> /wait-for-postgres.sh && \
    echo '>&2 echo "Postgres disponible - ejecutando comando"' >> /wait-for-postgres.sh && \
    echo 'exec "$@"' >> /wait-for-postgres.sh && \
    chmod +x /wait-for-postgres.sh

# Exponer puerto
EXPOSE 4006

# Comando para ejecutar: esperar postgres y luego iniciar backend
ENTRYPOINT ["/bin/sh", "-c", "/wait-for-postgres.sh $DB_HOST ./fluxo-backend"]
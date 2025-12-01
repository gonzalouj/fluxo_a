# Dockerfile para el backend Go
FROM golang:1.21-alpine AS builder

# Instalar dependencias del sistema
RUN apk add --no-cache git

# Establecer directorio de trabajo
WORKDIR /app

# Copiar go mod files
COPY backend/go.mod backend/go.sum ./

# Descargar dependencias
RUN go mod download

# Copiar código fuente
COPY backend/ .

# Compilar la aplicación
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o fluxo-backend .

# Imagen final
FROM alpine:latest

# Instalar ca-certificates para HTTPS
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copiar el binario compilado
COPY --from=builder /app/fluxo-backend .

# Copiar archivo de configuración si existe
COPY --from=builder /app/.env* ./

# Copiar Frontend (para servir archivos estáticos)
COPY Frontend/ ./Frontend/

# Exponer puerto
EXPOSE 8080

# Comando para ejecutar
CMD ["./fluxo-backend"]
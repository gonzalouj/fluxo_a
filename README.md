# Fluxo

Sistema de gestión de pedidos desarrollado con frontend HTML/JavaScript y backend Go con base de datos PostgreSQL.

## ✨ Características

- 📝 **Formulario de pedidos** con validación
- 📊 **Lista de pedidos** en tiempo real
- 🗄️ **Base de datos PostgreSQL**
- 🔄 **API REST** con Go/Gin
- 🌐 **CORS** configurado para desarrollo
- ⚡ **Interfaz responsive** con Tailwind CSS

## Estructura del Proyecto

```
fluxo/
├── Frontend/
│   └── index.html       # Interfaz web completa
├── backend/
│   ├── main.go          # Servidor principal
│   ├── go.mod           # Dependencias (Gin, PostgreSQL)
│   ├── handlers/        # Controladores de API
│   │   ├── hello.go     # Endpoint de prueba
│   │   └── pedidos.go   # Gestión de pedidos
│   ├── models/          # Modelos de datos
│   │   └── user.go      # Estructuras Pedido, Usuario, etc.
│   ├── routes/          # Configuración de rutas
│   ├── middleware/      # CORS y otros middlewares
│   ├── config/          # Conexión a base de datos
│   └── .env.example     # Variables de entorno
├── .gitignore          # Archivos excluidos
└── README.md           # Este archivo
```

## Tecnologías

### Frontend
- **HTML/CSS/JavaScript**: Interfaz de usuario
- **Tailwind CSS**: Estilos modernos (vía CDN)
- **Fetch API**: Comunicación con backend

### Backend
- **Go 1.20+**: Lenguaje de programación
- **Gin**: Framework web
- **PostgreSQL**: Base de datos relacional
- **lib/pq**: Driver de PostgreSQL para Go

### Base de Datos
- **PostgreSQL**: Sistema de gestión de base de datos
- **5 tablas**: usuarios, productos, pedidos, pedido_productos, comentarios
- **Tipos ENUM**: roles de usuario, estados de pedido
- **Integridad referencial**: Foreign keys y constraints

## 🚀 Instalación y Configuración

### Prerrequisitos

```bash
# Instalar Go (en Arch Linux)
sudo pacman -S go

# Instalar PostgreSQL
sudo pacman -S postgresql
sudo systemctl enable --now postgresql
```

### 1. Configurar Base de Datos

```bash
# Crear usuario y base de datos
sudo -u postgres createdb fluxo

# Crear las tablas (ejecutar el schema SQL)
sudo -u postgres psql -d fluxo -f schema.sql
```

### 2. Backend

```bash
cd backend

# Descargar dependencias
go mod tidy

# Configurar variables de entorno (opcional)
cp .env.example .env

# Ejecutar servidor
go run main.go
```

Servidor disponible en `http://localhost:8080`

### 3. Frontend

```bash
# Opción 1: Abrir directamente
xdg-open Frontend/index.html

# Opción 2: Servidor local (recomendado)
cd Frontend
python -m http.server 3000
# Ir a http://localhost:3000
```

## 🔌 API Endpoints

### Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/hello` | Prueba de conexión |
| `POST` | `/api/pedidos` | Crear nuevo pedido |
| `GET` | `/api/pedidos` | Listar todos los pedidos |
| `GET` | `/api/pedidos/:id` | Obtener pedido específico |

### Crear Pedido

**POST** `/api/pedidos`

```json
{
  "producto": "Mesa de madera",
  "cantidad": 2,
  "cliente": "Juan Pérez",
  "fecha": "2025-12-25",
  "email": "juan@email.com",
  "etiquetas": "urgente, madera"
}
```

**Response:**
```json
{
  "message": "Pedido creado exitosamente",
  "pedido_id": 1
}
```

### Listar Pedidos

**GET** `/api/pedidos`

```json
{
  "pedidos": [
    {
      "id_pedido": 1,
      "nombre_cliente": "Juan Pérez",
      "email_cliente": "juan@email.com",
      "fecha_entrega": "2025-12-25T00:00:00Z",
      "estado": "Pendiente",
      "fecha_creacion": "2025-09-15T02:56:49.335596-03:00"
    }
  ]
}
```

## 🗄️ Esquema de Base de Datos

### Tablas Principales

- **usuarios**: Gestión de usuarios del sistema
- **productos**: Catálogo de productos
- **pedidos**: Información general de pedidos
- **pedido_productos**: Relación muchos-a-muchos
- **comentarios**: Comentarios por pedido

### Estados de Pedido
- `Pendiente` (por defecto)
- `Listo`
- `Cancelado`

## 🛠️ Desarrollo

### Agregar nuevos handlers

1. Crear handler en `backend/handlers/nuevo_handler.go`:
```go
func NuevoHandler(c *gin.Context) {
    // Lógica del endpoint
    c.JSON(200, gin.H{"message": "Nuevo endpoint"})
}
```

2. Registrar en `backend/routes/routes.go`:
```go
r.GET("/api/nuevo", handlers.NuevoHandler)
```

### Agregar nuevos modelos

1. Definir en `backend/models/`:
```go
type NuevoModelo struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}
```

### Variables de Entorno

Crear archivo `.env` en el directorio `backend/`:

```env
# Puerto del servidor
PORT=8080

# Base de datos PostgreSQL
DATABASE_URL=postgres://postgres:password@localhost:5432/fluxo?sslmode=disable

# Entorno
ENV=development
```

## 🔧 Comandos Útiles

### Backend

```bash
# Compilar para producción
go build -o fluxo-backend main.go

# Ejecutar binario
./fluxo-backend

# Detener servidor
pkill -f "go run main.go"
# o Ctrl+C si está en primer plano

# Ver logs de base de datos
sudo -u postgres psql -d fluxo -c "SELECT * FROM pedidos;"
```

### Base de Datos

```bash
# Conectar a PostgreSQL
sudo -u postgres psql -d fluxo

# Ver tablas
\dt

# Ver pedidos
SELECT * FROM pedidos;

# Ver productos
SELECT * FROM productos;
```

## 🚀 Despliegue

### Compilar para producción

```bash
cd backend
go build -ldflags="-s -w" -o fluxo-backend main.go
```

### Cross-compilation

```bash
# Para Linux
GOOS=linux GOARCH=amd64 go build -o fluxo-linux main.go

# Para Windows
GOOS=windows GOARCH=amd64 go build -o fluxo-windows.exe main.go
```

## 📊 Testing

### Probar endpoints

```bash
# Endpoint de prueba
curl http://localhost:8080/api/hello

# Crear pedido
curl -X POST http://localhost:8080/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{"producto":"Mesa","cantidad":1,"cliente":"Juan","fecha":"2025-12-25"}'

# Listar pedidos
curl http://localhost:8080/api/pedidos
```

## 📋 Próximas Funcionalidades

- [ ] Autenticación JWT
- [ ] Dashboard administrativo
- [ ] Notificaciones por wsp
- [ ] Exportar pedidos a PDF/Excel
- [ ] Estados de pedido más detallados
- [ ] Tests unitarios
- [ ] Docker containers
- [ ] CI/CD pipeline
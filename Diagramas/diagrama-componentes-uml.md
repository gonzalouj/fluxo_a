# Diagrama de Componentes UML - Sistema Fluxo

## Notación UML Estándar

```mermaid
graph TB
    %% Nodo Principal - Servidor
    subgraph SERVIDOR["<<node>> Servidor<br/>146.83.216.166<br/>Ubuntu"]
        
        %% Componente Frontend
        subgraph FRONTEND["<<component>> Frontend"]
            HTML["<<artifact>> Páginas HTML<br/>index.html<br/>historial.html<br/>usuarios.html"]
            
            JS["<<artifact>> Scripts JavaScript<br/>pedidos.js<br/>historial.js<br/>usuarios.js<br/>menu-inline.js"]
        end
        
        %% Componente Backend/API
        subgraph BACKEND["<<component>> Backend API"]
            ROUTES["<<interface>> routes.go<br/>POST /api/pedidos<br/>GET /api/pedidos<br/>PATCH /api/pedidos/:id<br/>GET /api/productos<br/>etc."]
            
            HANDLERS["<<component>> handlers/<br/>pedidos.go<br/>productos.go<br/>categorias.go<br/>comentarios.go"]
            
            MIDDLEWARE["<<component>> middleware/<br/>cors.go"]
            
            CONFIG["<<component>> config.go<br/>DB connection<br/>Environment vars"]
        end
        
        %% Componente Base de Datos
        subgraph DATABASE["<<component>> PostgreSQL 15"]
            SCHEMA["<<artifact>> schema_unificado.sql"]
            
            TABLES["<<database>> Tablas<br/>pedidos<br/>productos<br/>pedido_productos<br/>comentarios<br/>usuarios<br/>categorias"]
        end
        
        %% Contenedor Docker
        subgraph DOCKER["<<execution environment>> Docker"]
            COMPOSE["<<artifact>> docker-compose.yml<br/>networks: red_taller_software"]
            
            DFE["<<container>> fluxo-frontend<br/>Puerto: 3006<br/>Python HTTP Server"]
            
            DBE["<<container>> fluxo-backend<br/>Puerto: 4006<br/>Go 1.21"]
            
            DPS["<<container>> fluxo-postgres<br/>Puerto: 5006:5432<br/>PostgreSQL 15-alpine"]
        end
    end
    
    %% Servidor Proxy Externo
    CADDY["<<node>> Servidor Caddy<br/>Proxy Inverso<br/>HTTPS"]
    
    %% Relaciones y Dependencias
    HTML -.usa.-> JS
    JS -.HTTP REST.-> ROUTES
    ROUTES --> MIDDLEWARE
    ROUTES --> HANDLERS
    HANDLERS --> CONFIG
    CONFIG -.SQL.-> TABLES
    SCHEMA -.define.-> TABLES
    
    %% Relaciones Docker
    COMPOSE -.orquesta.-> DFE
    COMPOSE -.orquesta.-> DBE
    COMPOSE -.orquesta.-> DPS
    
    DFE -.sirve.-> HTML
    DBE -.ejecuta.-> BACKEND
    DPS -.aloja.-> DATABASE
    
    %% Relación externa
    CADDY -.proxy /api/*.-> DBE
    CADDY -.proxy /*.-> DFE
    
    %% Estilos UML
    classDef nodeStyle fill:#e8f4f8,stroke:#0288d1,stroke-width:3px,color:#000
    classDef componentStyle fill:#fff9e1,stroke:#ff9800,stroke-width:2px,color:#000
    classDef artifactStyle fill:#e8f5e9,stroke:#4caf50,stroke-width:2px,color:#000
    classDef interfaceStyle fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px,color:#000
    classDef containerStyle fill:#fce4ec,stroke:#e91e63,stroke-width:2px,color:#000
    
    class SERVIDOR,CADDY nodeStyle
    class FRONTEND,BACKEND,DATABASE,DOCKER componentStyle
    class HTML,JS,SCHEMA,COMPOSE artifactStyle
    class ROUTES interfaceStyle
    class DFE,DBE,DPS containerStyle
```

---

## 📋 Leyenda de Estereotipos UML

| Estereotipo | Significado | Uso |
|-------------|-------------|-----|
| `<<node>>` | Nodo físico de hardware/servidor | Servidor Ubuntu |
| `<<component>>` | Componente de software | Frontend, Backend, BD |
| `<<artifact>>` | Artefacto físico (archivo) | HTML, JS, SQL, docker-compose |
| `<<interface>>` | Interfaz de comunicación | API REST endpoints |
| `<<execution environment>>` | Entorno de ejecución | Docker |
| `<<container>>` | Contenedor Docker | fluxo-frontend, backend, postgres |
| `<<database>>` | Base de datos | Tablas PostgreSQL |

---

## 🔗 Tipos de Relaciones

| Relación | Notación | Significado |
|----------|----------|-------------|
| **Dependencia** | `-.usa.->` | Un componente usa otro |
| **Comunicación** | `-.HTTP REST.->` | Protocolo de comunicación |
| **Asociación** | `-->` | Relación directa |
| **Despliegue** | `-.ejecuta.->` | Contenedor ejecuta componente |

---

## 📐 Diagrama de Despliegue UML (Vista Física)

```mermaid
graph TB
    subgraph INTERNET["Internet"]
        USUARIO[👤 Usuario<br/>Navegador Web]
    end
    
    subgraph SERVIDOR["<<device>> Servidor Ubuntu<br/>146.83.216.166"]
        CADDY["<<execution environment>> Caddy<br/>Reverse Proxy<br/>HTTPS"]
        
        subgraph DOCKER_ENV["<<execution environment>> Docker Engine"]
            FRONTEND_CONT["<<container>> fluxo-frontend<br/>:3006<br/>Python 3"]
            BACKEND_CONT["<<container>> fluxo-backend<br/>:4006<br/>Go 1.21"]
            DB_CONT["<<container>> fluxo-postgres<br/>:5432<br/>PostgreSQL 15"]
        end
        
        NETWORK["<<network>> red_taller_software<br/>Docker Bridge Network"]
    end
    
    USUARIO -->|HTTPS| CADDY
    CADDY -->|HTTP /api/*| BACKEND_CONT
    CADDY -->|HTTP /*| FRONTEND_CONT
    
    BACKEND_CONT -.TCP 5432.-> DB_CONT
    
    FRONTEND_CONT -.conecta.-> NETWORK
    BACKEND_CONT -.conecta.-> NETWORK
    DB_CONT -.conecta.-> NETWORK
    
    classDef deviceStyle fill:#e1f5fe,stroke:#0288d1,stroke-width:3px
    classDef execStyle fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef containerStyle fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    classDef networkStyle fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    
    class SERVIDOR deviceStyle
    class DOCKER_ENV,CADDY execStyle
    class FRONTEND_CONT,BACKEND_CONT,DB_CONT containerStyle
    class NETWORK networkStyle
```

---

## 🏗️ Diagrama de Paquetes UML (Estructura de Código)

```mermaid
graph TB
    subgraph FRONTEND_PKG["<<package>> Frontend"]
        HTML_PKG["<<package>> HTML<br/>Views"]
        JS_PKG["<<package>> JavaScript<br/>Client Logic"]
        CSS_PKG["<<package>> CSS<br/>Styles"]
    end
    
    subgraph BACKEND_PKG["<<package>> backend"]
        MAIN_PKG["<<package>> main<br/>Entry Point"]
        
        ROUTES_PKG["<<package>> routes<br/>API Routing"]
        
        HANDLERS_PKG["<<package>> handlers<br/>Business Logic<br/>• pedidos<br/>• productos<br/>• categorias<br/>• comentarios"]
        
        MIDDLEWARE_PKG["<<package>> middleware<br/>• cors<br/>• auth"]
        
        CONFIG_PKG["<<package>> config<br/>Configuration"]
    end
    
    subgraph DATABASE_PKG["<<package>> database"]
        SCHEMA_PKG["<<artifact>> schema_unificado.sql"]
    end
    
    HTML_PKG --> JS_PKG
    JS_PKG -.HTTP.-> ROUTES_PKG
    
    MAIN_PKG --> ROUTES_PKG
    ROUTES_PKG --> MIDDLEWARE_PKG
    ROUTES_PKG --> HANDLERS_PKG
    HANDLERS_PKG --> CONFIG_PKG
    CONFIG_PKG -.SQL.-> SCHEMA_PKG
    
    classDef packageStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef artifactStyle fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    
    class FRONTEND_PKG,BACKEND_PKG,DATABASE_PKG,HTML_PKG,JS_PKG,CSS_PKG,MAIN_PKG,ROUTES_PKG,HANDLERS_PKG,MIDDLEWARE_PKG,CONFIG_PKG packageStyle
    class SCHEMA_PKG artifactStyle
```

---

## 📝 Notas sobre la Notación UML

### Estereotipos utilizados:
- **`<<node>>`**: Representa hardware físico (servidor)
- **`<<component>>`**: Módulos de software independientes
- **`<<artifact>>`**: Archivos físicos del sistema
- **`<<interface>>`**: Puntos de acceso/API
- **`<<execution environment>>`**: Entornos de ejecución (Docker)
- **`<<container>>`**: Contenedores Docker
- **`<<database>>`**: Bases de datos
- **`<<device>>`**: Dispositivos físicos
- **`<<network>>`**: Redes
- **`<<package>>`**: Agrupación lógica de código

### Tipos de flechas UML:
- **Línea continua (`-->`)**: Asociación/Dependencia fuerte
- **Línea punteada (`-.->`)**: Dependencia débil/Uso
- **Texto en flecha**: Protocolo o método de comunicación

### Colores por tipo (para facilitar lectura):
- **Azul**: Nodos físicos (hardware)
- **Naranja**: Componentes y entornos de ejecución
- **Verde**: Artefactos y bases de datos
- **Morado**: Interfaces y contenedores
- **Amarillo**: Paquetes de código

---

## 🎯 Diferencias con el diagrama anterior

| Aspecto | Diagrama Anterior | Diagrama UML |
|---------|-------------------|--------------|
| **Notación** | Personalizada | UML estándar |
| **Estereotipos** | ❌ No | ✅ Sí (`<<component>>`, etc.) |
| **Propósito** | Navegación de código | Documentación arquitectónica |
| **Colores** | Decorativos | Significado semántico |
| **Flechas** | Simples | Tipadas (dependencia, uso, etc.) |
| **Estándar** | Informal | IEEE/OMG UML 2.5 |

Este diagrama UML es apropiado para documentación académica y profesional. 📚

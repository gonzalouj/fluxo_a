-- ========= CREACIÓN DE TIPOS ENUMERADOS =========
CREATE TYPE rol_usuario AS ENUM ('Admin', 'Trabajador');
CREATE TYPE estado_pedido AS ENUM ('Pendiente', 'Listo', 'Cancelado');

-- ========= CREACIÓN DE TABLAS =========

-- 1. Tabla de Usuarios
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    rut VARCHAR(12) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE usuarios IS 'Tabla para almacenar los usuarios del sistema.';

-- 2. Tabla de Categorías
CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);
COMMENT ON TABLE categorias IS 'Clasificación de productos en categorías (Sillas, Bancas, Mesas, etc.).';

-- 3. Tabla de Productos (Catálogo)
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    id_categoria INTEGER REFERENCES categorias(id_categoria) ON DELETE SET NULL,

    -- Dimensiones
    largo_cm DECIMAL(6,2),
    ancho_cm DECIMAL(6,2),
    alto_cm DECIMAL(6,2),
    diametro_cm DECIMAL(6,2),
    fondo_cm DECIMAL(6,2),
    altura_asiento_cm DECIMAL(6,2),
    altura_cubierta_cm DECIMAL(6,2),

    peso_kg DECIMAL(6,2),
    material VARCHAR(100),

    precio_unitario NUMERIC(12,2),
    moneda CHAR(3) DEFAULT 'CLP',
    incluye_iva BOOLEAN DEFAULT TRUE,
    requiere_presupuesto BOOLEAN DEFAULT FALSE,
    unidad_venta VARCHAR(50) DEFAULT 'unidad',

    stock INTEGER,
    foto_principal_url TEXT,
    notas_especiales TEXT,

    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE productos IS 'Catálogo de productos con especificaciones técnicas y atributos opcionales.';

-- 4. Tabla de Atributos
CREATE TABLE atributos (
    id_atributo SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

-- 5. Relación productos-atributos (N:N)
CREATE TABLE producto_atributos (
    id_producto INTEGER REFERENCES productos(id_producto) ON DELETE CASCADE,
    id_atributo INTEGER REFERENCES atributos(id_atributo) ON DELETE CASCADE,
    PRIMARY KEY (id_producto, id_atributo)
);

-- 6. Tabla de Pedidos
CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    nombre_cliente VARCHAR(255) NOT NULL,
    email_cliente VARCHAR(255),
    telefono_cliente VARCHAR(50),
    fecha_entrega DATE NOT NULL,
    detalles_pedido TEXT,
    estado estado_pedido NOT NULL DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_usuario_creador INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);
COMMENT ON TABLE pedidos IS 'Almacena la información general de cada pedido.';

-- 7. Tabla Intermedia: pedido_productos (Muchos a Muchos)
CREATE TABLE pedido_productos (
    id_pedido INTEGER NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_producto INTEGER NOT NULL REFERENCES productos(id_producto) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario_congelado NUMERIC(12, 2) NOT NULL,
    PRIMARY KEY (id_pedido, id_producto)
);
COMMENT ON TABLE pedido_productos IS 'Tabla que une pedidos con productos, especificando cantidad y precio.';

-- 8. Tabla de Comentarios
CREATE TABLE comentarios (
    id_comentario SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE comentarios IS 'Almacena los comentarios asociados a cada pedido.';
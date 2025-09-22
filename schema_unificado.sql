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

-- 2. Tabla de Productos (Catálogo) - VERSION EXTENDIDA
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    precio_unitario NUMERIC(12,2) CHECK (precio_unitario >= 0), -- Cambiado de NOT NULL a opcional y aumentado precision
    
    -- CAMPOS NUEVOS AGREGADOS:
    codigo VARCHAR(20) UNIQUE,
    id_categoria INTEGER,
    largo_cm DECIMAL(6,2),
    ancho_cm DECIMAL(6,2),
    alto_cm DECIMAL(6,2),
    diametro_cm DECIMAL(6,2),
    fondo_cm DECIMAL(6,2),
    altura_asiento_cm DECIMAL(6,2),
    altura_cubierta_cm DECIMAL(6,2),
    peso_kg DECIMAL(6,2),
    material VARCHAR(100),
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
COMMENT ON TABLE productos IS 'Catálogo de productos disponibles para la venta con especificaciones técnicas extendidas.';

-- 3. Tabla de Pedidos
CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    nombre_cliente VARCHAR(255) NOT NULL,
    email_cliente VARCHAR(255),
    telefono_cliente VARCHAR(50),
    fecha_entrega DATE NOT NULL,
    detalles_pedido TEXT, -- Para notas generales sobre el pedido
    estado estado_pedido NOT NULL DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_usuario_creador INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);
COMMENT ON TABLE pedidos IS 'Almacena la información general de cada pedido.';

-- 4. Tabla Intermedia: pedido_productos (Muchos a Muchos)
CREATE TABLE pedido_productos (
    id_pedido INTEGER NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_producto INTEGER NOT NULL REFERENCES productos(id_producto) ON DELETE RESTRICT, -- No se puede borrar un producto si está en un pedido
    cantidad INTEGER NOT NULL CHECK (cantidad > 0), -- Cantidad debe ser positiva
    precio_unitario_congelado NUMERIC(12, 2) NOT NULL, -- Precio al momento de la venta - aumentado precision
    PRIMARY KEY (id_pedido, id_producto) -- Clave primaria compuesta para evitar duplicados
);
COMMENT ON TABLE pedido_productos IS 'Tabla que une pedidos con productos, especificando cantidad y precio.';

-- 5. Tabla de Comentarios
CREATE TABLE comentarios (
    id_comentario SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE comentarios IS 'Almacena los comentarios asociados a cada pedido.';


-- ========= ÍNDICES PARA MEJORAR RENDIMIENTO =========

-- Índices para búsquedas frecuentes
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_fecha_entrega ON pedidos(fecha_entrega);
CREATE INDEX idx_pedidos_cliente ON pedidos(nombre_cliente);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rut ON usuarios(rut);

-- Índices para los nuevos campos de productos
CREATE INDEX idx_productos_codigo ON productos(codigo);
CREATE INDEX idx_productos_categoria ON productos(id_categoria);
CREATE INDEX idx_productos_requiere_presupuesto ON productos(requiere_presupuesto);


-- ========= DATOS DE EJEMPLO (OPCIONAL) =========

-- Usuario administrador por defecto
INSERT INTO usuarios (rut, nombre_completo, email, password_hash, rol) 
VALUES ('12345678-9', 'Administrador Sistema', 'admin@fluxo.com', 'hash_password_here', 'Admin');

-- Algunos productos de ejemplo (actualizados con nuevos campos)
INSERT INTO productos (nombre, descripcion, precio_unitario, codigo, material, incluye_iva) VALUES
('Mesa de Madera', 'Mesa de madera maciza para comedor', 150000.00, 'MESA001', 'Madera maciza', true),
('Silla Ergonómica', 'Silla de oficina con soporte lumbar', 85000.00, 'SILLA001', 'Plástico y metal', true),
('Estantería', 'Estantería de 5 niveles para libros', 120000.00, 'ESTANT001', 'MDF', true);


-- ========= FIN DEL SCRIPT =========
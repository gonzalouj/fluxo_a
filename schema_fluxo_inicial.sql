-- ========= SCRIPT UNIFICADO PARA BASE DE DATOS POSTGRESQL =========
-- Script que crea toda la estructura y datos desde cero
-- Incluye: tipos enumerados, tablas, datos iniciales y triggers

-- ========= ELIMINACIÓN DE OBJETOS EXISTENTES (SI EXISTEN) =========
-- Eliminar triggers
DROP TRIGGER IF EXISTS trigger_actualizar_fecha_productos ON productos;
DROP FUNCTION IF EXISTS actualizar_fecha_modificacion();

-- Eliminar tablas en orden correcto (respetando dependencias)
DROP TABLE IF EXISTS comentarios CASCADE;
DROP TABLE IF EXISTS pedido_productos CASCADE;
DROP TABLE IF EXISTS producto_atributos CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS atributos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;

-- Eliminar tipos enumerados
DROP TYPE IF EXISTS estado_pedido CASCADE;
DROP TYPE IF EXISTS rol_usuario CASCADE;

-- ========= CREACIÓN DE TIPOS ENUMERADOS =========
CREATE TYPE rol_usuario AS ENUM ('Admin', 'Trabajador');
-- Estado de pedido: Pendiente (recién creado), Listo (preparado), Entregado (entregado al cliente), Cancelado (anulado)
CREATE TYPE estado_pedido AS ENUM ('Pendiente', 'Listo', 'Entregado', 'Cancelado');

-- ========= CREACIÓN DE TABLAS =========

-- 1. Tabla de Categorías
CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);
COMMENT ON TABLE categorias IS 'Categorías de productos del catálogo.';

-- 2. Tabla de Atributos
CREATE TABLE atributos (
    id_atributo SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);
COMMENT ON TABLE atributos IS 'Atributos que pueden tener los productos.';

-- 3. Tabla de Usuarios
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

-- 4. Tabla de Productos (Catálogo) - VERSIÓN COMPLETA con soporte de productos temporales
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(255) NOT NULL,  -- UNIQUE removido para permitir nombres duplicados en productos temporales
    descripcion TEXT,
    id_categoria INTEGER REFERENCES categorias(id_categoria) ON DELETE SET NULL,
    precio_unitario NUMERIC(12,2) CHECK (precio_unitario >= 0),
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
    -- Campos para soporte de productos temporales
    es_temporal BOOLEAN DEFAULT FALSE,
    id_pedido_origen INTEGER,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE productos IS 'Catálogo completo de productos disponibles para la venta. Soporta productos permanentes y temporales asociados a pedidos específicos.';
COMMENT ON COLUMN productos.es_temporal IS 'Si es TRUE, el producto existe solo para un pedido específico y se eliminará cuando el pedido se elimine';
COMMENT ON COLUMN productos.id_pedido_origen IS 'ID del pedido al que pertenece este producto temporal. NULL para productos permanentes';

-- 5. Tabla Intermedia: producto_atributos (Muchos a Muchos)
CREATE TABLE producto_atributos (
    id_producto INTEGER REFERENCES productos(id_producto) ON DELETE CASCADE,
    id_atributo INTEGER REFERENCES atributos(id_atributo) ON DELETE CASCADE,
    PRIMARY KEY (id_producto, id_atributo)
);
COMMENT ON TABLE producto_atributos IS 'Relación muchos a muchos entre productos y atributos.';

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
    precio_unitario_congelado NUMERIC(10, 2) NOT NULL,
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

-- ========= CONSTRAINTS ADICIONALES =========

-- Foreign key para productos temporales (referencia a pedidos creada después de que ambas tablas existen)
ALTER TABLE productos
ADD CONSTRAINT fk_productos_pedido_origen 
FOREIGN KEY (id_pedido_origen) 
REFERENCES pedidos(id_pedido) 
ON DELETE CASCADE;

-- Índices para rendimiento de productos temporales
CREATE INDEX idx_productos_temporal 
ON productos(es_temporal) 
WHERE es_temporal = true;

CREATE INDEX idx_productos_pedido_origen 
ON productos(id_pedido_origen) 
WHERE id_pedido_origen IS NOT NULL;

-- ========= INSERCIÓN DE DATOS INICIALES =========

-- Insertar categorías
INSERT INTO categorias (nombre) VALUES 
    ('Sillas'),
    ('Bancas'),
    ('Mesas'),
    ('Jardineras'),
    ('Reposeras'),
    ('Productos a Medida'),
    ('Maderas Plásticas');

-- Insertar atributos comunes
INSERT INTO atributos (nombre) VALUES 
    ('Waterproof'),
    ('Resistente a hongos e insectos'),
    ('No requiere mantención'),
    ('No se astilla'),
    ('100% reciclado'),
    ('Uso exterior');

-- Insertar usuario administrador inicial
INSERT INTO usuarios (
    rut, 
    nombre_completo, 
    email, 
    password_hash, 
    rol, 
    activo
) VALUES (
    '12345678-9',
    'Administrador Sistema',
    'correo@ejemplo.com', --aqui colocar correo de gmail para poder ingresar a la aplicación con este usuario
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
    'Admin',
    true
);

-- Insertar usuario trabajador de ejemplo
INSERT INTO usuarios (
    rut, 
    nombre_completo, 
    email, 
    password_hash, 
    rol, 
    activo
) VALUES (
    '98765432-1',
    'Juan Pérez',
    'trabajador@empresa.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
    'Trabajador',
    true
);

-- ========= INSERCIÓN DE PRODUCTOS DEL CATÁLOGO =========

-- CATEGORÍA: SILLAS

-- Silla Simple
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm, altura_asiento_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'SS2', 'Silla Simple', 'Silla individual con respaldo alto', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Sillas'),
    70, 74, 110, 45,
    35, 'Plástico 100% reciclado', 181000, true, NULL
);

-- Silla Doble
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm, altura_asiento_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'SD1', 'Silla Doble', 'Silla doble con respaldo alto', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Sillas'),
    135, 74, 112, 47,
    64, 'Plástico 100% reciclado', 235000, true, NULL
);

-- Apoya Pies para Sillas
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    ancho_cm, alto_cm, fondo_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'AP3', 'Apoya Pies para Sillas', 'Apoya pies complementario para sillas', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Sillas'),
    41, 57, 54,
    31, 'Plástico 100% reciclado', 81000, true, NULL
);

-- CATEGORÍA: BANCAS

-- Banca K
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm, altura_asiento_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'BK4', 'Banca K', 'Banca estilo K con respaldo', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Bancas'),
    134, 72, 98, 45,
    64, 'Plástico 100% reciclado', 237000, true, NULL
);

-- Banca K Simple
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    fondo_cm, ancho_cm, alto_cm, altura_asiento_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'BK4S', 'Banca K Simple', 'Banca K versión simple', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Bancas'),
    56, 67, 98, 45,
    40, 'Plástico 100% reciclado', 190000, true, NULL
);

-- Banca P
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm, altura_asiento_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'BP5', 'Banca P', 'Banca estilo P con respaldo', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Bancas'),
    134, 70, 93, 45,
    62, 'Plástico 100% reciclado', 225000, true, NULL
);

-- Banca Grande sin Respaldo
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'BG7', 'Banca Grande sin Respaldo', 'Banca grande sin respaldo', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Bancas'),
    200, 35, 48,
    52, 'Plástico 100% reciclado', 187000, true, NULL
);

-- Banca Pequeña sin Respaldo
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'BC6', 'Banca Pequeña sin Respaldo', 'Banca pequeña sin respaldo', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Bancas'),
    110, 35, 48,
    28, 'Plástico 100% reciclado', 150000, true, NULL
);

-- Banca C Grande sin Respaldo
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'BCSRG1', 'Banca C Grande sin Respaldo', 'Banca estilo C grande sin respaldo', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Bancas'),
    200, 45, 45,
    61, 'Plástico 100% reciclado', 255000, true, NULL
);

-- Banca C Pequeña sin Respaldo
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'BCSRC1', 'Banca C Pequeña sin Respaldo', 'Banca estilo C pequeña sin respaldo', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Bancas'),
    110, 45, 45,
    35, 'Plástico 100% reciclado', 162000, true, NULL
);

-- CATEGORÍA: MESAS

-- Mesa Centro Rectangular
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'MR10', 'Mesa Centro Rectangular', 'Mesa de centro rectangular', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Mesas'),
    110, 79, 45,
    47, 'Plástico 100% reciclado', 199000, true, NULL
);

-- Mesa Centro Circular Baja
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    diametro_cm, alto_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'MCB11', 'Mesa Centro Circular Baja', 'Mesa de centro circular baja', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Mesas'),
    106, 45,
    60, 'Plástico 100% reciclado', 199000, true, NULL
);

-- Mesa Centro Circular Alta
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    diametro_cm, alto_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'MCA11', 'Mesa Centro Circular Alta', 'Mesa de centro circular alta', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Mesas'),
    106, 75,
    65, 'Plástico 100% reciclado', 219000, true, NULL
);

-- Mesa Picnic
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    ancho_cm, largo_cm, altura_cubierta_cm, altura_asiento_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock,
    notas_especiales
) VALUES (
    'MP19', 'Mesa Picnic', 'Mesa picnic con bancas integradas', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Mesas'),
    145, NULL, 75, 45,
    116, 'Plástico 100% reciclado', 455000, true, NULL,
    'Ancho cubierta: 70 cm'
);

-- Mesa Terraza U
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock,
    notas_especiales
) VALUES (
    'MTU18', 'Mesa Terraza U', 'Mesa terraza estilo U', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Mesas'),
    200, 97, 75,
    110, 'Plástico 100% reciclado', 499000, true, NULL,
    'Precio por mesa. Bancas se venden por separado a $187.000 c/u (IVA incluido)'
);

-- Mesa Terraza X
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, altura_cubierta_cm, altura_asiento_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock,
    notas_especiales
) VALUES (
    'MTX17', 'Mesa Terraza X', 'Mesa terraza estilo X con bancas', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Mesas'),
    200, 99, 75, 45,
    210, 'Plástico 100% reciclado', 699000, true, NULL,
    'Precio por mesa. Bancas se venden por separado a $187.000 c/u (IVA incluido)'
);

-- Mesa Cuadrada Pequeña
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    ancho_cm, alto_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'MCP12', 'Mesa Cuadrada Pequeña', 'Mesa cuadrada pequeña', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Mesas'),
    53, 45,
    30, 'Plástico 100% reciclado', 90000, true, NULL
);

-- CATEGORÍA: REPOSERAS

-- Reposera
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'R20', 'Reposera', 'Reposera reclinable para exterior', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Reposeras'),
    235, 60,
    77, 'Plástico 100% reciclado', 292000, true, NULL
);

-- CATEGORÍA: JARDINERAS

-- Jardinera Vertical
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'JV1', 'Jardinera Vertical', 'Jardinera vertical para plantas', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Jardineras'),
    170, 55,
    36, 'Plástico 100% reciclado', 142000, true, NULL
);

-- Jardinera L
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    alto_cm, ancho_cm, fondo_cm,
    peso_kg, material, precio_unitario, incluye_iva, stock
) VALUES (
    'JL1', 'Jardinera L', 'Jardinera en forma de L', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Jardineras'),
    200, 45, 55,
    52, 'Plástico 100% reciclado', 162000, true, NULL
);

-- CATEGORÍA: PRODUCTOS A MEDIDA

-- Cajón para Huerta
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm,
    material, requiere_presupuesto, incluye_iva
) VALUES (
    'CH001', 'Cajón para Huerta', 'Cajón para huerta a medida', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Productos a Medida'),
    238, 100, 36,
    'Plástico 100% reciclado', true, true
);

-- Pasarelas
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    ancho_cm,
    material, requiere_presupuesto, incluye_iva
) VALUES (
    'PAS001', 'Pasarelas', 'Pasarelas personalizadas', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Productos a Medida'),
    120,
    'Plástico 100% reciclado', true, true
);

-- Deck Terraza
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    material, requiere_presupuesto, incluye_iva,
    notas_especiales
) VALUES (
    'DECK001', 'Deck Terraza', 'Deck para terraza personalizado', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Productos a Medida'),
    'Plástico 100% reciclado', true, true,
    'Medida tabla: 9cm ancho x 4cm alto x 235cm largo. 10 tablas para cada 2,35 m²'
);

-- Juego Niños
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    material, requiere_presupuesto, incluye_iva
) VALUES (
    'JN001', 'Juego Niños', 'Juegos infantiles personalizados', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Productos a Medida'),
    'Plástico 100% reciclado', true, true
);

-- Durmientes
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm,
    peso_kg, material, requiere_presupuesto, incluye_iva
) VALUES (
    'DUR001', 'Durmientes', 'Durmientes para construcción', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Productos a Medida'),
    180, 12.5, 25,
    45, 'Plástico 100% reciclado', true, true
);

-- CATEGORÍA: MADERAS PLÁSTICAS

-- Tabla 1
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm,
    material, precio_unitario, incluye_iva, unidad_venta
) VALUES (
    'TAB1', 'Tabla 1', 'Tabla de madera plástica 4x9x235', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Maderas Plásticas'),
    235, 9, 4,
    'Plástico 100% reciclado', 14500, false, 'unidad'
);

-- Tabla 2
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm,
    material, precio_unitario, incluye_iva, unidad_venta
) VALUES (
    'TAB2', 'Tabla 2', 'Tabla de madera plástica 3.5x11x116', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Maderas Plásticas'),
    116, 11, 3.5,
    'Plástico 100% reciclado', 7500, false, 'unidad'
);

-- Poste 1
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm,
    material, precio_unitario, incluye_iva, unidad_venta
) VALUES (
    'POST1', 'Poste 1', 'Poste 3.5x3.5x200', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Maderas Plásticas'),
    200, 3.5, 3.5,
    'Plástico 100% reciclado', 6000, false, 'unidad'
);

-- Poste 2
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm,
    material, precio_unitario, incluye_iva, unidad_venta
) VALUES (
    'POST2', 'Poste 2', 'Poste 6.5x6.5x240', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Maderas Plásticas'),
    240, 6.5, 6.5,
    'Plástico 100% reciclado', 15000, false, 'unidad'
);

-- Poste 3
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, ancho_cm, alto_cm,
    material, precio_unitario, incluye_iva, unidad_venta
) VALUES (
    'POST3', 'Poste 3', 'Poste 8.5x8.5x245', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Maderas Plásticas'),
    245, 8.5, 8.5,
    'Plástico 100% reciclado', 35000, false, 'unidad'
);

-- Polín
INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria,
    largo_cm, diametro_cm,
    material, precio_unitario, incluye_iva, unidad_venta
) VALUES (
    'POL1', 'Polín', 'Polín 7.5x240', 
    (SELECT id_categoria FROM categorias WHERE nombre = 'Maderas Plásticas'),
    240, 7.5,
    'Plástico 100% reciclado', 14000, false, 'unidad'
);

-- ========= ASIGNACIÓN DE ATRIBUTOS A PRODUCTOS =========

-- Asignar atributo "Waterproof" a todos los productos
INSERT INTO producto_atributos (id_producto, id_atributo)
SELECT p.id_producto, a.id_atributo
FROM productos p
CROSS JOIN atributos a
WHERE a.nombre = 'Waterproof';

-- Asignar todos los demás atributos a todos los productos
INSERT INTO producto_atributos (id_producto, id_atributo)
SELECT p.id_producto, a.id_atributo
FROM productos p
CROSS JOIN atributos a
WHERE a.nombre IN (
    'Resistente a hongos e insectos',
    'No requiere mantención',
    'No se astilla',
    '100% reciclado',
    'Uso exterior'
);

-- ========= CREACIÓN DE TRIGGERS =========

-- Función para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar fecha_actualizacion en productos
CREATE TRIGGER trigger_actualizar_fecha_productos
BEFORE UPDATE ON productos
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_modificacion();

-- ========= TABLA DE SUSCRIPCIONES PUSH =========
-- Almacena las suscripciones de Web Push para notificaciones
CREATE TABLE push_subscriptions (
    id_subscription SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE push_subscriptions IS 'Suscripciones de Web Push para notificaciones en tiempo real.';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL del endpoint del servicio push del navegador';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Clave pública del cliente para cifrado';
COMMENT ON COLUMN push_subscriptions.auth IS 'Secreto de autenticación del cliente';

-- Índice para buscar suscripciones por usuario
CREATE INDEX idx_push_subscriptions_usuario ON push_subscriptions(id_usuario);

-- ========= CONSULTAS DE VERIFICACIÓN =========

-- Verificar cantidad de productos por categoría
SELECT c.nombre AS categoria, COUNT(p.id_producto) AS cantidad_productos
FROM categorias c
LEFT JOIN productos p ON c.id_categoria = p.id_categoria
GROUP BY c.nombre
ORDER BY cantidad_productos DESC;

-- Verificar productos que requieren presupuesto
SELECT codigo, nombre, requiere_presupuesto
FROM productos
WHERE requiere_presupuesto = true;

-- Verificar productos con sus precios
SELECT codigo, nombre, precio_unitario, incluye_iva, moneda
FROM productos
WHERE precio_unitario IS NOT NULL
ORDER BY precio_unitario DESC;

-- Verificar estructura completa creada
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========= FIN DEL SCRIPT UNIFICADO =========

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

-- Asignar atributo "Waterproof" a todos los productos (todos lo tienen según el catálogo)
INSERT INTO producto_atributos (id_producto, id_atributo)
SELECT p.id_producto, a.id_atributo
FROM productos p
CROSS JOIN atributos a
WHERE a.nombre = 'Waterproof';

-- Asignar todos los demás atributos a todos los productos
-- (según el catálogo, todos los productos comparten estas características)
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

-- ========= TRIGGER PARA ACTUALIZAR fecha_actualizacion =========
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_fecha_productos
BEFORE UPDATE ON productos
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_modificacion();

-- ========= VERIFICACIÓN DE DATOS INSERTADOS =========
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
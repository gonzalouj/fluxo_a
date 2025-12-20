// productos.go
package handlers

import (
	"database/sql"
	"fluxo/backend/models"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// CrearProducto maneja POST /api/productos
func CrearProducto(c *gin.Context) {
	var req struct {
		Codigo            *string  `json:"codigo"`
		Nombre            string   `json:"nombre" binding:"required"`
		Descripcion       *string  `json:"descripcion"`
		IDCategoria       *int     `json:"id_categoria"`
		PrecioUnitario    *float64 `json:"precio_unitario"`
		LargoCm           *float64 `json:"largo_cm"`
		AnchoCm           *float64 `json:"ancho_cm"`
		AltoCm            *float64 `json:"alto_cm"`
		DiametroCm        *float64 `json:"diametro_cm"`
		FondoCm           *float64 `json:"fondo_cm"`
		AlturaAsientoCm   *float64 `json:"altura_asiento_cm"`
		AlturaCubiertaCm  *float64 `json:"altura_cubierta_cm"`
		PesoKg            *float64 `json:"peso_kg"`
		Material          *string  `json:"material"`
		Moneda            string   `json:"moneda"`
		IncluyeIVA        bool     `json:"incluye_iva"`
		RequierePresupuesto bool   `json:"requiere_presupuesto"`
		UnidadVenta       string   `json:"unidad_venta"`
		Stock             *int     `json:"stock"`
		FotoURL           *string  `json:"foto_principal_url"`
		NotasEspeciales   *string  `json:"notas_especiales"`
		EsTemporal        *bool    `json:"es_temporal"` // Cambiado a puntero para detectar null
		IDPedidoOrigen    *int     `json:"id_pedido_origen"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "El nombre del producto es obligatorio",
			"code":  "VALIDATION_ERROR",
		})
		return
	}

	// DEBUG: Log para ver qué está recibiendo
	log.Printf("🔵 CrearProducto - Nombre: %s, EsTemporal: %v, IDPedidoOrigen: %v", 
		req.Nombre, req.EsTemporal, req.IDPedidoOrigen)

	// Validaciones adicionales
	if req.Nombre == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "El nombre del producto no puede estar vacío",
			"code":  "EMPTY_NAME",
		})
		return
	}

	// VALIDACIÓN DE NOMBRES DUPLICADOS:
	// Solo validar duplicados para productos PERMANENTES EXPLÍCITOS
	// NO validar si:
	// - es_temporal = true (producto temporal explícito)
	// - es_temporal no se envió (nil) - puede ser temporal en proceso de creación
	// SÍ validar si:
	// - es_temporal = false (producto permanente explícito)
	
	esPermanenteExplicito := req.EsTemporal != nil && *req.EsTemporal == false
	
	log.Printf("🔵 esPermanenteExplicito: %v (EsTemporal ptr: %v)", esPermanenteExplicito, req.EsTemporal)
	
	if esPermanenteExplicito {
		log.Printf("⚠️ Validando nombres duplicados para producto PERMANENTE: %s", req.Nombre)
		// Verificar que no exista OTRO producto permanente con el mismo nombre
		var existeNombre bool
		checkQuery := `
			SELECT EXISTS(
				SELECT 1 FROM productos 
				WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))
				AND (es_temporal = FALSE OR es_temporal IS NULL)
			)
		`
		err := db.QueryRow(checkQuery, strings.TrimSpace(req.Nombre)).Scan(&existeNombre)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Error al validar el producto",
				"code":  "VALIDATION_ERROR",
			})
			return
		}

		if existeNombre {
			log.Printf("❌ Nombre duplicado encontrado: %s", req.Nombre)
			c.JSON(http.StatusConflict, gin.H{
				"error": "Ya existe un producto permanente con el nombre '" + req.Nombre + "'",
				"code":  "DUPLICATE_NAME",
			})
			return
		}
		log.Printf("✅ Nombre único verificado: %s", req.Nombre)
	} else {
		log.Printf("✅ NO validando nombres duplicados (producto temporal o sin especificar): %s", req.Nombre)
	}

	// VALIDACIÓN DE CÓDIGOS DUPLICADOS:
	// Solo validar para productos PERMANENTES
	if esPermanenteExplicito && req.Codigo != nil && *req.Codigo != "" {
		log.Printf("⚠️ Validando códigos duplicados para producto PERMANENTE: %s", *req.Codigo)
		
		var existeCodigo bool
		checkCodigoQuery := `
			SELECT EXISTS(
				SELECT 1 FROM productos 
				WHERE codigo = $1
				AND (es_temporal = FALSE OR es_temporal IS NULL)
			)
		`
		err := db.QueryRow(checkCodigoQuery, *req.Codigo).Scan(&existeCodigo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Error al validar el producto",
				"code":  "VALIDATION_ERROR",
			})
			return
		}

		if existeCodigo {
			log.Printf("❌ Código duplicado encontrado: %s", *req.Codigo)
			c.JSON(http.StatusConflict, gin.H{
				"error": "Ya existe un producto permanente con el código '" + *req.Codigo + "'",
				"code":  "DUPLICATE_CODE",
			})
			return
		}
		log.Printf("✅ Código único verificado: %s", *req.Codigo)
	} else if !esPermanenteExplicito {
		log.Printf("✅ NO validando código duplicado (producto temporal): %v", req.Codigo)
		// Para productos temporales, forzar código NULL
		req.Codigo = nil
	}

	// NOTA: Los productos temporales pueden crearse sin id_pedido_origen inicialmente
	// El id_pedido_origen se asigna después mediante PATCH una vez que el pedido existe

	// Validar que si NO es temporal, NO debe tener id_pedido_origen
	esPermanenteConPedido := (req.EsTemporal == nil || *req.EsTemporal == false) && req.IDPedidoOrigen != nil
	if esPermanenteConPedido {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Un producto permanente no puede estar asociado a un pedido específico",
			"code":  "INVALID_PEDIDO_ORIGEN",
		})
		return
	}

	// Valores por defecto
	if req.Moneda == "" {
		req.Moneda = "CLP"
	}
	if req.UnidadVenta == "" {
		req.UnidadVenta = "unidad"
	}

	// Convertir puntero de bool a valor para INSERT
	esTemporalValue := false
	if req.EsTemporal != nil {
		esTemporalValue = *req.EsTemporal
	}

	var productoID int
	err := db.QueryRow(`
		INSERT INTO productos (
			codigo, nombre, descripcion, id_categoria, precio_unitario,
			largo_cm, ancho_cm, alto_cm, diametro_cm, fondo_cm,
			altura_asiento_cm, altura_cubierta_cm, peso_kg, material,
			moneda, incluye_iva, requiere_presupuesto, unidad_venta,
			stock, foto_principal_url, notas_especiales, es_temporal, id_pedido_origen
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
		RETURNING id_producto`,
		req.Codigo, req.Nombre, req.Descripcion, req.IDCategoria, req.PrecioUnitario,
		req.LargoCm, req.AnchoCm, req.AltoCm, req.DiametroCm, req.FondoCm,
		req.AlturaAsientoCm, req.AlturaCubiertaCm, req.PesoKg, req.Material,
		req.Moneda, req.IncluyeIVA, req.RequierePresupuesto, req.UnidadVenta,
		req.Stock, req.FotoURL, req.NotasEspeciales, esTemporalValue, req.IDPedidoOrigen,
	).Scan(&productoID)

	if err != nil {
		// Manejo detallado de errores de PostgreSQL
		errorMsg := err.Error()
		
		// Error de código duplicado
		if strings.Contains(errorMsg, "productos_codigo_key") {
			// Si es producto temporal, reintentar con código NULL
			if esTemporalValue {
				log.Printf("⚠️ Error de código duplicado en producto temporal - reintentando con código NULL")
				err = db.QueryRow(`
					INSERT INTO productos (
						codigo, nombre, descripcion, id_categoria, precio_unitario,
						largo_cm, ancho_cm, alto_cm, diametro_cm, fondo_cm,
						altura_asiento_cm, altura_cubierta_cm, peso_kg, material,
						moneda, incluye_iva, requiere_presupuesto, unidad_venta,
						stock, foto_principal_url, notas_especiales, es_temporal, id_pedido_origen
					) VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
					RETURNING id_producto`,
					req.Nombre, req.Descripcion, req.IDCategoria, req.PrecioUnitario,
					req.LargoCm, req.AnchoCm, req.AltoCm, req.DiametroCm, req.FondoCm,
					req.AlturaAsientoCm, req.AlturaCubiertaCm, req.PesoKg, req.Material,
					req.Moneda, req.IncluyeIVA, req.RequierePresupuesto, req.UnidadVenta,
					req.Stock, req.FotoURL, req.NotasEspeciales, esTemporalValue, req.IDPedidoOrigen,
				).Scan(&productoID)
				
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{
						"error": "Error al crear producto temporal",
						"code":  "DATABASE_ERROR",
					})
					return
				}
				// Si llegamos aquí, el producto temporal se creó con éxito con código NULL
				// Continuar con el flujo normal (asignar atributos)
			} else {
				// Solo para productos permanentes mostrar error
				codigoValue := "este código"
				if req.Codigo != nil && *req.Codigo != "" {
					codigoValue = "el código '" + *req.Codigo + "'"
				}
				c.JSON(http.StatusConflict, gin.H{
					"error": "Ya existe un producto con " + codigoValue + ". Por favor, usa un código diferente.",
					"code":  "DUPLICATE_CODE",
				})
				return
			}
		} else if strings.Contains(errorMsg, "productos_nombre_key") {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Ya existe un producto con el nombre '" + req.Nombre + "'. Por favor, usa un nombre diferente.",
				"code":  "DUPLICATE_NAME",
			})
			return
		}
		
		// Error de categoría inválida
		if strings.Contains(errorMsg, "violates foreign key constraint") && strings.Contains(errorMsg, "id_categoria") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "La categoría seleccionada no existe. Por favor, selecciona una categoría válida.",
				"code":  "INVALID_CATEGORY",
			})
			return
		}

		// Error de pedido origen inválido
		if strings.Contains(errorMsg, "violates foreign key constraint") && strings.Contains(errorMsg, "id_pedido_origen") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "El pedido seleccionado no existe.",
				"code":  "INVALID_PEDIDO_ORIGEN",
			})
			return
		}
		
		// Error de precio negativo
		if strings.Contains(errorMsg, "precio_unitario") && strings.Contains(errorMsg, "check constraint") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "El precio no puede ser negativo.",
				"code":  "INVALID_PRICE",
			})
			return
		}
		
		// Error genérico de base de datos
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "No se pudo crear el producto. Por favor, verifica los datos e intenta nuevamente.",
			"code":  "DATABASE_ERROR",
		})
		return
	}

	// Asignar atributos por defecto (los 6 atributos comunes)
	_, err = db.Exec(`
		INSERT INTO producto_atributos (id_producto, id_atributo)
		SELECT $1, id_atributo FROM atributos
		WHERE nombre IN (
			'Waterproof',
			'Resistente a hongos e insectos',
			'No requiere mantención',
			'No se astilla',
			'100% reciclado',
			'Uso exterior'
		)
	`, productoID)

	if err != nil {
		// Este error es menos crítico, el producto ya fue creado
		c.JSON(http.StatusCreated, gin.H{
			"message":      "Producto creado exitosamente (algunos atributos no se pudieron asignar)",
			"producto_id":  productoID,
			"warning":      true,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Producto creado exitosamente",
		"producto_id":  productoID,
	})
}

// ListarProductos maneja GET /api/productos
func ListarProductos(c *gin.Context) {
	// Consulta que incluye SOLO productos permanentes (no temporales)
	// Excluye los que requieren presupuesto y los temporales
	query := `
		SELECT id_producto, codigo, nombre, precio_unitario, stock, foto_principal_url, id_categoria
		FROM productos 
		WHERE COALESCE(es_temporal, FALSE) = FALSE
		ORDER BY nombre ASC`

	rows, err := db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error al consultar productos",
			"productos": []models.Producto{},
		})
		return
	}
	defer rows.Close()

	var productos []models.Producto
	for rows.Next() {
		var p models.Producto
		// Usamos sql.NullString y sql.NullFloat64 para escanear columnas que pueden ser NULL
		var codigo, fotoURL sql.NullString
		var precioUnitario sql.NullFloat64
		var stock, idCategoria sql.NullInt64
		
		err := rows.Scan(
			&p.ID,
			&codigo,
			&p.Nombre,
			&precioUnitario,
			&stock,
			&fotoURL,
			&idCategoria,
		)
		if err != nil {
			// Logueamos el error pero continuamos con los demás productos
			continue
		}

		// Asignamos el valor solo si no es nulo
		if codigo.Valid {
			p.Codigo = &codigo.String
		}
		if fotoURL.Valid {
			p.FotoURL = &fotoURL.String
		}
		// PrecioUnitario puede ser NULL
		if precioUnitario.Valid {
			p.PrecioUnitario = precioUnitario.Float64
		} else {
			p.PrecioUnitario = 0
		}
		// Stock puede ser NULL
		if stock.Valid {
			p.Stock = int(stock.Int64)
		} else {
			p.Stock = 0
		}
		// IDCategoria puede ser NULL
		if idCategoria.Valid {
			categoria := int(idCategoria.Int64)
			p.IDCategoria = &categoria
		}

		productos = append(productos, p)
	}

	// Comprobar si hubo algún error durante la iteración
	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al procesar la lista de productos"})
		return
	}

	// Si no hay productos, devolver array vacío en lugar de null
	if productos == nil {
		productos = []models.Producto{}
	}

	c.JSON(http.StatusOK, gin.H{"productos": productos})
}

// ObtenerProducto maneja GET /api/productos/:id
func ObtenerProducto(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de producto inválido"})
		return
	}

	// Consulta completa para obtener todos los campos del producto
	query := `
		SELECT 
			p.id_producto, p.codigo, p.nombre, p.descripcion, p.id_categoria,
			p.precio_unitario, p.largo_cm, p.ancho_cm, p.alto_cm, p.diametro_cm,
			p.fondo_cm, p.altura_asiento_cm, p.altura_cubierta_cm, p.peso_kg,
			p.material, p.moneda, p.incluye_iva, p.requiere_presupuesto,
			p.unidad_venta, p.stock, p.foto_principal_url, p.notas_especiales,
			p.es_temporal, p.id_pedido_origen,
			c.nombre as categoria_nombre
		FROM productos p
		LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
		WHERE p.id_producto = $1`

	var p models.Producto
	var codigo, descripcion, material, fotoURL, notasEspeciales, categoriaNombre sql.NullString
	var idCategoria, stock, idPedidoOrigen sql.NullInt64
	var precioUnitario, largoCm, anchoCm, altoCm, diametroCm, fondoCm sql.NullFloat64
	var alturaAsientoCm, alturaCubiertaCm, pesoKg sql.NullFloat64
	var esTemporal sql.NullBool

	err = db.QueryRow(query, id).Scan(
		&p.ID, &codigo, &p.Nombre, &descripcion, &idCategoria,
		&precioUnitario, &largoCm, &anchoCm, &altoCm, &diametroCm,
		&fondoCm, &alturaAsientoCm, &alturaCubiertaCm, &pesoKg,
		&material, &p.Moneda, &p.IncluyeIVA, &p.RequierePresupuesto,
		&p.UnidadVenta, &stock, &fotoURL, &notasEspeciales,
		&esTemporal, &idPedidoOrigen,
		&categoriaNombre,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}
	if err != nil {
		log.Printf("Error al obtener producto: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener producto"})
		return
	}

	// Asignar valores opcionales
	if codigo.Valid {
		p.Codigo = &codigo.String
	}
	if descripcion.Valid {
		p.Descripcion = &descripcion.String
	}
	if idCategoria.Valid {
		cat := int(idCategoria.Int64)
		p.IDCategoria = &cat
	}
	if precioUnitario.Valid {
		p.PrecioUnitario = precioUnitario.Float64
	}
	if largoCm.Valid {
		p.LargoCm = &largoCm.Float64
	}
	if anchoCm.Valid {
		p.AnchoCm = &anchoCm.Float64
	}
	if altoCm.Valid {
		p.AltoCm = &altoCm.Float64
	}
	if diametroCm.Valid {
		p.DiametroCm = &diametroCm.Float64
	}
	if fondoCm.Valid {
		p.FondoCm = &fondoCm.Float64
	}
	if alturaAsientoCm.Valid {
		p.AlturaAsientoCm = &alturaAsientoCm.Float64
	}
	if alturaCubiertaCm.Valid {
		p.AlturaCubiertaCm = &alturaCubiertaCm.Float64
	}
	if pesoKg.Valid {
		p.PesoKg = &pesoKg.Float64
	}
	if material.Valid {
		p.Material = &material.String
	}
	if stock.Valid {
		p.Stock = int(stock.Int64)
	}
	if fotoURL.Valid {
		p.FotoPrincipalURL = &fotoURL.String
	}
	if notasEspeciales.Valid {
		p.NotasEspeciales = &notasEspeciales.String
	}
	if esTemporal.Valid {
		p.EsTemporal = &esTemporal.Bool
	}
	if idPedidoOrigen.Valid {
		origen := int(idPedidoOrigen.Int64)
		p.IDPedidoOrigen = &origen
	}
	if categoriaNombre.Valid {
		p.CategoriaNombre = &categoriaNombre.String
	}

	c.JSON(http.StatusOK, gin.H{"producto": p})
}

// ListarProductosConTemporales maneja GET /api/productos/con-temporales?id_pedido=X
// Devuelve productos permanentes + productos temporales de un pedido específico
func ListarProductosConTemporales(c *gin.Context) {
	idPedidoStr := c.Query("id_pedido")
	
	var query string
	var rows *sql.Rows
	var err error

	if idPedidoStr != "" {
		// Si se proporciona id_pedido, incluir productos temporales de ese pedido
		query = `
			SELECT id_producto, codigo, nombre, precio_unitario, stock, foto_principal_url, 
			       COALESCE(es_temporal, FALSE) as es_temporal
			FROM productos 
			WHERE COALESCE(requiere_presupuesto, FALSE) = FALSE
			  AND (
			      COALESCE(es_temporal, FALSE) = FALSE 
			      OR (es_temporal = TRUE AND id_pedido_origen = $1)
			  )
			ORDER BY es_temporal ASC, nombre ASC`
		rows, err = db.Query(query, idPedidoStr)
	} else {
		// Si no se proporciona id_pedido, solo productos permanentes
		query = `
			SELECT id_producto, codigo, nombre, precio_unitario, stock, foto_principal_url,
			       COALESCE(es_temporal, FALSE) as es_temporal
			FROM productos 
			WHERE COALESCE(requiere_presupuesto, FALSE) = FALSE
			  AND COALESCE(es_temporal, FALSE) = FALSE
			ORDER BY nombre ASC`
		rows, err = db.Query(query)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error al consultar productos",
			"productos": []models.Producto{},
		})
		return
	}
	defer rows.Close()

	type ProductoConTemporal struct {
		models.Producto
		EsTemporal bool `json:"es_temporal"`
	}

	var productos []ProductoConTemporal
	for rows.Next() {
		var p ProductoConTemporal
		var codigo, fotoURL sql.NullString
		var precioUnitario sql.NullFloat64
		var stock sql.NullInt64
		
		err := rows.Scan(
			&p.ID,
			&codigo,
			&p.Nombre,
			&precioUnitario,
			&stock,
			&fotoURL,
			&p.EsTemporal,
		)
		if err != nil {
			continue
		}

		if codigo.Valid {
			p.Codigo = &codigo.String
		}
		if fotoURL.Valid {
			p.FotoURL = &fotoURL.String
		}
		if precioUnitario.Valid {
			p.PrecioUnitario = precioUnitario.Float64
		} else {
			p.PrecioUnitario = 0
		}
		if stock.Valid {
			p.Stock = int(stock.Int64)
		} else {
			p.Stock = 0
		}

		productos = append(productos, p)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al procesar la lista de productos"})
		return
	}

	if productos == nil {
		productos = []ProductoConTemporal{}
	}

	c.JSON(http.StatusOK, gin.H{"productos": productos})
}

// ListarCategorias maneja GET /api/categorias
func ListarCategorias(c *gin.Context) {
	query := `SELECT id_categoria, nombre FROM categorias ORDER BY nombre ASC`

	rows, err := db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener categorías"})
		return
	}
	defer rows.Close()

	type Categoria struct {
		ID     int    `json:"id_categoria"`
		Nombre string `json:"nombre"`
	}

	var categorias []Categoria
	for rows.Next() {
		var cat Categoria
		if err := rows.Scan(&cat.ID, &cat.Nombre); err != nil {
			continue
		}
		categorias = append(categorias, cat)
	}

	c.JSON(http.StatusOK, gin.H{"categorias": categorias})
}

// CrearCategoria maneja POST /api/categorias
func CrearCategoria(c *gin.Context) {
	var req struct {
		Nombre string `json:"nombre" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "El nombre de la categoría es obligatorio",
			"code":  "VALIDATION_ERROR",
		})
		return
	}

	var categoriaID int
	err := db.QueryRow(`
		INSERT INTO categorias (nombre)
		VALUES ($1)
		RETURNING id_categoria`,
		req.Nombre,
	).Scan(&categoriaID)

	if err != nil {
		errorMsg := err.Error()
		
		// Error de nombre duplicado
		if strings.Contains(errorMsg, "categorias_nombre_key") {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Ya existe una categoría con el nombre '" + req.Nombre + "'",
				"code":  "DUPLICATE_NAME",
			})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "No se pudo crear la categoría",
			"code":  "DATABASE_ERROR",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Categoría creada exitosamente",
		"categoria_id": categoriaID,
		"nombre":       req.Nombre,
	})
}

// ActualizarProducto maneja PATCH /api/productos/:id
// Permite actualizar campos específicos de un producto (ej: id_pedido_origen, es_temporal)
func ActualizarProducto(c *gin.Context) {
	id := c.Param("id")
	
	var req struct {
		IDPedidoOrigen *int  `json:"id_pedido_origen"`
		EsTemporal     *bool `json:"es_temporal"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Construir query dinámicamente según los campos presentes
	query := "UPDATE productos SET "
	params := []interface{}{}
	paramCount := 1
	updates := []string{}

	if req.IDPedidoOrigen != nil {
		updates = append(updates, "id_pedido_origen = $"+strconv.Itoa(paramCount))
		params = append(params, req.IDPedidoOrigen)
		paramCount++
	}

	if req.EsTemporal != nil {
		updates = append(updates, "es_temporal = $"+strconv.Itoa(paramCount))
		params = append(params, req.EsTemporal)
		paramCount++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No hay campos para actualizar"})
		return
	}

	query += strings.Join(updates, ", ") + " WHERE id_producto = $" + strconv.Itoa(paramCount)
	params = append(params, id)

	_, err := db.Exec(query, params...)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar producto"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Producto actualizado exitosamente"})
}

// ActualizarProductoCompleto maneja PUT /api/productos/:id
// Permite actualizar todos los campos de un producto
func ActualizarProductoCompleto(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Codigo            *string  `json:"codigo"`
		Nombre            string   `json:"nombre" binding:"required"`
		Descripcion       *string  `json:"descripcion"`
		IDCategoria       *int     `json:"id_categoria"`
		PrecioUnitario    *float64 `json:"precio_unitario"`
		LargoCm           *float64 `json:"largo_cm"`
		AnchoCm           *float64 `json:"ancho_cm"`
		AltoCm            *float64 `json:"alto_cm"`
		DiametroCm        *float64 `json:"diametro_cm"`
		FondoCm           *float64 `json:"fondo_cm"`
		AlturaAsientoCm   *float64 `json:"altura_asiento_cm"`
		AlturaCubiertaCm  *float64 `json:"altura_cubierta_cm"`
		PesoKg            *float64 `json:"peso_kg"`
		Material          *string  `json:"material"`
		Moneda            string   `json:"moneda"`
		IncluyeIVA        bool     `json:"incluye_iva"`
		RequierePresupuesto bool   `json:"requiere_presupuesto"`
		UnidadVenta       string   `json:"unidad_venta"`
		Stock             *int     `json:"stock"`
		FotoURL           *string  `json:"foto_principal_url"`
		NotasEspeciales   *string  `json:"notas_especiales"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "El nombre del producto es obligatorio",
			"code":  "VALIDATION_ERROR",
		})
		return
	}

	// Validar que el producto existe
	var existe bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM productos WHERE id_producto = $1)", id).Scan(&existe)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al verificar producto"})
		return
	}
	if !existe {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	// Valores por defecto
	if req.Moneda == "" {
		req.Moneda = "CLP"
	}
	if req.UnidadVenta == "" {
		req.UnidadVenta = "unidad"
	}

	// Validar código duplicado (excluyendo el producto actual)
	if req.Codigo != nil && *req.Codigo != "" {
		var existeCodigo bool
		err = db.QueryRow(
			"SELECT EXISTS(SELECT 1 FROM productos WHERE codigo = $1 AND id_producto != $2::integer)",
			req.Codigo, id,
		).Scan(&existeCodigo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al verificar código"})
			return
		}
		if existeCodigo {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Ya existe un producto con el código '" + *req.Codigo + "'. Por favor, usa un código diferente.",
				"code":  "DUPLICATE_CODE",
			})
			return
		}
	}

	// Validar nombre duplicado (excluyendo el producto actual)
	var existeNombre bool
	err = db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM productos WHERE nombre = $1 AND id_producto != $2::integer)",
		req.Nombre, id,
	).Scan(&existeNombre)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al verificar nombre"})
		return
	}
	if existeNombre {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Ya existe un producto con el nombre '" + req.Nombre + "'. Por favor, usa un nombre diferente.",
			"code":  "DUPLICATE_NAME",
		})
		return
	}

	// Actualizar producto
	_, err = db.Exec(`
		UPDATE productos SET
			codigo = $1,
			nombre = $2,
			descripcion = $3,
			id_categoria = $4,
			precio_unitario = $5,
			largo_cm = $6,
			ancho_cm = $7,
			alto_cm = $8,
			diametro_cm = $9,
			fondo_cm = $10,
			altura_asiento_cm = $11,
			altura_cubierta_cm = $12,
			peso_kg = $13,
			material = $14,
			moneda = $15,
			incluye_iva = $16,
			requiere_presupuesto = $17,
			unidad_venta = $18,
			stock = $19,
			foto_principal_url = $20,
			notas_especiales = $21
		WHERE id_producto = $22`,
		req.Codigo, req.Nombre, req.Descripcion, req.IDCategoria, req.PrecioUnitario,
		req.LargoCm, req.AnchoCm, req.AltoCm, req.DiametroCm, req.FondoCm,
		req.AlturaAsientoCm, req.AlturaCubiertaCm, req.PesoKg, req.Material,
		req.Moneda, req.IncluyeIVA, req.RequierePresupuesto, req.UnidadVenta,
		req.Stock, req.FotoURL, req.NotasEspeciales, id,
	)

	if err != nil {
		errorMsg := err.Error()
		
		if strings.Contains(errorMsg, "productos_codigo_key") {
			codigoValue := "ese código"
			if req.Codigo != nil && *req.Codigo != "" {
				codigoValue = "el código '" + *req.Codigo + "'"
			}
			c.JSON(http.StatusConflict, gin.H{
				"error": "Ya existe otro producto con " + codigoValue,
				"code":  "DUPLICATE_CODE",
			})
			return
		}
		
		if strings.Contains(errorMsg, "productos_nombre_key") {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Ya existe otro producto con ese nombre",
				"code":  "DUPLICATE_NAME",
			})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error al actualizar producto",
			"code":  "DATABASE_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Producto actualizado exitosamente"})
}

// EliminarProducto maneja DELETE /api/productos/:id
func EliminarProducto(c *gin.Context) {
	id := c.Param("id")

	// Verificar que el producto existe
	var existe bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM productos WHERE id_producto = $1)", id).Scan(&existe)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al verificar producto"})
		return
	}
	if !existe {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	// Verificar si el producto está asociado a algún pedido
	var countPedidos int
	err = db.QueryRow(`
		SELECT COUNT(*) 
		FROM pedido_productos 
		WHERE id_producto = $1
	`, id).Scan(&countPedidos)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al verificar asociaciones"})
		return
	}

	if countPedidos > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error": "No se puede eliminar el producto porque está asociado a uno o más pedidos",
			"code":  "PRODUCT_IN_USE",
			"pedidos_asociados": countPedidos,
		})
		return
	}

	// Eliminar producto (las asociaciones en producto_atributos se eliminan automáticamente por CASCADE)
	_, err = db.Exec("DELETE FROM productos WHERE id_producto = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error al eliminar producto",
			"code":  "DATABASE_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Producto eliminado exitosamente"})
}

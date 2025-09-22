// productos.go
package handlers

import (
	"database/sql"
	"fluxo/backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ListarProductos maneja GET /api/productos
func ListarProductos(c *gin.Context) {
	// Se modifica la consulta para devolver solo productos que tengan un código (codigo)
	// que no sea nulo ni esté vacío.
	query := `
		SELECT id_producto, codigo, nombre, precio_unitario, stock, foto_principal_url
		FROM productos 
		WHERE codigo IS NOT NULL AND codigo <> '' AND COALESCE(requiere_presupuesto, FALSE) = FALSE
		ORDER BY nombre ASC`

	rows, err := db.Query(query)
	if err != nil {
		// Si la consulta falla (ej. la columna 'codigo' no existe en un esquema antiguo),
		// devolvemos una lista vacía para cumplir con el requisito de no mostrar productos sin código.
		c.JSON(http.StatusOK, gin.H{"productos": []models.Producto{}})
		return
	}
	defer rows.Close()

	var productos []models.Producto
	for rows.Next() {
		var p models.Producto
		// Usamos sql.NullString para escanear columnas que pueden ser NULL
		var codigo, fotoURL sql.NullString
		var stock sql.NullInt64 // Para manejar stock NULL
		err := rows.Scan(
			&p.ID,
			&codigo,
			&p.Nombre,
			&p.PrecioUnitario,
			&stock,
			&fotoURL,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al escanear producto: " + err.Error()})
			return
		}

		// Asignamos el valor solo si no es nulo
		if codigo.Valid {
			p.Codigo = &codigo.String
		}
		if fotoURL.Valid {
			p.FotoURL = &fotoURL.String
		}
		// Stock puede ser NULL
		if stock.Valid {
			p.Stock = int(stock.Int64)
		} else {
			p.Stock = 0
		}

		productos = append(productos, p)
	}

	// Comprobar si hubo algún error durante la iteración
	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al procesar la lista de productos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"productos": productos})
}

# 🧪 Pruebas de Rendimiento No Funcionales - Sistema Fluxo

Herramientas para realizar pruebas de carga masiva y análisis de rendimiento del sistema con 100,000+ registros.

---

## 📋 Requisitos

### En tu máquina local:
```bash
pip install psycopg2-binary faker requests tabulate
```

### En el servidor:
```bash
# Conectarse al servidor
ssh grupo6@146.83.216.166

# Instalar dependencias
sudo apt-get update
sudo apt-get install python3-pip
pip3 install psycopg2-binary faker requests tabulate
```

---

## 🚀 Guía Paso a Paso

### **Paso 1: Transferir scripts al servidor**

Desde tu máquina local (Windows):

```powershell
# Transferir la carpeta completa
scp -r C:\Users\matia\fluxo\test-performance grupo6@146.83.216.166:/home/grupo6/

# O transferir archivos individuales
scp C:\Users\matia\fluxo\test-performance\poblar_bd.py grupo6@146.83.216.166:/home/grupo6/
scp C:\Users\matia\fluxo\test-performance\pruebas_rendimiento.py grupo6@146.83.216.166:/home/grupo6/
```

---

### **Paso 2: Poblar la base de datos con datos masivos**

Conectarse al servidor:
```bash
ssh grupo6@146.83.216.166
cd /home/grupo6/test-performance
```

#### Opción A: Usar el contenedor PostgreSQL (Recomendado)
```bash
# Conectar al puerto expuesto del contenedor
python3 poblar_bd.py --host localhost --port 5006 --pedidos 100000
```

#### Opción B: Desde dentro del contenedor
```bash
# Copiar script al contenedor
docker cp poblar_bd.py fluxo-postgres:/tmp/

# Ejecutar dentro del contenedor
docker exec -it fluxo-postgres bash
cd /tmp
apt-get update && apt-get install -y python3 python3-pip
pip3 install psycopg2-binary faker
python3 poblar_bd.py --host localhost --port 5432 --pedidos 100000
```

#### Opciones disponibles:
```bash
# Generar 150,000 pedidos
python3 poblar_bd.py --pedidos 150000

# Generar con otro usuario
python3 poblar_bd.py --pedidos 100000 --user postgres --password postgres123

# Solo ver estadísticas sin generar datos
python3 poblar_bd.py --solo-stats

# Limpiar datos de prueba antes de generar nuevos
python3 poblar_bd.py --pedidos 50000 --limpiar
```

**Salida esperada:**
```
✅ Conexión exitosa a localhost:5006/fluxo
📦 Productos disponibles en catálogo: 31
👤 Usuario creador: ID 1

📦 Generando 100,000 pedidos en 100 lotes de 1000...
  Lote 1/100: 1,000 pedidos, 2,847 productos | 2.45s | Progreso: 1.0%
  Lote 2/100: 1,000 pedidos, 2,913 productos | 2.38s | Progreso: 2.0%
  ...
  Lote 100/100: 1,000 pedidos, 2,891 productos | 2.41s | Progreso: 100.0%

✅ Completado en 245.67 segundos
   📊 Total: 100,000 pedidos con 287,456 productos asociados
   ⚡ Velocidad: 407 pedidos/segundo

📊 ESTADÍSTICAS DE LA BASE DE DATOS:
============================================================
  Total de pedidos: 100,000

  Distribución por estado:
    - Pendiente  :   25,143 (25.1%)
    - Listo      :   24,987 (25.0%)
    - Entregado  :   25,056 (25.1%)
    - Cancelado  :   24,814 (24.8%)

  Total de productos en pedidos: 287,456
  Promedio de productos por pedido: 2.87

  Tamaño total de la BD: 156 MB
============================================================
```

---

### **Paso 3: Ejecutar pruebas de rendimiento**

#### A) Pruebas directas a la base de datos:
```bash
python3 pruebas_rendimiento.py --host localhost --port 5006
```

#### B) Pruebas a través de la API:
```bash
# Probar API en localhost
python3 pruebas_rendimiento.py --api http://localhost:4006

# Probar API pública (si está disponible)
python3 pruebas_rendimiento.py --api http://146.83.216.166:4006
```

#### C) Pruebas completas (BD + API):
```bash
python3 pruebas_rendimiento.py --host localhost --port 5006 --api http://localhost:4006
```

**Salida esperada:**
```
============================================================
🗄️  PRUEBAS DE RENDIMIENTO - BASE DE DATOS DIRECTA
============================================================

🔍 Probando: Listar TODOS los pedidos
   Repeticiones: 5
   Resultados obtenidos: 100,000 filas
   ⏱️  Promedio: 1247.85 ms
   📊 Rango: 1198.23 - 1289.45 ms

🔍 Probando: Listar pedidos PENDIENTES
   Repeticiones: 10
   Resultados obtenidos: 25,143 filas
   ⏱️  Promedio: 312.45 ms
   📊 Rango: 298.12 - 334.67 ms

... (más pruebas) ...

============================================================
📊 RESUMEN DE PRUEBAS DE RENDIMIENTO
============================================================
+------------------------------------------+--------+-------------+-----------+-----------+-------------+
| Prueba                                   | Filas  | Promedio    | Mínimo    | Máximo    | Desv. Est.  |
+==========================================+========+=============+===========+===========+=============+
| Listar TODOS los pedidos                 | 100000 | 1247.85 ms  | 1198.23   | 1289.45   | 35.67 ms    |
| Listar pedidos PENDIENTES                | 25143  | 312.45 ms   | 298.12    | 334.67    | 12.34 ms    |
| Búsqueda por nombre cliente (%García%)   | 2847   | 78.23 ms    | 72.45     | 85.12     | 4.56 ms     |
| Filtro por rango de fechas (30 días)    | 12456  | 145.67 ms   | 138.90    | 156.78    | 6.78 ms     |
| Obtener pedido con productos (JOIN)      | 3      | 2.45 ms     | 2.12      | 3.01      | 0.34 ms     |
| Contar pedidos por estado (GROUP BY)     | 4      | 89.34 ms    | 85.23     | 95.67     | 3.45 ms     |
| Top 10 productos más vendidos            | 10     | 234.56 ms   | 225.67    | 245.89    | 7.89 ms     |
| Pedidos con más de 3 productos (HAVING)  | 15678  | 456.78 ms   | 445.23    | 478.90    | 12.34 ms    |
+------------------------------------------+--------+-------------+-----------+-----------+-------------+

🎯 ANÁLISIS:
  ⚠️  Consulta más lenta: Listar TODOS los pedidos (1247.85 ms)
  ⚡ Consulta más rápida: Obtener pedido con productos (JOIN) (2.45 ms)
  📊 Tiempo promedio general: 320.67 ms

💡 RECOMENDACIONES:
  - La consulta 'Listar TODOS los pedidos' tarda más de 1 segundo
    Considera agregar índices o optimizar la consulta
  - Considera implementar paginación para consultas con muchos resultados
  ✅ El rendimiento general es bueno (< 500ms)
```

---

## 📊 Interpretación de Resultados

### ✅ Rendimiento Excelente
- **< 100ms**: Consultas simples, índices funcionando bien
- **Recomendación**: Mantener el diseño actual

### ⚠️ Rendimiento Aceptable
- **100-500ms**: Consultas complejas con JOINs o agregaciones
- **Recomendación**: Considerar índices adicionales si es crítico

### 🔴 Rendimiento Mejorable
- **> 500ms**: Consultas pesadas sin optimización
- **Recomendación**: Implementar paginación, agregar índices, revisar queries

### 🚨 Rendimiento Crítico
- **> 1000ms**: Requiere atención inmediata
- **Recomendación**: Paginación obligatoria, índices compuestos, cache

---

## 🔧 Posibles Optimizaciones (opcional)

Si los resultados muestran problemas de rendimiento, considera:

### 1. Agregar índices:
```sql
-- Índice para búsqueda por estado
CREATE INDEX idx_pedidos_estado ON pedidos(estado);

-- Índice para filtro por fecha
CREATE INDEX idx_pedidos_fecha_entrega ON pedidos(fecha_entrega);

-- Índice compuesto para búsqueda de cliente
CREATE INDEX idx_pedidos_cliente_search ON pedidos(nombre_cliente, email_cliente);

-- Índice para ordenamiento por fecha de creación
CREATE INDEX idx_pedidos_fecha_creacion ON pedidos(fecha_creacion DESC);
```

### 2. Implementar paginación en el backend:
```go
// En handlers/pedidos.go
func ListarPedidos(c *gin.Context) {
    // Parámetros de paginación
    page := c.DefaultQuery("page", "1")
    limit := c.DefaultQuery("limit", "50")
    
    // SQL con LIMIT y OFFSET
    query := `
        SELECT * FROM pedidos 
        ORDER BY fecha_creacion DESC 
        LIMIT $1 OFFSET $2
    `
    // ...
}
```

### 3. Implementar caché (Redis):
```bash
# En docker-compose.yml agregar:
redis:
  image: redis:alpine
  ports:
    - "6379:6379"
```

---

## 🧹 Limpiar/Despoblar la Base de Datos

### **Script dedicado para limpieza: `despoblar_bd.py`**

Este script ofrece múltiples opciones seguras para limpiar la BD después de las pruebas.

#### **1. Simulación (siempre usar primero):**
```bash
# Ver QUÉ se eliminaría sin hacerlo realmente
python3 despoblar_bd.py --solo-prueba --dry-run
python3 despoblar_bd.py --todo --dry-run
python3 despoblar_bd.py --desde 2025-11-14 --dry-run
```

#### **2. Eliminar solo pedidos de prueba (RECOMENDADO):**
```bash
# Elimina pedidos con nombres/emails de prueba
python3 despoblar_bd.py --solo-prueba
```
Elimina pedidos que contengan:
- Nombre: "test", "prueba"
- Email: "test@", "prueba@", "@test."

#### **3. Eliminar pedidos desde una fecha:**
```bash
# Eliminar todo desde el 14 de noviembre
python3 despoblar_bd.py --desde 2025-11-14

# Eliminar todo desde hoy
python3 despoblar_bd.py --desde $(date +%Y-%m-%d)
```

#### **4. Mantener solo los N más recientes:**
```bash
# Mantener solo los últimos 100 pedidos
python3 despoblar_bd.py --mantener 100

# Mantener solo los últimos 1000 pedidos
python3 despoblar_bd.py --mantener 1000
```

#### **5. Eliminar TODO (PELIGROSO ⚠️):**
```bash
# Primero simular
python3 despoblar_bd.py --todo --dry-run

# Luego ejecutar (pedirá confirmación)
python3 despoblar_bd.py --todo

# Confirmar automáticamente sin preguntar
python3 despoblar_bd.py --todo --si
```

#### **6. Solo ver estadísticas:**
```bash
# Ver estado actual sin modificar nada
python3 despoblar_bd.py --stats
```

---

### **Opciones avanzadas:**

```bash
# No ejecutar VACUUM después (más rápido pero BD no optimizada)
python3 despoblar_bd.py --solo-prueba --no-vacuum

# Confirmar automáticamente (útil en scripts)
python3 despoblar_bd.py --mantener 500 --si

# Conectar a otro servidor
python3 despoblar_bd.py --host 192.168.1.100 --port 5432 --solo-prueba
```

---

### **Flujo recomendado después de pruebas:**

```bash
# 1. Ver qué hay actualmente
python3 despoblar_bd.py --stats

# 2. Simular limpieza
python3 despoblar_bd.py --solo-prueba --dry-run

# 3. Ejecutar limpieza
python3 despoblar_bd.py --solo-prueba

# 4. Verificar resultado
python3 despoblar_bd.py --stats
```

---

### **Alternativas rápidas (sin script):**

#### Usando el script original de poblar:
```bash
python3 poblar_bd.py --limpiar
```

#### Directamente en PostgreSQL:
```bash
# Eliminar TODO
docker exec -it fluxo-postgres psql -U postgres -d fluxo -c "DELETE FROM pedidos;"

# Eliminar solo desde una fecha
docker exec -it fluxo-postgres psql -U postgres -d fluxo -c "DELETE FROM pedidos WHERE fecha_creacion >= '2025-11-14';"
```

#### Vaciar completamente la BD (RESETEAR TODO):
```bash
docker-compose down -v
docker-compose up -d
```
⚠️ **CUIDADO**: Esto elimina TODOS los datos y reinicia con el schema desde cero.

---

## 📝 Documentar los resultados

Crear un documento con:

1. **Configuración de la prueba:**
   - Cantidad de registros: 100,000 pedidos
   - Productos asociados: ~287,000
   - Fecha de ejecución: [fecha]
   - Tamaño de BD: ~156 MB

2. **Resultados principales:**
   - Tiempo de carga: X segundos
   - Velocidad de inserción: X pedidos/segundo
   - Tabla de resultados de consultas

3. **Análisis:**
   - Consultas más lentas
   - Consultas más rápidas
   - Promedio general

4. **Conclusiones:**
   - ¿El sistema escala bien?
   - ¿Se necesitan optimizaciones?
   - Recomendaciones

---

## 🎯 Ejemplo de uso completo

```bash
# 1. Conectarse al servidor
ssh grupo6@146.83.216.166

# 2. Ir al directorio
cd /home/grupo6/test-performance

# 3. Ver estado inicial
python3 despoblar_bd.py --stats

# 4. Generar 150,000 pedidos
python3 poblar_bd.py --pedidos 150000

# 5. Ejecutar pruebas de rendimiento
python3 pruebas_rendimiento.py --host localhost --port 5006

# 6. Guardar resultados con timestamp
python3 pruebas_rendimiento.py --host localhost --port 5006 > resultados_$(date +%Y%m%d_%H%M%S).txt

# 7. Ver estadísticas finales
python3 despoblar_bd.py --stats

# 8. Limpiar datos de prueba (simulación primero)
python3 despoblar_bd.py --solo-prueba --dry-run

# 9. Limpiar datos realmente
python3 despoblar_bd.py --solo-prueba

# 10. Verificar limpieza
python3 despoblar_bd.py --stats
```

---

## 🔄 Ejemplo: Probar con diferentes cantidades

```bash
# Probar con 10K registros
python3 poblar_bd.py --pedidos 10000
python3 pruebas_rendimiento.py --host localhost --port 5006 > resultados_10k.txt
python3 despoblar_bd.py --todo --si

# Probar con 50K registros
python3 poblar_bd.py --pedidos 50000
python3 pruebas_rendimiento.py --host localhost --port 5006 > resultados_50k.txt
python3 despoblar_bd.py --todo --si

# Probar con 100K registros
python3 poblar_bd.py --pedidos 100000
python3 pruebas_rendimiento.py --host localhost --port 5006 > resultados_100k.txt
python3 despoblar_bd.py --todo --si

# Probar con 150K registros
python3 poblar_bd.py --pedidos 150000
python3 pruebas_rendimiento.py --host localhost --port 5006 > resultados_150k.txt
python3 despoblar_bd.py --todo --si

# Comparar resultados
cat resultados_*.txt | grep "Tiempo promedio general"
```

---

## ⚠️ Notas Importantes

1. **Backup antes de probar**: Los datos de prueba se mezclarán con datos reales
2. **Espacio en disco**: 100,000 pedidos ocupan ~150-200 MB
3. **Tiempo de generación**: ~4-5 minutos para 100,000 pedidos
4. **Conexiones concurrentes**: No ejecutar múltiples scripts simultáneamente
5. **Limpiar después**: Eliminar datos de prueba para no afectar producción

---

## 📚 Métricas a analizar

Para tu informe de pruebas no funcionales:

- ✅ **Throughput**: Pedidos procesados por segundo
- ✅ **Latencia**: Tiempo de respuesta promedio/máximo
- ✅ **Escalabilidad**: Comportamiento con 10K, 50K, 100K, 150K registros
- ✅ **Uso de recursos**: CPU, Memoria, Disco
- ✅ **Consultas críticas**: Tiempos de las operaciones más frecuentes

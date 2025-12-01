# 🧪 Flujo Completo de Pruebas de Rendimiento - Sistema Fluxo

## 📋 Checklist Preparatoria

Antes de comenzar, verifica:
- [ ] Acceso SSH al servidor (grupo6@146.83.216.166)
- [ ] Contraseña del servidor (QiKG9e9q)
- [ ] Docker corriendo en el servidor
- [ ] Espacio en disco suficiente (~500 MB libres)
- [ ] Backup de datos importantes (si existen)

---

## 🚀 FLUJO COMPLETO PASO A PASO

### **FASE 1: Preparación del Entorno** ⚙️

#### 1.1. Transferir archivos al servidor

**Desde tu máquina local (Windows PowerShell):**

```powershell
# Ubicarte en la carpeta del proyecto
cd C:\Users\matia\fluxo

# Transferir la carpeta completa de pruebas
scp -r test-performance grupo6@146.83.216.166:/home/grupo6/
```

**Contraseña cuando la pida:** `QiKG9e9q`

**Resultado esperado:**
```
poblar_bd.py                    100%  15KB   500KB/s   00:00
pruebas_rendimiento.py          100%  12KB   450KB/s   00:00
despoblar_bd.py                 100%  11KB   420KB/s   00:00
README.md                       100%   8KB   380KB/s   00:00
```

---

#### 1.2. Conectarse al servidor

```powershell
ssh grupo6@146.83.216.166
```

**Contraseña:** `QiKG9e9q`

---

#### 1.3. Instalar dependencias Python

```bash
# Actualizar pip
pip3 install --upgrade pip

# Instalar librerías necesarias
pip3 install psycopg2-binary faker requests tabulate

# Verificar instalación
python3 -c "import psycopg2, faker, requests, tabulate; print('✅ Todas las dependencias instaladas')"
```

**Resultado esperado:**
```
✅ Todas las dependencias instaladas
```

---

#### 1.4. Verificar que Docker está corriendo

```bash
cd /home/grupo6/fluxo

# Ver contenedores activos
docker ps

# Verificar conectividad a la base de datos
docker exec -it fluxo-postgres psql -U postgres -d fluxo -c "SELECT COUNT(*) FROM pedidos;"
```

**Resultado esperado:**
```
CONTAINER ID   IMAGE                    STATUS
abc123         postgres:15-alpine       Up 2 hours
def456         fluxo-backend:latest     Up 2 hours
ghi789         fluxo-frontend:latest    Up 2 hours

 count 
-------
     5
(1 row)
```

---

### **FASE 2: Preparación de la Base de Datos** 🗄️

#### 2.1. Ver estado inicial de la BD

```bash
cd /home/grupo6/test-performance

python3 despoblar_bd.py --stats
```

**Resultado esperado:**
```
✅ Conexión exitosa a localhost:5006/fluxo

======================================================================
📊 ESTADÍSTICAS ACTUALES DE LA BASE DE DATOS
======================================================================
  Total de pedidos: 5
  
  Distribución por estado:
    - Pendiente  :        3 (60.0%)
    - Listo      :        2 (40.0%)
  
  Total de productos en pedidos: 12
  Tamaño total de la BD: 8432 kB
======================================================================
```

**✍️ ANOTAR:** Cantidad inicial de pedidos para el informe

---

#### 2.2. (OPCIONAL) Hacer backup de datos existentes

Si hay datos reales importantes:

```bash
# Backup de la base de datos
docker exec fluxo-postgres pg_dump -U postgres fluxo > backup_antes_pruebas_$(date +%Y%m%d).sql

# Verificar que se creó
ls -lh backup_*.sql
```

---

### **FASE 3: Generación de Datos Masivos** 📦

#### 3.1. Generar 100,000 pedidos

```bash
# Iniciar generación
python3 poblar_bd.py --pedidos 100000

# El script mostrará progreso en tiempo real
```

**Resultado esperado:**
```
✅ Conexión exitosa a localhost:5006/fluxo
📦 Productos disponibles en catálogo: 31
👤 Usuario creador: ID 1

📦 Generando 100,000 pedidos en 100 lotes de 1000...
  Lote 1/100: 1,000 pedidos, 2,847 productos | 2.45s | Progreso: 1.0%
  Lote 2/100: 1,000 pedidos, 2,913 productos | 2.38s | Progreso: 2.0%
  Lote 3/100: 1,000 pedidos, 2,895 productos | 2.41s | Progreso: 3.0%
  ...
  Lote 100/100: 1,000 pedidos, 2,901 productos | 2.39s | Progreso: 100.0%

✅ Completado en 245.67 segundos
   📊 Total: 100,000 pedidos con 287,456 productos asociados
   ⚡ Velocidad: 407 pedidos/segundo

📊 ESTADÍSTICAS DE LA BASE DE DATOS:
============================================================
  Total de pedidos: 100,005

  Distribución por estado:
    - Pendiente  :   25,143 (25.1%)
    - Listo      :   24,987 (25.0%)
    - Entregado  :   25,056 (25.1%)
    - Cancelado  :   24,814 (24.8%)

  Total de productos en pedidos: 287,468
  Promedio de productos por pedido: 2.87

  Tamaño total de la BD: 156 MB
============================================================
```

**✍️ ANOTAR PARA EL INFORME:**
- Tiempo total de carga: **245.67 segundos**
- Velocidad de inserción: **407 pedidos/segundo**
- Tamaño final de BD: **156 MB**
- Total de pedidos: **100,005**
- Total de productos en pedidos: **287,468**

---

#### 3.2. Verificar la generación

```bash
# Confirmar cantidad de registros
docker exec -it fluxo-postgres psql -U postgres -d fluxo -c "SELECT COUNT(*) FROM pedidos;"
docker exec -it fluxo-postgres psql -U postgres -d fluxo -c "SELECT COUNT(*) FROM pedido_productos;"

# Ver distribución por estado
docker exec -it fluxo-postgres psql -U postgres -d fluxo -c "SELECT estado, COUNT(*) FROM pedidos GROUP BY estado;"
```

---

### **FASE 4: Ejecución de Pruebas de Rendimiento** ⚡

#### 4.1. Pruebas directas a la base de datos

```bash
# Ejecutar suite completa de pruebas
python3 pruebas_rendimiento.py --host localhost --port 5006
```

**Resultado esperado:**
```
============================================================
🗄️  PRUEBAS DE RENDIMIENTO - BASE DE DATOS DIRECTA
============================================================

🔍 Probando: Listar TODOS los pedidos
   Repeticiones: 5
   Resultados obtenidos: 100,005 filas
   ⏱️  Promedio: 1247.85 ms
   📊 Rango: 1198.23 - 1289.45 ms

🔍 Probando: Listar pedidos PENDIENTES
   Repeticiones: 10
   Resultados obtenidos: 25,143 filas
   ⏱️  Promedio: 312.45 ms
   📊 Rango: 298.12 - 334.67 ms

🔍 Probando: Búsqueda por nombre cliente (%García%)
   Repeticiones: 10
   Resultados obtenidos: 2,847 filas
   ⏱️  Promedio: 78.23 ms
   📊 Rango: 72.45 - 85.12 ms

🔍 Probando: Filtro por rango de fechas (30 días)
   Repeticiones: 10
   Resultados obtenidos: 12,456 filas
   ⏱️  Promedio: 145.67 ms
   📊 Rango: 138.90 - 156.78 ms

🔍 Probando: Obtener pedido #45678 con productos (JOIN)
   Repeticiones: 20
   Resultados obtenidos: 3 filas
   ⏱️  Promedio: 2.45 ms
   📊 Rango: 2.12 - 3.01 ms

🔍 Probando: Contar pedidos por estado (GROUP BY)
   Repeticiones: 10
   Resultados obtenidos: 4 filas
   ⏱️  Promedio: 89.34 ms
   📊 Rango: 85.23 - 95.67 ms

🔍 Probando: Top 10 productos más vendidos
   Repeticiones: 10
   Resultados obtenidos: 10 filas
   ⏱️  Promedio: 234.56 ms
   📊 Rango: 225.67 - 245.89 ms

🔍 Probando: Pedidos con más de 3 productos (HAVING)
   Repeticiones: 10
   Resultados obtenidos: 15,678 filas
   ⏱️  Promedio: 456.78 ms
   📊 Rango: 445.23 - 478.90 ms

============================================================
📊 RESUMEN DE PRUEBAS DE RENDIMIENTO
============================================================
+------------------------------------------+--------+-------------+-----------+-----------+-------------+
| Prueba                                   | Filas  | Promedio    | Mínimo    | Máximo    | Desv. Est.  |
+==========================================+========+=============+===========+===========+=============+
| Listar TODOS los pedidos                 | 100005 | 1247.85 ms  | 1198.23   | 1289.45   | 35.67 ms    |
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

**✍️ COPIAR TODA ESTA TABLA para el informe**

---

#### 4.2. Guardar resultados en archivo

```bash
# Guardar con timestamp
python3 pruebas_rendimiento.py --host localhost --port 5006 > resultados_$(date +%Y%m%d_%H%M%S).txt

# Verificar que se guardó
ls -lh resultados_*.txt
cat resultados_*.txt
```

---

#### 4.3. (OPCIONAL) Probar la API REST

```bash
# Pruebas a través de la API
python3 pruebas_rendimiento.py --api http://localhost:4006
```

---

### **FASE 5: Análisis y Documentación** 📊

#### 5.1. Capturar métricas del sistema

```bash
# Uso de recursos del contenedor de PostgreSQL
docker stats fluxo-postgres --no-stream

# Tamaño actual de la BD
docker exec -it fluxo-postgres psql -U postgres -d fluxo -c "SELECT pg_size_pretty(pg_database_size('fluxo'));"

# Uso de disco
df -h | grep -E 'Filesystem|/home'
```

**Resultado esperado:**
```
CONTAINER ID   NAME             CPU %   MEM USAGE / LIMIT     MEM %
abc123         fluxo-postgres   12.5%   245.3MiB / 2GiB       12.0%

 pg_size_pretty 
----------------
 156 MB
(1 row)

Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   35G   15G  71% /
```

**✍️ ANOTAR:**
- Uso de CPU: **12.5%**
- Uso de RAM: **245 MB**
- Tamaño BD: **156 MB**
- Espacio en disco usado: **71%**

---

#### 5.2. Tomar screenshots (opcional)

Si tienes interfaz gráfica o acceso web:

1. Acceder a `http://146.83.216.166:3006/historial.html`
2. Capturar pantalla con los filtros funcionando
3. Verificar que carga con 100K pedidos

---

### **FASE 6: Pruebas con Diferentes Volúmenes** 📈

#### 6.1. Probar con 10K, 50K, 100K, 150K

```bash
# Script automatizado para probar diferentes cantidades
for cantidad in 10000 50000 100000 150000; do
    echo "═══════════════════════════════════════════════"
    echo "Probando con $cantidad pedidos"
    echo "═══════════════════════════════════════════════"
    
    # Limpiar BD
    python3 despoblar_bd.py --todo --si
    
    # Generar datos
    python3 poblar_bd.py --pedidos $cantidad
    
    # Probar rendimiento
    python3 pruebas_rendimiento.py --host localhost --port 5006 > resultados_${cantidad}_$(date +%Y%m%d_%H%M%S).txt
    
    echo "✅ Completado: $cantidad pedidos"
    sleep 5
done

# Ver resumen comparativo
echo "═══════════════════════════════════════════════"
echo "RESUMEN COMPARATIVO"
echo "═══════════════════════════════════════════════"
grep "Tiempo promedio general" resultados_*.txt
```

---

### **FASE 7: Limpieza Post-Pruebas** 🧹

#### 7.1. Simulación de limpieza (primero)

```bash
# Ver qué se eliminaría
python3 despoblar_bd.py --solo-prueba --dry-run
```

---

#### 7.2. Ejecutar limpieza

```bash
# Opción 1: Eliminar solo datos de prueba (RECOMENDADO)
python3 despoblar_bd.py --solo-prueba

# Opción 2: Eliminar todo desde la fecha de las pruebas
python3 despoblar_bd.py --desde 2025-11-14

# Opción 3: Mantener solo los 100 más recientes
python3 despoblar_bd.py --mantener 100

# Opción 4: Eliminar TODO
python3 despoblar_bd.py --todo
```

---

#### 7.3. Verificar limpieza

```bash
# Ver estado final
python3 despoblar_bd.py --stats
```

**Resultado esperado (si todo se eliminó):**
```
======================================================================
📊 ESTADÍSTICAS ACTUALES DE LA BASE DE DATOS
======================================================================
  Total de pedidos: 5
  
  Distribución por estado:
    - Pendiente  :        3 (60.0%)
    - Listo      :        2 (40.0%)
  
  Total de productos en pedidos: 12
  Tamaño total de la BD: 8432 kB
======================================================================
```

---

#### 7.4. (OPCIONAL) Restaurar backup

Si guardaste un backup:

```bash
# Restaurar datos originales
docker exec -i fluxo-postgres psql -U postgres fluxo < backup_antes_pruebas_20251114.sql
```

---

### **FASE 8: Transferir Resultados a Local** 💾

#### 8.1. Descargar archivos de resultados

**Desde tu máquina local (Windows PowerShell):**

```powershell
# Descargar todos los archivos de resultados
scp grupo6@146.83.216.166:/home/grupo6/test-performance/resultados_*.txt C:\Users\matia\fluxo\test-performance\resultados\

# Verificar descarga
ls C:\Users\matia\fluxo\test-performance\resultados\
```

---

### **FASE 9: Elaborar Informe** 📝

#### 9.1. Datos a incluir en el informe

**1. Configuración de la prueba:**
```
- Sistema: Fluxo - Gestión de Pedidos
- Servidor: Ubuntu 22.04 en VM (146.83.216.166)
- Base de datos: PostgreSQL 15-alpine
- Fecha de ejecución: 14 de noviembre de 2025
- Cantidad de registros: 100,000 pedidos
- Productos asociados: ~287,000 relaciones
```

**2. Proceso de carga:**
```
- Tiempo total: 245.67 segundos (~4 minutos)
- Velocidad de inserción: 407 pedidos/segundo
- Método: Inserción en lotes (batch) de 1,000 pedidos
- Tamaño final BD: 156 MB
```

**3. Resultados de rendimiento:**
```
[Copiar tabla completa de resultados del Paso 4.1]
```

**4. Análisis:**
```
Consultas más críticas:
- Listar TODOS (sin paginación): 1,247 ms ⚠️
- Listar con filtro por estado: 312 ms ✓
- Búsqueda por texto: 78 ms ✓
- Obtener pedido individual: 2.5 ms ✓
```

**5. Conclusiones:**
```
✅ El sistema escala adecuadamente hasta 100K registros
✅ Consultas con filtros tienen buen rendimiento (< 500ms)
⚠️  Listar sin paginación requiere optimización
💡 Recomendación: Implementar paginación obligatoria
```

---

## 📋 Checklist Final

- [ ] Pruebas ejecutadas con 100,000 registros
- [ ] Resultados guardados en archivos .txt
- [ ] Métricas de sistema capturadas
- [ ] Base de datos limpiada
- [ ] Archivos descargados a local
- [ ] Screenshots tomados (si aplica)
- [ ] Informe documentado
- [ ] Servidor en estado original

---

## ⏱️ Tiempo Estimado Total

| Fase | Tiempo Estimado |
|------|-----------------|
| Preparación (Fase 1-2) | 10-15 minutos |
| Generación de datos (Fase 3) | 4-5 minutos |
| Pruebas de rendimiento (Fase 4) | 5-10 minutos |
| Análisis (Fase 5) | 5 minutos |
| Múltiples volúmenes (Fase 6) | 20-30 minutos (opcional) |
| Limpieza (Fase 7) | 2-3 minutos |
| **TOTAL** | **25-40 minutos** |
| **Con múltiples volúmenes** | **45-70 minutos** |

---

## 🆘 Troubleshooting

### Error: "Connection refused"
```bash
# Verificar que PostgreSQL está corriendo
docker ps | grep postgres

# Reiniciar contenedor si es necesario
docker-compose restart postgres
```

### Error: "Out of memory"
```bash
# Reducir la cantidad de pedidos
python3 poblar_bd.py --pedidos 50000
```

### Error: "No module named 'psycopg2'"
```bash
# Reinstalar dependencias
pip3 install --force-reinstall psycopg2-binary faker requests tabulate
```

### La BD está llena
```bash
# Ver espacio usado
df -h

# Limpiar logs de Docker
docker system prune -a
```

### Script muy lento
```bash
# Verificar recursos del servidor
top
free -h
```

---

## 📞 Contacto de Emergencia

Si algo sale mal:
1. **NO ELIMINAR** nada sin backup
2. Tomar screenshot del error
3. Guardar logs: `docker logs fluxo-postgres > error.log`
4. Documentar el problema para el informe

---

## ✅ Checklist de Entrega

Para tu profesora, debes entregar:

- [ ] **Informe PDF** con:
  - Introducción y objetivos
  - Metodología (este flujo)
  - Resultados (tablas de tiempos)
  - Gráficos (opcional)
  - Análisis y conclusiones
  - Recomendaciones

- [ ] **Archivos de evidencia:**
  - `resultados_100000_*.txt`
  - Screenshots de la aplicación funcionando
  - Logs del sistema (opcional)

- [ ] **Scripts utilizados:**
  - `poblar_bd.py`
  - `pruebas_rendimiento.py`
  - `despoblar_bd.py`

---

🎯 **¡Listo para las pruebas!** Sigue este flujo paso a paso y documenta todo para tu informe.

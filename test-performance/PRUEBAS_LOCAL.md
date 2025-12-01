# 🧪 Pruebas de Rendimiento en LOCAL (Windows)

## 🎯 Ventajas de probar en local primero

✅ No afectas el servidor de producción
✅ Puedes iterar rápidamente
✅ Verificas que los scripts funcionan correctamente
✅ Puedes hacer pruebas con diferentes cantidades sin riesgo

---

## 📋 Requisitos Previos

### 1. Python 3 instalado

```powershell
# Verificar si tienes Python
python --version
# Debería mostrar: Python 3.x.x

# Si no lo tienes, descargar de: https://www.python.org/downloads/
```

### 2. Docker Desktop corriendo

```powershell
# Verificar Docker
docker --version
docker-compose --version

# Ver contenedores
docker ps
```

### 3. Instalar librerías Python

```powershell
# Navegar a la carpeta de pruebas
cd C:\Users\matia\fluxo\test-performance

# Instalar dependencias
pip install psycopg2-binary faker requests tabulate

# Verificar instalación
python -c "import psycopg2, faker, requests, tabulate; print('✅ Todo instalado')"
```

---

## 🚀 FLUJO COMPLETO EN LOCAL

### **PASO 1: Asegurar que Docker está corriendo**

```powershell
cd C:\Users\matia\fluxo

# Ver contenedores activos
docker ps

# Si no están corriendo, iniciarlos
docker-compose up -d

# Verificar logs
docker-compose logs backend
docker-compose logs postgres
```

**Resultado esperado:**
```
CONTAINER ID   IMAGE                    PORTS                    STATUS
abc123         fluxo-backend:latest     0.0.0.0:4006->4006/tcp   Up
def456         postgres:15-alpine       0.0.0.0:5006->5432/tcp   Up
ghi789         fluxo-frontend:latest    0.0.0.0:3006->3006/tcp   Up
```

---

### **PASO 2: Ver estado inicial de la BD**

```powershell
cd C:\Users\matia\fluxo\test-performance

# Ver estadísticas actuales
python despoblar_bd.py --stats --host localhost --port 5006
```

**Resultado esperado:**
```
✅ Conexión exitosa a localhost:5006/fluxo

======================================================================
📊 ESTADÍSTICAS ACTUALES DE LA BASE DE DATOS
======================================================================
  Total de pedidos: 0

  Distribución por estado:
    (vacío)

  Total de productos en pedidos: 0
  Tamaño total de la BD: 8192 kB
======================================================================
```

---

### **PASO 3: Generar datos de prueba**

#### Opción A: Empezar con 1,000 pedidos (rápido, 2-3 segundos)

```powershell
python poblar_bd.py --host localhost --port 5006 --pedidos 1000
```

#### Opción B: 10,000 pedidos (~20 segundos)

```powershell
python poblar_bd.py --host localhost --port 5006 --pedidos 10000
```

#### Opción C: 100,000 pedidos (~4 minutos)

```powershell
python poblar_bd.py --host localhost --port 5006 --pedidos 100000
```

**Salida esperada:**
```
✅ Conexión exitosa a localhost:5006/fluxo
📦 Productos disponibles en catálogo: 31
👤 Usuario creador: ID 1

🚀 Iniciando generación de 10,000 pedidos...

📦 Generando 10,000 pedidos en 10 lotes de 1000...
  Lote 1/10: 1,000 pedidos, 2,847 productos | 2.45s | Progreso: 10.0%
  Lote 2/10: 1,000 pedidos, 2,913 productos | 2.38s | Progreso: 20.0%
  ...
  Lote 10/10: 1,000 pedidos, 2,891 productos | 2.41s | Progreso: 100.0%

✅ Completado en 24.56 segundos
   📊 Total: 10,000 pedidos con 28,745 productos asociados
   ⚡ Velocidad: 407 pedidos/segundo

📊 ESTADÍSTICAS DE LA BASE DE DATOS:
============================================================
  Total de pedidos: 10,000

  Distribución por estado:
    - Pendiente  :    2,514 (25.1%)
    - Listo      :    2,498 (25.0%)
    - Entregado  :    2,505 (25.1%)
    - Cancelado  :    2,483 (24.8%)

  Total de productos en pedidos: 28,745
  Promedio de productos por pedido: 2.87

  Tamaño total de la BD: 15.6 MB
============================================================
```

---

### **PASO 4: Ejecutar pruebas de rendimiento**

```powershell
# Pruebas directas a la base de datos
python pruebas_rendimiento.py --host localhost --port 5006

# Guardar resultados en archivo
python pruebas_rendimiento.py --host localhost --port 5006 > resultados_local_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt
```

**Salida esperada (con 10,000 pedidos):**
```
============================================================
🗄️  PRUEBAS DE RENDIMIENTO - BASE DE DATOS DIRECTA
============================================================

🔍 Probando: Listar TODOS los pedidos
   Repeticiones: 5
   Resultados obtenidos: 10,000 filas
   ⏱️  Promedio: 124.78 ms
   📊 Rango: 119.82 - 128.94 ms

🔍 Probando: Listar pedidos PENDIENTES
   Repeticiones: 10
   Resultados obtenidos: 2,514 filas
   ⏱️  Promedio: 31.24 ms
   📊 Rango: 29.81 - 33.46 ms

... (más pruebas) ...

============================================================
📊 RESUMEN DE PRUEBAS DE RENDIMIENTO
============================================================
[TABLA COMPLETA DE RESULTADOS]

🎯 ANÁLISIS:
  ⚠️  Consulta más lenta: Listar TODOS los pedidos (124.78 ms)
  ⚡ Consulta más rápida: Obtener pedido con productos (JOIN) (2.45 ms)
  📊 Tiempo promedio general: 82.34 ms

💡 RECOMENDACIONES:
  ✅ El rendimiento general es excelente (< 100ms)
```

---

### **PASO 5: (OPCIONAL) Probar la API REST**

```powershell
# Verificar que el backend está respondiendo
curl http://localhost:4006/api/hello

# Probar la API
python pruebas_rendimiento.py --api http://localhost:4006
```

---

### **PASO 6: Ver resultados en el navegador**

Abrir en tu navegador:
- Frontend: http://localhost:3006
- Historial: http://localhost:3006/historial.html

Verificar que:
- Los pedidos se cargan correctamente
- Los filtros funcionan
- El calendario muestra los pedidos

---

### **PASO 7: Probar con diferentes cantidades**

```powershell
# Script para probar múltiples volúmenes
$cantidades = @(1000, 5000, 10000, 50000, 100000)

foreach ($cantidad in $cantidades) {
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "Probando con $cantidad pedidos" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
    
    # Limpiar BD
    python despoblar_bd.py --todo --si --host localhost --port 5006
    
    # Generar datos
    python poblar_bd.py --pedidos $cantidad --host localhost --port 5006
    
    # Probar rendimiento
    $archivo = "resultados_local_${cantidad}_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
    python pruebas_rendimiento.py --host localhost --port 5006 > $archivo
    
    Write-Host "✅ Completado: $cantidad pedidos" -ForegroundColor Green
    Start-Sleep -Seconds 5
}

# Ver resumen comparativo
Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "RESUMEN COMPARATIVO" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Select-String -Path "resultados_local_*.txt" -Pattern "Tiempo promedio general"
```

---

### **PASO 8: Analizar métricas del sistema**

```powershell
# Ver uso de recursos de los contenedores
docker stats --no-stream

# Ver tamaño de la BD
docker exec -it fluxo-postgres psql -U postgres -d fluxo -c "SELECT pg_size_pretty(pg_database_size('fluxo'));"

# Ver logs del backend
docker logs fluxo-backend --tail 50

# Ver logs de PostgreSQL
docker logs fluxo-postgres --tail 50
```

---

### **PASO 9: Limpiar después de las pruebas**

#### Opción 1: Eliminar solo datos de prueba

```powershell
python despoblar_bd.py --solo-prueba --host localhost --port 5006
```

#### Opción 2: Eliminar TODO

```powershell
python despoblar_bd.py --todo --host localhost --port 5006
```

#### Opción 3: Resetear completamente la BD

```powershell
cd C:\Users\matia\fluxo

# Detener y eliminar contenedores con volúmenes
docker-compose down -v

# Reiniciar desde cero
docker-compose up -d

# Esperar a que inicien
Start-Sleep -Seconds 10

# Verificar
docker ps
```

---

## 📊 Comparación Local vs Servidor

| Aspecto | Local (Windows) | Servidor (Ubuntu) |
|---------|----------------|-------------------|
| **Puerto PostgreSQL** | 5006 | 5006 |
| **Puerto Backend** | 4006 | 4006 |
| **Puerto Frontend** | 3006 | 3006 |
| **Velocidad carga** | Más rápido (SSD) | Depende del servidor |
| **Pruebas seguras** | ✅ Sin riesgo | ⚠️ Puede afectar producción |
| **Acceso remoto** | ❌ Solo local | ✅ Acceso web |
| **Recursos** | Tu máquina | Servidor compartido |

---

## 🎯 Ejemplo Completo Paso a Paso

```powershell
# 1. Navegar al directorio
cd C:\Users\matia\fluxo\test-performance

# 2. Ver estado inicial
python despoblar_bd.py --stats --host localhost --port 5006

# 3. Generar 10,000 pedidos (prueba rápida)
python poblar_bd.py --pedidos 10000 --host localhost --port 5006

# 4. Ejecutar pruebas de rendimiento
python pruebas_rendimiento.py --host localhost --port 5006 > resultados_local_10k.txt

# 5. Ver resultados
cat resultados_local_10k.txt

# 6. Probar en el navegador
start http://localhost:3006/historial.html

# 7. Limpiar
python despoblar_bd.py --todo --si --host localhost --port 5006
```

---

## 🔧 Troubleshooting Local

### Error: "Connection refused"

```powershell
# Verificar que Docker está corriendo
docker ps

# Si no hay contenedores, iniciar
cd C:\Users\matia\fluxo
docker-compose up -d

# Esperar 30 segundos
Start-Sleep -Seconds 30

# Verificar de nuevo
docker ps
```

### Error: "No module named 'psycopg2'"

```powershell
# Reinstalar
pip uninstall psycopg2-binary
pip install psycopg2-binary
```

### Error: "Port 5006 is already in use"

```powershell
# Ver qué está usando el puerto
netstat -ano | findstr :5006

# Detener contenedores
docker-compose down

# Iniciar de nuevo
docker-compose up -d
```

### Backend no responde

```powershell
# Ver logs
docker logs fluxo-backend

# Reiniciar solo el backend
docker-compose restart backend

# Ver si está corriendo
docker ps | findstr backend
```

### Base de datos sin productos

```powershell
# Verificar productos
docker exec -it fluxo-postgres psql -U postgres -d fluxo -c "SELECT COUNT(*) FROM productos;"

# Si está vacía, recrear
docker-compose down -v
docker-compose up -d
```

---

## 📝 Ventajas de Probar en Local

1. ✅ **Iteración rápida**: Puedes probar varias configuraciones rápidamente
2. ✅ **Sin riesgo**: No afectas datos de producción
3. ✅ **Debug fácil**: Tienes acceso a todos los logs
4. ✅ **Offline**: No necesitas conexión SSH
5. ✅ **Recursos completos**: Usas toda la potencia de tu máquina

---

## 🚀 Flujo Recomendado

### Para aprender y ajustar scripts:
```powershell
# 1. Probar con 1,000 (3 segundos)
python poblar_bd.py --pedidos 1000 --host localhost --port 5006

# 2. Ejecutar pruebas
python pruebas_rendimiento.py --host localhost --port 5006

# 3. Ver en el navegador
start http://localhost:3006/historial.html

# 4. Limpiar
python despoblar_bd.py --todo --si --host localhost --port 5006
```

### Para pruebas serias:
```powershell
# Probar con 100,000 pedidos en local
python poblar_bd.py --pedidos 100000 --host localhost --port 5006
python pruebas_rendimiento.py --host localhost --port 5006 > resultados_local_100k.txt

# Luego hacer lo mismo en el servidor
ssh grupo6@146.83.216.166
cd /home/grupo6/test-performance
python3 poblar_bd.py --pedidos 100000
python3 pruebas_rendimiento.py --host localhost --port 5006 > resultados_servidor_100k.txt

# Comparar ambos resultados
```

---

## 💡 Consejos

1. **Empieza con cantidades pequeñas** (1K-10K) para verificar que todo funciona
2. **Guarda los resultados** con timestamps para comparar
3. **Prueba el frontend** para ver cómo se comporta la interfaz
4. **Monitorea recursos** con `docker stats` mientras corren las pruebas
5. **Limpia después** para no llenar tu disco

---

## ✅ Checklist Local

- [ ] Python 3 instalado
- [ ] pip install psycopg2-binary faker requests tabulate
- [ ] Docker Desktop corriendo
- [ ] docker-compose up -d ejecutado
- [ ] Contenedores activos (docker ps)
- [ ] Productos en la BD (31 productos)
- [ ] Scripts de prueba funcionando
- [ ] Resultados guardados
- [ ] BD limpiada después de las pruebas

¡Listo para probar en local! 🎉

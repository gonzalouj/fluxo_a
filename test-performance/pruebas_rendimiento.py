#!/usr/bin/env python3
"""
Script para realizar pruebas de rendimiento en el sistema Fluxo.
Ejecuta diferentes tipos de consultas y mide tiempos de respuesta.

Uso:
    python pruebas_rendimiento.py --host localhost --port 5006
    python pruebas_rendimiento.py --api http://localhost:4006

Requisitos:
    pip install psycopg2-binary requests tabulate
"""

import psycopg2
import requests
import time
import statistics
import argparse
from tabulate import tabulate
from datetime import datetime, timedelta


class PruebaRendimiento:
    def __init__(self, host, port, dbname, user, password):
        self.conn = psycopg2.connect(
            host=host, port=port, dbname=dbname, user=user, password=password
        )
        self.cursor = self.conn.cursor()
        self.resultados = []
    
    def ejecutar_consulta(self, nombre, query, params=None, repeticiones=10):
        """
        Ejecuta una consulta N veces y mide el tiempo.
        
        Returns:
            dict con estadísticas de tiempo
        """
        tiempos = []
        
        print(f"\n🔍 Probando: {nombre}")
        print(f"   Repeticiones: {repeticiones}")
        
        for i in range(repeticiones):
            inicio = time.time()
            
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            
            resultados = self.cursor.fetchall()
            fin = time.time()
            
            tiempo_ms = (fin - inicio) * 1000
            tiempos.append(tiempo_ms)
            
            if i == 0:
                print(f"   Resultados obtenidos: {len(resultados):,} filas")
        
        # Calcular estadísticas
        stats = {
            'nombre': nombre,
            'min': min(tiempos),
            'max': max(tiempos),
            'promedio': statistics.mean(tiempos),
            'mediana': statistics.median(tiempos),
            'desv_std': statistics.stdev(tiempos) if len(tiempos) > 1 else 0,
            'total_filas': len(resultados)
        }
        
        self.resultados.append(stats)
        
        print(f"   ⏱️  Promedio: {stats['promedio']:.2f} ms")
        print(f"   📊 Rango: {stats['min']:.2f} - {stats['max']:.2f} ms")
        
        return stats
    
    def prueba_listar_todos_pedidos(self):
        """Prueba: Listar todos los pedidos (sin filtros)"""
        query = """
            SELECT id_pedido, nombre_cliente, email_cliente, fecha_entrega, estado
            FROM pedidos
            ORDER BY fecha_creacion DESC
        """
        return self.ejecutar_consulta("Listar TODOS los pedidos", query, repeticiones=5)
    
    def prueba_listar_pedidos_pendientes(self):
        """Prueba: Listar solo pedidos pendientes"""
        query = """
            SELECT id_pedido, nombre_cliente, email_cliente, fecha_entrega, estado
            FROM pedidos
            WHERE estado = 'Pendiente'
            ORDER BY fecha_entrega ASC
        """
        return self.ejecutar_consulta("Listar pedidos PENDIENTES", query)
    
    def prueba_buscar_por_cliente(self):
        """Prueba: Buscar pedidos por nombre de cliente"""
        query = """
            SELECT id_pedido, nombre_cliente, email_cliente, fecha_entrega, estado
            FROM pedidos
            WHERE nombre_cliente ILIKE %s
            ORDER BY fecha_creacion DESC
        """
        return self.ejecutar_consulta(
            "Búsqueda por nombre cliente (%García%)", 
            query, 
            params=('%García%',)
        )
    
    def prueba_filtro_fecha_rango(self):
        """Prueba: Filtrar pedidos por rango de fechas"""
        fecha_inicio = datetime.now()
        fecha_fin = fecha_inicio + timedelta(days=30)
        
        query = """
            SELECT id_pedido, nombre_cliente, fecha_entrega, estado
            FROM pedidos
            WHERE fecha_entrega BETWEEN %s AND %s
            ORDER BY fecha_entrega ASC
        """
        return self.ejecutar_consulta(
            "Filtro por rango de fechas (30 días)", 
            query, 
            params=(fecha_inicio, fecha_fin)
        )
    
    def prueba_pedido_con_productos(self):
        """Prueba: Obtener un pedido con todos sus productos (JOIN)"""
        # Primero obtener un ID de pedido aleatorio
        self.cursor.execute("SELECT id_pedido FROM pedidos ORDER BY RANDOM() LIMIT 1")
        id_pedido = self.cursor.fetchone()[0]
        
        query = """
            SELECT 
                ped.id_pedido,
                ped.nombre_cliente,
                ped.estado,
                prod.nombre as producto,
                pp.cantidad,
                pp.precio_unitario_congelado
            FROM pedidos ped
            JOIN pedido_productos pp ON ped.id_pedido = pp.id_pedido
            JOIN productos prod ON pp.id_producto = prod.id_producto
            WHERE ped.id_pedido = %s
        """
        return self.ejecutar_consulta(
            f"Obtener pedido #{id_pedido} con productos (JOIN)", 
            query, 
            params=(id_pedido,),
            repeticiones=20
        )
    
    def prueba_contar_por_estado(self):
        """Prueba: Contar pedidos agrupados por estado"""
        query = """
            SELECT estado, COUNT(*) as cantidad
            FROM pedidos
            GROUP BY estado
            ORDER BY cantidad DESC
        """
        return self.ejecutar_consulta("Contar pedidos por estado (GROUP BY)", query)
    
    def prueba_top_productos_vendidos(self):
        """Prueba: Top 10 productos más vendidos"""
        query = """
            SELECT 
                prod.nombre,
                SUM(pp.cantidad) as total_vendido,
                COUNT(DISTINCT pp.id_pedido) as num_pedidos
            FROM pedido_productos pp
            JOIN productos prod ON pp.id_producto = prod.id_producto
            GROUP BY prod.id_producto, prod.nombre
            ORDER BY total_vendido DESC
            LIMIT 10
        """
        return self.ejecutar_consulta("Top 10 productos más vendidos", query)
    
    def prueba_pedidos_con_multiples_productos(self):
        """Prueba: Pedidos con más de 3 productos"""
        query = """
            SELECT 
                ped.id_pedido,
                ped.nombre_cliente,
                COUNT(pp.id_producto) as num_productos
            FROM pedidos ped
            JOIN pedido_productos pp ON ped.id_pedido = pp.id_pedido
            GROUP BY ped.id_pedido, ped.nombre_cliente
            HAVING COUNT(pp.id_producto) > 3
            ORDER BY num_productos DESC
        """
        return self.ejecutar_consulta("Pedidos con más de 3 productos (HAVING)", query)
    
    def mostrar_resumen(self):
        """Muestra una tabla resumen con todos los resultados"""
        print("\n" + "=" * 100)
        print("📊 RESUMEN DE PRUEBAS DE RENDIMIENTO")
        print("=" * 100)
        
        tabla = []
        for r in self.resultados:
            tabla.append([
                r['nombre'],
                f"{r['total_filas']:,}",
                f"{r['promedio']:.2f} ms",
                f"{r['min']:.2f} ms",
                f"{r['max']:.2f} ms",
                f"{r['desv_std']:.2f} ms"
            ])
        
        headers = ["Prueba", "Filas", "Promedio", "Mínimo", "Máximo", "Desv. Est."]
        print(tabulate(tabla, headers=headers, tablefmt="grid"))
        
        # Análisis
        print("\n🎯 ANÁLISIS:")
        
        # Consulta más lenta
        mas_lenta = max(self.resultados, key=lambda x: x['promedio'])
        print(f"  ⚠️  Consulta más lenta: {mas_lenta['nombre']} ({mas_lenta['promedio']:.2f} ms)")
        
        # Consulta más rápida
        mas_rapida = min(self.resultados, key=lambda x: x['promedio'])
        print(f"  ⚡ Consulta más rápida: {mas_rapida['nombre']} ({mas_rapida['promedio']:.2f} ms)")
        
        # Promedio general
        promedio_general = statistics.mean([r['promedio'] for r in self.resultados])
        print(f"  📊 Tiempo promedio general: {promedio_general:.2f} ms")
        
        # Recomendaciones
        print("\n💡 RECOMENDACIONES:")
        if mas_lenta['promedio'] > 1000:
            print(f"  - La consulta '{mas_lenta['nombre']}' tarda más de 1 segundo")
            print(f"    Considera agregar índices o optimizar la consulta")
        
        if mas_lenta['promedio'] > 100:
            print(f"  - Considera implementar paginación para consultas con muchos resultados")
        
        if promedio_general < 100:
            print(f"  ✅ El rendimiento general es excelente (< 100ms)")
        elif promedio_general < 500:
            print(f"  ✅ El rendimiento general es bueno (< 500ms)")
        else:
            print(f"  ⚠️  El rendimiento general podría mejorar (> 500ms)")
    
    def cerrar(self):
        self.cursor.close()
        self.conn.close()


class PruebaAPI:
    """Pruebas de rendimiento en la API REST"""
    
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.resultados = []
    
    def ejecutar_request(self, nombre, endpoint, metodo='GET', data=None, repeticiones=10):
        """Ejecuta una petición HTTP N veces y mide el tiempo"""
        tiempos = []
        url = f"{self.base_url}{endpoint}"
        
        print(f"\n🌐 Probando API: {nombre}")
        print(f"   URL: {url}")
        print(f"   Repeticiones: {repeticiones}")
        
        for i in range(repeticiones):
            inicio = time.time()
            
            try:
                if metodo == 'GET':
                    response = requests.get(url)
                elif metodo == 'POST':
                    response = requests.post(url, json=data)
                
                fin = time.time()
                
                if response.status_code not in [200, 201]:
                    print(f"   ⚠️  Error HTTP {response.status_code}")
                    continue
                
                tiempo_ms = (fin - inicio) * 1000
                tiempos.append(tiempo_ms)
                
                if i == 0:
                    try:
                        json_data = response.json()
                        if isinstance(json_data, list):
                            print(f"   Resultados: {len(json_data):,} items")
                    except:
                        pass
            
            except Exception as e:
                print(f"   ❌ Error: {e}")
                continue
        
        if not tiempos:
            print(f"   ❌ No se pudieron obtener resultados")
            return None
        
        stats = {
            'nombre': nombre,
            'endpoint': endpoint,
            'min': min(tiempos),
            'max': max(tiempos),
            'promedio': statistics.mean(tiempos),
            'mediana': statistics.median(tiempos),
            'desv_std': statistics.stdev(tiempos) if len(tiempos) > 1 else 0
        }
        
        self.resultados.append(stats)
        
        print(f"   ⏱️  Promedio: {stats['promedio']:.2f} ms")
        print(f"   📊 Rango: {stats['min']:.2f} - {stats['max']:.2f} ms")
        
        return stats
    
    def probar_api_completa(self):
        """Ejecuta todas las pruebas de la API"""
        print("\n🚀 INICIANDO PRUEBAS DE API")
        
        # Verificar que la API esté disponible
        try:
            response = requests.get(f"{self.base_url}/api/hello", timeout=5)
            if response.status_code != 200:
                print(f"❌ API no disponible en {self.base_url}")
                return
            print(f"✅ API disponible en {self.base_url}")
        except Exception as e:
            print(f"❌ No se pudo conectar a la API: {e}")
            return
        
        # Pruebas
        self.ejecutar_request("Listar todos los pedidos", "/api/pedidos", repeticiones=5)
        self.ejecutar_request("Filtrar pendientes", "/api/pedidos?estado=Pendiente")
        self.ejecutar_request("Listar productos", "/api/productos")
        self.ejecutar_request("Listar categorías", "/api/categorias")
        
        self.mostrar_resumen()
    
    def mostrar_resumen(self):
        """Muestra resumen de las pruebas de API"""
        if not self.resultados:
            print("\n⚠️  No hay resultados de API para mostrar")
            return
        
        print("\n" + "=" * 100)
        print("🌐 RESUMEN DE PRUEBAS DE API")
        print("=" * 100)
        
        tabla = []
        for r in self.resultados:
            tabla.append([
                r['nombre'],
                r['endpoint'],
                f"{r['promedio']:.2f} ms",
                f"{r['min']:.2f} ms",
                f"{r['max']:.2f} ms"
            ])
        
        headers = ["Prueba", "Endpoint", "Promedio", "Mínimo", "Máximo"]
        print(tabulate(tabla, headers=headers, tablefmt="grid"))


def main():
    parser = argparse.ArgumentParser(description='Pruebas de rendimiento del sistema Fluxo')
    parser.add_argument('--host', default='localhost', help='Host de PostgreSQL')
    parser.add_argument('--port', type=int, default=5006, help='Puerto de PostgreSQL')
    parser.add_argument('--dbname', default='fluxo', help='Nombre de la BD')
    parser.add_argument('--user', default='postgres', help='Usuario de PostgreSQL')
    parser.add_argument('--password', default='postgres123', help='Contraseña')
    parser.add_argument('--api', help='URL base de la API (ej: http://localhost:4006)')
    parser.add_argument('--solo-api', action='store_true', help='Solo probar API, no BD directa')
    
    args = parser.parse_args()
    
    # Pruebas de base de datos directa
    if not args.solo_api:
        print("\n" + "=" * 100)
        print("🗄️  PRUEBAS DE RENDIMIENTO - BASE DE DATOS DIRECTA")
        print("=" * 100)
        
        try:
            prueba_bd = PruebaRendimiento(
                args.host, args.port, args.dbname, args.user, args.password
            )
            
            # Ejecutar todas las pruebas
            prueba_bd.prueba_listar_todos_pedidos()
            prueba_bd.prueba_listar_pedidos_pendientes()
            prueba_bd.prueba_buscar_por_cliente()
            prueba_bd.prueba_filtro_fecha_rango()
            prueba_bd.prueba_pedido_con_productos()
            prueba_bd.prueba_contar_por_estado()
            prueba_bd.prueba_top_productos_vendidos()
            prueba_bd.prueba_pedidos_con_multiples_productos()
            
            # Mostrar resumen
            prueba_bd.mostrar_resumen()
            
            prueba_bd.cerrar()
            
        except Exception as e:
            print(f"\n❌ Error en pruebas de BD: {e}")
    
    # Pruebas de API
    if args.api:
        prueba_api = PruebaAPI(args.api)
        prueba_api.probar_api_completa()


if __name__ == "__main__":
    main()

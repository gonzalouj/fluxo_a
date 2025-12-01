#!/usr/bin/env python3
"""
Script para poblar la base de datos con datos masivos para pruebas de rendimiento.
Genera 100,000+ registros de pedidos con productos asociados.

Uso:
    python poblar_bd.py --pedidos 100000 --host localhost --port 5006

Requisitos:
    pip install psycopg2-binary faker
"""

import psycopg2
import random
from datetime import datetime, timedelta
from faker import Faker
import argparse
import time

# Inicializar Faker para datos realistas
fake = Faker(['es_ES', 'es_CL'])

# Configuración de conexión a BD
def conectar_bd(host, port, dbname, user, password):
    """Establece conexión con PostgreSQL"""
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password
        )
        print(f"✅ Conexión exitosa a {host}:{port}/{dbname}")
        return conn
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        exit(1)


def obtener_ids_productos(cursor):
    """Obtiene los IDs de productos existentes en el catálogo"""
    cursor.execute("SELECT id_producto FROM productos WHERE es_temporal = FALSE")
    productos = cursor.fetchall()
    return [p[0] for p in productos]


def obtener_id_usuario_default(cursor):
    """Obtiene un usuario por defecto para asignar a los pedidos"""
    cursor.execute("SELECT id_usuario FROM usuarios LIMIT 1")
    result = cursor.fetchone()
    if result:
        return result[0]
    
    # Si no hay usuarios, crear uno de prueba
    cursor.execute("""
        INSERT INTO usuarios (rut, nombre_completo, email, password_hash, rol, activo)
        VALUES ('11111111-1', 'Usuario Test', 'test@test.com', 'hash', 'Admin', TRUE)
        RETURNING id_usuario
    """)
    return cursor.fetchone()[0]


def generar_pedidos_batch(cursor, num_pedidos, productos_ids, usuario_id, batch_size=1000):
    """
    Genera pedidos en lotes para mejor rendimiento.
    
    Args:
        cursor: Cursor de PostgreSQL
        num_pedidos: Cantidad total de pedidos a generar
        productos_ids: Lista de IDs de productos disponibles
        usuario_id: ID del usuario creador
        batch_size: Tamaño del lote (1000 por defecto)
    """
    
    estados = ['Pendiente', 'Listo', 'Entregado', 'Cancelado']
    
    # Calcular número de lotes
    num_batches = (num_pedidos + batch_size - 1) // batch_size
    
    print(f"\n📦 Generando {num_pedidos:,} pedidos en {num_batches} lotes de {batch_size}...")
    
    pedidos_creados = 0
    productos_creados = 0
    
    inicio_total = time.time()
    
    for batch in range(num_batches):
        inicio_batch = time.time()
        
        # Calcular cuántos pedidos crear en este lote
        pedidos_en_batch = min(batch_size, num_pedidos - pedidos_creados)
        
        # Preparar datos de pedidos
        pedidos_data = []
        for _ in range(pedidos_en_batch):
            nombre = fake.name()
            email = fake.email()
            telefono = f"+569{random.randint(10000000, 99999999)}"
            
            # Fecha de entrega aleatoria entre hoy y 90 días adelante
            fecha_entrega = datetime.now() + timedelta(days=random.randint(1, 90))
            
            # Fecha de creación aleatoria en los últimos 30 días
            fecha_creacion = datetime.now() - timedelta(days=random.randint(0, 30))
            
            estado = random.choice(estados)
            detalles = fake.sentence() if random.random() > 0.5 else None
            
            pedidos_data.append((
                nombre, email, telefono, fecha_entrega, 
                detalles, estado, fecha_creacion, usuario_id
            ))
        
        # INSERT masivo de pedidos usando execute con VALUES múltiples
        pedidos_query = """
            INSERT INTO pedidos 
            (nombre_cliente, email_cliente, telefono_cliente, fecha_entrega, 
             detalles_pedido, estado, fecha_creacion, id_usuario_creador)
            VALUES %s
            RETURNING id_pedido
        """
        
        from psycopg2.extras import execute_values
        cursor.execute("BEGIN")
        pedidos_ids = execute_values(
            cursor, pedidos_query, pedidos_data,
            template="(%s, %s, %s, %s, %s, %s, %s, %s)",
            fetch=True
        )
        pedidos_ids = [row[0] for row in pedidos_ids]
        
        # Preparar datos de pedido_productos
        productos_data = []
        for id_pedido in pedidos_ids:
            # Cada pedido tiene entre 1 y 5 productos
            num_productos = random.randint(1, 5)
            productos_seleccionados = random.sample(productos_ids, min(num_productos, len(productos_ids)))
            
            for id_producto in productos_seleccionados:
                cantidad = random.randint(1, 10)
                precio = round(random.uniform(50000, 500000), 2)
                productos_data.append((id_pedido, id_producto, cantidad, precio))
        
        # INSERT masivo de pedido_productos
        productos_query = """
            INSERT INTO pedido_productos 
            (id_pedido, id_producto, cantidad, precio_unitario_congelado)
            VALUES (%s, %s, %s, %s)
        """
        
        cursor.executemany(productos_query, productos_data)
        
        pedidos_creados += pedidos_en_batch
        productos_creados += len(productos_data)
        
        # Commit cada lote
        cursor.connection.commit()
        
        tiempo_batch = time.time() - inicio_batch
        progreso = (pedidos_creados / num_pedidos) * 100
        
        print(f"  Lote {batch + 1}/{num_batches}: {pedidos_en_batch:,} pedidos, "
              f"{len(productos_data):,} productos | "
              f"{tiempo_batch:.2f}s | Progreso: {progreso:.1f}%")
    
    tiempo_total = time.time() - inicio_total
    
    print(f"\n✅ Completado en {tiempo_total:.2f} segundos")
    print(f"   📊 Total: {pedidos_creados:,} pedidos con {productos_creados:,} productos asociados")
    print(f"   ⚡ Velocidad: {pedidos_creados / tiempo_total:.0f} pedidos/segundo")


def mostrar_estadisticas(cursor):
    """Muestra estadísticas de la base de datos"""
    print("\n📊 ESTADÍSTICAS DE LA BASE DE DATOS:")
    print("=" * 60)
    
    # Total de pedidos
    cursor.execute("SELECT COUNT(*) FROM pedidos")
    total_pedidos = cursor.fetchone()[0]
    print(f"  Total de pedidos: {total_pedidos:,}")
    
    # Pedidos por estado
    cursor.execute("""
        SELECT estado, COUNT(*) as cantidad 
        FROM pedidos 
        GROUP BY estado 
        ORDER BY cantidad DESC
    """)
    print("\n  Distribución por estado:")
    for estado, cantidad in cursor.fetchall():
        porcentaje = (cantidad / total_pedidos) * 100
        print(f"    - {estado:12}: {cantidad:8,} ({porcentaje:5.1f}%)")
    
    # Total de productos en pedidos
    cursor.execute("SELECT COUNT(*) FROM pedido_productos")
    total_productos = cursor.fetchone()[0]
    print(f"\n  Total de productos en pedidos: {total_productos:,}")
    
    # Promedio de productos por pedido
    promedio = total_productos / total_pedidos if total_pedidos > 0 else 0
    print(f"  Promedio de productos por pedido: {promedio:.2f}")
    
    # Tamaño de la base de datos
    cursor.execute("""
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
    """)
    size = cursor.fetchone()[0]
    print(f"\n  Tamaño total de la BD: {size}")
    
    print("=" * 60)


def limpiar_datos_prueba(cursor):
    """Elimina todos los pedidos de prueba (CUIDADO!)"""
    print("\n⚠️  LIMPIANDO DATOS DE PRUEBA...")
    
    # Contar antes
    cursor.execute("SELECT COUNT(*) FROM pedidos")
    antes = cursor.fetchone()[0]
    
    # Eliminar pedidos (CASCADE eliminará pedido_productos)
    cursor.execute("DELETE FROM pedidos WHERE id_usuario_creador IS NOT NULL")
    cursor.connection.commit()
    
    # Contar después
    cursor.execute("SELECT COUNT(*) FROM pedidos")
    despues = cursor.fetchone()[0]
    
    eliminados = antes - despues
    print(f"✅ Eliminados {eliminados:,} pedidos de prueba")


def main():
    parser = argparse.ArgumentParser(
        description='Poblar BD con datos masivos para pruebas de rendimiento'
    )
    parser.add_argument('--host', default='localhost', help='Host de PostgreSQL')
    parser.add_argument('--port', type=int, default=5006, help='Puerto de PostgreSQL')
    parser.add_argument('--dbname', default='fluxo', help='Nombre de la BD')
    parser.add_argument('--user', default='postgres', help='Usuario de PostgreSQL')
    parser.add_argument('--password', default='postgres123', help='Contraseña')
    parser.add_argument('--pedidos', type=int, default=100000, 
                       help='Cantidad de pedidos a generar (default: 100000)')
    parser.add_argument('--limpiar', action='store_true', 
                       help='Limpiar datos de prueba antes de generar')
    parser.add_argument('--solo-stats', action='store_true',
                       help='Solo mostrar estadísticas sin generar datos')
    
    args = parser.parse_args()
    
    # Conectar a BD
    conn = conectar_bd(args.host, args.port, args.dbname, args.user, args.password)
    cursor = conn.cursor()
    
    try:
        if args.solo_stats:
            mostrar_estadisticas(cursor)
            return
        
        # Limpiar si se solicita
        if args.limpiar:
            respuesta = input("⚠️  ¿Estás seguro de eliminar los datos de prueba? (s/N): ")
            if respuesta.lower() == 's':
                limpiar_datos_prueba(cursor)
        
        # Obtener datos necesarios
        productos_ids = obtener_ids_productos(cursor)
        if not productos_ids:
            print("❌ Error: No hay productos en el catálogo. Ejecuta el schema_unificado.sql primero.")
            return
        
        print(f"📦 Productos disponibles en catálogo: {len(productos_ids)}")
        
        usuario_id = obtener_id_usuario_default(cursor)
        print(f"👤 Usuario creador: ID {usuario_id}")
        
        # Generar pedidos
        print(f"\n🚀 Iniciando generación de {args.pedidos:,} pedidos...")
        generar_pedidos_batch(cursor, args.pedidos, productos_ids, usuario_id)
        
        # Mostrar estadísticas finales
        mostrar_estadisticas(cursor)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso interrumpido por el usuario")
        conn.rollback()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()
        print("\n👋 Conexión cerrada")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Script para LIMPIAR/DESPOBLAR la base de datos después de pruebas de rendimiento.
Elimina registros de prueba de forma segura, preservando datos reales si es necesario.

Uso:
    # Eliminar TODOS los pedidos de prueba
    python3 despoblar_bd.py --host localhost --port 5006
    
    # Eliminar pedidos creados después de una fecha
    python3 despoblar_bd.py --desde 2025-11-14
    
    # Eliminar solo pedidos sin cliente real (datos de prueba)
    python3 despoblar_bd.py --solo-prueba
    
    # Ver qué se eliminaría SIN ejecutar (simulación)
    python3 despoblar_bd.py --dry-run

Requisitos:
    pip install psycopg2-binary
"""

import psycopg2
import argparse
from datetime import datetime
import time


class DespobladorBD:
    def __init__(self, host, port, dbname, user, password, dry_run=False):
        self.host = host
        self.port = port
        self.dbname = dbname
        self.dry_run = dry_run
        
        try:
            self.conn = psycopg2.connect(
                host=host, port=port, dbname=dbname, user=user, password=password
            )
            self.cursor = self.conn.cursor()
            print(f"✅ Conexión exitosa a {host}:{port}/{dbname}")
            
            if dry_run:
                print("🔍 MODO SIMULACIÓN: No se eliminarán datos realmente\n")
        except Exception as e:
            print(f"❌ Error de conexión: {e}")
            exit(1)
    
    def mostrar_estadisticas_actuales(self):
        """Muestra estadísticas antes de la limpieza"""
        print("\n" + "=" * 70)
        print("📊 ESTADÍSTICAS ACTUALES DE LA BASE DE DATOS")
        print("=" * 70)
        
        # Total de pedidos
        self.cursor.execute("SELECT COUNT(*) FROM pedidos")
        total_pedidos = self.cursor.fetchone()[0]
        print(f"  Total de pedidos: {total_pedidos:,}")
        
        # Pedidos por estado
        self.cursor.execute("""
            SELECT estado, COUNT(*) as cantidad 
            FROM pedidos 
            GROUP BY estado 
            ORDER BY cantidad DESC
        """)
        print("\n  Distribución por estado:")
        for estado, cantidad in self.cursor.fetchall():
            porcentaje = (cantidad / total_pedidos) * 100 if total_pedidos > 0 else 0
            print(f"    - {estado:12}: {cantidad:8,} ({porcentaje:5.1f}%)")
        
        # Total de productos en pedidos
        self.cursor.execute("SELECT COUNT(*) FROM pedido_productos")
        total_productos = self.cursor.fetchone()[0]
        print(f"\n  Total de productos en pedidos: {total_productos:,}")
        
        # Tamaño de la base de datos
        self.cursor.execute("""
            SELECT pg_size_pretty(pg_database_size(current_database())) as size
        """)
        size = self.cursor.fetchone()[0]
        print(f"  Tamaño total de la BD: {size}")
        
        # Fecha del pedido más antiguo y más reciente
        self.cursor.execute("""
            SELECT 
                MIN(fecha_creacion) as mas_antiguo,
                MAX(fecha_creacion) as mas_reciente
            FROM pedidos
        """)
        mas_antiguo, mas_reciente = self.cursor.fetchone()
        if mas_antiguo and mas_reciente:
            print(f"\n  Rango de fechas de creación:")
            print(f"    - Más antiguo: {mas_antiguo}")
            print(f"    - Más reciente: {mas_reciente}")
        
        print("=" * 70)
    
    def eliminar_todos_pedidos(self):
        """Elimina TODOS los pedidos (PELIGROSO - usar con precaución)"""
        print("\n⚠️  ELIMINANDO TODOS LOS PEDIDOS...")
        
        # Contar antes
        self.cursor.execute("SELECT COUNT(*) FROM pedidos")
        total_antes = self.cursor.fetchone()[0]
        
        self.cursor.execute("SELECT COUNT(*) FROM pedido_productos")
        productos_antes = self.cursor.fetchone()[0]
        
        if self.dry_run:
            print(f"🔍 Se eliminarían:")
            print(f"   - {total_antes:,} pedidos")
            print(f"   - {productos_antes:,} productos asociados")
            return
        
        inicio = time.time()
        
        # Eliminar pedidos (CASCADE eliminará pedido_productos automáticamente)
        self.cursor.execute("DELETE FROM pedidos")
        self.conn.commit()
        
        tiempo = time.time() - inicio
        
        print(f"✅ Eliminados en {tiempo:.2f} segundos:")
        print(f"   - {total_antes:,} pedidos")
        print(f"   - {productos_antes:,} productos asociados")
    
    def eliminar_pedidos_desde_fecha(self, fecha_desde):
        """Elimina pedidos creados desde una fecha específica"""
        print(f"\n🗓️  ELIMINANDO pedidos creados desde {fecha_desde}...")
        
        # Contar cuántos se eliminarán
        self.cursor.execute("""
            SELECT COUNT(*) FROM pedidos 
            WHERE fecha_creacion >= %s
        """, (fecha_desde,))
        total = self.cursor.fetchone()[0]
        
        self.cursor.execute("""
            SELECT COUNT(*) FROM pedido_productos 
            WHERE id_pedido IN (
                SELECT id_pedido FROM pedidos 
                WHERE fecha_creacion >= %s
            )
        """, (fecha_desde,))
        productos_total = self.cursor.fetchone()[0]
        
        if total == 0:
            print(f"ℹ️  No hay pedidos desde {fecha_desde}")
            return
        
        if self.dry_run:
            print(f"🔍 Se eliminarían:")
            print(f"   - {total:,} pedidos")
            print(f"   - {productos_total:,} productos asociados")
            return
        
        inicio = time.time()
        
        # Eliminar
        self.cursor.execute("""
            DELETE FROM pedidos 
            WHERE fecha_creacion >= %s
        """, (fecha_desde,))
        
        self.conn.commit()
        tiempo = time.time() - inicio
        
        print(f"✅ Eliminados en {tiempo:.2f} segundos:")
        print(f"   - {total:,} pedidos")
        print(f"   - {productos_total:,} productos asociados")
    
    def eliminar_pedidos_prueba(self):
        """
        Elimina solo pedidos que parecen ser de prueba.
        Criterios:
        - Cliente con nombre genérico (contiene 'Test', 'Prueba', etc.)
        - Email de prueba (test@, prueba@)
        - Pedidos con usuario creador específico de pruebas
        """
        print("\n🧪 ELIMINANDO solo pedidos de PRUEBA...")
        
        # Construir query para identificar pedidos de prueba
        query_count = """
            SELECT COUNT(*) FROM pedidos 
            WHERE 
                nombre_cliente ILIKE '%test%' 
                OR nombre_cliente ILIKE '%prueba%'
                OR email_cliente ILIKE '%test%'
                OR email_cliente ILIKE '%prueba%'
                OR email_cliente ILIKE '%@test.%'
                OR email_cliente ILIKE '%ejemplo%'
        """
        
        self.cursor.execute(query_count)
        total = self.cursor.fetchone()[0]
        
        if total == 0:
            print("ℹ️  No se encontraron pedidos de prueba evidentes")
            return
        
        # Contar productos asociados
        query_productos = """
            SELECT COUNT(*) FROM pedido_productos 
            WHERE id_pedido IN (
                SELECT id_pedido FROM pedidos 
                WHERE 
                    nombre_cliente ILIKE '%test%' 
                    OR nombre_cliente ILIKE '%prueba%'
                    OR email_cliente ILIKE '%test%'
                    OR email_cliente ILIKE '%prueba%'
                    OR email_cliente ILIKE '%@test.%'
                    OR email_cliente ILIKE '%ejemplo%'
            )
        """
        self.cursor.execute(query_productos)
        productos_total = self.cursor.fetchone()[0]
        
        if self.dry_run:
            # Mostrar algunos ejemplos
            self.cursor.execute("""
                SELECT id_pedido, nombre_cliente, email_cliente, fecha_creacion
                FROM pedidos 
                WHERE 
                    nombre_cliente ILIKE '%test%' 
                    OR nombre_cliente ILIKE '%prueba%'
                    OR email_cliente ILIKE '%test%'
                    OR email_cliente ILIKE '%prueba%'
                    OR email_cliente ILIKE '%@test.%'
                    OR email_cliente ILIKE '%ejemplo%'
                LIMIT 10
            """)
            
            print(f"🔍 Se eliminarían:")
            print(f"   - {total:,} pedidos de prueba")
            print(f"   - {productos_total:,} productos asociados")
            print(f"\n   Ejemplos de pedidos a eliminar:")
            for row in self.cursor.fetchall():
                print(f"     ID {row[0]}: {row[1]} ({row[2]})")
            
            if total > 10:
                print(f"     ... y {total - 10:,} más")
            return
        
        inicio = time.time()
        
        # Eliminar
        query_delete = """
            DELETE FROM pedidos 
            WHERE 
                nombre_cliente ILIKE '%test%' 
                OR nombre_cliente ILIKE '%prueba%'
                OR email_cliente ILIKE '%test%'
                OR email_cliente ILIKE '%prueba%'
                OR email_cliente ILIKE '%@test.%'
                OR email_cliente ILIKE '%ejemplo%'
        """
        
        self.cursor.execute(query_delete)
        self.conn.commit()
        
        tiempo = time.time() - inicio
        
        print(f"✅ Eliminados en {tiempo:.2f} segundos:")
        print(f"   - {total:,} pedidos de prueba")
        print(f"   - {productos_total:,} productos asociados")
    
    def eliminar_pedidos_por_cantidad(self, mantener=100):
        """
        Elimina pedidos antiguos, manteniendo solo los N más recientes.
        Útil para reducir la BD pero mantener datos de ejemplo.
        """
        print(f"\n🔢 MANTENIENDO solo los {mantener} pedidos más recientes...")
        
        # Contar total actual
        self.cursor.execute("SELECT COUNT(*) FROM pedidos")
        total_actual = self.cursor.fetchone()[0]
        
        if total_actual <= mantener:
            print(f"ℹ️  Ya tienes {total_actual} pedidos (menos que el límite de {mantener})")
            return
        
        a_eliminar = total_actual - mantener
        
        # Obtener IDs de los pedidos más antiguos
        self.cursor.execute(f"""
            SELECT id_pedido FROM pedidos 
            ORDER BY fecha_creacion ASC 
            LIMIT {a_eliminar}
        """)
        ids_eliminar = [row[0] for row in self.cursor.fetchall()]
        
        # Contar productos asociados
        self.cursor.execute("""
            SELECT COUNT(*) FROM pedido_productos 
            WHERE id_pedido = ANY(%s)
        """, (ids_eliminar,))
        productos_total = self.cursor.fetchone()[0]
        
        if self.dry_run:
            print(f"🔍 Se eliminarían:")
            print(f"   - {a_eliminar:,} pedidos más antiguos")
            print(f"   - {productos_total:,} productos asociados")
            print(f"   - Se mantendrían los {mantener} más recientes")
            return
        
        inicio = time.time()
        
        # Eliminar
        self.cursor.execute("""
            DELETE FROM pedidos 
            WHERE id_pedido = ANY(%s)
        """, (ids_eliminar,))
        
        self.conn.commit()
        tiempo = time.time() - inicio
        
        print(f"✅ Eliminados en {tiempo:.2f} segundos:")
        print(f"   - {a_eliminar:,} pedidos antiguos")
        print(f"   - {productos_total:,} productos asociados")
        print(f"   - Mantenidos: {mantener} pedidos más recientes")
    
    def vacuum_analyze(self):
        """Ejecuta VACUUM y ANALYZE para optimizar la BD después de eliminar"""
        if self.dry_run:
            print("\n🔍 En modo real se ejecutaría VACUUM ANALYZE para optimizar la BD")
            return
        
        print("\n🧹 Optimizando base de datos...")
        
        # VACUUM requiere autocommit
        old_isolation = self.conn.isolation_level
        self.conn.set_isolation_level(0)
        
        inicio = time.time()
        
        try:
            self.cursor.execute("VACUUM ANALYZE pedidos")
            self.cursor.execute("VACUUM ANALYZE pedido_productos")
            tiempo = time.time() - inicio
            print(f"✅ Optimización completada en {tiempo:.2f} segundos")
        except Exception as e:
            print(f"⚠️  Error durante VACUUM: {e}")
        finally:
            self.conn.set_isolation_level(old_isolation)
    
    def cerrar(self):
        """Cierra la conexión"""
        self.cursor.close()
        self.conn.close()
        print("\n👋 Conexión cerrada")


def main():
    parser = argparse.ArgumentParser(
        description='Despoblar/Limpiar base de datos después de pruebas de rendimiento',
        epilog='IMPORTANTE: Usa --dry-run primero para ver qué se eliminará'
    )
    
    # Conexión
    parser.add_argument('--host', default='localhost', help='Host de PostgreSQL')
    parser.add_argument('--port', type=int, default=5006, help='Puerto de PostgreSQL')
    parser.add_argument('--dbname', default='fluxo', help='Nombre de la BD')
    parser.add_argument('--user', default='postgres', help='Usuario de PostgreSQL')
    parser.add_argument('--password', default='postgres123', help='Contraseña')
    
    # Modos de eliminación
    grupo_modo = parser.add_mutually_exclusive_group(required=True)
    grupo_modo.add_argument('--todo', action='store_true',
                           help='⚠️  ELIMINAR TODOS los pedidos (PELIGROSO)')
    grupo_modo.add_argument('--desde', type=str,
                           help='Eliminar pedidos desde fecha (YYYY-MM-DD)')
    grupo_modo.add_argument('--solo-prueba', action='store_true',
                           help='Eliminar solo pedidos que parecen de prueba')
    grupo_modo.add_argument('--mantener', type=int,
                           help='Mantener solo los N pedidos más recientes')
    grupo_modo.add_argument('--stats', action='store_true',
                           help='Solo mostrar estadísticas sin eliminar')
    
    # Opciones
    parser.add_argument('--dry-run', action='store_true',
                       help='🔍 Simulación: muestra qué se eliminaría sin hacerlo')
    parser.add_argument('--no-vacuum', action='store_true',
                       help='No ejecutar VACUUM después de eliminar')
    parser.add_argument('--si', action='store_true',
                       help='Confirmar automáticamente (sin preguntar)')
    
    args = parser.parse_args()
    
    # Crear despoblador
    despoblador = DespobladorBD(
        args.host, args.port, args.dbname, 
        args.user, args.password, 
        dry_run=args.dry_run
    )
    
    try:
        # Mostrar estadísticas actuales
        despoblador.mostrar_estadisticas_actuales()
        
        # Solo stats, salir
        if args.stats:
            return
        
        # Confirmación de seguridad (excepto en dry-run o --si)
        if not args.dry_run and not args.si:
            print("\n" + "⚠️ " * 20)
            print("⚠️  ADVERTENCIA: Esta operación ELIMINARÁ datos de la base de datos")
            print("⚠️  NO SE PUEDE DESHACER")
            print("⚠️ " * 20)
            
            respuesta = input("\n¿Estás SEGURO de continuar? Escribe 'ELIMINAR' para confirmar: ")
            if respuesta != 'ELIMINAR':
                print("\n❌ Operación cancelada por el usuario")
                return
        
        # Ejecutar según el modo
        if args.todo:
            despoblador.eliminar_todos_pedidos()
        elif args.desde:
            try:
                fecha = datetime.strptime(args.desde, '%Y-%m-%d')
                despoblador.eliminar_pedidos_desde_fecha(fecha)
            except ValueError:
                print(f"❌ Formato de fecha inválido. Use YYYY-MM-DD (ej: 2025-11-14)")
                return
        elif args.solo_prueba:
            despoblador.eliminar_pedidos_prueba()
        elif args.mantener:
            despoblador.eliminar_pedidos_por_cantidad(args.mantener)
        
        # Optimizar BD (si no es dry-run y no se deshabilitó)
        if not args.dry_run and not args.no_vacuum:
            despoblador.vacuum_analyze()
        
        # Mostrar estadísticas finales
        if not args.dry_run:
            print("\n" + "=" * 70)
            print("📊 ESTADÍSTICAS DESPUÉS DE LA LIMPIEZA")
            print("=" * 70)
            despoblador.mostrar_estadisticas_actuales()
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso interrumpido por el usuario")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        despoblador.cerrar()


if __name__ == "__main__":
    main()

import requests
import concurrent.futures
import time

# Configuración base de la API
BASE_URL = "http://localhost:4006/api"

def make_request(url):
    """
    Realiza una solicitud GET al endpoint especificado y calcula el tiempo.
    """
    start_time = time.time()
    try:
        response = requests.get(url, timeout=5)
        end_time = time.time()
        return response.status_code, end_time - start_time
    except requests.exceptions.RequestException as e:
        end_time = time.time()
        return 500, end_time - start_time

def test_rendimiento_concurrente_productos():
    """
    Caso de Prueba (RNF3 - Disponibilidad / Rendimiento):
    El backend en Go debe ser capaz de manejar al menos 50 solicitudes
    concurrentes sin degradación severa del tiempo de respuesta.
    """
    url = f"{BASE_URL}/productos"
    concurrent_requests = 50
    tiempos_respuesta = []
    codigos_estado = []

    # Enviamos 50 peticiones concurrentes usando ThreadPoolExecutor
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_requests) as executor:
        # Iniciamos las peticiones
        futures = [executor.submit(make_request, url) for _ in range(concurrent_requests)]
        
        # Recogemos los resultados a medida que terminan
        for future in concurrent.futures.as_completed(futures):
            status_code, response_time = future.result()
            codigos_estado.append(status_code)
            tiempos_respuesta.append(response_time)

    # Validaciones automatizadas (Asserts)
    
    # 1. Todas las peticiones deben haber sido exitosas (HTTP 200 OK)
    # Si la base de datos o backend colapsa por concurrencia, esto fallará.
    errores = [code for code in codigos_estado if code != 200]
    assert len(errores) == 0, f"Se esperaban 0 errores, pero hubo {len(errores)} fallos devueltos por el backend (Ej. 500 o Timeout)."

    # 2. El tiempo promedio de respuesta no debería sobrepasar 1 segundo (ajustable)
    promedio_tiempo = sum(tiempos_respuesta) / len(tiempos_respuesta)
    assert promedio_tiempo < 1.0, f"El tiempo de respuesta promedio fue muy alto: {promedio_tiempo:.2f} segundos, indicando degradación."
    
    # 3. El tiempo de respuesta máximo no debería ser mayor a 3 segundos
    tiempo_maximo = max(tiempos_respuesta)
    assert tiempo_maximo < 3.0, f"Al menos una petición demoró mas de 3 segundos ({tiempo_maximo:.2f}s) en responder bajo concurrencia."

    print(f"\n✅ [Performance] Prueba exitosa con {concurrent_requests} hilos. Tiempo promedio: {promedio_tiempo:.2f}s | Máx: {tiempo_maximo:.2f}s")

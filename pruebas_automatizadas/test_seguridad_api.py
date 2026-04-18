import requests

# Configuración base de la API
BASE_URL = "http://localhost/api"

def test_seguridad_eliminacion_sin_autenticacion():
    """
    Caso de Prueba Automatizado de API (Control de Acceso)
    ---------------------------------------------------------
    Ref. Documento de Pruebas:
    - Módulo: Autenticación y Gestión de Usuarios
    - Historia de Usuario (HU): HU15 / HU18 - Desactivar y Eliminar Usuario
    - ID del Caso de Prueba: HU15-001 / HU18-001
    - Requisito No Funcional: RNF1 - Restringir funciones "peliagudas" solo a Administradores.
    - Tipo: Funcional (Seguridad) | Prioridad: Alta
    ---------------------------------------------------------
    Este test automatizado valida que el backend (Go) proteja correctamente
    los endpoints destructivos. Un usuario anónimo no debería poder realizar
    peticiones DELETE.
    """
    
    # Intentamos borrar el usuario 1 (se espera que el endpoint esté protegido por middleware)
    url = f"{BASE_URL}/usuarios/1"
    
    # Cabeceras sin token o cookie de sesión válida
    headers = {
        "Content-Type": "application/json"
    }
    
    response = requests.delete(url, headers=headers)
    
    # Validaciones automatizadas (Asserts)
    # Nota: Si el backend devuelve 200 esto fallará, indicando que hay una brecha
    # de seguridad acorde al Requisito No Funcional RNF1.
    
    assert response.status_code in [401, 403], (
        f"BRECHA DE SEGURIDAD (RNF1): Se pudo acceder al endpoint de eliminación. "
        f"Se esperaba HTTP 401/403, pero se recibió HTTP {response.status_code}."
    )
    
    print("\n✅ [Seguridad] La API bloqueó correctamente el intento de eliminación no autorizado.")

def test_seguridad_cabeceras_cors():
    """
    Caso de Prueba (Seguridad adicional - CORS):
    Revisar que la API expone correctamente el middleware CORS y no 
    devuelve un error al hacer preflight cross-origin.
    """
    url = f"{BASE_URL}/productos"
    
    # Simulamos el preflight request de un navegador
    headers = {
        "Origin": "http://localhost:3006",
        "Access-Control-Request-Method": "GET"
    }
    
    response = requests.options(url, headers=headers)
    
    # El status del preflight debería ser 204 o 200
    assert response.status_code in [200, 204], f"El middleware CORS falló. Código: {response.status_code}"
    assert "Access-Control-Allow-Origin" in response.headers, "Falta la cabecera Access-Control-Allow-Origin"
    
    print("\n✅ [Seguridad] Configuración de política de CORS verificada correctamente.")
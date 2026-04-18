import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_interfaz_visual_login_google():
    """
    Caso de Prueba Funcional (GUI)
    ---------------------------------------------------------
    Ref. Documento de Pruebas:
    - Módulo: Autenticación y Gestión de Usuarios
    - Historia de Usuario (HU): HU1 - Iniciar Sesión
    - ID del Caso de Prueba: HU01-001
    - Título: Login exitoso con Google
    - Tipo: Funcional (Seguridad) | Prioridad: Alta
    ---------------------------------------------------------
    Verificar que el botón de Iniciar Sesión con Google
    redirija correctamente a la pasarela de autenticación.
    """
    # 1. Abre el navegador Chrome de forma automática
    print("\n[INFO] Abriendo navegador automatizado...")
    driver = webdriver.Chrome()
    
    try:
        # 2. Navegar a tu Frontend (Asumiendo localhost normal)
        print("[INFO] Ingresando al entorno en localhost...")
        driver.get("http://localhost/login.html")
        
        # Pausa dramática para el video
        time.sleep(2)
        
        # 3. Buscar el botón de ingresar con Google y hacer click
        print("[INFO] Buscando el botón de Google Auth...")
        boton_google = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.CLASS_NAME, "google-login-button"))
        )
        boton_google.click()
        
        # Pausa para dar tiempo a que ocurra la redirección
        time.sleep(3) 
        
        # 4. Verificar qué pasa. Sabiendo que tienes SSO, aseguramos que la URL
        # devuelva a un entorno de API / auth en vez de quedarse estancada.
        url_actual = driver.current_url
        print(f"[INFO] Redirigido a: {url_actual}")
        
        # Debe haber salido de la página estática de login
        assert "login.html" not in url_actual, "Error: El botón de Google no hizo absolutamente nada."
        
        # Debe haber entrado en el flujo de Google
        assert "auth" in url_actual or "google" in url_actual, "Error: Redirección de OAuth incorrecta."
        
        print("✅ [UI Test] REDIRECCIÓN DE SEGURIDAD FUNCIONAL EXITOSA (Google OAuth)")

    finally:
        # Cierra el navegador al finalizar la prueba
        time.sleep(2)
        driver.quit()
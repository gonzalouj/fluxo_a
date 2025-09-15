document.addEventListener('DOMContentLoaded', () => {
    
    // Función para inicializar los listeners del menú.
    // Se llamará DESPUÉS de que el menú se haya cargado.
    const initializeMenu = () => {
        const menuToggle = document.getElementById('menu-toggle'); // Botón hamburguesa en el header
        const mobileMenu = document.getElementById('mobile-menu'); // El menú que inyectamos
        const closeMenuButton = document.getElementById('close-menu-button'); // Botón 'X' en el menú

        // Función para abrir/cerrar
        const toggleMenu = () => {
            if (mobileMenu) {
                mobileMenu.classList.toggle('-translate-x-full');
            }
        };

        // Asignar evento al botón de hamburguesa (que está en la página principal)
        if (menuToggle) {
            menuToggle.addEventListener('click', toggleMenu);
        }

        // Asignar evento al botón de cerrar (que está en el componente)
        if (closeMenuButton) {
            closeMenuButton.addEventListener('click', toggleMenu);
        }
    };
    
    // Cargar el componente del menú y LUEGO inicializarlo
    const menuPlaceholder = document.getElementById('menu-placeholder');
    if (menuPlaceholder) {
        fetch('/menu-componente.html')
            .then(response => response.text())
            .then(data => {
                menuPlaceholder.innerHTML = data;
                // Ahora que el HTML del menú está en la página, podemos buscar sus botones
                initializeMenu();
            })
            .catch(error => console.error('Error al cargar el menú:', error));
    }
});
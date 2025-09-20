// menu-inline.js
// Sistema de menú lateral - versión inline que funciona sin servidor

document.addEventListener('DOMContentLoaded', () => {
    
    // HTML del menú lateral
    const menuHTML = `
        <div id="menu-overlay" class="fixed inset-0 bg-black bg-opacity-20 z-[55] hidden"></div>
        <div id="mobile-menu" class="fixed inset-y-0 left-0 w-64 bg-white z-[60] shadow-lg transform -translate-x-full transition-transform duration-300 ease-in-out">
            <div class="flex items-center justify-between p-4 border-b">
                <h2 class="text-xl font-bold text-gray-800">Menú</h2>
                <button id="close-menu-button" class="p-2 hover:bg-gray-100 rounded-lg">
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="p-4">
                <ul>
                    <li class="mb-2"><a href="index.html" class="block p-2 rounded hover:bg-gray-100">Inicio</a></li>
                    <li class="mb-2"><a href="pedidos.html" class="block p-2 rounded hover:bg-gray-100">Pedidos</a></li>
                </ul>
            </div>
        </div>
    `;

    // Función para inicializar los listeners del menú
    const initializeMenu = () => {
        const menuToggle = document.getElementById('menu-toggle'); // Botón hamburguesa en el header
        const mobileMenu = document.getElementById('mobile-menu'); // El menú que inyectamos
        const closeMenuButton = document.getElementById('close-menu-button'); // Botón 'X' en el menú
        const menuOverlay = document.getElementById('menu-overlay');

        // Función para deshabilitar funciones del header
        const disableHeaderFunctions = () => {
            const searchInput = document.getElementById('search-input');
            const filterToggle = document.getElementById('filter-toggle');
            const saveBtn = document.getElementById('save-btn');
            const resetBtn = document.getElementById('reset-btn');
            
            if (searchInput) {
                searchInput.disabled = true;
                searchInput.style.pointerEvents = 'none';
            }
            if (filterToggle) {
                filterToggle.disabled = true;
                filterToggle.style.pointerEvents = 'none';
            }
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.style.pointerEvents = 'none';
            }
            if (resetBtn) {
                resetBtn.disabled = true;
                resetBtn.style.pointerEvents = 'none';
            }
        };

        // Función para habilitar funciones del header
        const enableHeaderFunctions = () => {
            const searchInput = document.getElementById('search-input');
            const filterToggle = document.getElementById('filter-toggle');
            const saveBtn = document.getElementById('save-btn');
            const resetBtn = document.getElementById('reset-btn');
            
            if (searchInput) {
                searchInput.disabled = false;
                searchInput.style.pointerEvents = 'auto';
            }
            if (filterToggle) {
                filterToggle.disabled = false;
                filterToggle.style.pointerEvents = 'auto';
            }
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.style.pointerEvents = 'auto';
            }
            if (resetBtn) {
                resetBtn.disabled = false;
                resetBtn.style.pointerEvents = 'auto';
            }
        };

        // Función para abrir/cerrar
        const toggleMenu = () => {
            if (mobileMenu && menuOverlay) {
                const isOpen = !mobileMenu.classList.contains('-translate-x-full');
                
                // ✅ CAMBIO 2: Eliminamos la manipulación de opacidad del header.
                // El overlay se encargará de todo de manera uniforme.
                if (isOpen) {
                    // Cerrar menú
                    mobileMenu.classList.add('-translate-x-full');
                    menuOverlay.classList.add('hidden');
                    enableHeaderFunctions();
                } else {
                    // Abrir menú
                    mobileMenu.classList.remove('-translate-x-full');
                    menuOverlay.classList.remove('hidden');
                    disableHeaderFunctions();
                }
            }
        };

        // Función para cerrar el menú (solo cerrar)
        const closeMenu = () => {
            if (mobileMenu && menuOverlay) {
                const isOpen = !mobileMenu.classList.contains('-translate-x-full');
                if (isOpen) {
                    // ✅ CAMBIO 3: También eliminamos la manipulación de opacidad aquí.
                    mobileMenu.classList.add('-translate-x-full');
                    menuOverlay.classList.add('hidden');
                    enableHeaderFunctions();
                }
            }
        };

        // Cerrar menú al hacer click en el overlay
        if (menuOverlay) {
            menuOverlay.onclick = closeMenu;
        }

        // Asignar evento al botón de hamburguesa (que está en el header dinámico)
        if (menuToggle) {
            // Remover listeners anteriores si existen
            menuToggle.removeEventListener('click', toggleMenu);
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevenir que el evento se propague al header
                toggleMenu();
            });
        }

        // Asignar evento al botón de cerrar (que está en el componente)
        if (closeMenuButton) {
            closeMenuButton.removeEventListener('click', toggleMenu);
            closeMenuButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevenir que el evento se propague
                toggleMenu();
            });
        }

        // Agregar evento al header para cerrar el menú
        const header = document.querySelector('header');
        if (header) {
            header.removeEventListener('click', closeMenu);
            header.addEventListener('click', (e) => {
                // Solo cerrar si el menú está abierto y no se hizo click en el botón hamburguesa o sus elementos hijos
                if (!mobileMenu.classList.contains('-translate-x-full') && 
                    e.target.id !== 'menu-toggle' && 
                    !e.target.closest('#menu-toggle')) {
                    closeMenu();
                }
            });
        }
    };
    
    // Cargar el menú
    const menuPlaceholder = document.getElementById('menu-placeholder');
    if (menuPlaceholder) {
        menuPlaceholder.innerHTML = menuHTML;
        // Inicializar el menú después de crearlo
        initializeMenu();
    }

    // Observador para detectar cuando se carga el header dinámico
    const headerObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.target.id === 'header-placeholder') {
                // El header se ha cargado, inicializar el menú
                setTimeout(initializeMenu, 100); // Pequeño delay para asegurar que el DOM esté listo
            }
        });
    });

    // Observar cambios en el placeholder del header
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        headerObserver.observe(headerPlaceholder, { childList: true, subtree: true });
    }
});

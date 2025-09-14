document.addEventListener('DOMContentLoaded', function() {
    const loader = document.getElementById('loader-wrapper');
    const content = document.getElementById('content');
    const mainContentArea = document.getElementById('main-content-area');


    // Function to load pages into the main content area
    function loadPage(pageName) {
        let fullPath = pageName;
        console.log("pageName: "+pageName);

        // If the pageName is an EJS route, let the server render it
        if (pageName.startsWith('/underConstruction')) {
            fullPath = '/renderUnderConstruction?page=' + encodeURIComponent(pageName.split('=')[1]);
        } else if (pageName === 'roles.ejs') {
            fullPath = '/roles';
        } else if (pageName === 'levels.ejs') {
            fullPath = '/levels';
        } else if (pageName === 'employementRelationships.ejs') {
            fullPath = '/employementRelationships';
        } else if (pageName === 'hierarchies.ejs') {
            fullPath = '/hierarchies';
        } else if (pageName === 'incomeTypes.ejs') {
            fullPath = '/incomeTypes';
        } else if (!pageName.startsWith('../html/')) {
            fullPath = '../html/' + pageName;
        }

        fetch(fullPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                mainContentArea.innerHTML = html;

                // Remove any dynamically added script to avoid conflicts
                const dynamicScript = document.getElementById('dynamic-script');
                if (dynamicScript) {
                    dynamicScript.remove();
                }

                // Check if the loaded content contains dashboard elements
                if (mainContentArea.querySelector('#rolesChart') || mainContentArea.querySelector('#salarioChart')) {
                    loadDashboardChartsAndTable();
                }

                // If a catalog page is loaded, load its specific script and initialize it
                if (pageName === 'roles.ejs' || pageName === 'levels.ejs' || pageName === 'employementRelationships.ejs' || pageName === 'incomeTypes.ejs' || pageName === 'hierarchies.ejs') {
                    const script = document.createElement('script');
                    script.id = 'dynamic-script';
                    script.src = '../js/catalog.js';
                    script.onload = () => {
                        if (typeof initializeCatalog === 'function') {
                            if (pageName === 'roles.ejs') {
                                initializeCatalog('roles', 'el','rol');
                            } else if (pageName === 'levels.ejs') {
                                initializeCatalog('levels','el','nivel');
                            } else if (pageName === 'employementRelationships.ejs') {
                                initializeCatalog('employementRelationships','la','relacion laboral');
                            } else if (pageName === 'incomeTypes.ejs') {
                                initializeCatalog('incomeTypes', 'el', 'tipo de ingreso');
                            } else if (pageName === 'hierarchies.ejs') {
                                initializeCatalog('hierarchies', 'la', 'jerarquía');
                            }
                        }
                    };
                    document.body.appendChild(script);
                }

            })
            .catch(error => console.error('Error loading page:', error));
    }

    // Function to load Chart.js and execute dashboard-specific logic
    function loadDashboardChartsAndTable() {
        // Dynamically load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                executeDashboardLogic();
            };
            document.head.appendChild(script);
        } else {
            executeDashboardLogic();
        }
    }

    function executeDashboardLogic() {
        const employees = [
            { nombre: "MAURICIO TADEO", rol: "Adminisrtativo", nivel: "Senior", sueldo: 14440.00 },
            { nombre: "MIGUEL ALBERTO", rol: "Developer", nivel: "Junior", sueldo: 9759.58 },
            { nombre: "SAMUEL", rol: "Arquitecto", nivel: "Junior", sueldo: 24761.64 },
            { nombre: "EDGARDO ALEXANDER", rol: "Analista de Negocio", nivel: "Junior", sueldo: 15660.00 },
            { nombre: "DALIA MARINA", rol: "Adminisrtativo", nivel: "Junior", sueldo: 9660.00 },
            { nombre: "JOSÉ JUAN", rol: "Lider de Pruenas", nivel: "Junior", sueldo: 24760.00 },
            { nombre: "ROBERTO", rol: "Arquitecto", nivel: "Intermedio", sueldo: 72120.00 },
            { nombre: "FERNANDO", rol: "Developer", nivel: "Senior", sueldo: 0.00 },
            { nombre: "EMMANUEL DE JESUS", rol: "Tester", nivel: "Intermedio", sueldo: 15660.00 },
            { nombre: "BRAULIO", rol: "Arquitecto", nivel: "Senior", sueldo: 101200.00 },
            { nombre: "JESUS MARIO", rol: "Adminisrtativo", nivel: "Senior", sueldo: 17580.00 },
            { nombre: "DANIEL", rol: "Arquitecto", nivel: "Junior", sueldo: 18040.00 },
            { nombre: "WILLIAMS CUAHUTEMOC", rol: "Developer", nivel: "Junior", sueldo: 9660.00 },
            { nombre: "EDGAR AUGUSTO", rol: "Arquitecto", nivel: "Junior", sueldo: 9660.00 },
            { nombre: "HENRY", rol: "Tester", nivel: "Intermedio", sueldo: 15660.00 },
            { nombre: "LUIS ALEJANDRO", rol: "Developer", nivel: "Junior", sueldo: 9759.58 },
            { nombre: "JORGE HIRAM", rol: "Lider de Pruenas", nivel: "Senior", sueldo: 62526.42 },
            { nombre: "OSCAR", rol: "Developer", nivel: "Junior", sueldo: 9759.58 },
            { nombre: "JAIRO", rol: "Developer", nivel: "Junior", sueldo: 9759.58 },
            { nombre: "SANDRA LUZ", rol: "Developer", nivel: "Senior", sueldo: 27640.00 },
            { nombre: "CINTHYA KARINA", rol: "Adminisrtativo", nivel: "Senior", sueldo: 18000.42 },
            { nombre: "ARIEL ALBERTINI", rol: "Developer", nivel: "Senior", sueldo: 0.00 },
            { nombre: "FRANCISCO", rol: "Adminisrtativo", nivel: "Senior", sueldo: 74840.00 },
            { nombre: "DAYNER ALEXIS", rol: "Developer", nivel: "Intermedio", sueldo: 19660.00 },
            { nombre: "FREDY DE JESÚS", rol: "Developer", nivel: "Intermedio", sueldo: 19660.00 },
            { nombre: "CARLOS FERNANDO", rol: "Developer", nivel: "Junior", sueldo: 33042.00 },
            { nombre: "GEOVANNI", rol: "Developer", nivel: "Junior", sueldo: 9759.58 },
            { nombre: "MARCOS JAVIER", rol: "Developer", nivel: "Senior", sueldo: 0.00 },
            { nombre: "ABIGAIL", rol: "Developer", nivel: "Junior", sueldo: 9759.58 },
            { nombre: "MANUEL ENRIQUE", rol: "Arquitecto", nivel: "Senior", sueldo: 18040.00 },
            { nombre: "JOSÉ DE JESÚS", rol: "Developer", nivel: "Senior", sueldo: 19660.00 },
            { nombre: "PABLO FABIAN", rol: "Developer", nivel: "Junior", sueldo: 15660.00 },
            { nombre: "EDGAR IVAN", rol: "Adminisrtativo", nivel: "Intermedio", sueldo: 46740.00 },
            { nombre: "FRANCISCO ALEJANDRO", rol: "Adminisrtativo", nivel: "Junior", sueldo: 12000.00 },
            { nombre: "LUIS ENRIQUE", rol: "Tester", nivel: "Intermedio", sueldo: 15660.00 },
            { nombre: "OWEN DYORCAEFF", rol: "Developer", nivel: "Junior", sueldo: 9759.58 },
            { nombre: "RODOLFO", rol: "Developer", nivel: "Junior", sueldo: 29042.00 }
        ];

        // Process data for charts and table
        const roles = {};
        const niveles = {};

        employees.forEach(employee => {
            if (employee.rol) {
                roles[employee.rol] = (roles[employee.rol] || 0) + 1;
            }

            if (employee.nivel && employee.sueldo) {
                if (!niveles[employee.nivel]) {
                    niveles[employee.nivel] = { sum: 0, count: 0 };
                }
                niveles[employee.nivel].sum += employee.sueldo;
                niveles[employee.nivel].count++;
            }
        });

        const avgSalarioByNivel = {};
        for (const nivel in niveles) {
            avgSalarioByNivel[nivel] = niveles[nivel].sum / niveles[nivel].count;
        }

        try {
            // Create Roles Chart
            const rolesCanvas = document.getElementById('rolesChart');
            if (rolesCanvas) {
                const rolesCtx = rolesCanvas.getContext('2d');
                new Chart(rolesCtx, {
                    type: 'pie',
                    data: {
                        labels: Object.keys(roles),
                        datasets: [{
                            label: 'Empleados por Rol',
                            backgroundColor: [
                                'rgba(0, 51, 102, 0.8)',
                                'rgba(102, 153, 204, 0.8)',
                                'rgba(255, 206, 86, 0.8)',
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(153, 102, 255, 0.8)',
                                'rgba(255, 159, 64, 0.8)'
                            ],
                            borderColor: 'rgba(255, 255, 255, 1)',
                            borderWidth: 1
                        }]
                    }
                });
            }

            // Create Salario Chart
            const salarioCanvas = document.getElementById('salarioChart');
            if (salarioCanvas) {
                const salarioCtx = salarioCanvas.getContext('2d');
                new Chart(salarioCtx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(avgSalarioByNivel),
                        datasets: [{
                            label: 'Salario Promedio por Nivel',
                            data: Object.values(avgSalarioByNivel),
                            backgroundColor: 'rgba(0, 51, 102, 0.8)',
                            borderColor: 'rgba(0, 51, 102, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }

            // Populate employees table
            const tableBody = document.querySelector('#empleadosTable tbody');
            if (tableBody) {
                employees.forEach(employee => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${employee.nombre}</td>
                        <td>${employee.rol || 'N/A'}</td>
                        <td>${employee.nivel || 'N/A'}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error during dashboard chart/table rendering:', error);
        }
    }

    // Load dashboard.html on initial page load
    loadPage('../html/dashboard.html');

    setTimeout(() => {
        loader.style.display = 'none';
        content.classList.remove('hidden');
    }, 2000); // 2 segundos de delay para la animación

    // User menu
    const userMenuTrigger = document.getElementById('user-menu-trigger');
    const userInfoCard = document.getElementById('user-info-card');

    userMenuTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        userInfoCard.classList.toggle('hidden');
    });

    // Toggle Panes
    const toggleTopPane = document.getElementById('toggle-top-pane');
    const toggleSidebar = document.getElementById('toggle-sidebar');
    const topPane = document.querySelector('.top-pane');
    const sidebar = document.querySelector('.sidebar');

    toggleTopPane.addEventListener('click', () => {
        topPane.classList.toggle('collapsed');
        const icon = toggleTopPane.querySelector('i');
        icon.classList.toggle('fa-chevron-up');
        icon.classList.toggle('fa-chevron-down');
        if (topPane.classList.contains('collapsed')) {
            toggleTopPane.style.top = '0px';
            toggleSidebar.style.top = '5px';
        } else {
            toggleTopPane.style.top = '80px';
            toggleSidebar.style.top = '85px';
        }
    });

    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        const icon = toggleSidebar.querySelector('i');
        icon.classList.toggle('fa-chevron-left');
        icon.classList.toggle('fa-chevron-right');
        if (sidebar.classList.contains('collapsed')) {
            toggleSidebar.style.left = '0px';
        } else {
            toggleSidebar.style.left = '250px';
        }
    });

    // Display current date
    const dateElement = document.getElementById('current-date');
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const menuItems = document.querySelectorAll('.menu > li > a');

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const submenu = this.nextElementSibling;
            if (submenu && submenu.classList.contains('submenu')) {
                if (submenu.style.display === 'block') {
                    submenu.style.display = 'none';
                } else {
                    // Hide all submenus
                    document.querySelectorAll('.submenu').forEach(sm => sm.style.display = 'none');
                    submenu.style.display = 'block';
                }
            }
        });
    });

    // Reload page on logo click
    const logo = document.getElementById('logo');
    logo.addEventListener('click', () => {
        loadPage('../html/dashboard.html');
    });

    // Load page on submenu click
    const submenuLinks = document.querySelectorAll('.submenu a');
    submenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('href');
            if (page && page !== '#') {
                loadPage(page);
            }
        });
    });
});
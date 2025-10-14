let tutorChart = null; // Global variable to store chart instance

document.addEventListener('DOMContentLoaded', () => {
    initializeTutorships();
});

function initializeTutorships() {
    const searchButton = document.getElementById('search-button');
    const clearButton = document.getElementById('clear-button');
    const nameFilter = document.getElementById('name-filter');
    const employeesTableBody = document.querySelector('#employees-table tbody');
    const searchResults = document.getElementById('search-results');
    const loadingIndicator = document.getElementById('loading-indicator');
    const resultsHeader = document.getElementById('results-header');
    const resultsCountMessage = document.getElementById('results-count-message');
    const assignTutorModal = document.getElementById('assign-tutor-modal');
    const assignTutorForm = document.getElementById('assign-tutor-form');
    const employeeIdField = document.getElementById('employee-id');
    const tutorSelect = document.getElementById('tutor-select');
    const closeButton = assignTutorModal.querySelector('.close-button');
    const cancelButton = assignTutorModal.querySelector('.cancel-button-style');

    // Search functionality
    if (searchButton) {
        searchButton.addEventListener('click', searchEmployees);
    }

    // Allow search on Enter key
    if (nameFilter) {
        nameFilter.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                searchEmployees();
            }
        });
    }

    // Clear functionality
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            nameFilter.value = '';
            searchResults.classList.add('hidden');
            employeesTableBody.innerHTML = '';
        });
    }

    async function searchEmployees() {
        const name = nameFilter.value.trim();

        const queryParams = new URLSearchParams({ name });

        if (searchResults) searchResults.classList.remove('hidden');
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        if (loadingIndicator) loadingIndicator.classList.remove('force-hide');
        if (resultsHeader) resultsHeader.classList.add('force-hide');
        if (employeesTableBody) employeesTableBody.innerHTML = '';

        try {
            const response = await fetch(`/tutorships/search?${queryParams}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const employees = await response.json();
            
            setTimeout(() => {
                if (loadingIndicator) loadingIndicator.classList.add('force-hide');
                if (resultsHeader) resultsHeader.classList.remove('force-hide');
                renderEmployeesTable(employees);
            }, 500);

        } catch (error) {
            console.error('Error searching employees:', error);
            if (loadingIndicator) loadingIndicator.classList.add('force-hide');
            Swal.fire("Error", "Error al buscar empleados.", "error");
        }
    }

    function renderEmployeesTable(employees) {
        if (employeesTableBody) employeesTableBody.innerHTML = '';
        if (resultsCountMessage) {
            resultsCountMessage.textContent = `Se encontraron ${employees.length} resultados`;
            resultsCountMessage.classList.remove('hidden');
        }

        if (employees.length > 0) {
            employees.forEach(employee => {
                const row = document.createElement('tr');
                const tutorName = employee.tutor_lastname 
                    ? `${employee.tutor_lastname} ${employee.tutor_sec_lastname} ${employee.tutor_name}` 
                    : 'Sin asignar';
                
                row.innerHTML = `
                    <td>${employee.lastname} ${employee.sec_lastname} ${employee.name}</td>
                    <td>${tutorName}</td>
                    <td>
                        <button class="action-button assign-button" data-id="${employee.id}">
                            ${employee.tutor_lastname ? 'Modificar' : 'Asignar'}
                        </button>
                    </td>
                `;
                if (employeesTableBody) employeesTableBody.appendChild(row);
            });

            // Add event listeners for assign buttons
            document.querySelectorAll('.assign-button').forEach(button => {
                button.addEventListener('click', handleAssignTutor);
            });
        }
    }

    function handleAssignTutor(event) {
        const employeeId = event.target.dataset.id;
        employeeIdField.value = employeeId;
        assignTutorModal.classList.remove('hidden');
    }

    closeButton.addEventListener('click', () => {
        assignTutorModal.classList.add('hidden');
    });

    cancelButton.addEventListener('click', () => {
        assignTutorModal.classList.add('hidden');
    });

    assignTutorForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const employeeId = employeeIdField.value;
        const tutorId = tutorSelect.value;

        if (!tutorId) {
            Swal.fire("Campo Obligatorio", "Por favor, selecciona un tutor.", "warning");
            return;
        }

        try {
            const response = await fetch(`/tutorships/${employeeId}/tutor`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tutor_id: tutorId })
            });

            if (response.ok) {
                Swal.fire("Éxito", "El tutor ha sido asignado correctamente.", "success").then(() => {
                    assignTutorModal.classList.add('hidden');
                    searchEmployees(); // Refresh the search results
                    fetchAndRenderChart(); // Refresh the chart
                });
            } else {
                const errorData = await response.json();
                Swal.fire("Error", `Error al asignar el tutor: ${errorData.message}`, "error");
            }
        } catch (error) {
            console.error('Error assigning tutor:', error);
            Swal.fire("Error", `Error de conexión al asignar el tutor.`, "error");
        }
    });

    // Fetch and render the chart
    fetchAndRenderChart();
}

async function fetchAndRenderChart() {
    try {
        const response = await fetch('/tutorships/chart-data');
        const data = await response.json();

        const labels = data.map(item => item.tutor_name);
        const values = data.map(item => item.employee_count);

        // Destroy previous chart instance if it exists
        if (tutorChart) {
            tutorChart.destroy();
        }

        const ctx = document.getElementById('tutor-chart').getContext('2d');
        tutorChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Empleados Asignados',
                    data: values,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: {
                        color: '#fff',
                        font: {
                            weight: 'bold',
                            size: 16
                        },
                        formatter: (value, context) => {
                            return value; // Display the count value
                        }
                    },
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += context.parsed + ' empleados';
                                return label;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error fetching chart data:', error);
    }
}

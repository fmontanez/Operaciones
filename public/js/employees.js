function initializeEmployees() {
    const searchButton = document.getElementById('search-button');
    const addButton = document.getElementById('add-button');
    const employeesTableBody = document.querySelector('#employees-table tbody');
    const searchResults = document.getElementById('search-results');
    const loadingIndicator = document.getElementById('loading-indicator');
    const resultsHeader = document.getElementById('results-header');
    const resultsCountMessage = document.getElementById('results-count-message');
    const employeesTable = document.getElementById('employees-table');
    const topScrollbarContainer = document.querySelector('.top-scrollbar-container');
    const topScrollbarDummy = document.querySelector('.top-scrollbar-dummy');
    const employeesTableContainer = document.querySelector('.employees-table-container');

    // Modal elements
    const addModal = document.getElementById('add-modal');
    const editModal = document.getElementById('edit-modal');

    if (searchButton) {
        searchButton.addEventListener('click', searchEmployees);
    }

    async function searchEmployees() {
        console.log('searchEmployees function called');
        const name = document.getElementById('name-filter').value;
        const taxId = document.getElementById('taxId-filter').value;
        const govermentCode = document.getElementById('govermentCode-filter').value;
        const roleId = document.getElementById('role-filter').value;
        const incomeTypeId = document.getElementById('incomeType-filter').value;
        const levelId = document.getElementById('level-filter').value;
        const employementRelationshipId = document.getElementById('employementRelationship-filter').value;

        const queryParams = new URLSearchParams({
            name,
            taxId,
            govermentCode,
            roleId,
            incomeTypeId,
            levelId,
            employementRelationshipId
        });

        if (searchResults) searchResults.classList.remove('hidden');
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        if (loadingIndicator) loadingIndicator.classList.remove('force-hide');
        if (topScrollbarContainer) topScrollbarContainer.classList.add('hidden');
        if (employeesTableContainer) employeesTableContainer.classList.add('hidden');
        if (resultsHeader) resultsHeader.classList.add('force-hide');

        try {
            const response = await fetch(`/employees/search?${queryParams}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const employees = await response.json();
            
            setTimeout(() => {
                if (loadingIndicator) loadingIndicator.classList.add('force-hide');
                if (resultsHeader) resultsHeader.classList.remove('force-hide');
                renderEmployeesTable(employees);
            }, 1000);

        } catch (error) {
            console.error('Error searching employees:', error);
            if (loadingIndicator) loadingIndicator.classList.add('force-hide');
        }
    }

    function renderEmployeesTable(employees) {
        if (employeesTableBody) employeesTableBody.innerHTML = '';
        if (resultsCountMessage) {
            resultsCountMessage.textContent = `Se encontraron ${employees.length} resultados`;
            resultsCountMessage.classList.remove('hidden');
        }

        if (employees.length > 0) {
            if (topScrollbarContainer) topScrollbarContainer.classList.remove('hidden');
            if (employeesTableContainer) employeesTableContainer.classList.remove('hidden');
            employees.forEach(employee => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${employee.id ?? ''}</td>
                    <td>${employee.lastname ?? ''}</td>
                    <td>${employee.sec_lastname ?? ''}</td>
                    <td>${employee.name ?? ''}</td>
                    <td>${employee.email ?? ''}</td>
                    <td>${employee.tax_id ?? ''}</td>
                    <td>${employee.goverment_code ?? ''}</td>
                    <td>${employee.employment_relationship_name ?? ''}</td>
                    <td>${employee.income_type_name ?? ''}</td>
                    <td>${employee.role_name ?? ''}</td>
                    <td>${employee.level_name ?? ''}</td>
                    <td>${employee.hierarchie_name ?? ''}</td>
                    <td>
                        <img src="../img/edit.svg" alt="Edit" class="action-icon edit-icon" data-id="${employee.id}">
                        <img src="../img/delete.svg" alt="Delete" class="action-icon delete-icon" data-id="${employee.id}">
                    </td>
                `;
                if (employeesTableBody) employeesTableBody.appendChild(row);
            });
        } else {
            if (topScrollbarContainer) topScrollbarContainer.classList.add('hidden');
            if (employeesTableContainer) employeesTableContainer.classList.add('hidden');
        }

        if (topScrollbarDummy && employeesTable) {
            topScrollbarDummy.style.width = `${employeesTable.scrollWidth}px`;
        }

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-icon').forEach(button => {
            button.addEventListener('click', handleEdit);
        });

        document.querySelectorAll('.delete-icon').forEach(button => {
            button.addEventListener('click', handleDelete);
        });
    }

    async function handleEdit(event) {
        const id = event.target.dataset.id;
        resetTabs(editModal);
        try {
            const response = await fetch(`/employees/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const employee = await response.json();

            document.getElementById('edit-id').value = employee.id;
            document.getElementById('edit-name').value = employee.name;
            document.getElementById('edit-lastname').value = employee.lastname;
            document.getElementById('edit-sec_lastname').value = employee.sec_lastname;
            document.getElementById('edit-birth_date').value = formatDate(employee.birth_date);
            document.getElementById('edit-email').value = employee.email;
            document.getElementById('edit-tax_id').value = employee.tax_id;
            document.getElementById('edit-goverment_code').value = employee.goverment_code;
            document.getElementById('edit-id_opta').value = employee.id_opta;
            document.getElementById('edit-contracting_date').value = formatDate(employee.contracting_date);
            document.getElementById('edit-social_security_number').value = employee.social_security_number;
            document.getElementById('edit-employement_relationship_id').value = employee.employement_relationship_id;
            document.getElementById('edit-role_id').value = employee.role_id;
            document.getElementById('edit-level_id').value = employee.level_id;
            document.getElementById('edit-hierarchie_id').value = employee.hierarchie_id;
            document.getElementById('edit-transfer_bank_number').value = employee.transfer_bank_number;
            document.getElementById('edit-bank').value = employee.bank;
            document.getElementById('edit-id_bank').value = employee.id_bank;
            document.getElementById('edit-income_type_id').value = employee.income_type_id;
            document.getElementById('edit-imss_bw_gros_salary').value = employee.imss_bw_gros_salary;
            document.getElementById('edit-imss_bw_net_salary').value = employee.imss_bw_net_salary;
            document.getElementById('edit-gin_bw_net_salary').value = employee.gin_bw_net_salary;
            document.getElementById('edit-monthly_bonus').value = employee.monthly_bonus;
            document.getElementById('edit-assignation_bonus').value = employee.assignation_bonus;
            document.getElementById('edit-total_monthly_salary').value = employee.total_monthly_salary;
            document.getElementById('edit-last_rise_date').value = formatDate(employee.last_rise_date);

            if (editModal) {
                editModal.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching employee for edit:', error);
            Swal.fire("Error", `Error al cargar los datos del empleado.`, "error");
        }
    }

    async function handleDelete(event) {
        const id = event.target.dataset.id;
        const result = await Swal.fire({
            title: "Cuidado",
            text: `¿Estás seguro de que quieres eliminar el empleado con ID ${id}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Borrar",
            cancelButtonText: "Cancelar",
            customClass: {
                confirmButton: 'save-button-style',
                cancelButton: 'cancel-button-style'
            }
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/employees/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    Swal.fire("Eliminado!", "El empleado ha sido eliminado de la BD", "success");
                    searchEmployees();
                } else {
                    const errorData = await response.json();
                    Swal.fire("Error", `Error al eliminar el empleado: ${errorData.message}`, "error");
                }
            } catch (error) {
                console.error('Error deleting employee:', error);
                Swal.fire("Error", `Error de conexión al eliminar el empleado.`, "error");
            }
        }
    }

    if (topScrollbarContainer && employeesTableContainer) {
        topScrollbarContainer.addEventListener('scroll', () => {
            employeesTableContainer.scrollLeft = topScrollbarContainer.scrollLeft;
        });

        employeesTableContainer.addEventListener('scroll', () => {
            topScrollbarContainer.scrollLeft = employeesTableContainer.scrollLeft;
        });
    }

    if (addButton) {
        addButton.addEventListener('click', () => {
            resetTabs(addModal);
            if (addModal) {
                addModal.classList.remove('hidden');
            }
        });
    }

    // Close modals
    [addModal, editModal].forEach(modal => {
        if (modal) {
            const closeButton = modal.querySelector('.close-button');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            }

            const cancelButton = modal.querySelector('.cancel-button-style');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            }
        }
    });

    // Handle form submissions
    const addForm = document.getElementById('add-form');
    if (addForm) {
        addForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validateForm(addForm)) return;

            const formData = new FormData(addForm);
            const data = Object.fromEntries(formData.entries());

            for (const key in data) {
                if (data[key] === '') {
                    data[key] = null;
                }
            }

            try {
                const response = await fetch('/employees', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    Swal.fire("Éxito", "El empleado se ha agregado a la BD", "success");
                    addModal.classList.add('hidden');
                    addForm.reset();
                    searchEmployees();
                } else {
                    const errorData = await response.json();
                    Swal.fire("Error", `Error al agregar el empleado: ${errorData.message}`, "error");
                }
            } catch (error) {
                console.error('Error adding employee:', error);
                Swal.fire("Error", `Error de conexión al agregar el empleado.`, "error");
            }
        });
    }

    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validateForm(editForm)) return;

            const formData = new FormData(editForm);
            const data = Object.fromEntries(formData.entries());
            const id = data.id;

            for (const key in data) {
                if (data[key] === '') {
                    data[key] = null;
                }
            }

            try {
                const response = await fetch(`/employees/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    Swal.fire("Éxito", "El empleado se ha actualizado en la BD", "success");
                    editModal.classList.add('hidden');
                    searchEmployees();
                } else {
                    const errorData = await response.json();
                    Swal.fire("Error", `Error al actualizar el empleado: ${errorData.message}`, "error");
                }
            } catch (error) {
                console.error('Error updating employee:', error);
                Swal.fire("Error", `Error de conexión al actualizar el empleado.`, "error");
            }
        });
    }

    function setupTabs(modal) {
        const tabButtons = modal.querySelectorAll('.tab-button');
        const tabContents = modal.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                tabContents.forEach(content => content.classList.remove('active'));
                const tabId = button.dataset.tab;
                modal.querySelector(`#${tabId}`).classList.add('active');
            });
        });
    }

    function resetTabs(modal) {
        if (!modal) return;
        const tabButtons = modal.querySelectorAll('.tab-button');
        const tabContents = modal.querySelectorAll('.tab-content');

        tabButtons.forEach(btn => btn.classList.remove('active'));
        if (tabButtons.length > 0) {
            tabButtons[0].classList.add('active');
        }

        tabContents.forEach(content => content.classList.remove('active'));
        if (tabContents.length > 0) {
            tabContents[0].classList.add('active');
        }
    }

    if (addModal) setupTabs(addModal);
    if (editModal) setupTabs(editModal);

    function validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');

        for (const field of requiredFields) {
            const label = form.querySelector(`label[for="${field.id}"]`).textContent;

            if (field.tagName === 'SELECT') {
                if (field.value === '') {
                    const tabContent = field.closest('.tab-content');
                    const tabButton = form.querySelector(`[data-tab="${tabContent.id}"]`);
                    
                    const allTabs = form.querySelectorAll('.tab-content');
                    const allTabButtons = form.querySelectorAll('.tab-button');
                    allTabs.forEach(t => t.classList.remove('active'));
                    allTabButtons.forEach(b => b.classList.remove('active'));
                    tabContent.classList.add('active');
                    tabButton.classList.add('active');

                    Swal.fire("Campo Obligatorio", `Por favor, selecciona un valor para el campo "${label}".`, "warning");
                    field.focus();
                    return false;
                }
            } else if (!field.value.trim()) {
                const tabContent = field.closest('.tab-content');
                const tabButton = form.querySelector(`[data-tab="${tabContent.id}"]`);

                // Activate the tab
                const allTabs = form.querySelectorAll('.tab-content');
                const allTabButtons = form.querySelectorAll('.tab-button');
                allTabs.forEach(t => t.classList.remove('active'));
                allTabButtons.forEach(b => b.classList.remove('active'));
                tabContent.classList.add('active');
                tabButton.classList.add('active');

                Swal.fire("Campo Obligatorio", `El campo "${label}" no puede estar vacío.`, "warning");
                field.focus();
                return false;
            }
        }

        const contractingDate = form.querySelector('[name="contracting_date"]').value;
        const lastRiseDate = form.querySelector('[name="last_rise_date"]').value;

        if (contractingDate && lastRiseDate) {
            const contracting = new Date(contractingDate);
            const lastRise = new Date(lastRiseDate);
            const today = new Date();

            if (lastRise < contracting) {
                Swal.fire("Error de Validación", "La fecha de último aumento no puede ser anterior a la fecha de contratación.", "error");
                return false;
            }
            if (lastRise > today) {
                Swal.fire("Error de Validación", "La fecha de último aumento no puede ser futura.", "error");
                return false;
            }
        }

        return true;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Initial search to populate the table
    searchEmployees();
}
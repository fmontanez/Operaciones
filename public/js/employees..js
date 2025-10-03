
function initializeEmployees() {
    const searchButton = document.getElementById('search-button');
    console.log('searchButton element:', searchButton);
    const addButton = document.getElementById('add-button');
    const employeesTableBody = document.querySelector('#employees-table tbody');
    const searchResults = document.getElementById('search-results');
    const loadingIndicator = document.getElementById('loading-indicator');
    const resultsHeader = document.getElementById('results-header');
    const resultsCountMessage = document.getElementById('results-count-message');
    const employeesTable = document.getElementById('employees-table');

    searchButton.addEventListener('click', searchEmployees);

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
        if (employeesTable) employeesTable.classList.add('hidden');
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
            if (employeesTable) employeesTable.classList.remove('hidden');
            employees.forEach(employee => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${employee.id}</td>
                    <td>${employee.lastname}</td>
                    <td>${employee.sec_lastname}</td>
                    <td>${employee.name}</td>
                    <td>${employee.email}</td>
                    <td>${employee.tax_id}</td>
                    <td>${employee.goverment_code}</td>
                    <td>${employee.employment_relationship_name}</td>
                    <td>${employee.income_type_name}</td>
                    <td>${employee.role_name}</td>
                    <td>${employee.level_name}</td>
                    <td>${employee.hierarchie_name}</td>
                    <td>
                        <img src="../img/edit.svg" alt="Edit" class="action-icon" data-id="${employee.id}" onclick="editEmployee(${employee.id})">
                        <img src="../img/detail.svg" alt="Detail" class="action-icon" data-id="${employee.id}" onclick="viewEmployee(${employee.id})">
                        <img src="../img/delete.svg" alt="Delete" class="action-icon" data-id="${employee.id}" onclick="deleteEmployee(${employee.id})">
                    </td>
                `;
                if (employeesTableBody) employeesTableBody.appendChild(row);
            });
        } else {
            if (employeesTable) employeesTable.classList.add('hidden');
        }
    }

    window.editEmployee = function(id) {
        // Implement edit functionality
        console.log('Editing employee with id:', id);
    };

    window.viewEmployee = function(id) {
        // Implement view functionality
        console.log('Viewing employee with id:', id);
    };

    window.deleteEmployee = function(id) {
        // Implement delete functionality
        console.log('Deleting employee with id:', id);
    };

    if (addButton) {
        addButton.addEventListener('click', function() {
            // Implement add functionality
            console.log('Add new employee');
        });
    }

    // Initial search to populate the table
    searchEmployees();
}

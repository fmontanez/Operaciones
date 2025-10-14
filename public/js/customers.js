// Customers Module - Frontend JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeCustomers();
});

function initializeCustomers() {
    // Filter elements
    const searchButton = document.getElementById('search-button');
    const nameFilter = document.getElementById('name-filter');
    const taxCodeFilter = document.getElementById('taxCode-filter');
    const searchResults = document.getElementById('search-results');
    const customersTableBody = document.querySelector('#customers-table tbody');
    const resultsCountMessage = document.getElementById('results-count-message');
    const resultsHeader = document.getElementById('results-header');
    const loadingIndicator = document.getElementById('loading-indicator');
    const customersTable = document.getElementById('customers-table');

    // Add Modal elements
    const addButton = document.getElementById('add-button');
    const addModal = document.getElementById('add-modal');
    const addForm = document.getElementById('add-form');
    const cancelAddBtn = document.getElementById('cancel-add-btn');
    const addCloseButton = addModal.querySelector('.close-button');

    // Edit Modal elements
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editCloseButton = editModal.querySelector('.close-button');

    // Perform search when search button is clicked
    searchButton.addEventListener('click', performSearch);

    // Also perform search when Enter key is pressed in filter inputs
    nameFilter.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    taxCodeFilter.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Function to perform search and render results
    async function performSearch() {
        const name = nameFilter.value;
        const taxCode = taxCodeFilter.value;

        searchResults.classList.remove('hidden');
        loadingIndicator.classList.remove('hidden');
        customersTable.classList.add('hidden');
        resultsHeader.classList.add('hidden');

        try {
            const response = await fetch(`/customers/search?name=${encodeURIComponent(name)}&taxCode=${encodeURIComponent(taxCode)}`);
            const customers = await response.json();

            // Process results after a brief delay to show loading animation
            setTimeout(() => {
                // ISSUE 1 FIX: Explicitly hide loading indicator after results are loaded
                loadingIndicator.classList.add('hidden');
                loadingIndicator.style.display = 'none'; // Force hide with inline style
                
                // Show results header
                resultsHeader.classList.remove('hidden');
                
                // Clear previous results
                customersTableBody.innerHTML = '';

                const N = customers.length;
                resultsCountMessage.textContent = `Se encontraron ${N} resultados`;
                resultsCountMessage.classList.remove('hidden');

                if (N > 0) {
                    // ISSUE 2 FIX: Show table when there are results
                    customersTable.classList.remove('hidden');
                    customersTable.style.display = ''; // Clear any inline display style

                    customers.forEach(customer => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${customer.customer_id}</td>
                            <td>${customer.name || ''}</td>
                            <td>${customer.legal_name || ''}</td>
                            <td>${customer.tax_code || ''}</td>
                            <td>${customer.country_name || ''}</td>
                            <td>${customer.currency_code || ''}</td>
                            <td class="actions-cell">
                                <img src="/img/edit.svg" alt="Editar" class="action-icon edit-icon" data-id="${customer.customer_id}">
                                <img src="/img/delete.svg" alt="Borrar" class="action-icon delete-icon" data-id="${customer.customer_id}">
                            </td>
                        `;
                        customersTableBody.appendChild(row);
                    });

                    // Add event listeners for edit icons
                    document.querySelectorAll('.edit-icon').forEach(icon => {
                        icon.addEventListener('click', handleEdit);
                    });

                    // Add event listeners for delete icons
                    document.querySelectorAll('.delete-icon').forEach(icon => {
                        icon.addEventListener('click', handleDelete);
                    });
                } else {
                    // ISSUE 2 FIX: Hide table when there are 0 results
                    // This ensures only the message and "Agregar" button remain visible
                    customersTable.classList.add('hidden');
                    customersTable.style.display = 'none'; // Force hide with inline style
                }
            }, 300);
        } catch (error) {
            console.error('Error searching customers:', error);
            // ISSUE 1 FIX: Also hide loading indicator on error
            loadingIndicator.classList.add('hidden');
            loadingIndicator.style.display = 'none';
            resultsHeader.classList.remove('hidden');
            Swal.fire({
                title: 'Error',
                text: 'Error al buscar clientes. Por favor intente de nuevo.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    // Show Add Modal
    addButton.addEventListener('click', function() {
        addForm.reset();
        addModal.classList.remove('hidden');
    });

    // Close Add Modal
    cancelAddBtn.addEventListener('click', function() {
        addModal.classList.add('hidden');
    });

    addCloseButton.addEventListener('click', function() {
        addModal.classList.add('hidden');
    });

    // Submit Add Form
    addForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('add-name').value,
            legal_name: document.getElementById('add-legal_name').value,
            tax_code: document.getElementById('add-tax_code').value,
            country_id: document.getElementById('add-country_id').value,
            invoice_currency_id: document.getElementById('add-invoice_currency_id').value
        };

        // Client-side validation
        if (!formData.name || formData.name.length < 2) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'El nombre debe tener al menos 2 caracteres.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (!formData.legal_name || formData.legal_name.length < 2) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'La razón social debe tener al menos 2 caracteres.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (!formData.country_id) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'Debe seleccionar un país.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (!formData.invoice_currency_id) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'Debe seleccionar una moneda de facturación.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            const response = await fetch('/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                addModal.classList.add('hidden');
                Swal.fire({
                    title: 'Éxito',
                    text: 'Cliente agregado exitosamente.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    performSearch();
                });
            } else {
                const error = await response.json();
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'Error al agregar el cliente.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al agregar el cliente. Por favor intente de nuevo.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    });

    // Handle Edit
    async function handleEdit(event) {
        const customerId = event.target.dataset.id;

        try {
            const response = await fetch(`/customers/${customerId}`);
            const customer = await response.json();

            document.getElementById('edit-customer_id').value = customer.customer_id;
            document.getElementById('edit-name').value = customer.name;
            document.getElementById('edit-legal_name').value = customer.legal_name;
            document.getElementById('edit-tax_code').value = customer.tax_code || '';
            document.getElementById('edit-country_id').value = customer.country_id;
            document.getElementById('edit-invoice_currency_id').value = customer.invoice_currency_id;

            editModal.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching customer:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al cargar los datos del cliente.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    // Close Edit Modal
    cancelEditBtn.addEventListener('click', function() {
        editModal.classList.add('hidden');
    });

    editCloseButton.addEventListener('click', function() {
        editModal.classList.add('hidden');
    });

    // Submit Edit Form
    editForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const customerId = document.getElementById('edit-customer_id').value;
        const formData = {
            name: document.getElementById('edit-name').value,
            legal_name: document.getElementById('edit-legal_name').value,
            tax_code: document.getElementById('edit-tax_code').value,
            country_id: document.getElementById('edit-country_id').value,
            invoice_currency_id: document.getElementById('edit-invoice_currency_id').value
        };

        // Client-side validation
        if (!formData.name || formData.name.length < 2) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'El nombre debe tener al menos 2 caracteres.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (!formData.legal_name || formData.legal_name.length < 2) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'La razón social debe tener al menos 2 caracteres.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (!formData.country_id) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'Debe seleccionar un país.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (!formData.invoice_currency_id) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'Debe seleccionar una moneda de facturación.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            const response = await fetch(`/customers/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                editModal.classList.add('hidden');
                Swal.fire({
                    title: 'Éxito',
                    text: 'Cliente actualizado exitosamente.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    performSearch();
                });
            } else {
                const error = await response.json();
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'Error al actualizar el cliente.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al actualizar el cliente. Por favor intente de nuevo.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    });

    // Handle Delete
    async function handleDelete(event) {
        const customerId = event.target.dataset.id;

        const result = await Swal.fire({
            title: 'Cuidado',
            text: `¿Estás seguro de que quieres eliminar el cliente con ID ${customerId}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Borrar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/customers/${customerId}`, {
                    method: 'DELETE'
                });

                if (response.ok || response.status === 204) {
                    Swal.fire({
                        title: 'Eliminado',
                        text: 'Cliente eliminado exitosamente.',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        performSearch();
                    });
                } else {
                    const error = await response.json();
                    Swal.fire({
                        title: 'Error',
                        text: error.message || 'Error al eliminar el cliente.',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                console.error('Error deleting customer:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Error al eliminar el cliente. Por favor intente de nuevo.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        }
    }

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === addModal) {
            addModal.classList.add('hidden');
        }
        if (event.target === editModal) {
            editModal.classList.add('hidden');
        }
    });
}

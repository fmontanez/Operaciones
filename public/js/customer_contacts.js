// Customer Contacts Module - Frontend JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeCustomerContacts();
});

function initializeCustomerContacts() {
    // Filter elements
    const searchButton = document.getElementById('search-button');
    const nombreFilter = document.getElementById('nombre-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchResults = document.getElementById('search-results');
    const contactsTableBody = document.querySelector('#contacts-table tbody');
    const resultsCountMessage = document.getElementById('results-count-message');
    const resultsHeader = document.getElementById('results-header');
    const loadingIndicator = document.getElementById('loading-indicator');
    const contactsTable = document.getElementById('contacts-table');

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
    nombreFilter.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    roleFilter.addEventListener('change', performSearch);

    // Function to format roles as badges
    function formatRoles(roleNames) {
        if (!roleNames || roleNames.length === 0) {
            return '<span class="badge">Sin roles</span>';
        }
        // Remove null values and create badges
        return roleNames
            .filter(role => role !== null)
            .map(role => `<span class="badge">${role}</span>`)
            .join(' ');
    }

    // Function to perform search and render results
    async function performSearch() {
        const nombre = nombreFilter.value;
        const role_id = roleFilter.value;

        searchResults.classList.remove('hidden');
        loadingIndicator.classList.remove('hidden');
        contactsTable.classList.add('hidden');
        resultsHeader.classList.add('hidden');

        try {
            const response = await fetch(`/customer_contacts/search?nombre=${encodeURIComponent(nombre)}&role_id=${encodeURIComponent(role_id)}`);
            const contacts = await response.json();

            // Process results after a brief delay to show loading animation
            setTimeout(() => {
                loadingIndicator.classList.add('hidden');
                loadingIndicator.style.display = 'none';
                
                resultsHeader.classList.remove('hidden');
                
                // Clear previous results
                contactsTableBody.innerHTML = '';

                const N = contacts.length;
                resultsCountMessage.textContent = `Se encontraron ${N} resultados`;
                resultsCountMessage.classList.remove('hidden');

                if (N > 0) {
                    contactsTable.classList.remove('hidden');
                    contactsTable.style.display = '';

                    contacts.forEach(contact => {
                        const fullName = `${contact.name || ''} ${contact.lastname || ''} ${contact.sec_lastname || ''}`.trim();
                        const rolesHtml = formatRoles(contact.role_names);
                        
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${fullName}</td>
                            <td>${contact.customer_name || ''}</td>
                            <td>${contact.email || ''}</td>
                            <td>${rolesHtml}</td>
                            <td class="actions-cell">
                                <img src="/img/edit.svg" alt="Editar" class="action-icon edit-icon" data-id="${contact.id}">
                                <img src="/img/delete.svg" alt="Borrar" class="action-icon delete-icon" data-id="${contact.id}">
                            </td>
                        `;
                        contactsTableBody.appendChild(row);
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
                    contactsTable.classList.add('hidden');
                    contactsTable.style.display = 'none';
                }
            }, 300);
        } catch (error) {
            console.error('Error searching customer contacts:', error);
            loadingIndicator.classList.add('hidden');
            loadingIndicator.style.display = 'none';
            resultsHeader.classList.remove('hidden');
            Swal.fire({
                title: 'Error',
                text: 'Error al buscar contactos. Por favor intente de nuevo.',
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

        const rolesSelect = document.getElementById('add-roles');
        const selectedRoles = Array.from(rolesSelect.selectedOptions).map(option => parseInt(option.value));

        const formData = {
            customer_id: document.getElementById('add-customer_id').value,
            name: document.getElementById('add-name').value,
            lastname: document.getElementById('add-lastname').value,
            sec_lastname: document.getElementById('add-sec_lastname').value,
            email: document.getElementById('add-email').value,
            notes: document.getElementById('add-notes').value,
            roles: selectedRoles
        };

        // Client-side validation
        if (!formData.customer_id) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'Debe seleccionar un cliente.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (!formData.name || formData.name.length < 2) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'El nombre debe tener al menos 2 caracteres.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (!formData.lastname || formData.lastname.length < 2) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'El apellido paterno debe tener al menos 2 caracteres.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (formData.roles.length === 0) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'Debe seleccionar al menos un rol.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            const response = await fetch('/customer_contacts', {
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
                    text: 'Contacto agregado exitosamente.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    performSearch();
                });
            } else {
                const error = await response.json();
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'Error al agregar el contacto.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error adding customer contact:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al agregar el contacto. Por favor intente de nuevo.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    });

    // Handle Edit
    async function handleEdit(event) {
        const contactId = event.target.dataset.id;

        try {
            const response = await fetch(`/customer_contacts/${contactId}`);
            const contact = await response.json();

            document.getElementById('edit-id').value = contact.id;
            document.getElementById('edit-customer_id').value = contact.customer_id;
            document.getElementById('edit-name').value = contact.name;
            document.getElementById('edit-lastname').value = contact.lastname;
            document.getElementById('edit-sec_lastname').value = contact.sec_lastname || '';
            document.getElementById('edit-email').value = contact.email || '';
            document.getElementById('edit-notes').value = contact.notes || '';

            // Select multiple roles
            const rolesSelect = document.getElementById('edit-roles');
            Array.from(rolesSelect.options).forEach(option => {
                option.selected = contact.roles.includes(parseInt(option.value));
            });

            editModal.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching customer contact:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al cargar los datos del contacto.',
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

        const contactId = document.getElementById('edit-id').value;
        const rolesSelect = document.getElementById('edit-roles');
        const selectedRoles = Array.from(rolesSelect.selectedOptions).map(option => parseInt(option.value));

        const formData = {
            customer_id: document.getElementById('edit-customer_id').value,
            name: document.getElementById('edit-name').value,
            lastname: document.getElementById('edit-lastname').value,
            sec_lastname: document.getElementById('edit-sec_lastname').value,
            email: document.getElementById('edit-email').value,
            notes: document.getElementById('edit-notes').value,
            roles: selectedRoles
        };

        // Client-side validation
        if (!formData.customer_id) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'Debe seleccionar un cliente.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (!formData.name || formData.name.length < 2) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'El nombre debe tener al menos 2 caracteres.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (!formData.lastname || formData.lastname.length < 2) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'El apellido paterno debe tener al menos 2 caracteres.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (formData.roles.length === 0) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'Debe seleccionar al menos un rol.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            const response = await fetch(`/customer_contacts/${contactId}`, {
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
                    text: 'Contacto actualizado exitosamente.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    performSearch();
                });
            } else {
                const error = await response.json();
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'Error al actualizar el contacto.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error updating customer contact:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al actualizar el contacto. Por favor intente de nuevo.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    });

    // Handle Delete
    async function handleDelete(event) {
        const contactId = event.target.dataset.id;

        const result = await Swal.fire({
            title: 'Cuidado',
            text: `¿Estás seguro de que quieres eliminar este contacto?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Borrar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/customer_contacts/${contactId}`, {
                    method: 'DELETE'
                });

                if (response.ok || response.status === 204) {
                    Swal.fire({
                        title: 'Eliminado',
                        text: 'Contacto eliminado exitosamente.',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        performSearch();
                    });
                } else {
                    const error = await response.json();
                    Swal.fire({
                        title: 'Error',
                        text: error.message || 'Error al eliminar el contacto.',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                console.error('Error deleting customer contact:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Error al eliminar el contacto. Por favor intente de nuevo.',
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

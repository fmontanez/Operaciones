function initializeCatalogForm(catalogName,article,singleName) {
    const clearBtn = document.getElementById('clear-btn');
    const searchBtn = document.getElementById('search-btn');
    const idFilter = document.getElementById('id-filter');
    const nameFilter = document.getElementById('name-filter');
    const searchResults = document.getElementById('search-results');
    const catalogTableBody = document.querySelector('#catalog-table tbody');
    const resultsCountMessage = document.getElementById('results-count-message');
    const resultsHeader = document.getElementById('results-header');

    // Modal elements
    const editModal = document.getElementById('edit-modal');
    let closeButton;
    if (editModal) {
        closeButton = editModal.querySelector('.close-button');
    }
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editForm = document.getElementById('edit-form');
    const editId = document.getElementById('edit-id');
    const editName = document.getElementById('edit-name');
    const editDescription = document.getElementById('edit-description');
    
    // Add Modal elements
    const addBtn = document.getElementById('add-btn');
    const addModal = document.getElementById('add-modal');
    const cancelAddBtn = document.getElementById('cancel-add-btn');
    const addForm = document.getElementById('add-form');
    const addName = document.getElementById('add-name');
    const addDescription = document.getElementById('add-description');

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (idFilter) idFilter.value = '';
            if (nameFilter) nameFilter.value = '';
        });
    }

    // Function to perform search and render results
    async function performSearch() {
        const id = idFilter ? idFilter.value : '';
        const name = nameFilter ? nameFilter.value : '';

        const loadingIndicator = document.getElementById('loading-indicator');
        const catalogTable = document.getElementById('catalog-table');

        if (searchResults) searchResults.classList.remove('hidden');
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        if (loadingIndicator) loadingIndicator.classList.remove('force-hide');
        if (catalogTable) catalogTable.classList.add('hidden');
        if (resultsHeader) resultsHeader.classList.add('force-hide');

        const response = await fetch(`/${catalogName}/search?id=${id}&name=${name}`);
        const items = await response.json();

        setTimeout(() => {
            if (loadingIndicator) loadingIndicator.classList.add('force-hide');
            if (resultsHeader) resultsHeader.classList.remove('force-hide');
            if (catalogTableBody) catalogTableBody.innerHTML = '';

            const N = items.length;
            if (resultsCountMessage) {
                resultsCountMessage.textContent = `Se encontraron ${N} resultados`;
                resultsCountMessage.classList.remove('hidden');
            }
            if (addBtn) addBtn.classList.remove('hidden');

            if (N > 0) {
                if (catalogTable) catalogTable.classList.remove('hidden');

                items.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.id}</td>
                        <td>${item.name}</td>
                        <td>${item.description}</td>
                        <td><img src="/img/edit.svg" alt="Editar" class="action-icon edit-icon" data-id="${item.id}" data-name="${item.name}" data-description="${item.description}"></td>
                        <td><img src="/img/delete.svg" alt="Borrar" class="action-icon delete-icon" data-id="${item.id}"></td>
                    `;
                    if (catalogTableBody) catalogTableBody.appendChild(row);
                });

                document.querySelectorAll('.edit-icon').forEach(icon => {
                    icon.addEventListener('click', (event) => {
                        const { id, name, description } = event.target.dataset;
                        if (editId) editId.value = id;
                        if (editName) editName.value = name;
                        if (editDescription) editDescription.value = description;
                        if (editModal) editModal.classList.remove('hidden');
                    });
                });

                document.querySelectorAll('.delete-icon').forEach(icon => {
                    icon.addEventListener('click', async (event) => {
                        const itemId = event.target.dataset.id;
                        const result = await Swal.fire({
                            title: "Cuidado",
                            text: `¿Estás seguro de que quieres eliminar ${article} ${singleName} con ID ${itemId}?`,
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
                                const response = await fetch(`/${catalogName}/${itemId}`, {
                                    method: 'DELETE'
                                });
                                if (response.ok) {
                                    Swal.fire({
                                        title: "Eliminado!",
                                        text: "El registro ha sido eliminado de la BD",
                                        icon: "success",
                                        customClass: {
                                            confirmButton: 'save-button-style',
                                        }

                                    });
                                    performSearch();
                                } else {
                                    const errorData = await response.json();
                                    Swal.fire({
                                        title: "Error",
                                        text: `Error al eliminar ${article} ${singleName}: ${errorData.message}`,
                                        icon: "Error",
                                        customClass: {
                                            confirmButton: 'save-button-style',
                                        }
                                    });
                                }
                            } catch (error) {
                                console.error(`Error deleting ${singleName}:`, error);
                                Swal.fire({
                                    title: "Error",
                                    text: `Error al eliminar el ${singleName}: ${errorData.message}`,
                                    icon: "Error",
                                    customClass: {
                                        confirmButton: 'save-button-style',
                                    }                                    
                                });
                            }
                        }
                    });
                });
            } else {
                if (catalogTable) catalogTable.classList.add('hidden');
            }
        }, 1000);
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    performSearch();

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (editModal) editModal.classList.add('hidden');
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            if (editModal) editModal.classList.add('hidden');
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (addModal) addModal.classList.remove('hidden');
        });
    }

    if (addModal) {
        const closeBtn = addModal.querySelector('.close-button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                addModal.classList.add('hidden');
                if (addForm) addForm.reset();
            });
        }
    }

    if (cancelAddBtn) {
        cancelAddBtn.addEventListener('click', () => {
            if (addModal) addModal.classList.add('hidden');
            if (addForm) addForm.reset();
        });
    }

    if (addForm) {
        addForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = addName ? addName.value.trim() : '';
            const description = addDescription ? addDescription.value.trim() : '';

            if (name.length < 2 || name.length > 32) {
                Swal.fire({
                    title: "Error de Validación",
                    text: "El nombre debe tener entre 2 y 32 caracteres.",
                    icon: "error",
                    customClass: {
                        confirmButton: 'save-button-style',
                    }

                });
                return;
            }
            if (description.length < 2 || description.length > 128) {
                Swal.fire({
                    title: "Error de Validación",
                    text: "La descripción debe tener entre 2 y 128 caracteres.",
                    icon: "error",
                    customClass: {
                        confirmButton: 'save-button-style',
                    }
                });
                return;
            }

            try {
                const response = await fetch(`/${catalogName}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, description })
                });
                if (response.ok) {
                    Swal.fire({
                        title: "Éxito",
                        text: `${article.charAt(0).toUpperCase() + article.slice(1).toLowerCase()} ${singleName} se ha agregado a la BD`,
                        icon: "success",
                        customClass: {
                            confirmButton: 'save-button-style',
                        }
                    });
                    if (addModal) addModal.classList.add('hidden');
                    if (addForm) addForm.reset();
                    performSearch();
                } else {
                    const errorData = await response.json();
                    Swal.fire({
                        title: "Error",
                        text: `Error al agregar ${article} ${singleName}: ${errorData.message}`,
                        icon: "Error",
                        customClass: {
                            confirmButton: 'save-button-style',
                        }
                    });
                }
            } catch (error) {
                console.error(`Error adding ${singleName}:`, error);
                Swal.fire({
                    title: "Error",
                    text: `Error de conexión al agregar el ${singleName}.`,
                    icon: "Error",
                    customClass: {
                        confirmButton: 'save-button-style',
                    }
                });
            }
        });
    }

    if (editForm) {
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const id = editId ? editId.value : '';
            const name = editName ? editName.value.trim() : '';
            const description = editDescription ? editDescription.value.trim() : '';

            if (name.length < 2 || name.length > 32) {
                Swal.fire({
                    title: "Error de Validación",
                    text: "El nombre debe tener entre 2 y 32 caracteres.",
                    icon: "error",
                    customClass: {
                        confirmButton: 'save-button-style',
                    }
                });
                return;
            }
            if (description.length < 2 || description.length > 128) {
                Swal.fire({
                    title: "Error de Validación",
                    text: "La descripción debe tener entre 2 y 128 caracteres.",
                    icon: "error",
                    customClass: {
                        confirmButton: 'save-button-style',
                    }
                });
                return;
            }

            try {
                const response = await fetch(`/${catalogName}/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, description })
                });
                if (response.ok) {
                    Swal.fire({
                        title: "Éxito",
                        text: `${article.charAt(0).toUpperCase() + article.slice(1).toLowerCase()} ${singleName} se ha actualizado en la BD`,
                        icon: "success",
                        customClass: {
                            confirmButton: 'save-button-style',
                        }
                    });
                    if (editModal) editModal.classList.add('hidden');
                    performSearch();
                } else {
                    const errorData = await response.json();
                    Swal.fire({
                        title: "Error",
                        text: `Error al actualizar ${article} ${singleName}: ${errorData.message}`,
                        icon: "Error",
                        customClass: {
                            confirmButton: 'save-button-style',
                        }
                    });
                }
            } catch (error) {
                console.error(`Error updating ${singleName}:`, error);
                Swal.fire({
                    title: "Error",
                    text: `Error de conexión al actualizar ${article} ${singleName}.`,
                    icon: "Error",
                    customClass: {
                        confirmButton: 'save-button-style',
                    }
                });
            }
        });
    }

    document.querySelectorAll('#catalog-table th').forEach(header => {
        header.addEventListener('click', () => {
            const table = header.closest('table');
            if (table) {
                const tbody = table.querySelector('tbody');
                const column = header.dataset.column;
                const order = header.dataset.order = -(header.dataset.order || -1);
                if (tbody) {
                    const rows = Array.from(tbody.querySelectorAll('tr'));
                    rows.sort((a, b) => {
                        const aVal = a.querySelector(`td:nth-child(${header.cellIndex + 1})`).textContent;
                        const bVal = b.querySelector(`td:nth-child(${header.cellIndex + 1})`).textContent;
                        return aVal.localeCompare(bVal, undefined, { numeric: true }) * order;
                    });
                    tbody.innerHTML = '';
                    rows.forEach(row => tbody.appendChild(row));
                }
            }
        });
    });
}

window.initializeCatalog = initializeCatalogForm;
function showCatalogTab(tab) {
  // Hide all tabs and tab panes in catalog page
  document.querySelectorAll('#page-catalog .tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('#page-catalog .tab-pane').forEach((p) => {
    p.classList.add('hidden');
    p.style.display = 'none';
  });

  // Show selected tab and tab pane
  const tabButton = document.getElementById(`tab-catalog-${tab}`);
  const tabPane = document.getElementById(`tab-content-catalog-${tab}`);

  if (tabButton) tabButton.classList.add('active');
  if (tabPane) {
    tabPane.classList.remove('hidden');
    tabPane.style.display = 'block';
  }

  loadCatalog(tab);
}

async function loadCatalog(type = 'labor', searchVal = null) {
  const containerId = type === 'labor' ? 'catalogContent' : 'materialCatalogContent';
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading">Loading catalog...</div>';

    const endpoint = type === 'labor' ? 'labor/fetch_categories' : 'material/fetch_categories';
    const queryParams = {};
    if (searchVal) queryParams.searchVal = searchVal;

    const response = await makeRequest('GET', `/api/v1/${endpoint}`, null, queryParams);
    const categories = Array.isArray(response) ? response : [];

    if (categories.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No categories found</div>';
      return;
    }

      container.innerHTML = categories
      .map(
        (category) => `
      <div class="catalog-item">
        <div class="catalog-item-header" onclick="toggleCatalogCategory(this)">
          <div>
            <span class="catalog-item-title">${escapeHtml(category.name || '-')}</span>
            ${
              category.code
                ? `<span class="catalog-item-code">(${escapeHtml(category.code)})</span>`
                : ''
            }
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span>${category.childrenQuantity || 0} items</span>
            ${
              canEditCatalog()
                ? `
              <button class="btn btn-sm btn-secondary catalog-category-edit" data-type="${type}" data-action="update" data-entity-id="${category._id}" data-entity-name="${escapeHtml(category.name || '').replace(/"/g, '&quot;')}" data-entity-code="${escapeHtml(category.code || '').replace(/"/g, '&quot;')}" onclick="event.stopPropagation(); handleCatalogCategoryAction(this)">Edit</button>
              <button class="btn btn-sm btn-primary catalog-category-add" data-type="${type}" data-action="add" onclick="event.stopPropagation(); handleCatalogCategoryAction(this)">Add</button>
              <button class="btn btn-sm btn-danger catalog-category-delete" data-type="${type}" data-entity-id="${category._id}" data-entity-name="${escapeHtml(category.name || '').replace(/"/g, '&quot;')}" onclick="event.stopPropagation(); handleCatalogDelete('${type}', 'category', '${category._id}', '${escapeHtml(category.name || '').replace(/'/g, "\\'")}')">Delete</button>
            `
                : ''
            }
          </div>
        </div>
        <div class="catalog-item-content" data-category-id="${category._id}" data-category-code="${category.code || ''}" data-type="${type}" data-level="1">
          <div class="loading">Loading subcategories...</div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (error) {
    console.error('Error loading catalog:', error);
    container.innerHTML = `<div class="alert alert-error">Error loading catalog: ${error.message}</div>`;
  }
}

// Toggle category (Level 1) - loads subcategories (Level 2)
async function toggleCatalogCategory(header) {
  const content = header.nextElementSibling;
  const isExpanded = content.classList.contains('expanded');

  if (isExpanded) {
    // Collapse: hide content and collapse all nested subcategories
    content.classList.remove('expanded');
    // Collapse all nested subcategories when parent category is collapsed
    content.querySelectorAll('.catalog-item-content.expanded').forEach((subContent) => {
      subContent.classList.remove('expanded');
    });
    return;
  }

  content.classList.add('expanded');
  const categoryId = content.dataset.categoryId;
  const type = content.dataset.type;

  // Check if subcategories are already loaded (if category-item-children exists)
  const hasSubcategories = content.querySelector('.catalog-item-children');
  
  // Only load if not already loaded
  if (!hasSubcategories) {
    try {
      const endpoint =
        type === 'labor' ? 'labor/fetch_subcategories' : 'material/fetch_subcategories';
      const response = await makeRequest('GET', `/api/v1/${endpoint}`, null, {
        categoryMongoId: categoryId,
        searchVal: '',
      });
      const subcategories = Array.isArray(response) ? response : [];

      if (subcategories.length === 0) {
        content.innerHTML = '<div class="alert alert-info">No subcategories found</div>';
        return;
      }

      // Render subcategories as expandable accordion items (Level 2)
      content.innerHTML = subcategories
        .map(
          (sub) => `
        <div class="catalog-item-children">
          <div class="catalog-item">
            <div class="catalog-item-header" onclick="toggleCatalogSubcategory(this)">
              <div>
                <span class="catalog-item-title">${escapeHtml(sub.name || '-')}</span>
                ${sub.code ? `<span class="catalog-item-code">(${escapeHtml(sub.code)})</span>` : ''}
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span>${sub.childrenQuantity || 0} items</span>
                ${
                  canEditCatalog()
                    ? `
                  <button class="btn btn-sm btn-secondary catalog-subcategory-edit" data-type="${type}" data-action="update" data-entity-id="${sub._id}" data-entity-name="${escapeHtml(sub.name || '').replace(/"/g, '&quot;')}" data-entity-code="${escapeHtml(sub.code || '').replace(/"/g, '&quot;')}" data-parent-id="${categoryId}" onclick="event.stopPropagation(); handleCatalogSubcategoryAction(this)">Edit</button>
                  <button class="btn btn-sm btn-primary catalog-subcategory-add" data-type="${type}" data-action="add" data-parent-id="${categoryId}" onclick="event.stopPropagation(); handleCatalogSubcategoryAction(this)">Add</button>
                  <button class="btn btn-sm btn-danger catalog-subcategory-delete" data-type="${type}" data-entity-id="${sub._id}" data-entity-name="${escapeHtml(sub.name || '').replace(/"/g, '&quot;')}" onclick="event.stopPropagation(); handleCatalogDelete('${type}', 'subcategory', '${sub._id}', '${escapeHtml(sub.name || '').replace(/'/g, "\\'")}')">Delete</button>
                `
                    : ''
                }
              </div>
            </div>
            <div class="catalog-item-content" data-subcategory-id="${sub._id}" data-subcategory-code="${sub.code || ''}" data-type="${type}" data-level="2">
              <div class="loading">Loading items...</div>
            </div>
          </div>
        </div>
      `
        )
        .join('');
    } catch (error) {
      console.error('Error loading subcategories:', error);
      content.innerHTML = `<div class="alert alert-error">Error loading subcategories: ${error.message}</div>`;
    }
  }
}

// Toggle subcategory (Level 2) - loads items table (Level 3)
async function toggleCatalogSubcategory(header) {
  const content = header.nextElementSibling;
  const isExpanded = content.classList.contains('expanded');

  if (isExpanded) {
    content.classList.remove('expanded');
    return;
  }

  content.classList.add('expanded');
  const subcategoryId = content.dataset.subcategoryId;
  const type = content.dataset.type;

  // Check if items table is already loaded (if table-wrapper exists)
  const hasTable = content.querySelector('.table-wrapper');
  
  // Only load if not already loaded
  if (!hasTable) {
    try {
      const endpoint =
        type === 'labor' ? 'labor/fetch_items_with_average_price' : 'material/fetch_items_with_average_price';
      // Pass query params (args in production) - no body filters for basic catalog view
      const response = await makeRequest('GET', `/api/v1/${endpoint}`, null, {
        subcategoryMongoId: subcategoryId,
        searchVal: '', // Empty string for no search filter
        isSorting: 'true',
        calledFromPage: 'catalog',
      });
      
      // Handle API response - might be array or object with ok:1 for no results
      let items = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && response.ok === 1) {
        // API returned {ok: 1} when no results (e.g., filtered by accountId with no offers)
        items = [];
      } else if (response && Array.isArray(response.data)) {
        items = response.data;
      }

      if (items.length === 0) {
        content.innerHTML = '<div class="alert alert-info">No items found</div>';
        return;
      }

      // Render items as a table (Level 3)
      // Production shows: ID, Name, Labor Hours (for labor), Unit, Average Price
      const renderItemRow = (item) => {
        // Extract unit symbol from measurementUnitData array (same as production)
        let unitSymbol = '';
        if (item.measurementUnitData && Array.isArray(item.measurementUnitData) && item.measurementUnitData.length > 0) {
          const unitData = item.measurementUnitData[0];
          unitSymbol = unitData.representationSymbol || unitData.symbol || '';
        }
        
        // Format average price - stored in DB (updated via updateLaborItemStats/updateMaterialItemStats)
        let averagePrice = '-';
        if (item.averagePrice != null && item.averagePrice !== undefined) {
          const price = Number(item.averagePrice);
          if (!isNaN(price) && price >= 0) {
            const rounded = Math.round(price * 1000) / 1000;
            averagePrice = rounded.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          }
        }
        
        // Format labor hours (only for labor items)
        let laborHours = '-';
        if (type === 'labor' && item.laborHours != null && item.laborHours !== undefined) {
          const hours = Number(item.laborHours);
          if (!isNaN(hours) && hours >= 0) {
            laborHours = hours.toFixed(2);
          }
        }

        const itemId = item.fullCode || item.code || String(item._id || '-');
        const itemName = item.name || '-';

        const baseRow = `
          <td>${escapeHtml(itemId)}</td>
          <td>${escapeHtml(itemName)}</td>
          ${type === 'labor' ? `<td style="text-align: center;">${laborHours}</td>` : ''}
          <td style="text-align: center;">${escapeHtml(unitSymbol)}</td>
          <td style="text-align: right;">${averagePrice}</td>
        `;

        if (canEditCatalog()) {
          // Use data attributes to avoid quote escaping issues
          const itemIdEscaped = String(item._id).replace(/"/g, '&quot;');
          const itemNameEscaped = escapeHtml(itemName).replace(/"/g, '&quot;');
          const itemCodeEscaped = escapeHtml(item.code || '').replace(/"/g, '&quot;');
          const itemNameForDelete = escapeHtml(itemName).replace(/'/g, "\\'");
          return `<tr data-item-id="${itemIdEscaped}" data-item-name="${itemNameEscaped}" data-item-code="${itemCodeEscaped}">${baseRow}<td style="text-align: center;"><button class="btn btn-sm btn-secondary catalog-edit-item-btn" data-type="${type}" data-action="update" data-entity-id="${itemIdEscaped}" data-entity-name="${itemNameEscaped}" data-entity-code="${itemCodeEscaped}" data-parent-id="${subcategoryId}">Edit</button> <button class="btn btn-sm btn-danger catalog-delete-item-btn" data-type="${type}" data-entity-id="${itemIdEscaped}" data-entity-name="${itemNameEscaped}">Delete</button></td></tr>`;
        }
        return `<tr>${baseRow}</tr>`;
      };

      // Attach event listeners after rendering
      const attachEditListeners = () => {
        document.querySelectorAll('.catalog-edit-item-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = btn.dataset.type;
            const entityId = btn.dataset.entityId;
            const entityName = btn.dataset.entityName;
            const entityCode = btn.dataset.entityCode;
            const parentId = btn.dataset.parentId;
            openCatalogEditModal(type, 'item', 'update', entityId, entityName, entityCode, parentId);
          });
        });
      };

      const tableRows = items.map(renderItemRow).join('');

      const tableHeaders =
        type === 'labor'
          ? `
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Labor Hours</th>
              <th>Unit</th>
              <th>Average Price</th>
              ${canEditCatalog() ? '<th>Actions</th>' : ''}
            </tr>
          </thead>
        `
          : `
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Unit</th>
              <th>Average Price</th>
              ${canEditCatalog() ? '<th>Actions</th>' : ''}
            </tr>
          </thead>
        `;

      content.innerHTML = `
        <div class="table-wrapper">
          ${canEditCatalog() ? `<div style="margin-bottom: 10px;"><button class="btn btn-sm btn-primary catalog-add-item-btn" data-type="${type}" data-parent-id="${subcategoryId}">Add Item</button></div>` : ''}
          <table class="estimate-table">
            ${tableHeaders}
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      `;
      
      // Attach event listeners
      if (canEditCatalog()) {
        attachEditListeners();
        const addBtn = content.querySelector('.catalog-add-item-btn');
        if (addBtn) {
          addBtn.addEventListener('click', () => {
            openCatalogEditModal(type, 'item', 'add', null, null, null, subcategoryId);
          });
        }
        
        // Attach delete listeners for items
        content.querySelectorAll('.catalog-delete-item-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemType = btn.dataset.type;
            const itemId = btn.dataset.entityId;
            const itemName = btn.dataset.entityName;
            handleCatalogDelete(itemType, 'item', itemId, itemName);
          });
        });
      }
    } catch (error) {
      console.error('Error loading items:', error);
      content.innerHTML = `<div class="alert alert-error">Error loading items: ${error.message}</div>`;
    }
  }
}

// Legacy function name for backward compatibility
async function toggleCatalogItem(header) {
  const content = header.nextElementSibling;
  const level = parseInt(content.dataset.level || '1');

  if (level === 1) {
    await toggleCatalogCategory(header);
  } else if (level === 2) {
    await toggleCatalogSubcategory(header);
  }
}

function searchCatalog() {
  const searchVal = document.getElementById('catalogSearch')?.value || '';
  loadCatalog('labor', searchVal || null);
}

function searchMaterialCatalog() {
  const searchVal = document.getElementById('materialCatalogSearch')?.value || '';
  loadCatalog('material', searchVal || null);
}

// Handler functions for catalog edit buttons
function handleCatalogCategoryAction(btn) {
  const type = btn.dataset.type;
  const action = btn.dataset.action;
  if (action === 'update') {
    openCatalogEditModal(type, 'category', 'update', btn.dataset.entityId, btn.dataset.entityName, btn.dataset.entityCode);
  } else {
    openCatalogEditModal(type, 'category', 'add', null, null, null);
  }
}

function handleCatalogSubcategoryAction(btn) {
  const type = btn.dataset.type;
  const action = btn.dataset.action;
  const parentId = btn.dataset.parentId;
  if (action === 'update') {
    openCatalogEditModal(type, 'subcategory', 'update', btn.dataset.entityId, btn.dataset.entityName, btn.dataset.entityCode, parentId);
  } else {
    openCatalogEditModal(type, 'subcategory', 'add', null, null, null, parentId);
  }
}

// Handle catalog deletion with confirmation
async function handleCatalogDelete(catalogType, entityType, entityMongoId, entityName) {
  // Show confirmation dialog
  const confirmMessage = `Are you sure you want to delete this ${entityType}?\n\n${entityType.charAt(0).toUpperCase() + entityType.slice(1)}: ${entityName}\n\nThis action cannot be undone.${entityType === 'category' ? '\n\nNote: This will also delete all subcategories and items under this category.' : entityType === 'subcategory' ? '\n\nNote: This will also delete all items under this subcategory.' : ''}`;
  
  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    const endpoint = `${catalogType}/delete_${entityType}`;
    await makeRequest('GET', `/api/v1/${endpoint}`, null, {
      entityMongoId: entityMongoId,
    });

    showAlert(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} deleted successfully!`, 'success');
    
    // Reload the catalog
    const type = catalogType;
    const container = document.getElementById(type === 'labor' ? 'catalogContent' : 'materialCatalogContent');
    if (container) {
      const searchInput = type === 'labor' ? document.getElementById('catalogSearch') : document.getElementById('materialCatalogSearch');
      const searchVal = searchInput?.value || '';
      await loadCatalog(type, searchVal || null);
    }
  } catch (error) {
    console.error('Error deleting catalog entity:', error);
    showAlert(`Error: ${error.message || 'Failed to delete'}`, 'error');
  }
}

// Catalog Edit Modal Functions
let currentCatalogEditModal = {
  catalogType: null,
  entityType: null,
  actionType: null,
  entityMongoId: null,
  parentMongoId: null,
};

async function openCatalogEditModal(catalogType, entityType, actionType, entityMongoId, entityName, entityCode, parentMongoId = null) {
  currentCatalogEditModal = {
    catalogType,
    entityType,
    actionType,
    entityMongoId,
    parentMongoId,
    entityCode, // Store original code for item updates
  };

  const modal = document.getElementById('catalogEditModal');
  if (!modal) {
    console.error('Catalog edit modal not found');
    return;
  }

  const title = document.getElementById('catalogEditModalTitle');
  const nameInput = document.getElementById('catalogEditEntityName');
  const codeInput = document.getElementById('catalogEditEntityCode');
  const measurementUnitSelect = document.getElementById('catalogEditMeasurementUnit');
  const measurementUnitDiv = document.getElementById('catalogEditMeasurementUnitDiv');

  if (title) {
    title.textContent = `${actionType === 'update' ? 'Edit' : 'Add'} ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
  }

  // Show/hide measurement unit field (only for items)
  if (measurementUnitDiv) {
    measurementUnitDiv.style.display = entityType === 'item' ? 'block' : 'none';
  }

  // Set values for update
  if (nameInput) {
    nameInput.value = entityName || '';
  }
  // Handle code field visibility and editing
  if (codeInput) {
    codeInput.value = entityCode || '';
    codeInput.defaultValue = entityCode || ''; // Store original value for item updates
    const codeField = codeInput.closest('.form-field');
    
    if (codeField) {
      // Show code field for categories/subcategories (always), and for adding items
      // Hide code field only for updating items (code is not editable for items on update, but still required by API)
      if (entityType === 'item' && actionType === 'update') {
        codeField.style.display = 'none'; // Hide code for item updates (user can't edit, but we'll send it)
      } else {
        codeField.style.display = 'block'; // Show for categories/subcategories and item adds
      }
    }
    
    // Code can be edited for categories and subcategories, but disabled for item updates
    if (entityType === 'item' && actionType === 'update') {
      codeInput.disabled = true; // Items: code cannot be changed on update (but still required by API)
      codeInput.value = entityCode || ''; // Keep the original code value
    } else {
      codeInput.disabled = false; // Categories/subcategories and item adds: code can be edited
    }
  }

  // Load measurement units if editing/adding item
  if (entityType === 'item' && measurementUnitSelect) {
    try {
      const response = await makeRequest('GET', '/api/v1/measurement_unit/fetch', null, {});
      const units = Array.isArray(response) ? response : [];
      measurementUnitSelect.innerHTML = '<option value="">Select Measurement Unit</option>' +
        units.map(unit => `<option value="${unit.measurementUnitId || unit._id}">${escapeHtml(unit.name || '')}</option>`).join('');

      // If updating, load item data and set measurement unit
      if (actionType === 'update' && entityMongoId) {
        const itemEndpoint = catalogType === 'labor' ? 'labor/get_item' : 'material/get_item';
        const itemParam = catalogType === 'labor' ? 'laborItemMongoId' : 'materialItemMongoId';
        const itemResponse = await makeRequest('GET', `/api/v1/${itemEndpoint}`, null, { [itemParam]: entityMongoId });
        if (itemResponse && itemResponse.measurementUnitData && itemResponse.measurementUnitData.length > 0) {
          const currentUnitId = itemResponse.measurementUnitData[0].measurementUnitId || itemResponse.measurementUnitData[0]._id;
          measurementUnitSelect.value = currentUnitId || '';
        }
      }
    } catch (error) {
      console.error('Error loading measurement units:', error);
      showAlert('Error loading measurement units', 'error');
    }
  }

  modal.style.display = 'flex';
}

function closeCatalogEditModal() {
  const modal = document.getElementById('catalogEditModal');
  if (modal) {
    modal.style.display = 'none';
  }
  currentCatalogEditModal = {
    catalogType: null,
    entityType: null,
    actionType: null,
    entityMongoId: null,
    parentMongoId: null,
  };
}

async function confirmCatalogEdit() {
  const { catalogType, entityType, actionType, entityMongoId, parentMongoId } = currentCatalogEditModal;

  const nameInput = document.getElementById('catalogEditEntityName');
  const codeInput = document.getElementById('catalogEditEntityCode');
  const measurementUnitSelect = document.getElementById('catalogEditMeasurementUnit');

  const entityName = nameInput?.value?.trim();
  let entityCode = codeInput?.value?.trim();
  const measurementUnitId = measurementUnitSelect?.value;

  if (!entityName) {
    showAlert('Name is required', 'error');
    return;
  }

  // Code is required for add actions (all types)
  if (actionType === 'add' && !entityCode) {
    showAlert('Code is required', 'error');
    return;
  }

  // For item updates, code is required but comes from the original entityCode passed to modal
  // (since the field is hidden/disabled, we need to use the stored value)
  if (actionType === 'update' && entityType === 'item' && !entityCode) {
    // Get the original code from when modal was opened (stored in currentCatalogEditModal)
    entityCode = currentCatalogEditModal.entityCode || '';
  }

  // Code is required for category/subcategory updates too
  if (actionType === 'update' && (entityType === 'category' || entityType === 'subcategory') && !entityCode) {
    showAlert('Code is required', 'error');
    return;
  }

  if (entityType === 'item' && !measurementUnitId) {
    showAlert('Measurement Unit is required', 'error');
    return;
  }

  try {
    const endpoint = `${catalogType}/${actionType}_${entityType}`;
    
    // Build query params - all endpoints expect these as query params
    const queryParams = {
      entityName,
      entityCode, // Always send code (required for all add/update operations)
    };
    
    // For update, use entityMongoId; for add, use parentMongoId (for subcategories/items)
    if (actionType === 'update' && entityMongoId) {
      queryParams.entityMongoId = entityMongoId;
    } else if (actionType === 'add') {
      // For categories: no parent
      // For subcategories: parent is categoryId
      // For items: parent is subcategoryId
      if (parentMongoId && entityType !== 'category') {
        queryParams.entityMongoId = parentMongoId; // Parent ID for subcategories and items
      }
    }
    
    // Add measurement unit for items
    if (entityType === 'item' && measurementUnitId) {
      queryParams.measurementUnitId = measurementUnitId;
    }

    // Use GET for catalog endpoints (backend uses requireQueryParam which reads from query string)
    await makeRequest('GET', `/api/v1/${endpoint}`, null, queryParams);

    showAlert(`${actionType === 'update' ? 'Updated' : 'Added'} successfully!`, 'success');
    closeCatalogEditModal();

    // Reload the catalog
    const type = catalogType;
    const container = document.getElementById(type === 'labor' ? 'catalogContent' : 'materialCatalogContent');
    if (container) {
      const searchInput = type === 'labor' ? document.getElementById('catalogSearch') : document.getElementById('materialCatalogSearch');
      const searchVal = searchInput?.value || '';
      await loadCatalog(type, searchVal || null);
    }
  } catch (error) {
    console.error('Error saving catalog entity:', error);
    showAlert(`Error: ${error.message || 'Failed to save'}`, 'error');
  }
}

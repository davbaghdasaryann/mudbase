let currentMaterialsLaborId = null;
let currentMaterialsLaborName = null;

async function openMaterialsDialog(laborId, laborName) {
  currentMaterialsLaborId = laborId;
  currentMaterialsLaborName = laborName;

  const modal = document.getElementById('materialsModal');
  const modalTitle = document.getElementById('materialsModalTitle');
  const modalBody = document.getElementById('materialsModalBody');

  if (modal && modalTitle && modalBody) {
    modalTitle.textContent = `Materials: ${laborName}`;
    modal.classList.remove('hidden');
    modalBody.innerHTML = '<div class="loading">Loading materials...</div>';

    document.body.style.overflow = 'hidden';

    await loadMaterials(laborId);
  }
}

function closeMaterialsModal() {
  const modal = document.getElementById('materialsModal');
  if (modal) {
    modal.classList.add('hidden');
    currentMaterialsLaborId = null;
    currentMaterialsLaborName = null;
    document.body.style.overflow = 'auto';
  }
}

// Store if materials modal was open (to reopen after adding)
let wasMaterialsModalOpen = false;
let savedMaterialsLaborId = null;
let savedMaterialsLaborName = null;

// Open add material dialog from materials modal (uses current labor ID)
// Don't close materials modal - just open add material dialog on top (like production)
function openAddMaterialDialogFromMaterialsModal() {
  if (!currentMaterialsLaborId || !currentMaterialsLaborName) {
    showAlert('No labor item selected', 'error', 'dashboardAlert');
    return;
  }
  // Remember that materials modal was open (but keep it open, just open add dialog on top)
  wasMaterialsModalOpen = true;
  savedMaterialsLaborId = currentMaterialsLaborId;
  savedMaterialsLaborName = currentMaterialsLaborName;
  console.log('Opening add material dialog while materials modal is open:', {
    wasMaterialsModalOpen,
    savedMaterialsLaborId,
    savedMaterialsLaborName,
  });
  // Open add material dialog without closing materials modal (like production)
  openAddMaterialDialogForLabor(currentMaterialsLaborId, currentMaterialsLaborName);
}

async function loadMaterials(laborId) {
  const modalBody = document.getElementById('materialsModalBody');
  if (!modalBody) return;

  try {
    const materialItems = await makeRequest('GET', '/api/v1/estimate/fetch_material_items', null, {
      estimatedLaborId: laborId,
    });

    if (!materialItems || !Array.isArray(materialItems) || materialItems.length === 0) {
      modalBody.innerHTML = '<div class="alert alert-info">No materials found</div>';
      return;
    }

    const tableRows = materialItems
      .map((item) => {
        const materialId = item._id;
        const materialName =
          item.materialOfferItemName ||
          item.name ||
          item.materialItemName ||
          item.estimateMaterialItemData?.[0]?.name ||
          '-';
        // Use fullCode from estimateMaterialItemData lookup (like production - EstimateMaterialItemDisplayData)
        const materialCode =
          item.estimateMaterialItemData?.[0]?.fullCode ||
          item.estimatedMaterialFullCode ||
          item.fullCode ||
          '-';
        const materialUnit =
          item.estimateMeasurementUnitData?.[0]?.representationSymbol ||
          item.measurementUnitRepresentationSymbol ||
          item.unit ||
          '';
        const consumptionNorm = item.materialConsumptionNorm || 0;
        const quantity = item.quantity || 0;
        const price = item.changableAveragePrice || item.averagePrice || item.price || 0;
        const total = item.totalCost || price * quantity;

        return `
          <tr data-material-item-id="${materialId}">
          <td>
            <button class="table-action-btn" onclick="openMaterialItemView('${materialId}')" title="View Details">
              ${escapeHtml(materialCode || '-')}
            </button>
          </td>
            <td>
              <input 
                type="text" 
                class="editable-cell" 
                value="${escapeHtml(materialName)}" 
                data-field="materialOfferItemName"
                data-material-item-id="${materialId}"
                onblur="updateMaterialItemField('${materialId}', 'materialOfferItemName', this.value)"
                style="width: 100%;"
              />
            </td>
            <td class="readonly-cell">${escapeHtml(materialUnit)}</td>
            <td>
              <input 
                type="number" 
                step="0.01"
                class="editable-cell" 
                value="${consumptionNorm}" 
                data-field="materialConsumptionNorm"
                data-material-item-id="${materialId}"
                onblur="updateMaterialItemField('${materialId}', 'materialConsumptionNorm', this.value)"
                style="width: 100px;"
              />
            </td>
            <td class="readonly-cell">${quantity.toFixed(2)}</td>
            <td>
              <input 
                type="number" 
                step="0.01"
                class="editable-cell" 
                value="${price}" 
                data-field="changableAveragePrice"
                data-material-item-id="${materialId}"
                onblur="updateMaterialItemField('${materialId}', 'changableAveragePrice', this.value)"
                style="width: 100px;"
              />
            </td>
            <td class="readonly-cell">${total.toFixed(2)}</td>
            <td>
              <div class="table-row-actions">
                <button class="table-action-icon danger" onclick="removeMaterialItem('${materialId}')" title="Remove">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    modalBody.innerHTML = `
      <div class="filter-bar">
        <input 
          type="text" 
          class="filter-input" 
          placeholder="Filter materials..." 
          onkeyup="filterMaterials(this.value)"
        />
      </div>
      <div class="table-wrapper">
        <table class="estimate-table" id="materials-table">
          <thead>
            <tr>
              <th class="sortable-header" onclick="sortTable('materials-table', 0)">ID <span class="sort-indicator">↕</span></th>
              <th class="sortable-header" onclick="sortTable('materials-table', 1)">Material <span class="sort-indicator">↕</span></th>
              <th>Unit</th>
              <th class="sortable-header" onclick="sortTable('materials-table', 3)">Material consumption norm <span class="sort-indicator">↕</span></th>
              <th class="sortable-header" onclick="sortTable('materials-table', 4)">Quantity <span class="sort-indicator">↕</span></th>
              <th class="sortable-header" onclick="sortTable('materials-table', 5)">Price <span class="sort-indicator">↕</span></th>
              <th class="sortable-header" onclick="sortTable('materials-table', 6)">Total <span class="sort-indicator">↕</span></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error loading materials:', error);
    modalBody.innerHTML = `<div class="alert alert-error">Error loading materials: ${error.message}</div>`;
  }
}

// Update material item field
let updateMaterialItemTimeout = null;
async function updateMaterialItemField(materialId, field, value) {
  if (updateMaterialItemTimeout) {
    clearTimeout(updateMaterialItemTimeout);
  }

  updateMaterialItemTimeout = setTimeout(async () => {
    try {
      const updateData = {};
      updateData[field] = value;

      await makeRequest('POST', '/api/v1/estimate/update_material_item', updateData, {
        estimatedMaterialId: materialId,
        estimatedLaborId: currentMaterialsLaborId || '',
      });

      // Reload materials
      if (currentMaterialsLaborId) {
        await loadMaterials(currentMaterialsLaborId);
      }

      // Reload estimate details to reflect cost changes
      if (currentEstimateId) {
        await loadEstimateDetails(currentEstimateId);
      }
    } catch (error) {
      console.error('Error updating material item:', error);
      showAlert(`Error updating field: ${error.message}`, 'error', 'dashboardAlert');
      // Reload to revert changes
      if (currentMaterialsLaborId) {
        await loadMaterials(currentMaterialsLaborId);
      }
    }
  }, 500);
}

// Filter materials
function filterMaterials(searchValue) {
  const table = document.getElementById('materials-table');
  if (!table) return;

  const rows = table.querySelectorAll('tbody tr');
  const searchLower = searchValue.toLowerCase();

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchLower) ? '' : 'none';
  });
}

// Placeholder functions for actions
function openLaborItemView(laborId, laborName) {
  showAlert(`View labor item: ${laborName}`, 'info', 'dashboardAlert');
}

function editLaborItem(laborId, laborName) {
  showAlert(`Edit labor item: ${laborName}`, 'info', 'dashboardAlert');
}

async function removeLaborItem(laborId, laborName) {
  if (!confirm(`Are you sure you want to remove "${laborName}"?`)) {
    return;
  }

  try {
    await makeRequest('POST', '/api/v1/estimate/remove_labor_item', null, {
      estimateLaborItemId: laborId,
    });

    showAlert('Labor item removed successfully', 'success', 'dashboardAlert');

    // Reload estimate details
    if (currentEstimateId) {
      await loadEstimateDetails(currentEstimateId);
    }
  } catch (error) {
    console.error('Error removing labor item:', error);
    showAlert(`Error removing labor item: ${error.message}`, 'error', 'dashboardAlert');
  }
}

function openMaterialItemView(materialId) {
  showAlert(`View material item: ${materialId}`, 'info', 'dashboardAlert');
}

async function removeMaterialItem(materialId) {
  if (!confirm('Are you sure you want to remove this material item?')) {
    return;
  }

  try {
    await makeRequest('POST', '/api/v1/estimate/remove_material_item', null, {
      estimateMaterialItemId: materialId,
    });

    showAlert('Material item removed successfully', 'success', 'dashboardAlert');

    // Reload materials
    if (currentMaterialsLaborId) {
      await loadMaterials(currentMaterialsLaborId);
    }

    // Reload estimate details to reflect cost changes
    if (currentEstimateId) {
      await loadEstimateDetails(currentEstimateId);
    }
  } catch (error) {
    console.error('Error removing material item:', error);
    showAlert(`Error removing material item: ${error.message}`, 'error', 'dashboardAlert');
  }
}

// ==================== MATERIAL ADDITION FUNCTIONS ====================

// Open Add Material Dialog for a specific labor item
async function openAddMaterialDialogForLabor(laborId, laborName) {
  console.log('openAddMaterialDialogForLabor called with:', {
    laborId,
    laborName,
  });

  // Store the labor ID for later use when confirming
  currentAddMaterialLaborId = String(laborId);
  selectedMaterialItemData = null;
  expandedMaterialAccordions.clear();

  const modal = document.getElementById('addMaterialModal');
  if (modal) {
    // Check if materials modal is open - if so, set higher z-index and make background transparent
    const materialsModal = document.getElementById('materialsModal');
    const backdrop = modal.querySelector('.modal-backdrop');

    const modalContent = modal.querySelector('.modal-content');

    if (materialsModal && !materialsModal.classList.contains('hidden')) {
      // Materials modal is open - set higher z-index for add material modal
      modal.style.zIndex = '3000'; // Higher than materials modal (2000)
      // Make modal background transparent so it doesn't cover materials modal
      modal.style.background = 'transparent';
      // Ensure modal content is above everything
      if (modalContent) {
        modalContent.style.zIndex = '3001';
        modalContent.style.position = 'relative';
      }
      // Hide backdrop so it doesn't cover materials modal and interfere
      if (backdrop) {
        backdrop.style.display = 'none';
      }
    } else {
      // Materials modal is not open - use default z-index and show backdrop
      modal.style.zIndex = '';
      modal.style.background = ''; // Reset to default (rgba(0, 0, 0, 0.5))
      if (modalContent) {
        modalContent.style.zIndex = '';
      }
      if (backdrop) {
        backdrop.style.display = '';
      }
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Load material categories
    await loadMaterialCategoriesForDialog('');
  } else {
    console.error('Add material modal not found!');
  }
}

// Handle clicks on add material modal - don't close if materials modal is open
function handleAddMaterialModalClick(event) {
  // Only close if clicking directly on the modal div (not on children) and materials modal is not open
  if (event.target.id === 'addMaterialModal') {
    const materialsModal = document.getElementById('materialsModal');
    if (materialsModal && !materialsModal.classList.contains('hidden')) {
      // Materials modal is open - don't close add material modal
      return;
    }
    closeAddMaterialModal();
  }
}

// Handle clicks on backdrop - don't close if materials modal is open
function handleAddMaterialModalBackdropClick(event) {
  const materialsModal = document.getElementById('materialsModal');
  if (materialsModal && !materialsModal.classList.contains('hidden')) {
    // Materials modal is open - don't close add material modal
    return;
  }
  closeAddMaterialModal();
}

function closeAddMaterialModal() {
  const modal = document.getElementById('addMaterialModal');
  if (modal) {
    modal.classList.add('hidden');
    // Reset z-index to default
    modal.style.zIndex = '';
    // Reset background to default
    modal.style.background = '';
    // Reset modal content z-index
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.style.zIndex = '';
    }
    // Reset backdrop display
    const backdrop = modal.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.style.display = '';
    }
    // Don't clear labor ID here - we need it for the details modal
    expandedMaterialAccordions.clear();
    // Don't restore body overflow - details modal will handle it
  }
}

// Load material categories (Level 1)
async function loadMaterialCategoriesForDialog(searchVal = '') {
  const container = document.getElementById('addMaterialCategoriesAccordion');
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading">Loading material categories...</div>';

    // Production uses POST with args (query params) and json (body)
    // args: { searchVal }
    // json: { categoryId: null, subcategoryId: null, accountId: null }
    const queryParams = {};
    if (searchVal) {
      queryParams.searchVal = searchVal;
    }

    // Body with filters (matching production exactly)
    const requestBody = {
      categoryId: null,
      subcategoryId: null,
      accountId: null,
    };

    const response = await makeRequest(
      'POST',
      '/api/v1/material/fetch_categories',
      requestBody,
      queryParams
    );

    materialCategoriesData = Array.isArray(response) ? response : [];

    console.log('Material categories loaded:', materialCategoriesData.length, 'categories');

    if (materialCategoriesData.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No material categories found</div>';
      return;
    }

    // Render categories accordion
    container.innerHTML = materialCategoriesData
      .map(
        (cat) => `
      <div class="estimate-accordion" style="margin-bottom: 8px;">
        <div 
          class="estimate-accordion-header" 
          onclick="toggleMaterialCategory('${cat._id}')"
          style="cursor: pointer; padding: 10px 14px; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;"
        >
          <span><strong>${escapeHtml(cat.code || '')}</strong> ${escapeHtml(cat.name || '-')} ${
          cat.childrenQuantity ? `(${cat.childrenQuantity})` : '(0)'
        }</span>
          <span style="font-size: 16px;">${
            expandedMaterialAccordions.has(`matcat-${cat._id}`) ? '▼' : '▶'
          }</span>
        </div>
        <div 
          id="matcat-${cat._id}-content" 
          class="estimate-accordion-content" 
          style="display: ${
            expandedMaterialAccordions.has(`matcat-${cat._id}`) ? 'block' : 'none'
          }; padding: 12px 16px; border-left: 2px solid #ddd; margin-left: 12px; margin-top: 8px;"
        >
          <div id="matcat-${
            cat._id
          }-subcategories" class="loading">Click to load subcategories...</div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (error) {
    console.error('Error loading material categories:', error);
    container.innerHTML = `<div class="alert alert-error">Error loading categories: ${error.message}</div>`;
  }
}

// Toggle material category (expand/collapse to load subcategories)
async function toggleMaterialCategory(categoryId) {
  console.log('toggleMaterialCategory called with:', categoryId, 'type:', typeof categoryId);
  const accordionId = `matcat-${categoryId}`;
  const isExpanded = expandedMaterialAccordions.has(accordionId);

  // Update expanded state first
  if (isExpanded) {
    expandedMaterialAccordions.delete(accordionId);
  } else {
    expandedMaterialAccordions.add(accordionId);
  }

  // Update UI visibility BEFORE loading subcategories
  const content = document.getElementById(`${accordionId}-content`);
  if (content) {
    content.style.display = expandedMaterialAccordions.has(accordionId) ? 'block' : 'none';
  }

  // Update icon
  const header = document.querySelector(`[onclick*="toggleMaterialCategory('${categoryId}')"]`);
  if (header) {
    const icon = header.querySelector('span:last-child');
    if (icon) {
      icon.textContent = expandedMaterialAccordions.has(accordionId) ? '▼' : '▶';
    }
  }

  // Load subcategories only if expanding
  if (expandedMaterialAccordions.has(accordionId)) {
    const categoryIdStr = String(categoryId);
    console.log('Loading subcategories for material category:', categoryIdStr);
    await loadMaterialSubcategories(categoryIdStr);
  }
}

// Load material subcategories (Level 2)
async function loadMaterialSubcategories(categoryId) {
  const container = document.getElementById(`matcat-${categoryId}-subcategories`);
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading">Loading subcategories...</div>';

    // Production API call: searchVal='' (empty string) and body: {"categoryId":null,"subcategoryId":null}
    const queryParams = {
      categoryMongoId: String(categoryId),
      searchVal: '', // Empty string - matching production exactly
    };

    // Pass body with categoryId and subcategoryId as null (matching production exactly)
    const requestBody = {
      categoryId: null,
      subcategoryId: null,
    };

    const response = await makeRequest(
      'POST',
      '/api/v1/material/fetch_subcategories',
      requestBody,
      queryParams
    );

    console.log('Material subcategories API call:', {
      categoryId,
      queryParams,
      responseType: typeof response,
      isArray: Array.isArray(response),
      responseLength: Array.isArray(response) ? response.length : 'N/A',
    });

    if (!response) {
      console.error('Empty response from subcategories API');
      container.innerHTML =
        '<div style="padding: 8px; color: #d32f2f;">Error: Empty response from server</div>';
      return;
    }

    const subcategories = Array.isArray(response) ? response : [];

    console.log('Parsed subcategories:', subcategories.length, 'items');

    if (subcategories.length === 0) {
      container.innerHTML = '<div style="padding: 8px; color: #666;">No subcategories found</div>';
      return;
    }

    // Render subcategories accordion
    container.innerHTML = subcategories
      .map(
        (subcat) => `
      <div class="estimate-accordion" style="margin-bottom: 8px;">
        <div 
          class="estimate-accordion-header" 
          onclick="toggleMaterialSubcategory('${categoryId}', '${subcat._id}')"
          style="cursor: pointer; padding: 10px 14px; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;"
        >
          <span><strong>${escapeHtml(subcat.code || '')}</strong> ${escapeHtml(
          subcat.name || '-'
        )} ${subcat.childrenQuantity ? `(${subcat.childrenQuantity})` : '(0)'}</span>
          <span style="font-size: 16px;">${
            expandedMaterialAccordions.has(`matsubcat-${subcat._id}`) ? '▼' : '▶'
          }</span>
        </div>
        <div 
          id="matsubcat-${subcat._id}-content" 
          class="estimate-accordion-content" 
          style="display: ${
            expandedMaterialAccordions.has(`matsubcat-${subcat._id}`) ? 'block' : 'none'
          }; padding: 12px 16px; border-left: 2px solid #ddd; margin-left: 12px; margin-top: 8px;"
        >
          <div id="matsubcat-${subcat._id}-items" class="loading">Loading items...</div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (error) {
    console.error('Error loading material subcategories:', error);
    container.innerHTML = `<div class="alert alert-error">Error loading subcategories: ${error.message}</div>`;
  }
}

// Toggle material subcategory (expand/collapse to load items)
async function toggleMaterialSubcategory(categoryId, subcategoryId) {
  const accordionId = `matsubcat-${subcategoryId}`;
  const isExpanded = expandedMaterialAccordions.has(accordionId);

  // Update expanded state first
  if (isExpanded) {
    expandedMaterialAccordions.delete(accordionId);
  } else {
    expandedMaterialAccordions.add(accordionId);
  }

  // Update UI visibility BEFORE loading items
  const content = document.getElementById(`${accordionId}-content`);
  if (content) {
    content.style.display = expandedMaterialAccordions.has(accordionId) ? 'block' : 'none';
  }

  // Update icon
  const header = document.querySelector(
    `[onclick*="toggleMaterialSubcategory('${categoryId}', '${subcategoryId}')"]`
  );
  if (header) {
    const icon = header.querySelector('span:last-child');
    if (icon) {
      icon.textContent = expandedMaterialAccordions.has(accordionId) ? '▼' : '▶';
    }
  }

  // Load items only if expanding
  if (expandedMaterialAccordions.has(accordionId)) {
    await loadMaterialItems(subcategoryId);
  }
}

// Load material items (Level 3) - show as table
async function loadMaterialItems(subcategoryId) {
  const container = document.getElementById(`matsubcat-${subcategoryId}-items`);
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading">Loading items...</div>';

    // Production uses GET request with query params: subcategoryMongoId, searchVal (empty), isSorting, calledFromPage
    const queryParams = {
      subcategoryMongoId: String(subcategoryId),
      searchVal: '', // Empty string - matching production exactly
      isSorting: 'true',
      calledFromPage: 'estCatAccordion',
    };

    // Production uses GET request (no body)
    const response = await makeRequest(
      'GET',
      '/api/v1/material/fetch_items_with_average_price',
      null,
      queryParams
    );

    console.log('Material items response for subcategory', subcategoryId, ':', response);

    const items = Array.isArray(response) ? response : [];

    if (items.length === 0) {
      container.innerHTML = '<div style="padding: 8px; color: #666;">No items found</div>';
      return;
    }

    // Render items table
    // API returns measurementUnitData as an array from lookup, need to extract first element
    container.innerHTML = `
      <table class="table" style="width: 100%;">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Unit</th>
            <th>Average Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map((item) => {
              // Extract measurement unit data from array (API returns it as an array from lookup)
              const measurementUnit =
                item.measurementUnitData && item.measurementUnitData.length > 0
                  ? item.measurementUnitData[0]
                  : null;
              const measurementUnitSymbol = measurementUnit
                ? measurementUnit.representationSymbol || '-'
                : '-';
              const measurementUnitMongoId = measurementUnit ? measurementUnit._id || '' : '';

              // API may or may not return averagePrice
              const averagePrice = item.averagePrice
                ? parseFloat(item.averagePrice).toFixed(2)
                : '0.00';

              return `
            <tr>
              <td>${escapeHtml(item.fullCode || '-')}</td>
              <td>${escapeHtml(item.name || '-')}</td>
              <td>${escapeHtml(measurementUnitSymbol)}</td>
              <td>${averagePrice}</td>
              <td>
                <button class="btn btn-primary" style="padding: 4px 12px; font-size: 13px;" onclick="selectMaterialItem('${
                  item._id
                }', '${escapeHtml(item.name || '')}', '${escapeHtml(
                measurementUnitSymbol
              )}', '${measurementUnitMongoId}', '${item.averagePrice || 0}')">
                  ➕ Add
                </button>
              </td>
            </tr>
          `;
            })
            .join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error loading material items:', error);
    container.innerHTML = `<div class="alert alert-error">Error loading items: ${error.message}</div>`;
  }
}

function searchMaterialCategoriesInDialog() {
  const searchVal = document.getElementById('addMaterialSearchInput')?.value || '';
  expandedMaterialAccordions.clear();
  loadMaterialCategoriesForDialog(searchVal);
}

// Select material item and fetch offers (matching production)
async function selectMaterialItem(itemId, itemName, unitSymbol, unitId, averagePrice) {
  console.log('selectMaterialItem called with:', {
    itemId,
    itemName,
    unitSymbol,
    unitId,
    averagePrice,
  });

  // Ensure itemId and unitId are strings
  selectedMaterialItemData = {
    itemId: String(itemId),
    itemName: String(itemName || ''),
    unitSymbol: String(unitSymbol || ''),
    unitId: String(unitId || ''),
    averagePrice: parseFloat(averagePrice) || 0,
  };

  console.log('Selected material item data:', selectedMaterialItemData);

  // Close selection dialog first
  closeAddMaterialModal();

  // Fetch material offers before showing details (matching production)
  try {
    await fetchAndShowMaterialOffers(itemId, itemName);
  } catch (error) {
    console.error('Error fetching material offers:', error);
    showAlert(`Error fetching material offers: ${error.message}`, 'error', 'dashboardAlert');
  }
}

// Fetch material offers and show offers modal (matching production)
async function fetchAndShowMaterialOffers(materialItemId, materialItemName) {
  const modalBody = document.getElementById('materialOffersModalBody');
  const modalTitle = document.getElementById('materialOffersModalTitle');

  if (!modalBody || !modalTitle) {
    console.error('Material offers modal elements not found');
    return;
  }

  // Show modal with loading state
  const modal = document.getElementById('addMaterialOffersModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    modalTitle.textContent = `Material Offers: ${materialItemName || '-'}`;
    modalBody.innerHTML = '<div class="loading">Loading offers...</div>';
  }

  try {
    // Production uses GET request with materialItemId as query parameter
    const queryParams = {
      materialItemId: String(materialItemId),
    };

    const response = await makeRequest(
      'GET',
      '/api/v1/estimate/fetch_material_offers',
      null,
      queryParams
    );

    console.log('Material offers response:', response);

    // API returns an array where first element has { offers: [], averagePrice: number }
    if (
      !response ||
      !Array.isArray(response) ||
      response.length === 0 ||
      !response[0].offers ||
      response[0].offers.length === 0
    ) {
      // No offers - show alert and open details dialog directly (matching production behavior)
      closeAddMaterialOffersModal();
      showAlert('No offers found for this material item', 'info', 'dashboardAlert');
      // Still allow adding without offers
      setTimeout(() => {
        openAddMaterialDetailsModal();
      }, 100);
      return;
    }

    const offersData = response[0];
    const offers = offersData.offers || [];
    const averagePrice = offersData.averagePrice || 0;

    console.log('Material offers:', offers);
    console.log('Average price:', averagePrice);

    // Store average price for later use
    selectedMaterialItemData.averagePrice = averagePrice;

    // Render offers table (matching production: Company, Unit, Price, Date, Action)
    modalBody.innerHTML = `
      <div style="margin-bottom: 16px;">
        <strong>Average Price: ${averagePrice.toFixed(3)}</strong>
      </div>
      <table class="table" style="width: 100%;">
        <thead>
          <tr>
            <th>Company</th>
            <th>Unit</th>
            <th>Price</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${offers
            .map((offer) => {
              const accountName = offer.accountMadeOfferData?.companyName || '-';
              const unitSymbol = offer.measurementUnitData?.[0]?.representationSymbol || '-';
              const price = offer.price ? parseFloat(offer.price).toFixed(2) : '0.00';
              // Format date as DD.MM.YYYY HH:mm (matching production)
              const updatedAt = offer.updatedAt
                ? (() => {
                    const date = new Date(offer.updatedAt);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `${day}.${month}.${year} ${hours}:${minutes}`;
                  })()
                : '-';
              const offerId = offer._id || '';

              return `
                <tr>
                  <td>${escapeHtml(accountName)}</td>
                  <td>${escapeHtml(unitSymbol)}</td>
                  <td>${price}</td>
                  <td>${updatedAt}</td>
                  <td>
                    <button class="btn btn-primary" style="padding: 4px 12px; font-size: 13px;" onclick="selectMaterialOffer('${offerId}', '${price}', '${escapeHtml(
                accountName
              )}')">
                      ➕ Select
                    </button>
                  </td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error fetching material offers:', error);
    modalBody.innerHTML = `<div class="alert alert-error">Error loading offers: ${error.message}</div>`;
  }
}

// Select a material offer and open details dialog
function selectMaterialOffer(offerId, offerPrice, accountName) {
  console.log('selectMaterialOffer called with:', {
    offerId,
    offerPrice,
    accountName,
  });

  // Store selected offer data
  selectedMaterialItemData.selectedOfferId = String(offerId);
  selectedMaterialItemData.selectedOfferPrice =
    parseFloat(offerPrice) || selectedMaterialItemData.averagePrice;

  // Close offers modal and open details modal
  closeAddMaterialOffersModal();
  setTimeout(() => {
    openAddMaterialDetailsModal();
  }, 100);
}

// Open Add Material Offers Modal
function openAddMaterialOffersModal() {
  const modal = document.getElementById('addMaterialOffersModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeAddMaterialOffersModal() {
  const modal = document.getElementById('addMaterialOffersModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
}

// Open Add Material Details Modal
function openAddMaterialDetailsModal() {
  const modal = document.getElementById('addMaterialDetailsModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Update fields with selected material item data
    if (selectedMaterialItemData) {
      const nameElement = document.getElementById('selectedMaterialItemName');
      const unitElement = document.getElementById('selectedMaterialUnit');
      const consumptionNormInput = document.getElementById('addMaterialConsumptionNormInput');

      if (nameElement) nameElement.textContent = selectedMaterialItemData.itemName || '-';
      if (unitElement) unitElement.textContent = selectedMaterialItemData.unitSymbol || '-';
      if (consumptionNormInput) {
        consumptionNormInput.value = '';
        consumptionNormInput.focus(); // Focus on consumption norm input for quick entry
      }
    }

    // Focus on consumption norm input
    const consumptionNormInput = document.getElementById('addMaterialConsumptionNormInput');
    if (consumptionNormInput) {
      consumptionNormInput.focus();
    }
  }
}

function closeAddMaterialDetailsModal() {
  const modal = document.getElementById('addMaterialDetailsModal');
  if (modal) {
    modal.classList.add('hidden');
    // Clear all data when closing the details modal (user cancelled or completed)
    selectedMaterialItemData = null;
    currentAddMaterialLaborId = null;
    document.body.style.overflow = 'auto';
  }
}

// Confirm and add material item
async function confirmAddMaterialItem() {
  console.log('confirmAddMaterialItem called');
  console.log('selectedMaterialItemData:', selectedMaterialItemData);
  console.log('currentAddMaterialLaborId:', currentAddMaterialLaborId);
  console.log('currentEstimateId:', currentEstimateId);

  if (!selectedMaterialItemData || !currentAddMaterialLaborId) {
    console.error('Missing required data:', {
      selectedMaterialItemData: !!selectedMaterialItemData,
      laborId: !!currentAddMaterialLaborId,
    });
    showAlert('Please select a material item and labor item', 'error', 'dashboardAlert');
    return;
  }

  if (!currentEstimateId) {
    console.error('No current estimate ID');
    showAlert('No estimate selected', 'error', 'dashboardAlert');
    return;
  }

  const consumptionNormInput = document.getElementById('addMaterialConsumptionNormInput');
  // Production allows consumption norm to be 0 or empty, defaults to '0'
  const consumptionNormString = consumptionNormInput?.value?.trim() || '0';

  console.log('Material consumption norm:', consumptionNormString);

  if (!selectedMaterialItemData.unitId) {
    console.error('Missing unitId');
    showAlert('Unit information is missing', 'error', 'dashboardAlert');
    return;
  }

  if (!selectedMaterialItemData.itemId) {
    console.error('Missing itemId');
    showAlert('Material item ID is missing', 'error', 'dashboardAlert');
    return;
  }

  try {
    // API uses getReqParam/requireQueryParam which reads from query params OR body
    // Production sends args as query params
    // Use selected offer price if available, otherwise use average price
    const priceToUse =
      selectedMaterialItemData.selectedOfferPrice !== undefined
        ? selectedMaterialItemData.selectedOfferPrice
        : selectedMaterialItemData.averagePrice || 0;

    const queryParams = {
      estimatedLaborId: String(currentAddMaterialLaborId),
      materialItemId: String(selectedMaterialItemData.itemId),
      materialItemMeasurementUnitMongoId: String(selectedMaterialItemData.unitId),
      materialOfferItemName: String(selectedMaterialItemData.itemName || ''),
      materialConsumptionNorm: consumptionNormString, // Can be '0' if empty (matching production)
      materialOffersAveragePrice: priceToUse.toString(),
    };

    // Add offer ID if a specific offer was selected (optional parameter)
    if (selectedMaterialItemData.selectedOfferId) {
      queryParams.materialOfferId = String(selectedMaterialItemData.selectedOfferId);
    }

    console.log('Adding material item with query params:', queryParams);
    console.log(
      'Request URL will be: /api/v1/estimate/add_material_item?' +
        new URLSearchParams(queryParams).toString()
    );

    // API expects query params for getReqParam/requireQueryParam
    // Production uses POST with query params
    const response = await makeRequest(
      'POST',
      '/api/v1/estimate/add_material_item',
      null,
      queryParams
    );

    console.log('API response:', response);

    // Save values before closing modal (in case closeAddMaterialDetailsModal clears anything)
    const shouldReopenMaterialsModal =
      wasMaterialsModalOpen && savedMaterialsLaborId && savedMaterialsLaborName;
    const laborIdToReopen = savedMaterialsLaborId;
    const laborNameToReopen = savedMaterialsLaborName;

    closeAddMaterialDetailsModal();

    // Reload estimate details to show the new material item
    if (currentEstimateId) {
      console.log('Reloading estimate details for ID:', currentEstimateId);
      await loadEstimateDetails(currentEstimateId);
    }

    // If materials modal was open before adding, refresh it with the new material
    if (shouldReopenMaterialsModal && laborIdToReopen && laborNameToReopen) {
      console.log('Refreshing materials modal with:', {
        laborId: laborIdToReopen,
        laborName: laborNameToReopen,
      });
      wasMaterialsModalOpen = false; // Reset flag
      savedMaterialsLaborId = null; // Reset saved ID
      savedMaterialsLaborName = null; // Reset saved name

      // Check if materials modal is still open (it should be)
      const materialsModal = document.getElementById('materialsModal');
      if (materialsModal && !materialsModal.classList.contains('hidden')) {
        // Materials modal is still open - just refresh it with new materials list
        await loadMaterials(laborIdToReopen);
      } else {
        // Materials modal was closed somehow - reopen it
        setTimeout(async () => {
          await openMaterialsDialog(laborIdToReopen, laborNameToReopen);
        }, 200);
      }
    } else if (currentAddMaterialLaborId) {
      // If materials modal wasn't explicitly tracked but is visible, refresh it
      const materialsModal = document.getElementById('materialsModal');
      if (
        materialsModal &&
        !materialsModal.classList.contains('hidden') &&
        currentMaterialsLaborId
      ) {
        // Reload materials list to show newly added material
        await loadMaterials(currentMaterialsLaborId);
      }
    }

    showAlert('Material item added successfully', 'success', 'dashboardAlert');
  } catch (error) {
    console.error('Error adding material item:', error);
    console.error('Error stack:', error.stack);
    showAlert(`Error adding material item: ${error.message}`, 'error', 'dashboardAlert');
  }
}

// ==================== END MATERIAL ADDITION FUNCTIONS ====================

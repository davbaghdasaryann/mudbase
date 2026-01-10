// Add Labor Item Management
let currentAddLaborSubsectionId = null;
let currentAddLaborSectionId = null;
let selectedLaborItemData = null;

// Material selection state
let selectedMaterialItemData = null;
let currentAddMaterialLaborId = null;
let expandedMaterialAccordions = new Set();
let materialCategoriesData = [];
let laborCategoriesData = [];
let expandedLaborAccordions = new Set();

// Open Add Labor Dialog
// If subsectionId is null, it means adding to section level (will create empty subsection)
async function openAddLaborDialog(subsectionId, sectionId, subsectionIdParam) {
  console.log('openAddLaborDialog called with:', {
    subsectionId,
    sectionId,
    subsectionIdParam,
    types: {
      subsectionId: typeof subsectionId,
      sectionId: typeof sectionId,
      subsectionIdParam: typeof subsectionIdParam,
    },
  });

  // Handle section-level addition (subsectionId is null)
  if (subsectionId === null || subsectionId === 'null' || subsectionId === '') {
    currentAddLaborSubsectionId = null;
    currentAddLaborSectionId = sectionId || subsectionIdParam;
    console.log('Section-level addition. Section ID:', currentAddLaborSectionId);
  } else {
    // Subsection-level addition
    currentAddLaborSubsectionId = subsectionIdParam || subsectionId;
    currentAddLaborSectionId = sectionId;
    console.log(
      'Subsection-level addition. Subsection ID:',
      currentAddLaborSubsectionId,
      'Section ID:',
      currentAddLaborSectionId
    );
  }

  // Ensure IDs are strings
  if (currentAddLaborSectionId) {
    currentAddLaborSectionId = String(currentAddLaborSectionId);
  }
  if (currentAddLaborSubsectionId) {
    currentAddLaborSubsectionId = String(currentAddLaborSubsectionId);
  }

  console.log('Final IDs set:', {
    subsectionId: currentAddLaborSubsectionId,
    sectionId: currentAddLaborSectionId,
  });

  selectedLaborItemData = null;
  expandedLaborAccordions.clear();

  const modal = document.getElementById('addLaborModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Load labor categories
    await loadLaborCategoriesForDialog('');
  } else {
    console.error('Add labor modal not found!');
  }
}

function closeAddLaborModal() {
  const modal = document.getElementById('addLaborModal');
  if (modal) {
    modal.classList.add('hidden');
    // DON'T clear section/subsection IDs here - we need them for confirmAddLaborItem!
    // Only clear selectedLaborItemData if we're actually canceling (not opening details modal)
    // The IDs will be cleared when the details modal is closed
    expandedLaborAccordions.clear();
    // Don't restore body overflow here - details modal will handle it
  }
}

// Load labor categories (Level 1)
async function loadLaborCategoriesForDialog(searchVal = '') {
  const container = document.getElementById('addLaborCategoriesAccordion');
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading">Loading labor categories...</div>';

    const queryParams = {};
    if (searchVal) {
      queryParams.searchVal = searchVal;
    }

    const response = await makeRequest('GET', '/api/v1/labor/fetch_categories', null, queryParams);
    laborCategoriesData = Array.isArray(response) ? response : [];

    console.log('Categories loaded:', laborCategoriesData.length, 'categories');
    if (laborCategoriesData.length > 0) {
      console.log('First category sample:', {
        _id: laborCategoriesData[0]._id,
        _idType: typeof laborCategoriesData[0]._id,
        code: laborCategoriesData[0].code,
        name: laborCategoriesData[0].name,
      });
    }

    if (laborCategoriesData.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No labor categories found</div>';
      return;
    }

    // Render categories accordion
    container.innerHTML = laborCategoriesData
      .map(
        (category) => `
      <div class="estimate-accordion" style="margin-bottom: 8px;">
        <div 
          class="estimate-accordion-header" 
          onclick="toggleLaborCategory('${category._id}')"
          style="cursor: pointer; padding: 12px 16px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;"
        >
          <span><strong>${escapeHtml(category.code || '')}</strong> ${escapeHtml(
          category.name || '-'
        )} ${category.childrenQuantity ? `(${category.childrenQuantity})` : '(0)'}</span>
          <span style="font-size: 18px;">${
            expandedLaborAccordions.has(`cat-${category._id}`) ? '▼' : '▶'
          }</span>
        </div>
        <div 
          id="cat-${category._id}-content" 
          class="estimate-accordion-content" 
          style="display: ${
            expandedLaborAccordions.has(`cat-${category._id}`) ? 'block' : 'none'
          }; padding: 12px 16px; border-left: 2px solid #ddd; margin-left: 12px; margin-top: 8px;"
        >
          <div id="cat-${category._id}-subcategories" class="loading">Loading subcategories...</div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (error) {
    console.error('Error loading labor categories:', error);
    container.innerHTML = `<div class="alert alert-error">Error loading labor categories: ${error.message}</div>`;
  }
}

// Toggle labor category (expand/collapse to load subcategories)
async function toggleLaborCategory(categoryId) {
  console.log('toggleLaborCategory called with:', categoryId, 'type:', typeof categoryId);
  const accordionId = `cat-${categoryId}`;
  const isExpanded = expandedLaborAccordions.has(accordionId);

  // Update expanded state first
  if (isExpanded) {
    expandedLaborAccordions.delete(accordionId);
  } else {
    expandedLaborAccordions.add(accordionId);
  }

  // Update UI visibility BEFORE loading subcategories
  const content = document.getElementById(`${accordionId}-content`);
  if (content) {
    content.style.display = expandedLaborAccordions.has(accordionId) ? 'block' : 'none';
  }

  // Update icon
  const header = document.querySelector(`[onclick="toggleLaborCategory('${categoryId}')"]`);
  if (header) {
    const icon = header.querySelector('span:last-child');
    if (icon) {
      icon.textContent = expandedLaborAccordions.has(accordionId) ? '▼' : '▶';
    }
  }

  // Load subcategories only if expanding
  if (expandedLaborAccordions.has(accordionId)) {
    // Ensure categoryId is a string
    const categoryIdStr = String(categoryId);
    console.log('Loading subcategories for category:', categoryIdStr);
    await loadLaborSubcategories(categoryIdStr);
  }
}

// Load labor subcategories (Level 2)
async function loadLaborSubcategories(categoryId) {
  const container = document.getElementById(`cat-${categoryId}-subcategories`);
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading">Loading subcategories...</div>';

    // API expects categoryMongoId and searchVal as query params, and optional filters in body
    // Production uses: args: { categoryMongoId, searchVal }, json: selectedFiltersData
    // The API uses requireQueryParam for categoryMongoId, so it must be in query string
    // Production API call: searchVal='' (empty string) and body: {"categoryId":null,"subcategoryId":null}
    const queryParams = {
      categoryMongoId: String(categoryId), // Ensure it's a string
      searchVal: '', // Empty string, not 'empty' - matching production exactly
    };

    // Pass body with categoryId and subcategoryId as null (matching production exactly)
    const requestBody = {
      categoryId: null,
      subcategoryId: null,
    };

    const response = await makeRequest(
      'POST',
      '/api/v1/labor/fetch_subcategories',
      requestBody,
      queryParams
    );

    console.log('Subcategories API call:', {
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
          onclick="toggleLaborSubcategory('${categoryId}', '${subcat._id}')"
          style="cursor: pointer; padding: 10px 14px; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;"
        >
          <span><strong>${escapeHtml(subcat.code || '')}</strong> ${escapeHtml(
          subcat.name || '-'
        )} ${subcat.childrenQuantity ? `(${subcat.childrenQuantity})` : '(0)'}</span>
          <span style="font-size: 16px;">${
            expandedLaborAccordions.has(`subcat-${subcat._id}`) ? '▼' : '▶'
          }</span>
        </div>
        <div 
          id="subcat-${subcat._id}-content" 
          class="estimate-accordion-content" 
          style="display: ${
            expandedLaborAccordions.has(`subcat-${subcat._id}`) ? 'block' : 'none'
          }; padding: 12px 16px; border-left: 2px solid #ddd; margin-left: 12px; margin-top: 8px;"
        >
          <div id="subcat-${subcat._id}-items" class="loading">Loading items...</div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (error) {
    console.error('Error loading labor subcategories:', error);
    container.innerHTML = `<div class="alert alert-error">Error loading subcategories: ${error.message}</div>`;
  }
}

// Toggle labor subcategory (expand/collapse to load items)
async function toggleLaborSubcategory(categoryId, subcategoryId) {
  const accordionId = `subcat-${subcategoryId}`;
  const isExpanded = expandedLaborAccordions.has(accordionId);

  // Update expanded state first
  if (isExpanded) {
    expandedLaborAccordions.delete(accordionId);
  } else {
    expandedLaborAccordions.add(accordionId);
  }

  // Update UI visibility BEFORE loading items
  const content = document.getElementById(`${accordionId}-content`);
  if (content) {
    content.style.display = expandedLaborAccordions.has(accordionId) ? 'block' : 'none';
  }

  // Update icon
  const header = document.querySelector(
    `[onclick*="toggleLaborSubcategory('${categoryId}', '${subcategoryId}')"]`
  );
  if (header) {
    const icon = header.querySelector('span:last-child');
    if (icon) {
      icon.textContent = expandedLaborAccordions.has(accordionId) ? '▼' : '▶';
    }
  }

  // Load items only if expanding
  if (expandedLaborAccordions.has(accordionId)) {
    await loadLaborItems(subcategoryId);
  }
}

// Load labor items (Level 3) - show as table
async function loadLaborItems(subcategoryId) {
  const container = document.getElementById(`subcat-${subcategoryId}-items`);
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
      '/api/v1/labor/fetch_items_with_average_price',
      null,
      queryParams
    );

    console.log('Labor items response for subcategory', subcategoryId, ':', response);

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
            <th>Work per hour</th>
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

              // API doesn't return averagePrice (it's commented out in the aggregation)
              // But we still display it as 0.00 or use it if present
              const averagePrice = item.averagePrice
                ? parseFloat(item.averagePrice).toFixed(2)
                : '0.00';

              return `
            <tr>
              <td>${escapeHtml(item.fullCode || '-')}</td>
              <td>${escapeHtml(item.name || '-')}</td>
              <td>${item.laborHours || '-'}</td>
              <td>${escapeHtml(measurementUnitSymbol)}</td>
              <td>${averagePrice}</td>
              <td>
                <button class="btn btn-primary" style="padding: 4px 12px; font-size: 13px;" onclick="selectLaborItem('${
                  item._id
                }', '${escapeHtml(item.name || '')}', '${escapeHtml(
                measurementUnitSymbol
              )}', '${measurementUnitMongoId}', '${item.averagePrice || 0}', '${
                item.laborHours || 0
              }')">
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
    console.error('Error loading labor items:', error);
    container.innerHTML = `<div class="alert alert-error">Error loading items: ${error.message}</div>`;
  }
}

function searchLaborCategoriesInDialog() {
  const searchVal = document.getElementById('addLaborSearchInput')?.value || '';
  expandedLaborAccordions.clear();
  loadLaborCategoriesForDialog(searchVal);
}

// Select labor item and open details dialog
function selectLaborItem(itemId, itemName, unitSymbol, unitId, averagePrice, laborHours) {
  console.log('selectLaborItem called with:', {
    itemId,
    itemName,
    unitSymbol,
    unitId,
    averagePrice,
    laborHours,
  });

  // Ensure itemId and unitId are strings (they come from the table)
  selectedLaborItemData = {
    itemId: String(itemId),
    itemName: String(itemName || ''),
    unitSymbol: String(unitSymbol || ''),
    unitId: String(unitId || ''),
    averagePrice: parseFloat(averagePrice) || 0,
    laborHours: parseFloat(laborHours) || 0,
  };

  console.log('Selected labor item data:', selectedLaborItemData);

  // Update details dialog - only show quantity field (matching production)
  const nameElement = document.getElementById('selectedLaborItemName');
  const unitElement = document.getElementById('selectedLaborUnit');
  const quantityInput = document.getElementById('addLaborQuantityInput');

  if (nameElement) nameElement.textContent = itemName || '-';
  if (unitElement) unitElement.textContent = unitSymbol || '-';
  if (quantityInput) {
    quantityInput.value = '';
    quantityInput.focus(); // Focus on quantity input for quick entry
  }

  // Close selection dialog and open details dialog
  // Don't clear section/subsection IDs - we need them for the API call
  closeAddLaborModal();
  // Small delay to ensure modal closes before opening next one
  setTimeout(() => {
    openAddLaborDetailsModal();
  }, 100);
}

// Open Add Labor Details Modal
function openAddLaborDetailsModal() {
  const modal = document.getElementById('addLaborDetailsModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Focus on quantity input
    const quantityInput = document.getElementById('addLaborQuantityInput');
    if (quantityInput) {
      quantityInput.focus();
    }
  }
}

function closeAddLaborDetailsModal() {
  const modal = document.getElementById('addLaborDetailsModal');
  if (modal) {
    modal.classList.add('hidden');
    // Clear all data when closing the details modal (user cancelled or completed)
    selectedLaborItemData = null;
    currentAddLaborSubsectionId = null;
    currentAddLaborSectionId = null;
    document.body.style.overflow = 'auto';
  }
}

// Confirm and add labor item
async function confirmAddLaborItem() {
  console.log('confirmAddLaborItem called');
  console.log('selectedLaborItemData:', selectedLaborItemData);
  console.log('currentAddLaborSubsectionId:', currentAddLaborSubsectionId);
  console.log('currentAddLaborSectionId:', currentAddLaborSectionId);
  console.log('currentEstimateId:', currentEstimateId);

  if (!selectedLaborItemData || (!currentAddLaborSubsectionId && !currentAddLaborSectionId)) {
    console.error('Missing required data:', {
      selectedLaborItemData: !!selectedLaborItemData,
      subsectionId: !!currentAddLaborSubsectionId,
      sectionId: !!currentAddLaborSectionId,
    });
    showAlert('Please select a labor item and section/subsection', 'error', 'dashboardAlert');
    return;
  }

  if (!currentEstimateId) {
    console.error('No current estimate ID');
    showAlert('No estimate selected', 'error', 'dashboardAlert');
    return;
  }

  const quantityInput = document.getElementById('addLaborQuantityInput');
  // Production allows quantity to be 0 or empty, defaults to '0'
  const quantityString = quantityInput?.value?.trim() || '0';

  console.log('Quantity:', quantityString);

  if (!selectedLaborItemData.unitId) {
    console.error('Missing unitId');
    showAlert('Unit information is missing', 'error', 'dashboardAlert');
    return;
  }

  if (!selectedLaborItemData.itemId) {
    console.error('Missing itemId');
    showAlert('Labor item ID is missing', 'error', 'dashboardAlert');
    return;
  }

  try {
    // API uses getReqParam/requireQueryParam which reads from query params OR body
    // Production sends args as query params, so we'll do the same
    const queryParams = {};

    if (currentAddLaborSubsectionId) {
      queryParams.estimateSubsectionId = String(currentAddLaborSubsectionId);
    } else if (currentAddLaborSectionId) {
      queryParams.estimateSectionId = String(currentAddLaborSectionId);
    } else {
      showAlert('Invalid section/subsection', 'error', 'dashboardAlert');
      return;
    }

    // Required parameters matching production - all as strings
    queryParams.laborItemId = String(selectedLaborItemData.itemId);
    queryParams.laborItemQuantity = quantityString; // Can be '0' if empty (matching production)
    queryParams.laborOffersAveragePrice = (selectedLaborItemData.averagePrice || 0).toString();
    queryParams.laborOfferItemLaborHours = (selectedLaborItemData.laborHours || 0).toString();
    queryParams.laborItemMeasurementUnitMongoId = String(selectedLaborItemData.unitId);
    queryParams.laborOfferItemName = String(selectedLaborItemData.itemName || '');

    console.log('Adding labor item with query params:', queryParams);
    console.log(
      'Request URL will be: /api/v1/estimate/add_labor_item?' +
        new URLSearchParams(queryParams).toString()
    );

    // API expects query params (not body) for getReqParam/requireQueryParam
    // Production uses POST with query params
    const response = await makeRequest(
      'POST',
      '/api/v1/estimate/add_labor_item',
      null,
      queryParams
    );

    console.log('API response:', response);

    closeAddLaborDetailsModal();

    // Reload estimate details to show the new labor item
    if (currentEstimateId) {
      console.log('Reloading estimate details for ID:', currentEstimateId);
      await loadEstimateDetails(currentEstimateId);
    }

    showAlert('Labor item added successfully', 'success', 'dashboardAlert');
  } catch (error) {
    console.error('Error adding labor item:', error);
    console.error('Error stack:', error.stack);
    showAlert(`Error adding labor item: ${error.message}`, 'error', 'dashboardAlert');
  }
}


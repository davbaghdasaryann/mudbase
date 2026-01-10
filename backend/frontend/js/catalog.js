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
        <div class="catalog-item-header" onclick="toggleCatalogItem(this)">
          <div>
            <span class="catalog-item-title">${escapeHtml(category.name || '-')}</span>
            ${
              category.code
                ? `<span class="catalog-item-code">(${escapeHtml(category.code)})</span>`
                : ''
            }
          </div>
          <span>${category.childrenQuantity || 0} items</span>
        </div>
        <div class="catalog-item-content" data-category-id="${category._id}" data-type="${type}">
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

async function toggleCatalogItem(header) {
  const content = header.nextElementSibling;
  const isExpanded = content.classList.contains('expanded');

  if (isExpanded) {
    content.classList.remove('expanded');
    return;
  }

  content.classList.add('expanded');
  const categoryId = content.dataset.categoryId;
  const type = content.dataset.type;

  if (content.querySelector('.loading')) {
    try {
      const endpoint =
        type === 'labor' ? 'labor/fetch_subcategories' : 'material/fetch_subcategories';
      const response = await makeRequest('GET', `/api/v1/${endpoint}`, null, {
        categoryMongoId: categoryId,
        searchVal: '',
      });
      const subcategories = Array.isArray(response) ? response : [];

      content.innerHTML =
        subcategories.length > 0
          ? subcategories
              .map(
                (sub) => `
        <div class="catalog-item-children">
          <div><strong>${escapeHtml(sub.name || '-')}</strong> ${
                  sub.code ? `(${escapeHtml(sub.code)})` : ''
                }</div>
          ${sub.averagePrice ? `<div>Avg Price: ${sub.averagePrice}</div>` : ''}
          ${
            sub.measurementUnitRepresentationSymbol
              ? `<div>Unit: ${escapeHtml(sub.measurementUnitRepresentationSymbol)}</div>`
              : ''
          }
        </div>
      `
              )
              .join('')
          : '<div class="alert alert-info">No subcategories found</div>';
    } catch (error) {
      console.error('Error loading subcategories:', error);
      content.innerHTML = `<div class="alert alert-error">Error loading subcategories: ${error.message}</div>`;
    }
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


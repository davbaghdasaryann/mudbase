let currentEstimateId = null;
let currentEstimateTitle = null;
let deleteEstimateId = null;

async function loadEstimates(searchVal = '') {
  const container = document.getElementById('estimatesTable');
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading">Loading estimates...</div>';

    const queryParams = {searchVal: searchVal || 'empty'};
    const response = await makeRequest('GET', '/api/v1/estimates/fetch', null, queryParams);
    const estimates = Array.isArray(response) ? response : [];

    if (estimates.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No estimates found</div>';
      return;
    }

    container.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Cost</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${estimates
            .map(
              (estimate) => `
            <tr ondblclick="openEstimateModal('${estimate._id}', '${escapeHtml(
                estimate.name || estimate.estimateName || 'Estimate'
              )}')">
              <td>${escapeHtml(estimate.estimateNumber || estimate._id.substring(0, 8))}</td>
              <td>${escapeHtml(estimate.name || estimate.estimateName || '-')}</td>
              <td>${
                estimate.totalCostWithOtherExpenses || estimate.totalCost || estimate.totalPrice
                  ? (
                      estimate.totalCostWithOtherExpenses ||
                      estimate.totalCost ||
                      estimate.totalPrice
                    ).toFixed(2)
                  : '0.00'
              }</td>
              <td>${
                estimate.createdAt ? new Date(estimate.createdAt).toLocaleDateString() : '-'
              }</td>
              <td>
                <div class="table-actions">
                  <button class="table-action-btn" onclick="event.stopPropagation(); openEstimateModal('${
                    estimate._id
                  }', '${escapeHtml(
                estimate.name || estimate.estimateName || 'Estimate'
              )}')" title="View/Edit">
                    👁️
                  </button>
                  <button class="table-action-btn danger" onclick="event.stopPropagation(); confirmDeleteEstimateDialog('${
                    estimate._id
                  }')" title="Delete">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error loading estimates:', error);
    container.innerHTML = `<div class="alert alert-error">Error loading estimates: ${error.message}</div>`;
  }
}

function searchEstimates() {
  const searchVal = document.getElementById('estimatesSearch')?.value || '';
  loadEstimates(searchVal || 'empty');
}

// Estimates Tabs
function showEstimatesTab(tab) {
  // Hide all tabs and tab panes in estimates page
  document.querySelectorAll('#page-estimates .tab').forEach((t) => {
    t.classList.remove('active');
    t.style.borderBottomColor = 'transparent';
    t.style.color = '#666';
    t.style.fontWeight = '500';
  });
  document.querySelectorAll('#page-estimates .tab-pane').forEach((p) => {
    p.classList.add('hidden');
    p.style.display = 'none';
  });

  // Show selected tab and tab pane
  const tabButton = document.getElementById(`tab-estimates-${tab}`);
  const tabPane = document.getElementById(`tab-content-estimates-${tab}`);

  if (tabButton) {
    tabButton.classList.add('active');
    tabButton.style.borderBottomColor = '#1976d2';
    tabButton.style.color = '#1976d2';
    tabButton.style.fontWeight = '600';
  }
  if (tabPane) {
    tabPane.classList.remove('hidden');
    tabPane.style.display = 'block';
  }

  // Load data for the selected tab
  if (tab === 'my') {
    loadEstimates();
  } else if (tab === 'shared') {
    // Load accounts filter first, then load estimates
    loadSharedEstimatesAccounts().then(() => {
      loadSharedEstimates();
    });
  } else if (tab === 'offers') {
    // Load accounts filter first, then load estimates
    loadEstimateOffersAccounts().then(() => {
      loadEstimateOffers();
    });
  }
}

// Shared Estimates Account Filter State
let sharedEstimatesAccountsList = [];
let selectedSharedEstimatesAccountId = 'all';

// Load accounts list for shared estimates filter
async function loadSharedEstimatesAccounts() {
  try {
    const accounts = await makeRequest(
      'GET',
      '/api/v1/accounts/with_estimates_shared_by_me',
      null,
      null
    );
    sharedEstimatesAccountsList = Array.isArray(accounts) ? accounts : [];

    // Update dropdown options
    const filterSelect = document.getElementById('sharedEstimatesAccountFilter');
    if (filterSelect) {
      // Clear existing options except "All"
      filterSelect.innerHTML = '<option value="all">All Companies</option>';

      // Remove duplicates based on companyName
      const uniqueAccounts = sharedEstimatesAccountsList.filter(
        (account, index, self) =>
          index === self.findIndex((a) => a.companyName === account.companyName)
      );

      // Add account options
      uniqueAccounts.forEach((account) => {
        const option = document.createElement('option');
        option.value = account._id;
        option.textContent = account.companyName || '-';
        filterSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading shared estimates accounts:', error);
  }
}

function onSharedEstimatesAccountFilterChange() {
  const filterSelect = document.getElementById('sharedEstimatesAccountFilter');
  if (filterSelect) {
    selectedSharedEstimatesAccountId = filterSelect.value || 'all';
    searchSharedEstimates();
  }
}

// Estimates - Shared Estimates
async function loadSharedEstimates(searchVal = '') {
  const container = document.getElementById('sharedEstimatesTable');
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading">Loading shared estimates...</div>';

    const queryParams = {searchVal: searchVal || 'empty'};
    // Pass accountId in request body (matching production API behavior - estimates_shared_by_me/fetch expects accountId in req.body)
    const requestBody =
      selectedSharedEstimatesAccountId && selectedSharedEstimatesAccountId !== 'all'
        ? {accountId: selectedSharedEstimatesAccountId}
        : {};

    const response = await makeRequest(
      'POST',
      '/api/v1/estimates_shared_by_me/fetch',
      requestBody,
      queryParams
    );
    const estimates = Array.isArray(response) ? response : [];

    if (estimates.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No shared estimates found</div>';
      return;
    }

    container.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Estimate Number</th>
            <th>Name</th>
            <th>Shared With</th>
            <th>Total Cost</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${estimates
            .map(
              (estimate) => `
            <tr ondblclick="openEstimateModal('${
              estimate.sharedEstimateId || estimate.estimatesData?._id || estimate._id
            }', '${escapeHtml(
                estimate.name || estimate.estimatesData?.name || estimate.estimateName || 'Estimate'
              )}')">
              <td>${escapeHtml(
                estimate.estimateNumber || estimate.estimatesData?.estimateNumber || '-'
              )}</td>
              <td>${escapeHtml(estimate.name || estimate.estimatesData?.name || '-')}</td>
              <td>${escapeHtml(
                estimate.sharedWithAccountData?.companyName || estimate.companyName || 'Unknown'
              )}</td>
              <td>${(
                estimate.totalCostWithOtherExpenses ||
                estimate.estimatesData?.totalCostWithOtherExpenses ||
                estimate.totalCost ||
                estimate.estimatesData?.totalCost ||
                0
              ).toFixed(2)}</td>
              <td>${
                estimate.createdAt || estimate.estimatesData?.createdAt
                  ? new Date(
                      estimate.createdAt || estimate.estimatesData?.createdAt
                    ).toLocaleDateString()
                  : '-'
              }</td>
              <td>
                <div class="table-actions">
                  <button class="table-action-btn" onclick="event.stopPropagation(); openEstimateModal('${
                    estimate.sharedEstimateId || estimate.estimatesData?._id || estimate._id
                  }', '${escapeHtml(
                estimate.name || estimate.estimatesData?.name || estimate.estimateName || 'Estimate'
              )}')" title="View/Edit">
                    👁️
                  </button>
                </div>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error loading shared estimates:', error);
    container.innerHTML = `<div class="alert alert-error">Error loading shared estimates: ${error.message}</div>`;
  }
}

function searchSharedEstimates() {
  const searchVal = document.getElementById('sharedEstimatesSearch')?.value || '';
  loadSharedEstimates(searchVal || 'empty');
}

// Estimate Offers Account Filter State
let estimateOffersAccountsList = [];
let selectedEstimateOffersAccountId = 'all';

// Load accounts list for estimate offers filter
async function loadEstimateOffersAccounts() {
  try {
    const accounts = await makeRequest('GET', '/api/v1/accounts/done_estimate_share', null, null);
    estimateOffersAccountsList = Array.isArray(accounts) ? accounts : [];

    // Update dropdown options
    const filterSelect = document.getElementById('estimateOffersAccountFilter');
    if (filterSelect) {
      // Clear existing options except "All"
      filterSelect.innerHTML = '<option value="all">All Companies</option>';

      // Remove duplicates based on companyName
      const uniqueAccounts = estimateOffersAccountsList.filter(
        (account, index, self) =>
          index === self.findIndex((a) => a.companyName === account.companyName)
      );

      // Add account options
      uniqueAccounts.forEach((account) => {
        const option = document.createElement('option');
        option.value = account._id;
        option.textContent = account.companyName || '-';
        filterSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading estimate offers accounts:', error);
  }
}

function onEstimateOffersAccountFilterChange() {
  const filterSelect = document.getElementById('estimateOffersAccountFilter');
  if (filterSelect) {
    selectedEstimateOffersAccountId = filterSelect.value || 'all';
    searchEstimateOffers();
  }
}

// Estimates - Estimate Offers
async function loadEstimateOffers(searchVal = '') {
  const container = document.getElementById('estimateOffersTable');
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading">Loading estimate offers...</div>';

    const queryParams = {searchVal: searchVal || 'empty'};
    // Pass accountId in request body (matching production API behavior - estimates_shares/fetch expects accountId in req.body)
    const requestBody =
      selectedEstimateOffersAccountId && selectedEstimateOffersAccountId !== 'all'
        ? {accountId: selectedEstimateOffersAccountId}
        : {};

    const response = await makeRequest(
      'POST',
      '/api/v1/estimates_shares/fetch',
      requestBody,
      queryParams
    );
    const estimates = Array.isArray(response) ? response : [];

    if (estimates.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No estimate offers found</div>';
      return;
    }

    container.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Estimate Number</th>
            <th>Name</th>
            <th>Shared By</th>
            <th>Total Cost</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${estimates
            .map(
              (estimate) => `
            <tr ondblclick="openEstimateModal('${
              estimate.sharedEstimateId || estimate.estimatesData?._id || estimate._id
            }', '${escapeHtml(
                estimate.name || estimate.estimatesData?.name || estimate.estimateName || 'Estimate'
              )}')">
              <td>${escapeHtml(
                estimate.estimateNumber || estimate.estimatesData?.estimateNumber || '-'
              )}</td>
              <td>${escapeHtml(estimate.name || estimate.estimatesData?.name || '-')}</td>
              <td>${escapeHtml(
                estimate.sharedByAccountData?.companyName ||
                  estimate.sharedByAccountName ||
                  'Unknown'
              )}</td>
              <td>${(
                estimate.totalCostWithOtherExpenses ||
                estimate.estimatesData?.totalCostWithOtherExpenses ||
                estimate.totalCost ||
                estimate.estimatesData?.totalCost ||
                0
              ).toFixed(2)}</td>
              <td>${
                estimate.createdAt || estimate.estimatesData?.createdAt
                  ? new Date(
                      estimate.createdAt || estimate.estimatesData?.createdAt
                    ).toLocaleDateString()
                  : '-'
              }</td>
              <td>
                <div class="table-actions">
                  <button class="table-action-btn" onclick="event.stopPropagation(); openEstimateModal('${
                    estimate.sharedEstimateId || estimate.estimatesData?._id || estimate._id
                  }', '${escapeHtml(
                estimate.name || estimate.estimatesData?.name || estimate.estimateName || 'Estimate'
              )}')" title="View/Edit">
                    👁️
                  </button>
                </div>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error loading estimate offers:', error);
    container.innerHTML = `<div class="alert alert-error">Error loading estimate offers: ${error.message}</div>`;
  }
}

function searchEstimateOffers() {
  const searchVal = document.getElementById('estimateOffersSearch')?.value || '';
  loadEstimateOffers(searchVal || 'empty');
}

// Section and Subsection Management
let currentSectionIdForSubsection = null;
let currentRenameId = null;
let currentRenameType = null; // 'section' or 'subsection'

// Add Section
function openAddSectionDialog() {
  const modal = document.getElementById('addSectionModal');
  const input = document.getElementById('sectionNameInput');
  if (modal && input) {
    modal.classList.remove('hidden');
    input.value = '';
    input.focus();
    document.body.style.overflow = 'hidden';
  }
}

function closeAddSectionModal() {
  const modal = document.getElementById('addSectionModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
}

async function confirmAddSection() {
  const input = document.getElementById('sectionNameInput');
  if (!input || !currentEstimateId) return;

  const sectionName = input.value.trim();
  if (!sectionName) {
    showAlert('Section name is required', 'error', 'dashboardAlert');
    return;
  }

  try {
    await makeRequest('POST', '/api/v1/estimate/add_section', null, {
      estimateId: currentEstimateId,
      estimateSectionName: sectionName,
    });

    closeAddSectionModal();
    showAlert('✅ Section added successfully', 'success', 'dashboardAlert');

    // Reload estimate details
    if (currentEstimateId) {
      await loadEstimateDetails(currentEstimateId);
    }
  } catch (error) {
    console.error('Error adding section:', error);
    showAlert(`❌ Error adding section: ${error.message}`, 'error', 'dashboardAlert');
  }
}

// Add Subsection
function openAddSubsectionDialog(sectionId) {
  currentSectionIdForSubsection = sectionId;
  const modal = document.getElementById('addSubsectionModal');
  const input = document.getElementById('subsectionNameInput');
  if (modal && input) {
    modal.classList.remove('hidden');
    input.value = '';
    input.focus();
    document.body.style.overflow = 'hidden';
  }
}

function closeAddSubsectionModal() {
  const modal = document.getElementById('addSubsectionModal');
  if (modal) {
    modal.classList.add('hidden');
    currentSectionIdForSubsection = null;
    document.body.style.overflow = 'auto';
  }
}

async function confirmAddSubsection() {
  const input = document.getElementById('subsectionNameInput');
  if (!input || !currentSectionIdForSubsection) return;

  const subsectionName = input.value.trim();
  if (!subsectionName) {
    showAlert('Subsection name is required', 'error', 'dashboardAlert');
    return;
  }

  try {
    await makeRequest('POST', '/api/v1/estimate/add_subsection', null, {
      estimateSectionId: currentSectionIdForSubsection,
      estimateSubsectionName: subsectionName,
    });

    closeAddSubsectionModal();
    showAlert('✅ Subsection added successfully', 'success', 'dashboardAlert');

    // Reload estimate details
    if (currentEstimateId) {
      await loadEstimateDetails(currentEstimateId);
    }
  } catch (error) {
    console.error('Error adding subsection:', error);
    showAlert(`❌ Error adding subsection: ${error.message}`, 'error', 'dashboardAlert');
  }
}

// Rename Section/Subsection
function openRenameSectionDialog(sectionId, currentName) {
  currentRenameId = sectionId;
  currentRenameType = 'section';
  const modal = document.getElementById('renameSectionModal');
  const title = document.getElementById('renameSectionModalTitle');
  const label = document.getElementById('renameSectionModalLabel');
  const input = document.getElementById('renameSectionNameInput');
  if (modal && title && label && input) {
    title.textContent = 'Rename Section';
    label.textContent = 'Section Name';
    input.value = currentName;
    modal.classList.remove('hidden');
    input.focus();
    input.select();
    document.body.style.overflow = 'hidden';
  }
}

function openRenameSubsectionDialog(subsectionId, currentName) {
  currentRenameId = subsectionId;
  currentRenameType = 'subsection';
  const modal = document.getElementById('renameSectionModal');
  const title = document.getElementById('renameSectionModalTitle');
  const label = document.getElementById('renameSectionModalLabel');
  const input = document.getElementById('renameSectionNameInput');
  if (modal && title && label && input) {
    title.textContent = 'Rename Subsection';
    label.textContent = 'Subsection Name';
    input.value = currentName;
    modal.classList.remove('hidden');
    input.focus();
    input.select();
    document.body.style.overflow = 'hidden';
  }
}

function closeRenameSectionModal() {
  const modal = document.getElementById('renameSectionModal');
  if (modal) {
    modal.classList.add('hidden');
    currentRenameId = null;
    currentRenameType = null;
    document.body.style.overflow = 'auto';
  }
}

async function confirmRenameSection() {
  const input = document.getElementById('renameSectionNameInput');
  if (!input || !currentRenameId || !currentRenameType) return;

  const newName = input.value.trim();
  if (!newName) {
    showAlert('Name is required', 'error', 'dashboardAlert');
    return;
  }

  try {
    if (currentRenameType === 'section') {
      // estimate/rename_section uses registerHandlerSession, so path is /api/v1/estimate/rename_section
      await makeRequest('POST', '/api/v1/estimate/rename_section', null, {
        estimateSectionId: currentRenameId,
        estimateSectionNewName: newName,
      });
    } else if (currentRenameType === 'subsection') {
      // estimate/rename_subsection uses registerHandlerSession, so path is /api/v1/estimate/rename_subsection
      await makeRequest('POST', '/api/v1/estimate/rename_subsection', null, {
        estimateSubsectionId: currentRenameId,
        estimateSubsectionNewName: newName,
      });
    }

    closeRenameSectionModal();
    showAlert('✅ Renamed successfully', 'success', 'dashboardAlert');

    // Reload estimate details
    if (currentEstimateId) {
      await loadEstimateDetails(currentEstimateId);
    }
  } catch (error) {
    console.error('Error renaming:', error);
    showAlert(`❌ Error renaming: ${error.message}`, 'error', 'dashboardAlert');
  }
}

// Remove Section
async function removeEstimateSection(sectionId, sectionName) {
  if (
    !confirm(
      `Are you sure you want to remove the section "${sectionName}"? This will also remove all subsections and items in this section.`
    )
  ) {
    return;
  }

  try {
    await makeRequest('POST', '/api/v1/estimate/remove_section', null, {
      estimateSectionId: sectionId,
    });

    showAlert('✅ Section removed successfully', 'success', 'dashboardAlert');

    // Reload estimate details
    if (currentEstimateId) {
      await loadEstimateDetails(currentEstimateId);
    }
  } catch (error) {
    console.error('Error removing section:', error);
    showAlert(`❌ Error removing section: ${error.message}`, 'error', 'dashboardAlert');
  }
}

// Remove Subsection
async function removeEstimateSubsection(subsectionId, subsectionName) {
  if (
    !confirm(
      `Are you sure you want to remove the subsection "${subsectionName}"? This will also remove all items in this subsection.`
    )
  ) {
    return;
  }

  try {
    // estimate/remove_subsection uses registerHandlerSession, so path is /api/v1/estimate/remove_subsection
    await makeRequest('POST', '/api/v1/estimate/remove_subsection', null, {
      estimateSubsectionId: subsectionId,
    });

    showAlert('✅ Subsection removed successfully', 'success', 'dashboardAlert');

    // Reload estimate details
    if (currentEstimateId) {
      await loadEstimateDetails(currentEstimateId);
    }
  } catch (error) {
    console.error('Error removing subsection:', error);
    showAlert(`❌ Error removing subsection: ${error.message}`, 'error', 'dashboardAlert');
  }
}

// Fetch Market Prices
async function handleFetchMarketPrices() {
  if (!currentEstimateId) {
    showAlert('No estimate selected', 'error', 'dashboardAlert');
    return;
  }

  if (
    !confirm('This will update all labor and material prices to current market prices. Continue?')
  ) {
    return;
  }

  try {
    await makeRequest('POST', '/api/v1/estimate/calc_market_prices', null, {
      estimateId: currentEstimateId,
    });

    showAlert('✅ Market prices fetched and updated successfully', 'success', 'dashboardAlert');

    // Reload estimate details to reflect new prices
    if (currentEstimateId) {
      await loadEstimateDetails(currentEstimateId);
    }
  } catch (error) {
    console.error('Error fetching market prices:', error);
    showAlert(`❌ Error fetching market prices: ${error.message}`, 'error', 'dashboardAlert');
  }
}

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
  try {
    if (e && e.key === 'Escape') {
      const addSectionModal = document.getElementById('addSectionModal');
      const addSubsectionModal = document.getElementById('addSubsectionModal');
      const renameModal = document.getElementById('renameSectionModal');
      const addLaborModal = document.getElementById('addLaborModal');
      const addLaborDetailsModal = document.getElementById('addLaborDetailsModal');

      if (
        addSectionModal &&
        addSectionModal.classList &&
        !addSectionModal.classList.contains('hidden')
      ) {
        closeAddSectionModal();
      }
      if (
        addSubsectionModal &&
        addSubsectionModal.classList &&
        !addSubsectionModal.classList.contains('hidden')
      ) {
        closeAddSubsectionModal();
      }
      if (renameModal && renameModal.classList && !renameModal.classList.contains('hidden')) {
        closeRenameSectionModal();
      }
      if (addLaborModal && addLaborModal.classList && !addLaborModal.classList.contains('hidden')) {
        closeAddLaborModal();
      }
      if (
        addLaborDetailsModal &&
        addLaborDetailsModal.classList &&
        !addLaborDetailsModal.classList.contains('hidden')
      ) {
        closeAddLaborDetailsModal();
      }
    }
  } catch (error) {
    console.error('Error in keydown handler (modal close):', error);
  }
});

// Estimate Modal Functions
async function openEstimateModal(estimateId, estimateTitle) {
  currentEstimateId = estimateId;
  currentEstimateTitle = estimateTitle;

  const modal = document.getElementById('estimateModal');
  const modalTitle = document.getElementById('estimateModalTitle');
  const modalBody = document.getElementById('estimateModalBody');

  if (modal && modalTitle && modalBody) {
    modalTitle.textContent = estimateTitle || 'Estimate';
    modal.classList.remove('hidden');
    modalBody.innerHTML = '<div class="loading">Loading estimate details...</div>';

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    await loadEstimateDetails(estimateId);
  }
}

function closeEstimateModal() {
  const modal = document.getElementById('estimateModal');
  if (modal) {
    modal.classList.add('hidden');
    currentEstimateId = null;
    currentEstimateTitle = null;

    // Restore body scroll
    document.body.style.overflow = 'auto';
  }
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  try {
    if (e && e.key === 'Escape') {
      const estimateModal = document.getElementById('estimateModal');
      const confirmModal = document.getElementById('confirmDeleteModal');
      if (estimateModal && estimateModal.classList && !estimateModal.classList.contains('hidden')) {
        closeEstimateModal();
      }
      if (confirmModal && confirmModal.classList && !confirmModal.classList.contains('hidden')) {
        closeConfirmDeleteModal();
      }
    }
  } catch (error) {
    console.error('Error in keydown handler (estimate modal close):', error);
  }
});

async function loadEstimateDetails(estimateId) {
  const modalBody = document.getElementById('estimateModalBody');
  if (!modalBody) return;

  try {
    // Fetch estimate basic info
    const estimate = await makeRequest('GET', '/api/v1/estimate/get', null, {estimateId});

    // Fetch estimate sections
    const sections = await makeRequest('GET', '/api/v1/estimate/fetch_sections', null, {
      estimateId,
    });

    let sectionsHtml = '';
    if (sections && Array.isArray(sections) && sections.length > 0) {
      const sectionPromises = sections.map(async (section) => {
        try {
          // Fetch subsections for each section
          const subsections = await makeRequest('GET', '/api/v1/estimate/fetch_subsections', null, {
            estimateSectionId: section._id,
          });

          let subsectionsHtml = '';
          if (subsections && Array.isArray(subsections) && subsections.length > 0) {
            const subsectionPromises = subsections.map(async (subsection) => {
              try {
                // Fetch labor items for each subsection
                const laborItems = await makeRequest(
                  'GET',
                  '/api/v1/estimate/fetch_labor_items',
                  null,
                  {estimateSubsectionId: subsection._id}
                );

                // Use table format for labor items instead of accordion
                // Removed old HTML generation code - now using table format
                const laborItemsTableHtml = renderLaborItemsTable(
                  laborItems,
                  subsection._id,
                  section._id
                );

                // Legacy code for reference - can be removed later
                let laborItemsHtml = '';
                if (false && laborItems && Array.isArray(laborItems) && laborItems.length > 0) {
                  // Fetch material items for each labor item separately if not in response
                  const laborItemPromises = laborItems.map(async (item) => {
                    let materialItemsHtml = '';

                    // Try to use material items from response first
                    if (
                      item.estimateMaterialItemData &&
                      Array.isArray(item.estimateMaterialItemData) &&
                      item.estimateMaterialItemData.length > 0
                    ) {
                      materialItemsHtml = item.estimateMaterialItemData
                        .map((matItem) => {
                          const materialName =
                            matItem.name ||
                            matItem.materialItemName ||
                            matItem.materialOfferItemName ||
                            matItem.estimateMaterialItemData?.[0]?.name ||
                            '-';
                          const materialPrice =
                            matItem.changableAveragePrice ||
                            matItem.averagePrice ||
                            matItem.price ||
                            0;
                          const materialQuantity = matItem.quantity || 0;
                          const materialTotal =
                            matItem.totalCost || materialPrice * materialQuantity;
                          const materialUnit =
                            matItem.measurementUnitRepresentationSymbol || matItem.unit || '';

                          return `
                          <div class="estimate-material-item" style="margin-left: 20px; padding: 8px; background: #f0f0f0; border-radius: 4px; margin-top: 5px; font-size: 13px;">
                            <div><strong>📦 ${escapeHtml(materialName)}</strong></div>
                            ${
                              materialQuantity
                                ? `<div>Quantity: ${materialQuantity} ${escapeHtml(
                                    materialUnit
                                  )}</div>`
                                : ''
                            }
                            ${
                              materialPrice
                                ? `<div>Unit Price: ${materialPrice.toFixed(2)}</div>`
                                : ''
                            }
                            ${materialTotal ? `<div>Total: ${materialTotal.toFixed(2)}</div>` : ''}
                          </div>
                        `;
                        })
                        .join('');
                    } else if (item._id) {
                      // If material items not in response, fetch them separately
                      try {
                        const materialItems = await makeRequest(
                          'GET',
                          '/api/v1/estimate/fetch_material_items',
                          null,
                          {estimatedLaborId: item._id}
                        );
                        if (
                          materialItems &&
                          Array.isArray(materialItems) &&
                          materialItems.length > 0
                        ) {
                          materialItemsHtml = materialItems
                            .map((matItem) => {
                              const materialName =
                                matItem.name ||
                                matItem.materialItemName ||
                                matItem.materialOfferItemName ||
                                matItem.estimateMaterialItemData?.[0]?.name ||
                                '-';
                              const materialPrice =
                                matItem.changableAveragePrice ||
                                matItem.averagePrice ||
                                matItem.price ||
                                0;
                              const materialQuantity = matItem.quantity || 0;
                              const materialTotal =
                                matItem.totalCost || materialPrice * materialQuantity;
                              const materialUnit =
                                matItem.measurementUnitRepresentationSymbol || matItem.unit || '';

                              return `
                              <div class="estimate-material-item" style="margin-left: 20px; padding: 8px; background: #f0f0f0; border-radius: 4px; margin-top: 5px; font-size: 13px;">
                                <div><strong>📦 ${escapeHtml(materialName)}</strong></div>
                                ${
                                  materialQuantity
                                    ? `<div>Quantity: ${materialQuantity} ${escapeHtml(
                                        materialUnit
                                      )}</div>`
                                    : ''
                                }
                                ${
                                  materialPrice
                                    ? `<div>Unit Price: ${materialPrice.toFixed(2)}</div>`
                                    : ''
                                }
                                ${
                                  materialTotal
                                    ? `<div>Total: ${materialTotal.toFixed(2)}</div>`
                                    : ''
                                }
                              </div>
                            `;
                            })
                            .join('');
                        }
                      } catch (err) {
                        console.error('Error fetching material items:', err);
                      }
                    }

                    // Labor item details
                    const laborItemName =
                      item.itemChangableName ||
                      item.itemName ||
                      item.name ||
                      item.laborItemName ||
                      item.estimateLaborItemData?.[0]?.name ||
                      '-';
                    const laborItemCode = item.itemFullCode || item.fullCode || '';
                    const laborQuantity = item.quantity || 0;
                    const laborUnitPrice =
                      item.changableAveragePrice ||
                      item.itemUnitPrice ||
                      item.unitPrice ||
                      item.presentLaborOfferAveragePrice ||
                      0;
                    const laborItemWithoutMaterial =
                      item.itemWithoutMaterial || laborQuantity * laborUnitPrice;
                    const materialTotalCost = item.materialTotalCost || 0;
                    const priceWithMaterial =
                      item.priceWithMaterial ||
                      item.totalCost ||
                      laborItemWithoutMaterial + materialTotalCost;
                    const measurementUnit =
                      item.itemMeasurementUnit || item.measurementUnitRepresentationSymbol || '';

                    return `
                      <div class="estimate-labor-item">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                          <div style="flex: 1;">
                            <div><strong>🔧 ${escapeHtml(laborItemName)}</strong> ${
                      laborItemCode
                        ? `<span style="color: #666; font-size: 12px;">(${escapeHtml(
                            laborItemCode
                          )})</span>`
                        : ''
                    }</div>
                            ${
                              laborQuantity
                                ? `<div style="margin-top: 5px;">Quantity: ${laborQuantity} ${escapeHtml(
                                    measurementUnit
                                  )}</div>`
                                : ''
                            }
                            ${
                              laborUnitPrice
                                ? `<div>Unit Price: ${laborUnitPrice.toFixed(2)}</div>`
                                : ''
                            }
                            ${
                              laborItemWithoutMaterial
                                ? `<div>Labor Cost: ${laborItemWithoutMaterial.toFixed(2)}</div>`
                                : ''
                            }
                            ${
                              materialTotalCost
                                ? `<div>Material Cost: ${materialTotalCost.toFixed(2)}</div>`
                                : ''
                            }
                            ${
                              priceWithMaterial
                                ? `<div style="font-weight: 600; color: #1976d2; margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">Total (with materials): ${priceWithMaterial.toFixed(
                                    2
                                  )}</div>`
                                : ''
                            }
                          </div>
                        </div>
                        ${
                          materialItemsHtml
                            ? `<div style="margin-top: 10px;"><div style="font-weight: 600; margin-bottom: 5px;">📦 Materials:</div>${materialItemsHtml}</div>`
                            : ''
                        }
                      </div>
                    `;
                  });

                  const laborItemResults = await Promise.all(laborItemPromises);
                  laborItemsHtml = laborItemResults.join('');
                } else {
                  laborItemsHtml = '<div style="padding: 10px;">No labor items found</div>';
                }

                return `
                  <div class="subsection-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span>${escapeHtml(subsection.name || '-')}</span>
                      <button class="table-action-icon" onclick="openRenameSubsectionDialog('${
                        subsection._id
                      }', '${escapeHtml(subsection.name || '')}')" title="Edit">
                        ✏️
                      </button>
                      <button class="table-action-icon danger" onclick="removeEstimateSubsection('${
                        subsection._id
                      }', '${escapeHtml(subsection.name || '')}')" title="Remove">
                        🗑️
                      </button>
                    </div>
                    <span class="estimate-cost">${
                      subsection.totalCost ? subsection.totalCost.toFixed(2) : '0.00'
                    }</span>
                  </div>
                  <div style="margin-top: 12px; margin-bottom: 12px; padding-left: 12px;">
                    <button class="btn-small primary" onclick="openAddLaborDialog('${
                      subsection._id
                    }', '${section._id}', '${subsection._id}')" title="Add Labor">
                      👷 Add Labor
                    </button>
                  </div>
                  ${laborItemsTableHtml}
                `;
              } catch (err) {
                console.error('Error loading subsection items:', err);
                return `<div style="padding: 10px; color: red;">Error loading subsection: ${err.message}</div>`;
              }
            });

            const subsectionResults = await Promise.all(subsectionPromises);
            subsectionsHtml = subsectionResults.join('');
          }

          return `
            <div class="section-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>${escapeHtml(section.name || '-')}</span>
                <button class="table-action-icon" onclick="openRenameSectionDialog('${
                  section._id
                }', '${escapeHtml(section.name || '')}')" title="Edit">
                  ✏️
                </button>
                <button class="table-action-icon danger" onclick="removeEstimateSection('${
                  section._id
                }', '${escapeHtml(section.name || '')}')" title="Remove">
                  🗑️
                </button>
              </div>
              <span class="estimate-cost">${
                section.totalCost ? section.totalCost.toFixed(2) : '0.00'
              }</span>
            </div>
            <div style="margin-top: 12px; margin-bottom: 12px; padding-left: 12px; display: flex; gap: 8px;">
              <button class="btn-small primary" onclick="openAddSubsectionDialog('${
                section._id
              }')" title="Add Subsection">
                ➕ Add Subsection
              </button>
              <button class="btn-small primary" onclick="openAddLaborDialog(null, '${
                section._id
              }', null)" title="Add Labor">
                👷 Add Labor
              </button>
            </div>
            ${subsectionsHtml || '<div style="padding: 20px;">No subsections</div>'}
          `;
        } catch (err) {
          console.error('Error loading section:', err);
          return `<div class="alert alert-error">Error loading section: ${err.message}</div>`;
        }
      });

      const sectionResults = await Promise.all(sectionPromises);
      sectionsHtml = sectionResults.join('');
    } else {
      sectionsHtml = '<div class="alert alert-info">No sections found</div>';
    }

    // Construction type options (matching production)
    const constructionTypes = [
      {id: 'currentRenovation', label: 'Current Renovation'},
      {id: 'renovation', label: 'Renovation'},
      {id: 'majorRepairs', label: 'Major repairs'},
      {id: 'reconstruction', label: 'Reconstruction'},
      {id: 'reinforcement', label: 'Reinforcement'},
      {id: 'restorationWork', label: 'Restoration Work'},
      {id: 'construction', label: 'Construction'},
    ];

    // Build modal content
    modalBody.innerHTML = `
      <!-- Estimate Info -->
      <div class="estimate-accordion">
        <div class="estimate-accordion-header" onclick="toggleEstimateAccordion(this)">
          <span>Estimate Information</span>
        </div>
        <div class="estimate-accordion-content expanded">
          <div class="estimate-info-form">
            <div class="form-field">
              <label>Name (Title)</label>
              <input 
                type="text" 
                class="editable-cell" 
                value="${escapeHtml(estimate.name || '')}" 
                data-field="name"
                onblur="updateEstimateField('name', this.value)"
                placeholder="Title"
                style="width: 100%;"
              />
            </div>
            <div class="form-field">
              <label>Estimate Number</label>
              <div class="value readonly-cell">${escapeHtml(estimate.estimateNumber || '-')}</div>
            </div>
            <div class="form-field">
              <label>Address</label>
              <input 
                type="text" 
                class="editable-cell" 
                value="${escapeHtml(estimate.address || '')}" 
                data-field="address"
                onblur="updateEstimateField('address', this.value)"
                placeholder="Address"
                style="width: 100%;"
              />
            </div>
            <div class="form-field">
              <label>Construction Type</label>
              <select 
                class="editable-cell" 
                data-field="constructionType"
                onchange="updateEstimateField('constructionType', this.value)"
                style="width: 100%;"
              >
                <option value="">Select Construction Type</option>
                ${constructionTypes
                  .map(
                    (type) => `
                  <option value="${type.id}" ${
                      estimate.constructionType === type.id ? 'selected' : ''
                    }>${escapeHtml(type.label)}</option>
                `
                  )
                  .join('')}
              </select>
            </div>
            <div class="form-field">
              <label>Building Type</label>
              <input 
                type="text" 
                class="editable-cell" 
                value="${escapeHtml(estimate.buildingType || '')}" 
                data-field="buildingType"
                onblur="updateEstimateField('buildingType', this.value)"
                placeholder="Type of building"
                style="width: 100%;"
              />
            </div>
            <div class="form-field">
              <label>Construction Surface</label>
              <input 
                type="text" 
                class="editable-cell" 
                value="${escapeHtml(estimate.constructionSurface || '')}" 
                data-field="constructionSurface"
                onblur="updateEstimateField('constructionSurface', this.value)"
                placeholder="Construction surface"
                style="width: 100%;"
              />
            </div>
            <div class="form-field">
              <label>Total Cost</label>
              <div class="value readonly-cell">${
                estimate.totalCostWithOtherExpenses || estimate.totalCost
                  ? (estimate.totalCostWithOtherExpenses || estimate.totalCost).toFixed(2)
                  : '0.00'
              }</div>
            </div>
            <div class="form-field">
              <label>Created At</label>
              <div class="value readonly-cell">${
                estimate.createdAt ? new Date(estimate.createdAt).toLocaleDateString() : '-'
              }</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estimate Sections -->
      <div style="margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #ddd;">
          <h3 style="margin: 0;">Estimate Sections</h3>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" onclick="handleFetchMarketPrices()" title="Fetch Market Prices">
              📊 Market Prices
            </button>
            <button class="btn btn-primary" onclick="openAddSectionDialog()" title="Add Section">
              ➕ Add Section
            </button>
          </div>
        </div>
        ${sectionsHtml}
      </div>

      <!-- Other Expenses -->
      ${
        estimate.otherExpenses &&
        Array.isArray(estimate.otherExpenses) &&
        estimate.otherExpenses.length > 0
          ? `
        <div class="estimate-accordion">
          <div class="estimate-accordion-header" onclick="toggleEstimateAccordion(this)">
            <span>Other Expenses</span>
          </div>
          <div class="estimate-accordion-content">
            <div class="estimate-info-form">
              ${estimate.otherExpenses
                .map((expense, index) => {
                  const expenseKey = Object.keys(expense)[0];
                  const expenseValue = expense[expenseKey];

                  // Skip typeOfCost with value 0
                  if (expenseKey === 'typeOfCost' && expenseValue === 0) {
                    return '';
                  }

                  let expenseName = expenseKey;
                  // Try to map expense keys to readable names
                  const expenseNames = {
                    overhead: 'Overhead',
                    profit: 'Profit',
                    transport: 'Transport',
                    installation: 'Installation',
                    typeOfCost: 'Type of Cost',
                  };
                  expenseName = expenseNames[expenseKey] || expenseKey;

                  const percentageCalc =
                    expenseValue && estimate.totalCost
                      ? ((expenseValue * estimate.totalCost) / 100).toFixed(2)
                      : '0.00';

                  return `
                  <div class="form-field">
                    <label>${escapeHtml(expenseName)}</label>
                    <div class="value">
                      ${expenseValue ? `${expenseValue}% (${percentageCalc})` : '0%'}
                    </div>
                  </div>
                `;
                })
                .filter((html) => html)
                .join('')}
            </div>
          </div>
        </div>
      `
          : ''
      }
    `;
  } catch (error) {
    console.error('Error loading estimate details:', error);
    modalBody.innerHTML = `<div class="alert alert-error">Error loading estimate details: ${error.message}</div>`;
  }
}

function toggleEstimateAccordion(header) {
  event.stopPropagation();
  const content = header.nextElementSibling;
  if (!content) return;

  const isExpanded = content.classList.contains('expanded');

  if (isExpanded) {
    content.classList.remove('expanded');
    content.style.display = 'none';
  } else {
    content.classList.add('expanded');
    content.style.display = 'block';
  }
}

function printEstimate() {
  if (!currentEstimateId) {
    showAlert('No estimate selected', 'error', 'dashboardAlert');
    return;
  }
  const printUrl = `${getBackendUrl()}/api/v1/estimate/generate_html?estimateId=${currentEstimateId}`;
  window.open(printUrl, '_blank');
}

function confirmDeleteEstimateDialog(estimateId) {
  deleteEstimateId = estimateId;
  const modal = document.getElementById('confirmDeleteModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeConfirmDeleteModal() {
  deleteEstimateId = null;
  const modal = document.getElementById('confirmDeleteModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
}

async function confirmDeleteEstimate() {
  if (!deleteEstimateId) return;

  try {
    // Delete endpoint expects estimateId as query parameter (requireQueryParam checks both query and body)
    await makeRequest('POST', '/api/v1/estimate/delete', null, {
      estimateId: deleteEstimateId,
    });
    closeConfirmDeleteModal();
    loadEstimates(); // Reload estimates list
    showAlert('✅ Estimate deleted successfully', 'success', 'dashboardAlert');
  } catch (error) {
    console.error('Error deleting estimate:', error);
    showAlert(`❌ Error deleting estimate: ${error.message}`, 'error', 'dashboardAlert');
  }
}

function openCreateEstimateDialog() {
  showAlert('Create Estimate functionality coming soon', 'info');
}

// Helper function to render labor items table
function renderLaborItemsTable(laborItems, subsectionId, sectionId) {
  if (!laborItems || !Array.isArray(laborItems) || laborItems.length === 0) {
    return '<div style="padding: 20px; text-align: center; color: #999;">No labor items found</div>';
  }

  const tableRows = laborItems
    .map((item, index) => {
      const laborItemId = item._id;
      const laborItemName =
        item.itemChangableName ||
        item.laborOfferItemName ||
        item.itemName ||
        item.name ||
        item.laborItemName ||
        item.estimateLaborItemData?.[0]?.name ||
        '-';
      // Use fullCode from estimateLaborItemData lookup (like production - EstimateLaborItemDisplayData)
      const laborItemCode =
        item.estimateLaborItemData?.[0]?.fullCode || item.itemFullCode || item.fullCode || '-';
      const laborHours = item.itemLaborHours || item.laborHours || 0;
      const measurementUnit =
        item.itemMeasurementUnit ||
        item.estimateMeasurementUnitData?.[0]?.representationSymbol ||
        item.measurementUnitRepresentationSymbol ||
        '';
      const quantity = item.quantity || 0;
      const price =
        item.changableAveragePrice ||
        item.itemChangableAveragePrice ||
        item.itemUnitPrice ||
        item.unitPrice ||
        item.presentLaborOfferAveragePrice ||
        item.presentItemOfferAveragePrice ||
        0;
      const itemWithoutMaterial = item.itemWithoutMaterial || quantity * price;
      const materialTotalCost = item.materialTotalCost || 0;
      const priceWithMaterial =
        item.priceWithMaterial || item.totalCost || itemWithoutMaterial + materialTotalCost;
      const unitPrice =
        item.itemUnitPrice ||
        item.estimateLaborOffersData?.[0]?.price ||
        item.laborOfferData?.[0]?.price ||
        price;

      return `
        <tr data-labor-item-id="${laborItemId}" data-index="${index}">
          <td>
            <button class="table-action-btn" onclick="openLaborItemView('${laborItemId}', '${escapeHtml(
        laborItemName
      )}')" title="View Details">
              ${escapeHtml(laborItemCode || '-')}
            </button>
          </td>
          <td>
            <input 
              type="text" 
              class="editable-cell" 
              value="${escapeHtml(laborItemName)}" 
              data-field="itemChangableName"
              data-labor-item-id="${laborItemId}"
              onblur="updateLaborItemField('${laborItemId}', 'itemChangableName', this.value)"
              style="width: 100%;"
            />
          </td>
          <td>
            <input 
              type="number" 
              step="0.01"
              class="editable-cell" 
              value="${laborHours}" 
              data-field="itemLaborHours"
              data-labor-item-id="${laborItemId}"
              onblur="updateLaborItemField('${laborItemId}', 'itemLaborHours', this.value)"
              style="width: 80px;"
            />
          </td>
          <td class="readonly-cell">${escapeHtml(measurementUnit)}</td>
          <td>
            <input 
              type="number" 
              step="0.01"
              class="editable-cell" 
              value="${quantity}" 
              data-field="quantity"
              data-labor-item-id="${laborItemId}"
              onblur="updateLaborItemField('${laborItemId}', 'quantity', this.value)"
              style="width: 100px;"
            />
          </td>
          <td>
            <input 
              type="number" 
              step="0.01"
              class="editable-cell" 
              value="${price}" 
              data-field="itemChangableAveragePrice"
              data-labor-item-id="${laborItemId}"
              onblur="updateLaborItemField('${laborItemId}', 'itemChangableAveragePrice', this.value)"
              style="width: 100px;"
            />
          </td>
          <td class="readonly-cell">${itemWithoutMaterial.toFixed(2)}</td>
          <td class="readonly-cell">${materialTotalCost.toFixed(2)}</td>
          <td class="readonly-cell">${priceWithMaterial.toFixed(2)}</td>
          <td class="readonly-cell">${unitPrice.toFixed(2)}</td>
          <td>
            <button class="table-action-icon" onclick="openMaterialsDialog('${laborItemId}', '${escapeHtml(
        laborItemName
      )}')" title="View Materials">
              📦
            </button>
          </td>
          <td>
            <div class="table-row-actions">
              <button class="table-action-icon" onclick="editLaborItem('${laborItemId}', '${escapeHtml(
        laborItemName
      )}')" title="Edit">
                ✏️
              </button>
              <button class="table-action-icon danger" onclick="removeLaborItem('${laborItemId}', '${escapeHtml(
        laborItemName
      )}')" title="Remove">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="table-wrapper">
      <div class="filter-bar">
        <input 
          type="text" 
          class="filter-input" 
          placeholder="Filter labor items..." 
          onkeyup="filterLaborItems(this.value, '${subsectionId}')"
        />
      </div>
      <table class="estimate-table" id="labor-items-table-${subsectionId}">
        <thead>
          <tr>
            <th class="sortable-header" onclick="sortTable('labor-items-table-${subsectionId}', 0)">ID <span class="sort-indicator">↕</span></th>
            <th class="sortable-header" onclick="sortTable('labor-items-table-${subsectionId}', 1)">Labor <span class="sort-indicator">↕</span></th>
            <th class="sortable-header" onclick="sortTable('labor-items-table-${subsectionId}', 2)">Work per hour <span class="sort-indicator">↕</span></th>
            <th>Unit</th>
            <th class="sortable-header" onclick="sortTable('labor-items-table-${subsectionId}', 4)">Quantity <span class="sort-indicator">↕</span></th>
            <th class="sortable-header" onclick="sortTable('labor-items-table-${subsectionId}', 5)">Price <span class="sort-indicator">↕</span></th>
            <th class="sortable-header" onclick="sortTable('labor-items-table-${subsectionId}', 6)">Without material <span class="sort-indicator">↕</span></th>
            <th class="sortable-header" onclick="sortTable('labor-items-table-${subsectionId}', 7)">Material Cost <span class="sort-indicator">↕</span></th>
            <th class="sortable-header" onclick="sortTable('labor-items-table-${subsectionId}', 8)">Price with material <span class="sort-indicator">↕</span></th>
            <th class="sortable-header" onclick="sortTable('labor-items-table-${subsectionId}', 9)">Unit Price <span class="sort-indicator">↕</span></th>
            <th>Materials</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
}

// Update estimate field
let updateEstimateTimeout = null;
let lastEstimateFieldUpdate = {};
async function updateEstimateField(fieldKey, fieldValue) {
  if (updateEstimateTimeout) {
    clearTimeout(updateEstimateTimeout);
  }

  // Check if value actually changed
  if (lastEstimateFieldUpdate[fieldKey] === fieldValue) {
    return;
  }
  lastEstimateFieldUpdate[fieldKey] = fieldValue;

  updateEstimateTimeout = setTimeout(async () => {
    if (!currentEstimateId || !fieldKey || fieldValue === undefined) {
      return;
    }

    try {
      await makeRequest('POST', '/api/v1/estimate/rename', null, {
        estimateId: currentEstimateId,
        fieldKey: fieldKey,
        fieldValue: fieldValue || '',
      });

      // Reload estimate details to reflect changes
      if (currentEstimateId) {
        await loadEstimateDetails(currentEstimateId);
      }
    } catch (error) {
      console.error('Error updating estimate field:', error);
      showAlert(`Error updating field: ${error.message}`, 'error', 'dashboardAlert');
      // Reload to revert changes
      if (currentEstimateId) {
        await loadEstimateDetails(currentEstimateId);
      }
    }
  }, 500); // Debounce 500ms
}

// Update labor item field
let updateLaborItemTimeout = null;
async function updateLaborItemField(laborItemId, field, value) {
  if (updateLaborItemTimeout) {
    clearTimeout(updateLaborItemTimeout);
  }

  updateLaborItemTimeout = setTimeout(async () => {
    try {
      const updateData = {};
      updateData[field] = value;

      await makeRequest('POST', '/api/v1/estimate/update_labor_item', updateData, {
        estimatedLaborId: laborItemId,
      });

      // Reload the estimate details to reflect changes
      if (currentEstimateId) {
        await loadEstimateDetails(currentEstimateId);
      }
    } catch (error) {
      console.error('Error updating labor item:', error);
      showAlert(`Error updating field: ${error.message}`, 'error', 'dashboardAlert');
      // Reload to revert changes
      if (currentEstimateId) {
        await loadEstimateDetails(currentEstimateId);
      }
    }
  }, 500); // Debounce 500ms
}

// Filter labor items
function filterLaborItems(searchValue, subsectionId) {
  const table = document.getElementById(`labor-items-table-${subsectionId}`);
  if (!table) return;

  const rows = table.querySelectorAll('tbody tr');
  const searchLower = searchValue.toLowerCase();

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchLower) ? '' : 'none';
  });
}

// Sort table
let sortDirections = {};
function sortTable(tableId, columnIndex) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));

  const direction = sortDirections[`${tableId}-${columnIndex}`] || 'asc';
  sortDirections[`${tableId}-${columnIndex}`] = direction === 'asc' ? 'desc' : 'asc';

  rows.sort((a, b) => {
    const aCell = a.cells[columnIndex];
    const bCell = b.cells[columnIndex];

    if (!aCell || !bCell) return 0;

    const aText = aCell.textContent.trim();
    const bText = bCell.textContent.trim();

    // Try to parse as number
    const aNum = parseFloat(aText);
    const bNum = parseFloat(bText);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return direction === 'asc' ? aNum - bNum : bNum - aNum;
    }

    // String comparison
    if (direction === 'asc') {
      return aText.localeCompare(bText);
    } else {
      return bText.localeCompare(aText);
    }
  });

  rows.forEach((row) => tbody.appendChild(row));
}


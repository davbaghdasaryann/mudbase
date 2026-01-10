function showAccountsTab(tab) {
  // Hide all tabs and tab panes in accounts page
  document.querySelectorAll('#page-accounts .tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('#page-accounts .tab-pane').forEach((p) => {
    p.classList.add('hidden');
    p.style.display = 'none';
  });

  // Show selected tab and tab pane
  const tabButton = document.getElementById(`tab-accounts-${tab}`);
  const tabPane = document.getElementById(`tab-content-accounts-${tab}`);

  if (tabButton) tabButton.classList.add('active');
  if (tabPane) {
    tabPane.classList.remove('hidden');
    tabPane.style.display = 'block';
  }

  if (tab === 'active') {
    loadAccounts('active');
  } else {
    loadAccounts('inactive');
  }
}

async function loadAccounts(type = 'active', searchVal = null) {
  const containerId = type === 'active' ? 'accountsTable' : 'inactiveAccountsTable';
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading">Loading accounts...</div>';

    const endpoint = type === 'active' ? 'accounts/fetch_active' : 'accounts/fetch_inactive';
    const queryParams = {};
    if (searchVal) queryParams.search = searchVal;

    const response = await makeRequest('GET', `/api/v1/${endpoint}`, null, queryParams);
    const accounts = Array.isArray(response) ? response : [];

    if (accounts.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No accounts found</div>';
      return;
    }

    container.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Company Name</th>
            <th>TIN</th>
            <th>Phone</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          ${accounts
            .map(
              (account) => `
            <tr>
              <td>${escapeHtml(account.companyName || '-')}</td>
              <td>${escapeHtml(account.companyTin || '-')}</td>
              <td>${escapeHtml(account.phoneNumber || '-')}</td>
              <td>${escapeHtml(account.email || '-')}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error loading accounts:', error);
    container.innerHTML = `<div class="alert alert-error">Error loading accounts: ${error.message}</div>`;
  }
}

function searchAccounts() {
  const searchVal = document.getElementById('accountsSearch')?.value || '';
  loadAccounts('active', searchVal || null);
}

function searchInactiveAccounts() {
  const searchVal = document.getElementById('inactiveAccountsSearch')?.value || '';
  loadAccounts('inactive', searchVal || null);
}


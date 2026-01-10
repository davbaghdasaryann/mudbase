function showPage(page) {
  // Hide all pages and ensure they're hidden
  document.querySelectorAll('.page').forEach((p) => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  // Show selected page
  const targetPage = document.getElementById(`page-${page}`);
  if (targetPage) {
    targetPage.classList.add('active');
    targetPage.style.display = 'block';
  }

  // Update nav items
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
  document.getElementById(`nav-${page}`).classList.add('active');

  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    account: 'My Account',
    accounts: 'Accounts',
    catalog: 'Catalogs',
    estimates: 'Estimates',
    users: 'Users',
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  // Load page data if needed
  if (page === 'dashboard') {
    loadDashboard();
  } else if (page === 'account') {
    loadAccountData();
  } else if (page === 'accounts') {
    loadAccounts('active');
  } else if (page === 'catalog') {
    loadCatalog('labor');
  } else if (page === 'estimates') {
    showEstimatesTab('my');
  } else if (page === 'users') {
    loadUsers();
  }
}

// Tabs (for account page tabs)
function showTab(tab) {
  console.log('showTab called with:', tab);
  // Hide all tab panes in the account page by adding hidden class and setting display
  document.querySelectorAll('#page-account .tab-pane').forEach((p) => {
    p.classList.add('hidden');
    p.style.display = 'none';
  });
  // Show selected tab pane by removing hidden class and setting display
  const targetPane = document.getElementById(`tab-content-${tab}`);
  if (targetPane) {
    targetPane.classList.remove('hidden');
    targetPane.style.display = 'block';
    console.log('Showing tab-pane:', targetPane.id, 'Classes:', targetPane.className);
  } else {
    console.error('Tab pane not found:', `tab-content-${tab}`);
  }

  // Update tab buttons in the account page
  document.querySelectorAll('#page-account .tab').forEach((t) => t.classList.remove('active'));
  const targetTab = document.getElementById(`tab-${tab}`);
  if (targetTab) {
    targetTab.classList.add('active');
  }
}

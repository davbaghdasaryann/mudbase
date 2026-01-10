// Load Account Data
async function loadAccountData() {
  if (!isAuthenticated) {
    const accountInfo = document.getElementById('accountInfo');
    if (accountInfo) {
      accountInfo.innerHTML =
        '<div class="alert alert-error">Please sign in to view account information</div>';
    }
    return;
  }

  const accountInfo = document.getElementById('accountInfo');
  if (!accountInfo) {
    console.error('Account info element not found');
    return;
  }

  accountInfo.innerHTML = '<div class="loading">Loading account information...</div>';

  try {
    const response = await fetch(`${getBackendUrl()}/api/v1/profile/get_account`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      accountInfo.innerHTML = `<div class="alert alert-error">Failed to load account (${response.status}): ${errorText}</div>`;
      return;
    }

    accountData = await response.json();
    console.log('Account data:', accountData);
    console.log('Account data keys:', Object.keys(accountData));

    if (accountData && Object.keys(accountData).length > 0) {
      await renderAccountInfo();
    } else {
      accountInfo.innerHTML =
        '<div class="alert alert-error">No account data received. Response: ' +
        JSON.stringify(accountData) +
        '</div>';
    }
  } catch (error) {
    console.error('Error loading account data:', error);
    accountInfo.innerHTML = `<div class="alert alert-error">Error loading account information: ${error.message}</div>`;
  }
}

async function renderAccountInfo() {
  if (!accountData) {
    console.error('No account data to render');
    return;
  }

  console.log('Rendering account info:', accountData);
  console.log('Account data keys:', Object.keys(accountData));

  // First, ensure main app is visible
  const mainApp = document.getElementById('mainApp');
  if (mainApp && mainApp.classList.contains('hidden')) {
    console.log('Main app is hidden, showing it...');
    mainApp.classList.remove('hidden');
  }

  // Ensure we're on the account page
  const accountPage = document.getElementById('page-account');
  if (!accountPage) {
    console.error('❌ Account page element not found!');
    return;
  }

  // Force account page to be visible
  accountPage.classList.add('active');
  accountPage.style.display = 'block';
  document.querySelectorAll('.page').forEach((p) => {
    if (p !== accountPage) {
      p.classList.remove('active');
      p.style.display = 'none';
    }
  });

  console.log('Account page is active?', accountPage.classList.contains('active'));
  console.log('Account page computed display:', window.getComputedStyle(accountPage).display);

  // Ensure the aboutCompany tab is visible when rendering
  const tabContent = document.getElementById('tab-content-aboutCompany');
  if (!tabContent) {
    console.error('❌ tab-content-aboutCompany element not found!');
    return;
  }

  // Explicitly show the tab
  showTab('aboutCompany');

  // Force visibility with multiple methods
  tabContent.classList.remove('hidden');
  tabContent.style.display = 'block';
  tabContent.style.visibility = 'visible';
  tabContent.style.opacity = '1';

  // Ensure parent is visible too
  const tabContentParent = tabContent.parentElement;
  if (tabContentParent) {
    tabContentParent.style.display = 'block';
    tabContentParent.style.visibility = 'visible';
  }

  console.log('Tab content visibility ensured:');
  console.log('  - Hidden class?', tabContent.classList.contains('hidden'));
  console.log('  - Style display:', tabContent.style.display);
  console.log('  - Computed display:', window.getComputedStyle(tabContent).display);
  console.log('  - Offset parent (visible)?', tabContent.offsetParent !== null);

  // Update company header (these should always exist)
  const companyNameEl = document.getElementById('companyName');
  const companyLogoEl = document.getElementById('companyLogo');
  if (companyNameEl) {
    companyNameEl.textContent = accountData.companyName || 'No Company Name';
    console.log('Updated company name:', accountData.companyName);
  } else {
    console.error('companyName element not found!');
  }
  if (companyLogoEl && accountData.companyName) {
    companyLogoEl.textContent = accountData.companyName.charAt(0).toUpperCase();
  }

  // Wait a moment to ensure DOM is ready
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Render account form - find the element directly
  let accountInfo = document.getElementById('accountInfo');
  if (!accountInfo) {
    console.error('Account info element not found, creating it...');
    accountInfo = document.createElement('div');
    accountInfo.id = 'accountInfo';
    accountInfo.style.display = 'block';
    accountInfo.style.visibility = 'visible';
    tabContent.innerHTML = '';
    tabContent.appendChild(accountInfo);
  }

  // Force visibility on accountInfo element
  accountInfo.style.display = 'block';
  accountInfo.style.visibility = 'visible';
  accountInfo.style.opacity = '1';

  console.log('Found accountInfo element:', accountInfo);
  console.log('AccountInfo parent:', accountInfo.parentElement?.id);
  console.log('AccountInfo is in DOM?', document.body.contains(accountInfo));
  console.log('Tab content classes:', tabContent.className);
  console.log('Tab content is hidden?', tabContent.classList.contains('hidden'));
  console.log('Tab content display:', window.getComputedStyle(tabContent).display);

  // Test with simple HTML first
  accountInfo.innerHTML =
    '<div style="background: #4CAF50; color: white; padding: 20px; margin: 20px; border-radius: 8px; font-size: 18px;">✅ TEST: Element is working! Data received. Rendering now...</div>';
  await new Promise((resolve) => setTimeout(resolve, 200));
  console.log('Test HTML set. AccountInfo innerHTML length:', accountInfo.innerHTML.length);
  console.log('AccountInfo visible?', accountInfo.offsetParent !== null);

  // Format account activity
  let activityDisplay = '-';
  if (accountData.accountActivity) {
    if (Array.isArray(accountData.accountActivity)) {
      activityDisplay = accountData.accountActivity.join(', ');
    } else if (typeof accountData.accountActivity === 'string') {
      activityDisplay = accountData.accountActivity;
    }
  }

  // Escape all values for safety - handle null/undefined
  const safeWebsite = accountData.website ? escapeHtml(String(accountData.website)) : '';
  const safeCompanyName = escapeHtml(String(accountData.companyName || '-'));
  const safeEstablishedAt = escapeHtml(String(accountData.establishedAt || '-'));
  const safePhoneNumber = escapeHtml(String(accountData.phoneNumber || '-'));
  const safeCompanyTin = escapeHtml(String(accountData.companyTin || '-'));
  const safeEmail = escapeHtml(String(accountData.email || '-'));
  const safeAddress = escapeHtml(String(accountData.address || '-'));
  const safeLawAddress = escapeHtml(String(accountData.lawAddress || '-'));
  const safeDirector = escapeHtml(String(accountData.director || '-'));
  const safeCompanyInfo = escapeHtml(String(accountData.companyInfo || '-'));
  const safeActivityDisplay = escapeHtml(String(activityDisplay));

  console.log('About to set innerHTML for accountInfo...');
  console.log('AccountInfo element exists?', !!accountInfo);
  console.log('AccountInfo element parent:', accountInfo.parentElement?.id);

  const htmlContent = `
    <div class="form-row">
      <div class="form-field">
        <label>Company Name</label>
        <div class="value">${safeCompanyName}</div>
      </div>
      <div class="form-field">
        <label>Establish Date</label>
        <div class="value">${safeEstablishedAt}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-field">
        <label>Phone Number</label>
        <div class="value">${safePhoneNumber}</div>
      </div>
      <div class="form-field">
        <label>TIN</label>
        <div class="value">${safeCompanyTin}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-field">
        <label>Activity</label>
        <div class="value">${safeActivityDisplay}</div>
      </div>
      <div class="form-field">
        <label>Email</label>
        <div class="value">${safeEmail}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-field">
        <label>Address</label>
        <div class="value">${safeAddress}</div>
      </div>
      <div class="form-field">
        <label>Legal Address</label>
        <div class="value">${safeLawAddress}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-field">
        <label>Website</label>
        <div class="value">${
          safeWebsite
            ? `<a href="${safeWebsite}" target="_blank" rel="noopener noreferrer">${safeWebsite}</a>`
            : '-'
        }</div>
      </div>
      <div class="form-field">
        <label>Director</label>
        <div class="value">${safeDirector}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-field full-width">
        <label>About Company</label>
        <div class="value">${safeCompanyInfo}</div>
      </div>
    </div>
  `;

  // Set the innerHTML with better error handling
  try {
    console.log('Setting innerHTML, content length:', htmlContent.length);

    // First, set a simple test to verify element works
    accountInfo.innerHTML =
      '<div style="background: #4CAF50; color: white; padding: 20px; margin: 20px; border-radius: 8px; font-size: 18px; font-weight: bold;">✅ TEST: Element is working! Rendering account data...</div>';
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log('Test HTML set. Element visible?', accountInfo.offsetParent !== null);
    console.log('Test HTML length:', accountInfo.innerHTML.length);

    // Now set the real content
    accountInfo.innerHTML = htmlContent;

    console.log('✅ innerHTML set successfully!');
    console.log('Content length:', accountInfo.innerHTML.length);
    console.log('First 500 chars:', accountInfo.innerHTML.substring(0, 500));

    // Force visibility one more time after setting content
    tabContent.style.display = 'block';
    tabContent.style.visibility = 'visible';
    accountInfo.style.display = 'block';
    accountInfo.style.visibility = 'visible';

    // Verify content is there
    if (
      !accountInfo.innerHTML ||
      accountInfo.innerHTML.length === 0 ||
      (accountInfo.innerHTML.trim && accountInfo.innerHTML.trim() === '')
    ) {
      console.error('❌ innerHTML is empty after setting! This should not happen.');
      accountInfo.innerHTML =
        '<div class="alert alert-error">Error: Content was cleared. This is a bug.</div>';
      return;
    }

    // Check visibility one more time
    setTimeout(() => {
      const computedDisplay = window.getComputedStyle(accountInfo).display;
      const isVisible = accountInfo.offsetParent !== null;
      console.log('After delay - AccountInfo display:', computedDisplay);
      console.log('After delay - AccountInfo visible?', isVisible);
      console.log('After delay - Content length:', accountInfo.innerHTML.length);

      if (!isVisible && accountInfo.innerHTML && accountInfo.innerHTML.length > 0) {
        console.error('❌ Content is set but element is not visible!');
        console.error('Forcing visibility with inline styles...');
        accountInfo.setAttribute(
          'style',
          'display: block !important; visibility: visible !important; opacity: 1 !important; min-height: 100px; background: white;'
        );
        tabContent.setAttribute(
          'style',
          'display: block !important; visibility: visible !important;'
        );
      }
    }, 500);
  } catch (err) {
    console.error('❌ Error setting innerHTML:', err);
    console.error('Error details:', err.message);
    console.error('Error stack:', err.stack);
    accountInfo.innerHTML = `<div class="alert alert-error">Error rendering HTML: ${
      err.message
    }<br>Stack: ${err.stack?.substring(0, 200)}</div>`;
    return;
  }

  // Force all parent containers to be visible
  const contentDiv = document.querySelector('.content');
  if (contentDiv) {
    contentDiv.style.display = 'block';
    contentDiv.style.visibility = 'visible';
  }

  // Ensure tab content container is visible
  const tabContentContainer = document.querySelector('.tab-content');
  if (tabContentContainer) {
    tabContentContainer.style.display = 'block';
    tabContentContainer.style.visibility = 'visible';
  }

  // Force visibility on all elements in the chain
  accountPage.style.display = 'block';
  accountPage.style.visibility = 'visible';
  tabContentContainer.style.display = 'block';
  tabContent.style.display = 'block';
  tabContent.style.visibility = 'visible';
  accountInfo.style.display = 'block';
  accountInfo.style.visibility = 'visible';

  // Remove hidden class from everything
  accountPage.classList.remove('hidden');
  tabContent.classList.remove('hidden');

  // Verify visibility
  console.log('Final visibility check:');
  console.log('  - Account page display:', window.getComputedStyle(accountPage).display);
  console.log('  - Tab content display:', window.getComputedStyle(tabContent).display);
  console.log('  - AccountInfo display:', window.getComputedStyle(accountInfo).display);
  console.log('  - AccountInfo has content?', accountInfo.innerHTML.length > 0);
  console.log('  - AccountInfo visible (offsetParent)?', accountInfo.offsetParent !== null);
}

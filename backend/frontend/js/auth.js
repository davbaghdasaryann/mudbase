async function checkSession() {
  try {
    const response = await fetch(`${getBackendUrl()}/api/auth/session`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await response.json();

    if (data && data.user) {
      currentUser = data.user;
      isAuthenticated = true;
      // Parse permissions from comma-separated string to array
      if (data.user.permissions) {
        userPermissions = data.user.permissions.split(',').map((p) => p.trim());
      } else {
        userPermissions = [];
      }
      showMainApp();
      updateUserInfo();
      // Load data for the active page
      setTimeout(() => {
        const activePage = document.querySelector('.page.active');
        if (activePage) {
          const pageId = activePage.id.replace('page-', '');
          if (pageId === 'dashboard') {
            loadDashboard();
          } else if (pageId === 'account') {
            loadAccountData();
          } else if (pageId === 'accounts') {
            loadAccounts('active');
          } else if (pageId === 'catalog') {
            loadCatalog('labor');
          } else if (pageId === 'estimates') {
            showEstimatesTab('my');
          } else if (pageId === 'users') {
            loadUsers();
          }
        } else {
          // Default to account page
          loadAccountData();
        }
      }, 100);
    } else {
      isAuthenticated = false;
      showLogin();
    }
  } catch (error) {
    console.error('Session check error:', error);
    isAuthenticated = false;
    currentUser = null;
    userPermissions = null;
    showLogin();
  }
}

function showMainApp() {
  const loginPage = document.getElementById('loginPage');
  const mainApp = document.getElementById('mainApp');
  if (loginPage) loginPage.style.display = 'none';
  if (mainApp) {
    mainApp.classList.remove('hidden');
    mainApp.style.display = 'flex';
    mainApp.style.visibility = 'visible';
    // Ensure content area is visible
    const contentDiv = mainApp.querySelector('.content');
    if (contentDiv) {
      contentDiv.style.display = 'block';
      contentDiv.style.visibility = 'visible';
    }
  }
}

function showLogin() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('mainApp').classList.add('hidden');
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const loginBtn = document.getElementById('loginBtn');

  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';

  try {
    // Get CSRF token
    const csrfResponse = await fetch(`${getBackendUrl()}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    });
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;

    const formData = new URLSearchParams();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('csrfToken', csrfToken);
    formData.append('redirect', 'false');
    formData.append('json', 'true');

    const response = await fetch(`${getBackendUrl()}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      credentials: 'include',
      redirect: 'manual',
      body: formData.toString(),
    });

    // Handle redirect
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('Location');
      if (
        redirectUrl &&
        (redirectUrl.includes('_redirect_dummy') || redirectUrl.includes('_redirect_signin'))
      ) {
        const redirectPath = new URL(redirectUrl).pathname + new URL(redirectUrl).search;
        await fetch(`${getBackendUrl()}${redirectPath}`, {
          method: 'GET',
          credentials: 'include',
        });
      }
      await checkSession();
      if (isAuthenticated) {
        showAlert('✅ Sign in successful!', 'success', 'loginAlert');
        return;
      }
    }

    // Handle JSON response
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    let data = {};
    if (text && contentType && contentType.includes('application/json')) {
      data = JSON.parse(text);
    }

    if (response.ok || response.status === 200) {
      await checkSession();
      if (isAuthenticated) {
        showAlert('✅ Sign in successful!', 'success', 'loginAlert');
      }
    } else {
      showAlert(
        `❌ Sign in failed: ${data.error || data.message || 'Unknown error'}`,
        'error',
        'loginAlert'
      );
    }
  } catch (error) {
    showAlert(`❌ Sign in error: ${error.message}`, 'error', 'loginAlert');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
}

async function handleSignOut() {
  try {
    const csrfResponse = await fetch(`${getBackendUrl()}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    });
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;

    const formData = new URLSearchParams();
    formData.append('csrfToken', csrfToken);

    await fetch(`${getBackendUrl()}/api/auth/signout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'manual',
      body: formData.toString(),
    });

    isAuthenticated = false;
    currentUser = null;
    accountData = null;
    userPermissions = null;
    showLogin();
    showAlert('✅ Signed out successfully', 'success', 'loginAlert');
  } catch (error) {
    console.error('Sign out error:', error);
    isAuthenticated = false;
    currentUser = null;
    accountData = null;
    showLogin();
  }
}

function updateUserInfo() {
  const userInfo = document.getElementById('userInfo');
  if (currentUser) {
    userInfo.textContent = `👤 ${currentUser.email || currentUser.name || 'User'}`;
  } else {
    userInfo.textContent = 'Not authenticated';
  }
}


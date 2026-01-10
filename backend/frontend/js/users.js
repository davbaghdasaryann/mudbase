async function loadUsers(searchVal = '') {
  const container = document.getElementById('usersTable');
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading">Loading users...</div>';

    const queryParams = {};
    if (searchVal) queryParams.search = searchVal;

    const response = await makeRequest('GET', '/api/v1/users/fetch', null, queryParams);
    const users = Array.isArray(response) ? response : [];

    if (users.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No users found</div>';
      return;
    }

    container.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Account</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${users
            .map(
              (user) => `
            <tr>
              <td>${escapeHtml(user.companyName || '-')}</td>
              <td>${escapeHtml(user.firstName || '-')}</td>
              <td>${escapeHtml(user.lastName || '-')}</td>
              <td>${escapeHtml(user.email || '-')}</td>
              <td>${escapeHtml(user.phoneNumber || '-')}</td>
              <td>${user.isActive !== false ? 'Active' : 'Inactive'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error loading users:', error);
    container.innerHTML = `<div class="alert alert-error">Error loading users: ${error.message}</div>`;
  }
}

function searchUsers() {
  const searchVal = document.getElementById('usersSearch')?.value || '';
  loadUsers(searchVal || null);
}


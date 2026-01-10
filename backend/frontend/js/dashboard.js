// Load Dashboard
async function loadDashboard() {
  const container = document.getElementById('dashboardStats');
  if (!isAuthenticated) {
    container.innerHTML = '<div class="loading">Please sign in to view dashboard</div>';
    return;
  }

  container.innerHTML = '<div class="loading">Loading dashboard data...</div>';

  try {
    const response = await fetch(`${getBackendUrl()}/api/v1/dashboard/fetch_data`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      container.innerHTML = `<div class="alert alert-error">Failed to load dashboard (${response.status}): ${errorText}</div>`;
      return;
    }

    const data = await response.json();
    console.log('Dashboard data:', data);

    // Handle different possible response structures
    let dashboardStats = [];
    if (data && data.dashboard && Array.isArray(data.dashboard)) {
      dashboardStats = data.dashboard;
    } else if (data && Array.isArray(data)) {
      dashboardStats = data;
    } else if (data && typeof data === 'object') {
      // Try to find any array in the response
      Object.keys(data).forEach((key) => {
        if (Array.isArray(data[key])) {
          dashboardStats = data[key];
        }
      });
    }

    if (dashboardStats.length > 0) {
      container.innerHTML = dashboardStats
        .map(
          (stat) => `
        <div class="stat-card">
          <h3>${escapeHtml(stat.title || stat.name || 'Stat')}</h3>
          <div class="count ${stat.hasPending ? 'pending' : ''}">${escapeHtml(
            String(stat.count || stat.value || '0')
          )}</div>
        </div>
      `
        )
        .join('');
    } else {
      container.innerHTML =
        '<div class="alert alert-error">No dashboard data available. Response structure: ' +
        escapeHtml(JSON.stringify(data, null, 2)) +
        '</div>';
    }
  } catch (error) {
    console.error('Dashboard load error:', error);
    container.innerHTML = `<div class="alert alert-error">Error loading dashboard: ${error.message}</div>`;
  }
}

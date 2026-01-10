function showAlert(message, type = 'info', containerId = 'dashboardAlert') {
  const container = document.getElementById(containerId);
  const alertClass = `alert alert-${type}`;
  container.innerHTML = `<div class="${alertClass}">${message}</div>`;
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

function getBackendUrl() {
  return API_BASE;
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// API Request helper
async function makeRequest(method, path, body = null, queryParams = null) {
  let url = `${getBackendUrl()}${path}`;

  // Add query parameters
  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams();
    Object.keys(queryParams).forEach((key) => {
      // Allow empty strings to be passed (they're valid query param values)
      if (queryParams[key] !== null && queryParams[key] !== undefined) {
        params.append(key, String(queryParams[key]));
      }
    });
    url += '?' + params.toString();
  }

  const options = {
    method: method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  };

  if (
    body !== null &&
    body !== undefined &&
    (method === 'POST' || method === 'PUT' || method === 'PATCH')
  ) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = {message: errorText || `HTTP ${response.status}: ${response.statusText}`};
    }
    throw new Error(errorData.message || errorData.error || `Request failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    return await response.text();
  }
}

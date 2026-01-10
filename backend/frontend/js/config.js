const API_BASE = window.location.origin;
let currentUser = null;
let accountData = null;
let isAuthenticated = false;
let userPermissions = null; // Array of permission strings

// Check if user has a specific permission
function hasPermission(permission) {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  // Superadmin has ALL permission
  if (userPermissions.includes('ALL')) return true;
  return userPermissions.includes(permission);
}

// Check if user can edit catalog (CAT_EDT permission)
function canEditCatalog() {
  return hasPermission('CAT_EDT');
}

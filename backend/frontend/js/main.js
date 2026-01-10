// Initialize
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded');
  // Ensure initial tab state is correct
  const aboutCompanyTab = document.getElementById('tab-content-aboutCompany');
  if (aboutCompanyTab) {
    aboutCompanyTab.classList.remove('hidden');
    aboutCompanyTab.style.display = 'block';
  }
  checkSession();
});

// Also run on load as backup
window.addEventListener('load', () => {
  console.log('Window loaded');
  checkSession();
});

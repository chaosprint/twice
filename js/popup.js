// Default sites that are monitored
const DEFAULT_SITES = [
  'youtube.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'facebook.com'
];

// Load sites from storage or use defaults
async function loadSites() {
  const result = await chrome.storage.sync.get('sites');
  if (!result.sites) {
    // First time setup: store default sites
    const sites = DEFAULT_SITES.map(domain => ({
      domain,
      enabled: true
    }));
    await chrome.storage.sync.set({ sites });
    return sites;
  }
  return result.sites;
}

// Show status message
function showStatus(message, isError = false) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ff3b30' : '#666';
  setTimeout(() => {
    statusEl.textContent = '';
  }, 2000);
}

// Render the site list
async function renderSiteList() {
  const sites = await loadSites();
  const siteList = document.getElementById('siteList');
  siteList.innerHTML = '';

  sites.forEach(site => {
    const li = document.createElement('li');
    li.className = 'site-item';
    li.innerHTML = `
      ${site.domain}
      <label class="toggle">
        <input type="checkbox" ${site.enabled ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    `;

    const checkbox = li.querySelector('input');
    checkbox.addEventListener('change', async () => {
      const updatedSites = sites.map(s => 
        s.domain === site.domain ? { ...s, enabled: checkbox.checked } : s
      );
      await chrome.storage.sync.set({ sites: updatedSites });
      showStatus(checkbox.checked ? 'Site enabled' : 'Site disabled');
      
      // Reload current tab if it matches the toggled site
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = new URL(tab.url);
      const currentDomain = url.hostname.replace('www.', '');
      if (currentDomain.includes(site.domain) || site.domain.includes(currentDomain)) {
        chrome.tabs.reload(tab.id);
      }
    });

    siteList.appendChild(li);
  });
}

// Setup add button for current site
async function setupAddButton() {
  const addButton = document.getElementById('addButton');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url);
  const domain = url.hostname.replace('www.', '');

  // Update button state based on whether site is already in list
  const sites = await loadSites();
  const siteExists = sites.some(site => 
    site.domain === domain || domain.includes(site.domain) || site.domain.includes(domain)
  );
  
  if (siteExists) {
    addButton.textContent = 'Already Added';
    addButton.disabled = true;
  } else {
    addButton.textContent = `Add ${domain}`;
    addButton.disabled = false;
  }

  addButton.addEventListener('click', async () => {
    const sites = await loadSites();
    if (!sites.some(site => site.domain === domain)) {
      sites.push({ domain, enabled: true });
      await chrome.storage.sync.set({ sites });
      showStatus('Site added successfully');
      addButton.textContent = 'Added!';
      addButton.disabled = true;
      
      // Refresh the list
      renderSiteList();
      
      // Reload the current tab to trigger the reminder
      chrome.tabs.reload(tab.id);
    }
  });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  renderSiteList();
  setupAddButton();
});

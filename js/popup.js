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
  if (!result.sites || result.sites.length === 0) {
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
      <button class="delete-btn" title="Delete site">x</button>
      <span class="domain-text">${site.domain}</span>
      <div class="controls">
        <label class="toggle">
          <input type="checkbox" ${site.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
    `;

    // Setup delete button handler
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', async () => {
      const updatedSites = sites.filter(s => s.domain !== site.domain);
      await chrome.storage.sync.set({ sites: updatedSites });
      showStatus('Site removed');
      renderSiteList(); // Refresh the list
      setupAddButton(); // Refresh add button state
    });

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
      if (currentDomain === site.domain) {
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
  
  // Check if the current URL is valid
  try {
    const url = new URL(tab.url);
    const domain = url.hostname.replace('www.', '');

    // Update button state based on whether site is already in list
    const sites = await loadSites();
    const siteExists = sites.some(site => site.domain === domain);
    
    if (siteExists) {
      addButton.textContent = 'Already Added';
      addButton.disabled = true;
    } else {
      addButton.textContent = 'Add Current Site';
      addButton.disabled = false;
      
      // Add click handler
      addButton.onclick = async () => {
        const sites = await loadSites();
        sites.push({
          domain,
          enabled: true  // New sites are enabled by default
        });
        await chrome.storage.sync.set({ sites });
        showStatus('Site added');
        renderSiteList();
        setupAddButton();
      };
    }
  } catch (error) {
    // Invalid URL or other error
    addButton.textContent = 'Invalid URL';
    addButton.disabled = true;
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  renderSiteList();
  setupAddButton();
});

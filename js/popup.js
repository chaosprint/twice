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

// Format time duration in seconds
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  }
}

// Reset time spent statistics
async function resetStats() {
  await chrome.storage.sync.set({ timeSpent: {} });
  renderStats();
  showStatus('Statistics reset successfully');
}

// Render statistics tab content
async function renderStats() {
  const statsContent = document.getElementById('statsContent');
  const result = await chrome.storage.sync.get(['sites', 'timeSpent']);
  const sites = result.sites || [];
  const timeSpent = result.timeSpent || {};

  statsContent.innerHTML = `
    <div class="stats-header">
      <button id="resetStats" class="reset-button">Reset Stats</button>
    </div>
  `;
  
  sites.filter(site => site.enabled).forEach(site => {
    const seconds = timeSpent[site.domain] || 0;
    const div = document.createElement('div');
    div.className = 'stats-item';
    div.innerHTML = `
      <span class="site-name">${site.domain}</span>
      <span class="time-spent">${formatDuration(seconds)}</span>
    `;
    statsContent.appendChild(div);
  });

  if (sites.filter(site => site.enabled).length === 0) {
    statsContent.innerHTML += '<p>No monitored sites yet.</p>';
  }

  // Add reset button event listener
  const resetButton = document.getElementById('resetStats');
  if (resetButton) {
    resetButton.addEventListener('click', resetStats);
  }
}

// Handle tab switching
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab button
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Show corresponding content
      const targetId = tab.dataset.tab + 'Tab';
      contents.forEach(content => {
        content.style.display = content.id === targetId ? 'block' : 'none';
      });

      // Update stats when switching to stats tab
      if (tab.dataset.tab === 'stats') {
        renderStats();
      }
    });
  });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  renderSiteList();
  setupAddButton();
  setupTabs();
});

async function shouldShowReminder() {
    try {
        const domain = window.location.hostname.replace('www.', '');
        const result = await chrome.storage.sync.get('sites');
        
        // If no sites in storage, use default configuration (enabled)
        if (!result.sites || result.sites.length === 0) {
            console.log('No sites configured, showing reminder');
            return true;
        }

        const sites = result.sites;
        // Check if any configured site matches the current domain
        const matchingSite = sites.find(site => 
            domain.includes(site.domain) || site.domain.includes(domain)
        );

        console.log('Current domain:', domain);
        console.log('Matching site:', matchingSite);
        
        return matchingSite ? matchingSite.enabled : false;
    } catch (error) {
        console.error('Error checking reminder status:', error);
        return false;
    }
}

async function createReminderDialog() {
    // Check if reminder already exists
    if (document.querySelector('.focus-reminder')) {
        return;
    }

    // Check if reminder should be shown for this site
    const shouldShow = await shouldShowReminder();
    console.log('Should show reminder:', shouldShow);
    
    if (!shouldShow) {
        return;
    }

    // Create reminder dialog
    const dialog = document.createElement('div');
    dialog.className = 'focus-reminder';
    dialog.innerHTML = `
        <h2>Mindful Moment</h2>
        <p>Are you spending your time intentionally?</p>
        <div class="focus-reminder-buttons">
            <button class="continue">Continue Browsing</button>
            <button class="leave">Focus on What Matters</button>
        </div>
    `;

    // Add button events with fade out animation
    dialog.querySelector('.continue').addEventListener('click', () => {
        dialog.style.opacity = '0';
        dialog.style.transform = 'translate(-50%, -50%) scale(0.95)';
        setTimeout(() => dialog.remove(), 200);
    });

    dialog.querySelector('.leave').addEventListener('click', () => {
        dialog.style.opacity = '0';
        dialog.style.transform = 'translate(-50%, -50%) scale(0.95)';
        setTimeout(() => {
            chrome.runtime.sendMessage({ action: 'closeTab' });
        }, 200);
    });

    // Add to page with fade in animation
    dialog.style.opacity = '0';
    dialog.style.transition = 'all 0.2s ease';
    document.body.appendChild(dialog);
    
    // Trigger fade in
    setTimeout(() => {
        dialog.style.opacity = '1';
    }, 50);
}

// Initialize reminder
function initializeReminder() {
    console.log('Initializing reminder...');
    createReminderDialog();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'checkReminder') {
        createReminderDialog();
    }
});

// Show reminder when page loads
if (document.readyState === 'complete') {
    initializeReminder();
} else {
    window.addEventListener('load', initializeReminder);
}

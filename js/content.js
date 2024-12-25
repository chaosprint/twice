async function shouldShowReminder() {
    try {
        const domain = window.location.hostname.replace('www.', '');
        const result = await chrome.storage.sync.get('sites');
        
        // If no sites in storage, initialize with default sites
        if (!result.sites || result.sites.length === 0) {
            const defaultSites = [
                'youtube.com',
                'tiktok.com',
                'twitter.com',
                'x.com',
                'instagram.com',
                'facebook.com'
            ];
            const sites = defaultSites.map(domain => ({
                domain,
                enabled: true
            }));
            await chrome.storage.sync.set({ sites });
            return defaultSites.includes(domain);
        }

        const sites = result.sites;
        // Check if any configured site exactly matches the current domain
        const matchingSite = sites.find(site => {
            const siteDomain = site.domain.replace('www.', '');
            return domain === siteDomain;
        });

        console.log('Current domain:', domain);
        console.log('Matching site:', matchingSite);
        
        // Only show reminder if site is in the list and enabled
        return matchingSite ? matchingSite.enabled : false;
    } catch (error) {
        console.error('Error checking reminder status:', error);
        return false;  // Default to not showing reminder on error
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
        <div class="close-button">×</div>
        <h2>Mindful Moment</h2>
        <p>Are you spending your time intentionally?</p>
        <div class="focus-reminder-buttons">
            <button class="continue">Browsing with Timer</button>
            <button class="leave">Focus on What Matters</button>
        </div>
    `;

    // Create timer element
    const timer = document.createElement('div');
    timer.className = 'browsing-timer';
    timer.style.display = 'none';
    document.body.appendChild(timer);

    let seconds = 0;
    let timerInterval;

    const startTimer = () => {
        dialog.remove();
        timer.style.display = 'block';
        timer.textContent = '0s';
        timerInterval = setInterval(() => {
            seconds++;
            timer.textContent = `${seconds}s`;
        }, 1000);
    };

    // Add button events 
    dialog.querySelector('.close-button').addEventListener('click', () => {
        dialog.remove();
    });
    
    dialog.querySelector('.continue').addEventListener('click', startTimer);

    dialog.querySelector('.leave').addEventListener('click', () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timer.remove();
        }
        chrome.runtime.sendMessage({ action: 'closeTab' });
    });

    // Add to page 
    document.body.appendChild(dialog);
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

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

const reminderMessages = [
    "Are you spending your time intentionally?",
    "Is this the best use of your precious time?",
    "Is this activity aligned with your goals?",
    "Could you be doing something more meaningful?",
    "Are you scrolling mindlessly right now?",
    "Is this bringing value to your life?",
    "What else could you accomplish right now?",
    "Are you in control of your attention?",
    "Is this worth your limited time on Earth?",
    "Will you remember this scroll session tomorrow?",
    "Is this moving you closer to your dreams?",
    "Are these minutes well invested?",
    "Could your future self thank you for this?",
    "Is this feeding your mind or just killing time?",
    "What's the opportunity cost of scrolling now?",
    "Are you choosing this consciously?",
    "Is this enhancing or distracting your life?",
    "Would you advise others to spend time like this?",
    "Is this the legacy you want to build?",
    "Does this align with your life's purpose?"
];

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
    const randomMessage = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
    const dialog = document.createElement('div');
    dialog.className = 'focus-reminder';
    dialog.innerHTML = `
        <div class="close-button">×</div>
        <p>${randomMessage}</p>
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

// Track time spent on the site
async function trackTimeSpent() {
    const domain = window.location.hostname.replace('www.', '');
    const result = await chrome.storage.sync.get(['sites', 'timeSpent']);
    const sites = result.sites || [];
    const timeSpent = result.timeSpent || {};

    // Only track time if site is in the monitored list and enabled
    const matchingSite = sites.find(site => {
        const siteDomain = site.domain.replace('www.', '');
        return domain === siteDomain && site.enabled;
    });

    if (matchingSite) {
        // Update time spent (in seconds)
        timeSpent[domain] = (timeSpent[domain] || 0) + 1;
        await chrome.storage.sync.set({ timeSpent });
    }
}

// Initialize time tracking
let trackingInterval;
async function initializeTimeTracking() {
    const shouldTrack = await shouldShowReminder();
    console.log('Should track time:', shouldTrack);
    
    if (shouldTrack) {
        // Track time every second
        trackingInterval = setInterval(trackTimeSpent, 1000);
        
        // Clear interval when page is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && trackingInterval) {
                clearInterval(trackingInterval);
                trackingInterval = null;
            } else if (!document.hidden && !trackingInterval && shouldTrack) {
                trackingInterval = setInterval(trackTimeSpent, 1000);
            }
        });
    }
}

// Initialize reminder
function initializeReminder() {
    console.log('Initializing reminder and time tracking...');
    // Start time tracking immediately
    initializeTimeTracking();
    // Show reminder after a delay
    setTimeout(createReminderDialog, 2000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'checkReminder') {
        createReminderDialog();
    }
});

// Start initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReminder);
} else {
    initializeReminder();
}

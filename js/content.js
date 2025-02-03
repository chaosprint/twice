const DELAY_TIME = 30

async function shouldShowReminder() {
    try {
        const domain = window.location.hostname.replace('www.', '');
        const result = await chrome.storage.sync.get('sites');
        
        if (!result.sites || result.sites.length === 0) {
            return true;
        }

        const sites = result.sites;
        const matchingSite = sites.find(site => 
            domain.includes(site.domain) || site.domain.includes(domain)
        );
        
        return matchingSite ? matchingSite.enabled : false;
    } catch (error) {
        return false;
    }
}

async function createReminderDialog() {
    if (!document.body || document.documentElement.tagName.toLowerCase() === 'svg') {
        return;
    }

    if (document.querySelector('.focus-reminder')) {
        return;
    }

    const shouldShow = await shouldShowReminder();
    
    if (!shouldShow) {
        return;
    }

    const dialog = document.createElement('div');
    dialog.className = 'focus-reminder';
    dialog.innerHTML = `
        <div class="focus-reminder-content">
            <h2>Mindful Moment</h2>
            <p>Are you spending your time intentionally?</p>
            
            <div id="timer-selection" class="section">
                <p class="section-title">If necessary...</p>
                <p class="section-subtitle">Look outside the window<br>and come back in a minute</p>
                <div class="timer-options">
                    <button class="schedule" data-minutes="1">Take a Break</button>
                </div>
            </div>

            <div id="timer-display" class="section" style="display: none;">
                <p class="timer">Time remaining until you can continue</p>
                <p class="countdown"><span id="countdown">00:${DELAY_TIME}</span></p>
            </div>

            <div class="focus-reminder-buttons">
                <button class="leave">Leave Now</button>
                <p class="button-hint">and focus on what matters</p>
            </div>
        </div>
    `;

    let countdownInterval;
    const timerDisplay = dialog.querySelector('#timer-display');
    const countdownElement = dialog.querySelector('#countdown');
    const timerSelection = dialog.querySelector('#timer-selection');

    dialog.querySelector('.schedule').addEventListener('click', () => {
        let timeLeft = DELAY_TIME;
        timerSelection.style.display = 'none';
        timerDisplay.style.display = 'block';
        
        countdownInterval = setInterval(() => {
            timeLeft--;
            const mins = Math.floor(timeLeft / DELAY_TIME);
            const secs = timeLeft % DELAY_TIME;
            countdownElement.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                dialog.style.opacity = '0';
                dialog.style.transform = 'translate(-50%, -50%) scale(0.95)';
                setTimeout(() => dialog.remove(), 200);
            }
        }, 1000);
    });

    dialog.querySelector('.leave').addEventListener('click', () => {
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        dialog.style.opacity = '0';
        dialog.style.transform = 'translate(-50%, -50%) scale(0.95)';
        setTimeout(() => {
            chrome.runtime.sendMessage({ action: 'closeTab' });
        }, 200);
    });

    dialog.style.opacity = '0';
    dialog.style.transition = 'all 0.2s ease';
    document.body.appendChild(dialog);
    
    setTimeout(() => {
        dialog.style.opacity = '1';
    }, 50);
}

function initializeReminder() {
    if (!document.body || document.documentElement.tagName.toLowerCase() === 'svg') {
        return;
    }
    createReminderDialog();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'checkReminder') {
        createReminderDialog();
    }
});

if (document.readyState === 'complete') {
    initializeReminder();
} else {
    window.addEventListener('load', initializeReminder);
}

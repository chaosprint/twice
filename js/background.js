chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'closeTab' && sender.tab) {
        chrome.tabs.remove(sender.tab.id);
    }
});

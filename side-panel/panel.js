console.log('[Panel] Panel.js loaded');
chrome.storage.local.get(['uiState', 'latestSummary'], (result) => {
    const container = document.getElementById('response-container');
    const text = document.getElementById('response-text');

    if (result.uiState === 'loading') {
        if (container) container.style.display = 'block';
        if (text) text.innerText = 'Summarizing...';
    }
    else if (result.latestSummary) {
        if (container) container.style.display = 'block';
        if (text) text.innerText = result.latestSummary;
    }
});

let backgroundPort = null;

// Connect to background script
backgroundPort = chrome.runtime.connect({ name: 'sidepanel' });
console.log('[Panel] Connected to background');
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('get-review').addEventListener('click', () => {
        console.log('[Panel] Get Reviews button clicked');
        const responseContainer = document.getElementById('response-container');
        const responseText = document.getElementById('response-text');
        if (responseContainer && responseText) {
            responseContainer.style.display = 'block';
            responseText.innerText = 'Summarizing...';
        }
        chrome.runtime.sendMessage({ action: 'get-reviews' });
    });
});

// Listen for messages from background script via port
backgroundPort.onMessage.addListener((message) => {
    console.log('[Panel] Received message from background:', message);

    if (message.action === 'STATUS_UPDATE') {
        const responseContainer = document.getElementById('response-container');
        const responseText = document.getElementById('response-text');

        if (responseContainer && responseText) {
            responseContainer.style.display = 'block';
            responseText.innerText = message.text;
        }
    }

    if (message.action === 'DISPLAY_SUMMARY') {
        console.log('[Panel] Displaying summary:', message.answer);
        const responseContainer = document.getElementById('response-container');
        const responseText = document.getElementById('response-text');

        if (responseText && responseContainer) {
            responseText.innerText = message.answer || "No summary generated.";
            responseContainer.style.display = 'block';
        } else {
            console.error('[Panel] Elements not found');
        }
    }
});

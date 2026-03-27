let sidePanelPort = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel') {
    console.log('[Background] Side panel connected');
    sidePanelPort = port;

    port.onDisconnect.addListener(() => {
      console.log('[Background] Side panel disconnected');
      sidePanelPort = null;
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === "OPEN_PANEL") {
    const targetTabId = message.tabId || sender.tab?.id;
    if (targetTabId) {
        chrome.sidePanel.setOptions({ tabId: targetTabId, path: 'side-panel/sidepanel.html', enabled: true });
        chrome.sidePanel.open({ tabId: targetTabId }).catch(err => console.error(err));
    }
  }

  if (message.action === 'get-reviews') {
    console.log('[Background] Received manual request from Side Panel');
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action: "MANUAL_TRIGGER" });
      } else {
        console.error('[Background] No active tab found to scrape.');
      }
    });
  }

  if (message.action === 'ASK_GEMINI') {
    handleGeminiRequest(message.reviewArr, sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.action === "SET_LOADING") {

    chrome.storage.local.set({ 'uiState' : 'loading' });

    if (sidePanelPort) {
        sidePanelPort.postMessage({ 
            action: 'STATUS_UPDATE', 
            text: 'Summarizing...' 
        });
    }
  }
});

async function handleGeminiRequest(reviewArr, sendResponse) {
  if (!reviewArr || reviewArr.length === 0) {
      if (sidePanelPort) sidePanelPort.postMessage({ action: 'DISPLAY_SUMMARY', answer: "No reviews found to summarize." });
      return;
  }

  try {
    // Calling Express backend
    const res = await fetch('http://localhost:8080/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewArr: reviewArr })
    });

    const data = await res.json();

    // Catch errors returned by your backend
    if (!res.ok || !data.success) {
        throw new Error(data.error || "Backend failed to generate summary.");
    }

    let answer = data.answer;

    console.log('[Backend] Success.');    
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { action: "SUMMARY_COMPLETE" });
        }
    });

    if (sidePanelPort) {
      sidePanelPort.postMessage({ action: 'DISPLAY_SUMMARY', answer: answer });
    }

    chrome.storage.local.set({ 'latestSummary': answer , 'uiState' : 'ready' });

    if (sendResponse) {
        sendResponse({ success: true, answer });
    }

  } catch (err) {
    console.error('[Backend Connection Error]:', err);
    if (sidePanelPort) {
        sidePanelPort.postMessage({ action: 'DISPLAY_SUMMARY', answer: "Error: " + err.message });
    }
  }
}

function sendMessageWithRetry(tabId, message, retries = 10) {
  chrome.tabs.sendMessage(tabId, message)
    .then(() => console.log('[Background] Signal delivered'))
    .catch(() => {
      if (retries > 0) setTimeout(() => sendMessageWithRetry(tabId, message, retries - 1), 1000);
    });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && (tab.url.includes('/dp/') || tab.url.includes('/gp/product/'))) {
    sendMessageWithRetry(tabId, { action: "SHOW_PROMPT" });
  }
});
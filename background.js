let sidePanelPort = null;
const GEMINI_KEY = process.env.GEMINI_KEY_1; // Use the first key by default

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
      // Send error to panel if review array is empty
      if (sidePanelPort) sidePanelPort.postMessage({ action: 'DISPLAY_SUMMARY', answer: "No reviews found to summarize." });
      return;
  }

  const prompt = `Summarize these reviews in 150 words or less and Be concise, accurate, and include both pros and cons:\n${reviewArr.join('\n')}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    const data = await res.json();
    let answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini returned an empty response.";

    console.log('[Gemini] Success.');

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { action: "SUMMARY_COMPLETE" });
        }
    });

    if (sidePanelPort) {
      sidePanelPort.postMessage({ action: 'DISPLAY_SUMMARY', answer: answer });
    }

    chrome.storage.local.set({ 'latestSummary': answer , 'uiState' : 'ready' });

    sendResponse({ success: true, answer });

  } catch (err) {
    console.error('[Gemini] API Error:', err);
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
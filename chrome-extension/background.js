// NanoBot Chrome Extension — Background Service Worker
// Manages connection state and badge updates

const NANOBOT_API = 'http://127.0.0.1:7777';

// Check server status periodically
async function checkStatus() {
  try {
    const r = await fetch(NANOBOT_API + '/api/status', { signal: AbortSignal.timeout(3000) });
    const d = await r.json();
    chrome.action.setBadgeText({ text: '●' });
    chrome.action.setBadgeBackgroundColor({ color: '#14F195' });
    
    // Store status for popup
    chrome.storage.local.set({ 
      nanobotOnline: true, 
      lastStatus: d,
      lastCheck: Date.now() 
    });
  } catch {
    chrome.action.setBadgeText({ text: '' });
    chrome.storage.local.set({ 
      nanobotOnline: false, 
      lastCheck: Date.now() 
    });
  }
}

// Check every 30 seconds
chrome.alarms.create('nanobot-status', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'nanobot-status') checkStatus();
});

// Check on install/startup
chrome.runtime.onInstalled.addListener(checkStatus);
chrome.runtime.onStartup.addListener(checkStatus);

// Handle messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'CHECK_STATUS') {
    checkStatus().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'GET_SETTINGS') {
    chrome.storage.local.get(['heliusApiKey', 'nanobotUrl', 'network'], (data) => {
      sendResponse(data);
    });
    return true;
  }
  if (msg.type === 'SAVE_SETTINGS') {
    chrome.storage.local.set(msg.data, () => sendResponse({ ok: true }));
    return true;
  }
});

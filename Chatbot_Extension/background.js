// Background script for E-commerce Product Finder extension (Manifest V3)

// Debug function
function debugLog(message, data = '') {
  console.log('[Background]', message, data);
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  debugLog('Extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  debugLog('Extension icon clicked on tab:', tab.id);
  // Only inject into http(s) tabs
  if (!tab.url || !/^https?:\/\//.test(tab.url)) {
    debugLog('Skipping injection: tab URL not http(s)', tab.url);
    return;
  }
  // First, inject the content script
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  }).then(() => {
    debugLog('Content script injected, sending toggle message');
    chrome.tabs.sendMessage(tab.id, { action: 'toggleChat' })
      .then(response => {
        debugLog('Toggle message response:', response);
      })
      .catch(err => {
        console.error('Failed to send toggle message, trying alternative approach:', err);
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if (window.toggleChat) {
              window.toggleChat();
            } else {
              console.error('toggleChat function not found in window object');
            }
          }
        });
      });
  }).catch(err => {
    console.error('Failed to inject content script:', err);
  });
});

// Listen for tab updates to inject content scripts
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only inject into http(s) tabs
  if (changeInfo.status === 'complete' && tab.active && tab.url && /^https?:\/\//.test(tab.url)) {
    debugLog(`Tab updated: ${tab.url}`);
    chrome.scripting.insertCSS({
      target: { tabId },
      files: ['chat.css']
    }).catch(err => console.error('Failed to inject CSS:', err));
  } else if (changeInfo.status === 'complete') {
    debugLog('Skipping CSS injection: tab URL not http(s)', tab.url);
  }
});

// Handle API requests from content scripts
async function handleApiRequest(endpoint, data) {
  try {
    // Support a special 'test' endpoint which is exposed at /test and expects GET
    let url;
    let options = {};
    if (endpoint === 'test') {
      url = `http://localhost:5201/test`;
      options = { method: 'GET' };
    } else {
      url = `http://localhost:5201/api/${endpoint}`;
      options = {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': 'chrome-extension://' + chrome.runtime.id,
          'Access-Control-Allow-Origin': '*'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          _source: 'chrome-extension',
          _extensionId: chrome.runtime.id
        })
      };
    }

    // First, try a preflight OPTIONS request
    try {
      await fetch(url, { method: 'OPTIONS', headers: options.headers });
    } catch (e) {
      console.log('Preflight request failed, continuing with main request:', e);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (response.status === 405) {
        // Method not allowed, try GET as fallback
        const getResponse = await fetch(`${url}?${new URLSearchParams(data)}`, {
          method: 'GET',
          headers: options.headers
        });
        if (!getResponse.ok) {
          throw new Error(`HTTP error! status: ${getResponse.status}`);
        }
        return await getResponse.json();
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  debugLog('Received message:', request);
  
  // Handle API requests from content script
  if (request.action === 'apiRequest') {
    const { endpoint, data } = request;
    handleApiRequest(endpoint, data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required to use sendResponse asynchronously
  }
  
  if (request.action === 'toggleChat') {
    // Toggle chat visibility
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleChat' })
          .catch(err => console.error('Error toggling chat:', err));
      }
    });
  }
  
  if (request.action === 'findProducts' || request.action === 'processUserQuery') {
    // Forward the message to the content script in the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, request)
          .then(response => sendResponse(response))
          .catch(err => {
            console.error('Error sending message to content script:', err);
            sendResponse({ error: 'Failed to communicate with content script' });
          });
      } else {
        sendResponse({ error: 'No active tab found' });
      }
    });
    return true; // Required for async response
  }
});
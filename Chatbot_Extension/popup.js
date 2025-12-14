// Debug log to verify script is loading
console.log('Popup script loaded - extension version:', chrome.runtime.getManifest().version);

// Show status message function
function setStatus(element, message, isError = false) {
  if (element) {
    element.textContent = message;
    element.style.color = isError ? '#d32f2f' : '#5f6368';
  }
  console.log('Status:', message);
}

// Main function that runs when the popup loads
function initPopup() {
  // Get the button and status elements
  const openChatBtn = document.getElementById('openChat');
  console.log('Open chat button found:', !!openChatBtn);

  if (!openChatBtn) {
    console.error('Open chat button not found in the DOM!');
    console.log('All buttons on page:', document.querySelectorAll('button'));
    return;
  }

  const statusEl = document.createElement('div');
  statusEl.style.marginTop = '10px';
  statusEl.style.fontSize = '12px';
  statusEl.style.minHeight = '16px';

  if (openChatBtn.parentNode) {
    openChatBtn.parentNode.insertBefore(statusEl, openChatBtn.nextSibling);
  } else {
    console.error('Could not insert status element - openChatBtn has no parent');
    document.body.appendChild(statusEl);
  }

  // Open chat when button is clicked
  openChatBtn.addEventListener('click', async () => {
    setStatus(statusEl, 'Opening...');
    openChatBtn.disabled = true;
    
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // First try to toggle the chat
      try {
        console.log('Attempting to toggle chat...');
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: 'toggleChat' 
        });
        
        console.log('Toggle response:', response);
        if (response && response.success) {
          window.close();
          return;
        }
        
        // If first attempt failed, inject the content script and CSS
        console.log('Injecting content script and CSS...');
        try {
          // First inject CSS
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['chat.css']
          });
          
          // Then inject content script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          
          console.log('Scripts injected, waiting for initialization...');
          // Give it more time to initialize
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Now try toggling again with a longer timeout
          console.log('Attempting to toggle chat after injection...');
          response = await chrome.tabs.sendMessage(tab.id, { 
            action: 'toggleChat' 
          });
          
          console.log('Toggle response after injection:', response);
          if (response && response.success) {
            window.close();
            return;
          }
        } catch (injectionError) {
          console.error('Failed to inject or toggle chat:', injectionError);
          setStatus(statusEl, 'Error: Could not load chat. Please refresh the page and try again.', true);
          return;
        }
        
        // If we get here, both attempts failed
        setStatus(statusEl, 'Failed to open chat. Please refresh the page and try again.', true);
      } catch (injectionError) {
        console.error('Failed to inject content script:', injectionError);
        setStatus(statusEl, 'Error: Could not load chat. Refresh the page and try again.', true);
      }
    } catch (error) {
      console.error('Error in popup:', error);
      setStatus(statusEl, 'An error occurred. Please try again.', true);
    } finally {
      openChatBtn.disabled = false;
    }
  });

  // Open chat when Enter key is pressed (for accessibility)
  openChatBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openChatBtn.click();
    }
  });

  // Check if content script is already injected
  async function checkContentScript() {
    try {
      console.log('Checking for existing content script...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        console.log('No active tab found');
        openChatBtn.textContent = 'Initialize Chat';
        setStatus(statusEl, 'Switch to a webpage to chat');
        return;
      }
      
      // Verify if we can inject into this tab
      if (!tab.url || !tab.url.startsWith('http')) {
        console.log('Cannot inject into this page type:', tab.url);
        openChatBtn.textContent = 'Initialize Chat';
        setStatus(statusEl, 'Switch to a webpage to chat');
        return;
      }
      
      // Try to ping the content script
      console.log('Sending ping to content script...');
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'ping' 
      });
      
      console.log('Ping response:', response);
      if (response && response.status === 'pong') {
        // Content script is ready
        console.log('Content script is ready');
        openChatBtn.textContent = 'Open Chat';
        setStatus(statusEl, 'Ready to chat!');
      }
    } catch (error) {
      // Content script not ready yet
      console.log('Content script not ready:', error);
      openChatBtn.textContent = 'Initialize Chat';
      setStatus(statusEl, 'Click to initialize chat');
    }
  }

  // Initial check
  console.log('Running initial content script check...');
  checkContentScript();
}

// Run the initialization when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  // DOM is already ready
  initPopup();
}
  // Listen for product search requests from chat.js
  document.addEventListener('productSearchRequest', async function (e) {
    // Add debug logging
    console.log('Product search request received:', e.detail);

    let products = [];
    let error = null;
    let recommendations = [];
    let query = '';
    let typingId = null;

    try {
      // Safely extract query and typingId
      if (e.detail && typeof e.detail === 'object') {
        query = e.detail.query || '';
        typingId = e.detail.typingId;
      }

      // Extract products from the page
      products = extractProductsFromPage();
      console.log('Extracted products:', products);

      // Only proceed with API request if we have a query
      if (query) {
        // Call backend with query and products via background
        const apiRequest = (endpoint, data = {}) => new Promise((resolve, reject) => {
          try {
            console.log('Sending API request to background:', { endpoint, data });
            chrome.runtime.sendMessage({ action: 'apiRequest', endpoint, data }, (resp) => {
              const lastErr = chrome.runtime.lastError;
              if (lastErr) return reject(lastErr);
              if (!resp) return reject(new Error('No response from background'));
              if (resp.success) resolve(resp.data);
              else reject(new Error(resp.error || 'API request failed'));
            });
          } catch (e) { reject(e); }
        });

        let data = await apiRequest('search', { query, products });
        products = data.products || [];
        recommendations = data.recommendations || [];
      } else {
        console.log('No query provided, skipping API request');
      }
    } catch (err) {
      console.error('Error in product search:', err);
      error = err.message || 'Sorry, I encountered an error while searching for products. Please try again with different keywords.';
    }

    // Dispatch result event for chat.js
    document.dispatchEvent(new CustomEvent('productSearchResult', {
      detail: { products, error, typingId, recommendations }
    }));
  });
// Scoped within IIFE to avoid global namespace pollution
(function() {
  // Debug logging
  function debugLog(message, data = '') {
    console.log('[Content Script]', message, data);
  }

  // Chat interface state
  let chatInterface = {
    container: null,
    isInitialized: false,
    bubble: null
  };

  // Extract products from the current page
  function extractProductsFromPage() {
    const products = [];
    // Amazon
    document.querySelectorAll('.s-result-item[data-component-type="s-search-result"]').forEach(el => {
      const title = el.querySelector('h2, h3, .a-text-normal')?.innerText || '';
      const price = el.querySelector('.a-price-whole, .a-price')?.innerText || '';
      const url = el.querySelector('a.a-link-normal')?.href || '';
      if (title && url) products.push({ title, price, url, source: 'Amazon' });
    });
    // eBay
    document.querySelectorAll('.s-item').forEach(el => {
      const title = el.querySelector('.s-item__title')?.innerText || '';
      const price = el.querySelector('.s-item__price')?.innerText || '';
      const url = el.querySelector('a.s-item__link')?.href || '';
      if (title && url) products.push({ title, price, url, source: 'eBay' });
    });
    // Generic selectors
    document.querySelectorAll('.product, .item, .card, .product-item, [data-product], [data-item]').forEach(el => {
      const title = el.querySelector('h2, h3, .title, .name')?.innerText || '';
      const price = el.querySelector('.price, .amount, .cost')?.innerText || '';
      const url = el.querySelector('a')?.href || '';
      if (title && url) products.push({ title, price, url, source: window.location.hostname });
    });
    return products;
  }

  // Function to create the chat interface
  async function createChatInterface() {
    debugLog('Creating chat interface');
    
    // Always reset initialization state when creating new interface
    chatInterface.isInitialized = false;
    chatInterface.container = null;
    chatInterface.bubble = null;

    // Remove any existing chat interface
    const existingContainer = document.getElementById('chatbot-extension-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Remove any existing script and styles to ensure clean initialization
    document.querySelectorAll('script[src*="chat.js"], link[href*="chat.css"]').forEach(el => el.remove());
  
  try {
    debugLog('Setting up chat interface');
    
    // Create container for the chat interface
    chatInterface.container = document.createElement('div');
    chatInterface.container.id = 'chatbot-extension-container';
    
    // Load CSS first
    const cssUrl = chrome.runtime.getURL('chat.css');
    debugLog('Loading CSS from:', cssUrl);
    
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.href = cssUrl;
    
    // Add error listener
    window.addEventListener('error', function(event) {
      console.error('Chat initialization error:', event.error);
    });
    
    // Wait for CSS to load before proceeding
    style.onload = () => {
      debugLog('CSS loaded, fetching chat.html');
      
      // Fetch and inject chat.html
      const htmlUrl = chrome.runtime.getURL('chat.html');
      debugLog('Loading HTML from:', htmlUrl);
      
      fetch(htmlUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load chat.html: ${response.status} ${response.statusText}`);
          }
          return response.text();
        })
        .then(html => {
          debugLog('Parsing chat.html');
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Extract chat elements
          const chatContainerEl = doc.getElementById('chat-container');
          const chatBubbleEl = doc.getElementById('chat-bubble');
          
          if (!chatContainerEl || !chatBubbleEl) {
            throw new Error('Required chat elements not found in chat.html');
          }
          
          // Add the elements to the container
          chatInterface.container.appendChild(chatContainerEl);
          chatInterface.container.appendChild(chatBubbleEl);
          
          // Store references
          chatInterface.bubble = chatBubbleEl;
          
          // Add container to page
          document.body.appendChild(chatInterface.container);
          
          // Set initial visibility state
          chatContainerEl.style.display = 'none';
          chatBubbleEl.style.display = 'flex';
          chatContainerEl.classList.remove('active');
          chatBubbleEl.classList.add('active');
          
          // Load chat.js last
          const jsUrl = chrome.runtime.getURL('chat.js');
          debugLog('Loading JS from:', jsUrl);
          
          const script = document.createElement('script');
          script.src = jsUrl;
          script.onload = () => {
            debugLog('Chat.js loaded successfully');
            chatInterface.isInitialized = true;
            // Dispatch a custom event to notify chat.js
            document.dispatchEvent(new CustomEvent('chatInterfaceReady'));
          };
          script.onerror = (error) => {
            console.error('Error loading chat.js:', error);
          };
          document.body.appendChild(script);
        })
        .catch(error => {
          console.error('Error injecting chat interface:', error);
        });
    };
    
    // Start loading CSS
    document.head.appendChild(style);
    
  } catch (error) {
    console.error('Error creating chat interface:', error);
  }
}

  // Toggle chat visibility
  function toggleChat() {
    if (!chatInterface.isInitialized) {
      createChatInterface();
      return;
    }
    
    const container = document.getElementById('chat-container');
    const bubble = document.getElementById('chat-bubble');
    
    if (!container || !bubble) {
      debugLog('Chat elements not found, reinitializing...');
      createChatInterface();
      return;
    }
    
    debugLog('Toggling chat visibility', {
      container: container.style.display,
      bubble: bubble.style.display,
      containerActive: container.classList.contains('active')
    });
    
    if (container.style.display !== 'none') {
      // Hide chat
      container.style.display = 'none';
      bubble.style.display = 'flex';
      container.classList.remove('active');
      bubble.classList.add('active');
    } else {
      // Show chat
      container.style.display = 'flex';
      bubble.style.display = 'none';
      container.classList.add('active');
      bubble.classList.remove('active');
      
      // Focus input
      const input = document.getElementById('chat-input');
      if (input) {
        input.focus();
      }
    }
  }

  // Listen for messages from the popup or background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debugLog('Message received:', request);
    if (request.action === 'toggleChat') {
      toggleChat();
      sendResponse({ status: 'success' });
      return true;
    }
    if (request.action === 'ping') {
      sendResponse({ status: 'pong' });
      return true;
    }
    if (request.action === 'extractProducts') {
      const products = extractProductsFromPage();
      // Include the query in the response
      sendResponse({ 
        products,
        query: request.query || ''  // Use the query from the request or empty string as fallback
      });
      return true;
    }
    return true;
  });

    // Initialize chat when the content script loads
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createChatInterface);
  } else {
    createChatInterface();
  }

  // Make toggleChat and extractProducts available globally
  window.toggleChat = toggleChat;
  window.extractProductsFromPage = extractProductsFromPage;
})();

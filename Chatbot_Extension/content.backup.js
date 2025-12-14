// Chat container reference
let chatContainer = null;

// Debug logging
function debugLog(message, data = '') {
  console.log('[Content Script]', message, data);
}

// Function to create the chat interface
function createChatInterface() {
  debugLog('Creating chat interface');
  
  // If chat already exists, just show it
  if (chatContainer) {
    chatContainer.style.display = 'flex';
    return;
  }
  
  try {
    // Create main chat container
    chatContainer = document.createElement('div');
    chatContainer.id = 'chatbot-extension-container';
    chatContainer.className = 'chat-container';
    
    // Add chat interface HTML
    chatContainer.innerHTML = `
      <div class="chat-header">
        <span>Product Finder</span>
        <div class="chat-header-controls">
          <button id="minimize-btn" class="minimize-btn" title="Minimize">−</button>
          <button id="close-btn" class="close-btn" title="Close">×</button>
        </div>
      </div>
      <div id="chat-messages" class="chat-messages">
        <div class="message bot">
          <div class="message-content">Hi! How can I help you find products today?</div>
        </div>
      </div>
      <div class="chat-input-container">
        <input type="text" id="chat-input" placeholder="Type your search query..." autocomplete="off">
        <button id="send-btn">Send</button>
      </div>
    `;

    // Add styles
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.href = 'http://localhost:5201/static/chat.css';
    
    // Append elements to the document
    document.head.appendChild(style);
    document.body.appendChild(chatContainer);

    // Add event listeners
    const sendButton = chatContainer.querySelector('#send-btn');
    const chatInput = chatContainer.querySelector('#chat-input');
    const closeButton = chatContainer.querySelector('#close-btn');
    const minimizeButton = chatContainer.querySelector('#minimize-btn');

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    closeButton.addEventListener('click', () => {
      chatContainer.style.display = 'none';
    });

    minimizeButton.addEventListener('click', () => {
      const messages = chatContainer.querySelector('.chat-messages');
      messages.style.display = messages.style.display === 'none' ? 'flex' : 'none';
    });

    // Show the chat
    chatContainer.style.display = 'flex';
    
  } catch (error) {
    console.error('Error creating chat interface:', error);
  }
}

// Function to send a message to the backend
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();

  if (!message) return;

  // Add user message to chat
  addMessage(message, 'user');
  input.value = '';
  input.disabled = true;
  
  try {
    // Show typing indicator
    const typingId = 'typing-' + Date.now();
    addMessage('Searching for products...', 'bot', typingId);
    
    // Send message to backend with CORS mode and proper headers
    const response = await fetch('http://localhost:5201/api/search', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query: message,
        site: window.location.hostname
      })
    }).catch(error => {
      console.error('Fetch error:', error);
      throw new Error('Failed to connect to the server. Make sure the backend is running.');
    });
    
    // Remove typing indicator
    const typingElement = document.getElementById(typingId);
    if (typingElement) {
      typingElement.remove();
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Display the response
    if (data.products && data.products.length > 0) {
      // Format and display products
      const productsHtml = data.products.map(product => 
        `<div class="product-result">
          <div class="product-title">${product.title || 'No title'}</div>
          ${product.price ? `<div class="product-price">${product.price}</div>` : ''}
          ${product.url ? `<a href="${product.url}" target="_blank" class="product-link">View Product</a>` : ''}
        </div>`
      ).join('');
      
      addMessage(`I found ${data.products.length} products:`, 'bot');
      addMessage(productsHtml, 'bot', null, true);
    } else {
      addMessage('I couldn\'t find any products matching your search. Could you try a different query?', 'bot');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    addMessage('Sorry, I encountered an error while searching for products. Please try again later.', 'bot');
  } finally {
    input.disabled = false;
    input.focus();
  }
}

// Function to add a message to the chat
function addMessage(text, sender, id = null, isHtml = false) {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return null;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  
  if (id) {
    messageDiv.id = id;
  }
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  if (isHtml) {
    contentDiv.innerHTML = text;
  } else {
    contentDiv.textContent = text;
  }
  
  messageDiv.appendChild(contentDiv);
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageDiv;
}

// Toggle chat visibility
function toggleChat() {
  if (!chatContainer) {
    createChatInterface();
  } else {
    chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
    
    // Focus input when showing chat
    if (chatContainer.style.display !== 'none') {
      const input = document.getElementById('chat-input');
      if (input) {
        input.focus();
      }
    }
  }
}

// Initialize when the page loads
debugLog('Content script loaded');

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  debugLog('Message received:', request);
  
  if (request.action === 'toggleChat') {
    toggleChat();
    sendResponse({ status: 'success' });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'ping') {
    sendResponse({ status: 'pong' });
    return true;
  }
  
  return true;
});

// Initialize chat when the content script loads
createChatInterface();

// Make toggleChat available globally
window.toggleChat = toggleChat;

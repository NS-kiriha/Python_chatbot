document.addEventListener("DOMContentLoaded", () => {
  const chatBody = document.getElementById("chat-body");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  function addMessage(content, sender = "bot") {
    const msg = document.createElement("div");
    msg.classList.add("message", sender);

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.innerHTML = content;
    msg.appendChild(bubble);

    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    chatInput.value = "";

    const loadingMsg = document.createElement("div");
    loadingMsg.classList.add("message", "bot");
    loadingMsg.innerHTML = '<div class="bubble">Searching...</div>';
    chatBody.appendChild(loadingMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const response = await fetch("http://127.0.0.1:5201/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });

      const data = await response.json();
      loadingMsg.remove();

      if (data.status !== "success" || !data.products?.length) {
        addMessage("Sorry, I couldn’t find any matching products.", "bot");
        return;
      }

      const productCards = data.products
        .map(
          (p) => `
          <div class="product-card">
            <img src="${p.image || 'https://via.placeholder.com/80'}" alt="Product">
            <div class="product-info">
              <div class="title">${p.title}</div>
              <div class="price">${p.price || "N/A"}</div>
              <a href="${p.url}" target="_blank">View</a>
            </div>
          </div>
        `
        )
        .join("");

      addMessage(`<div class="product-list">${productCards}</div>`, "bot");
    } catch (error) {
      loadingMsg.remove();
      console.error(error);
      addMessage("⚠️ Failed to connect to the backend.", "bot");
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});
// // Chat interface functionality
// console.log('Loading chat interface...');

// // Initialize chat when interface is ready
// (function initializeChat() {
//   console.log('Chat script loaded, waiting for interface...');
  
//   // Listen for interface ready event
//   document.addEventListener('chatInterfaceReady', function initChatInterface() {
//     console.log('Initializing chat interface...');

//     // Get DOM elements at the top
//     const chatContainer = document.getElementById('chat-container');
//     const chatBubble = document.getElementById('chat-bubble');
//     const minimizeBtn = document.getElementById('minimize-btn');
//     const closeBtn = document.getElementById('close-btn');
//     const chatInput = document.getElementById('chat-input');
//     const sendBtn = document.getElementById('send-btn');
//     const chatMessages = document.getElementById('chat-messages');

//     // Ensure the script only runs once
//     if (window.chatInitialized) {
//       console.log('Chat already initialized, skipping...');
//       return;
//     }
//     window.chatInitialized = true;

//     // Add event listeners for minimize and close buttons
//     if (minimizeBtn) {
//       minimizeBtn.addEventListener('click', (e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         toggleChat();
//       });
//     }
//     if (closeBtn) {
//       closeBtn.addEventListener('click', (e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         toggleChat();
//       });
//     }
  
//   // Listen for toggle messages from the content script
//   if (chrome.runtime && chrome.runtime.onMessage) {
//     chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//       if (request.action === 'toggleChat') {
//         toggleChat();
//       }
//     });
//   }
  
//   // Make chat draggable
//   if (chatContainer) {
//     const chatHeader = chatContainer.querySelector('.chat-header');
//     if (chatHeader) {
//       chatHeader.addEventListener('mousedown', (e) => {
//         if (e.target === chatHeader || e.target === chatHeader.querySelector('span')) {
//           isDragging = true;
//           offsetX = e.clientX - chatContainer.getBoundingClientRect().left;
//           offsetY = e.clientY - chatContainer.getBoundingClientRect().top;
//           chatContainer.style.cursor = 'grabbing';
//         }
//       });
      
//       document.addEventListener('mousemove', (e) => {
//         if (!isDragging) return;
        
//         const x = e.clientX - offsetX;
//         const y = e.clientY - offsetY;
        
//         chatContainer.style.left = `${x}px`;
//         chatContainer.style.top = `${y}px`;
//         chatContainer.style.right = 'auto';
//         chatContainer.style.bottom = 'auto';
//       });
      
//       document.addEventListener('mouseup', () => {
//         isDragging = false;
//         chatContainer.style.cursor = 'default';
//       });
//     }
//   }
  
//   // Function to open product list in a new tab
//   function openProductList(products, recommendations = []) {
//     const productListUrl = chrome.runtime.getURL('product_list.html') + 
//       `?searchResults=${encodeURIComponent(JSON.stringify(products))}` +
//       `&recommendations=${encodeURIComponent(JSON.stringify(recommendations))}`;
//     window.open(productListUrl, '_blank');
//   }

//   // Handle sending messages
//   async function sendMessage() {
//     const message = chatInput.value.trim();
//     if (!message) return;
//     chatInput.disabled = true;
//     sendBtn.disabled = true;
//     addMessage(message, 'user');
//     chatInput.value = '';
//     const typingId = showTypingIndicator();
//     try {
//       // Trigger product search through content script
//       // Dispatch event to content script
//       document.dispatchEvent(new CustomEvent('productSearchRequest', {
//         detail: {
//           query: message,
//           typingId: typingId
//         }
//       }));
      
//       // Wait for response from content script
//       const products = await new Promise((resolve, reject) => {
//         const timeout = setTimeout(() => {
//           reject(new Error('Search request timed out'));
//         }, 30000); // 30 second timeout
        
//         const handleResponse = (e) => {
//           clearTimeout(timeout);
//           document.removeEventListener('productSearchResult', handleResponse);
          
//           const { products, error } = e.detail;
//           if (error) {
//             reject(new Error(error));
//           } else {
//             resolve(products || []);
//           }
//         };
        
//         document.addEventListener('productSearchResult', handleResponse);
//       });
//       // Send query and products to backend
//       let data;
//       try {
//         data = await apiRequest('search', { query: message, products });
//         console.log('Search response (via background):', data);
//       } catch (err) {
//         console.error('Search request failed (via background):', err);
//         if (err.message && err.message.includes('Failed to fetch')) {
//           throw new Error('Could not connect to server. Please make sure the backend is running.');
//         }
//         throw err;
//       }
//       // Remove typing indicator
//       const typingElement = document.getElementById(typingId);
//       if (typingElement) typingElement.remove();
//       // Add bot response
//       if (data.products && data.products.length > 0) {
//         const productMessage = document.createElement('div');
//         productMessage.className = 'message bot';
//         const displayedProducts = data.products.slice(0, 2);
//         const hasMoreProducts = data.products.length > 2;
//         let productsHtml = `
//           <div class="products-container">
//             ${displayedProducts.map((product, index) => `
//               <div class="product-item">
//                 <div class="product-content">
//                   ${product.image ? `
//                     <div class="product-image">
//                       <img src="${product.image}" alt="${product.title}" onerror="this.style.display='none'">
//                     </div>
//                   ` : ''}
//                   <div class="product-details">
//                     <h3 class="product-title">${product.title}</h3>
//                     ${product.price ? `<div class="product-price">${product.price}</div>` : ''}
//                     ${product.source ? `<div class="product-source">${product.source}</div>` : ''}
//                     <a href="${product.url}" target="_blank" rel="noopener noreferrer" class="view-product-btn">
//                       View on ${product.source || 'Store'}
//                     </a>
//                   </div>
//                 </div>
//                 ${product.url ? `
//                   <div class="product-url">
//                     <a href="${product.url}" target="_blank" rel="noopener noreferrer">
//                       ${product.url}
//                     </a>
//                   </div>
//                 ` : ''}
//               </div>
//             `).join('')}
//           </div>
//         `;
//         const viewAllButton = hasMoreProducts ? `
//           <div class="view-all-container">
//             <button id="view-all-btn">View All ${data.products.length} Products</button>
//           </div>
//         ` : '';
//         productMessage.innerHTML = `
//           <div class="message-content">
//             Here are some products that match your search:
//             ${productsHtml}
//             ${viewAllButton}
//           </div>
//         `;
//         chatMessages.appendChild(productMessage);
//         if (hasMoreProducts) {
//           setTimeout(() => {
//             const viewAllBtn = document.getElementById('view-all-btn');
//             if (viewAllBtn) {
//               viewAllBtn.addEventListener('click', () => {
//                 openProductList(data.products, data.recommendations || []);
//               });
//             }
//           }, 0);
//         }
//       } else {
//         addMessage("I couldn't find any products matching your search. Try different keywords.", 'bot');
//       }
//     } catch (error) {
//       console.error('Search error:', error);
//       // Log additional debug info if available
//       if (error.stack) {
//         console.debug('Error stack:', error.stack);
//       }
//       const typingElement = document.getElementById(typingId);
//       if (typingElement) typingElement.remove();
//       let errorMessage = "Sorry, I encountered an error while processing your request. ";
//       if (!navigator.onLine) {
//         errorMessage += "Please check your internet connection.";
//       } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
//         errorMessage += "Unable to connect to the server (http://localhost:5201). Make sure the backend server is running.";
//       } else if (error.message.includes('parse')) {
//         errorMessage += "Received invalid response from server. Please check server logs.";
//       } else if (error.message.includes('status: 500')) {
//         errorMessage += "Server encountered an error. Please check server logs.";
//       } else if (error.message.includes('status: 404')) {
//         errorMessage += "Server endpoint not found. Please check server configuration.";
//       } else {
//         errorMessage += error.message;
//       }
//       addMessage(errorMessage, 'bot');
//     } finally {
//       chatInput.disabled = false;
//       sendBtn.disabled = false;
//       chatMessages.scrollTop = chatMessages.scrollHeight;
//     }
//   }
  
//   // Listen for product search results from content script
//   document.addEventListener('productSearchResult', function (e) {
//     const { products, error, typingId, recommendations } = e.detail;
//     // Remove typing indicator
//     const typingElement = document.getElementById(typingId);
//     if (typingElement) typingElement.remove();
//     if (error) {
//       addMessage(error, 'bot');
//       chatInput.disabled = false;
//       sendBtn.disabled = false;
//       chatMessages.scrollTop = chatMessages.scrollHeight;
//       return;
//     }
//     if (products && products.length > 0) {
//       const productMessage = document.createElement('div');
//       productMessage.className = 'message bot';
//       const displayedProducts = products.slice(0, 2);
//       const hasMoreProducts = products.length > 2;
//       let productsHtml = `
//         <div class="products-container">
//           ${displayedProducts.map((product, index) => `
//             <div class="product-item">
//               <div class="product-content">
//                 ${product.image ? `
//                   <div class="product-image">
//                     <img src="${product.image}" alt="${product.title}" onerror="this.style.display='none'">
//                   </div>
//                 ` : ''}
//                 <div class="product-details">
//                   <h3 class="product-title">${product.title}</h3>
//                   ${product.price ? `<div class="product-price">${product.price}</div>` : ''}
//                   ${product.source ? `<div class="product-source">${product.source}</div>` : ''}
//                   <a href="${product.url}" target="_blank" rel="noopener noreferrer" class="view-product-btn">
//                     View on ${product.source || 'Store'}
//                   </a>
//                 </div>
//               </div>
//               ${product.url ? `
//                 <div class="product-url">
//                   <a href="${product.url}" target="_blank" rel="noopener noreferrer">
//                     ${product.url}
//                   </a>
//                 </div>
//               ` : ''}
//             </div>
//           `).join('')}
//         </div>
//       `;
//       const viewAllButton = hasMoreProducts ? `
//         <div class="view-all-container">
//           <button id="view-all-btn">View All ${products.length} Products</button>
//         </div>
//       ` : '';
//       productMessage.innerHTML = `
//         <div class="message-content">
//           Here are some products that match your search:
//           ${productsHtml}
//           ${viewAllButton}
//         </div>
//       `;
//       chatMessages.appendChild(productMessage);
//       if (hasMoreProducts) {
//         setTimeout(() => {
//           const viewAllBtn = document.getElementById('view-all-btn');
//           if (viewAllBtn) {
//             viewAllBtn.addEventListener('click', () => {
//               openProductList(products, recommendations || []);
//             });
//           }
//         }, 0);
//       }
//     } else {
//       addMessage("I couldn't find any products matching your search. Try different keywords.", 'bot');
//     }
//     chatInput.disabled = false;
//     sendBtn.disabled = false;
//     chatMessages.scrollTop = chatMessages.scrollHeight;
//   });

//   // Send message on button click or Enter key
//   if (sendBtn) {
//     sendBtn.addEventListener('click', sendMessage);
//   }
//   if (chatInput) {
//     chatInput.addEventListener('keypress', (e) => {
//       if (e.key === 'Enter') {
//         sendMessage();
//       }
//     });
//   }
  
//   // Helper function to add a message to the chat
//   function addMessage(text, sender) {
//     const messageDiv = document.createElement('div');
//     messageDiv.className = `message ${sender}`;
//     messageDiv.innerHTML = `<div class="message-content">${text}</div>`;
//     chatMessages.appendChild(messageDiv);
//     chatMessages.scrollTop = chatMessages.scrollHeight;
//   }
  
//   // Show typing indicator
//   function showTypingIndicator() {
//     const typingId = 'typing-' + Date.now();
//     const typingDiv = document.createElement('div');
//     typingDiv.className = 'typing-indicator';
//     typingDiv.id = typingId;
//     typingDiv.innerHTML = `
//       <div class="typing-dot"></div>
//       <div class="typing-dot"></div>
//       <div class="typing-dot"></div>
//     `;
    
//     const messageDiv = document.createElement('div');
//     messageDiv.className = 'message bot';
//     messageDiv.appendChild(typingDiv);
    
//     chatMessages.appendChild(messageDiv);
//     chatMessages.scrollTop = chatMessages.scrollHeight;
    
//     return typingId;
//   }
// });
// }());
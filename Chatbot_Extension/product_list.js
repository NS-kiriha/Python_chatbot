// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const searchResults = JSON.parse(decodeURIComponent(urlParams.get('searchResults') || '[]'));
const recommendations = JSON.parse(decodeURIComponent(urlParams.get('recommendations') || '[]'));

// DOM elements
const searchResultsContainer = document.getElementById('search-results');
const recommendationsContainer = document.getElementById('recommendations');
const backLink = document.getElementById('back-link');

// Back to chat functionality
backLink.addEventListener('click', (e) => {
  e.preventDefault();
  window.close();
  // Focus the chat window if it's still open
  chrome.runtime.sendMessage({ action: 'focusChat' });
});

// Render product cards
function renderProducts(products, container) {
  if (!products || products.length === 0) {
    container.innerHTML = '<div class="no-products">No products found</div>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="product-card">
      ${product.image ? `
        <div class="product-image">
          <img src="${product.image}" alt="${product.title}" onerror="this.style.display='none'">
        </div>
      ` : ''}
      <div class="product-details">
        <h3 class="product-title">
          <a href="${product.url}" target="_blank" rel="noopener noreferrer">
            ${product.title}
          </a>
        </h3>
        ${product.price ? `<div class="product-price">${product.price}</div>` : ''}
        ${product.source ? `<div class="product-source">${product.source}</div>` : ''}
        <a href="${product.url}" target="_blank" rel="noopener noreferrer" class="view-product-btn">
          View Product
        </a>
      </div>
    </div>
  `).join('');
}

// Initialize the page
function init() {
  // Render search results
  renderProducts(searchResults, searchResultsContainer);
  
  // Render recommendations
  renderProducts(recommendations, recommendationsContainer);
  
  // Set the page title with the number of results
  if (searchResults.length > 0) {
    document.title = `${searchResults.length} Product${searchResults.length !== 1 ? 's' : ''} Found | Product Finder`;
  }
}

// Start the application
init();

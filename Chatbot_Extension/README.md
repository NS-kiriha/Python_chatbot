# E-commerce Product Finder Extension

A browser extension that helps you find products matching your search query on e-commerce websites.

## Features

- Scans the current e-commerce page for products
- Matches products based on your search query
- Displays relevant products with titles, prices, and direct links
- Works on most major e-commerce sites

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your browser toolbar

## How to Use

1. Navigate to any e-commerce website (e.g., Amazon, eBay, etc.)
2. Click on the extension icon in your browser toolbar
3. Enter your search query in the input field
4. Click "Search Products"
5. The extension will display matching products from the current page
6. Click on any result to visit the product page

## Supported Websites

The extension should work on most e-commerce websites, including but not limited to:
- Amazon
- eBay
- Walmart
- Best Buy
- And many more...

## How It Works

The extension scans the current webpage for common e-commerce product patterns and:
1. Identifies product containers
2. Extracts product titles, prices, and URLs
3. Matches products against your search query
4. Ranks results by relevance
5. Displays the top matching products

## Development

### File Structure

- `manifest.json` - Extension configuration
- `popup.html` - Popup UI
- `popup.js` - Popup logic
- `content.js` - Content script that runs on web pages
- `background.js` - Background script for extension events

### Testing

1. Make your changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes on an e-commerce site

## License

This project is open source and available under the MIT License.
"# Python_chatbot" 

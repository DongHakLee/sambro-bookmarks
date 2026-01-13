// Content script for Sambro Bookmarks
// This script runs on all pages and can extract metadata

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getMetadata') {
    const metadata = extractMetadata();
    sendResponse(metadata);
  } else if (request.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ selectedText });
  }
  return true;
});

function extractMetadata() {
  const getMetaContent = (name) => {
    const meta = document.querySelector(`meta[property="${name}"]`) ||
                 document.querySelector(`meta[name="${name}"]`);
    return meta ? meta.content : null;
  };

  return {
    title: document.title,
    description: getMetaContent('og:description') ||
                 getMetaContent('description') || '',
    ogImage: getMetaContent('og:image') || '',
    favicon: document.querySelector('link[rel*="icon"]')?.href ||
             `${window.location.origin}/favicon.ico`,
    url: window.location.href
  };
}

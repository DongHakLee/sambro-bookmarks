// Supabase configuration
const SUPABASE_URL = 'https://sgywqmbkblvnfxlgdocr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lyxT1c3pdRkLamvfw6PUQg_UYcLRu0p';

// DOM elements
const form = document.getElementById('bookmarkForm');
const urlInput = document.getElementById('url');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const noteInput = document.getElementById('note');
const saveBtn = document.getElementById('saveBtn');
const statusDiv = document.getElementById('status');
const openDashboard = document.getElementById('openDashboard');

// Get current tab info when popup opens
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Extract metadata from current page
async function getPageMetadata(tab) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
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
                   `${window.location.origin}/favicon.ico`
        };
      }
    });
    return result.result;
  } catch (error) {
    console.error('Error getting metadata:', error);
    return {
      title: tab.title || '',
      description: '',
      ogImage: '',
      favicon: ''
    };
  }
}

// Save bookmark to Supabase
async function saveBookmark(bookmark) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/bookmarks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(bookmark)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save bookmark');
  }

  return response.json();
}

// Show status message
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

// Initialize popup
async function init() {
  const tab = await getCurrentTab();
  const metadata = await getPageMetadata(tab);

  urlInput.value = tab.url;
  titleInput.value = metadata.title;
  descriptionInput.value = metadata.description;

  // Store metadata for later
  form.dataset.ogImage = metadata.ogImage;
  form.dataset.favicon = metadata.favicon;
}

// Handle form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  statusDiv.className = 'status hidden';

  try {
    const bookmark = {
      url: urlInput.value,
      title: titleInput.value || null,
      description: descriptionInput.value || null,
      note: noteInput.value || null,
      og_image: form.dataset.ogImage || null,
      favicon_url: form.dataset.favicon || null
    };

    await saveBookmark(bookmark);
    showStatus('Bookmark saved!', 'success');
    
    // Close popup after short delay
    setTimeout(() => window.close(), 1000);
  } catch (error) {
    console.error('Error:', error);
    showStatus(error.message || 'Failed to save', 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Bookmark';
  }
});

// Open dashboard
openDashboard.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://web-lilac-two-28.vercel.app' });
});

// Initialize
init();

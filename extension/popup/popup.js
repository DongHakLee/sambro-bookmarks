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
const closeBtn = document.getElementById('closeBtn');
const bookmarksList = document.getElementById('bookmarksList');

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

        const metadata = {
          title: document.title,
          description: getMetaContent('og:description') ||
                       getMetaContent('description') || '',
          ogImage: getMetaContent('og:image') || '',
          favicon: document.querySelector('link[rel*="icon"]')?.href ||
                   `${window.location.origin}/favicon.ico`
        };

        return metadata;
      }
    });
    return result.result;
  } catch (error) {
    console.error('[Sambro] Error getting metadata:', error);
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

// Fetch bookmarks from Supabase
async function fetchBookmarks() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/bookmarks?order=created_at.desc&limit=10`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch bookmarks');
  }

  return response.json();
}

// Render bookmarks list
function renderBookmarks(bookmarks) {
  if (!bookmarks || bookmarks.length === 0) {
    bookmarksList.innerHTML = '<div class="bookmarks-empty">No bookmarks yet</div>';
    return;
  }

  bookmarksList.innerHTML = bookmarks
    .map(
      (bookmark) => `
    <div class="bookmark-item" data-url="${bookmark.url}">
      <img
        class="bookmark-item-img"
        src="${bookmark.og_image || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%23f0f0f0%22 width=%2240%22 height=%2240%22/></svg>'}"
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%23f0f0f0%22 width=%2240%22 height=%2240%22/></svg>'"
        alt=""
      >
      <div class="bookmark-item-info">
        <div class="bookmark-item-title">
          ${bookmark.favicon_url ? `<img class="bookmark-item-favicon" src="${bookmark.favicon_url}" onerror="this.style.display='none'">` : ''}
          <span>${escapeHtml(bookmark.title || 'Untitled')}</span>
        </div>
        <div class="bookmark-item-url">${escapeHtml(bookmark.url)}</div>
        ${bookmark.note ? `<div class="bookmark-item-note">${escapeHtml(bookmark.note)}</div>` : ''}
      </div>
    </div>
  `
    )
    .join('');

  // Add click handlers
  document.querySelectorAll('.bookmark-item').forEach((item) => {
    item.addEventListener('click', () => {
      chrome.tabs.create({ url: item.dataset.url });
    });
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load and display bookmarks
async function loadBookmarks() {
  try {
    const bookmarks = await fetchBookmarks();
    renderBookmarks(bookmarks);
  } catch (error) {
    console.error('[Sambro] Error loading bookmarks:', error);
    bookmarksList.innerHTML = '<div class="bookmarks-empty">Failed to load bookmarks</div>';
  }
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

  console.log('[Sambro] Init - OG Image:', metadata.ogImage);
  console.log('[Sambro] Init - Favicon:', metadata.favicon);

  // Load bookmarks list
  loadBookmarks();
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
      og_image: form.dataset.ogImage,
      favicon_url: form.dataset.favicon
    };

    console.log('[Sambro] Saving bookmark:', bookmark);
    await saveBookmark(bookmark);
    showStatus('Bookmark saved!', 'success');

    // Refresh bookmarks list
    loadBookmarks();

    // Close popup after short delay
    setTimeout(() => window.close(), 1000);
  } catch (error) {
    console.error('[Sambro] Error:', error);
    showStatus(error.message || 'Failed to save', 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Bookmark';
  }
});

// Open dashboard
openDashboard.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://sambro-bookmarks.vercel.app' });
});

// Close popup
closeBtn.addEventListener('click', () => {
  window.close();
});

// Initialize
init();

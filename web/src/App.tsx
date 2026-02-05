import { useState, useEffect } from 'react';
import { getBookmarks, deleteBookmark, searchBookmarks, Bookmark } from './lib/supabase';
import BookmarkCard from './components/BookmarkCard';
import AddBookmarkForm from './components/AddBookmarkForm';
import PromptList from './components/PromptList';
import CreatePromptForm from './components/CreatePromptForm';

type TabType = 'bookmarks' | 'prompts';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('bookmarks');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddPromptForm, setShowAddPromptForm] = useState(false);

  const loadBookmarks = async () => {
    setIsLoading(true);
    try {
      const data = searchQuery
        ? await searchBookmarks(searchQuery)
        : await getBookmarks();
      setBookmarks(data);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookmarks') {
      loadBookmarks();
    }
  }, [searchQuery, activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this bookmark?')) {
      try {
        await deleteBookmark(id);
        setBookmarks(bookmarks.filter(b => b.id !== id));
      } catch (error) {
        console.error('Error deleting bookmark:', error);
      }
    }
  };

  const handleBookmarkAdded = () => {
    setShowAddForm(false);
    loadBookmarks();
  };

  const isBookmarks = activeTab === 'bookmarks';

  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-grid-pattern noise-overlay">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-[40%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] rounded-full blur-[120px] transition-all duration-1000 ${
            isBookmarks
              ? 'bg-indigo-500/10'
              : 'bg-teal-500/10'
          }`}
        />
      </div>

      {/* Header */}
      <header className="glass-strong sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                isBookmarks
                  ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-teal-500/25'
              }`}>
                {isBookmarks ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" x2="8" y1="13" y2="13"/>
                    <line x1="16" x2="8" y1="17" y2="17"/>
                  </svg>
                )}
              </div>
              <h1 className="font-display text-2xl font-bold text-white/95">
                Sambro
              </h1>
            </div>

            {/* Add Button */}
            <button
              onClick={() => isBookmarks ? setShowAddForm(true) : setShowAddPromptForm(true)}
              className={`group relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                isBookmarks
                  ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40'
              }`}
              aria-label={`Add ${isBookmarks ? 'bookmark' : 'prompt'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white transition-transform duration-300 group-hover:rotate-90">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex justify-center">
            <div className="glass inline-flex rounded-xl p-1.5 gap-1">
              <button
                onClick={() => handleTabChange('bookmarks')}
                className={`relative px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                  isBookmarks
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {isBookmarks && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg animate-fade-in" />
                )}
                <span className="relative flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                  </svg>
                  Bookmarks
                </span>
              </button>
              <button
                onClick={() => handleTabChange('prompts')}
                className={`relative px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                  !isBookmarks
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {!isBookmarks && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg animate-fade-in" />
                )}
                <span className="relative flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Prompts
                </span>
              </button>
            </div>
          </div>

          {/* Search Bar - Bookmarks only */}
          {isBookmarks && (
            <div className="mt-6 animate-slide-down">
              <div className="relative max-w-2xl mx-auto">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search bookmarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 input-glass"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative">
        {isBookmarks ? (
          isLoading ? (
            <div className="text-center py-20 animate-fade-in">
              <div className={`w-14 h-14 mx-auto rounded-full border-2 border-white/10 border-t-indigo-500 animate-spin`} />
              <p className="mt-6 text-white/40 font-medium">Loading bookmarks...</p>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-20 animate-slide-up">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass mb-6">
                <svg
                  className="w-10 h-10 text-white/30"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
                  />
                </svg>
              </div>
              <p className="text-white/50 font-medium">
                {searchQuery ? 'No bookmarks match your search' : 'No bookmarks yet'}
              </p>
              <p className="mt-2 text-white/30 text-sm">
                {searchQuery ? 'Try a different search term' : 'Click + to add your first bookmark'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {bookmarks.map((bookmark, index) => (
                <div
                  key={bookmark.id}
                  className="animate-slide-up opacity-0"
                  style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <BookmarkCard
                    bookmark={bookmark}
                    onDelete={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(bookmark.id);
                    }}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <PromptList embedded={true} />
        )}
      </main>

      {/* Modals */}
      {showAddForm && (
        <AddBookmarkForm
          onClose={() => setShowAddForm(false)}
          onSuccess={handleBookmarkAdded}
        />
      )}

      {showAddPromptForm && (
        <CreatePromptForm
          onClose={() => setShowAddPromptForm(false)}
          onSuccess={() => {
            setShowAddPromptForm(false);
          }}
        />
      )}
    </div>
  );
}

export default App;

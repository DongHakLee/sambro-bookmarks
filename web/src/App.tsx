import { useState, useEffect } from 'react';
import { getBookmarks, deleteBookmark, searchBookmarks, Bookmark } from './lib/supabase';
import BookmarkCard from './components/BookmarkCard';
import AddBookmarkForm from './components/AddBookmarkForm';

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

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
    loadBookmarks();
  }, [searchQuery]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Sambro Bookmarks
            </h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              aria-label="Add bookmark"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
            </button>
          </div>
          <div className="mt-6">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
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
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md text-white placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-14 w-14 border-3 border-slate-700 border-t-blue-500 mx-auto"></div>
            <p className="mt-6 text-slate-400 font-medium">Loading bookmarks...</p>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 mb-4">
              <svg
                className="w-10 h-10 text-slate-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <p className="text-slate-400 font-medium">No bookmarks found. Add your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(bookmark.id);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {showAddForm && (
        <AddBookmarkForm
          onClose={() => setShowAddForm(false)}
          onSuccess={handleBookmarkAdded}
        />
      )}
    </div>
  );
}

export default App;

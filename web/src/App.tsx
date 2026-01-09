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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Sambro Bookmarks</h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Add Bookmark
            </button>
          </div>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookmarks...</p>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No bookmarks found. Add your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={() => handleDelete(bookmark.id)}
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

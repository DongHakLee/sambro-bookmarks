import { Bookmark } from '../lib/supabase';

interface Props {
  bookmark: Bookmark;
  onDelete: () => void;
}

export default function BookmarkCard({ bookmark, onDelete }: Props) {
  const defaultImage = 'https://via.placeholder.com/300x150?text=No+Image';
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {/* OG Image */}
      <div className="h-40 bg-gray-200 overflow-hidden">
        <img
          src={bookmark.og_image || defaultImage}
          alt={bookmark.title || 'Bookmark'}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-2">
          {bookmark.favicon_url && (
            <img
              src={bookmark.favicon_url}
              alt=""
              className="w-4 h-4 mt-1 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <h3 className="font-semibold text-gray-900 line-clamp-2">
            {bookmark.title || bookmark.url}
          </h3>
        </div>

        {bookmark.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {bookmark.description}
          </p>
        )}

        {bookmark.note && (
          <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
            {bookmark.note}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-[200px]"
          >
            {new URL(bookmark.url).hostname}
          </a>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-400">
          {new Date(bookmark.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

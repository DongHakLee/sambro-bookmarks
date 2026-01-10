import { Bookmark } from '../lib/supabase';

interface Props {
  bookmark: Bookmark;
  onDelete: (e: React.MouseEvent) => void;
}

export default function BookmarkCard({ bookmark, onDelete }: Props) {
  const defaultImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"%3E%3Crect width="300" height="150" fill="%231e293b"/%3E%3Ctext x="150" y="75" text-anchor="middle" fill="%2364748b" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-800 hover:border-blue-700 block"
    >
      {/* OG Image */}
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-850 overflow-hidden">
        <img
          src={bookmark.og_image || defaultImage}
          alt={bookmark.title || 'Bookmark'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title with favicon */}
        <div className="flex items-start gap-3">
          {bookmark.favicon_url && (
            <img
              src={bookmark.favicon_url}
              alt=""
              className="w-5 h-5 mt-0.5 flex-shrink-0 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <h3 className="font-semibold text-slate-100 line-clamp-2 flex-1">
            {bookmark.title || bookmark.url}
          </h3>
        </div>

        {/* Description */}
        {bookmark.description && (
          <p className="mt-2 text-sm text-slate-400 line-clamp-2">
            {bookmark.description}
          </p>
        )}

        {/* Note */}
        {bookmark.note && (
          <div className="mt-3 px-3 py-2 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-lg text-sm text-blue-300 border border-blue-800/50">
            {bookmark.note}
          </div>
        )}

        {/* Delete Button - Absolute positioned */}
        <button
          onClick={onDelete}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/90 hover:bg-red-600 text-slate-400 hover:text-white shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
          aria-label="Delete bookmark"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </a>
  );
}

import { Bookmark } from '../lib/supabase';

interface Props {
  bookmark: Bookmark;
  onDelete: (e: React.MouseEvent) => void;
}

export default function BookmarkCard({ bookmark, onDelete }: Props) {
  const defaultImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"%3E%3Crect width="300" height="150" fill="%23161622"/%3E%3Cpath d="M150 55 l-7 4 l-7-4 V45 a2 2 0 0 1 2-2 h10 a2 2 0 0 1 2 2 Z" fill="none" stroke="%234b5563" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,20)"%3E%3C/path%3E%3C/svg%3E';

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative card-glass overflow-hidden block"
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent" />
      </div>

      {/* OG Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#161622]">
        <img
          src={bookmark.og_image || defaultImage}
          alt={bookmark.title || 'Bookmark'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
        {/* Image overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-60" />

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white/60 opacity-0 group-hover:opacity-100 hover:bg-rose-500/80 hover:border-rose-400/50 hover:text-white transition-all duration-300"
          aria-label="Delete bookmark"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Domain badge + favicon */}
        <div className="flex items-center gap-2 mb-3">
          {bookmark.favicon_url && (
            <img
              src={bookmark.favicon_url}
              alt=""
              className="w-4 h-4 rounded flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <span className="text-xs font-medium text-white/40 truncate">
            {getDomainFromUrl(bookmark.url)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-white/90 line-clamp-2 leading-snug group-hover:text-white transition-colors duration-300">
          {bookmark.title || bookmark.url}
        </h3>

        {/* Description */}
        {bookmark.description && (
          <p className="mt-2 text-sm text-white/40 line-clamp-2 leading-relaxed">
            {bookmark.description}
          </p>
        )}

        {/* Note */}
        {bookmark.note && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-sm text-indigo-300/80 line-clamp-2">
              {bookmark.note}
            </p>
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </a>
  );
}

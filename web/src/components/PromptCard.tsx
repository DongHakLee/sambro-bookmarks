import { useState } from 'react';
import { PromptWithTags } from '../lib/prompt-types';

interface Props {
  prompt: PromptWithTags;
  onEdit: (prompt: PromptWithTags) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
  onTagClick?: (tag: string) => void;
}

export default function PromptCard({
  prompt,
  onEdit,
  onDelete,
  onTogglePin,
  onTagClick,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      onDelete(prompt.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  return (
    <div
      className="group relative card-glass overflow-hidden cursor-pointer"
      onClick={() => onEdit(prompt)}
      role="button"
      tabIndex={0}
      aria-label={`Edit prompt: ${prompt.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(prompt);
        }
      }}
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-teal-500/5 to-transparent" />
      </div>

      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Pin Indicator */}
            {prompt.is_pinned && (
              <div className="flex items-center gap-1.5 text-amber-400 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Pinned
                </span>
              </div>
            )}
            {/* Title */}
            <h3 className="font-semibold text-white/90 text-lg line-clamp-2 leading-snug group-hover:text-white transition-colors duration-300">
              {prompt.title}
            </h3>
            {/* Description */}
            {prompt.description && (
              <p className="mt-1 text-sm text-white/40 line-clamp-1">
                {prompt.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="px-4 pb-4">
        <div className="relative">
          <pre className="text-sm text-white/60 whitespace-pre-wrap font-sans line-clamp-4 bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
            {truncateContent(prompt.content)}
          </pre>
          {prompt.content.length > 150 && (
            <div className="absolute bottom-2 right-2 text-[10px] text-white/30 bg-[#0a0a0f]/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {prompt.content.length} chars
            </div>
          )}
        </div>

        {/* Tags */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {prompt.tags.map((tag) => (
              <button
                key={tag.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag.name);
                }}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-teal-500/10 text-teal-300/80 border border-teal-500/20 hover:bg-teal-500/20 hover:border-teal-500/30 transition-all duration-200"
                aria-label={`Filter by tag: ${tag.name}`}
              >
                <span className="text-teal-400/60 mr-1">#</span>
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* Date */}
        <div className="mt-3 flex items-center gap-3 text-xs text-white/30">
          <div className="flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{formatDate(prompt.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Copy Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className={`w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur-md border transition-all duration-200 ${
            copied
              ? 'bg-teal-500/80 border-teal-400/50 text-white'
              : 'bg-black/40 border-white/10 text-white/60 hover:bg-teal-500/80 hover:border-teal-400/50 hover:text-white'
          }`}
          aria-label="Copy prompt to clipboard"
          title="Copy to clipboard"
        >
          {copied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>

        {/* Toggle Pin Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(prompt.id);
          }}
          className={`w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur-md border transition-all duration-200 ${
            prompt.is_pinned
              ? 'bg-amber-500/80 border-amber-400/50 text-white'
              : 'bg-black/40 border-white/10 text-white/60 hover:bg-amber-500/80 hover:border-amber-400/50 hover:text-white'
          }`}
          aria-label={prompt.is_pinned ? 'Unpin prompt' : 'Pin prompt'}
          title={prompt.is_pinned ? 'Unpin' : 'Pin'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={prompt.is_pinned ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
          </svg>
        </button>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:bg-rose-500/80 hover:border-rose-400/50 hover:text-white transition-all duration-200"
          aria-label="Delete prompt"
          title="Delete"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}

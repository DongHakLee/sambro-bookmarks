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
      year: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  return (
    <div
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-emerald-200 cursor-pointer"
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
      {/* Header with Pin Indicator */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Pin Indicator */}
            {prompt.is_pinned && (
              <div className="flex items-center gap-1.5 text-emerald-600 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Pinned
                </span>
              </div>
            )}
            {/* Title */}
            <h3 className="font-bold text-gray-900 text-lg line-clamp-2">
              {prompt.title}
            </h3>
            {/* Description */}
            {prompt.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                {prompt.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Content Preview */}
        <div className="relative">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans line-clamp-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-100">
            {truncateContent(prompt.content)}
          </pre>
          {prompt.content.length > 150 && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/90 px-2 py-1 rounded-full">
              {prompt.content.length} chars
            </div>
          )}
        </div>

        {/* Tags */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {prompt.tags.map((tag) => (
              <button
                key={tag.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag.name);
                }}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200 hover:border-emerald-300 hover:from-emerald-100 hover:to-teal-100 transition-all duration-200"
                aria-label={`Filter by tag: ${tag.name}`}
              >
                <span className="mr-1">#</span>
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* Dates */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
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
            <span>Created {formatDate(prompt.created_at)}</span>
          </div>
          {prompt.updated_at !== prompt.created_at && (
            <div className="flex items-center gap-1">
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Updated {formatDate(prompt.updated_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Copy Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/90 hover:bg-emerald-500 text-gray-600 hover:text-white shadow-md transition-all duration-200 backdrop-blur-sm"
          aria-label="Copy prompt to clipboard"
          title="Copy to clipboard"
        >
          {copied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
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
          className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-md transition-all duration-200 backdrop-blur-sm ${
            prompt.is_pinned
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-white/90 hover:bg-amber-500 text-gray-600 hover:text-white'
          }`}
          aria-label={prompt.is_pinned ? 'Unpin prompt' : 'Pin prompt'}
          title={prompt.is_pinned ? 'Unpin' : 'Pin'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={prompt.is_pinned ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
          </svg>
        </button>

        {/* Edit Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(prompt);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/90 hover:bg-blue-500 text-gray-600 hover:text-white shadow-md transition-all duration-200 backdrop-blur-sm"
          aria-label="Edit prompt"
          title="Edit"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/90 hover:bg-red-500 text-gray-600 hover:text-white shadow-md transition-all duration-200 backdrop-blur-sm"
          aria-label="Delete prompt"
          title="Delete"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

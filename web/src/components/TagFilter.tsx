import { Tag } from '../lib/prompt-types';

interface Props {
  allTags: Tag[];
  selectedTagIds: number[];
  onTagToggle: (tagId: number) => void;
  onClearAll: () => void;
  maxDisplay?: number;
}

export default function TagFilter({
  allTags,
  selectedTagIds,
  onTagToggle,
  onClearAll,
  maxDisplay = 10,
}: Props) {
  const displayTags = allTags.slice(0, maxDisplay);
  const hasMoreTags = allTags.length > maxDisplay;

  if (allTags.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No tags available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Filter by Tags
        </h3>
        {selectedTagIds.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 underline transition-colors"
          >
            Clear all ({selectedTagIds.length})
          </button>
        )}
      </div>

      {/* Tag Pills */}
      <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
        {displayTags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);

          return (
            <button
              key={tag.id}
              onClick={() => onTagToggle(tag.id)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-emerald-300 hover:from-emerald-50 hover:to-teal-50'
                }
              `}
              aria-pressed={isSelected}
              aria-label={`Filter by tag: ${tag.name}${isSelected ? ' (selected)' : ''}`}
            >
              <span>#</span>
              <span>{tag.name}</span>
              {isSelected && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          );
        })}

        {/* More Tags Indicator */}
        {hasMoreTags && (
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm">
            +{allTags.length - maxDisplay} more
          </div>
        )}
      </div>

      {/* Selected Tags Summary */}
      {selectedTagIds.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
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
            <path d="M20 6 9 17 4 12" />
          </svg>
          <span>
            {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''} selected
          </span>
        </div>
      )}
    </div>
  );
}

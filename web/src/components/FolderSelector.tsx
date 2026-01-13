import { useState } from 'react';
import { FolderTree } from '../lib/prompt-types';

interface Props {
  folders: FolderTree[];
  selectedFolderId: number | null;
  onSelectFolder: (folderId: number | null) => void;
}

interface FolderNodeProps {
  folder: FolderTree;
  selectedFolderId: number | null;
  onSelectFolder: (folderId: number | null) => void;
  level: number;
}

function FolderNode({ folder, selectedFolderId, onSelectFolder, level }: FolderNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;

  return (
    <div className="folder-node">
      {/* Folder Button */}
      <button
        onClick={() => onSelectFolder(folder.id)}
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-200
          ${
            isSelected
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        aria-label={`Select folder: ${folder.name}${isSelected ? ' (selected)' : ''}`}
        aria-pressed={isSelected}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="w-5 h-5 flex items-center justify-center transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Folder Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={isSelected ? 'text-white' : 'text-amber-500'}
        >
          <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
        </svg>

        {/* Folder Name */}
        <span className="flex-1 text-sm font-medium truncate">
          {folder.name}
        </span>

        {/* Prompt Count */}
        {folder.prompt_count !== undefined && folder.prompt_count > 0 && (
          <span
            className={`
              text-xs px-2 py-0.5 rounded-full font-medium
              ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}
            `}
          >
            {folder.prompt_count}
          </span>
        )}
      </button>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="folder-children">
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderSelector({
  folders,
  selectedFolderId,
  onSelectFolder,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Filter by Folder
        </h3>
        {selectedFolderId !== null && (
          <button
            onClick={() => onSelectFolder(null)}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 underline transition-colors"
            aria-label="Clear folder filter"
          >
            Clear
          </button>
        )}
      </div>

      {/* "No Folder" Option */}
      <button
        onClick={() => onSelectFolder(null)}
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-200
          ${
            selectedFolderId === null
              ? 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-900 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          }
        `}
        aria-label="Show prompts without folder"
        aria-pressed={selectedFolderId === null}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={selectedFolderId === null ? 'text-gray-700' : 'text-gray-400'}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
        </svg>
        <span className="flex-1 text-sm">No Folder</span>
        {selectedFolderId === null && (
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

      {/* Folder Tree */}
      <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
        {folders.length === 0 ? (
          <div className="px-3 py-8 text-center text-gray-500 text-sm italic">
            No folders available
          </div>
        ) : (
          folders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              level={0}
            />
          ))
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}

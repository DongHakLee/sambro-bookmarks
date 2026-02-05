import { useState, useEffect } from 'react';
import { PromptWithTags, Folder, Tag } from '../lib/prompt-types';
import { getPrompts, deletePrompt, togglePromptPin, getFolders, getTags } from '../lib/prompts';
import PromptCard from './PromptCard';
import CreatePromptForm from './CreatePromptForm';

interface Props {
  initialSearch?: string;
  embedded?: boolean;
}

type SortOption = 'created_at' | 'updated_at' | 'title';
type SortOrder = 'asc' | 'desc';

export default function PromptList({ initialSearch = '', embedded = false }: Props) {
  const [prompts, setPrompts] = useState<PromptWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editPrompt, setEditPrompt] = useState<PromptWithTags | undefined>();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    total_pages: 0,
    has_more: false,
  });
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [searchQuery, selectedTags, selectedFolder, showPinnedOnly, sortBy, sortOrder, currentPage]);

  const loadInitialData = async () => {
    try {
      const [tagsData, foldersData] = await Promise.all([
        getTags(),
        getFolders(true),
      ]);
      setAllTags(tagsData);
      setFolders(foldersData as Folder[]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const response = await getPrompts({
        page: currentPage,
        limit: pagination.limit,
        search: searchQuery || undefined,
        folder_id: selectedFolder,
        tag_id: selectedTags.length > 0 ? selectedTags[0] : undefined,
        is_pinned: showPinnedOnly || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      setPrompts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePrompt(id);
      loadPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert('Failed to delete prompt');
    }
  };

  const handleTogglePin = async (id: number) => {
    try {
      await togglePromptPin(id);
      loadPrompts();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleEdit = (prompt: PromptWithTags) => {
    setEditPrompt(prompt);
    setShowCreateForm(true);
  };

  const handleTagClick = (tagName: string) => {
    const tag = allTags.find((t) => t.name === tagName);
    if (tag) {
      setSelectedTags((prev) =>
        prev.includes(tag.id)
          ? prev.filter((id) => id !== tag.id)
          : [...prev, tag.id]
      );
      setCurrentPage(1);
    }
  };

  const handlePromptCreated = () => {
    setShowCreateForm(false);
    setEditPrompt(undefined);
    loadPrompts();
    loadInitialData();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPrompts();
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedFolder(null);
    setShowPinnedOnly(false);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedTags.length > 0 || selectedFolder !== null || showPinnedOnly || searchQuery;

  const renderHeaderControls = () => (
    <div className="space-y-4 animate-slide-down">
      {/* Search Bar */}
      <form onSubmit={handleSearch}>
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
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 input-glass focus:border-teal-500 focus:ring-teal-500/20"
          />
        </div>
      </form>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Active Filters */}
        {selectedTags.map((tagId) => {
          const tag = allTags.find((t) => t.id === tagId);
          return tag ? (
            <button
              key={tag.id}
              onClick={() => {
                setSelectedTags((prev) => prev.filter((id) => id !== tagId));
                setCurrentPage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 text-sm font-medium hover:bg-teal-500/25 transition-colors"
            >
              #{tag.name}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          ) : null;
        })}

        {selectedFolder !== null && (
          <button
            onClick={() => {
              setSelectedFolder(null);
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-sm font-medium hover:bg-indigo-500/25 transition-colors"
          >
            {folders.find((f) => f.id === selectedFolder)?.name || 'Folder'}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}

        {showPinnedOnly && (
          <button
            onClick={() => {
              setShowPinnedOnly(false);
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-sm font-medium hover:bg-amber-500/25 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
            </svg>
            Pinned
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-white/40 hover:text-white/70 font-medium transition-colors"
          >
            Clear all
          </button>
        )}

        {/* Sort + Filter Controls */}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={selectedFolder || ''}
            onChange={(e) => {
              setSelectedFolder(e.target.value ? Number(e.target.value) : null);
              setCurrentPage(1);
            }}
            className="px-3 py-2 input-glass text-sm"
          >
            <option value="">All Folders</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setShowPinnedOnly(!showPinnedOnly);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
              showPinnedOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'glass text-white/60 hover:text-white/80'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={showPinnedOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="inline mr-1.5">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
            </svg>
            Pinned
          </button>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-') as [SortOption, SortOrder];
              setSortBy(field);
              setSortOrder(order);
              setCurrentPage(1);
            }}
            className="px-3 py-2 input-glass text-sm"
          >
            <option value="created_at-desc">Newest</option>
            <option value="created_at-asc">Oldest</option>
            <option value="updated_at-desc">Updated</option>
            <option value="title-asc">A-Z</option>
            <option value="title-desc">Z-A</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-14 h-14 mx-auto rounded-full border-2 border-white/10 border-t-teal-500 animate-spin" />
          <p className="mt-6 text-white/40 font-medium">Loading prompts...</p>
        </div>
      );
    }

    if (prompts.length === 0) {
      return (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-white/50 font-medium">
            {hasActiveFilters ? 'No prompts match your filters' : 'No prompts yet'}
          </p>
          <p className="mt-2 text-white/30 text-sm">
            {hasActiveFilters ? 'Try different filters' : 'Click + to create your first prompt'}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {prompts.map((prompt, index) => (
            <div
              key={prompt.id}
              className="animate-slide-up opacity-0"
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
            >
              <PromptCard
                prompt={prompt}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
                onTagClick={handleTagClick}
              />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg glass text-white/70 font-medium hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                let pageNum;
                if (pagination.total_pages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.total_pages - 2) {
                  pageNum = pagination.total_pages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                        : 'glass text-white/60 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(pagination.total_pages, prev + 1))}
              disabled={currentPage === pagination.total_pages}
              className="px-4 py-2 rounded-lg glass text-white/70 font-medium hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-6 text-center text-sm text-white/30">
          Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
          {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
          {pagination.total.toLocaleString()} prompts
        </div>
      </>
    );
  };

  if (embedded) {
    return (
      <>
        {renderHeaderControls()}
        {renderContent()}
        {showCreateForm && (
          <CreatePromptForm
            onClose={() => {
              setShowCreateForm(false);
              setEditPrompt(undefined);
            }}
            onSuccess={handlePromptCreated}
            editPrompt={editPrompt}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-grid-pattern">
      <header className="glass-strong sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <h1 className="font-display text-3xl font-bold gradient-text-teal">
              Prompts
            </h1>
            <button
              onClick={() => {
                setEditPrompt(undefined);
                setShowCreateForm(true);
              }}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
              aria-label="Create new prompt"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </button>
          </div>
          <div className="mt-6">
            {renderHeaderControls()}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {renderContent()}
      </main>

      {showCreateForm && (
        <CreatePromptForm
          onClose={() => {
            setShowCreateForm(false);
            setEditPrompt(undefined);
          }}
          onSuccess={handlePromptCreated}
          editPrompt={editPrompt}
        />
      )}
    </div>
  );
}

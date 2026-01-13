import { useState, useEffect } from 'react';
import { PromptWithTags, Folder, Tag } from '../lib/prompt-types';
import { getPrompts, deletePrompt, togglePromptPin, getFolders, getTags } from '../lib/prompts';
import PromptCard from './PromptCard';
import CreatePromptForm from './CreatePromptForm';

interface Props {
  initialSearch?: string;
  /** When true, renders without outer wrapper and header for embedding in App.tsx */
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

  // Header controls (title, add button, search, filters)
  const renderHeaderControls = () => (
    <>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mt-6">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md"
          />
        </div>
      </form>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* Tag Filter Pills */}
        {selectedTags.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Tags:</span>
            {selectedTags.map((tagId) => {
              const tag = allTags.find((t) => t.id === tagId);
              return tag ? (
                <button
                  key={tag.id}
                  onClick={() => {
                    setSelectedTags((prev) => prev.filter((id) => id !== tagId));
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-medium hover:bg-emerald-200 transition-colors"
                >
                  #{tag.name}
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
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              ) : null;
            })}
          </div>
        )}

        {/* Folder Filter */}
        {selectedFolder !== null && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Folder:</span>
            <button
              onClick={() => {
                setSelectedFolder(null);
                setCurrentPage(1);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              {folders.find((f) => f.id === selectedFolder)?.name || 'Unknown'}
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Pin Filter */}
        {showPinnedOnly && (
          <button
            onClick={() => {
              setShowPinnedOnly(false);
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-sm font-medium hover:bg-amber-200 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
            </svg>
            Pinned Only
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}

        {/* Clear Filters */}
        {(selectedTags.length > 0 || selectedFolder !== null || showPinnedOnly) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium underline transition-colors"
          >
            Clear all filters
          </button>
        )}

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Sort by:</label>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-') as [SortOption, SortOrder];
              setSortBy(field);
              setSortOrder(order);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200 bg-white"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="updated_at-desc">Recently Updated</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="mt-4 flex flex-wrap gap-3">
        {/* Folder Dropdown */}
        <select
          value={selectedFolder || ''}
          onChange={(e) => {
            setSelectedFolder(e.target.value ? Number(e.target.value) : null);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200 bg-white"
        >
          <option value="">All Folders</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>

        {/* Pin Toggle */}
        <button
          onClick={() => {
            setShowPinnedOnly(!showPinnedOnly);
            setCurrentPage(1);
          }}
          className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-200 ${
            showPinnedOnly
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300'
          }`}
        >
          {showPinnedOnly ? 'Showing Pinned Only' : 'Show All'}
        </button>
      </div>
    </>
  );

  return (
    <>
      {!embedded ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Prompt Manager
                </h1>
                <button
                  onClick={() => {
                    setEditPrompt(undefined);
                    setShowCreateForm(true);
                  }}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  aria-label="Create new prompt"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </button>
              </div>
              {renderHeaderControls()}
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-6 py-8">
            {isLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-14 w-14 border-3 border-emerald-200 border-t-emerald-600 mx-auto"></div>
                <p className="mt-6 text-gray-500 font-medium">Loading prompts...</p>
              </div>
            ) : prompts.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-4">
                  <svg
                    className="w-10 h-10 text-emerald-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">
                  {searchQuery || selectedTags.length > 0 || selectedFolder !== null || showPinnedOnly
                    ? 'No prompts match your filters'
                    : 'No prompts yet. Create your first one!'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onTogglePin={handleTogglePin}
                      onTagClick={handleTagClick}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
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
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
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
                      className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* Results Count */}
                <div className="mt-6 text-center text-sm text-gray-500">
                  Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
                  {pagination.total.toLocaleString()} prompts
                </div>
              </>
            )}
          </main>

          {/* Create/Edit Form Modal */}
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
      ) : (
        <>
          {/* Embedded mode: render header controls and content only */}
          <div className="space-y-4 animate-in fade-in duration-300">
            {renderHeaderControls()}
          </div>

          <div className="animate-in fade-in duration-300">
            {isLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-14 w-14 border-3 border-emerald-200 border-t-emerald-600 mx-auto"></div>
                <p className="mt-6 text-gray-500 font-medium">Loading prompts...</p>
              </div>
            ) : prompts.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-4">
                  <svg
                    className="w-10 h-10 text-emerald-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">
                  {searchQuery || selectedTags.length > 0 || selectedFolder !== null || showPinnedOnly
                    ? 'No prompts match your filters'
                    : 'No prompts yet. Create your first one!'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onTogglePin={handleTogglePin}
                      onTagClick={handleTagClick}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
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
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
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
                      className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* Results Count */}
                <div className="mt-6 text-center text-sm text-gray-500">
                  Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
                  {pagination.total.toLocaleString()} prompts
                </div>
              </>
            )}
          </div>

          {/* Create/Edit Form Modal */}
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
      )}
    </>
  );
}

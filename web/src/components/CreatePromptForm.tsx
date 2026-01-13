import { useState, useEffect } from 'react';
import { PromptWithTags, CreatePromptRequest, Folder } from '../lib/prompt-types';
import { createPrompt, updatePrompt, getFolders } from '../lib/prompts';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  editPrompt?: PromptWithTags;
}

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50000;
const MAX_TAGS = 10;

export default function CreatePromptForm({
  onClose,
  onSuccess,
  editPrompt,
}: Props) {
  const [title, setTitle] = useState(editPrompt?.title || '');
  const [content, setContent] = useState(editPrompt?.content || '');
  const [description, setDescription] = useState(editPrompt?.description || '');
  const [folderId, setFolderId] = useState<number | null>(
    editPrompt?.folder_id || null
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(
    editPrompt?.tags?.map((t) => t.name) || []
  );
  const [isPinned, setIsPinned] = useState(editPrompt?.is_pinned || false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const data = (await getFolders(true)) as Folder[];
        setFolders(data);
      } catch (error) {
        console.error('Error loading folders:', error);
      } finally {
        setIsLoadingFolders(false);
      }
    };
    loadFolders();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > MAX_TITLE_LENGTH) {
      newErrors.title = `Title must be less than ${MAX_TITLE_LENGTH} characters`;
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.length > MAX_CONTENT_LENGTH) {
      newErrors.content = `Content must be less than ${MAX_CONTENT_LENGTH} characters`;
    }

    if (tags.length > MAX_TAGS) {
      newErrors.tags = `Maximum ${MAX_TAGS} tags allowed`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const promptData: CreatePromptRequest = {
        title: title.trim(),
        content: content.trim(),
        description: description.trim() || null,
        folder_id: folderId,
        tags: tags.length > 0 ? tags : undefined,
        is_pinned: isPinned,
      };

      if (editPrompt) {
        await updatePrompt(editPrompt.id, promptData);
      } else {
        await createPrompt(promptData);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving prompt:', error);
      setErrors({
        form:
          error.message || 'Failed to save prompt. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();

    if (!trimmedTag) return;
    if (tags.includes(trimmedTag)) {
      setErrors({ tags: 'Tag already exists' });
      return;
    }
    if (tags.length >= MAX_TAGS) {
      setErrors({ tags: `Maximum ${MAX_TAGS} tags allowed` });
      return;
    }

    setTags([...tags, trimmedTag]);
    setTagInput('');
    setErrors({});
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    setErrors({});
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const getTagSuggestions = () => {
    if (!tagInput.trim()) return [];
    // In a real app, you might fetch suggestions from the API
    return [];
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2
              id="form-title"
              className="text-xl font-bold text-white"
            >
              {editPrompt ? 'Edit Prompt' : 'Create New Prompt'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              aria-label="Close form"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Form Error */}
          {errors.form && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {errors.form}
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="Enter prompt title..."
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 ${
                errors.title
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-200 focus:border-emerald-500'
              }`}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1.5 text-sm text-red-600">
                {errors.title}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 text-right">
              {title.length} / {MAX_TITLE_LENGTH}
            </p>
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Content *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_CONTENT_LENGTH}
              placeholder="Enter your prompt content..."
              rows={10}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 resize-none font-mono text-sm ${
                errors.content
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-200 focus:border-emerald-500'
              }`}
              aria-invalid={!!errors.content}
              aria-describedby={errors.content ? 'content-error' : undefined}
            />
            {errors.content && (
              <p id="content-error" className="mt-1.5 text-sm text-red-600">
                {errors.content}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 text-right">
              {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this prompt..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200"
            />
          </div>

          {/* Folder Selector */}
          <div>
            <label
              htmlFor="folder"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Folder
            </label>
            {isLoadingFolders ? (
              <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500">
                Loading folders...
              </div>
            ) : (
              <select
                id="folder"
                value={folderId || ''}
                onChange={(e) =>
                  setFolderId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200 bg-white"
              >
                <option value="">No Folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Tags (max {MAX_TAGS})
            </label>
            <div className="space-y-2">
              {/* Tag Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setErrors({});
                    }}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="Type tag and press Enter..."
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 ${
                      errors.tags
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-emerald-500'
                    }`}
                    aria-invalid={!!errors.tags}
                    aria-describedby={errors.tags ? 'tags-error' : undefined}
                  />
                  {/* Tag Suggestions */}
                  {getTagSuggestions().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                      {getTagSuggestions().map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setTagInput(suggestion)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Add
                </button>
              </div>

              {/* Tag Error */}
              {errors.tags && (
                <p id="tags-error" className="text-sm text-red-600">
                  {errors.tags}
                </p>
              )}

              {/* Tags Display */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200 text-sm font-medium"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600 transition-colors"
                        aria-label={`Remove tag: ${tag}`}
                      >
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
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pin Toggle */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
            <input
              id="pin"
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label
              htmlFor="pin"
              className="flex-1 text-sm font-medium text-gray-700 cursor-pointer"
            >
              Pin this prompt (show at top of list)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isLoading
                ? 'Saving...'
                : editPrompt
                ? 'Update Prompt'
                : 'Create Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

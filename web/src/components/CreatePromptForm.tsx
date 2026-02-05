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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-title"
    >
      <div
        className="card-glass max-w-2xl w-full overflow-hidden animate-scale-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2
              id="form-title"
              className="font-display text-xl font-bold text-white"
            >
              {editPrompt ? 'Edit Prompt' : 'Create New Prompt'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Form Error */}
          {errors.form && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
              {errors.form}
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-white/70 mb-2"
            >
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="Enter prompt title..."
              autoFocus
              className={`w-full input-glass ${
                errors.title ? 'border-rose-500/50 focus:border-rose-500' : ''
              }`}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1.5 text-sm text-rose-400">
                {errors.title}
              </p>
            )}
            <p className="mt-1.5 text-xs text-white/30 text-right">
              {title.length} / {MAX_TITLE_LENGTH}
            </p>
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-semibold text-white/70 mb-2"
            >
              Content <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_CONTENT_LENGTH}
              placeholder="Enter your prompt content..."
              rows={8}
              className={`w-full input-glass resize-none font-mono text-sm ${
                errors.content ? 'border-rose-500/50 focus:border-rose-500' : ''
              }`}
              aria-invalid={!!errors.content}
              aria-describedby={errors.content ? 'content-error' : undefined}
            />
            {errors.content && (
              <p id="content-error" className="mt-1.5 text-sm text-rose-400">
                {errors.content}
              </p>
            )}
            <p className="mt-1.5 text-xs text-white/30 text-right">
              {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-white/70 mb-2"
            >
              Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this prompt..."
              className="w-full input-glass"
            />
          </div>

          {/* Folder Selector */}
          <div>
            <label
              htmlFor="folder"
              className="block text-sm font-semibold text-white/70 mb-2"
            >
              Folder
            </label>
            {isLoadingFolders ? (
              <div className="w-full input-glass text-white/40 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                Loading folders...
              </div>
            ) : (
              <select
                id="folder"
                value={folderId || ''}
                onChange={(e) =>
                  setFolderId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full input-glass"
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
              className="block text-sm font-semibold text-white/70 mb-2"
            >
              Tags <span className="text-white/40">(max {MAX_TAGS})</span>
            </label>
            <div className="space-y-3">
              {/* Tag Input */}
              <div className="flex gap-2">
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
                  className={`flex-1 input-glass ${
                    errors.tags ? 'border-rose-500/50 focus:border-rose-500' : ''
                  }`}
                  aria-invalid={!!errors.tags}
                  aria-describedby={errors.tags ? 'tags-error' : undefined}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg shadow-teal-500/20"
                >
                  Add
                </button>
              </div>

              {/* Tag Error */}
              {errors.tags && (
                <p id="tags-error" className="text-sm text-rose-400">
                  {errors.tags}
                </p>
              )}

              {/* Tags Display */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 glass rounded-xl">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 text-sm font-medium"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-400 transition-colors"
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
          <label className="flex items-center gap-3 p-4 glass rounded-xl cursor-pointer group">
            <input
              id="pin"
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50 focus:ring-offset-0"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                Pin this prompt
              </span>
              <p className="text-xs text-white/40 mt-0.5">Show at top of list</p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isPinned ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-colors ${isPinned ? 'text-amber-400' : 'text-white/30'}`}
            >
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
            </svg>
          </label>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 glass text-white/70 font-semibold rounded-xl hover:text-white hover:bg-white/10 transition-all"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : editPrompt ? (
                'Update Prompt'
              ) : (
                'Create Prompt'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Core Domain Types
// ============================================================

export interface Prompt {
  id: number;
  title: string;
  content: string;
  description: string | null;
  folder_id: number | null;
  is_pinned: boolean;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  color: string | null;
  icon: string | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  created_at: string;
}

export interface PromptTag {
  prompt_id: number;
  tag_id: number;
  created_at: string;
}

// ============================================================
// Extended Types
// ============================================================

export interface PromptWithTags extends Prompt {
  tags: Tag[];
}

export interface PromptWithRelations extends Prompt {
  tags: Tag[];
  folder: Folder | null;
}

export interface FolderTree extends Folder {
  children: FolderTree[];
  prompt_count?: number;
}

// ============================================================
// Request DTOs
// ============================================================

export interface CreatePromptRequest {
  title: string;
  content: string;
  description?: string | null;
  folder_id?: number | null;
  tags?: string[]; // Array of tag names to associate
  is_pinned?: boolean;
  display_order?: number | null;
}

export interface UpdatePromptRequest {
  title?: string;
  content?: string;
  description?: string | null;
  folder_id?: number | null;
  tags?: string[]; // Replace all tags with these
  is_pinned?: boolean;
  display_order?: number | null;
}

export interface CreateFolderRequest {
  name: string;
  parent_id?: number | null;
  color?: string | null;
  icon?: string | null;
  display_order?: number | null;
}

export interface UpdateFolderRequest {
  name?: string;
  parent_id?: number | null;
  color?: string | null;
  icon?: string | null;
  display_order?: number | null;
}

// ============================================================
// Query Parameters
// ============================================================

export interface ListPromptsQuery {
  page?: number;
  limit?: number;
  search?: string;
  folder_id?: number | null;
  tag_id?: number;
  is_pinned?: boolean;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'display_order';
  sort_order?: 'asc' | 'desc';
}

// ============================================================
// Response DTOs
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}

export interface CreatePromptResponse {
  prompt: PromptWithTags;
  tags_created: string[];
  tags_existing: string[];
}

export interface ListPromptsResponse extends PaginatedResponse<PromptWithTags> {}

export interface ListFoldersResponse {
  tree: FolderTree[];
  flat: Folder[];
}

// ============================================================
// Error Types
// ============================================================

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
  status?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse extends ApiError {
  errors: ValidationError[];
}

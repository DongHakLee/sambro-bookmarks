import { supabase } from './supabase';
import type {
  Prompt,
  Folder,
  Tag,
  PromptWithTags,
  PromptWithRelations,
  FolderTree,
  CreatePromptRequest,
  UpdatePromptRequest,
  CreateFolderRequest,
  UpdateFolderRequest,
  ListPromptsQuery,
  CreatePromptResponse,
  ListPromptsResponse,
  ApiError,
} from './prompt-types';

// ============================================================
// Helper Functions (Internal)
// ============================================================

/**
 * Normalize tag names (trim, lowercase), deduplicate, and create/get tags
 * @returns Object with tag IDs array, names of created tags, and names of existing tags
 */
async function processTags(tagNames: string[]): Promise<{
  tagIds: number[];
  tagsCreated: string[];
  tagsExisting: string[];
}> {
  if (!tagNames || tagNames.length === 0) {
    return { tagIds: [], tagsCreated: [], tagsExisting: [] };
  }

  // Normalize and deduplicate tag names
  const normalizedTags = Array.from(
    new Set(
      tagNames
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.length > 0)
    )
  );

  if (normalizedTags.length === 0) {
    return { tagIds: [], tagsCreated: [], tagsExisting: [] };
  }

  // Find existing tags
  const { data: existingTags, error: fetchError } = await supabase
    .from('tags')
    .select('id, name')
    .in('name', normalizedTags);

  if (fetchError) throw fetchError;

  const existingTagNames = new Set(existingTags?.map((t) => t.name) || []);
  const existingTagMap = new Map(existingTags?.map((t) => [t.name, t.id]) || []);

  // Determine which tags need to be created
  const tagsToCreate = normalizedTags.filter(
    (name) => !existingTagNames.has(name)
  );

  let createdTags: Tag[] = [];
  if (tagsToCreate.length > 0) {
    const { data: newTags, error: createError } = await supabase
      .from('tags')
      .insert(tagsToCreate.map((name) => ({ name })))
      .select();

    if (createError) throw createError;
    createdTags = newTags || [];
  }

  // Combine all tag IDs
  const allTagIds = [
    ...Array.from(existingTagMap.values()),
    ...createdTags.map((t) => t.id),
  ];

  return {
    tagIds: allTagIds,
    tagsCreated: createdTags.map((t) => t.name),
    tagsExisting: Array.from(existingTagNames),
  };
}

/**
 * Build tree structure from flat folder list
 */
function buildFolderTree(
  folders: Folder[],
  parentId: number | null = null
): FolderTree[] {
  return folders
    .filter((folder) => folder.parent_id === parentId)
    .map((folder) => ({
      ...folder,
      children: buildFolderTree(folders, folder.id),
    }));
}

/**
 * Count all prompts in a folder (recursively)
 */
async function countPromptsInFolder(folderId: number): Promise<number> {
  // Count direct prompts
  const { count: directCount, error: directError } = await supabase
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .eq('folder_id', folderId);

  if (directError) throw directError;

  // Get child folders and count their prompts recursively
  const { data: childFolders, error: childError } = await supabase
    .from('folders')
    .select('id')
    .eq('parent_id', folderId);

  if (childError) throw childError;

  let childCount = 0;
  if (childFolders && childFolders.length > 0) {
    for (const child of childFolders) {
      childCount += await countPromptsInFolder(child.id);
    }
  }

  return (directCount || 0) + childCount;
}

/**
 * Add prompt counts to folder tree
 */
async function addPromptCountsToTree(
  tree: FolderTree[]
): Promise<FolderTree[]> {
  const result = await Promise.all(
    tree.map(async (folder) => ({
      ...folder,
      prompt_count: await countPromptsInFolder(folder.id),
      children: await addPromptCountsToTree(folder.children),
    }))
  );
  return result;
}

// ============================================================
// Prompt CRUD Operations
// ============================================================

/**
 * List prompts with search, filter, and pagination
 */
export async function getPrompts(
  query: ListPromptsQuery = {}
): Promise<ListPromptsResponse> {
  const {
    page = 1,
    limit = 20,
    search,
    folder_id,
    tag_id: _tag_id, // Tag filtering done via post-processing; prefix to avoid unused
    is_pinned,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = query;

  const offset = (page - 1) * limit;

  let queryBuilder = supabase
    .from('prompts')
    .select('*, tags(*)', { count: 'exact' });

  // Apply filters
  if (search) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${search}%,content.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  if (folder_id !== undefined) {
    if (folder_id === null) {
      queryBuilder = queryBuilder.is('folder_id', null);
    } else {
      queryBuilder = queryBuilder.eq('folder_id', folder_id);
    }
  }

  if (is_pinned !== undefined) {
    queryBuilder = queryBuilder.eq('is_pinned', is_pinned);
  }

  // Apply sorting
  queryBuilder = queryBuilder.order(sort_by, {
    ascending: sort_order === 'asc',
  });

  // Apply pagination
  queryBuilder = queryBuilder.range(offset, offset + limit - 1);

  const { data, error, count } = await queryBuilder;

  if (error) throw error;

  // Process tags for each prompt
  const promptIds = data?.map((p) => p.id) || [];
  let tagMap: Record<number, Tag[]> = {};

  if (promptIds.length > 0) {
    const { data: promptTags, error: tagError } = await supabase
      .from('prompt_tags')
      .select('prompt_id, tags(*)')
      .in('prompt_id', promptIds);

    if (!tagError && promptTags) {
      tagMap = promptTags.reduce<Record<number, Tag[]>>((acc, pt: any) => {
        const promptId = pt.prompt_id;
        if (!acc[promptId]) acc[promptId] = [];
        if (pt.tags) acc[promptId].push(pt.tags);
        return acc;
      }, {});
    }
  }

  const promptsWithTags: PromptWithTags[] =
    data?.map((prompt) => ({
      ...prompt,
      tags: tagMap[prompt.id] || [],
    })) || [];

  const total = count || 0;
  const total_pages = Math.ceil(total / limit);

  return {
    data: promptsWithTags,
    pagination: {
      page,
      limit,
      total,
      total_pages,
      has_more: page < total_pages,
    },
  };
}

/**
 * Get a single prompt by ID with relations
 */
export async function getPromptById(id: number): Promise<PromptWithRelations> {
  const { data: prompt, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  // Get tags
  const { data: promptTags, error: tagError } = await supabase
    .from('prompt_tags')
    .select('tags(*)')
    .eq('prompt_id', id);

  if (tagError) throw tagError;

  const tags: Tag[] = promptTags?.map((pt: any) => pt.tags).filter(Boolean) || [];

  // Get folder if present
  let folder: Folder | null = null;
  if (prompt.folder_id) {
    const { data: folderData, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', prompt.folder_id)
      .single();

    if (!folderError) {
      folder = folderData;
    }
  }

  return {
    ...prompt,
    tags,
    folder,
  };
}

/**
 * Create a new prompt with tags
 */
export async function createPrompt(
  request: CreatePromptRequest
): Promise<CreatePromptResponse> {
  const { tags, ...promptData } = request;

  // Process tags first to get IDs
  const { tagIds, tagsCreated, tagsExisting } = await processTags(tags || []);

  // Create the prompt
  const { data: prompt, error } = await supabase
    .from('prompts')
    .insert({
      title: promptData.title,
      content: promptData.content,
      description: promptData.description ?? null,
      folder_id: promptData.folder_id ?? null,
      is_pinned: promptData.is_pinned ?? false,
      display_order: promptData.display_order ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  // Associate tags with the prompt
  if (tagIds.length > 0) {
    const { error: tagAssocError } = await supabase
      .from('prompt_tags')
      .insert(tagIds.map((tagId) => ({ prompt_id: prompt.id, tag_id: tagId })));

    if (tagAssocError) throw tagAssocError;
  }

  // Fetch the created prompt with tags
  const promptWithTags = await getPromptById(prompt.id);

  return {
    prompt: promptWithTags,
    tags_created: tagsCreated,
    tags_existing: tagsExisting,
  };
}

/**
 * Update an existing prompt
 */
export async function updatePrompt(
  id: number,
  request: UpdatePromptRequest
): Promise<PromptWithRelations> {
  const { tags, ...promptData } = request;

  // If tags are provided, replace all existing tags
  if (tags !== undefined) {
    // Delete existing tag associations
    const { error: deleteError } = await supabase
      .from('prompt_tags')
      .delete()
      .eq('prompt_id', id);

    if (deleteError) throw deleteError;

    // Process and create new tag associations
    const { tagIds } = await processTags(tags);

    if (tagIds.length > 0) {
      const { error: insertError } = await supabase
        .from('prompt_tags')
        .insert(tagIds.map((tagId) => ({ prompt_id: id, tag_id: tagId })));

      if (insertError) throw insertError;
    }
  }

  // Update prompt fields if any are provided
  const updateData: Record<string, unknown> = {};
  if (promptData.title !== undefined) updateData.title = promptData.title;
  if (promptData.content !== undefined) updateData.content = promptData.content;
  if (promptData.description !== undefined)
    updateData.description = promptData.description;
  if (promptData.folder_id !== undefined)
    updateData.folder_id = promptData.folder_id;
  if (promptData.is_pinned !== undefined)
    updateData.is_pinned = promptData.is_pinned;
  if (promptData.display_order !== undefined)
    updateData.display_order = promptData.display_order;

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from('prompts')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  return getPromptById(id);
}

/**
 * Delete a prompt
 */
export async function deletePrompt(id: number): Promise<void> {
  // Tag associations are deleted automatically by FK CASCADE

  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Toggle the pin status of a prompt
 */
export async function togglePromptPin(id: number): Promise<Prompt> {
  // First get current state
  const { data: prompt, error: fetchError } = await supabase
    .from('prompts')
    .select('is_pinned')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // Toggle the pin status
  const { data, error } = await supabase
    .from('prompts')
    .update({ is_pinned: !prompt.is_pinned })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// Tag Operations
// ============================================================

/**
 * List tags with optional search and limit
 */
export async function getTags(
  q?: string,
  limit: number = 50
): Promise<Tag[]> {
  let query = supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })
    .limit(limit);

  if (q) {
    query = query.ilike('name', `%${q}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get prompts by tag ID with pagination
 */
export async function getPromptsByTag(
  tagId: number,
  page: number = 1,
  limit: number = 20
): Promise<ListPromptsResponse> {
  const offset = (page - 1) * limit;

  // Get prompt IDs that have this tag
  const { data: promptTags, error: tagError } = await supabase
    .from('prompt_tags')
    .select('prompt_id')
    .eq('tag_id', tagId);

  if (tagError) throw tagError;

  const promptIds = promptTags?.map((pt) => pt.prompt_id) || [];

  if (promptIds.length === 0) {
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        total_pages: 0,
        has_more: false,
      },
    };
  }

  // Get the actual prompts with their tags
  const { data: prompts, error, count } = await supabase
    .from('prompts')
    .select('*', { count: 'exact' })
    .in('id', promptIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Get all tags for these prompts
  const allPromptIds = prompts?.map((p) => p.id) || [];
  let tagMap: Record<number, Tag[]> = {};

  if (allPromptIds.length > 0) {
    const { data: allPromptTags } = await supabase
      .from('prompt_tags')
      .select('prompt_id, tags(*)')
      .in('prompt_id', allPromptIds);

    if (allPromptTags) {
      tagMap = allPromptTags.reduce<Record<number, Tag[]>>((acc, pt: any) => {
        const promptId = pt.prompt_id;
        if (!acc[promptId]) acc[promptId] = [];
        if (pt.tags) acc[promptId].push(pt.tags);
        return acc;
      }, {});
    }
  }

  const promptsWithTags: PromptWithTags[] =
    prompts?.map((prompt) => ({
      ...prompt,
      tags: tagMap[prompt.id] || [],
    })) || [];

  const total = count || 0;
  const total_pages = Math.ceil(total / limit);

  return {
    data: promptsWithTags,
    pagination: {
      page,
      limit,
      total,
      total_pages,
      has_more: page < total_pages,
    },
  };
}

/**
 * Create a new tag
 */
export async function createTag(name: string): Promise<Tag> {
  const normalizedName = name.trim().toLowerCase();

  if (!normalizedName) {
    const error: ApiError = {
      message: 'Tag name cannot be empty',
      code: 'VALIDATION_ERROR',
    };
    throw error;
  }

  // Check if tag already exists
  const { data: existing } = await supabase
    .from('tags')
    .select('*')
    .eq('name', normalizedName)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from('tags')
    .insert({ name: normalizedName })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a tag (also removes all prompt tag associations)
 */
export async function deleteTag(id: number): Promise<void> {
  const { error } = await supabase.from('tags').delete().eq('id', id);

  if (error) throw error;
}

// ============================================================
// Folder Operations
// ============================================================

/**
 * List folders as tree or flat list
 */
export async function getFolders(
  flat: boolean = false
): Promise<FolderTree[] | Folder[]> {
  const { data: folders, error } = await supabase
    .from('folders')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;

  if (flat || !folders) {
    return folders || [];
  }

  // Build tree structure
  const tree = buildFolderTree(folders, null);

  // Add prompt counts
  return addPromptCountsToTree(tree);
}

/**
 * Create a new folder
 */
export async function createFolder(request: CreateFolderRequest): Promise<Folder> {
  const { data, error } = await supabase
    .from('folders')
    .insert({
      name: request.name,
      parent_id: request.parent_id ?? null,
      color: request.color ?? null,
      icon: request.icon ?? null,
      display_order: request.display_order ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing folder
 */
export async function updateFolder(
  id: number,
  request: UpdateFolderRequest
): Promise<Folder> {
  const updateData: Record<string, unknown> = {};
  if (request.name !== undefined) updateData.name = request.name;
  if (request.parent_id !== undefined)
    updateData.parent_id = request.parent_id;
  if (request.color !== undefined) updateData.color = request.color;
  if (request.icon !== undefined) updateData.icon = request.icon;
  if (request.display_order !== undefined)
    updateData.display_order = request.display_order;

  const { data, error } = await supabase
    .from('folders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a folder
 * Note: Child folders will be orphaned (parent_id set to null) if you want cascade, handle separately
 */
export async function deleteFolder(id: number): Promise<void> {
  // First, orphan child folders by setting their parent_id to null
  await supabase
    .from('folders')
    .update({ parent_id: null })
    .eq('parent_id', id);

  // Unlink prompts from this folder
  await supabase
    .from('prompts')
    .update({ folder_id: null })
    .eq('folder_id', id);

  // Delete the folder
  const { error } = await supabase.from('folders').delete().eq('id', id);

  if (error) throw error;
}

/**
 * Get prompts by folder ID with optional recursive search
 */
export async function getPromptsByFolder(
  folderId: number,
  recursive: boolean = false,
  page: number = 1,
  limit: number = 20
): Promise<ListPromptsResponse> {
  const offset = (page - 1) * limit;

  let folderIds = [folderId];

  // If recursive, get all descendant folder IDs
  if (recursive) {
    const getDescendantIds = async (parentId: number): Promise<number[]> => {
      const { data: children } = await supabase
        .from('folders')
        .select('id')
        .eq('parent_id', parentId);

      const childIds = children?.map((c) => c.id) || [];
      const descendantIds: number[] = [];

      for (const childId of childIds) {
        descendantIds.push(childId);
        descendantIds.push(...(await getDescendantIds(childId)));
      }

      return descendantIds;
    };

    const descendants = await getDescendantIds(folderId);
    folderIds = [...folderIds, ...descendants];
  }

  // Count total prompts
  const { count, error: countError } = await supabase
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .in('folder_id', folderIds);

  if (countError) throw countError;

  // Get prompts
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .in('folder_id', folderIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Get tags for these prompts
  const promptIds = prompts?.map((p) => p.id) || [];
  let tagMap: Record<number, Tag[]> = {};

  if (promptIds.length > 0) {
    const { data: promptTags } = await supabase
      .from('prompt_tags')
      .select('prompt_id, tags(*)')
      .in('prompt_id', promptIds);

    if (promptTags) {
      tagMap = promptTags.reduce<Record<number, Tag[]>>((acc, pt: any) => {
        const promptId = pt.prompt_id;
        if (!acc[promptId]) acc[promptId] = [];
        if (pt.tags) acc[promptId].push(pt.tags);
        return acc;
      }, {});
    }
  }

  const promptsWithTags: PromptWithTags[] =
    prompts?.map((prompt) => ({
      ...prompt,
      tags: tagMap[prompt.id] || [],
    })) || [];

  const total = count || 0;
  const total_pages = Math.ceil(total / limit);

  return {
    data: promptsWithTags,
    pagination: {
      page,
      limit,
      total,
      total_pages,
      has_more: page < total_pages,
    },
  };
}

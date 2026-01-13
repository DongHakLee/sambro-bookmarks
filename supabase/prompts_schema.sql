-- Supabase Schema for Sambro Prompts
-- Run this in Supabase SQL Editor after the base schema.sql

-- ============================================================================
-- FOLDERS TABLE
-- Hierarchical folder structure for organizing prompts
-- ============================================================================
CREATE TABLE IF NOT EXISTS folders (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT REFERENCES folders(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for folders
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_sort_order ON folders(sort_order);

-- Auto-update updated_at trigger for folders
CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TAGS TABLE
-- Tags for categorizing prompts (many-to-many relationship via prompt_tags)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index on tag name (case-insensitive via CITEXT extension if needed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Index for tag searches
CREATE INDEX IF NOT EXISTS idx_tags_name_trgm ON tags USING gin(name gin_trgm_ops);

-- ============================================================================
-- PROMPTS TABLE
-- Main table for storing user prompts/content
-- ============================================================================
CREATE TABLE IF NOT EXISTS prompts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    folder_id BIGINT REFERENCES folders(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for prompts
CREATE INDEX IF NOT EXISTS idx_prompts_folder_id ON prompts(folder_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_pinned ON prompts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_title ON prompts(title);

-- Full-text search index on title and content
CREATE INDEX IF NOT EXISTS idx_prompts_title_trgm ON prompts USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prompts_content_trgm ON prompts USING gin(content gin_trgm_ops);

-- Auto-update updated_at trigger for prompts
CREATE TRIGGER update_prompts_updated_at
    BEFORE UPDATE ON prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PROMPT_TAGS JUNCTION TABLE
-- Many-to-many relationship between prompts and tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS prompt_tags (
    prompt_id BIGINT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (prompt_id, tag_id)
);

-- Index for looking up tags by prompt (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt_id ON prompt_tags(prompt_id);

-- Index for looking up prompts by tag (useful for tag filtering)
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag_id ON prompt_tags(tag_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Public access pattern - no authentication required
-- Matches the bookmarks table access pattern
-- ============================================================================

-- Enable RLS on all tables (requires explicit policies)
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_tags ENABLE ROW LEVEL SECURITY;

-- Public access policy for folders
CREATE POLICY "Public Access - Folders" ON folders
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Public access policy for tags
CREATE POLICY "Public Access - Tags" ON tags
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Public access policy for prompts
CREATE POLICY "Public Access - Prompts" ON prompts
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Public access policy for prompt_tags
CREATE POLICY "Public Access - Prompt Tags" ON prompt_tags
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- HELPER VIEWS (OPTIONAL)
-- Convenient views for common query patterns
-- ============================================================================

-- View: Prompts with their folder and tags (pre-joined for common queries)
CREATE OR REPLACE VIEW prompts_with_details AS
SELECT
    p.id,
    p.title,
    p.content,
    p.folder_id,
    f.name AS folder_name,
    p.is_pinned,
    p.created_at,
    p.updated_at,
    COALESCE(
        json_agg(
            json_build_object(
                'id', t.id,
                'name', t.name
            ) ORDER BY t.name
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'::json
    ) AS tags
FROM prompts p
LEFT JOIN folders f ON p.folder_id = f.id
LEFT JOIN prompt_tags pt ON p.id = pt.prompt_id
LEFT JOIN tags t ON pt.tag_id = t.id
GROUP BY p.id, f.name;

-- View: Tag usage counts
CREATE OR REPLACE VIEW tag_usage_counts AS
SELECT
    t.id,
    t.name,
    COUNT(pt.prompt_id) AS prompt_count
FROM tags t
LEFT JOIN prompt_tags pt ON t.id = pt.tag_id
GROUP BY t.id, t.name
ORDER BY prompt_count DESC, t.name;

-- ============================================================================
-- SEED DATA (OPTIONAL)
-- Uncomment to insert default data
-- ============================================================================

-- Default folder
-- INSERT INTO folders (name, sort_order) VALUES ('General', 0)
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
--
-- This migration depends on:
--   - update_updated_at_column() function from schema.sql
--   - pg_trgm extension for trigram indexes (run: CREATE EXTENSION IF NOT EXISTS pg_trgm;)
--
-- To verify the migration:
--   \dt                    -- List all tables
--   \d folders             -- Describe folders table
--   \d prompts             -- Describe prompts table
--   SELECT * FROM prompts_with_details LIMIT 5;
--
-- To rollback (if needed):
--   DROP VIEW IF EXISTS tag_usage_counts;
--   DROP VIEW IF EXISTS prompts_with_details;
--   DROP TABLE IF EXISTS prompt_tags;
--   DROP TABLE IF EXISTS prompts;
--   DROP TABLE IF EXISTS tags;
--   DROP TABLE IF EXISTS folders;
-- ============================================================================

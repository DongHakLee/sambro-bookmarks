import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sgywqmbkblvnfxlgdocr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Bookmark {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  favicon_url: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export async function getBookmarks(): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createBookmark(bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>): Promise<Bookmark> {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert([bookmark])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBookmark(id: number): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateBookmark(id: number, updates: Partial<Bookmark>): Promise<Bookmark> {
  const { data, error } = await supabase
    .from('bookmarks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function searchBookmarks(query: string): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,url.ilike.%${query}%,note.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

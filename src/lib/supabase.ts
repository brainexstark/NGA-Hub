import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qoarbpjevfzmxgfyhxoa.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvYXJicGpldmZ6bXhnZnloeG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDM0ODUsImV4cCI6MjA5MjA3OTQ4NX0.uWq8zNZLydtL5Gsq9pxrK-b1glAz93pLTWxQWmNhCzA';

// Only create client if credentials exist
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export type SupabasePost = {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  title: string;
  caption: string;
  media_url: string;
  video_url?: string;
  category: string;
  age_group: string;
  likes_count: number;
  comments_count: number;
  is_flagged: boolean;
  created_at: string;
};

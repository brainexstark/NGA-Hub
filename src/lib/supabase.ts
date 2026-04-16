import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wscaigurnkqbzdipktlr.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzY2FpZ3VybmtxYnpkaXBrdGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDMwNTksImV4cCI6MjA5MTg3OTA1OX0.KcNhpx6gBdtjt625O_FLjpAbEyVWwuURUtyFSc6XumQ';

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

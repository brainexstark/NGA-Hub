import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rhdfnxrbbzaqcedwgsfm.supabase.co';
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_GxtsyVxpWMIaMf6pCxbu8w_SaMH6eNj';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZGZueHJiYnphcWNlZHdnc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTc3MzQsImV4cCI6MjA5MjM3MzczNH0.m4I6dkc9Jw6McuBFjQYbnLce9_7Lo0fJOphC3VEBhZw';

// Publishable key for client-side, anon key as fallback
const supabaseKey = supabasePublishableKey || supabaseAnonKey;

// Use createClient directly — supports realtime websockets
// Safe to call on server too (realtime just won't connect server-side, only client)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

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

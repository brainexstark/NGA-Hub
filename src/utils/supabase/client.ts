import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rhdfnxrbbzaqcedwgsfm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_GxtsyVxpWMIaMf6pCxbu8w_SaMH6eNj';

export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);

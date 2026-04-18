import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qoarbpjevfzmxgfyhxoa.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_H2VpiivAK7VFccnS-B95zA_XEgWt1UD';

export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rhdfnxrbbzaqcedwgsfm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZGZueHJiYnphcWNlZHdnc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTc3MzQsImV4cCI6MjA5MjM3MzczNH0.m4I6dkc9Jw6McuBFjQYbnLce9_7Lo0fJOphC3VEBhZw';
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvYXJicGpldmZ6bXhnZnloeG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDM0ODUsImV4cCI6MjA5MjA3OTQ4NX0.uWq8zNZLydtL5Gsq9pxrK-b1glAz93pLTWxQWmNhCzA';

export const createClient = (request: NextRequest) => {
  // If supabase config is missing, just pass through
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      },
    );
  } catch (e) {
    // Supabase init failed — continue without it
    console.warn('Supabase middleware init failed:', e);
  }

  return supabaseResponse;
};

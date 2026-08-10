import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/sign-in?error=oauth_failed', request.url));
  }

  // Check if user already has a profile with age_group
  const { data: profile } = await supabase
    .from('app_users')
    .select('age_group')
    .eq('id', data.user.id)
    .single();

  if (profile?.age_group) {
    // Existing user with complete profile → go to their feed
    return NextResponse.redirect(new URL(`/HomeTon/${profile.age_group}`, request.url));
  }

  // New Google user → needs to complete sign-up (age selection)
  return NextResponse.redirect(new URL('/sign-up', request.url));
}

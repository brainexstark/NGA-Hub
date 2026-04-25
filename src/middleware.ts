import { type NextRequest, NextResponse } from 'next/server';

// Simple pass-through middleware — no Supabase server client needed
// Firebase handles auth client-side, Supabase is used for data only
export function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    // Only match app routes, skip static files
    '/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|woff|woff2)$).*)',
  ],
};

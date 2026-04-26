'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Age selection is now part of sign-up — this page just redirects
export default function SelectAgePage() {
  const router = useRouter();
  useEffect(() => { router.replace('/sign-up'); }, [router]);
  return null;
}

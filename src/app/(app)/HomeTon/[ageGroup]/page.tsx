import HomeTonClient from './HomeTonClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export function generateStaticParams() {
  return [
    { ageGroup: 'under-10' },
    { ageGroup: '10-16' },
    { ageGroup: '16-plus' },
  ];
}

export default async function HomeTonPage({ params }: { params: Promise<{ ageGroup: string }> }) {
  const { ageGroup } = await params;
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <HomeTonClient ageGroup={ageGroup} />
    </Suspense>
  );
}

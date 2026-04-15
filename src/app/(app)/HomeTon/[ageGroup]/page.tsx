import HomeTonClient from './HomeTonClient';

export function generateStaticParams() {
  return [
    { ageGroup: 'under-10' },
    { ageGroup: '10-16' },
    { ageGroup: '16-plus' },
  ];
}

export default async function HomeTonPage({ params }: { params: Promise<{ ageGroup: string }> }) {
  const { ageGroup } = await params;
  return <HomeTonClient ageGroup={ageGroup} />;
}

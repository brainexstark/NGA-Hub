import ReelsClient from './ReelsClient';

export function generateStaticParams() {
  return [
    { ageGroup: 'under-10' },
    { ageGroup: '10-16' },
    { ageGroup: '16-plus' },
  ];
}

export default async function ReelsPage({ params }: { params: Promise<{ ageGroup: string }> }) {
  const { ageGroup } = await params;
  return <ReelsClient ageGroup={ageGroup} />;
}

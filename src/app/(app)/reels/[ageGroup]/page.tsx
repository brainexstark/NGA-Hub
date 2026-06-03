import ReelsClient from './ReelsClient';

export function generateStaticParams() {
  return [
    { ageGroup: 'under-13' },
    { ageGroup: '14-17' },
    { ageGroup: '18+' },
  ];
}

export default async function ReelsPage({ params }: { params: Promise<{ ageGroup: string }> }) {
  const { ageGroup } = await params;
  return <ReelsClient ageGroup={ageGroup} />;
}

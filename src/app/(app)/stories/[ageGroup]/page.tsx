import StoriesClient from './StoriesClient';

export function generateStaticParams() {
  return [
    { ageGroup: 'under-13' },
    { ageGroup: '14-17' },
    { ageGroup: '18+' },
  ];
}

export default async function StoriesPage({ params }: { params: Promise<{ ageGroup: string }> }) {
  const { ageGroup } = await params;
  return <StoriesClient ageGroup={ageGroup} />;
}

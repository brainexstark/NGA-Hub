import StoriesClient from './StoriesClient';

export function generateStaticParams() {
  return [
    { ageGroup: 'under-10' },
    { ageGroup: '10-16' },
    { ageGroup: '16-plus' },
  ];
}

export default async function StoriesPage({ params }: { params: Promise<{ ageGroup: string }> }) {
  const { ageGroup } = await params;
  return <StoriesClient ageGroup={ageGroup} />;
}

import FeedClient from './FeedClient';

export function generateStaticParams() {
  return [
    { ageGroup: 'under-10' },
    { ageGroup: '10-16' },
    { ageGroup: '16-plus' },
  ];
}

export default async function FeedPage({ params }: { params: Promise<{ ageGroup: string }> }) {
  const { ageGroup } = await params;
  return <FeedClient ageGroup={ageGroup} />;
}

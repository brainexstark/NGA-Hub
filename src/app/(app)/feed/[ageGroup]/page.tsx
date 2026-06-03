import FeedClient from './FeedClient';

export function generateStaticParams() {
  return [
    { ageGroup: 'under-13' },
    { ageGroup: '14-17' },
    { ageGroup: '18+' },
  ];
}

export default async function FeedPage({ params }: { params: Promise<{ ageGroup: string }> }) {
  const { ageGroup } = await params;
  return <FeedClient ageGroup={ageGroup} />;
}

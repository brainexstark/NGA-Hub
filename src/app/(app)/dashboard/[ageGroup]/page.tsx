import { redirect } from 'next/navigation';

export function generateStaticParams() {
  return [
    { ageGroup: 'under-13' },
    { ageGroup: '14-17' },
    { ageGroup: '18+' },
  ];
}

export default async function DashboardPage({ params }: { params: Promise<{ ageGroup: string }> }) {
  const { ageGroup } = await params;
  redirect(`/HomeTon/${ageGroup}`);
}

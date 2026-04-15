import { redirect } from 'next/navigation';

export function generateStaticParams() {
  return [
    { ageGroup: 'under-10' },
    { ageGroup: '10-16' },
    { ageGroup: '16-plus' },
  ];
}

export default async function DashboardPage({ params }: { params: Promise<{ ageGroup: string }> }) {
  const { ageGroup } = await params;
  redirect(`/HomeTon/${ageGroup}`);
}

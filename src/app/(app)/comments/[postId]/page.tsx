import CommentsClient from './CommentsClient';
import { aiDatabase } from '../../../../lib/ai-database';

export function generateStaticParams() {
  const ids = [
    ...Object.values(aiDatabase.reels).flat().map(r => r.id),
    ...Object.values(aiDatabase.superdatabasePosts).flat().map(p => p.id)
  ];
  return ids.map(id => ({ postId: id }));
}

export default async function CommentsPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  return <CommentsClient postId={postId} />;
}

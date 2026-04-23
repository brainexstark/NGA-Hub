import CommentsClient from './CommentsClient';

// Dynamic route — no static params needed
export default async function CommentsPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  return <CommentsClient postId={postId} />;
}

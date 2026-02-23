import { useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ActivityCard } from '@/components/ActivityCard';
import { CommentThread } from '@/components/CommentThread';
import { mockPosts, mockComments } from '@/lib/mock-data';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const post = mockPosts.find((p) => p.id === id) || mockPosts[0];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <ActivityCard post={post} />
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Comments</h3>
          <CommentThread comments={mockComments.slice(0, 3)} />
        </div>
      </div>
    </AppShell>
  );
}

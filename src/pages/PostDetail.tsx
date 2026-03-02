import { useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ActivityCard } from '@/components/ActivityCard';
import { CommentThread } from '@/components/CommentThread';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ErrorState } from '@/components/ErrorState';
import { usePost, useComments } from '@/hooks/use-api';
import { transformFeedPost, transformComment } from '@/lib/transformers';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: rawPost, isLoading, isError, refetch } = usePost(id ?? '');
  const { data: commentsData } = useComments(id ?? '');

  const post = rawPost ? transformFeedPost(rawPost) : null;
  const comments = commentsData?.pages.flatMap(
    (page) => page.comments.map(transformComment)
  ) ?? [];

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-6">
          <SkeletonCard />
        </div>
      </AppShell>
    );
  }

  if (isError || !post) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto">
          <ErrorState message="Post not found." onRetry={() => refetch()} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <ActivityCard post={post} />
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Comments {post.commentCount > 0 && `(${post.commentCount})`}
          </h3>
          <CommentThread postId={post.id} comments={comments} />
        </div>
      </div>
    </AppShell>
  );
}

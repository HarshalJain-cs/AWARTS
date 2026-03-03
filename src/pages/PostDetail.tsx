import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ActivityCard } from '@/components/ActivityCard';
import { CommentThread } from '@/components/CommentThread';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ErrorState } from '@/components/ErrorState';
import { usePost, useComments } from '@/hooks/use-api';
import { transformFeedPost, transformComment } from '@/lib/transformers';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';

export default function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: rawPost, isLoading, error } = usePost(id ?? '');
  const isError = !!error;
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
          <ErrorState message="Post not found." onRetry={() => window.location.reload()} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEO title={post.title || 'Session Detail'} description={post.description || `AI coding session by @${post.author?.username ?? 'unknown'} on AWARTS.`} canonical={`/post/${id}`} />
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Button>
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

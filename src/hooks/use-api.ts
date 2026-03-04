import { useState, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// ── Helper: wrap a Convex mutation with isPending tracking ──────────
function useMutationWithPending<TArgs, TResult>(
  mutationFn: any
) {
  const mutation = useMutation(mutationFn);
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(
    async (args: TArgs): Promise<TResult> => {
      setIsPending(true);
      try {
        return await mutation(args as any);
      } finally {
        setIsPending(false);
      }
    },
    [mutation]
  );

  const mutate = useCallback(
    (args: TArgs) => {
      mutateAsync(args).catch(() => {});
    },
    [mutateAsync]
  );

  return { mutate, mutateAsync, isPending };
}

// ─── Feed ─────────────────────────────────────────────────────────────

export function useFeed(type: "global" | "following" = "global", provider?: string) {
  const result = useQuery(api.feed.getFeed, { type, provider });
  return {
    data: result ? { pages: [result] } : undefined,
    isLoading: result === undefined,
    error: null,
    hasNextPage: result?.nextCursor != null,
    fetchNextPage: () => {}, // TODO: implement cursor pagination with Convex
    isFetchingNextPage: false,
  };
}

// ─── Post Detail ──────────────────────────────────────────────────────

export function usePost(id: string) {
  const result = useQuery(api.posts.getPost, id ? { postId: id as Id<"posts"> } : "skip");
  return {
    data: result,
    isLoading: result === undefined,
    error: null,
  };
}

// ─── Comments ─────────────────────────────────────────────────────────

export function useComments(postId: string) {
  const result = useQuery(
    api.social.getComments,
    postId ? { postId: postId as Id<"posts"> } : "skip"
  );
  return {
    data: result
      ? { pages: [{ comments: result, nextCursor: null }] }
      : undefined,
    isLoading: result === undefined,
    error: null,
    hasNextPage: false,
    fetchNextPage: () => {},
    isFetchingNextPage: false,
  };
}

export function useCreateComment() {
  return useMutationWithPending<{ postId: string; content: string }, any>(
    api.social.addComment
  );
}

// ─── Kudos ────────────────────────────────────────────────────────────

export function useToggleKudos() {
  const give = useMutation(api.social.giveKudos);
  const remove = useMutation(api.social.removeKudos);
  const [isPending, setIsPending] = useState(false);

  return {
    mutate: (data: { postId: string; hasKudosed: boolean }) => {
      const postId = data.postId as Id<"posts">;
      setIsPending(true);
      const promise = data.hasKudosed ? remove({ postId }) : give({ postId });
      promise.finally(() => setIsPending(false));
    },
    isPending,
  };
}

// ─── Follow ───────────────────────────────────────────────────────────

export function useToggleFollow() {
  const follow = useMutation(api.social.follow);
  const unfollow = useMutation(api.social.unfollow);
  const [isPending, setIsPending] = useState(false);

  return {
    mutate: (data: { targetUserId: string; isFollowing: boolean }) => {
      const followingId = data.targetUserId as Id<"users">;
      setIsPending(true);
      const promise = data.isFollowing ? unfollow({ followingId }) : follow({ followingId });
      promise.finally(() => setIsPending(false));
    },
    isPending,
  };
}

// ─── Notifications ────────────────────────────────────────────────────

export function useNotifications() {
  const result = useQuery(api.social.getNotifications);
  const unreadCount = result?.filter((n) => !n.isRead).length ?? 0;
  return {
    data: result
      ? { notifications: result, nextCursor: null, unread_count: unreadCount }
      : undefined,
    isLoading: result === undefined,
    error: null,
  };
}

export function useMarkNotificationsRead() {
  return useMutationWithPending<void, any>(api.social.markNotificationsRead);
}

// ─── Leaderboard ──────────────────────────────────────────────────────

export function useLeaderboard(period = "weekly", provider?: string, region?: string) {
  const result = useQuery(api.leaderboard.getLeaderboard, { period, provider, region });
  return {
    data: result,
    isLoading: result === undefined,
    error: null,
  };
}

// ─── Search ───────────────────────────────────────────────────────────

export function useSearch(query: string) {
  const result = useQuery(
    api.search.searchUsers,
    query.length >= 2 ? { q: query } : "skip"
  );
  return {
    data: result ? { users: result, query } : undefined,
    isLoading: result === undefined,
    error: null,
  };
}

// ─── User Profile ─────────────────────────────────────────────────────

export function useProfile(username: string) {
  const result = useQuery(
    api.users.getByUsername,
    username ? { username } : "skip"
  );
  return {
    data: result,
    isLoading: result === undefined,
    error: null,
  };
}

export function useCurrentUser() {
  const result = useQuery(api.users.getMe);
  return {
    data: result,
    isLoading: result === undefined,
    error: null,
  };
}

export function useUpdateProfile() {
  return useMutationWithPending<Record<string, unknown>, any>(api.users.updateMe);
}

// ─── AI Caption ───────────────────────────────────────────────────────

export function useGenerateCaption() {
  const generate = useAction(api.ai.generateCaption);
  const [isPending, setIsPending] = useState(false);

  const run = async (data: {
    stats: Record<string, unknown>;
    preferredProvider?: string;
  }) => {
    setIsPending(true);
    try {
      const result = await generate({
        stats: {
          totalCost: Number(data.stats.totalCost ?? 0),
          totalTokens: Number(data.stats.totalTokens ?? 0),
          providers: (data.stats.providers as string[]) ?? [],
          models: (data.stats.models as string[]) ?? undefined,
          date: String(data.stats.date ?? new Date().toISOString().slice(0, 10)),
        },
        preferredProvider: data.preferredProvider,
      });
      return result;
    } finally {
      setIsPending(false);
    }
  };

  return {
    mutate: (data: any) => { run(data); },
    mutateAsync: run,
    isPending,
  };
}

// ─── Image Upload ─────────────────────────────────────────────────────

export function useUploadImage() {
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl);
  const saveFile = useMutation(api.upload.saveFile);
  const [isPending, setIsPending] = useState(false);

  const uploadFile = async (file: File): Promise<{ url: string }> => {
    setIsPending(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      const { url } = await saveFile({ storageId });
      return { url };
    } finally {
      setIsPending(false);
    }
  };

  return {
    mutate: (file: File) => { uploadFile(file); },
    mutateAsync: uploadFile,
    isPending,
  };
}

// ─── Avatar Upload (shortcut) ────────────────────────────────────────

export function useUploadAvatar() {
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl);
  const saveAvatar = useMutation(api.upload.saveAvatar);
  const [isPending, setIsPending] = useState(false);

  const upload = async (file: File): Promise<{ url: string }> => {
    setIsPending(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      const { url } = await saveAvatar({ storageId });
      return { url };
    } finally {
      setIsPending(false);
    }
  };

  return { upload, isPending };
}

// ─── Update Post ──────────────────────────────────────────────────────

export function useUpdatePost() {
  const updatePost = useMutation(api.posts.updatePost);
  const [isPending, setIsPending] = useState(false);

  return {
    mutate: (data: { id: string; title?: string; description?: string; images?: string[]; is_published?: boolean }) => {
      const { id, is_published, ...rest } = data;
      setIsPending(true);
      updatePost({
        postId: id as Id<"posts">,
        ...rest,
        isPublished: is_published,
      }).finally(() => setIsPending(false));
    },
    mutateAsync: async (data: { id: string; title?: string; description?: string; images?: string[]; is_published?: boolean }) => {
      const { id, is_published, ...rest } = data;
      setIsPending(true);
      try {
        return await updatePost({
          postId: id as Id<"posts">,
          ...rest,
          isPublished: is_published,
        });
      } finally {
        setIsPending(false);
      }
    },
    isPending,
  };
}

// ─── Delete Post ──────────────────────────────────────────────────────

export function useDeletePost() {
  return useMutationWithPending<string, any>(api.posts.deletePost);
}

// ─── User Posts ───────────────────────────────────────────────────────

export function useUserPosts(username: string) {
  const result = useQuery(api.feed.getUserPosts, username ? { username } : "skip");
  return {
    data: result ? { pages: [result] } : undefined,
    isLoading: result === undefined,
    error: null,
    hasNextPage: result?.nextCursor != null,
    fetchNextPage: () => {},
    isFetchingNextPage: false,
  };
}

// ─── Followers / Following ────────────────────────────────────────────

export function useFollowers(username: string) {
  const result = useQuery(
    api.users.getFollowers,
    username ? { username } : "skip"
  );
  return {
    data: result ? { users: result } : undefined,
    isLoading: result === undefined,
    error: null,
  };
}

export function useFollowing(username: string) {
  const result = useQuery(
    api.users.getFollowing,
    username ? { username } : "skip"
  );
  return {
    data: result ? { users: result } : undefined,
    isLoading: result === undefined,
    error: null,
  };
}

// ─── Edit / Delete Comment ──────────────────────────────────────────

export function useEditComment() {
  return useMutationWithPending<{ commentId: string; content: string }, any>(
    api.social.editComment
  );
}

export function useDeleteComment() {
  return useMutationWithPending<string, any>(api.social.deleteComment);
}

// ─── Prompts ──────────────────────────────────────────────────────

export function usePrompts() {
  const result = useQuery(api.prompts.getPrompts, {});
  return {
    data: result,
    isLoading: result === undefined,
    error: null,
  };
}

export function useSubmitPrompt() {
  return useMutationWithPending<{ content: string; isAnonymous: boolean }, any>(
    api.prompts.submitPrompt
  );
}

export function useTogglePromptVote() {
  return useMutationWithPending<{ promptId: string }, any>(
    api.prompts.toggleVote
  );
}

// ─── Import Usage (web) ──────────────────────────────────────────────

export function useImportUsage() {
  return useMutationWithPending<
    { entries: Array<{ date: string; provider: string; cost_usd: number; input_tokens: number; output_tokens: number; models: string[]; cost_source?: string }> },
    any
  >(api.usage.importUsage);
}

// ─── Username Availability ────────────────────────────────────────────

export function useCheckUsername(username: string) {
  const result = useQuery(
    api.users.checkUsername,
    username.length >= 3 ? { username } : "skip"
  );
  return {
    data: result,
    isLoading: result === undefined,
    error: null,
  };
}

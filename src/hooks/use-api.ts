import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

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
  const addComment = useMutation(api.social.addComment);
  return {
    mutate: (data: { postId: string; content: string }) => {
      addComment({ postId: data.postId as Id<"posts">, content: data.content });
    },
    mutateAsync: (data: { postId: string; content: string }) =>
      addComment({ postId: data.postId as Id<"posts">, content: data.content }),
    isPending: false,
  };
}

// ─── Kudos ────────────────────────────────────────────────────────────

export function useToggleKudos() {
  const give = useMutation(api.social.giveKudos);
  const remove = useMutation(api.social.removeKudos);
  return {
    mutate: (data: { postId: string; hasKudosed: boolean }) => {
      const postId = data.postId as Id<"posts">;
      if (data.hasKudosed) {
        remove({ postId });
      } else {
        give({ postId });
      }
    },
    isPending: false,
  };
}

// ─── Follow ───────────────────────────────────────────────────────────

export function useToggleFollow() {
  const follow = useMutation(api.social.follow);
  const unfollow = useMutation(api.social.unfollow);
  return {
    mutate: (data: { targetUserId: string; isFollowing: boolean }) => {
      const followingId = data.targetUserId as Id<"users">;
      if (data.isFollowing) {
        unfollow({ followingId });
      } else {
        follow({ followingId });
      }
    },
    isPending: false,
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
  const markRead = useMutation(api.social.markNotificationsRead);
  return {
    mutate: () => markRead(),
    mutateAsync: () => markRead(),
    isPending: false,
  };
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
  const updateMe = useMutation(api.users.updateMe);
  return {
    mutate: (data: Record<string, unknown>) => updateMe(data as any),
    mutateAsync: (data: Record<string, unknown>) => updateMe(data as any),
    isPending: false,
  };
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
      // Step 1: Get a short-lived upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Step 2: POST the file to that URL
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // Step 3: Save the file reference and get the serving URL
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
  return {
    mutate: (data: { id: string; title?: string; description?: string; images?: string[]; is_published?: boolean }) => {
      const { id, is_published, ...rest } = data;
      updatePost({
        postId: id as Id<"posts">,
        ...rest,
        isPublished: is_published,
      });
    },
    mutateAsync: async (data: { id: string; title?: string; description?: string; images?: string[]; is_published?: boolean }) => {
      const { id, is_published, ...rest } = data;
      return updatePost({
        postId: id as Id<"posts">,
        ...rest,
        isPublished: is_published,
      });
    },
    isPending: false,
  };
}

// ─── Delete Post ──────────────────────────────────────────────────────

export function useDeletePost() {
  const deletePost = useMutation(api.posts.deletePost);
  return {
    mutate: (id: string) => {
      deletePost({ postId: id as Id<"posts"> });
    },
    mutateAsync: (id: string) =>
      deletePost({ postId: id as Id<"posts"> }),
    isPending: false,
  };
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

// ─── Delete Comment ──────────────────────────────────────────────────

export function useEditComment() {
  const editComment = useMutation(api.social.editComment);
  return {
    mutate: (data: { commentId: string; content: string }) => {
      editComment({ commentId: data.commentId as Id<"comments">, content: data.content });
    },
    mutateAsync: (data: { commentId: string; content: string }) =>
      editComment({ commentId: data.commentId as Id<"comments">, content: data.content }),
    isPending: false,
  };
}

export function useDeleteComment() {
  const deleteComment = useMutation(api.social.deleteComment);
  return {
    mutate: (commentId: string) => {
      deleteComment({ commentId: commentId as Id<"comments"> });
    },
    mutateAsync: (commentId: string) =>
      deleteComment({ commentId: commentId as Id<"comments"> }),
    isPending: false,
  };
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

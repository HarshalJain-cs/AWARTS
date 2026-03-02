import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Provider } from '@/lib/types';

// ─── Feed ─────────────────────────────────────────────────────────────
interface FeedPost {
  id: string;
  user_id: string;
  usage_date: string;
  title: string | null;
  description: string | null;
  images: string[];
  providers: string[];
  created_at: string;
  user: { id: string; username: string; avatar_url: string | null; country: string | null };
  daily_usage: Array<{
    id: string;
    provider: string;
    cost_usd: number;
    input_tokens: number;
    output_tokens: number;
    cache_creation_tokens: number;
    cache_read_tokens: number;
    total_tokens: number;
    models: string[];
    source: string;
    is_verified: boolean;
    date: string;
  }>;
  kudos_count: number;
  comment_count: number;
  user_has_kudosed: boolean;
}

interface FeedResponse {
  posts: FeedPost[];
  nextCursor: string | null;
}

export function useFeed(type: 'global' | 'following' = 'global', provider?: string) {
  return useInfiniteQuery({
    queryKey: ['feed', type, provider],
    queryFn: ({ pageParam }) => {
      const params: Record<string, string> = { type };
      if (pageParam) params.cursor = pageParam;
      if (provider) params.provider = provider;
      return api.get<FeedResponse>('/feed', params);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// ─── Post Detail ──────────────────────────────────────────────────────
export function usePost(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => api.get<FeedPost & { comments_count: number; is_published: boolean }>(`/posts/${id}`),
    enabled: !!id,
  });
}

// ─── Comments ─────────────────────────────────────────────────────────
interface CommentResponse {
  comments: Array<{
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user: { id: string; username: string; avatar_url: string | null } | null;
  }>;
  nextCursor: string | null;
}

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam }) => {
      const params: Record<string, string> = { postId };
      if (pageParam) params.cursor = pageParam;
      return api.get<CommentResponse>('/social/comments', params);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!postId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { postId: string; content: string }) =>
      api.post('/social/comments', data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ─── Kudos ────────────────────────────────────────────────────────────
export function useToggleKudos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { postId: string; hasKudosed: boolean }) =>
      data.hasKudosed
        ? api.delete('/social/kudos', { postId: data.postId })
        : api.post('/social/kudos', { postId: data.postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
}

// ─── Follow ───────────────────────────────────────────────────────────
export function useToggleFollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { targetUserId: string; isFollowing: boolean }) =>
      data.isFollowing
        ? api.delete('/social/follow', { targetUserId: data.targetUserId })
        : api.post('/social/follow', { targetUserId: data.targetUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ─── Notifications ────────────────────────────────────────────────────
interface NotificationsResponse {
  notifications: Array<{
    id: string;
    type: string;
    is_read: boolean;
    created_at: string;
    sender: { id: string; username: string; avatar_url: string | null } | null;
    post: { id: string; title: string | null; usage_date: string } | null;
  }>;
  nextCursor: string | null;
  unread_count: number;
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<NotificationsResponse>('/social/notifications'),
    refetchInterval: 30000, // Poll every 30s
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/social/notifications'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Leaderboard ──────────────────────────────────────────────────────
interface LeaderboardResponse {
  entries: Array<{
    user_id: string;
    username: string;
    avatar_url: string | null;
    total_cost: number;
    total_tokens: number;
    current_streak: number;
    region: string | null;
  }>;
  period: string;
  provider: string | null;
  region: string | null;
}

export function useLeaderboard(period = 'weekly', provider?: string, region?: string) {
  return useQuery({
    queryKey: ['leaderboard', period, provider, region],
    queryFn: () => {
      const params: Record<string, string> = { period };
      if (provider) params.provider = provider;
      if (region) params.region = region;
      return api.get<LeaderboardResponse>('/leaderboard', params);
    },
  });
}

// ─── Search ───────────────────────────────────────────────────────────
interface SearchResponse {
  users: Array<{
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    country: string | null;
  }>;
  query: string;
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => api.get<SearchResponse>('/search', { q: query }),
    enabled: query.length >= 2,
  });
}

// ─── User Profile ─────────────────────────────────────────────────────
interface ProfileResponse {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  region: string | null;
  timezone: string | null;
  is_public: boolean;
  default_ai_provider: string | null;
  created_at: string;
  stats: {
    total_cost_usd: number;
    total_days: number;
    current_streak: number;
    providers_used: string[];
    provider_breakdown: Record<string, number>;
  };
  followers_count: number;
  following_count: number;
  is_following: boolean;
  achievements: Array<{ slug: string; awarded_at: string }>;
  heatmap: Record<string, number>;
}

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.get<ProfileResponse>(`/users/${username}`),
    enabled: !!username,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.get<Record<string, unknown>>('/users/me'),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ─── AI Caption ───────────────────────────────────────────────────────
export function useGenerateCaption() {
  return useMutation({
    mutationFn: (data: {
      stats: Record<string, unknown>;
      imageUrls?: string[];
      preferredProvider?: string;
    }) => api.post<{ title: string; description: string; generated_by: string }>('/ai/generate-caption', data),
  });
}

// ─── Image Upload ─────────────────────────────────────────────────────
export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => api.upload('/upload', file),
  });
}

// ─── Update Post ──────────────────────────────────────────────────────
export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; title?: string; description?: string; images?: string[]; is_published?: boolean }) => {
      const { id, ...body } = data;
      return api.patch(`/posts/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
}

// ─── Delete Post ──────────────────────────────────────────────────────
export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ─── User Posts ───────────────────────────────────────────────────────
interface UserPostsResponse {
  posts: FeedPost[];
  nextCursor: string | null;
}

export function useUserPosts(username: string) {
  return useInfiniteQuery({
    queryKey: ['userPosts', username],
    queryFn: ({ pageParam }) => {
      const params: Record<string, string> = { username };
      if (pageParam) params.cursor = pageParam;
      return api.get<UserPostsResponse>('/feed', { ...params, type: 'user' });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!username,
  });
}

// ─── Followers / Following ────────────────────────────────────────────
interface FollowListResponse {
  users: Array<{
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_following: boolean;
  }>;
}

export function useFollowers(username: string) {
  return useQuery({
    queryKey: ['followers', username],
    queryFn: () => api.get<FollowListResponse>(`/users/${username}/followers`),
    enabled: !!username,
  });
}

export function useFollowing(username: string) {
  return useQuery({
    queryKey: ['following', username],
    queryFn: () => api.get<FollowListResponse>(`/users/${username}/following`),
    enabled: !!username,
  });
}

// ─── Edit/Delete Comment ──────────────────────────────────────────────
export function useEditComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { commentId: string; content: string }) =>
      api.patch(`/social/comments/${data.commentId}`, { content: data.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => api.delete(`/social/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
}

// ─── Username Availability ────────────────────────────────────────────
export function useCheckUsername(username: string) {
  return useQuery({
    queryKey: ['checkUsername', username],
    queryFn: () => api.get<{ available: boolean }>('/users/check-username', { username }),
    enabled: username.length >= 3,
  });
}

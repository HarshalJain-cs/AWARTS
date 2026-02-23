import { User, Post, Comment, Notification, LeaderboardEntry, HeatmapDay, Achievement, Provider } from './types';
import { ACHIEVEMENTS } from './constants';

function avatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a2e&color=fff&size=128`;
}

export const currentUser: User = {
  id: 'u1',
  username: 'alexdev',
  displayName: 'Alex Chen',
  avatar: avatar('Alex Chen'),
  bio: 'Full-stack dev. Building with AI every day.',
  location: 'San Francisco, CA',
  country: 'United States',
  countryCode: 'US',
  joinDate: '2025-01-15',
  followers: 342,
  following: 128,
  isVerified: true,
  isFollowing: false,
  providers: ['claude', 'codex', 'gemini'],
  streak: 47,
  totalSpend: 284050,
  totalTokens: 89_400_000,
};

export const mockUsers: User[] = [
  currentUser,
  {
    id: 'u2', username: 'sarahcodes', displayName: 'Sarah Kim', avatar: avatar('Sarah Kim'),
    bio: 'AI-first developer. Codex enthusiast.', location: 'Seoul, KR', country: 'South Korea', countryCode: 'KR',
    joinDate: '2025-02-01', followers: 891, following: 234, isVerified: true, isFollowing: true,
    providers: ['codex', 'claude'], streak: 92, totalSpend: 510300, totalTokens: 156_000_000,
  },
  {
    id: 'u3', username: 'maxbuilds', displayName: 'Max Rivera', avatar: avatar('Max Rivera'),
    bio: 'Shipping fast with Gemini & Claude.', location: 'Austin, TX', country: 'United States', countryCode: 'US',
    joinDate: '2025-03-10', followers: 567, following: 89, isVerified: false, isFollowing: false,
    providers: ['gemini', 'claude', 'antigravity'], streak: 23, totalSpend: 178900, totalTokens: 45_200_000,
  },
  {
    id: 'u4', username: 'priya_ai', displayName: 'Priya Patel', avatar: avatar('Priya Patel'),
    bio: 'ML engineer exploring all the models.', location: 'Bangalore, IN', country: 'India', countryCode: 'IN',
    joinDate: '2025-01-28', followers: 1203, following: 312, isVerified: true, isFollowing: true,
    providers: ['claude', 'codex', 'gemini', 'antigravity'], streak: 118, totalSpend: 892100, totalTokens: 312_000_000,
  },
  {
    id: 'u5', username: 'devjensen', displayName: 'Erik Jensen', avatar: avatar('Erik Jensen'),
    bio: 'Backend dev. Claude power user.', location: 'Stockholm, SE', country: 'Sweden', countryCode: 'SE',
    joinDate: '2025-04-05', followers: 234, following: 67, isVerified: false, isFollowing: false,
    providers: ['claude'], streak: 14, totalSpend: 95400, totalTokens: 28_000_000,
  },
  {
    id: 'u6', username: 'luna.code', displayName: 'Luna Zhang', avatar: avatar('Luna Zhang'),
    bio: 'Full-stack AI builder. Singapore 🇸🇬', location: 'Singapore', country: 'Singapore', countryCode: 'SG',
    joinDate: '2025-02-14', followers: 678, following: 156, isVerified: true, isFollowing: false,
    providers: ['claude', 'gemini'], streak: 65, totalSpend: 345600, totalTokens: 98_000_000,
  },
  {
    id: 'u7', username: 'tomhacks', displayName: 'Tom Wilson', avatar: avatar('Tom Wilson'),
    bio: 'Indie hacker. Ship or die.', location: 'London, UK', country: 'United Kingdom', countryCode: 'GB',
    joinDate: '2025-03-22', followers: 445, following: 201, isVerified: false, isFollowing: true,
    providers: ['claude', 'codex'], streak: 31, totalSpend: 201300, totalTokens: 67_000_000,
  },
  {
    id: 'u8', username: 'maria_dev', displayName: 'Maria Santos', avatar: avatar('Maria Santos'),
    bio: 'React + AI = ❤️', location: 'São Paulo, BR', country: 'Brazil', countryCode: 'BR',
    joinDate: '2025-04-18', followers: 312, following: 143, isVerified: false, isFollowing: false,
    providers: ['claude', 'antigravity'], streak: 8, totalSpend: 67800, totalTokens: 19_500_000,
  },
  {
    id: 'u9', username: 'kai_builds', displayName: 'Kai Nakamura', avatar: avatar('Kai Nakamura'),
    bio: 'DevOps + AI automation.', location: 'Tokyo, JP', country: 'Japan', countryCode: 'JP',
    joinDate: '2025-01-05', followers: 923, following: 78, isVerified: true, isFollowing: false,
    providers: ['codex', 'gemini', 'antigravity'], streak: 156, totalSpend: 1_234_500, totalTokens: 456_000_000,
  },
  {
    id: 'u10', username: 'noor_codes', displayName: 'Noor Abadi', avatar: avatar('Noor Abadi'),
    bio: 'Open source contributor. AI enthusiast.', location: 'Amsterdam, NL', country: 'Netherlands', countryCode: 'NL',
    joinDate: '2025-05-01', followers: 189, following: 95, isVerified: false, isFollowing: false,
    providers: ['claude', 'codex'], streak: 5, totalSpend: 34200, totalTokens: 12_000_000,
  },
];

export const mockPosts: Post[] = [
  {
    id: 'p1', user: mockUsers[1], title: 'Refactored the entire auth module with Codex',
    description: 'Migrated from JWT to session-based auth. Codex handled 90% of the boilerplate.',
    providers: ['codex', 'claude'], providerBreakdown: [
      { provider: 'codex', cost: 4520, inputTokens: 89000, outputTokens: 145000, sessions: 3 },
      { provider: 'claude', cost: 2100, inputTokens: 45000, outputTokens: 67000, sessions: 1 },
    ],
    stats: { cost: 6620, inputTokens: 134000, outputTokens: 212000, sessions: 4 },
    images: [], kudosCount: 48, commentCount: 12, hasKudosed: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'p2', user: mockUsers[3], title: 'Built a full RAG pipeline in one afternoon',
    description: 'Used all four providers to compare embeddings quality. Antigravity surprised me.',
    providers: ['claude', 'codex', 'gemini', 'antigravity'], providerBreakdown: [
      { provider: 'claude', cost: 8900, inputTokens: 234000, outputTokens: 312000, sessions: 5 },
      { provider: 'codex', cost: 3200, inputTokens: 67000, outputTokens: 89000, sessions: 2 },
      { provider: 'gemini', cost: 2100, inputTokens: 56000, outputTokens: 78000, sessions: 2 },
      { provider: 'antigravity', cost: 1800, inputTokens: 45000, outputTokens: 56000, sessions: 1 },
    ],
    stats: { cost: 16000, inputTokens: 402000, outputTokens: 535000, sessions: 10 },
    images: [], kudosCount: 127, commentCount: 34, hasKudosed: true,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'p3', user: mockUsers[0], title: 'Shipped new dashboard with Claude',
    description: 'Analytics dashboard with 12 charts. Claude nailed the Recharts configs.',
    providers: ['claude'], providerBreakdown: [
      { provider: 'claude', cost: 5400, inputTokens: 156000, outputTokens: 198000, sessions: 6 },
    ],
    stats: { cost: 5400, inputTokens: 156000, outputTokens: 198000, sessions: 6 },
    images: [], kudosCount: 23, commentCount: 5, hasKudosed: false,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'p4', user: mockUsers[8], title: 'Automated CI/CD pipeline with Codex + Gemini',
    description: 'Full GitOps workflow: Codex for Terraform, Gemini for K8s manifests.',
    providers: ['codex', 'gemini'], providerBreakdown: [
      { provider: 'codex', cost: 12300, inputTokens: 345000, outputTokens: 456000, sessions: 8 },
      { provider: 'gemini', cost: 7800, inputTokens: 198000, outputTokens: 267000, sessions: 5 },
    ],
    stats: { cost: 20100, inputTokens: 543000, outputTokens: 723000, sessions: 13 },
    images: [], kudosCount: 89, commentCount: 21, hasKudosed: false,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'p5', user: mockUsers[6], title: 'Landing page redesign with Claude',
    description: 'Complete redesign. Went from concept to deploy in 3 hours.',
    providers: ['claude'], providerBreakdown: [
      { provider: 'claude', cost: 3200, inputTokens: 89000, outputTokens: 134000, sessions: 4 },
    ],
    stats: { cost: 3200, inputTokens: 89000, outputTokens: 134000, sessions: 4 },
    images: [], kudosCount: 56, commentCount: 8, hasKudosed: true,
    createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
  },
  {
    id: 'p6', user: mockUsers[5], title: 'Real-time collab feature with Gemini',
    description: 'WebSocket + CRDT implementation. Gemini handled the conflict resolution logic perfectly.',
    providers: ['gemini', 'claude'], providerBreakdown: [
      { provider: 'gemini', cost: 9800, inputTokens: 278000, outputTokens: 345000, sessions: 7 },
      { provider: 'claude', cost: 4500, inputTokens: 123000, outputTokens: 178000, sessions: 3 },
    ],
    stats: { cost: 14300, inputTokens: 401000, outputTokens: 523000, sessions: 10 },
    images: [], kudosCount: 72, commentCount: 15, hasKudosed: false,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: 'p7', user: mockUsers[2], title: 'Antigravity first impressions: mind-blown',
    description: 'Tried AG for the first time on a complex data pipeline. The context window is insane.',
    providers: ['antigravity'], providerBreakdown: [
      { provider: 'antigravity', cost: 6700, inputTokens: 189000, outputTokens: 234000, sessions: 3 },
    ],
    stats: { cost: 6700, inputTokens: 189000, outputTokens: 234000, sessions: 3 },
    images: [], kudosCount: 145, commentCount: 42, hasKudosed: false,
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
  {
    id: 'p8', user: mockUsers[4], title: 'Migrated 200 API endpoints',
    description: 'Express to Hono. Claude handled every single route conversion.',
    providers: ['claude'], providerBreakdown: [
      { provider: 'claude', cost: 18900, inputTokens: 567000, outputTokens: 789000, sessions: 15 },
    ],
    stats: { cost: 18900, inputTokens: 567000, outputTokens: 789000, sessions: 15 },
    images: [], kudosCount: 67, commentCount: 19, hasKudosed: false,
    createdAt: new Date(Date.now() - 96 * 3600000).toISOString(),
  },
  {
    id: 'p9', user: mockUsers[7], title: 'Mobile app MVP with Claude + Antigravity',
    description: 'React Native app from scratch. Claude for UI, AG for business logic.',
    providers: ['claude', 'antigravity'], providerBreakdown: [
      { provider: 'claude', cost: 7600, inputTokens: 234000, outputTokens: 312000, sessions: 6 },
      { provider: 'antigravity', cost: 4200, inputTokens: 112000, outputTokens: 156000, sessions: 3 },
    ],
    stats: { cost: 11800, inputTokens: 346000, outputTokens: 468000, sessions: 9 },
    images: [], kudosCount: 34, commentCount: 7, hasKudosed: false,
    createdAt: new Date(Date.now() - 120 * 3600000).toISOString(),
  },
  {
    id: 'p10', user: mockUsers[9], title: 'OSS contribution spree with Codex',
    description: 'Fixed 14 issues across 6 repos. Codex + good prompts = productivity machine.',
    providers: ['codex', 'claude'], providerBreakdown: [
      { provider: 'codex', cost: 5600, inputTokens: 178000, outputTokens: 234000, sessions: 14 },
      { provider: 'claude', cost: 1200, inputTokens: 34000, outputTokens: 45000, sessions: 2 },
    ],
    stats: { cost: 6800, inputTokens: 212000, outputTokens: 279000, sessions: 16 },
    images: [], kudosCount: 91, commentCount: 23, hasKudosed: true,
    createdAt: new Date(Date.now() - 144 * 3600000).toISOString(),
  },
];

export const mockComments: Comment[] = [
  { id: 'c1', user: mockUsers[2], content: 'This is insane productivity! What prompts are you using?', createdAt: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: 'c2', user: mockUsers[4], content: 'Codex is so underrated for auth work. Nice one @sarahcodes!', createdAt: new Date(Date.now() - 1.5 * 3600000).toISOString() },
  { id: 'c3', user: mockUsers[0], content: 'The RAG pipeline results look solid. Would love to see a comparison post.', createdAt: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'c4', user: mockUsers[5], content: 'Antigravity context window is a game changer for sure.', createdAt: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: 'c5', user: mockUsers[8], content: 'Just shipped something similar! The AI-assisted workflow is *chef kiss*.', createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'kudos', actor: mockUsers[1], post: mockPosts[2], read: false, createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 'n2', type: 'comment', actor: mockUsers[3], post: mockPosts[2], read: false, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'n3', type: 'follow', actor: mockUsers[5], read: false, createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'n4', type: 'mention', actor: mockUsers[6], post: mockPosts[0], read: true, createdAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: 'n5', type: 'kudos', actor: mockUsers[8], post: mockPosts[2], read: true, createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
];

export const mockLeaderboard: LeaderboardEntry[] = mockUsers
  .sort((a, b) => b.totalSpend - a.totalSpend)
  .map((user, i) => ({
    rank: i + 1,
    user,
    spend: user.totalSpend,
    tokens: user.totalTokens,
    streak: user.streak,
    providers: user.providers,
  }));

function generateHeatmap(): HeatmapDay[] {
  const days: HeatmapDay[] = [];
  const providers: Provider[] = ['claude', 'codex', 'gemini', 'antigravity'];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const hasActivity = Math.random() > 0.3;
    const intensity = hasActivity ? (Math.ceil(Math.random() * 4) as 1 | 2 | 3 | 4) : 0;
    days.push({
      date: date.toISOString().split('T')[0],
      spend: hasActivity ? Math.floor(Math.random() * 20000) + 500 : 0,
      dominantProvider: hasActivity ? providers[Math.floor(Math.random() * providers.length)] : null,
      intensity: intensity as 0 | 1 | 2 | 3 | 4,
    });
  }
  return days;
}

export const mockHeatmap: HeatmapDay[] = generateHeatmap();

export const mockAchievements: Achievement[] = ACHIEVEMENTS.map((a, i) => ({
  ...a,
  earned: i < 7,
  earnedAt: i < 7 ? new Date(Date.now() - (7 - i) * 7 * 86400000).toISOString() : undefined,
}));

export const mockTestimonials = [
  { id: 't1', author: '@jamesdev', handle: 'jamesdev', content: "straude made me realize I spend $400/mo on Claude. No regrets though 😂", provider: 'claude' as Provider },
  { id: 't2', author: '@ainatalie', handle: 'ainatalie', content: "The contribution graph showing which AI I used each day is genuinely beautiful.", provider: 'gemini' as Provider },
  { id: 't3', author: '@rustybytes', handle: 'rustybytes', content: "Competitive leaderboards for AI usage? I'm in. Already climbing the ranks 🏆", provider: 'codex' as Provider },
  { id: 't4', author: '@devmarcus', handle: 'devmarcus', content: "Finally a way to flex my AI-powered shipping speed. straude is Strava for nerds.", provider: 'claude' as Provider },
  { id: 't5', author: '@buildwithluna', handle: 'buildwithluna', content: "The multi-model tracking is a game changer. I can see exactly where each dollar goes.", provider: 'antigravity' as Provider },
  { id: 't6', author: '@codekait', handle: 'codekait', content: "47 day streak and counting. straude turned coding with AI into a sport 🔥", provider: 'claude' as Provider },
  { id: 't7', author: '@techpriya', handle: 'techpriya', content: "My team started using straude and now we have a daily standup about our AI usage stats 😄", provider: 'codex' as Provider },
  { id: 't8', author: '@shipit_tom', handle: 'shipit_tom', content: "The recap cards are so good. Sharing my monthly AI stats on Twitter like a boss.", provider: 'claude' as Provider },
];

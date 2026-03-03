import { Provider, Achievement } from './types';

export interface ProviderConfig {
  id: Provider;
  name: string;
  color: string;
  hslVar: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
}

export const PROVIDERS: Record<Provider, ProviderConfig> = {
  claude: {
    id: 'claude',
    name: 'Claude',
    color: '#E87A35',
    hslVar: 'var(--claude)',
    bgClass: 'bg-claude/10',
    textClass: 'text-claude',
    dotClass: 'bg-claude',
  },
  codex: {
    id: 'codex',
    name: 'Codex',
    color: '#22C55E',
    hslVar: 'var(--codex)',
    bgClass: 'bg-codex/10',
    textClass: 'text-codex',
    dotClass: 'bg-codex',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    color: '#3B82F6',
    hslVar: 'var(--gemini)',
    bgClass: 'bg-gemini/10',
    textClass: 'text-gemini',
    dotClass: 'bg-gemini',
  },
  antigravity: {
    id: 'antigravity',
    name: 'Antigravity',
    color: '#A855F7',
    hslVar: 'var(--antigravity)',
    bgClass: 'bg-antigravity/10',
    textClass: 'text-antigravity',
    dotClass: 'bg-antigravity',
  },
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-sync', name: 'First Sync', emoji: '🚀', description: 'Push your first session', earned: false },
  { id: 'week-warrior', name: 'Week Warrior', emoji: '⚔️', description: '7-day streak', earned: false },
  { id: 'power-user', name: 'Power User', emoji: '💪', description: '30-day streak', earned: false },
  { id: '100k-output', name: '100K Output', emoji: '📝', description: '100K output tokens in one session', earned: false },
  { id: '1m-output', name: '1M Output', emoji: '📚', description: '1M total output tokens', earned: false },
  { id: '100m-output', name: '100M Output', emoji: '🏛️', description: '100M total output tokens', earned: false },
  { id: 'big-spender', name: 'Big Spender', emoji: '💸', description: 'Spend $100 in a single session', earned: false },
  { id: 'elite', name: 'Elite', emoji: '👑', description: 'Top 10 on the leaderboard', earned: false },
  { id: 'polyglot', name: 'Polyglot Coder', emoji: '🌐', description: 'Use 2+ providers', earned: false },
  { id: 'full-stack-ai', name: 'Full Stack AI', emoji: '🤖', description: 'Use all 4 providers', earned: false },
  { id: 'codex-pioneer', name: 'Codex Pioneer', emoji: '🟢', description: 'First Codex session', earned: false },
  { id: 'gemini-explorer', name: 'Gemini Explorer', emoji: '🔵', description: 'First Gemini session', earned: false },
  { id: 'antigravity-adept', name: 'Antigravity Adept', emoji: '🟣', description: 'First Antigravity session', earned: false },
];

export const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
];

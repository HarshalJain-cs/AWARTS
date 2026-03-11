import { forwardRef } from 'react';

export type SharePlatform = 'x' | 'instagram' | 'linkedin' | 'whatsapp';

export interface PlatformCardData {
  type: 'session' | 'profile';
  username: string;
  avatarUrl?: string;
  // Session-specific
  cost?: number;
  tokens?: number;
  providers?: string[];
  streak?: number;
  date?: string;
  // Profile-specific
  totalCost?: number;
  totalDays?: number;
  followers?: number;
}

// Platform dimensions
const PLATFORM_SIZE: Record<SharePlatform, { w: number; h: number }> = {
  x: { w: 1200, h: 675 },
  instagram: { w: 1080, h: 1080 },
  linkedin: { w: 1200, h: 627 },
  whatsapp: { w: 800, h: 800 },
};

function formatCostVal(n?: number): string {
  return `$${(n ?? 0).toFixed(2)}`;
}

function formatTokensVal(n?: number): string {
  if (!n) return '0';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// --- X Card: Dark, cinematic landscape ---
function XCard({ data }: { data: PlatformCardData }) {
  const isSession = data.type === 'session';
  return (
    <div
      style={{
        width: 1200,
        height: 675,
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 64,
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background accent */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)' }} />

      {/* Top: Branding + User */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {data.avatarUrl && (
            <img src={data.avatarUrl} alt="" style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', objectFit: 'cover' }} />
          )}
          <div>
            <div style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>@{data.username}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 4 }}>
              {isSession ? `Session ${data.date ? `· ${data.date}` : ''}` : 'AI Coding Profile'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 28, background: '#fff', clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
          <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: 18, fontWeight: 700, letterSpacing: 3 }}>AWARTS</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 1 }}>
        {isSession ? (
          <>
            <StatBox label="COST" value={formatCostVal(data.cost)} accent="#6366f1" />
            <StatBox label="TOKENS" value={formatTokensVal(data.tokens)} accent="#8b5cf6" />
            {data.streak ? <StatBox label="STREAK" value={`${data.streak}d`} accent="#a855f7" /> : null}
          </>
        ) : (
          <>
            <StatBox label="TOTAL SPENT" value={formatCostVal(data.totalCost)} accent="#6366f1" />
            <StatBox label="DAYS ACTIVE" value={String(data.totalDays ?? 0)} accent="#8b5cf6" />
            <StatBox label="STREAK" value={`${data.streak ?? 0}d`} accent="#a855f7" />
            {data.followers != null && <StatBox label="FOLLOWERS" value={String(data.followers)} accent="#c084fc" />}
          </>
        )}
      </div>

      {/* Bottom: Providers + URL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
          {(data.providers ?? []).map((p) => (
            <span key={p} style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 20,
              padding: '6px 16px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 14,
              fontWeight: 500,
              textTransform: 'capitalize' as const,
            }}>{p}</span>
          ))}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, fontFamily: 'monospace' }}>awarts.com/u/{data.username}</div>
      </div>
    </div>
  );
}

// --- Instagram Card: Bold square with gradient ---
function InstagramCard({ data }: { data: PlatformCardData }) {
  const isSession = data.type === 'session';
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative rings */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 900, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <div style={{ width: 18, height: 26, background: '#fff', clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
        <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: 20, fontWeight: 700, letterSpacing: 4 }}>AWARTS</span>
      </div>

      {/* Avatar */}
      {data.avatarUrl && (
        <img
          src={data.avatarUrl}
          alt=""
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: '4px solid rgba(255,255,255,0.2)',
            objectFit: 'cover',
            marginBottom: 20,
            position: 'relative',
            zIndex: 1,
          }}
        />
      )}

      {/* Username */}
      <div style={{ color: '#fff', fontSize: 40, fontWeight: 800, textAlign: 'center' as const, marginBottom: 8, position: 'relative', zIndex: 1 }}>
        @{data.username}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, marginBottom: 48, position: 'relative', zIndex: 1 }}>
        {isSession ? 'AI Coding Session' : 'AI Coding Stats'}
      </div>

      {/* Stats (centered 2x2 grid for profile, row for session) */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 20, justifyContent: 'center', maxWidth: 600, position: 'relative', zIndex: 1 }}>
        {isSession ? (
          <>
            <IGStatBox label="Cost" value={formatCostVal(data.cost)} />
            <IGStatBox label="Tokens" value={formatTokensVal(data.tokens)} />
            {data.streak ? <IGStatBox label="Streak" value={`${data.streak}d`} /> : null}
          </>
        ) : (
          <>
            <IGStatBox label="Total Spent" value={formatCostVal(data.totalCost)} />
            <IGStatBox label="Days Active" value={String(data.totalDays ?? 0)} />
            <IGStatBox label="Streak" value={`${data.streak ?? 0}d`} />
            {data.followers != null && <IGStatBox label="Followers" value={String(data.followers)} />}
          </>
        )}
      </div>

      {/* Providers */}
      {(data.providers ?? []).length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' as const, justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          {(data.providers ?? []).map((p) => (
            <span key={p} style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 24,
              padding: '8px 20px',
              color: 'rgba(255,255,255,0.9)',
              fontSize: 16,
              fontWeight: 600,
              textTransform: 'capitalize' as const,
            }}>{p}</span>
          ))}
        </div>
      )}

      {/* Footer URL */}
      <div style={{ position: 'absolute', bottom: 40, color: 'rgba(255,255,255,0.3)', fontSize: 16, fontFamily: 'monospace', zIndex: 1 }}>
        awarts.com/u/{data.username}
      </div>
    </div>
  );
}

// --- LinkedIn Card: Professional, clean landscape ---
function LinkedInCard({ data }: { data: PlatformCardData }) {
  const isSession = data.type === 'session';
  return (
    <div
      style={{
        width: 1200,
        height: 627,
        background: 'linear-gradient(135deg, #0a1628 0%, #1e293b 60%, #0f172a 100%)',
        display: 'flex',
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left accent bar */}
      <div style={{ width: 6, background: 'linear-gradient(to bottom, #3b82f6, #6366f1, #8b5cf6)', flexShrink: 0 }} />

      <div style={{ flex: 1, padding: 56, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Top: Branding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 18, height: 26, background: '#fff', clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
            <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 3 }}>AWARTS</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginLeft: 8 }}>The Strava for AI Coding</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'monospace' }}>awarts.com</div>
        </div>

        {/* Middle: User + Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, minWidth: 280 }}>
            {data.avatarUrl && (
              <img src={data.avatarUrl} alt="" style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.15)', objectFit: 'cover' }} />
            )}
            <div>
              <div style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>@{data.username}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 4 }}>
                {isSession ? 'Session Report' : 'Developer Profile'}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 20, flex: 1 }}>
            {isSession ? (
              <>
                <LIStatBox label="Cost" value={formatCostVal(data.cost)} />
                <LIStatBox label="Tokens" value={formatTokensVal(data.tokens)} />
                {data.streak ? <LIStatBox label="Streak" value={`${data.streak}d`} /> : null}
              </>
            ) : (
              <>
                <LIStatBox label="Total Spent" value={formatCostVal(data.totalCost)} />
                <LIStatBox label="Days Active" value={String(data.totalDays ?? 0)} />
                <LIStatBox label="Streak" value={`${data.streak ?? 0}d`} />
              </>
            )}
          </div>
        </div>

        {/* Bottom: Providers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {(data.providers ?? []).map((p) => (
              <span key={p} style={{
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: 6,
                padding: '5px 14px',
                color: 'rgba(255,255,255,0.75)',
                fontSize: 13,
                fontWeight: 500,
                textTransform: 'capitalize' as const,
              }}>{p}</span>
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'monospace' }}>
            awarts.com/u/{data.username}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- WhatsApp Card: Friendly square with green accent ---
function WhatsAppCard({ data }: { data: PlatformCardData }) {
  const isSession = data.type === 'session';
  return (
    <div
      style={{
        width: 800,
        height: 800,
        background: 'linear-gradient(145deg, #111827 0%, #1f2937 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 56,
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Green accent stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(to right, #22c55e, #10b981)' }} />

      {/* Top: Branding */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 24, background: '#22c55e', clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
          <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 3 }}>AWARTS</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{isSession ? 'Session' : 'Profile'}</span>
      </div>

      {/* Center: Avatar + User + Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        {data.avatarUrl && (
          <img src={data.avatarUrl} alt="" style={{ width: 96, height: 96, borderRadius: '50%', border: '3px solid rgba(34,197,94,0.3)', objectFit: 'cover' }} />
        )}
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ color: '#fff', fontSize: 30, fontWeight: 700 }}>@{data.username}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 4 }}>
            {isSession ? `Coded with AI ${data.date ? `· ${data.date}` : ''}` : 'AI Coding Journey'}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 16, justifyContent: 'center' }}>
          {isSession ? (
            <>
              <WAStatBox label="Cost" value={formatCostVal(data.cost)} />
              <WAStatBox label="Tokens" value={formatTokensVal(data.tokens)} />
              {data.streak ? <WAStatBox label="Streak" value={`${data.streak}d`} /> : null}
            </>
          ) : (
            <>
              <WAStatBox label="Spent" value={formatCostVal(data.totalCost)} />
              <WAStatBox label="Days" value={String(data.totalDays ?? 0)} />
              <WAStatBox label="Streak" value={`${data.streak ?? 0}d`} />
            </>
          )}
        </div>
      </div>

      {/* Bottom: Providers + URL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          {(data.providers ?? []).map((p) => (
            <span key={p} style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 16,
              padding: '4px 14px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 13,
              fontWeight: 500,
              textTransform: 'capitalize' as const,
            }}>{p}</span>
          ))}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'monospace' }}>awarts.com/u/{data.username}</div>
      </div>
    </div>
  );
}

// --- Stat box sub-components per platform ---

function StatBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      flex: 1,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '20px 24px',
      borderTop: `3px solid ${accent}`,
    }}>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#fff', fontSize: 36, fontWeight: 800, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

function IGStatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      width: 260,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: '20px 28px',
      textAlign: 'center' as const,
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#fff', fontSize: 36, fontWeight: 800, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

function LIStatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      flex: 1,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '16px 20px',
    }}>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 6 }}>{label}</div>
      <div style={{ color: '#fff', fontSize: 30, fontWeight: 800, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

function WAStatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      minWidth: 180,
      background: 'rgba(34,197,94,0.06)',
      border: '1px solid rgba(34,197,94,0.15)',
      borderRadius: 16,
      padding: '16px 24px',
      textAlign: 'center' as const,
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 6 }}>{label}</div>
      <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

// --- Main exported component ---

interface PlatformShareCardProps {
  platform: SharePlatform;
  data: PlatformCardData;
}

export const PlatformShareCard = forwardRef<HTMLDivElement, PlatformShareCardProps>(
  ({ platform, data }, ref) => {
    const size = PLATFORM_SIZE[platform];
    return (
      <div
        ref={ref}
        style={{
          width: size.w,
          height: size.h,
          position: 'absolute',
          left: -9999,
          top: -9999,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        {platform === 'x' && <XCard data={data} />}
        {platform === 'instagram' && <InstagramCard data={data} />}
        {platform === 'linkedin' && <LinkedInCard data={data} />}
        {platform === 'whatsapp' && <WhatsAppCard data={data} />}
      </div>
    );
  }
);

PlatformShareCard.displayName = 'PlatformShareCard';

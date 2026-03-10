import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Post } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { ProviderChip } from './ProviderChip';
import { StatsGrid } from './StatsGrid';
import { KudosButton } from './KudosButton';
import { SocialShareMenu } from './SocialShareMenu';
import { MessageCircle, Share2, ChevronDown, BadgeCheck, ShieldCheck, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatCost, formatTokens } from '@/lib/format';
import { PROVIDERS } from '@/lib/constants';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
  post: Post;
  index?: number;
  showInlineComments?: boolean;
}

// Image grid layout component
function ImageGrid({ images, onImageClick }: { images: string[]; onImageClick: (index: number) => void }) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <button onClick={() => onImageClick(0)} className="w-full rounded-md overflow-hidden border border-border">
        <img src={images[0]} alt="Post image" className="w-full max-h-80 object-cover" />
      </button>
    );
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-md overflow-hidden border border-border">
        {images.map((url, i) => (
          <button key={i} onClick={() => onImageClick(i)}>
            <img src={url} alt={`Image ${i + 1}`} className="w-full h-48 object-cover" />
          </button>
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-md overflow-hidden border border-border">
        <button onClick={() => onImageClick(0)} className="row-span-2">
          <img src={images[0]} alt="Image 1" className="w-full h-full object-cover" />
        </button>
        {images.slice(1).map((url, i) => (
          <button key={i} onClick={() => onImageClick(i + 1)}>
            <img src={url} alt={`Image ${i + 2}`} className="w-full h-[calc(50%-2px)] object-cover" />
          </button>
        ))}
      </div>
    );
  }

  // 4+ images: 2x2 grid with +N overlay
  return (
    <div className="grid grid-cols-2 gap-1 rounded-md overflow-hidden border border-border">
      {images.slice(0, 4).map((url, i) => (
        <button key={i} onClick={() => onImageClick(i)} className="relative">
          <img src={url} alt={`Image ${i + 1}`} className="w-full h-36 object-cover" />
          {i === 3 && images.length > 4 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-lg font-bold">+{images.length - 4}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// Lightbox component
function ImageLightbox({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
        <X className="h-6 w-6" />
      </button>
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length); }}
            className="absolute left-4 text-white/70 hover:text-white"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % images.length); }}
            className="absolute right-4 text-white/70 hover:text-white"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}
      <img
        src={images[index]}
        alt={`Image ${index + 1}`}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <div className="absolute bottom-4 text-white/70 text-sm">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

export function ActivityCard({ post, index = 0, showInlineComments = false }: ActivityCardProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Check if post has verified (CLI-submitted) data
  const isVerified = post.providerBreakdown.length > 0;

  // Provider percentage badges
  const totalCost = post.stats.cost || 1;
  const providerPercentages = post.providerBreakdown.map((pb) => ({
    provider: pb.provider,
    percentage: Math.round((pb.cost / totalCost) * 100),
  }));

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.35, delay: index * 0.08 }}
        className="rounded-lg border border-border bg-card p-5 space-y-3.5"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to={`/u/${post.user.username}`}>
            <img src={post.user.avatar || '/placeholder.svg'} alt={post.user.displayName} className="h-10 w-10 rounded-full object-cover" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link to={`/u/${post.user.username}`} className="font-semibold text-sm text-foreground hover:underline truncate">
                @{post.user.username}
              </Link>
              {post.user.isVerified && <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />}
              {isVerified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary bg-primary/10 rounded px-1.5 py-0.5">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatDate(post.createdAt)}</span>
              {/* Provider percentage badges */}
              {providerPercentages.length > 0 && (
                <div className="flex gap-1">
                  {providerPercentages.map((pp) => (
                    <span
                      key={pp.provider}
                      className={cn('text-[10px] font-medium', PROVIDERS[pp.provider]?.textClass)}
                    >
                      {pp.percentage}% {PROVIDERS[pp.provider]?.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        {post.title && (
          <Link to={`/post/${post.id}`}>
            <h3 className="font-semibold text-foreground hover:text-primary transition-colors">{post.title}</h3>
          </Link>
        )}

        {/* Description */}
        {post.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{post.description}</p>
        )}

        {/* Images */}
        {post.images.length > 0 && (
          <ImageGrid images={post.images} onImageClick={setLightboxIndex} />
        )}

        {/* Model usage bar — stacked bar showing cost distribution across providers */}
        {providerPercentages.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-muted/50">
              {providerPercentages.map((pp) => (
                <div
                  key={pp.provider}
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.max(pp.percentage, 2)}%`,
                    backgroundColor: PROVIDERS[pp.provider]?.color ?? '#888',
                  }}
                  title={`${PROVIDERS[pp.provider]?.name}: ${pp.percentage}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {providerPercentages.map((pp) => (
                <span key={pp.provider} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: PROVIDERS[pp.provider]?.color }}
                  />
                  {PROVIDERS[pp.provider]?.name} {pp.percentage}%
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Provider chips (shown when no breakdown data) */}
        {providerPercentages.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.providers.map((p) => (
              <ProviderChip key={p} provider={p} />
            ))}
          </div>
        )}

        {/* Stats */}
        <StatsGrid {...post.stats} />

        {/* Provider breakdown (collapsible) */}
        {post.providerBreakdown.length > 1 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className="h-3.5 w-3.5" />
              Provider breakdown
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-2 text-xs">
                {post.providerBreakdown.map((pb) => (
                  <div key={pb.provider} className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-1.5">
                    <span className={PROVIDERS[pb.provider]?.textClass}>{PROVIDERS[pb.provider]?.name}</span>
                    <span className="font-mono text-muted-foreground">
                      {formatCost(pb.cost)} · {formatTokens(pb.outputTokens)} out
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1 border-t border-border">
          <KudosButton postId={post.id} count={post.kudosCount} hasKudosed={post.hasKudosed} />
          <Link
            to={`/post/${post.id}`}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            {post.commentCount}
          </Link>
          <SocialShareMenu
            data={{
              type: 'session',
              username: post.user.username,
              url: `${window.location.origin}/post/${post.id}`,
              cost: post.stats.cost,
              tokens: (post.stats.outputTokens ?? 0) + (post.stats.inputTokens ?? 0),
              providers: post.providers,
              date: post.createdAt,
            }}
            trigger={
              <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-auto cursor-pointer">
                <Share2 className="h-4 w-4" />
                Share
              </span>
            }
          />
        </div>
      </motion.article>

      {/* Image Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={post.images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

import { Link } from 'react-router-dom';
import { Post } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { ProviderChip } from './ProviderChip';
import { StatsGrid } from './StatsGrid';
import { KudosButton } from './KudosButton';
import { MessageCircle, Share2, ChevronDown, BadgeCheck } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatCost, formatTokens } from '@/lib/format';
import { PROVIDERS } from '@/lib/constants';
import { motion } from 'framer-motion';

interface ActivityCardProps {
  post: Post;
  index?: number;
}

export function ActivityCard({ post, index = 0 }: ActivityCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="rounded-lg border border-border bg-card p-5 space-y-3.5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={`/u/${post.user.username}`}>
          <img src={post.user.avatar} alt={post.user.displayName} className="h-10 w-10 rounded-full object-cover" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link to={`/u/${post.user.username}`} className="font-semibold text-sm text-foreground hover:underline truncate">
              @{post.user.username}
            </Link>
            {post.user.isVerified && <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
        </div>
      </div>

      {/* Title */}
      <Link to={`/post/${post.id}`}>
        <h3 className="font-semibold text-foreground hover:text-primary transition-colors">{post.title}</h3>
      </Link>

      {/* Description */}
      {post.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{post.description}</p>
      )}

      {/* Provider chips */}
      <div className="flex flex-wrap gap-1.5">
        {post.providers.map((p) => (
          <ProviderChip key={p} provider={p} />
        ))}
      </div>

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
                  <span className={PROVIDERS[pb.provider].textClass}>{PROVIDERS[pb.provider].name}</span>
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
        <KudosButton count={post.kudosCount} hasKudosed={post.hasKudosed} />
        <Link
          to={`/post/${post.id}`}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {post.commentCount}
        </Link>
      <button
          onClick={() => {
            const url = `${window.location.origin}/post/${post.id}`;
            if (navigator.share) {
              navigator.share({ title: post.title, url });
            } else {
              navigator.clipboard.writeText(url);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-auto"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  );
}

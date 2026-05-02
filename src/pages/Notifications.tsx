import { AppShell } from '@/components/layout/AppShell';
import { AuthGate } from '@/components/AuthGate';
import { useNotifications, useMarkNotificationsRead } from '@/hooks/use-api';
import { transformNotification } from '@/lib/transformers';
import { formatDate } from '@/lib/format';
import { Zap, MessageCircle, AtSign, UserPlus, Award, Bell, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';
import { motion } from 'framer-motion';

const iconMap: Record<string, typeof Zap> = {
  kudos: Zap,
  comment: MessageCircle,
  mention: AtSign,
  follow: UserPlus,
  achievement: Award,
};

const labelMap: Record<string, string> = {
  kudos: 'gave you kudos',
  comment: 'commented on your post',
  mention: 'mentioned you',
  follow: 'started following you',
  achievement: 'Achievement unlocked!',
};

export default function Notifications() {
  return (
    <AuthGate>
      <NotificationsContent />
    </AuthGate>
  );
}

function NotificationsContent() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const notifications = data?.notifications.map(transformNotification) ?? [];
  const unreadCount = data?.unread_count ?? 0;

  return (
    <AppShell>
      <SEO title="Notifications" description="Your latest notifications on AWARTS — kudos, comments, mentions, and follows." noindex />
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markRead.mutate()}
              disabled={markRead.isPending}
            >
              <Check className="h-4 w-4 mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No notifications yet</p>
            <p className="text-sm mt-1">When someone interacts with your posts, you'll see it here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {notifications.map((n, i) => {
              const Icon = iconMap[n.type] ?? Zap;
              const linkTo = n.type === 'follow'
                ? `/u/${n.actor.username}`
                : n.post
                  ? `/post/${n.post.id}`
                  : `/notifications`;

              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <Link
                    to={linkTo}
                    className={cn(
                      'flex items-start gap-3 px-4 py-4 text-sm hover:bg-muted/50 transition-colors',
                      !n.read && 'bg-primary/5'
                    )}
                  >
                    <div className="shrink-0 mt-0.5 rounded-full bg-muted p-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <img
                      src={n.actor.avatar || '/placeholder.svg'}
                      alt={n.actor.username}
                      className="h-10 w-10 rounded-full shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">
                        <span className="font-semibold">@{n.actor.username}</span>{' '}
                        <span className="text-muted-foreground">{labelMap[n.type] ?? n.type}</span>
                      </p>
                      {n.post && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {n.post.title || `Session on ${n.post.createdAt}`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

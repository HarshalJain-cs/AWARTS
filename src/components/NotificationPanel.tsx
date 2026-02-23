import { mockNotifications } from '@/lib/mock-data';
import { formatDate } from '@/lib/format';
import { Zap, MessageCircle, AtSign, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  kudos: Zap,
  comment: MessageCircle,
  mention: AtSign,
  follow: UserPlus,
};

const labelMap = {
  kudos: 'gave you kudos',
  comment: 'commented on your post',
  mention: 'mentioned you',
  follow: 'started following you',
};

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  return (
    <div className="w-80 rounded-lg border border-border bg-popover shadow-lg" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <button className="text-xs text-primary hover:underline">Mark all read</button>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-border">
        {mockNotifications.map((n) => {
          const Icon = iconMap[n.type];
          return (
            <div
              key={n.id}
              className={cn(
                'flex items-start gap-3 px-4 py-3 text-sm',
                !n.read && 'bg-primary/5'
              )}
            >
              <Icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-foreground">
                  <span className="font-semibold">@{n.actor.username}</span>{' '}
                  <span className="text-muted-foreground">{labelMap[n.type]}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(n.createdAt)}</p>
              </div>
              {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

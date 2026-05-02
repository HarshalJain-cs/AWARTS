import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from '@/hooks/use-toast';
import type { Id } from '../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';

interface ReportDialogProps {
  targetType: 'post' | 'user';
  targetPostId?: Id<'posts'>;
  targetUserId?: Id<'users'>;
  trigger?: React.ReactNode;
}

const REASONS = [
  { value: 'spam', label: 'Spam', desc: 'Irrelevant or promotional content' },
  { value: 'fake_data', label: 'Fake Data', desc: 'Manipulated or fabricated usage stats' },
  { value: 'harassment', label: 'Harassment', desc: 'Targeting or bullying behavior' },
  { value: 'inappropriate', label: 'Inappropriate', desc: 'Content that violates community guidelines' },
  { value: 'other', label: 'Other', desc: 'Something else' },
];

export function ReportDialog({ targetType, targetPostId, targetUserId, trigger }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submitReport = useMutation(api.reports.submitReport);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await submitReport({
        targetType,
        targetPostId,
        targetUserId,
        reason,
        details: details.trim() || undefined,
      });
      toast({ title: 'Report submitted', description: 'We\'ll review this shortly. Thank you.' });
      setOpen(false);
      setReason('');
      setDetails('');
    } catch (err: any) {
      toast({
        title: 'Failed to submit report',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="text-muted-foreground hover:text-destructive transition-colors">
            <Flag className="h-4 w-4" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {targetType === 'post' ? 'Post' : 'User'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Reason</Label>
            <div className="grid gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={cn(
                    'text-left rounded-lg border p-3 transition-all',
                    reason === r.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-foreground/30'
                  )}
                >
                  <p className="text-sm font-medium text-foreground">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Additional details (optional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 500))}
              placeholder="Provide any additional context..."
              className="resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!reason || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

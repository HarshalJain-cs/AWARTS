import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGate } from '@/components/AuthGate';
import { useAuth } from '@/context/AuthContext';
import { usePrompts, useSubmitPrompt, useTogglePromptVote } from '@/hooks/use-api';
import { PromptCard } from '@/components/PromptCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Lightbulb, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';

export default function Prompts() {
  return (
    <AuthGate>
      <PromptsContent />
    </AuthGate>
  );
}

const STARTER_IDEAS = [
  'Feature request: "Add keyboard shortcuts for editing posts"',
  'Bug fix: "Comments flash as anonymous after posting"',
  'UI nitpick: "Tighten spacing in the feed cards"',
  'Growth idea: "Add a referral badge to help more people discover AWARTS"',
];

function PromptsContent() {
  const { user } = useAuth();
  const { data: promptsData, isLoading } = usePrompts();
  const submitPrompt = useSubmitPrompt();
  const toggleVote = useTogglePromptVote();

  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await submitPrompt.mutateAsync({ content: content.trim(), isAnonymous });
      setContent('');
      toast({ title: 'Prompt submitted!', description: 'Thanks for your suggestion.' });
    } catch (err: any) {
      toast({ title: 'Failed to submit', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  function handleVote(promptId: string) {
    toggleVote.mutate({ promptId });
  }

  const prompts = promptsData?.prompts ?? [];

  return (
    <AppShell>
      <SEO title="Community Prompts" description="Submit a prompt to suggest what AWARTS should build or improve next." />
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Submit a Prompt</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prompt a coding agent to build what you want to see in AWARTS. If we like your prompt, we'll run it and merge the result.
          </p>
        </div>

        {/* Submit form */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-input" className="text-sm font-medium">
              What should we build or improve?
            </Label>
            <Textarea
              id="prompt-input"
              placeholder="Describe a feature, bug fix, UI improvement, or growth idea..."
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 2000))}
              rows={4}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{content.length}/2000</span>
              <div className="flex items-center gap-2">
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
                <Label htmlFor="anonymous" className="text-xs text-muted-foreground cursor-pointer">
                  Submit as anonymous
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {!isAnonymous && user && (
              <span className="text-xs text-muted-foreground">
                Submitting as <span className="font-medium text-foreground">@{user.username}</span>
              </span>
            )}
            {isAnonymous && <span />}
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit prompt'}
            </Button>
          </div>
        </div>

        {/* Starter ideas */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ideas to get started</p>
          <div className="grid gap-2">
            {STARTER_IDEAS.map((idea) => (
              <button
                key={idea}
                onClick={() => setContent(idea)}
                className="text-left text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 rounded-md px-3 py-2 transition-colors"
              >
                <Lightbulb className="h-3 w-3 inline mr-1.5 opacity-50" />
                {idea}
              </button>
            ))}
          </div>
        </div>

        {/* Community prompts list */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Community Prompts</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : prompts.length > 0 ? (
            <div className="space-y-3">
              {prompts.map((prompt) => (
                <PromptCard
                  key={prompt._id}
                  prompt={prompt}
                  onVote={handleVote}
                  isAuthenticated={!!user}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No prompts yet. Be the first to submit one!</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

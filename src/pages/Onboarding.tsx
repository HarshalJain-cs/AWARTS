import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUpdateProfile, useCheckUsername } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, PROVIDERS } from '@/lib/constants';
import { Check, Copy, ArrowRight, ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';
import { cn } from '@/lib/utils';

const TOTAL_STEPS = 5;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [copiedDaemon, setCopiedDaemon] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: usernameCheck } = useCheckUsername(username);
  const usernameAvailable = username.length >= 3 && (usernameCheck?.available ?? false);

  const toggleProvider = (id: string) => {
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const copyCmd = () => {
    navigator.clipboard.writeText('npx awarts@latest');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveApiKeys = () => {
    Object.entries(apiKeys).forEach(([provider, key]) => {
      if (key.trim()) {
        localStorage.setItem(`awarts_apikey_${provider}`, key.trim());
      }
    });
    setStep(5);
  };

  const handleFinish = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        username,
        country,
        defaultAiProvider: selectedProviders[0] ?? 'claude',
      });
      setSaving(false);
      toast({ title: 'Welcome to AWARTS!' });
      navigate('/feed', { replace: true });
    } catch {
      setSaving(false);
      toast({ title: 'Failed to save profile', variant: 'destructive' });
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  const nonClaudeProviders = selectedProviders.filter((p) => p !== 'claude');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <SEO title="Get Started" description="Set up your AWARTS profile and start tracking your AI coding sessions." noindex />
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-8 w-6 bg-primary" style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
          <span className="font-mono text-xl font-bold text-foreground">AWARTS</span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                s < step
                  ? 'bg-primary text-primary-foreground'
                  : s === step
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {s < step ? <Check className="h-3.5 w-3.5" /> : s}
            </div>
          ))}
        </div>

        <Progress value={(step / TOTAL_STEPS) * 100} className="h-1" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-label="Onboarding progress" />

        <AnimatePresence mode="wait">
          {/* Step 1: Username */}
          {step === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground text-center">Choose your username</h2>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="alexdev"
                  className="bg-muted/50"
                />
                {username.length > 0 && (
                  <p className={`text-xs ${usernameAvailable ? 'text-primary' : 'text-destructive'}`}>
                    {username.length < 3
                      ? 'At least 3 characters'
                      : usernameCheck === undefined
                        ? 'Checking...'
                        : usernameAvailable
                          ? 'Available'
                          : usernameCheck?.reason ?? 'Username taken'}
                  </p>
                )}
              </div>
              <Button className="w-full" onClick={() => setStep(2)} disabled={!usernameAvailable}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Country */}
          {step === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground text-center">Where are you from?</h2>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)} disabled={!country}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Provider Selection */}
          {step === 3 && (
            <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground text-center">Which AI tools do you use?</h2>
              <p className="text-sm text-muted-foreground text-center">Select the providers you code with. You can change this later.</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(PROVIDERS).map((p) => {
                  const selected = selectedProviders.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProvider(p.id)}
                      className={cn(
                        'relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-all duration-200',
                        selected
                          ? 'border-primary bg-primary/10 shadow-md shadow-primary/10 scale-[1.02]'
                          : 'border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30'
                      )}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.name[0]}
                      </div>
                      <span className="font-medium text-sm text-foreground">{p.name}</span>
                      <span
                        className="h-1.5 w-8 rounded-full"
                        style={{ backgroundColor: p.color, opacity: selected ? 1 : 0.3 }}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(4)} disabled={selectedProviders.length === 0}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: API Keys (Optional) */}
          {step === 4 && (
            <motion.div key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground text-center">API Keys</h2>
              <p className="text-sm text-muted-foreground text-center">
                Optional — enhance tracking with API keys. You can skip this and add them later in Settings.
              </p>

              {selectedProviders.includes('claude') && (
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: PROVIDERS.claude.color }}
                    >
                      C
                    </div>
                    <span className="font-medium text-sm text-foreground">Claude</span>
                    <span className="ml-auto text-xs text-primary font-medium">Auto-detected</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-8">
                    No API key needed. Usage is automatically read from <code className="bg-muted px-1 rounded">~/.claude/usage/</code>
                  </p>
                </div>
              )}

              {nonClaudeProviders.map((providerId) => {
                const provider = PROVIDERS[providerId as keyof typeof PROVIDERS];
                if (!provider) return null;
                return (
                  <div key={providerId} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: provider.color }}
                      >
                        {provider.name[0]}
                      </div>
                      <Label className="text-sm">{provider.name} API Key</Label>
                    </div>
                    <div className="relative">
                      <Input
                        type={showKeys[providerId] ? 'text' : 'password'}
                        value={apiKeys[providerId] ?? ''}
                        onChange={(e) => setApiKeys((prev) => ({ ...prev, [providerId]: e.target.value }))}
                        placeholder={`Enter your ${provider.name} API key (optional)`}
                        className="bg-muted/50 font-mono text-xs pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showKeys[providerId] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Shield className="h-3.5 w-3.5" />
                  Your keys are safe
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  API keys are stored <strong>locally on your machine only</strong> and are never sent to our servers.
                  AWARTS is fully open source — you can verify the code yourself.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => setStep(5)}>
                  Skip
                </Button>
                {nonClaudeProviders.length > 0 && Object.values(apiKeys).some((k) => k.trim()) && (
                  <Button className="flex-1" onClick={saveApiKeys}>
                    Save & Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {(nonClaudeProviders.length === 0 || !Object.values(apiKeys).some((k) => k.trim())) && (
                  <Button className="flex-1" onClick={() => setStep(5)}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 5: CLI Install */}
          {step === 5 && (
            <motion.div key="step5" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground text-center">Install the CLI</h2>
              <p className="text-sm text-muted-foreground text-center">Run this command to start tracking your sessions:</p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-sm">
                <span className="text-muted-foreground select-none">$</span>
                <code className="flex-1 text-foreground">npx awarts@latest</code>
                <button onClick={copyCmd} className="text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">Then enable automatic syncing:</p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-sm">
                <span className="text-muted-foreground select-none">$</span>
                <code className="flex-1 text-foreground">npx awarts@latest daemon start</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('npx awarts@latest daemon start');
                    setCopiedDaemon(true);
                    setTimeout(() => setCopiedDaemon(false), 2000);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedDaemon ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {/* Quick guide */}
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Quick Guide</p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="text-primary font-medium">What to do:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>Use Claude, Codex, Gemini, or Antigravity as usual</li>
                    <li>Run <code className="bg-muted px-1 rounded">awarts sync</code> to push sessions</li>
                    <li>Start the daemon for auto-sync every 5 minutes</li>
                    <li>Follow other devs and give kudos</li>
                  </ul>
                  <p className="text-destructive font-medium mt-2">What NOT to do:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>Don't share your CLI auth token with others</li>
                    <li>Don't manually edit local provider files</li>
                    <li>Don't submit fake usage data</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={handleFinish} disabled={saving}>
                  {saving ? 'Saving...' : 'Start Tracking'} {!saving && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

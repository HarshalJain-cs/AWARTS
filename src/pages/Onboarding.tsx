import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUpdateProfile, useCheckUsername } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/lib/constants';
import { Check, Copy, ArrowRight, ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: usernameCheck } = useCheckUsername(username);
  const usernameAvailable = username.length >= 3 && (usernameCheck?.available ?? false);

  const copyCmd = () => {
    navigator.clipboard.writeText('npx awarts@latest');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ username, country });
      toast({ title: 'Welcome to AWARTS!' });
      navigate('/feed', { replace: true });
    } catch {
      setSaving(false);
      toast({ title: 'Failed to save profile', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-8 w-6 bg-primary" style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
          <span className="font-mono text-xl font-bold text-foreground">AWARTS</span>
        </div>

        <Progress value={(step / 3) * 100} className="h-1" />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
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
              <Button
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!usernameAvailable}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
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

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-foreground text-center">Install the CLI</h2>
              <p className="text-sm text-muted-foreground text-center">Run this command to start tracking your sessions:</p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-sm">
                <code className="flex-1 text-foreground">npx awarts@latest</code>
                <button onClick={copyCmd} className="text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>
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

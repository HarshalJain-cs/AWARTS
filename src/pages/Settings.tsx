import { useState, useEffect, useRef, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGate } from '@/components/AuthGate';
import { useAuth } from '@/context/AuthContext';
import { useUser } from '@clerk/clerk-react';
import { useCurrentUser, useUpdateProfile, useUploadAvatar, useImportUsage } from '@/hooks/use-api';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Loader2, Check, Copy, FileUp, X, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';

export default function Settings() {
  return (
    <AuthGate>
      <SettingsContent />
    </AuthGate>
  );
}

// ── CSV Parser ──────────────────────────────────────────────────────────
function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

interface ImportEntry {
  date: string;
  provider: string;
  cost_usd: number;
  input_tokens: number;
  output_tokens: number;
  models: string[];
  cost_source?: string;
}

function parseImportFile(content: string, filename: string): { entries: ImportEntry[]; errors: string[] } {
  const errors: string[] = [];
  const entries: ImportEntry[] = [];
  const validProviders = ['claude', 'codex', 'gemini', 'antigravity'];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  try {
    let rawData: any[];

    if (filename.endsWith('.csv')) {
      const rows = parseCSV(content);
      rawData = rows.map((r) => ({
        date: r.date,
        provider: r.provider,
        cost_usd: Number(r.cost_usd || r.cost || 0),
        input_tokens: Number(r.input_tokens || 0),
        output_tokens: Number(r.output_tokens || 0),
        models: (r.models || r.model || '').split(';').filter(Boolean),
        cost_source: r.cost_source,
      }));
    } else {
      const parsed = JSON.parse(content);
      rawData = Array.isArray(parsed) ? parsed : parsed.entries ?? [parsed];
    }

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row.date || !dateRegex.test(row.date)) {
        errors.push(`Row ${i + 1}: Invalid date "${row.date}"`);
        continue;
      }
      if (!row.provider || !validProviders.includes(row.provider)) {
        errors.push(`Row ${i + 1}: Invalid provider "${row.provider}"`);
        continue;
      }
      entries.push({
        date: row.date,
        provider: row.provider,
        cost_usd: Number(row.cost_usd) || 0,
        input_tokens: Number(row.input_tokens) || 0,
        output_tokens: Number(row.output_tokens) || 0,
        models: Array.isArray(row.models) ? row.models : [],
        cost_source: row.cost_source || 'real',
      });
    }
  } catch (e) {
    errors.push(`Failed to parse file: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  return { entries, errors };
}

function SettingsContent() {
  const { user: authUser } = useAuth();
  const { user: clerkUser } = useUser();
  const { data: profile } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const importUsage = useImportUsage();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notifKudos, setNotifKudos] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifMentions, setNotifMentions] = useState(true);
  const [notifFollows, setNotifFollows] = useState(true);
  const [copiedSync, setCopiedSync] = useState(false);
  const [copiedDaemon, setCopiedDaemon] = useState(false);

  // Import state
  const [importEntries, setImportEntries] = useState<ImportEntry[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName((profile as any).displayName ?? '');
      setBio((profile as any).bio ?? '');
      setExternalLink((profile as any).externalLink ?? '');
      setIsPublic((profile as any).isPublic ?? true);
      setEmailNotifications((profile as any).emailNotificationsEnabled ?? true);

      const saved = (profile as any).githubUsername ?? '';
      if (saved) {
        setGithubUsername(saved);
      } else {
        const ghAccount = clerkUser?.externalAccounts?.find(
          (a) => a.provider === 'github'
        );
        setGithubUsername(ghAccount?.username ?? '');
      }
    }
  }, [profile, clerkUser]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ displayName, bio, externalLink: externalLink || undefined, githubUsername: githubUsername || undefined });
      toast({ title: 'Profile updated!' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

  const handlePrivacyToggle = async (checked: boolean) => {
    setIsPublic(checked);
    try {
      await updateProfile.mutateAsync({ isPublic: checked });
    } catch {
      setIsPublic(!checked);
      toast({ title: 'Failed to update privacy', variant: 'destructive' });
    }
  };

  // ── Import handlers ───────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.json') && !file.name.endsWith('.csv')) {
      toast({ title: 'Unsupported file type', description: 'Please upload a .json or .csv file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const { entries, errors } = parseImportFile(content, file.name);
      setImportEntries(entries);
      setImportErrors(errors);
      setImportFileName(file.name);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImportSubmit = async () => {
    if (importEntries.length === 0) return;
    try {
      const result = await importUsage.mutateAsync({ entries: importEntries });
      toast({
        title: 'Import successful!',
        description: `Processed ${result.processed} entries, ${result.posts_created} posts created.`,
      });
      setImportEntries([]);
      setImportErrors([]);
      setImportFileName('');
    } catch (err) {
      toast({ title: 'Import failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const clearImport = () => {
    setImportEntries([]);
    setImportErrors([]);
    setImportFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const avatarUrl = authUser?.avatarUrl || '/placeholder.svg';

  return (
    <AppShell>
      <SEO title="Settings" description="Manage your AWARTS profile, privacy, notifications, and account settings." noindex />
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-6">
            <div className="flex items-center gap-4">
              <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/jpeg,image/png,image/webp';
                  input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      toast({ title: 'File too large (max 2MB)', variant: 'destructive' });
                      return;
                    }
                    try {
                      await uploadAvatar.upload(file);
                      toast({ title: 'Avatar updated!' });
                    } catch {
                      toast({ title: 'Upload failed', variant: 'destructive' });
                    }
                  };
                  input.click();
                }}
                disabled={uploadAvatar.isPending}
              >
                {uploadAvatar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Change Avatar
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 160))} className="resize-none" />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/160</p>
            </div>
            <div className="space-y-2">
              <Label>External Link</Label>
              <Input value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://yoursite.com" />
            </div>
            <div className="space-y-2">
              <Label>GitHub Username</Label>
              <Input value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} placeholder="octocat" />
            </div>
            <Button onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4 mt-6">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Public Profile</p>
                <p className="text-sm text-muted-foreground">Anyone can see your sessions and stats</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={handlePrivacyToggle} />
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-3 mt-6">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive email notifications for activity</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={async (checked) => {
                  setEmailNotifications(checked);
                  try {
                    await updateProfile.mutateAsync({ emailNotificationsEnabled: checked });
                  } catch {
                    setEmailNotifications(!checked);
                    toast({ title: 'Failed to update', variant: 'destructive' });
                  }
                }}
              />
            </div>
            {[
              { label: 'Kudos', desc: 'When someone gives you kudos', checked: notifKudos, set: setNotifKudos },
              { label: 'Comments', desc: 'When someone comments on your post', checked: notifComments, set: setNotifComments },
              { label: 'Mentions', desc: 'When someone mentions you', checked: notifMentions, set: setNotifMentions },
              { label: 'Follows', desc: 'When someone follows you', checked: notifFollows, set: setNotifFollows },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between rounded-lg border border-border p-4 opacity-60">
                <div>
                  <p className="font-medium text-foreground">{n.label} <span className="text-xs text-muted-foreground font-normal">(coming soon)</span></p>
                  <p className="text-sm text-muted-foreground">{n.desc}</p>
                </div>
                <Switch checked={n.checked} onCheckedChange={n.set} disabled />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-6">
            {/* File Import */}
            {importEntries.length === 0 ? (
              <div
                className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium text-foreground">Import usage data</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag and drop a .json or .csv file, or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
                <div className="mt-4 text-xs text-muted-foreground space-y-1">
                  <p>JSON format: <code className="bg-muted px-1 rounded">[{`{"date":"2025-01-01","provider":"codex","cost_usd":1.5,...}`}]</code></p>
                  <p>CSV columns: <code className="bg-muted px-1 rounded">date,provider,cost_usd,input_tokens,output_tokens,models</code></p>
                </div>
              </div>
            ) : (
              /* Preview */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{importFileName}</p>
                    <p className="text-sm text-muted-foreground">{importEntries.length} entries ready to import</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearImport}>
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                </div>

                {importErrors.length > 0 && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium text-destructive mb-1">
                      <AlertCircle className="h-4 w-4" />
                      {importErrors.length} validation error{importErrors.length > 1 ? 's' : ''}
                    </div>
                    <ul className="list-disc ml-6 text-muted-foreground space-y-0.5">
                      {importErrors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                      {importErrors.length > 5 && <li>...and {importErrors.length - 5} more</li>}
                    </ul>
                  </div>
                )}

                {/* Preview table */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Provider</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">Cost</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">Input</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">Output</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importEntries.slice(0, 10).map((e, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-1.5 font-mono text-xs">{e.date}</td>
                            <td className="px-3 py-1.5 capitalize">{e.provider}</td>
                            <td className="px-3 py-1.5 text-right font-mono">${e.cost_usd.toFixed(2)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">{e.input_tokens.toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">{e.output_tokens.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importEntries.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        ...and {importEntries.length - 10} more entries
                      </p>
                    )}
                  </div>
                </div>

                <Button onClick={handleImportSubmit} disabled={importUsage.isPending || importEntries.length === 0}>
                  {importUsage.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Importing...</>
                  ) : (
                    <>Import {importEntries.length} Entries</>
                  )}
                </Button>
              </div>
            )}

            {/* CLI sync section */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-2">Or use the CLI:</p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-sm max-w-sm">
                <span className="text-muted-foreground select-none">$</span>
                <code className="flex-1 text-foreground text-left">npx awarts@latest sync</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('npx awarts@latest sync');
                    setCopiedSync(true);
                    toast({ title: 'Copied to clipboard!' });
                    setTimeout(() => setCopiedSync(false), 2000);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  {copiedSync ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-sm max-w-sm mt-2">
                <span className="text-muted-foreground select-none">$</span>
                <code className="flex-1 text-foreground text-left">npx awarts@latest daemon start</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('npx awarts@latest daemon start');
                    setCopiedDaemon(true);
                    toast({ title: 'Copied to clipboard!' });
                    setTimeout(() => setCopiedDaemon(false), 2000);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  {copiedDaemon ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={authUser?.email ?? ''} disabled />
            </div>
            <div className="pt-4 border-t border-border">
              <Button
                variant="destructive"
                onClick={() => {
                  toast({
                    title: 'Account deletion',
                    description: 'Please contact support@awarts.com to delete your account.',
                  });
                }}
              >
                Delete Account
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

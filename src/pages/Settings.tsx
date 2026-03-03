import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGate } from '@/components/AuthGate';
import { useAuth } from '@/context/AuthContext';
import { useUser } from '@clerk/clerk-react';
import { useCurrentUser, useUpdateProfile, useUploadAvatar } from '@/hooks/use-api';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  return (
    <AuthGate>
      <SettingsContent />
    </AuthGate>
  );
}

function SettingsContent() {
  const { user: authUser } = useAuth();
  const { user: clerkUser } = useUser();
  const { data: profile } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

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

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName((profile as any).displayName ?? '');
      setBio((profile as any).bio ?? '');
      setExternalLink((profile as any).externalLink ?? '');
      setIsPublic((profile as any).isPublic ?? true);
      setEmailNotifications((profile as any).emailNotificationsEnabled ?? true);

      // Auto-fill GitHub username: prefer saved value, fall back to Clerk GitHub account
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

  const avatarUrl = authUser?.avatarUrl ?? '';

  return (
    <AppShell>
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
              <div key={n.label} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">{n.label}</p>
                  <p className="text-sm text-muted-foreground">{n.desc}</p>
                </div>
                <Switch checked={n.checked} onCheckedChange={n.set} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-6">
            <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-12 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">Drop your session data here</p>
              <p className="text-sm text-muted-foreground mt-1">JSON files from AWARTS CLI export</p>
              <Button variant="outline" size="sm" className="mt-4">Browse Files</Button>
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={authUser?.email ?? ''} disabled />
            </div>
            <div className="pt-4 border-t border-border">
              <Button variant="destructive">Delete Account</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

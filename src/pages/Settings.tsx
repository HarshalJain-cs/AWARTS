import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { currentUser } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload } from 'lucide-react';

export default function Settings() {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio);
  const [isPublic, setIsPublic] = useState(true);
  const [notifKudos, setNotifKudos] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifMentions, setNotifMentions] = useState(true);
  const [notifFollows, setNotifFollows] = useState(true);

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
              <img src={currentUser.avatar} alt="" className="h-16 w-16 rounded-full" />
              <Button variant="outline" size="sm">Change Avatar</Button>
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="resize-none" />
            </div>
            <Button>Save Changes</Button>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4 mt-6">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Public Profile</p>
                <p className="text-sm text-muted-foreground">Anyone can see your sessions and stats</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-3 mt-6">
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
              <Input value="alex@example.com" disabled />
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

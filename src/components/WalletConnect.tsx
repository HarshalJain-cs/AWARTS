import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useUpdateProfile } from '@/hooks/use-api';
import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { Wallet, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalletConnectProps {
  savedAddress?: string;
}

export function WalletConnect({ savedAddress }: WalletConnectProps) {
  const { address, chainId, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const updateProfile = useUpdateProfile();
  const lastSavedRef = useRef(savedAddress);

  // Auto-save wallet address when connected
  useEffect(() => {
    if (isConnected && address && address !== lastSavedRef.current) {
      lastSavedRef.current = address;
      updateProfile.mutateAsync({
        walletAddress: address,
        walletChainId: chainId,
      }).then(() => {
        toast({ title: 'Wallet linked to your profile' });
      }).catch(() => {
        toast({ title: 'Failed to save wallet', variant: 'destructive' });
      });
    }
  }, [isConnected, address, chainId]);

  const handleDisconnect = async () => {
    disconnect();
    lastSavedRef.current = undefined;
    try {
      await updateProfile.mutateAsync({
        walletAddress: '',
        walletChainId: 0,
      });
      toast({ title: 'Wallet disconnected' });
    } catch {
      toast({ title: 'Failed to remove wallet', variant: 'destructive' });
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
        <Wallet className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">Connected Wallet</p>
          <p className="font-mono text-sm text-foreground truncate">{address}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDisconnect} className="shrink-0 gap-1.5">
          <Unlink className="h-3.5 w-3.5" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ConnectButton.Custom>
        {({ openConnectModal, mounted }) => {
          if (!mounted) return null;
          return (
            <Button
              variant="outline"
              onClick={openConnectModal}
              className="w-full gap-2"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          );
        }}
      </ConnectButton.Custom>
      <p className="text-xs text-muted-foreground text-center">
        Supports MetaMask, Coinbase, WalletConnect, Trust, Phantom &amp; more
      </p>
    </div>
  );
}

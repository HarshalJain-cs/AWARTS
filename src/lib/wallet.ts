import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';

export const walletConfig = getDefaultConfig({
  appName: 'AWARTS',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'awarts-dev',
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: false,
});

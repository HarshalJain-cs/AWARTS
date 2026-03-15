import { createRoot } from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { walletConfig } from "./lib/wallet";
import App from "./App.tsx";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!convexUrl) {
  document.getElementById("root")!.innerHTML =
    '<div style="color:red;padding:2rem;font-family:monospace">Missing VITE_CONVEX_URL environment variable</div>';
  throw new Error("Missing VITE_CONVEX_URL");
}
if (!clerkKey) {
  document.getElementById("root")!.innerHTML =
    '<div style="color:red;padding:2rem;font-family:monospace">Missing VITE_CLERK_PUBLISHABLE_KEY environment variable</div>';
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const convex = new ConvexReactClient(convexUrl);
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={clerkKey} signInUrl="/login" signUpUrl="/login" afterSignOutUrl="/"
    signInFallbackRedirectUrl="/feed" signUpFallbackRedirectUrl="/onboarding">
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <WagmiProvider config={walletConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={{
              lightMode: lightTheme({ accentColor: '#E87A35', borderRadius: 'medium' }),
              darkMode: darkTheme({ accentColor: '#E87A35', borderRadius: 'medium' }),
            }}
          >
            <App />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ConvexProviderWithClerk>
  </ClerkProvider>
);

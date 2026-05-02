import { createContext, useContext, useEffect, Component, type ReactNode } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface AppUser {
  _id: Id<"users">;
  clerkId: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  githubUsername?: string;
  externalLink?: string;
  email?: string;
  country?: string;
  region?: string;
  timezone: string;
  isPublic: boolean;
  defaultAiProvider: string;
  emailNotificationsEnabled: boolean;
}

interface AuthContextType {
  // Clerk auth state
  isSignedIn: boolean;
  isLoaded: boolean;
  // True while signed in but Convex user profile is still loading
  isUserLoading: boolean;
  // Convex user profile (null if not yet created or not signed in)
  user: AppUser | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function ConvexAuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user: clerkUser } = useUser();

  // Get our app user profile from Convex
  const convexUser = useQuery(
    api.users.getMe,
    isSignedIn ? {} : "skip"
  );

  // Mutation to create user on first sign-in
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  // When Clerk is signed in but no Convex user profile exists, create one
  useEffect(() => {
    if (isSignedIn && convexUser === null) {
      getOrCreateUser();
    }
  }, [isSignedIn, convexUser, getOrCreateUser]);

  const { signOut: clerkSignOut } = useClerkAuth();

  const signOut = async () => {
    await clerkSignOut();
  };

  // convexUser is undefined while query is in-flight, null if no record exists
  const isUserLoading = !!isSignedIn && convexUser === undefined;

  const user: AppUser | null = convexUser
    ? {
        _id: convexUser._id,
        clerkId: convexUser.clerkId,
        username: convexUser.username,
        displayName: convexUser.displayName ?? undefined,
        bio: convexUser.bio ?? undefined,
        avatarUrl: convexUser.avatarUrl ?? clerkUser?.imageUrl ?? '/placeholder.svg',
        githubUsername: convexUser.githubUsername ?? undefined,
        externalLink: convexUser.externalLink ?? undefined,
        email: convexUser.email ?? clerkUser?.primaryEmailAddress?.emailAddress ?? undefined,
        country: convexUser.country ?? undefined,
        region: convexUser.region ?? undefined,
        timezone: convexUser.timezone,
        isPublic: convexUser.isPublic,
        defaultAiProvider: convexUser.defaultAiProvider,
        emailNotificationsEnabled: convexUser.emailNotificationsEnabled,
      }
    : null;

  return (
    <AuthContext.Provider value={{ isSignedIn: !!isSignedIn, isLoaded, isUserLoading, user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Fallback boundary so auth errors don't white-screen the app
class AuthErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      // Provide a signed-out context so the app still renders
      return (
        <AuthContext.Provider value={{ isSignedIn: false, isLoaded: true, isUserLoading: false, user: null, signOut: async () => {} }}>
          {this.props.children}
        </AuthContext.Provider>
      );
    }
    return this.props.children;
  }
}

export function ConvexAuthProviderSafe({ children }: { children: ReactNode }) {
  return (
    <AuthErrorBoundary>
      <ConvexAuthProvider>{children}</ConvexAuthProvider>
    </AuthErrorBoundary>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within ConvexAuthProvider");
  return context;
}

import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex w-full max-w-screen-2xl mx-auto">
        <LeftSidebar />
        <main className="flex-1 min-w-0 px-4 py-6 pb-20 lg:pb-6">
          {children}
        </main>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}

'use client';

import { SpaceBackground } from './SpaceBackground';

interface AuthSplitLayoutProps {
  children: React.ReactNode;
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left: Space visual */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center">
        <SpaceBackground />
        <div className="relative z-10 flex flex-col items-start px-16">
          <h1 className="text-6xl font-bold text-white mb-4">fubank</h1>
          <p className="text-xl text-white/70 max-w-md leading-relaxed">
            Tu dinero, tu control. Banca digital segura y sin complicaciones.
          </p>
        </div>
      </div>

      {/* Right: Form area */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <h1 className="text-4xl font-bold text-primary">fubank</h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

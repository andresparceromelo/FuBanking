'use client';

import Image from 'next/image';

interface AuthSplitLayoutProps {
  children: React.ReactNode;
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left: Brand visual */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <Image
          src="/auth-background.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        
        {/* Text aligned to match form position on the right */}
        <div className="relative z-10 flex flex-col justify-start pt-12 sm:pt-16 px-16 w-full">
          <div className="flex items-center gap-4 mb-6">
            <Image
              src="/logo.png"
              alt="FuBank"
              width={56}
              height={56}
              className="rounded-2xl"
            />
          </div>
          <h1 className="text-7xl sm:text-8xl font-black text-white mb-6 font-display tracking-[0.06em] uppercase">
            Fubank
          </h1>
          <p className="text-xl sm:text-2xl text-white/75 max-w-md leading-relaxed font-light">
            Tu dinero, tu control. Banca digital segura y sin complicaciones.
          </p>
        </div>
      </div>

      {/* Right: Form area */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="FuBank"
              width={44}
              height={44}
              className="rounded-xl"
            />
            <h1 className="text-4xl font-black text-primary font-display tracking-[0.06em] uppercase">
              Fubank
            </h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

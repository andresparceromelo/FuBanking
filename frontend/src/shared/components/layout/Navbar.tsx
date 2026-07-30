'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/hooks/useAuth';
import { useNotifications } from '@/features/notification/hooks/useNotifications';
import { 
  LogOut, 
  Wallet, 
  User as UserIcon, 
  Send, 
  History, 
  PiggyBank, 
  Receipt, 
  Landmark, 
  CreditCard, 
  HandCoins, 
  Bell 
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import Image from 'next/image';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { unreadCount, fetchNotifications } = useNotifications();

  React.useEffect(() => {
    if (user) {
      void fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const navLinks = [
    { href: '/accounts', label: 'Cuentas', icon: Wallet },
    { href: '/transfers', label: 'Transferir', icon: Send },
    { href: '/history', label: 'Historial', icon: History },
    { href: '/pockets', label: 'Bolsillos', icon: PiggyBank },
    { href: '/loans', label: 'Créditos', icon: Landmark },
    { href: '/cards', label: 'Tarjeta', icon: CreditCard },
    { href: '/requests', label: 'Cobros', icon: HandCoins },
    { href: '/notifications', label: 'Avisos', icon: Bell },
    { href: '/profile', label: 'Perfil', icon: UserIcon },
  ];

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/accounts" className="flex items-center gap-2 mr-2">
              <Image src="/logo.png" alt="FuBank" width={28} height={28} className="rounded-lg" />
              <span className="text-xl font-black font-display tracking-[0.06em] uppercase"><span className="text-primary">Fu</span>bank</span>
            </Link>

            {/* Nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                    pathname === href
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <div className="relative">
                    <Icon size={14} />
                    {href === '/notifications' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-destructive text-[8px] text-destructive-foreground font-bold border border-background">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground hidden sm:block">
              Hola, {user?.fullName?.split(' ')[0]}
            </span>
            <button
              onClick={logout}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-muted"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile secondary nav scroll */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-2 border-t border-border/40 no-scrollbar">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                pathname === href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <div className="relative">
                <Icon size={13} />
                {href === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-destructive border border-background" />
                )}
              </div>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}


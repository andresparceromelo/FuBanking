'use client';

import React, { useEffect } from 'react';
import { Bell, Check, Info, Send, PiggyBank, HandCoins, Receipt, CreditCard } from 'lucide-react';
import { useNotifications } from '@/features/notification/hooks/useNotifications';
import { cn } from '@/shared/utils/cn';

export default function NotificationsPage() {
  const { notifications, fetchNotifications, markAsRead, isLoading } = useNotifications();

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'TRANSFERENCIA':
        return <Send size={20} className="text-blue-500" />;
      case 'PAGO':
        return <Receipt size={20} className="text-green-500" />;
      case 'BOLSILLO':
        return <PiggyBank size={20} className="text-amber-500" />;
      case 'SOLICITUD_DINERO':
        return <HandCoins size={20} className="text-orange-500" />;
      case 'SISTEMA':
        return <CreditCard size={20} className="text-primary" />;
      default:
        return <Info size={20} className="text-primary" />;
    }
  };

  const getIconBg = (type?: string) => {
    switch (type) {
      case 'TRANSFERENCIA':
        return 'bg-blue-500/10';
      case 'PAGO':
        return 'bg-green-500/10';
      case 'BOLSILLO':
        return 'bg-amber-500/10';
      case 'SOLICITUD_DINERO':
        return 'bg-orange-500/10';
      case 'SISTEMA':
        return 'bg-primary/10';
      default:
        return 'bg-primary/10';
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificaciones</h1>
          <p className="text-muted-foreground text-sm mt-1">Mantente al tanto de los movimientos y alertas de tu cuenta.</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
          <Bell size={24} />
        </div>
      </div>

      <section>
        {notifications.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <Bell className="mb-4 text-muted-foreground opacity-30" size={48} />
            <h3 className="text-lg font-bold text-foreground">Todo está al día</h3>
            <p className="mt-2 text-sm text-muted-foreground">No tienes notificaciones pendientes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const isUnread = notif.isRead === false || notif.read === false || (!('isRead' in notif) && !('read' in notif));
              
              return (
                <div 
                  key={notif.id} 
                  className={cn(
                    "flex gap-4 p-5 rounded-2xl border transition-all",
                    isUnread ? "bg-card border-primary/30 shadow-md relative overflow-hidden" : "bg-muted/30 border-border opacity-70"
                  )}
                >
                  {isUnread && <div className="absolute left-0 top-0 w-1 h-full bg-primary" />}
                  
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", getIconBg(notif.type))}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className={cn("font-bold text-foreground", !isUnread && "text-muted-foreground")}>
                        {notif.title || 'Notificación'}
                      </h3>
                      <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap pt-1">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{notif.message}</p>
                  </div>
                  
                  {isUnread && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      disabled={isLoading}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-50"
                      title="Marcar como leída"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

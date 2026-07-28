'use client';

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number;
}

interface ToastOptions {
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  success: (title: string, description?: string, options?: Omit<ToastOptions, 'description'>) => string;
  error: (title: string, description?: string, options?: Omit<ToastOptions, 'description'>) => string;
  info: (title: string, description?: string, options?: Omit<ToastOptions, 'description'>) => string;
  warning: (title: string, description?: string, options?: Omit<ToastOptions, 'description'>) => string;
  dismiss: (id?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const DEFAULT_DURATION = 4000;

const variantConfig = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    progress: 'bg-emerald-500',
  },
  error: {
    icon: AlertCircle,
    className: 'border-destructive/25 bg-destructive/10 text-destructive',
    progress: 'bg-destructive',
  },
  info: {
    icon: Info,
    className: 'border-primary/20 bg-primary/10 text-primary',
    progress: 'bg-primary',
  },
  warning: {
    icon: TriangleAlert,
    className: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    progress: 'bg-amber-500',
  },
} satisfies Record<ToastVariant, { icon: React.ElementType; className: string; progress: string }>;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id?: string) => {
    if (!id) {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
      setToasts([]);
      return;
    }

    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (variant: ToastVariant, title: string, description?: string, duration = DEFAULT_DURATION) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast: Toast = { id, variant, title, description, duration };

      setToasts((current) => [toast, ...current].slice(0, 4));

      const timer = window.setTimeout(() => {
        dismiss(id);
      }, duration);
      timersRef.current.set(id, timer);

      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (title, description, options) => addToast('success', title, description, options?.duration),
      error: (title, description, options) => addToast('error', title, description, options?.duration),
      info: (title, description, options) => addToast('info', title, description, options?.duration),
      warning: (title, description, options) => addToast('warning', title, description, options?.duration),
      dismiss,
    }),
    [addToast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id?: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-relevant="additions text"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col-reverse items-center gap-3 px-4 sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-5 sm:w-[380px] sm:flex-col"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  return (
    <div className="pointer-events-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl shadow-black/10 ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-top-2">
      <div className="flex gap-3 p-4">
        <div className={cn('mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border', config.className)}>
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{toast.description}</p>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Cerrar notificacion"
        >
          <X size={16} />
        </button>
      </div>

      <div className="h-1 w-full bg-muted">
        <div
          className={cn('h-full origin-left animate-toast-progress', config.progress)}
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      </div>
    </div>
  );
}

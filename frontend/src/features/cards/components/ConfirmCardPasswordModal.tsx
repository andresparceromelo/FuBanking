'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

interface ConfirmCardPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<boolean>;
  accountNumber?: string;
  accountType?: string;
  isLoading: boolean;
  externalError?: string | null;
}

export function ConfirmCardPasswordModal({
  isOpen,
  onClose,
  onConfirm,
  accountNumber = '',
  accountType = 'AHORROS',
  isLoading,
  externalError = null,
}: Readonly<ConfirmCardPasswordModalProps>) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setLocalError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const displayError = localError || externalError;
  const maskedAcc = accountNumber ? `****${accountNumber.slice(-4)}` : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmed = password.trim();
    if (!trimmed) {
      setLocalError('Por favor ingresa tu contraseña para confirmar.');
      return;
    }

    const success = await onConfirm(trimmed);
    if (success) {
      setPassword('');
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-auth-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 id="card-auth-title" className="text-lg font-bold text-foreground">
                Confirmar con contraseña
              </h2>
              <p className="text-xs text-muted-foreground">
                Autenticación de seguridad requerida
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Cerrar modal"
            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">
            Emisión de tarjeta virtual
          </p>
          <p>
            Se vinculará a tu cuenta <span className="font-medium text-foreground">{accountType}</span>{' '}
            {maskedAcc && <span>({maskedAcc})</span>}.
          </p>
          <p className="text-[11px] text-muted-foreground/80 pt-1">
            Para proteger tu dinero, confirma tu contraseña antes de emitir la tarjeta.
          </p>
        </div>

        {displayError && (
          <div
            data-testid="card-auth-error"
            className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive animate-shake"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="card-auth-password"
              className="block text-xs font-medium text-foreground mb-1.5"
            >
              Contraseña de FuBanking
            </label>
            <div className="relative">
              <input
                id="card-auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                autoFocus
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (localError) setLocalError(null);
                }}
                disabled={isLoading}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-1/2 py-2.5 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              data-testid="card-auth-submit"
              className="flex w-1/2 items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                'Confirmar y crear'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

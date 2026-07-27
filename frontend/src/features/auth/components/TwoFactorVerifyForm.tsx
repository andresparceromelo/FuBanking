'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTwoFactor } from '../hooks/useTwoFactor';
import { Button } from '@/shared/components/ui/Button';
import { ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function TwoFactorVerifyForm() {
  const router = useRouter();
  const { handleVerify, handleResend, isLoading, isResending, error, resendSuccess } = useTwoFactor();
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Read masked email from session storage
    const email = sessionStorage.getItem('2fa_masked_email');
    if (!email) {
      // If we don't have it, they shouldn't be on this page directly
      router.push('/login');
    } else {
      setMaskedEmail(email);
    }
  }, [router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all filled
    if (value && index === 5 && newCode.every(v => v !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // Move back and clear if current is empty
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Just clear current
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });
    setCode(newCode);
    
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      handleVerify(fullCode);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <ShieldCheck size={28} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Verificación de seguridad</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Hemos enviado un código de 6 dígitos a <br />
          <span className="font-medium text-foreground">{maskedEmail}</span>
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 text-center animate-in fade-in slide-in-from-top-2">
          {error.message}
        </div>
      )}

      {resendSuccess && (
        <div className="p-4 rounded-xl bg-green-500/10 text-green-500 text-sm font-medium border border-green-500/20 text-center animate-in fade-in slide-in-from-top-2">
          ¡Código reenviado exitosamente!
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex justify-between gap-2">
          {code.map((value, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isLoading}
              className="w-12 h-14 text-center text-xl font-semibold bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              autoComplete="one-time-code"
            />
          ))}
        </div>

        <Button 
          type="submit" 
          isLoading={isLoading} 
          disabled={code.some(v => !v) || isLoading}
          className="w-full mt-8"
        >
          Verificar código
        </Button>
      </form>

      <div className="flex flex-col space-y-4 pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || isLoading}
          className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
        >
          {isResending ? <RefreshCw size={16} className="animate-spin" /> : null}
          No recibí el código
        </button>
        
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem('2fa_temp_token');
            sessionStorage.removeItem('2fa_masked_email');
            router.push('/login');
          }}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}

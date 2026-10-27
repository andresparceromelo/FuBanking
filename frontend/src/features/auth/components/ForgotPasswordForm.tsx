'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestPasswordResetSchema, RequestPasswordResetInput } from '../schemas/auth.schemas';
import { usePasswordReset } from '../hooks/usePasswordReset';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Label } from '@/shared/components/ui/Label';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export function ForgotPasswordForm() {
  const { requestReset, isLoading, error, isSuccess } = usePasswordReset();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    register,
    formState: { errors },
    setError,
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: '' },
  });

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const emailEl = form.querySelector<HTMLInputElement>('#email, [name="email"]');
    const email = emailEl?.value?.trim() ?? '';
    if (!email) {
      setError('email', { message: 'El correo electrónico es requerido' });
      return;
    }
    // basic format check
    if (!email.includes('@') || !email.includes('.')) {
      setError('email', { message: 'Correo electrónico inválido' });
      return;
    }
    requestReset({ email });
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-sm text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-medium">Revisa tu correo</h3>
          <p className="text-muted-foreground text-sm">
            Te hemos enviado un enlace para que puedas recuperar tu contraseña de forma segura.
          </p>
        </div>
        <Link href="/login" className="block w-full">
          <Button variant="outline" className="w-full mt-4">Volver al inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onFormSubmit} noValidate data-hydrated={isMounted} className="space-y-6 w-full max-w-sm">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
          {error.message}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="Ingresa tu correo registrado"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full mt-8">
        Enviar enlace
      </Button>

      <div className="text-center mt-6">
        <Link href="/login" className="text-sm font-medium text-primary hover:underline underline-offset-4">
          Volver a iniciar sesión
        </Link>
      </div>
    </form>
  );
}

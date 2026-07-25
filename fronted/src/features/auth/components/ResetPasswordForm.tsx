'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordInput } from '../schemas/auth.schemas';
import { usePasswordReset } from '../hooks/usePasswordReset';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Label } from '@/shared/components/ui/Label';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { resetPassword, isLoading, error, isSuccess } = usePasswordReset();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: '',
      confirmPassword: '',
    },
  });

  if (isSuccess) {
    return (
      <div className="w-full max-w-sm text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-medium">¡Contraseña actualizada!</h3>
          <p className="text-muted-foreground text-sm">
            Tu contraseña se ha cambiado correctamente. Ya puedes iniciar sesión con tus nuevas credenciales.
          </p>
        </div>
        <Link href="/login" className="block w-full">
          <Button className="w-full mt-4">Ir a Iniciar Sesión</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(resetPassword)} className="space-y-6 w-full max-w-sm">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
          {error.message}
        </div>
      )}

      {/* Hidden input for token */}
      <input type="hidden" {...register('token')} />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nueva contraseña</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Crea una contraseña segura"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repite tu nueva contraseña"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full mt-8">
        Guardar contraseña
      </Button>
    </form>
  );
}

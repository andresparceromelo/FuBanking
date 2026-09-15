'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordInput, PASSWORD_MAX_LENGTH } from '../schemas/auth.schemas';
import { usePasswordReset } from '../hooks/usePasswordReset';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Label } from '@/shared/components/ui/Label';
import { Eye, EyeOff, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { PasswordStrengthMeter, calculateStrength, evaluatePasswordCriteria } from './PasswordStrengthMeter';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { resetPassword, verifyToken, tokenStatus, isLoading, error, isSuccess } = usePasswordReset();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('newPassword') ?? '';
  const passwordCriteria = evaluatePasswordCriteria(passwordValue);
  const passwordStrength = calculateStrength(passwordCriteria);
  const isPasswordWeak = passwordValue.length > 0 && passwordStrength === 'weak';

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  if (tokenStatus === 'idle' || tokenStatus === 'loading') {
    return (
      <div className="w-full max-w-sm text-center py-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Verificando enlace de recuperación...</p>
      </div>
    );
  }

  if (tokenStatus === 'expired' || tokenStatus === 'used' || tokenStatus === 'invalid') {
    let title = 'Enlace inválido';
    let message = 'El enlace de recuperación es inválido o está mal formado.';

    if (tokenStatus === 'expired') {
      title = 'Enlace expirado';
      message = 'Este enlace ha expirado. Por favor solicita un nuevo enlace de recuperación.';
    } else if (tokenStatus === 'used') {
      title = 'Enlace ya utilizado';
      message = 'Este enlace ya fue utilizado. Por favor solicita un nuevo enlace de recuperación.';
    }

    return (
      <div className="w-full max-w-sm text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center">
          <AlertCircle className="w-16 h-16 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-medium">{title}</h3>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
        <Link href="/forgot-password" className="block w-full">
          <Button className="w-full mt-4">Solicitar uno nuevo</Button>
        </Link>
      </div>
    );
  }

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
              maxLength={PASSWORD_MAX_LENGTH}
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <PasswordStrengthMeter password={passwordValue} />
          {isPasswordWeak && (
            <p role="alert" className="text-xs text-destructive mt-1">
              La contraseña es demasiado débil. Por favor refuérzala antes de continuar.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repite tu nueva contraseña"
              maxLength={PASSWORD_MAX_LENGTH}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
              className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        isLoading={isLoading} 
        disabled={isPasswordWeak || isLoading}
        className="w-full mt-8"
      >
        Guardar contraseña
      </Button>
    </form>
  );
}

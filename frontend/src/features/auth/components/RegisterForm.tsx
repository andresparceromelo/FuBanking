'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput, PASSWORD_MAX_LENGTH } from '../schemas/auth.schemas';
import { useRegister } from '../hooks/useRegister';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Label } from '@/shared/components/ui/Label';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { PasswordStrengthMeter, calculateStrength, evaluatePasswordCriteria } from './PasswordStrengthMeter';

// ─── Límites de longitud para inputs del formulario ───────────────────────────
const FIELD_MAX = {
  name: 100,
  email: 254,
  document: 20,
  phone: 20,
  password: PASSWORD_MAX_LENGTH,
} as const;

// Marca de campo obligatorio: asterisco visible + texto solo para lectores de pantalla.
// Junto al tag "(opcional)" de los opcionales, cada label lleva su marcador y
// el ritmo visual del formulario queda simétrico (recomendación Baymard).
function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="text-primary ml-0.5">*</span>
      <span className="sr-only"> (obligatorio)</span>
    </>
  );
}

export function RegisterForm() {
  const { handleRegister, isLoading, error } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      secondLastName: '',
      birthDate: '',
      email: '',
      document: '',
      monthlyIncome: undefined,
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password') ?? '';
  const passwordCriteria = evaluatePasswordCriteria(passwordValue);
  const passwordStrength = calculateStrength(passwordCriteria);
  const isPasswordWeak = passwordValue.length > 0 && passwordStrength === 'weak';

  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const onSubmit = (data: RegisterInput) => {
    handleRegister(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate data-hydrated={isMounted} className="space-y-6 w-full max-w-sm">

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20"
        >
          {error.message}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Primer nombre<RequiredMark /></Label>
            <Input
              id="firstName"
              placeholder="Ej. Juan"
              maxLength={FIELD_MAX.name}
              error={errors.firstName?.message}
              {...register('firstName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="middleName">Segundo nombre</Label>
            <Input
              id="middleName"
              placeholder="Ej. Carlos"
              maxLength={FIELD_MAX.name}
              error={errors.middleName?.message}
              aria-describedby="middleName-optional"
              {...register('middleName')}
            />
            <p id="middleName-optional" className="text-xs text-muted-foreground ml-1">Opcional</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Primer apellido<RequiredMark /></Label>
            <Input
              id="lastName"
              placeholder="Ej. Pérez"
              maxLength={FIELD_MAX.name}
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondLastName">Segundo apellido</Label>
            <Input
              id="secondLastName"
              placeholder="Ej. Gómez"
              maxLength={FIELD_MAX.name}
              error={errors.secondLastName?.message}
              aria-describedby="secondLastName-optional"
              {...register('secondLastName')}
            />
            <p id="secondLastName-optional" className="text-xs text-muted-foreground ml-1">Opcional</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Fecha de nacimiento<RequiredMark /></Label>
          <Input
            id="birthDate"
            type="date"
            error={errors.birthDate?.message}
            {...register('birthDate')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico<RequiredMark /></Label>
          <Input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            maxLength={FIELD_MAX.email}
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="document">Documento<RequiredMark /></Label>
          <Input
            id="document"
            placeholder="123456789"
            maxLength={FIELD_MAX.document}
            error={errors.document?.message}
            {...register('document')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlyIncome">Ingreso mensual<RequiredMark /></Label>
          <Input
            id="monthlyIncome"
            type="number"
            placeholder="2500000"
            error={errors.monthlyIncome?.message}
            {...register('monthlyIncome', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            placeholder="+57 300 000 0000"
            maxLength={FIELD_MAX.phone}
            error={errors.phone?.message}
            aria-describedby="phone-optional"
            {...register('phone')}
          />
          <p id="phone-optional" className="text-xs text-muted-foreground ml-1">Opcional</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña<RequiredMark /></Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Crea una contraseña segura"
              maxLength={FIELD_MAX.password}
              error={errors.password?.message}
              {...register('password')}
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
          <Label htmlFor="confirmPassword">Confirmar contraseña<RequiredMark /></Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repite tu contraseña"
              maxLength={FIELD_MAX.password}
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
        Abrir cuenta
      </Button>

      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
            Inicia sesión
          </Link>
        </p>
      </div>
    </form>
  );
}

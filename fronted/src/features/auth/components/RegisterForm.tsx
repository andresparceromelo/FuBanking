'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '../schemas/auth.schemas';
import { useRegister } from '../hooks/useRegister';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Label } from '@/shared/components/ui/Label';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export function RegisterForm() {
  const { handleRegister, isLoading, error } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
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
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: RegisterInput) => {
    handleRegister(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-sm">
      
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
          {error.message}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Primer nombre</Label>
            <Input
              id="firstName"
              placeholder="Ej. Juan"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="middleName">Segundo nombre (opcional)</Label>
            <Input
              id="middleName"
              placeholder="Ej. Carlos"
              error={errors.middleName?.message}
              {...register('middleName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Primer apellido</Label>
            <Input
              id="lastName"
              placeholder="Ej. Pérez"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondLastName">Segundo apellido (opcional)</Label>
            <Input
              id="secondLastName"
              placeholder="Ej. Gómez"
              error={errors.secondLastName?.message}
              {...register('secondLastName')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Fecha de nacimiento</Label>
          <Input
            id="birthDate"
            type="date"
            error={errors.birthDate?.message}
            {...register('birthDate')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="document">Documento</Label>
          <Input
            id="document"
            placeholder="123456789"
            error={errors.document?.message}
            {...register('document')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono (opcional)</Label>
          <Input
            id="phone"
            placeholder="+57 300 000 0000"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Crea una contraseña segura"
              error={errors.password?.message}
              {...register('password')}
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
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repite tu contraseña"
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

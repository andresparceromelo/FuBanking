'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '../schemas/auth.schemas';
import { useLogin } from '../hooks/useLogin';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Label } from '@/shared/components/ui/Label';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export function LoginForm() {
  const { handleLogin, isLoading, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = (data: LoginInput) => {
    handleLogin(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-sm">
      
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
          {error.message}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Documento o Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="Ingresa tu correo"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
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

        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary" 
              {...register('rememberMe')}
            />
            <span className="text-sm font-medium">Recordarme</span>
          </label>
        </div>
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full mt-8">
        Continuar
      </Button>

      <div className="text-center mt-6 space-y-4">
        <Link 
          href="/forgot-password" 
          className="text-sm font-medium text-primary hover:underline underline-offset-4 block"
        >
          Olvidé mi contraseña
        </Link>
        
        <p className="text-sm text-muted-foreground">
          ¿Aún no eres cliente?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline underline-offset-4">
            Abre tu cuenta
          </Link>
        </p>
      </div>
    </form>
  );
}

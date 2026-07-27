'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, UpdateProfileInput } from '../schemas/profile.schemas';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { PublicUser } from '@/features/auth/types/auth.types';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Label } from '@/shared/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';

interface ProfileEditFormProps {
  user: PublicUser;
  onCancel: () => void;
  onSuccess: (updatedUser: PublicUser) => void;
}

export function ProfileEditForm({ user, onCancel, onSuccess }: ProfileEditFormProps) {
  const { handleUpdate, isLoading, error } = useUpdateProfile(onSuccess);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user.firstName,
      middleName: user.middleName || '',
      lastName: user.lastName,
      secondLastName: user.secondLastName || '',
      birthDate: user.birthDate ? user.birthDate.split('T')[0] : '', // birthDate from API usually has time
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || '',
    },
  });

  const onSubmit = (data: UpdateProfileInput) => {
    // Solo enviamos los datos si realmente cambiaron
    const payload: UpdateProfileInput = {};
    if (data.firstName !== user.firstName) payload.firstName = data.firstName;
    if (data.middleName !== (user.middleName || '')) payload.middleName = data.middleName || null;
    if (data.lastName !== user.lastName) payload.lastName = data.lastName;
    if (data.secondLastName !== (user.secondLastName || '')) payload.secondLastName = data.secondLastName || null;
    
    // Compare dates ignoring time
    const currentBirthDateStr = user.birthDate ? user.birthDate.split('T')[0] : '';
    if (data.birthDate !== currentBirthDateStr) payload.birthDate = data.birthDate || null;

    if (data.phone !== (user.phone || '')) payload.phone = data.phone || null;
    if (data.avatarUrl !== (user.avatarUrl || '')) payload.avatarUrl = data.avatarUrl || null;

    if (Object.keys(payload).length > 0) {
      handleUpdate(payload);
    } else {
      onCancel(); // Si no hay cambios, simplemente cancelamos
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-6 border-b border-border">
        <CardTitle className="text-2xl">Editar mis datos</CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
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
                <Label htmlFor="middleName">Segundo nombre</Label>
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
                <Label htmlFor="secondLastName">Segundo apellido</Label>
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
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+57 300 000 0000"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            <div className="space-y-2 opacity-60">
              <Label>Correo electrónico (No modificable)</Label>
              <Input disabled value={user.email} />
            </div>

            <div className="space-y-2 opacity-60">
              <Label>Documento (No modificable)</Label>
              <Input disabled value={user.document} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full">
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading} className="w-full">
              Guardar cambios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

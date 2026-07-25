'use client';

import React, { useState } from 'react';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { ProfileCard } from '@/features/profile/components/ProfileCard';
import { ProfileEditForm } from '@/features/profile/components/ProfileEditForm';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

export default function ProfilePage() {
  const { profile, isLoading, error, refetch } = useProfile();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-primary">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-medium">Cargando perfil...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-center max-w-sm mx-auto">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-xl font-medium mb-2">Algo salió mal</h3>
        <p className="text-muted-foreground mb-6">
          {error?.message || 'No pudimos cargar la información de tu perfil.'}
        </p>
        <Button onClick={refetch}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="w-full animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {isEditing ? (
        <ProfileEditForm 
          user={profile} 
          onCancel={() => setIsEditing(false)} 
          onSuccess={() => {
            setIsEditing(false);
            refetch(); // Refrescamos los datos por seguridad aunque el hook actualiza el contexto
          }}
        />
      ) : (
        <ProfileCard 
          user={profile} 
          onEditClick={() => setIsEditing(true)} 
          onToggleSuccess={refetch}
        />
      )}
    </div>
  );
}

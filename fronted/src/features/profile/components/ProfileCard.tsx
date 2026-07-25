'use client';

import React, { useState } from 'react';
import { PublicUser } from '@/features/auth/types/auth.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { User, Mail, CreditCard, Phone, Calendar, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { authService } from '@/features/auth/services/auth.service';
import { useAuth } from '@/shared/hooks/useAuth';

interface ProfileCardProps {
  user: PublicUser;
  onEditClick: () => void;
  onToggleSuccess?: () => void;
}

export function ProfileCard({ user, onEditClick, onToggleSuccess }: ProfileCardProps) {
  const { updateUser } = useAuth();
  const [isUpdating2FA, setIsUpdating2FA] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleToggle2FA = async () => {
    try {
      setIsUpdating2FA(true);
      if (user.twoFactorEnabled) {
        await authService.disableTwoFactor();
        updateUser({ ...user, twoFactorEnabled: false });
      } else {
        await authService.enableTwoFactor();
        updateUser({ ...user, twoFactorEnabled: true });
      }
      // Notificamos al padre para que actualice la vista (useProfile)
      if (onToggleSuccess) {
        onToggleSuccess();
      }
    } catch (error: any) {
      console.error('Error al actualizar 2FA', error);
      // Extraer el mensaje del error si existe
      const msg = error?.response?.data?.message || 'Hubo un error al actualizar la autenticación de dos factores.';
      alert(msg);
    } finally {
      setIsUpdating2FA(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-8 border-b border-border bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-md">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.fullName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <CardTitle className="text-2xl">{user.fullName}</CardTitle>
            <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Cuenta activa
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onEditClick} className="w-auto px-6 hidden sm:flex">
          Editar datos
        </Button>
      </CardHeader>
      
      <CardContent className="pt-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail size={16} /> Correo electrónico
            </p>
            <p className="font-medium text-lg">{user.email}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CreditCard size={16} /> Documento
            </p>
            <p className="font-medium text-lg">{user.document}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Phone size={16} /> Teléfono
            </p>
            <p className="font-medium text-lg">{user.phone || 'No registrado'}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <User size={16} /> Fecha de nacimiento
            </p>
            <p className="font-medium text-lg">{user.birthDate ? formatDate(user.birthDate) : 'No registrada'}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar size={16} /> Miembro desde
            </p>
            <p className="font-medium text-lg">{formatDate(user.createdAt)}</p>
          </div>

        </div>

        {/* Sección de Seguridad */}
        <div className="pt-8 mt-8 border-t border-border">
          <h3 className="text-lg font-semibold mb-4">Seguridad</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20">
            <div className="flex items-start gap-3">
              <div className={`mt-1 flex-shrink-0 ${user.twoFactorEnabled ? 'text-green-500' : 'text-amber-500'}`}>
                {user.twoFactorEnabled ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
              </div>
              <div>
                <p className="font-medium text-foreground">Autenticación de dos factores (2FA)</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Agrega una capa adicional de seguridad a tu cuenta solicitando un código temporal enviado a tu correo al iniciar sesión.
                </p>
              </div>
            </div>
            <Button
              variant={user.twoFactorEnabled ? "destructive" : "default"}
              onClick={handleToggle2FA}
              disabled={isUpdating2FA}
              className="w-full sm:w-auto flex-shrink-0"
            >
              {isUpdating2FA && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {user.twoFactorEnabled ? 'Desactivar 2FA' : 'Activar 2FA'}
            </Button>
          </div>
        </div>

        <Button variant="outline" onClick={onEditClick} className="w-full sm:hidden mt-6">
          Editar datos
        </Button>
      </CardContent>
    </Card>
  );
}

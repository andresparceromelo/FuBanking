import { TwoFactorVerifyForm } from '@/features/auth/components/TwoFactorVerifyForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verificación de Seguridad - Banco Digital',
  description: 'Ingresa el código de 6 dígitos que enviamos a tu correo para iniciar sesión en tu cuenta de Banco Digital de forma segura.',
};

export default function VerifyTwoFactorPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen p-4">
      <TwoFactorVerifyForm />
    </div>
  );
}

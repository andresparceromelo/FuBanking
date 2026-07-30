import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-1">Recupera tu acceso</h2>
      <p className="text-muted-foreground mb-8">
        Te enviaremos un enlace para restablecer tu contraseña.
      </p>
      <ForgotPasswordForm />
      <p className="mt-6 text-sm text-muted-foreground text-center">
        ¿Recordaste tu contraseña?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Volver al login
        </Link>
      </p>
    </div>
  );
}

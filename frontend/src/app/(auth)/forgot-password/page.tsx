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
      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          ¿Recordaste tu contraseña?{' '}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}

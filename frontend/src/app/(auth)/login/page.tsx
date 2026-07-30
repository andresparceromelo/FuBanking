import { LoginForm } from '@/features/auth/components/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-1">Inicia sesión</h2>
      <p className="text-muted-foreground mb-8">
        Bienvenido de vuelta a tu cuenta.
      </p>
      <LoginForm />
      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-primary hover:underline font-semibold">
            Créala aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

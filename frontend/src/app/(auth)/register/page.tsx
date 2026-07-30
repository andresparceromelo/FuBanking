import { RegisterForm } from '@/features/auth/components/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-1">Crea tu cuenta</h2>
      <p className="text-muted-foreground mb-8">
        Empieza a manejar tu dinero de forma digital.
      </p>
      <RegisterForm />
      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

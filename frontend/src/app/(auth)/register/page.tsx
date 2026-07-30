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
      <p className="mt-6 text-sm text-muted-foreground text-center">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}

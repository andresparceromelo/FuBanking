import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Nueva contraseña - FuBank',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';

  if (!token) {
    redirect('/login');
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-1">Elige tu nueva contraseña</h2>
      <p className="text-muted-foreground mb-8">
        Asegúrate de que sea segura y fácil de recordar.
      </p>
      <ResetPasswordForm token={token} />
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

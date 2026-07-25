import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Nueva contraseña - Banco Digital',
};

// En Next.js 15, searchParams es asíncrono y PageProps debe definirse así
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  // Supabase Auth envía el access_token en el hash de la URL (cuando es implícito),
  // o como query param si usamos PKCE/Server side.
  // Asumiremos que nos llega ?token=... para este flujo.
  // En un entorno real con Supabase PKCE, el token se manejaría de otra forma,
  // pero mantendremos este diseño simple acordado.
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';

  if (!token) {
    // Si no hay token en la URL, este enlace no es válido
    redirect('/login');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-sm flex flex-col items-start relative z-10">
        <h1 className="text-4xl font-semibold mb-2 text-primary">fubank</h1>
        <h2 className="text-2xl font-medium mb-8">Elige tu nueva contraseña</h2>
        <ResetPasswordForm token={token} />
      </div>
    </main>
  );
}

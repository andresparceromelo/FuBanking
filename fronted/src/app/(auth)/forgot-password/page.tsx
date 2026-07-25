import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recuperar contraseña - Banco Digital',
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-sm flex flex-col items-start relative z-10">
        <h1 className="text-4xl font-semibold mb-2 text-primary">fubank</h1>
        <h2 className="text-2xl font-medium mb-8">Recupera tu acceso</h2>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}

import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      
      {/* Decorative Fubank-style blob */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col items-start relative z-10 py-12">
        <h1 className="text-4xl font-semibold mb-2 text-primary">fubank</h1>
        <h2 className="text-2xl font-medium mb-8">Crea tu cuenta digital</h2>
        
        <RegisterForm />
      </div>
    </main>
  );
}

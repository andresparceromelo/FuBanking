import { LoanSimulator } from '@/features/loans/components/LoanSimulator';

export default function LoansPage() {
  return (
    <section className="py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Préstamos</h1>
        <p className="text-white/40 text-sm mt-1">
          Simula tu crédito, revisa tus cuotas y valida los requisitos para solicitarlo.
        </p>
      </div>

      <LoanSimulator />
    </section>
  );
}

import { Landmark } from 'lucide-react';

export const metadata = {
  title: 'Créditos y Préstamos | FuBanking',
  description: 'Simula y solicita créditos en FuBanking.',
};

export default function LoansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Créditos y Préstamos</h1>
        <p className="text-muted-foreground text-sm mt-1">Simula tu cuota mensual y solicita un crédito.</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-center bg-card border border-border rounded-3xl">
        <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
          <Landmark size={28} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Próximamente</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Esta funcionalidad estará disponible en la siguiente fase de desarrollo.
        </p>
      </div>
    </div>
  );
}

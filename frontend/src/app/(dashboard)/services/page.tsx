import { Receipt } from 'lucide-react';

export const metadata = {
  title: 'Pago de Servicios | FuBanking',
  description: 'Paga tus facturas de servicios públicos y más.',
};

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pago de Servicios</h1>
        <p className="text-muted-foreground text-sm mt-1">Paga energía, agua, internet y celular directamente desde tu cuenta.</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-center bg-card border border-border rounded-3xl">
        <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
          <Receipt size={28} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Próximamente</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Esta funcionalidad estará disponible en la siguiente fase de desarrollo.
        </p>
      </div>
    </div>
  );
}

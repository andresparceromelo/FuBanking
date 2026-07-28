import { TransferForm } from '@/features/transfer/components/TransferForm';

export const metadata = {
  title: 'Transferencias | FuBanking',
  description: 'Envía dinero a otros usuarios de FuBanking al instante.',
};

export default function TransfersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transferencias</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Envía dinero a cualquier cuenta FuBanking de forma instantánea.
        </p>
      </div>

      <TransferForm />
    </div>
  );
}

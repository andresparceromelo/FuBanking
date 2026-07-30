import { AdminLoansClient } from '@/features/admin/components/AdminLoansClient';

export const metadata = {
  title: 'Admin - Creditos | FuBanking',
  description: 'Gestiona las solicitudes de credito en FuBanking.',
};

export default function AdminLoansPage() {
  return <AdminLoansClient />;
}

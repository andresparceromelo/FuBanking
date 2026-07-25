import React from 'react';
import { AccountList } from '@/features/account/components/AccountList';

/**
 * Página de Cuentas — /accounts
 *
 * Ruta protegida dentro del DashboardLayout.
 * Renderiza el módulo de cuentas bancarias.
 */
export default function AccountsPage() {
  return (
    <section className="py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Cuenta Digital</h1>
        <p className="text-white/40 text-sm mt-1">Administra tus cuentas bancarias</p>
      </div>

      <AccountList />
    </section>
  );
}

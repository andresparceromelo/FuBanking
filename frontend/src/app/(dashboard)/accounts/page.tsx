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
        {/* Tokens del tema: text-white fijo era invisible en tema claro (A11Y-04). */}
        <h1 className="text-2xl font-bold text-foreground">Cuenta Digital</h1>
        <p className="text-muted-foreground text-sm mt-1">Administra tus cuentas bancarias</p>
      </div>

      <AccountList />
    </section>
  );
}

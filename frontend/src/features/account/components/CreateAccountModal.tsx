'use client';

import React, { useState } from 'react';
import { X, PiggyBank, CreditCard, Briefcase, ChevronRight } from 'lucide-react';
import { AccountType, ACCOUNT_TYPE_LABELS } from '../types/account.types';
import { useCreateAccount } from '../hooks/useCreateAccount';
import { Account } from '../types/account.types';
import { useToast } from '@/shared/components/feedback/ToastProvider';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: Account) => void;
}

type Step = 'select-type' | 'fill-details';

/**
 * CreateAccountModal — Modal de dos pasos para crear una cuenta bancaria.
 *
 * Paso 1: El usuario selecciona el tipo de cuenta.
 * Paso 2: El usuario rellena los detalles opcionales del tipo elegido.
 */
export function CreateAccountModal({ isOpen, onClose, onSuccess }: CreateAccountModalProps) {
  const toast = useToast();
  const [step, setStep] = useState<Step>('select-type');
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [details, setDetails] = useState({
    requestCheckbook: false,
    companyName: '',
  });

  const { createAccount, isLoading, error } = useCreateAccount();

  const accountTypeOptions = [
    {
      type: AccountType.AHORROS,
      icon: PiggyBank,
      description: 'Guarda tu dinero y genera intereses',
      color: 'from-violet-500/20 to-purple-600/20 border-violet-500/30',
      iconColor: 'text-violet-400',
    },
    {
      type: AccountType.CORRIENTE,
      icon: CreditCard,
      description: 'Para pagos diarios y uso cotidiano',
      color: 'from-cyan-500/20 to-teal-600/20 border-cyan-500/30',
      iconColor: 'text-cyan-400',
    },
    {
      type: AccountType.NOMINA,
      icon: Briefcase,
      description: 'Recibe tu salario directamente',
      color: 'from-rose-500/20 to-pink-600/20 border-rose-500/30',
      iconColor: 'text-rose-400',
    },
  ];

  const handleClose = () => {
    setStep('select-type');
    setSelectedType(null);
    setDetails({ requestCheckbook: false, companyName: '' });
    onClose();
  };

  const handleSelectType = (type: AccountType) => {
    setSelectedType(type);
    setStep('fill-details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    await createAccount(
      {
        type: selectedType,
        requestCheckbook: selectedType === AccountType.CORRIENTE ? details.requestCheckbook : undefined,
        companyName: selectedType === AccountType.NOMINA ? details.companyName : undefined,
      },
      (account) => {
        toast.success('Cuenta creada', `Tu ${ACCOUNT_TYPE_LABELS[account.accountType].toLowerCase()} ya esta lista.`);
        onSuccess(account);
        handleClose();
      },
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-semibold text-lg">
              {step === 'select-type' ? 'Nueva cuenta' : ACCOUNT_TYPE_LABELS[selectedType!]}
            </h2>
            <p className="text-white/40 text-xs mt-0.5">
              {step === 'select-type' ? 'Elige el tipo de cuenta' : 'Configura los detalles opcionales'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Paso 1: Seleccionar tipo */}
        {step === 'select-type' && (
          <div className="space-y-3">
            {accountTypeOptions.map(({ type, icon: Icon, description, color, iconColor }) => (
              <button
                key={type}
                onClick={() => handleSelectType(type)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r ${color} hover:scale-[1.01] transition-all duration-200 text-left`}
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{ACCOUNT_TYPE_LABELS[type]}</p>
                  <p className="text-white/40 text-xs mt-0.5">{description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Paso 2: Detalles opcionales */}
        {step === 'fill-details' && selectedType && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Display Bank Conditions */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <h3 className="text-white text-sm font-medium mb-3">Condiciones de tu nueva cuenta</h3>
              
              {selectedType === AccountType.AHORROS && (
                <ul className="space-y-2">
                  <ConditionRow label="Tasa de interés" value="3.00% E.A." />
                  <ConditionRow label="Cuota de manejo mensual" value="$0 COP" />
                </ul>
              )}

              {selectedType === AccountType.CORRIENTE && (
                <ul className="space-y-2">
                  <ConditionRow label="Cupo de sobregiro preaprobado" value="$1.000.000 COP" />
                </ul>
              )}

              {selectedType === AccountType.NOMINA && (
                <ul className="space-y-2">
                  <ConditionRow label="Cuota de manejo mensual" value="$0 COP" />
                  <ConditionRow label="Beneficios" value="Retiros y transferencias gratis" />
                </ul>
              )}
            </div>

            {selectedType !== AccountType.AHORROS && (
              <p className="text-white/40 text-xs bg-white/5 rounded-lg px-3 py-2">
                Completa la siguiente información adicional requerida.
              </p>
            )}

            {/* Campos para Ahorros */}
            {selectedType === AccountType.AHORROS && (
              <p className="text-white/60 text-sm text-center py-2">
                Esta cuenta no requiere información adicional, está lista para crearse.
              </p>
            )}

            {/* Campos para Corriente */}
            {selectedType === AccountType.CORRIENTE && (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <input
                    id="checkbook"
                    type="checkbox"
                    checked={details.requestCheckbook}
                    onChange={(e) => setDetails({ ...details, requestCheckbook: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  <label htmlFor="checkbook" className="text-white/70 text-sm cursor-pointer">
                    Incluir chequera
                  </label>
                </div>
              </>
            )}

            {/* Campos para Nómina */}
            {selectedType === AccountType.NOMINA && (
              <Field
                label="Empresa asociada"
                type="text"
                placeholder="Nombre de la empresa"
                value={details.companyName}
                onChange={(v) => setDetails({ ...details, companyName: v })}
              />
            )}

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('select-type')}
                className="flex-1 h-11 rounded-full border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-11 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Creando...' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  onChange,
  value,
  ...props
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <div>
      <label className="block text-white/50 text-xs mb-1.5">{label}</label>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
      />
    </div>
  );
}


function ConditionRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between items-center text-sm">
      <span className="text-white/60">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </li>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Calculator, Clock3, FileCheck2, ShieldCheck } from 'lucide-react';
import { useLoans } from '../hooks/useLoans';

interface RequirementState {
  document: boolean;
  age: boolean;
  income: boolean;
  creditHistory: boolean;
}

const steps = [
  'Sube tu cédula de ciudadanía vigente para validar tu identidad.',
  'Confirma que cumples con la mayoría de edad y tu rango permitido.',
  'Demuestra ingresos fijos mediante tu comprobante de salario.',
  'Revisa tu historial crediticio y confirma que no tengas reportes negativos.',
  'Firma el contrato y recibe la aprobación del préstamo.',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

export function LoanSimulator() {
  const [amount, setAmount] = useState(3000000);
  const [installments, setInstallments] = useState(12);
  const [annualRate, setAnnualRate] = useState(24);
  const [monthlyIncome, setMonthlyIncome] = useState(1800000);
  const [requirements, setRequirements] = useState<RequirementState>({
    document: false,
    age: false,
    income: false,
    creditHistory: false,
  });
  const [serverSimulation, setServerSimulation] = useState<{
    monthlyPayment: number;
    totalToPay: number;
    totalInterest: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { simulateLoan, createLoan, isLoading, error } = useLoans();

  const simulation = useMemo(() => {
    const monthlyRate = annualRate / 100 / 12;
    const safeInstallments = Math.max(installments, 1);

    let monthlyPayment = amount / safeInstallments;

    if (monthlyRate > 0) {
      monthlyPayment =
        (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -safeInstallments));
    }

    const totalToPay = monthlyPayment * safeInstallments;
    const totalInterest = totalToPay - amount;

    return {
      monthlyPayment,
      totalToPay,
      totalInterest,
    };
  }, [amount, annualRate, installments]);

  const isEligible =
    requirements.document &&
    requirements.age &&
    requirements.income &&
    requirements.creditHistory;

  useEffect(() => {
    const refreshSimulation = async () => {
      const result = await simulateLoan({ amount, installments, annualRate });
      if (result) {
        setServerSimulation({
          monthlyPayment: result.monthlyPayment,
          totalToPay: result.totalToPay,
          totalInterest: result.totalInterest,
        });
      }
    };

    refreshSimulation();
  }, [amount, installments, annualRate, simulateLoan]);

  const toggleRequirement = (key: keyof RequirementState) => {
    setRequirements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!isEligible) {
      setFeedback('Completa todos los requisitos antes de enviar la solicitud.');
      return;
    }

    const result = await createLoan({
      amount,
      installments,
      annualRate,
      monthlyIncome,
      documentVerified: requirements.document,
      ageVerified: requirements.age,
      incomeVerified: requirements.income,
      creditHistoryVerified: requirements.creditHistory,
    });

    if (result) {
      setFeedback(`Solicitud creada correctamente. Estado: ${result.status}`);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Calculator size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Simulador de préstamo</h2>
            <p className="text-sm text-white/50">
              Ajusta el monto, el número de cuotas y el interés para conocer tu propuesta.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm text-white/60">Monto solicitado</span>
            <input
              type="number"
              min="1000000"
              step="100000"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-[#111827] px-3 py-2 text-white"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/60">Cuotas</span>
            <input
              type="number"
              min="3"
              max="36"
              value={installments}
              onChange={(event) => setInstallments(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-[#111827] px-3 py-2 text-white"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/60">Interés anual</span>
            <input
              type="number"
              min="1"
              max="60"
              step="0.1"
              value={annualRate}
              onChange={(event) => setAnnualRate(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-[#111827] px-3 py-2 text-white"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-white/60">Ingreso mensual</span>
            <input
              type="number"
              min="1000000"
              step="100000"
              value={monthlyIncome}
              onChange={(event) => setMonthlyIncome(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-[#111827] px-3 py-2 text-white"
            />
          </label>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/50">Cuota mensual</p>
            <p className="mt-2 text-xl font-semibold text-white">
              {formatCurrency(serverSimulation?.monthlyPayment ?? simulation.monthlyPayment)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/50">Total a pagar</p>
            <p className="mt-2 text-xl font-semibold text-white">
              {formatCurrency(serverSimulation?.totalToPay ?? simulation.totalToPay)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/50">Intereses</p>
            <p className="mt-2 text-xl font-semibold text-white">
              {formatCurrency(serverSimulation?.totalInterest ?? simulation.totalInterest)}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
            <p className="font-semibold">Ingreso mensual</p>
            <p className="mt-2">Tu capacidad de pago se evalúa con un ingreso base de {formatCurrency(monthlyIncome)}.</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <p className="font-semibold">Resumen</p>
          <p className="mt-2">
            Con un monto de {formatCurrency(amount)} y {installments} cuotas, la cuota mensual estimada sería{' '}
            {formatCurrency(simulation.monthlyPayment)} con un interés anual del {annualRate}%.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-card p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <h3 className="text-lg font-semibold text-white">Requisitos para solicitar</h3>
          </div>

          <div className="mt-4 space-y-3">
            {[
              { key: 'document', label: 'Cédula de ciudadanía original y vigente' },
              { key: 'age', label: 'Mayoría de edad (18 a 70 años)' },
              { key: 'income', label: 'Ingresos fijos demostrables' },
              { key: 'creditHistory', label: 'Buen historial crediticio sin reportes negativos' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleRequirement(item.key as keyof RequirementState)}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                  requirements[item.key as keyof RequirementState]
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-white/10 bg-white/5 text-white/70'
                }`}
              >
                <span>{item.label}</span>
                <BadgeCheck size={18} className={requirements[item.key as keyof RequirementState] ? 'text-emerald-400' : 'text-white/30'} />
              </button>
            ))}
          </div>

          <div
            className={`mt-4 rounded-2xl p-3 text-sm ${
              isEligible
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'bg-amber-500/10 text-amber-300'
            }`}
          >
            {isEligible
              ? 'Cumples con todos los requisitos para avanzar con tu solicitud.'
              : 'Completa los requisitos para poder continuar con el trámite.'}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-card p-6">
          <div className="flex items-center gap-2">
            <Clock3 size={18} className="text-primary" />
            <h3 className="text-lg font-semibold text-white">Pasos para tramitar</h3>
          </div>

          <div className="mt-4 space-y-3">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <p className="text-sm text-white/70">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-3 py-3 text-sm text-primary">
            <FileCheck2 size={16} />
            <span>Tu solicitud se revisará una vez hayas completado los requisitos.</span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-4 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isLoading ? 'Enviando...' : 'Enviar solicitud'}
          </button>

          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          {feedback && <p className="mt-2 text-sm text-emerald-300">{feedback}</p>}
        </div>
      </div>
    </section>
  );
}

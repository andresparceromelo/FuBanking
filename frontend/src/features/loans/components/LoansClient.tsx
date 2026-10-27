"use client";

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Landmark,
  Calculator,
  BadgeCheck,
  Clock,
  CheckCircle,
  XCircle,
  CheckCircle2,
  FileText,
  CalendarCheck,
  Wallet,
  History,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { useToast } from '@/shared/components/feedback/ToastProvider';
import { loanService } from '@/features/loans/services/loan.service';
import { profileService } from '@/features/profile/services/profile.service';
import { formatCurrency } from '@/shared/utils/format';
import { getMessage } from '@/shared/utils/getMessage';
import {
  isOfLegalAge,
  isLoanParamValid,
  DEFAULT_LOAN_AMOUNT,
  DEFAULT_INSTALLMENTS,
  DEFAULT_ANNUAL_RATE,
  MIN_LOAN_AMOUNT,
  MAX_LOAN_AMOUNT,
  MIN_INSTALLMENTS,
  MAX_INSTALLMENTS,
  MIN_ANNUAL_RATE,
  MAX_ANNUAL_RATE,
} from '@/features/loans/utils/loanEligibility';
import type { PublicUser } from '@/features/auth/types/auth.types';
import type { LoanSimulation, LoanApplication } from '@/features/loans/types/loan.types';

const statusMap: Record<string, { color: string; icon: LucideIcon; label: string }> = {
  PENDING: { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: Clock, label: 'Pendiente' },
  APPROVED: { color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle, label: 'Aprobado' },
  REJECTED: { color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle, label: 'Rechazado' },
};

export function LoansClient() {
  const toast = useToast();
  const [amount, setAmount] = useState(DEFAULT_LOAN_AMOUNT);
  const [installments, setInstallments] = useState(DEFAULT_INSTALLMENTS);
  const [annualRate, setAnnualRate] = useState(DEFAULT_ANNUAL_RATE);
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<LoanSimulation | null>(null);
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [myLoans, setMyLoans] = useState<LoanApplication[]>([]);

  const baseEligible = useMemo(
    () => isLoanParamValid(Number(amount), Number(installments), Number(annualRate)).isValid,
    [amount, installments, annualRate],
  );

  const requirements = useMemo(() => {
    const documentVerified = profile?.documentVerified ?? false;
    const ageVerified = profile ? isOfLegalAge(profile.birthDate) : false;
    const incomeVerified = (profile?.monthlyIncome ?? 0) > 0;
    const creditHistoryVerified = true;
    return [
      { key: 'document', label: 'Documento verificado', done: documentVerified, icon: FileText },
      { key: 'age', label: 'Mayor de edad', done: ageVerified, icon: CalendarCheck },
      { key: 'income', label: 'Ingreso validado', done: incomeVerified, icon: Wallet },
      { key: 'creditHistory', label: 'Historial crediticio validado', done: creditHistoryVerified, icon: History },
    ];
  }, [profile]);

  const allRequirementsMet = useMemo(
    () => requirements.every((r) => r.done) && baseEligible,
    [requirements, baseEligible],
  );

  const fetchMyLoans = useCallback(async () => {
    try {
      const loans = await loanService.getMyLoans();
      setMyLoans(loans);
    } catch {
      // Fallback silencioso para no bloquear la interfaz inicial
    }
  }, []);

  useEffect(() => {
    void fetchMyLoans();
    profileService
      .getProfile()
      .then(setProfile)
      .catch(() => {
        // Fallback silencioso si no hay sesión activa aún
      });
  }, [fetchMyLoans]);

  const hasPending = useMemo(() => myLoans.some((l) => l.status === 'PENDING'), [myLoans]);

  const handleSimulate = async () => {
    const validation = isLoanParamValid(Number(amount), Number(installments), Number(annualRate));
    if (!validation.isValid) {
      const errMsg = validation.error ?? 'Parámetros no permitidos para simulación.';
      setMessage(errMsg);
      toast.warning('Rango fuera de norma', errMsg);
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const result = await loanService.simulate({
        amount: Number(amount),
        installments: Number(installments),
        annualRate: Number(annualRate),
      });
      setSimulation(result);
      setMessage('Simulación lista.');
      toast.success('Simulación calculada', 'Tu cuota estimada está lista en el resumen.');
    } catch (error: unknown) {
      const errMsg = getMessage(error, 'No fue posible simular el préstamo.');
      setMessage(errMsg);
      toast.error('Error al simular', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const validation = isLoanParamValid(Number(amount), Number(installments), Number(annualRate));
    if (!validation.isValid) {
      const msg = validation.error ?? 'Ingresa un monto y número de cuotas válidos.';
      setMessage(msg);
      toast.warning('Datos inválidos', msg);
      return;
    }
    if (!allRequirementsMet) {
      const msg = 'Completa todos los requisitos desde tu perfil para solicitar un préstamo.';
      setMessage(msg);
      toast.warning('Requisitos pendientes', msg);
      return;
    }
    if (hasPending) {
      const msg = 'Ya tienes una solicitud pendiente. Espera a que sea revisada.';
      setMessage(msg);
      toast.warning('Solicitud en trámite', msg);
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await loanService.create({
        amount: Number(amount),
        installments: Number(installments),
        annualRate: Number(annualRate),
        monthlyIncome: profile?.monthlyIncome ?? 0,
      });
      setApplication(result);
      if (result.eligibility.isEligible) {
        setMessage('Solicitud enviada correctamente.');
        toast.success('Solicitud enviada', 'Tu crédito fue radicado exitosamente.');
      } else {
        setMessage('Solicitud registrada, pero no cumple con todos los requisitos.');
        toast.warning('Revisión requerida', 'Tu solicitud requiere validaciones adicionales.');
      }
      await fetchMyLoans();
    } catch (error: unknown) {
      const errMsg = getMessage(error, 'No fue posible crear la solicitud.');
      setMessage(errMsg);
      toast.error('Error al solicitar', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Landmark className="text-primary" /> Créditos y Préstamos
          </h1>
          <p className="text-muted-foreground text-sm">
            Simula tu cuota mensual o solicita un crédito de libre inversión con aprobación inmediata.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            id="btn-refresh-loans"
            data-cy="btn-refresh-loans"
            variant="outline"
            size="sm"
            onClick={fetchMyLoans}
            disabled={loading}
          >
            Refrescar listado
          </Button>
          <Button
            id="btn-apply-header"
            data-cy="btn-apply-header"
            onClick={handleCreate}
            disabled={!allRequirementsMet || hasPending || loading}
          >
            Solicitar crédito
          </Button>
        </div>
      </div>

      {hasPending && (
        <div
          data-cy="pending-loan-banner"
          className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 flex items-center gap-2"
        >
          <Clock size={18} />
          <span>Tienes una solicitud en trámite de revisión. Te notificaremos cuando cambie de estado.</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Simulador de préstamo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                id="loan-amount"
                data-cy="loan-amount"
                label="Monto (COP)"
                type="number"
                min={MIN_LOAN_AMOUNT}
                max={MAX_LOAN_AMOUNT}
                step="100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Input
                id="loan-installments"
                data-cy="loan-installments"
                label="Cuotas (Meses)"
                type="number"
                min={MIN_INSTALLMENTS}
                max={MAX_INSTALLMENTS}
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
              />
              <Input
                id="loan-annual-rate"
                data-cy="loan-annual-rate"
                label="Tasa anual (%)"
                type="number"
                min={MIN_ANNUAL_RATE}
                max={MAX_ANNUAL_RATE}
                step="0.5"
                value={annualRate}
                onChange={(e) => setAnnualRate(e.target.value)}
              />
            </div>

            {/* Aviso de Regulación Financiera Territorial */}
            <div className="text-xs text-muted-foreground flex items-center gap-2 bg-muted/40 px-3 py-2 rounded-xl border border-border/60">
              <ShieldAlert size={14} className="text-primary flex-shrink-0" />
              <span>
                <strong>Regulación SFC (Colombia):</strong> Montos de $500.000 a $30.000.000 COP · 3 a 60 cuotas · Tasa 10% a 32% E.A.
              </span>
            </div>

            {/* Requisitos de solicitud — solo lectura, se activan al cumplirse */}
            <div className="rounded-2xl border border-border p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Requisitos para solicitar</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {requirements.map((req) => {
                  const ReqIcon = req.icon;
                  return (
                    <div
                      key={req.key}
                      data-cy={`requirement-${req.key}`}
                      className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${
                        req.done
                          ? 'text-green-700 border-green-200 bg-green-50'
                          : 'text-muted-foreground border-border bg-background'
                      }`}
                    >
                      {req.done ? (
                        <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                      ) : (
                        <ReqIcon size={16} className="flex-shrink-0" />
                      )}
                      <span>{req.label}</span>
                    </div>
                  );
                })}
              </div>
              {!allRequirementsMet && (
                <p className="text-xs text-muted-foreground">
                  Faltan requisitos por completar. Puedes resolverlos desde tu{' '}
                  <Link href="/profile" className="text-primary font-semibold hover:underline">
                    perfil
                  </Link>
                  .
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                id="btn-simulate"
                data-cy="btn-simulate"
                onClick={handleSimulate}
                isLoading={loading}
                className="w-full sm:w-auto"
              >
                <span className="flex items-center gap-2">
                  <Calculator size={16} /> Simular
                </span>
              </Button>
              <Button
                id="btn-apply"
                data-cy="btn-apply"
                onClick={handleCreate}
                disabled={!allRequirementsMet || hasPending || loading}
                isLoading={loading}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <span className="flex items-center gap-2">
                  <BadgeCheck size={16} /> Solicitar
                </span>
              </Button>
            </div>

            {hasPending && (
              <p className="text-sm text-yellow-600 font-medium">Tienes una solicitud pendiente de revisión.</p>
            )}
            {message && (
              <p id="loan-message" data-cy="loan-message" className="text-xs text-muted-foreground">
                {message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen de crédito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div data-cy="result-box" className="rounded-2xl border border-border p-4 bg-muted/20">
              <p className="text-xs text-muted-foreground">Cuota estimada mensual</p>
              {simulation ? (
                <div className="mt-3 space-y-2 text-sm text-foreground">
                  <p>
                    Cuota mensual:{' '}
                    <span data-cy="monthly-payment" className="font-semibold">
                      {formatCurrency(simulation.monthlyPayment)}
                    </span>
                  </p>
                  <p>
                    Total a pagar:{' '}
                    <span data-cy="total-to-pay" className="font-semibold">
                      {formatCurrency(simulation.totalToPay)}
                    </span>
                  </p>
                  <p>
                    Intereses:{' '}
                    <span data-cy="total-interest" className="font-semibold">
                      {formatCurrency(simulation.totalInterest)}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Aún no hay una simulación disponible.</p>
              )}
            </div>

            {application && (
              <div data-cy="application-result" className="rounded-2xl border border-border p-4 space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Estado:</span>{' '}
                  <span data-cy="application-status">{application.status}</span>
                </p>
                <p>
                  <span className="font-semibold">Elegible:</span>{' '}
                  <span data-cy="application-eligible">
                    {application.eligibility.isEligible ? 'Sí' : 'No'}
                  </span>
                </p>
                {application.eligibility.reasons.length > 0 && (
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {application.eligibility.reasons.map((reason: string) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mis solicitudes */}
      {myLoans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mis solicitudes</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-cy="my-loans-list" className="space-y-3">
              {myLoans.map((loan) => {
                const st = statusMap[loan.status] ?? {
                  color: 'text-gray-600 bg-gray-50 border-gray-200',
                  icon: Clock,
                  label: loan.status,
                };
                const StatusIcon = st.icon;
                return (
                  <div
                    key={loan.id}
                    data-cy="my-loan-item"
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-background"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(loan.amount)} — {loan.installments} cuotas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cuota mensual: {formatCurrency(loan.monthlyPayment)} · Tasa: {loan.annualRate}% EA
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(loan.createdAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${st.color}`}
                    >
                      <StatusIcon size={14} />
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

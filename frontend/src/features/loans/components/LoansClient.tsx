"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Landmark, Calculator, BadgeCheck, Clock, CheckCircle, XCircle, CheckCircle2, FileText, CalendarCheck, Wallet, History } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { loanService } from '@/features/loans/services/loan.service';
import { profileService } from '@/features/profile/services/profile.service';
import { formatCurrency } from '@/shared/utils/format';
import { PublicUser } from '@/features/auth/types/auth.types';

interface MyLoan {
  id: string;
  amount: number;
  installments: number;
  annualRate: number;
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
  status: string;
  createdAt: string;
}

const statusMap: Record<string, { color: string; icon: any; label: string }> = {
  PENDING: { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: Clock, label: 'Pendiente' },
  APPROVED: { color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle, label: 'Aprobado' },
  REJECTED: { color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle, label: 'Rechazado' },
};

function isOfLegalAge(birthDate: string): boolean {
  if (!birthDate) return false;
  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 18;
}

export function LoansClient() {
  const [amount, setAmount] = useState('5000');
  const [installments, setInstallments] = useState('12');
  const [annualRate, setAnnualRate] = useState('18');
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [myLoans, setMyLoans] = useState<MyLoan[]>([]);

  const baseEligible = useMemo(() => Number(amount) > 0 && Number(installments) > 0, [amount, installments]);

  const requirements = useMemo(() => {
    const documentVerified = profile?.documentVerified ?? false;
    const ageVerified = profile ? isOfLegalAge(profile.birthDate) : false;
    const incomeVerified = (profile?.monthlyIncome ?? 0) > 0;
    const creditHistoryVerified = true; // Sin validación rigurosa por ahora
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
    }
  }, []);

  useEffect(() => {
    void fetchMyLoans();
    profileService
      .getProfile()
      .then(setProfile)
      .catch(() => {
      });
  }, [fetchMyLoans]);

  const hasPending = useMemo(() => myLoans.some(l => l.status === 'PENDING'), [myLoans]);

  const handleSimulate = async () => {
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
    } catch (error: any) {
      setMessage(error?.message || 'No fue posible simular el préstamo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!baseEligible) {
      setMessage('Ingresa un monto y número de cuotas válidos.');
      return;
    }
    if (!allRequirementsMet) {
      setMessage('Completa todos los requisitos desde tu perfil para solicitar un préstamo.');
      return;
    }
    if (hasPending) {
      setMessage('Ya tienes una solicitud pendiente. Espera a que sea revisada.');
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
      setMessage(result.eligibility.isEligible ? 'Solicitud enviada correctamente.' : 'Solicitud registrada, pero no cumple con todos los requisitos.');
      void fetchMyLoans();
    } catch (error: any) {
      setMessage(error?.message || 'No fue posible crear la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Créditos y Préstamos</h1>
        <p className="text-muted-foreground text-sm mt-1">Simula tu cuota mensual y solicita un crédito.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Simulador de préstamo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Monto" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Input label="Cuotas" type="number" value={installments} onChange={(e) => setInstallments(e.target.value)} />
              <Input label="Tasa anual (%)" type="number" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} />
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
              <Button onClick={handleSimulate} isLoading={loading} className="w-full sm:w-auto">
                <span className="flex items-center gap-2"><Calculator size={16} /> Simular</span>
              </Button>
              <Button variant="outline" onClick={handleCreate} isLoading={loading} disabled={!allRequirementsMet || hasPending} className="w-full sm:w-auto">
                <span className="flex items-center gap-2"><BadgeCheck size={16} /> Solicitar</span>
              </Button>
            </div>

            {hasPending && (
              <p className="text-sm text-yellow-600 font-medium">Tienes una solicitud pendiente de revisión.</p>
            )}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-primary">
                <Landmark size={18} />
                <span className="font-semibold">Resultado del préstamo</span>
              </div>
              {simulation ? (
                <div className="mt-3 space-y-2 text-sm text-foreground">
                  <p>Cuota mensual: <span className="font-semibold">{formatCurrency(simulation.monthlyPayment)}</span></p>
                  <p>Total a pagar: <span className="font-semibold">{formatCurrency(simulation.totalToPay)}</span></p>
                  <p>Intereses: <span className="font-semibold">{formatCurrency(simulation.totalInterest)}</span></p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Aún no hay una simulación disponible.</p>
              )}
            </div>

            {application && (
              <div className="rounded-2xl border border-border p-4 space-y-2 text-sm">
                <p><span className="font-semibold">Estado:</span> {application.status}</p>
                <p><span className="font-semibold">Elegible:</span> {application.eligibility.isEligible ? 'Sí' : 'No'}</p>
                {application.eligibility.reasons.length > 0 && (
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {application.eligibility.reasons.map((reason: string) => <li key={reason}>{reason}</li>)}
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
            <div className="space-y-3">
              {myLoans.map((loan) => {
                const st = statusMap[loan.status] ?? { color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Clock, label: loan.status };
                const StatusIcon = st.icon;
                return (
                  <div key={loan.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{formatCurrency(loan.amount)} — {loan.installments} cuotas</p>
                      <p className="text-xs text-muted-foreground">
                        Cuota mensual: {formatCurrency(loan.monthlyPayment)} · Tasa: {loan.annualRate}% EA
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(loan.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${st.color}`}>
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

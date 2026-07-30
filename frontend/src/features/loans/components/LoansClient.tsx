"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState } from 'react';
import { Landmark, Calculator, BadgeCheck } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { loanService } from '@/features/loans/services/loan.service';

export function LoansClient() {
  const [amount, setAmount] = useState('5000');
  const [installments, setInstallments] = useState('12');
  const [annualRate, setAnnualRate] = useState('18');
  const [monthlyIncome, setMonthlyIncome] = useState('2500');
  const [documentVerified, setDocumentVerified] = useState(true);
  const [ageVerified, setAgeVerified] = useState(true);
  const [incomeVerified, setIncomeVerified] = useState(true);
  const [creditHistoryVerified, setCreditHistoryVerified] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);

  const canSubmit = useMemo(() => Number(amount) > 0 && Number(installments) > 0, [amount, installments]);

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
    if (!canSubmit) {
      setMessage('Ingresa un monto y número de cuotas válidos.');
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const result = await loanService.create({
        amount: Number(amount),
        installments: Number(installments),
        annualRate: Number(annualRate),
        monthlyIncome: Number(monthlyIncome),
        documentVerified,
        ageVerified,
        incomeVerified,
        creditHistoryVerified,
      });
      setApplication(result);
      setMessage(result.eligibility.isEligible ? 'Solicitud enviada correctamente.' : 'Solicitud registrada, pero no cumple con todos los requisitos.');
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
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Monto" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Input label="Cuotas" type="number" value={installments} onChange={(e) => setInstallments(e.target.value)} />
              <Input label="Tasa anual (%)" type="number" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} />
              <Input label="Ingreso mensual" type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={documentVerified} onChange={() => setDocumentVerified((v) => !v)} />
                Documento verificado
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={ageVerified} onChange={() => setAgeVerified((v) => !v)} />
                Edad verificada
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={incomeVerified} onChange={() => setIncomeVerified((v) => !v)} />
                Ingreso validado
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={creditHistoryVerified} onChange={() => setCreditHistoryVerified((v) => !v)} />
                Historial crediticio validado
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleSimulate} isLoading={loading} className="w-full sm:w-auto">
                <span className="flex items-center gap-2"><Calculator size={16} /> Simular</span>
              </Button>
              <Button variant="outline" onClick={handleCreate} isLoading={loading} className="w-full sm:w-auto">
                <span className="flex items-center gap-2"><BadgeCheck size={16} /> Solicitar</span>
              </Button>
            </div>

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
                  <p>Cuota mensual: <span className="font-semibold">$ {simulation.monthlyPayment.toLocaleString()}</span></p>
                  <p>Total a pagar: <span className="font-semibold">$ {simulation.totalToPay.toLocaleString()}</span></p>
                  <p>Intereses: <span className="font-semibold">$ {simulation.totalInterest.toLocaleString()}</span></p>
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
    </div>
  );
}

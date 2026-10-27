export interface LoanCalculationInput {
  amount: number;
  installments: number;
  annualRate: number;
}

export interface LoanCalculationResult {
  installments: number;
  monthlyRate: number;
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
}

export class LoanCalculator {
  /**
   * Calcula la amortización de cuota fija mensual (sistema francés).
   *
   * @param input Parámetros del crédito (monto, número de cuotas, tasa anual en %)
   * @returns Resultados del cálculo financiero
   */
  static calculate(input: LoanCalculationInput): LoanCalculationResult {
    const installments = Math.max(input.installments, 1);
    const monthlyRate = input.annualRate / 100 / 12;

    let monthlyPayment = input.amount / installments;

    if (monthlyRate > 0) {
      monthlyPayment =
        (input.amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));
    }

    const totalToPay = monthlyPayment * installments;
    const totalInterest = totalToPay - input.amount;

    return {
      installments,
      monthlyRate,
      monthlyPayment,
      totalToPay,
      totalInterest,
    };
  }
}

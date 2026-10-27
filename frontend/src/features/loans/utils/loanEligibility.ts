/**
 * Lógica pura de validación territorial y elegibilidad para créditos — FuBanking (Colombia / SFC).
 */

export const MIN_LOAN_AMOUNT = 500_000;
export const MAX_LOAN_AMOUNT = 30_000_000;
export const MIN_INSTALLMENTS = 3;
export const MAX_INSTALLMENTS = 60;
export const MIN_ANNUAL_RATE = 10;
export const MAX_ANNUAL_RATE = 32;

export const DEFAULT_LOAN_AMOUNT = '5000000';
export const DEFAULT_INSTALLMENTS = '12';
export const DEFAULT_ANNUAL_RATE = '18';

/**
 * Valida si el usuario es mayor de edad (18 años o más).
 */
export function isOfLegalAge(birthDate: string): boolean {
  if (!birthDate) return false;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 18;
}

/**
 * Valida si los parámetros del crédito están dentro de los rangos autorizados por la SFC.
 */
export function isLoanParamValid(
  amount: number,
  installments: number,
  annualRate: number,
): { isValid: boolean; error?: string } {
  if (isNaN(amount) || amount < MIN_LOAN_AMOUNT || amount > MAX_LOAN_AMOUNT) {
    return {
      isValid: false,
      error: `El monto debe estar entre $${MIN_LOAN_AMOUNT.toLocaleString('es-CO')} y $${MAX_LOAN_AMOUNT.toLocaleString('es-CO')} COP.`,
    };
  }

  if (isNaN(installments) || !Number.isInteger(installments) || installments < MIN_INSTALLMENTS || installments > MAX_INSTALLMENTS) {
    return {
      isValid: false,
      error: `El plazo debe estar entre ${MIN_INSTALLMENTS} y ${MAX_INSTALLMENTS} meses.`,
    };
  }

  if (isNaN(annualRate) || annualRate < MIN_ANNUAL_RATE || annualRate > MAX_ANNUAL_RATE) {
    return {
      isValid: false,
      error: `La tasa debe estar entre el ${MIN_ANNUAL_RATE}% y ${MAX_ANNUAL_RATE}% E.A.`,
    };
  }

  return { isValid: true };
}
